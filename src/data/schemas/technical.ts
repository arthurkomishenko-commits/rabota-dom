/**
 * Технические значения: размеры, профили, диапазоны, крепёж.
 *
 * Что делает: описывает их как СТРУКТУРЫ, а не свободные строки, и даёт TS-типы.
 * Вход: нет. Выход: Zod-схемы и типы.
 * Кто использует: `src/data/schemas/work.ts`, `src/lib/technical.ts`.
 *
 * ЗАЧЕМ ЭТО ВООБЩЕ СУЩЕСТВУЕТ — BUG-0005. Значение `100×50`, записанное строкой,
 * в RTL отображалось как `50×100`: символ `×` нейтральный, алгоритм bidi
 * разрешает его в направление абзаца и переставляет числовые прогоны местами.
 * Значение меняло СМЫСЛ. Пока такие данные — строки, каждый новый экран будет
 * заново подставлять обёртку руками и однажды забудет. Структура убирает саму
 * возможность: числа хранятся числами, а порядок задаёт единственный рендер
 * (`src/components/TechnicalValue.astro`).
 *
 * Единицы хранятся рядом со значением: «24» без «пог. м» — это не данные.
 */
import { z } from 'zod';

/** Единицы, встречающиеся в паспортах работ. */
export const UNITS = ['m', 'm2', 'lm', 'mm', 'pcs', 'days'] as const;
export type Unit = (typeof UNITS)[number];

const unit = z.enum(UNITS);

/** Одно число с единицей: площадь 18 м², длина 24 пог. м, срок 5 дней. */
export const quantitySchema = z.object({
  kind: z.literal('quantity'),
  value: z.number().positive(),
  unit,
});

/** Габарит «ширина × глубина» или сечение профиля «100×50». */
export const dimensionsSchema = z.object({
  kind: z.literal('dimensions'),
  a: z.number().positive(),
  b: z.number().positive(),
  unit,
});

/** Диапазон «2–3 дня». */
export const rangeSchema = z.object({
  kind: z.literal('range'),
  from: z.number().positive(),
  to: z.number().positive(),
  unit,
});

/** Обозначение крепежа: M12, HEB160. Латиница и цифры, без пробелов. */
export const designationSchema = z.object({
  kind: z.literal('designation'),
  code: z
    .string()
    .regex(/^[A-Z][A-Za-z0-9-]*$/, 'обозначение — латиница и цифры, например M12'),
});

/** Год: тоже техническое значение, и в RTL его нельзя отдавать на волю bidi. */
export const yearSchema = z.object({
  kind: z.literal('year'),
  value: z.number().int().gte(1990).lte(2100),
});

/**
 * Уже готовая техническая строка: телефон, артикул, координата.
 * Форматировать нечего — но изоляция направления нужна ровно та же,
 * иначе `054-973-1889` в RTL распадётся на переставленные группы цифр.
 */
export const plainSchema = z.object({
  kind: z.literal('plain'),
  text: z.string().min(1),
});

export const technicalValueSchema = z.discriminatedUnion('kind', [
  plainSchema,
  quantitySchema,
  dimensionsSchema,
  rangeSchema,
  designationSchema,
  yearSchema,
]);

/**
 * Тип выводится ИЗ схемы, а не пишется рядом руками: рукописная копия однажды
 * разойдётся со схемой, и разойдётся молча.
 */
export type TechnicalValue = z.infer<typeof technicalValueSchema>;
