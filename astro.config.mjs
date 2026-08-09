// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

import mdx from '@astrojs/mdx';

/**
 * ЕДИНСТВЕННОЕ МЕСТО, где живут адрес сайта и базовый путь.
 *
 * Сейчас: GitHub Pages project page → сайт лежит в подпапке /rabota-dom/.
 * Переезд на собственный домен = правка этих двух строк:
 *   site: 'https://<домен>', base: '/'   (+ public/CNAME, + запись в docs/DECISIONS.md)
 *
 * В коде эти значения НЕ дублируются: используются `Astro.site`
 * и `import.meta.env.BASE_URL` (Astro отдаёт base с завершающим слэшем).
 * Решение DEC-0002.
 */
const SITE = 'https://arthurkomishenko-commits.github.io';
const BASE = '/rabota-dom';

/**
 * Витрина компонентов `/__ui/` (F1) в публичный контур не попадает НИКОГДА:
 * её маршрут вообще не существует в production-сборке. Не «скрыта», не «noindex»,
 * а отсутствует — прятать существующую страницу пришлось бы в четырёх местах
 * (sitemap, hreflang, навигация, robots), и каждое из них однажды забыли бы.
 * Решение DEC-0011.
 *
 * Включается флагом:  UI_SHOWCASE=1 npm run build:ui  ·  npm run dev
 */
const SHOWCASE = process.env.UI_SHOWCASE === '1';

/** @returns {import('astro').AstroIntegration} */
function uiShowcase() {
  return {
    name: 'rabota-dom:ui-showcase',
    hooks: {
      'astro:config:setup': ({ injectRoute, logger }) => {
        if (!SHOWCASE) return;
        injectRoute({ pattern: '/__ui', entrypoint: './src/showcase/index.astro' });
        logger.warn('Витрина /__ui/ включена — эта сборка не предназначена для публикации');
      },
    },
  };
}

// https://astro.build/config
export default defineConfig({
  site: SITE,
  base: BASE,
  trailingSlash: 'always',
  i18n: {
    // Бриф §2: '/' = иврит без префикса, /ru/, /en/.
    locales: ['he', 'ru', 'en'],
    defaultLocale: 'he',
    routing: {
      prefixDefaultLocale: false,
    },
  },
  integrations: [uiShowcase(), mdx()],
  vite: {
    plugins: [tailwindcss()],
  },
});