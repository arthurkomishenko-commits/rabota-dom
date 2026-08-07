// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

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
  vite: {
    plugins: [tailwindcss()],
  },
});
