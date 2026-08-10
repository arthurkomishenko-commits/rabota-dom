/**
 * Отправка в Telegram.
 *
 * Что делает: собирает человекочитаемое сообщение и отправляет его боту.
 * Вход: данные заявки или отзыва. Выход: успех или ошибка.
 * Кто использует: `worker/src/index.ts`.
 *
 * PARSE_MODE НЕ ИСПОЛЬЗУЕТСЯ. Это прямой запрет протокола §10 и решение
 * брифа §2, и причина у него практическая: с `parse_mode` любое имя вида
 * `Дан*ил` или адрес с подчёркиванием ломает разбор разметки, и Telegram
 * отвечает ошибкой. Лид при этом теряется молча — то есть цена «красивого
 * форматирования» это потерянный клиент. Структуру даёт эмодзи и переносы.
 *
 * Пользовательский текст ни во что не подставляется как разметка: он идёт
 * обычным текстом, и экранировать нечего.
 */
import type { LeadRequest, ReviewRequest } from './contract.ts';

export interface TelegramConfig {
  token: string;
  chatId: string;
}

const API = 'https://api.telegram.org';

/** Заявка. Порядок строк — от того, что нужно первым, к деталям. */
export function formatLead(lead: LeadRequest): string {
  const lines = [
    '🔔 Новая заявка',
    '',
    `👤 ${lead.name}`,
    `📞 ${lead.phone}`,
  ];

  if (lead.city) lines.push(`📍 ${lead.city}`);
  if (lead.comment) lines.push('', `💬 ${lead.comment}`);

  lines.push(
    '',
    '— — —',
    `🌐 ${lead.meta.locale} · ${lead.meta.device === 'mobile' ? 'телефон' : 'компьютер'}`,
    `🔗 ${lead.meta.page}`,
  );

  return lines.join('\n');
}

/** Отзыв. Отдельно помечено, что он ждёт одобрения — иначе его опубликуют. */
export function formatReview(review: ReviewRequest): string {
  const lines = [
    '⭐️ Новый отзыв — ожидает вашего одобрения',
    '',
    `👤 ${review.name}`,
    '',
    review.text,
  ];

  if (review.workSlug) lines.push('', `🏷 объект: ${review.workSlug}`);

  lines.push(
    '',
    '— — —',
    `🌐 ${review.meta.locale} · ${review.meta.device === 'mobile' ? 'телефон' : 'компьютер'}`,
    `🔗 ${review.meta.page}`,
    '',
    'Отзыв не опубликован. Опубликовать его может только Артур, после вашего слова.',
  );

  return lines.join('\n');
}

export async function sendMessage(config: TelegramConfig, text: string): Promise<boolean> {
  const response = await fetch(`${API}/bot${config.token}/sendMessage`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    // parse_mode отсутствует намеренно — см. шапку файла.
    body: JSON.stringify({
      chat_id: config.chatId,
      text,
      disable_web_page_preview: true,
    }),
  });

  return response.ok;
}
