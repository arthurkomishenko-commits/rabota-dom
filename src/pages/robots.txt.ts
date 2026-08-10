/**
 * robots.txt.
 *
 * Что делает: до Content Freeze закрывает сайт от индексации целиком.
 * После фриза — открывает и указывает карту сайта.
 * Кто использует: поисковые роботы.
 *
 * Состояние берётся из того же признака, что и `noindex` на страницах
 * (DEC-0006): два источника правды разошлись бы, и однажды robots разрешил бы
 * то, что страницы запрещают. Здесь источник один — `PUBLIC_LAUNCH`.
 */
import type { APIRoute } from 'astro';
import { PUBLIC_LAUNCH, SITE_URL, BASE_URL } from '../config/site';

export const GET: APIRoute = () => {
  const sitemap = `${SITE_URL}${BASE_URL}sitemap.xml`;

  const body = PUBLIC_LAUNCH
    ? ['User-agent: *', 'Allow: /', '', `Sitemap: ${sitemap}`, ''].join('\n')
    : [
        '# Сайт ещё не запущен: до Content Freeze индексация закрыта целиком.',
        '# Это то же решение, что и noindex на страницах (DEC-0006).',
        'User-agent: *',
        'Disallow: /',
        '',
      ].join('\n');

  return new Response(body, { headers: { 'content-type': 'text/plain; charset=utf-8' } });
};
