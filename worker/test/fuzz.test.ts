/**
 * Фаззинг: враждебные строки сквозь Worker до текста сообщения.
 *
 * Что доказывает: что бы человек ни ввёл в форму, сообщение мастеру остаётся
 * тем, чем задумано, — обычным текстом с предсказуемой структурой.
 *
 * ПОЧЕМУ ЭТО ВАЖНО ИМЕННО ЗДЕСЬ. Сообщение уходит без `parse_mode` (бриф §2),
 * то есть Telegram не интерпретирует разметку — это уже снимает класс атак
 * со звёздочками, подчёркиваниями и ссылками в скобках. Но остаётся другое:
 * структуру сообщения задают переносы строк и эмодзи-метки. Если
 * пользовательский текст сможет добавить строку вида «телефон: …», мастер
 * увидит второй номер, которого никто не вводил, и позвонит по нему.
 * Именно это здесь и проверяется.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { formatLead, formatReview } from '../src/telegram.ts';

const ESC = String.fromCharCode(27);
const RTL_OVERRIDE = '‮';
const RTL_POP = '‬';

/** Строки, которыми обычно ломают текстовые протоколы. */
const HOSTILE = [
  { label: 'подделка строки телефона', value: 'Иван\n\u{1F4DE} 0500000000' },
  { label: 'подделка блока метаданных', value: 'Иван\n— — —\n\u{1F517} https://evil.example' },
  { label: 'разметка Telegram', value: '*жирный* _курсив_ [ссылка](https://evil.example)' },
  { label: 'HTML и скрипт', value: '<b>bold</b><script>alert(1)</script>' },
  { label: 'управляющие символы', value: `Иван\r\n${ESC}[31m` },
  { label: 'переопределение направления', value: `Иван${RTL_OVERRIDE}евил${RTL_POP}` },
  { label: 'эмодзи и составные графемы', value: '\u{1F468}‍\u{1F469}‍\u{1F467} Иван' },
  { label: 'очень длинная строка', value: 'а'.repeat(5000) },
  { label: 'только пробелы и переносы', value: '   \n\n\t  ' },
  { label: 'кавычки и слэши', value: `"'\`/\\` },
];

/**
 * Структурные признаки сообщения. Их количество не должно зависеть от того,
 * что ввёл человек: иначе структуру можно подделать содержимым.
 */
function structure(text: string) {
  return {
    headers: (text.match(/^\u{1F514} /gmu) ?? []).length,
    phoneLines: (text.match(/^\u{1F4DE} /gmu) ?? []).length,
    separators: (text.match(/^— — —$/gm) ?? []).length,
    linkLines: (text.match(/^\u{1F517} /gmu) ?? []).length,
  };
}

const baseMeta = { page: '/ru/', locale: 'ru', device: 'mobile' as const };

describe('фаззинг заявки: структура сообщения не подделывается', () => {
  for (const item of HOSTILE) {
    test(item.label, () => {
      const text = formatLead({
        name: item.value,
        phone: '0549731889',
        city: item.value,
        comment: item.value,
        meta: baseMeta,
        elapsedMs: 5000,
      });

      const s = structure(text);
      assert.equal(s.headers, 1, 'заголовок ровно один');
      assert.equal(s.phoneLines, 1, 'строка телефона ровно одна');
      assert.equal(s.separators, 1, 'разделитель ровно один');
      assert.equal(s.linkLines, 1, 'строка адреса ровно одна');

      // Настоящий телефон остался тем, что был передан.
      assert.match(text, /^\u{1F4DE} 0549731889$/mu);
    });
  }
});

describe('фаззинг отзыва', () => {
  for (const item of HOSTILE) {
    test(item.label, () => {
      const text = formatReview({
        name: item.value,
        text: item.value,
        consent: true,
        meta: baseMeta,
        elapsedMs: 9000,
      });

      assert.equal((text.match(/^— — —$/gm) ?? []).length, 1, 'разделитель ровно один');
      assert.equal((text.match(/^\u{2B50}\u{FE0F} /gmu) ?? []).length, 1, 'заголовок ровно один');
      // Пометка «не опубликован» обязана остаться: без неё отзыв опубликуют.
      assert.match(text, /Отзыв не опубликован/);
    });
  }
});

describe('фаззинг: форматирование не падает на пустом', () => {
  test('пустые поля дают валидный текст', () => {
    const text = formatLead({
      name: '',
      phone: '',
      meta: { page: '', locale: '', device: 'desktop' },
      elapsedMs: 0,
    });
    assert.equal(typeof text, 'string');
    assert.ok(text.length > 0);
  });
});
