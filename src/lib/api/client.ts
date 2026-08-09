/**
 * Единственное место сетевых вызовов фронта (ARCHITECTURE_PRINCIPLES §2).
 *
 * Что делает: отправляет заявку и отзыв, возвращает исход по контракту.
 * Вход: данные формы. Выход: `ApiOutcome`. Кто использует: формы.
 * Компоненты вызывают эти функции и НЕ знают ни про `fetch`, ни про адреса.
 *
 * МОК-РЕЖИМ. Worker появится в F4 вместе с секретами, а формы нужно доделать
 * сейчас. Пока базовый адрес не задан, клиент работает на моках и умеет
 * выдать любой исход — это позволяет проверить все состояния формы,
 * включая 429 и 500, которые в жизни воспроизвести трудно.
 */
import {
  ENDPOINTS,
  type ApiOutcome,
  type LeadRequest,
  type ReviewRequest,
} from './contract';

/** Адрес Worker'а. Пока пусто — работает мок (F4 подставит реальный). */
const API_BASE = '';

/** Управление моком из консоли или из ссылки `?mock=rate-limited`. */
function mockOutcome(): ApiOutcome['status'] | null {
  if (typeof location === 'undefined') return null;
  const forced = new URLSearchParams(location.search).get('mock');
  const allowed = ['ok', 'rate-limited', 'server-error', 'offline', 'invalid'];
  return forced && allowed.includes(forced) ? (forced as ApiOutcome['status']) : null;
}

async function send(path: string, payload: unknown): Promise<ApiOutcome> {
  const forced = mockOutcome();

  if (!API_BASE) {
    // Мок: небольшая задержка, чтобы состояние «отправляем» было видно.
    await new Promise((resolve) => setTimeout(resolve, 600));
    return { status: (forced ?? 'ok') as 'ok' };
  }

  try {
    const response = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (response.ok) return { status: 'ok' };
    if (response.status === 429) return { status: 'rate-limited' };
    if (response.status === 400) return { status: 'invalid' };
    return { status: 'server-error' };
  } catch {
    // Сеть недоступна. Пользователю нужен выход, а не сообщение об ошибке.
    return { status: 'offline' };
  }
}

export const submitLead = (payload: LeadRequest) => send(ENDPOINTS.lead, payload);
export const submitReview = (payload: ReviewRequest) => send(ENDPOINTS.review, payload);
