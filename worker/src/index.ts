/**
 * Worker: приём заявок и отзывов, отправка мастеру в Telegram.
 *
 * Что делает: принимает `POST /api/v1/lead` и `POST /api/v1/review`, проверяет
 * данные и защиту от ботов, ограничивает частоту по IP и передаёт сообщение
 * в Telegram. Выход: `{ ok: true }` либо код ошибки по контракту.
 *
 * Контракт зафиксирован ДО написания этого файла (`src/lib/api/contract.ts`)
 * и версионирован: пути только `/api/v1/*`, изменение задним числом запрещено
 * (ARCHITECTURE_PRINCIPLES §2).
 *
 * Три правила, за которыми стоят конкретные потери, а не вкус:
 *  1. Telegram — без `parse_mode` (см. `telegram.ts`): иначе имя со звёздочкой
 *     роняет отправку и лид пропадает молча.
 *  2. Ответ клиенту уходит СРАЗУ, отправка в Telegram — через `waitUntil`:
 *     человек не должен ждать чужой API, чтобы увидеть «спасибо».
 *  3. CORS открыт только нашему домену: иначе форму можно дёргать откуда угодно.
 *
 * Секретов в коде нет и не будет: токен и chat_id приходят из окружения
 * (`wrangler secret put`), см. `worker/README.md`.
 */
import {
  ENDPOINTS,
  MIN_ELAPSED_MS,
  PHONE_PATTERN,
  RATE_LIMIT_PER_HOUR,
  normalizePhone,
  type LeadRequest,
  type Parsed,
  type ReviewRequest,
} from './contract.ts';
import { formatLead, formatReview, sendMessage } from './telegram.ts';

export interface Env {
  TELEGRAM_TOKEN: string;
  TELEGRAM_CHAT_ID: string;
  RATE_LIMIT_KV: KVNamespace;
  /** Список источников через запятую. Пусто — CORS закрыт полностью. */
  ALLOWED_ORIGINS: string;
}

const JSON_HEADERS = { 'content-type': 'application/json; charset=utf-8' };

function corsHeaders(origin: string | null, env: Env): Record<string, string> {
  const allowed = (env.ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  // Незнакомый источник не получает разрешения вовсе — браузер сам его отсечёт.
  if (!origin || !allowed.includes(origin)) return {};

  return {
    'access-control-allow-origin': origin,
    'access-control-allow-methods': 'POST, OPTIONS',
    'access-control-allow-headers': 'content-type',
    'access-control-max-age': '86400',
    vary: 'Origin',
  };
}

const reply = (status: number, body: unknown, cors: Record<string, string>) =>
  new Response(JSON.stringify(body), { status, headers: { ...JSON_HEADERS, ...cors } });

/**
 * Ограничение частоты: 5 обращений с одного адреса в час (бриф §2).
 * Ключ живёт ровно час, поэтому «час» здесь — скользящее окно от первой
 * попытки, а не календарное. Для защиты от наплыва этого достаточно,
 * а точный алгоритм стоил бы лишней сложности на ровном месте.
 */
async function rateLimited(env: Env, ip: string): Promise<boolean> {
  const key = `rl:${ip}`;
  const current = Number((await env.RATE_LIMIT_KV.get(key)) ?? '0');

  if (current >= RATE_LIMIT_PER_HOUR) return true;

  await env.RATE_LIMIT_KV.put(key, String(current + 1), { expirationTtl: 3600 });
  return false;
}

/** Общие для обеих форм проверки: ловушка и время заполнения. */
function botLike(body: { honeypot?: string; elapsedMs?: number }): boolean {
  if (body.honeypot) return true;
  return typeof body.elapsedMs === 'number' && body.elapsedMs < MIN_ELAPSED_MS;
}

function parseLead(raw: unknown): Parsed<LeadRequest> {
  const body = raw as Partial<LeadRequest>;

  const name = String(body.name ?? '').trim();
  if (name.length < 2) return { ok: false, field: 'name', reason: 'имя не заполнено' };

  const phone = normalizePhone(String(body.phone ?? ''));
  if (!PHONE_PATTERN.test(phone)) {
    return { ok: false, field: 'phone', reason: 'телефон не похож на местный мобильный' };
  }

  return {
    ok: true,
    value: {
      name,
      phone,
      city: String(body.city ?? '').trim() || undefined,
      comment: String(body.comment ?? '').trim() || undefined,
      meta: {
        page: String(body.meta?.page ?? '').slice(0, 200),
        locale: String(body.meta?.locale ?? '').slice(0, 8),
        device: body.meta?.device === 'mobile' ? 'mobile' : 'desktop',
      },
      elapsedMs: Number(body.elapsedMs ?? 0),
    },
  };
}

function parseReview(raw: unknown): Parsed<ReviewRequest> {
  const body = raw as Partial<ReviewRequest>;

  const name = String(body.name ?? '').trim();
  if (name.length < 2) return { ok: false, field: 'name', reason: 'имя не заполнено' };

  const text = String(body.text ?? '').trim();
  if (text.length < 10) return { ok: false, field: 'text', reason: 'отзыв слишком короткий' };

  // Без согласия отзыв не принимается вовсе — бриф §5.
  if (body.consent !== true) {
    return { ok: false, field: 'consent', reason: 'нет согласия на публикацию' };
  }

  return {
    ok: true,
    value: {
      name,
      text: text.slice(0, 2000),
      workSlug: String(body.workSlug ?? '').trim() || undefined,
      consent: true,
      meta: {
        page: String(body.meta?.page ?? '').slice(0, 200),
        locale: String(body.meta?.locale ?? '').slice(0, 8),
        device: body.meta?.device === 'mobile' ? 'mobile' : 'desktop',
      },
      elapsedMs: Number(body.elapsedMs ?? 0),
    },
  };
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const origin = request.headers.get('origin');
    const cors = corsHeaders(origin, env);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }

    if (request.method !== 'POST') {
      return reply(405, { error: 'method-not-allowed' }, cors);
    }

    const isLead = url.pathname === ENDPOINTS.lead;
    const isReview = url.pathname === ENDPOINTS.review;
    if (!isLead && !isReview) return reply(404, { error: 'not-found' }, cors);

    let raw: unknown;
    try {
      raw = await request.json();
    } catch {
      return reply(400, { error: 'invalid-json' }, cors);
    }

    /**
     * Бот распознан — отвечаем как при успехе и ничего не отправляем.
     * Сообщать боту, что он распознан, значит помогать его отладить.
     */
    if (botLike(raw as { honeypot?: string; elapsedMs?: number })) {
      return reply(200, { ok: true }, cors);
    }

    const ip = request.headers.get('cf-connecting-ip') ?? 'unknown';
    if (await rateLimited(env, ip)) {
      return reply(429, { error: 'rate-limited' }, cors);
    }

    const parsed = isLead ? parseLead(raw) : parseReview(raw);
    if (!parsed.ok) {
      return reply(400, { error: 'invalid', field: parsed.field, reason: parsed.reason }, cors);
    }

    const text = isLead
      ? formatLead(parsed.value as LeadRequest)
      : formatReview(parsed.value as ReviewRequest);

    // Ответ уходит немедленно; отправка живёт своей жизнью (бриф §2).
    ctx.waitUntil(
      sendMessage({ token: env.TELEGRAM_TOKEN, chatId: env.TELEGRAM_CHAT_ID }, text),
    );

    return reply(200, { ok: true }, cors);
  },
};
