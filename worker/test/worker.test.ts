/**
 * Тесты Worker'а на моках.
 *
 * Что делает: проверяет поведение до того, как появятся секреты и настоящий
 * Telegram. Всё внешнее подменяется: `fetch` перехватывается, KV — объект
 * в памяти. Тесты не ходят в сеть и не зависят от учётных данных.
 *
 * Запуск: npm run test:worker
 *
 * Проверяется то, что дороже всего сломать незаметно:
 *  · бот получает такой же ответ, как человек (иначе мы помогаем его отладить);
 *  · превышение лимита отдаёт 429, а не тихий успех;
 *  · телефон нормализуется и невалидный не проходит;
 *  · сообщение уходит БЕЗ `parse_mode`;
 *  · CORS отвечает только знакомому источнику;
 *  · отзыв без согласия не принимается.
 */
import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import worker, { type Env } from '../src/index.ts';
import { formatLead } from '../src/telegram.ts';

/** KV в памяти: тот же интерфейс, никакой сети. */
function memoryKV() {
  const store = new Map<string, string>();
  return {
    async get(key: string) {
      return store.get(key) ?? null;
    },
    async put(key: string, value: string) {
      store.set(key, value);
    },
    _store: store,
  };
}

/** Перехват `fetch`: запоминаем, что ушло в Telegram, и ничего не отправляем. */
function captureFetch() {
  const calls: { url: string; body: Record<string, unknown> }[] = [];
  globalThis.fetch = (async (url: string, init: RequestInit) => {
    calls.push({ url: String(url), body: JSON.parse(String(init.body)) });
    return new Response('{"ok":true}', { status: 200 });
  }) as typeof fetch;
  return calls;
}

/**
 * Контекст выполнения: `waitUntil` выполняем сразу, чтобы тест увидел эффект.
 * Подменяются только те методы, которые Worker реально вызывает; приведение
 * идёт через `unknown`, потому что настоящий тип шире и остальное нам не нужно.
 */
const ctx = {
  waitUntil: (promise: Promise<unknown>) => promise,
  passThroughOnException: () => {},
} as unknown as ExecutionContext;

const ORIGIN = 'https://example.com';

function makeEnv(): Env {
  return {
    TELEGRAM_TOKEN: 'test-token',
    TELEGRAM_CHAT_ID: '42',
    RATE_LIMIT_KV: memoryKV() as unknown as KVNamespace,
    ALLOWED_ORIGINS: ORIGIN,
  };
}

