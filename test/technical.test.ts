/**
 * Формы слов при числах — BUG-0014.
 *
 * Что доказывает: подпись единицы выбирается по правилам языка, а не берётся
 * одной строкой на все случаи. Проверка именно на тех числах, где языки
 * расходятся: 1, 2, 4, 5 и дробное.
 *
 * ПОЧЕМУ ТЕСТ, А НЕ ВЗГЛЯД НА СТРАНИЦУ. Ошибка «4 дней» дожила до опубликованного
 * сайта и была замечена глазами на скриншоте. Глаза видят ту локаль и то число,
 * которые случайно оказались в демо-паспорте; таблица ниже перебирает все три
 * языка и пять категорий разом.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { formatTechnical, type UnitLabels } from '../src/lib/technical.ts';

const RU: UnitLabels = {
  m: 'м',
  m2: 'м²',
  lm: 'пог. м',
  mm: 'мм',
  pcs: 'шт',
  days: { one: 'день', few: 'дня', many: 'дней', other: 'дня' },
};

const EN: UnitLabels = {
  m: 'm',
  m2: 'm²',
  lm: 'lm',
  mm: 'mm',
  pcs: { one: 'pc', other: 'pcs' },
  days: { one: 'day', other: 'days' },
};

const HE: UnitLabels = {
  m: 'מ׳',
  m2: 'מ״ר',
  lm: 'מ׳',
  mm: 'מ״מ',
  pcs: 'יח׳',
  days: { one: 'יום', two: 'יומיים', many: 'ימים', other: 'ימים' },
};

const days = (value: number) => ({ kind: 'quantity', value, unit: 'days' }) as const;

describe('русский: три формы, а не одна', () => {
  const cases: Array<[number, string]> = [
    [1, '1 день'],
    [2, '2 дня'],
    [4, '4 дня'],
    [5, '5 дней'],
    [11, '11 дней'],
    [21, '21 день'],
    [1.5, '1.5 дня'],
  ];
  for (const [value, expected] of cases) {
    test(expected, () => {
      assert.equal(formatTechnical(days(value), RU, 'ru'), expected);
    });
  }
});

describe('английский: единственное число не «1 days»', () => {
  test('1 day', () => assert.equal(formatTechnical(days(1), EN, 'en'), '1 day'));
  test('4 days', () => assert.equal(formatTechnical(days(4), EN, 'en'), '4 days'));
  test('1 pc', () => {
    assert.equal(formatTechnical({ kind: 'quantity', value: 1, unit: 'pcs' }, EN, 'en'), '1 pc');
  });
  test('2 pcs', () => {
    assert.equal(formatTechnical({ kind: 'quantity', value: 2, unit: 'pcs' }, EN, 'en'), '2 pcs');
  });
});

describe('иврит: есть двойственное число', () => {
  test('יום אחד', () => assert.equal(formatTechnical(days(1), HE, 'he'), '1 יום'));
  test('יומיים', () => assert.equal(formatTechnical(days(2), HE, 'he'), '2 יומיים'));
  test('ימים', () => assert.equal(formatTechnical(days(5), HE, 'he'), '5 ימים'));
});

describe('неизменяемые единицы остаются как есть', () => {
  for (const value of [1, 2, 5]) {
    test(`${value} м²`, () => {
      assert.equal(formatTechnical({ kind: 'quantity', value, unit: 'm2' }, RU, 'ru'), `${value} м²`);
    });
  }
});

describe('диапазон и габарит выбирают форму по нужному числу', () => {
  test('диапазон — по последнему: 1–3 дня', () => {
    assert.equal(
      formatTechnical({ kind: 'range', from: 1, to: 3, unit: 'days' }, RU, 'ru'),
      '1–3 дня',
    );
  });
  test('диапазон — по последнему: 2–5 дней', () => {
    assert.equal(
      formatTechnical({ kind: 'range', from: 2, to: 5, unit: 'days' }, RU, 'ru'),
      '2–5 дней',
    );
  });
  test('габарит: 100×50 мм', () => {
    assert.equal(
      formatTechnical({ kind: 'dimensions', a: 100, b: 50, unit: 'mm' }, RU, 'ru'),
      '100×50 мм',
    );
  });
});

describe('значения без единиц не трогаются', () => {
  test('год', () => assert.equal(formatTechnical({ kind: 'year', value: 2025 }, RU, 'ru'), '2025'));
  test('обозначение', () => {
    assert.equal(formatTechnical({ kind: 'designation', code: 'M12' }, RU, 'ru'), 'M12');
  });
  test('готовая строка', () => {
    assert.equal(formatTechnical({ kind: 'plain', text: '054-973-1889' }, RU, 'ru'), '054-973-1889');
  });
});
