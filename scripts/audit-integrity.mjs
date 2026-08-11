/**
 * Целостность сборки. Падает — что-то ведёт в никуда.
 *
 * Что делает: разбирает готовый `dist` и проверяет связи, которые ни один
 * браузерный тест не увидит целиком, потому что смотрит по одной странице:
 *   · каждая внутренняя ссылка ведёт на существующую страницу или файл;
 *   · hreflang взаимный: если A ссылается на B, то B обязан ссылаться на A;
 *   · canonical совпадает с собственным адресом страницы;
 *   · sitemap и реальный набор страниц не разошлись;
 *   · у каждой страницы есть заголовок и указан язык.
 *
 * Запуск: npm run audit:integrity
 *
 * Проверяется факт в `dist`, а не намерение в исходниках: битая ссылка
 * появляется именно при сборке — от опечатки в маршруте до забытой страницы.
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const BASE = '/rabota-dom/';

const problems = [];
const add = (page, message) => problems.push(`${page} · ${message}`);

function pages() {
  const out = [];
  const walk = (dir) => {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) walk(full);
      else if (entry.endsWith('.html')) out.push(relative(DIST, full));
    }
  };
  walk(DIST);
  return out.sort();
}

/** Существует ли по адресу страница или файл в сборке. */
function resolves(href) {
  if (!href.startsWith(BASE)) return null;
  const rel = href.slice(BASE.length).split(/[?#]/)[0];
  if (rel === '') return existsSync(join(DIST, 'index.html'));

  const direct = join(DIST, rel);
  if (existsSync(direct) && statSync(direct).isFile()) return true;
  return existsSync(join(DIST, rel, 'index.html'));
}

const list = pages();
const hreflangMap = new Map();

for (const page of list) {
  const source = readFileSync(join(DIST, page), 'utf8');
  const ownUrl = `${BASE}${page.replace(/index\.html$/, '')}`;

  // ── язык и заголовок ────────────────────────────────────────────────
  if (!/<html[^>]+lang="[a-z]{2}"/.test(source)) add(page, 'не указан язык документа');
  if (!/<title>[^<]{3,}<\/title>/.test(source)) add(page, 'нет осмысленного <title>');

  // ── внутренние ссылки ───────────────────────────────────────────────
  for (const match of source.matchAll(/(?:href|src)="(\/[^"]*)"/g)) {
    const href = match[1];
    if (href.startsWith('//')) continue;
    const ok = resolves(href);
    if (ok === false) add(page, `ссылка в никуда: ${href}`);
  }

  // ── hreflang: он же признак принадлежности к языковой матрице ───────
  const alternates = [...source.matchAll(/<link rel="alternate" hreflang="([a-z-]+)" href="([^"]+)"/g)]
    .filter(([, lang]) => lang !== 'x-default')
    .map(([, , href]) => new URL(href).pathname);

  const inMatrix = alternates.length > 0;
  if (inMatrix) hreflangMap.set(ownUrl, alternates);

  /**
   * Canonical обязателен для страниц языковой матрицы и не нужен вне её.
   * У 404 канонического адреса не существует: она отдаётся на любой запрос.
   * У `/admin` он бессмыслен по той же причине. Требовать его там значило бы
   * заставлять код указывать на несуществующую страницу (BUG-0011).
   */
  const canonical = source.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
  if (inMatrix && !canonical) add(page, 'нет canonical у страницы языковой матрицы');
  if (canonical) {
    const path = new URL(canonical).pathname;
    if (path !== ownUrl) add(page, `canonical не совпадает с адресом: ${path} ≠ ${ownUrl}`);
    if (!inMatrix) add(page, 'canonical у страницы вне языковой матрицы — он там не нужен');
  }
}

// ── hreflang обязан быть взаимным ─────────────────────────────────────
for (const [from, targets] of hreflangMap) {
  for (const target of targets) {
    if (target === from) continue;
    const back = hreflangMap.get(target);
    if (!back) {
      add(from, `hreflang ведёт на ${target}, а оттуда обратной ссылки нет`);
      continue;
    }
    if (!back.includes(from)) add(from, `hreflang невзаимный с ${target}`);
  }
}

// ── sitemap ↔ реальные страницы ───────────────────────────────────────
const sitemapPath = join(DIST, 'sitemap.xml');
if (existsSync(sitemapPath)) {
  const xml = readFileSync(sitemapPath, 'utf8');
  for (const match of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) {
    const path = new URL(match[1]).pathname;
    if (resolves(path) === false) add('sitemap.xml', `перечисляет несуществующую страницу: ${path}`);
  }
} else {
  console.log('· sitemap.xml не отдаётся — сайт ещё не запущен (PUBLIC_LAUNCH=false), это ожидаемо');
}

if (problems.length > 0) {
  for (const problem of problems) console.error(`✗ ${problem}`);
  console.error(`\nНарушений целостности: ${problems.length}.`);
  process.exit(1);
}

console.log(`✓ целостность: ${list.length} страниц, ссылки живые, hreflang взаимный, canonical верен`);
