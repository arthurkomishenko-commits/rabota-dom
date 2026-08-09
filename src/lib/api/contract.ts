/**
 * Контракт HTTP-API между сайтом и Worker'ом.
 *
 * Что делает: описывает формы запросов и ответов. Ничего не выполняет.
 * Кто использует: `src/lib/api/client.ts` и `worker/` (F4).
 *
 * ВЕРСИОНИРОВАНИЕ (ARCHITECTURE_PRINCIPLES §2): пути только `/api/v1/*`.
 * Изменение контракта задним числом запрещено — только новая версия.
 * Контракт зафиксирован ЗДЕСЬ и СЕЙЧАС, до написания Worker'а: так F4
 * реализует готовое соглашение, а не изобретает его вместе с кодом,
 * и фронт можно закончить, пока секретов ещё нет.
 */

export const API_VERSION = 'v1' as const;

export const ENDPOINTS = {
  lead: `/api/${API_VERSION}/lead`,
  review: `/api/${API_VERSION}/review`,
} as const;

/** Заявка. Обязательны имя и телефон; город — по желанию (бриф §2). */
export interface LeadRequest {
  name: string;
  /** Нормализованный местный формат: `05XXXXXXXX`. */
  phone: string;
  city?: string;
  comment?: string;
  /** Метаданные лида (бриф §2): откуда пришёл. */
  meta: {
    page: string;
    locale: string;
    device: 'mobile' | 'desktop';
  };
  /** Ловушка для ботов: у человека всегда пусто. */
  honeypot?: string;
  /** Миллисекунды с момента показа формы. Меньше порога — бот. */
  elapsedMs: number;
}

/** Отзыв. Фото приходят отдельно, сжатые на клиенте (бриф §2). */
export interface ReviewRequest {
  name: string;
  text: string;
  workSlug?: string;
  /** Согласие на публикацию. Без него отзыв не принимается. */
  consent: true;
  meta: LeadRequest['meta'];
  honeypot?: string;
  elapsedMs: number;
}

export type ApiOutcome =
  | { status: 'ok' }
  /** Слишком много попыток: KV rate-limit, 5 в час на IP (бриф §2). */
  | { status: 'rate-limited' }
  /** Ошибка на стороне сервера: пользователю сразу предлагается WhatsApp. */
  | { status: 'server-error' }
  /** Сеть недоступна: тот же выход — WhatsApp. */
  | { status: 'offline' }
  /** Данные не прошли проверку на сервере. */
  | { status: 'invalid'; field?: 'name' | 'phone' | 'text' };

/** Минимальная пауза между показом формы и отправкой (бриф §2: ≥2.5 с). */
export const MIN_ELAPSED_MS = 2500;

/** Израильский мобильный после нормализации. */
export const PHONE_PATTERN = /^05\d{8}$/;

/**
 * Приводит телефон к местному виду: международный префикс заменяется нулём.
 * Чистая функция: используется и на фронте, и в Worker'е.
 */
export function normalizePhone(input: string): string {
  const digits = input.replace(/[^\d+]/g, '');
  if (digits.startsWith('+972')) return `0${digits.slice(4)}`;
  if (digits.startsWith('972')) return `0${digits.slice(3)}`;
  return digits;
}
