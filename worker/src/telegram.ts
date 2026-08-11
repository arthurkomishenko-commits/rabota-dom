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

/**
 * СТРУКТУРУ СООБЩЕНИЯ ЗАДАЮТ ПЕРЕНОСЫ СТРОК — значит пользовательский текст
 * не имеет права их приносить. Иначе имя вида «Иван\n(телефон) 0500000000»
 * добавляет в сообщение вторую строку телефона, и мастер звонит по чужому
 * номеру, считая его номером клиента. То же с поддельным разделителем
 * и строкой адреса: получается фишинг внутри собственного уведомления.
 * Найдено фаззингом, BUG-0012.
 *
 * Отсутствие `parse_mode` от этого не защищает: там речь про разметку,
 * здесь — про строки.
 */

/** Однострочные поля: имя, город, телефон. Переносы схлопываются в пробел. */
function oneLine(value: string): string {
  return value.replace(/[\r\n\u2028\u2029]+/g, ' ').replace(/\s{2,}/g, ' ').trim();
}

/**
 * Многострочные поля: комментарий, текст отзыва. Переносы там осмысленны,
 * поэтому не удаляются — но каждая строка сдвигается на пробел. Строка,
 * начинающаяся с пробела, никогда не совпадёт со структурной, которая
 * начинается с метки в первой позиции.
 */
function block(value: string): string {
  return value
    .replace(/[\u2028\u2029]/g, '\n')
    .split(/\r?\n/)
    .map((line) => ` ${line.trim()}`)
    .join('\n')
    .trimEnd();
}

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
    `👤 ${oneLine(lead.name)}`,
    `📞 ${oneLine(lead.phone)}`,
  ];

  if (lead.city) lines.push(`📍 ${oneLine(lead.city)}`);
  if (lead.comment) lines.push('', '💬', block(lead.comment));

  lines.push(
    '',
    '— — —',
    `🌐 ${oneLine(lead.meta.locale)} · ${lead.meta.device === 'mobile' ? 'телефон' : 'компьютер'}`,
    `🔗 ${oneLine(lead.meta.page)}`,
  );

  return lines.join('\n');
}

/** Отзыв. Отдельно помечено, что он ждёт одобрения — иначе его опубликуют. */
export function formatReview(review: ReviewRequest): string {
  const lines = [
    '⭐️ Новый отзыв — ожидает вашего одобрения',
    '',
    `👤 ${oneLine(review.name)}`,
    '',
    block(review.text),
  ];

  if (review.workSlug) lines.push('', `🏷 объект: ${oneLine(review.workSlug)}`);

  lines.push(
    '',
    '— — —',
    `🌐 ${oneLine(review.meta.locale)} · ${review.meta.device === 'mobile' ? 'телефон' : 'компьютер'}`,
    `🔗 ${oneLine(review.meta.page)}`,
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
