/**
 * Схема работы портфолио — «паспорт объекта».
 *
 * Что делает: описывает обязательный минимум публикации (бриф §4) и валидирует
 * его на сборке. Невалидная запись валит билд — неполный объект не публикуется.
 * Вход: контекст схемы Astro (даёт `image()`). Выход: Zod-схема + TS-тип.
 * Кто использует: `src/content.config.ts`, `src/data/works.ts`.
 *
 * ФЕЙКИ ЗАПРЕЩЕНЫ (бриф §4). Поэтому здесь нет ни одного поля «на всякий
 * случай» со значением по умолчанию: метрика, срок и отзыв либо есть в паспорте,
 * либо их нет и они не рендерятся. Пустая строка не проходит — так у автора
 * записи не остаётся способа «заполнить, чтобы прошло».
 */
import { z } from 'zod';
import type { SchemaContext } from 'astro:content';
import { quantitySchema, rangeSchema, technicalValueSchema, yearSchema } from './technical';

/** Роль кадра в паспорте. От неё зависит обязательный минимум комплекта. */
export const PHOTO_ROLES = ['cover', 'general', 'process', 'before', 'after', 'node'] as const;

/**
 * Координаты обязаны быть ОГРУБЛЕНЫ при вводе (бриф §5: ~±100 м).
 * Три знака после запятой — это примерно 110 м; больше знаков означает, что
 * в репозиторий попал точный адрес клиента. Проверяем, а не просим помнить.
 */
const coarseCoordinate = (max: number) =>
  z
    .number()
    .min(-max)
    .max(max)
    .refine((n) => Math.abs(n * 1000 - Math.round(n * 1000)) < 1e-9, {
      message:
        'координата не огрублена: оставьте не больше трёх знаков после запятой (~110 м). ' +
        'Точный адрес клиента в репозиторий не кладётся (бриф §5)',
    });

/** Минимум два предложения — требование брифа §4 к описанию. */
const sentences = (min: number) =>
  z.string().refine((text) => (text.match(/[.!?…]+/g) ?? []).length >= min, {
    message: `нужно не меньше ${min} предложений`,
  });

export function workSchema({ image }: SchemaContext) {
  const photo = z.object({
    src: image(),
    alt: z.string().min(3, 'alt обязателен: он и для скринридера, и для поиска'),
    role: z.enum(PHOTO_ROLES),
  });

  return z
    .object({
      /** Версия контракта — миграции данных должны быть скриптуемы (§3). */
      schemaVersion: z.literal(1),

      /** Неизменен всегда. Не URL и не заголовок — их можно менять, этот нельзя. */
      id: z.string().regex(/^work-[a-z0-9-]+$/),

      /** После публикации не меняется: это URL, OG-ссылка и будущий ключ БД (§3). */
      slug: z.string().regex(/^[a-z0-9-]+$/),

      /** Явно помеченная непубликуемая запись. Отсекается репозиторием и check:surface. */
      fixture: z.boolean().default(false),

      type: z.enum(['pergola', 'canopy', 'fence']),
      material: z.enum(['wood', 'metal', 'combo']),

      city: z.string().min(2),
      year: yearSchema,

      /** Срок работ: одно число дней либо диапазон. Подтверждает «в срок» цифрой. */
      duration: z.union([quantitySchema, rangeSchema]),

      /** Живое описание, не реклама. Правила — EDITORIAL.md. */
      summary: sentences(2),

      /** «Что было самым сложным» — необязательно, но если есть, то не пустое. */
      hardPart: sentences(1).optional(),

      photos: z.array(photo).min(3, 'минимум три кадра (бриф §4)'),

      metrics: z
        .array(z.object({ label: z.string().min(2), value: technicalValueSchema }))
        .min(1, 'нужна хотя бы одна РЕАЛЬНАЯ метрика; выдуманных быть не должно'),

      coords: z.object({
        lat: coarseCoordinate(90),
        lng: coarseCoordinate(180),
      }),

      review: z
        .object({
          name: z.string().min(2),
          text: sentences(1),
          /** Без согласия отзыв не публикуется — бриф §5. */
          consent: z.literal(true),
        })
        .optional(),

      /**
       * ISO 8601 (§3). YAML сам разбирает `2026-08-09` в дату, поэтому
       * принимаем оба вида и нормализуем к строке `YYYY-MM-DD`: заставлять
       * автора записи помнить про кавычки — способ однажды получить `2026/08/09`.
       */
      publishedAt: z
        .union([z.iso.date(), z.date()])
        .transform((value) =>
          typeof value === 'string' ? value : value.toISOString().slice(0, 10),
        ),
    })
    .refine((work) => work.photos.filter((p) => p.role === 'cover').length === 1, {
      message: 'нужен ровно один кадр с ролью cover',
      path: ['photos'],
    })
    .refine(
      (work) => work.photos.some((p) => ['process', 'before', 'after'].includes(p.role)),
      {
        message:
          'нужен хотя бы один кадр процесса или «до/после» — иначе это каталог, а не паспорт',
        path: ['photos'],
      },
    );
}

export type Work = z.infer<ReturnType<typeof workSchema>>;
