/**
 * sitemap.xml.
 *
 * Что делает: перечисляет публичные страницы всех локалей с перекрёстными
 * ссылками `hreflang` — той же логикой, что и теги в `<head>`.
 * Кто использует: поисковые роботы.
 *
 * До Content Freeze карта сайта НЕ отдаётся: перечислять страницы, которые
 * сами говорят `noindex`, — это противоречие, по которому поисковик сделает
 * собственные выводы. Признак один и тот же (`PUBLIC_LAUNCH`).
 *
 * Страницы вне языковой матрицы (`/admin`) и служебные (`/__ui`, 404)
 * в карту не попадают по построению: список строится из карты маршрутов,
 * а не обходом файлов.
 */
import type { APIRoute } from 'astro';
import { getAbsoluteLocaleUrl } from 'astro:i18n';
import { LOCALES, PUBLIC_LAUNCH, ROUTES, DEFAULT_LOCALE } from '../config/site';
import { getWorks } from '../data/works';

export const GET: APIRoute = async () => {
  if (!PUBLIC_LAUNCH) {
    return new Response('Сайт не запущен: карта сайта появится вместе с Content Freeze.', {
      status: 404,
      headers: { 'content-type': 'text/plain; charset=utf-8' },
    });
  }

  /** Маршруты, которые есть на всех языках. Калькулятор и карта — по своим гейтам. */
  const routes: string[] = [
    ROUTES.home,
    ROUTES.portfolio,
    ROUTES.services,
    ROUTES.pergolas,
    ROUTES.canopies,
    ROUTES.fences,
    ROUTES.about,
    ROUTES.contact,
    ROUTES.privacy,
    ROUTES.accessibility,
  ];

  // Страницы работ: только опубликованные, по слагам из репозитория.
  const works = await getWorks(DEFAULT_LOCALE);
  for (const work of works) routes.push(`${ROUTES.portfolio}${work.data.slug}/`);

  const entries = routes.map((route) => {
    const alternates = LOCALES.map(
      (locale) =>
        `    <xhtml:link rel="alternate" hreflang="${locale}" href="${getAbsoluteLocaleUrl(locale, route)}"/>`,
    ).join('\n');

    return LOCALES.map(
      (locale) => `  <url>
    <loc>${getAbsoluteLocaleUrl(locale, route)}</loc>
${alternates}
    <xhtml:link rel="alternate" hreflang="x-default" href="${getAbsoluteLocaleUrl(DEFAULT_LOCALE, route)}"/>
  </url>`,
    ).join('\n');
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries.join('\n')}
</urlset>
`;

  return new Response(xml, { headers: { 'content-type': 'application/xml; charset=utf-8' } });
};
