/**
 * Копия контракта `/api/v1` на стороне Worker'а.
 *
 * Почему копия, а не импорт из `src/lib/api/contract.ts`: Worker — отдельный
 * сервис со своим циклом жизни (ARCHITECTURE_PRINCIPLES §2). Общий модуль
 * связал бы деплой сайта и деплой Worker'а в одно целое, а контракт как раз
 * и нужен, чтобы они развивались независимо.
 *
 * Дублирование здесь осознанное и ограниченное: только формы данных и правила
 * валидации, без логики. Расхождение ловится тестами контракта
 * (`worker/test/contract.test.mjs`), которые читают ОБА файла и сверяют
 * ключевые правила — иначе «независимость» превратилась бы в тихий разъезд.
 */

export const API_VERSION = 'v1';

export const ENDPOINTS = {
  lead: `/api/${API_VERSION}/lead`,
  review: `/api/${API_VERSION}/review`,
} as const;

/** Минимальная пауза между показом формы и отправкой (бриф §2). */
export const MIN_ELAPSED_MS = 2500;

/** Израильский мобильный после нормализации. */
export const PHONE_PATTERN = /^05\d{8}$/;

/** Лимит обращений на IP в час (бриф §2). */
export const RATE_LIMIT_PER_HOUR = 5;

/** Приводит телефон к местному виду: международный префикс заменяется нулём. */
export function normalizePhone(input: string): string {
  const digits = input.replace(/[^\d+]/g, '');
  if (digits.startsWith('+972')) return `0${digits.slice(4)}`;
  if (digits.startsWith('972')) return `0${digits.slice(3)}`;
  return digits;
}

export interface LeadRequest {
  name: string;
  phone: string;
  city?: string;
  comment?: string;
  meta: { page: string; locale: string; device: 'mobile' | 'desktop' };
  honeypot?: string;
  elapsedMs: number;
}

export interface ReviewRequest {
  name: string;
  text: string;
  workSlug?: string;
  consent: true;
  meta: LeadRequest['meta'];
  honeypot?: string;
  elapsedMs: number;
}

/** Результат разбора: либо данные, либо человеческая причина отказа. */
export type Parsed<T> = { ok: true; value: T } | { ok: false; field: string; reason: string };
