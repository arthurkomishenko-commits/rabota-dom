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
  loader: glob({
    base: './content/works',
    pattern: '**/{he,ru,en}.mdx',
    /**
     * ID строится из ПУТИ файла: `work-01-pergola/ru`.
     *
     * Умолчание loader'а берёт id из поля `slug`, если оно есть во фронтматтере,
     * а `slug` у трёх языковых версий одной работы общий — это URL, он обязан
     * совпадать. В результате записи схлопывались в одну, и две локали из трёх
     * молча пропадали из коллекции. Поймано снимком витрины: заголовки локалей
     * были, карточек не было. BUG-0006.
     */
    generateId: ({ entry }) => entry.replace(/\.mdx?$/, ''),
  }),
  schema: workSchema,
});

export const collections = { works };
