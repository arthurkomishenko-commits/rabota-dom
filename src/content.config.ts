/**
 * Конфигурация коллекций контента.
 *
 * Astro требует, чтобы этот файл лежал именно здесь, поэтому он физически вне
 * `src/data/`. По смыслу он принадлежит слою данных — это объявление источника,
 * — и проверка границ трактует его как `data` (см. scripts/check-conventions.mjs).
 *
 * Сырьё лежит одной папкой на объект (DEC-0013):
 *   content/works/work-NN/{intake.md, photos/, he.mdx, ru.mdx, en.mdx}
 * В коллекцию попадают только локализованные записи; `intake.md` и `photos/`
 * под шаблон не подходят и в сборку не идут.
 */
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { workSchema } from './data/schemas/work';

const works = defineCollection({
  loader: glob({ base: './content/works', pattern: '**/{he,ru,en}.mdx' }),
  schema: workSchema,
});

export const collections = { works };
