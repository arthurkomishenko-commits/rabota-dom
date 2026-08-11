/**
 * Форматирование технических значений в строку.
 *
 * Что делает: превращает структуру (число + единица, габарит, диапазон,
 * обозначение, год) в текст, пригодный для показа.
 * Вход: значение, подписи единиц и локаль. Выход: строка.
 * Кто использует: `src/components/TechnicalValue.astro` — и только он.
 *
 * Порядок символов внутри строки эта функция НЕ гарантирует: за него отвечает
 * изоляция в компоненте (BUG-0005). Здесь только состав.
 *
 * ПРО ЛОКАЛЬ — BUG-0014. Раньше здесь стояло «функция не знает о языке,
 * подписи приходят параметром», и это выглядело чистой архитектурой. На деле
 * выбор формы слова — и есть знание о языке, а плоская строка сделать его
 * не позволяла: получалось «4 дней», «1 дней», `1 pcs`, `1 ימים`. Поэтому
 * функция теперь принимает локаль и выбирает форму через `Intl.PluralRules`.
 * Список категорий у языков разный (у иврита есть двойственное число), и
 * зашивать его руками нельзя — за это отвечает платформа.
 */
import type { TechnicalValue, Unit } from '../data/schemas/technical';
import type { Locale } from '../config/site';

/**
 * Формы одной подписи. `other` обязателен — это запасной вариант для любой
 * категории, которой нет в словаре, включая дробные числа.
 */
export type PluralForms = {
  one?: string;
  two?: string;
  few?: string;
  many?: string;
  other: string;
};

/** Единица либо неизменяема («м²», «мм»), либо склоняется. */
export type UnitLabel = string | PluralForms;
export type UnitLabels = Record<Unit, UnitLabel>;

/** `Intl.PluralRules` не бесплатен, а локалей три — считаем один раз. */
const RULES = new Map<Locale, Intl.PluralRules>();

function rulesFor(locale: Locale): Intl.PluralRules {
  let rules = RULES.get(locale);
  if (!rules) {
    rules = new Intl.PluralRules(locale);
    RULES.set(locale, rules);
  }
  return rules;
}

/**
 * Подпись единицы для конкретного количества.
 * `count` — то число, по которому язык выбирает форму: у диапазона это
 * последнее число («1–3 дня», «2–5 дней»), у габарита — второе.
 */
function label(unit: UnitLabel, count: number, locale: Locale): string {
  if (typeof unit === 'string') return unit;
  const category = rulesFor(locale).select(count) as keyof PluralForms;
  return unit[category] ?? unit.other;
}

/** Убирает хвостовые нули: 4.0 → «4», 4.5 → «4,5» не делаем — точка универсальна. */
function num(value: number): string {
  return String(Number(value.toFixed(2)));
}

export function formatTechnical(
  value: TechnicalValue,
  labels: UnitLabels,
  locale: Locale,
): string {
  switch (value.kind) {
    case 'quantity':
      return `${num(value.value)} ${label(labels[value.unit], value.value, locale)}`;
    case 'dimensions':
      // Знак × здесь — часть значения, а не разделитель списка.
      return `${num(value.a)}×${num(value.b)} ${label(labels[value.unit], value.b, locale)}`;
    case 'range':
      // Тире «–» между числами: диапазон, а не дефис переноса.
      return `${num(value.from)}–${num(value.to)} ${label(labels[value.unit], value.to, locale)}`;
    case 'designation':
      return value.code;
    case 'year':
      return String(value.value);
    case 'plain':
      return value.text;
  }
}
