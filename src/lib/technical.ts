/**
 * Форматирование технических значений в строку.
 *
 * Что делает: превращает структуру (число + единица, габарит, диапазон,
 * обозначение, год) в текст, пригодный для показа. Чистая функция без
 * побочных эффектов и без знания о языке: подписи единиц приходят параметром.
 * Вход: значение и словарь подписей единиц. Выход: строка.
 * Кто использует: `src/components/TechnicalValue.astro` — и только он.
 *
 * Порядок символов внутри строки эта функция НЕ гарантирует: за него отвечает
 * изоляция в компоненте (BUG-0005). Здесь только состав.
 */
import type { TechnicalValue, Unit } from '../data/schemas/technical';

export type UnitLabels = Record<Unit, string>;

/** Убирает хвостовые нули: 4.0 → «4», 4.5 → «4,5» не делаем — точка универсальна. */
function num(value: number): string {
  return String(Number(value.toFixed(2)));
}

export function formatTechnical(value: TechnicalValue, labels: UnitLabels): string {
  switch (value.kind) {
    case 'quantity':
      return `${num(value.value)} ${labels[value.unit]}`;
    case 'dimensions':
      // Знак × здесь — часть значения, а не разделитель списка.
      return `${num(value.a)}×${num(value.b)} ${labels[value.unit]}`;
    case 'range':
      // Тире «–» между числами: диапазон, а не дефис переноса.
      return `${num(value.from)}–${num(value.to)} ${labels[value.unit]}`;
    case 'designation':
      return value.code;
    case 'year':
      return String(value.value);
    case 'plain':
      return value.text;
  }
}