const post = (path: string, body: unknown, origin: string = ORIGIN) =>
  new Request(`https://worker.test${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin, 'cf-connecting-ip': '1.2.3.4' },
    body: JSON.stringify(body),
  });

const validLead = {
  name: 'Дан*ил',
  phone: '+972 54 973 1889',
  meta: { page: '/ru/', locale: 'ru', device: 'mobile' },
  elapsedMs: 5000,
};

describe('заявка', () => {
  let env: Env;
  let calls: ReturnType<typeof captureFetch>;

  beforeEach(() => {
    env = makeEnv();
    calls = captureFetch();
  });

  test('принимается и уходит в Telegram', async () => {
    const response = await worker.fetch(post('/api/v1/lead', validLead), env, ctx);
    assert.equal(response.status, 200);
    assert.equal(calls.length, 1);
    assert.match(calls[0]!.url, /sendMessage$/);
  });

  test('сообщение уходит БЕЗ parse_mode', async () => {
    await worker.fetch(post('/api/v1/lead', validLead), env, ctx);
    assert.equal('parse_mode' in calls[0]!.body, false);
  });

  test('имя со звёздочкой не ломает отправку', async () => {
    await worker.fetch(post('/api/v1/lead', validLead), env, ctx);
    assert.match(String(calls[0]!.body.text), /Дан\*ил/);
  });

  test('телефон нормализуется к местному виду', async () => {
    await worker.fetch(post('/api/v1/lead', validLead), env, ctx);
    assert.match(String(calls[0]!.body.text), /0549731889/);
  });

  test('невалидный телефон отклоняется', async () => {
    const response = await worker.fetch(
      post('/api/v1/lead', { ...validLead, phone: '12345' }),
      env,
      ctx,
    );
    assert.equal(response.status, 400);
    assert.equal(calls.length, 0);
  });

  test('пустое имя отклоняется', async () => {
    const response = await worker.fetch(post('/api/v1/lead', { ...validLead, name: '' }), env, ctx);
    assert.equal(response.status, 400);
  });
});

describe('защита от ботов', () => {
  let env: Env;
  let calls: ReturnType<typeof captureFetch>;

  beforeEach(() => {
    env = makeEnv();
    calls = captureFetch();
  });

  test('заполненная ловушка: ответ как при успехе, но ничего не отправлено', async () => {
    const response = await worker.fetch(
      post('/api/v1/lead', { ...validLead, honeypot: 'ООО Ромашка' }),
      env,
      ctx,
    );
    assert.equal(response.status, 200);
    assert.equal(calls.length, 0);
  });

  test('слишком быстрая отправка не доходит', async () => {
    const response = await worker.fetch(
      post('/api/v1/lead', { ...validLead, elapsedMs: 200 }),
      env,
      ctx,
    );
    assert.equal(response.status, 200);
    assert.equal(calls.length, 0);
  });
});

describe('ограничение частоты', () => {
  test('шестая попытка за час отдаёт 429', async () => {
    const env = makeEnv();
    captureFetch();

    for (let i = 0; i < 5; i += 1) {
      const ok = await worker.fetch(post('/api/v1/lead', validLead), env, ctx);
      assert.equal(ok.status, 200, `попытка ${i + 1} должна проходить`);
    }

    const blocked = await worker.fetch(post('/api/v1/lead', validLead), env, ctx);
    assert.equal(blocked.status, 429);
  });
});

describe('CORS', () => {
  test('знакомый источник получает разрешение', async () => {
    const env = makeEnv();
    captureFetch();
    const response = await worker.fetch(post('/api/v1/lead', validLead), env, ctx);
    assert.equal(response.headers.get('access-control-allow-origin'), ORIGIN);
  });

  test('чужой источник разрешения не получает', async () => {
    const env = makeEnv();
    captureFetch();
    const response = await worker.fetch(
      post('/api/v1/lead', validLead, 'https://evil.example'),
      env,
      ctx,
    );
    assert.equal(response.headers.get('access-control-allow-origin'), null);
  });
});

describe('отзыв', () => {
  const validReview = {
    name: 'Мария',
    text: 'Поставили перголу за пять дней, двор убрали за собой.',
    consent: true,
    meta: { page: '/ru/', locale: 'ru', device: 'desktop' },
    elapsedMs: 9000,
  };

  test('без согласия не принимается', async () => {
    const env = makeEnv();
    const calls = captureFetch();
    const response = await worker.fetch(
      post('/api/v1/review', { ...validReview, consent: false }),
      env,
      ctx,
    );
    assert.equal(response.status, 400);
    assert.equal(calls.length, 0);
  });

  test('с согласием уходит и помечен как ожидающий одобрения', async () => {
    const env = makeEnv();
    const calls = captureFetch();
    const response = await worker.fetch(post('/api/v1/review', validReview), env, ctx);
    assert.equal(response.status, 200);
    assert.match(String(calls[0]!.body.text), /ожидает вашего одобрения/);
  });
});

describe('маршруты', () => {
  test('неизвестный путь — 404', async () => {
    const env = makeEnv();
    captureFetch();
    const response = await worker.fetch(post('/api/v1/nope', validLead), env, ctx);
    assert.equal(response.status, 404);
  });

  test('GET не принимается', async () => {
    const env = makeEnv();
    captureFetch();
    const request = new Request('https://worker.test/api/v1/lead', { method: 'GET' });
    const response = await worker.fetch(request, env, ctx);
    assert.equal(response.status, 405);
  });
});

describe('формат сообщения', () => {
  test('метаданные лида на месте: страница, язык, устройство', () => {
    const text = formatLead({
      name: 'Ирина',
      phone: '0549731889',
      meta: { page: '/ru/portfolio/', locale: 'ru', device: 'mobile' },
      elapsedMs: 5000,
    });
    assert.match(text, /\/ru\/portfolio\//);
    assert.match(text, /ru/);
    assert.match(text, /телефон/);
  });
});
