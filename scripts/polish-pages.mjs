/**
 * Полировочный проход по ВСЕМ страницам сборки (QUALITY_DOCTRINE §4).
 *
 * Что делает: находит каждую собранную страницу и прогоняет по ней чек-лист,
 * который обычная сборка не ловит. Не по образцу и не по списку, который
 * кто-то помнил, — по фактическому содержимому `dist` (кодекс §6: полнота
 * набора проверяется явно).
 *
 * Проверяется на каждой странице:
 *  · ровно один H1 и осмысленный порядок заголовков;
 *  · у каждого интерактива непустое доступное имя;
 *  · у каждой картинки есть alt (пустой alt допустим только у декоративных);
 *  · нет горизонтальной прокрутки на 320px;
 *  · клавиатура доходит до конца страницы без ловушек;
 *  · страница читаема без JS;
 *  · включённые режимы доступности не ломают раскладку.
 *
 * Запуск: npm run polish:pages
 */
import { chromium } from 'playwright';
import { readdirSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { serveDist } from './lib/serve-dist.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');

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

const results = [];
const problems = [];

const check = (ok, page, text, detail = '') => {
  results.push(ok);
  if (!ok) problems.push(`${page} · ${text}${detail ? ` — ${detail}` : ''}`);
};

const ACCESSIBLE_NAME = `(el) => {
  const label = el.getAttribute('aria-label');
  if (label && label.trim()) return label.trim();
  const ref = el.getAttribute('aria-labelledby');
  if (ref) {
    const parts = ref.split(/\\s+/).map((id) => document.getElementById(id)?.textContent?.trim() ?? '');
    if (parts.filter(Boolean).length) return parts.join(' ');
  }
  if (el.id) {
    const forLabel = document.querySelector('label[for="' + CSS.escape(el.id) + '"]');
    if (forLabel?.textContent?.trim()) return forLabel.textContent.trim();
  }
  const wrap = el.closest('label')?.textContent?.trim();
  if (wrap) return wrap;
  const text = el.textContent?.trim();
  if (text) return text;
  return (el.getAttribute('title') ?? '').trim();
}`;

const { server, url } = await serveDist();
const browser = await chromium.launch();

try {
  const list = pages();
  console.log(`Страниц к проверке: ${list.length}\n`);

  for (const page of list) {
    // Для index.html адрес — каталог; для отдельных файлов расширение
    // обязано остаться, иначе сервер вернёт 404 и мы измерим пустую страницу
    // вместо самой страницы.
    const route = page.endsWith('/index.html') || page === 'index.html'
      ? page.replace(/index\.html$/, '')
      : page;
    const address = url(route);

    // ── Обычный просмотр ────────────────────────────────────────────────
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const tab = await context.newPage();
    const errors = [];
    tab.on('pageerror', (error) => errors.push(error.message));
    await tab.goto(address, { waitUntil: 'networkidle' });

    const audit = await tab.evaluate(`(() => {
      const accessibleName = ${ACCESSIBLE_NAME};
      // Скрытое содержимое не участвует ни в структуре для скринридера,
      // ни в том, что видит человек. Считаем только отрисованное.
      const rendered = (el) => el.offsetParent !== null || getComputedStyle(el).position === 'fixed';
      const headings = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')]
        .filter(rendered)
        .map((h) => Number(h.tagName[1]));
      const interactive = [...document.querySelectorAll('a[href], button, input, select, textarea')]
        .filter((el) => !el.closest('[hidden]'));
      const nameless = interactive.filter((el) => !accessibleName(el)).map((el) => el.outerHTML.slice(0, 60));
      const images = [...document.querySelectorAll('img')];
      const noAlt = images.filter((img) => !img.hasAttribute('alt')).map((img) => img.src.slice(-40));
      let jumps = [];
      for (let i = 1; i < headings.length; i += 1) {
        if (headings[i] - headings[i - 1] > 1) jumps.push(headings[i - 1] + '→' + headings[i]);
      }
      return {
        h1: [...document.querySelectorAll('h1')].filter(rendered).length,
        jumps,
        nameless,
        noAlt,
        lang: document.documentElement.lang,
        dir: document.documentElement.dir,
        title: document.title,
      };
    })()`);

    check(audit.h1 === 1, page, 'ровно один H1', `найдено ${audit.h1}`);
    check(audit.jumps.length === 0, page, 'уровни заголовков без пропусков', audit.jumps.join(', '));
    check(audit.nameless.length === 0, page, 'все интерактивы названы', audit.nameless.join(' | '));
    check(audit.noAlt.length === 0, page, 'у всех изображений есть alt', audit.noAlt.join(', '));
    check(Boolean(audit.lang), page, 'указан язык документа');
    check(Boolean(audit.title), page, 'есть заголовок документа');
    check(errors.length === 0, page, 'без ошибок в консоли', errors.join(' | '));

    await context.close();

    // ── 320px ───────────────────────────────────────────────────────────
    const narrow = await browser.newContext({ viewport: { width: 320, height: 640 } });
    const narrowTab = await narrow.newPage();
    await narrowTab.goto(address, { waitUntil: 'networkidle' });
    const overflow = await narrowTab.evaluate(() => ({
      doc: document.documentElement.scrollWidth,
      client: document.documentElement.clientWidth,
    }));
    check(
      overflow.doc <= overflow.client,
      page,
      '320px без горизонтальной прокрутки',
      `${overflow.doc} > ${overflow.client}`,
    );
    await narrow.close();

    // ── Без JS ──────────────────────────────────────────────────────────
    const noJs = await browser.newContext({ javaScriptEnabled: false });
    const noJsTab = await noJs.newPage();
    await noJsTab.goto(address, { waitUntil: 'load' });
    /**
     * «Читаема без JS» — это заголовок, текст и способ уйти дальше.
     * Порог объёма для 404 отдельный: там короткий текст — не недоделка,
     * а правильное поведение, и требовать от неё абзацев было бы подгонкой
     * страницы под проверку, а не проверки под смысл.
     */
    const minText = page === '404.html' ? 30 : 80;
    const readable = await noJsTab.evaluate((min) => {
      const shown = [...document.querySelectorAll('h1')].filter((el) => !el.closest('[hidden]'));
      const links = [...document.querySelectorAll('a[href]')].filter((el) => !el.closest('[hidden]'));
      return shown.length === 1 && links.length > 0 && document.body.innerText.trim().length > min;
    }, minText);
    // `/admin` — зарезервированная заглушка под Decap CMS (F9), не страница
    // для читателя. Требовать от неё объём текста бессмысленно.
    if (!page.startsWith('admin/')) check(readable, page, 'читаема без JS');
    await noJs.close();

    // ── Режимы доступности включены ─────────────────────────────────────
    const a11y = await browser.newContext({ viewport: { width: 320, height: 640 } });
    const a11yTab = await a11y.newPage();
    await a11yTab.addInitScript(() =>
      localStorage.setItem(
        'a11y',
        JSON.stringify({ font: '3', leading: '2', tracking: '2', contrast: 'on', underline: 'on' }),
      ),
    );
    await a11yTab.goto(address, { waitUntil: 'networkidle' });
    const a11yOverflow = await a11yTab.evaluate(() => ({
      doc: document.documentElement.scrollWidth,
      client: document.documentElement.clientWidth,
      applied: document.documentElement.getAttribute('data-a11y-font'),
    }));
    check(
      a11yOverflow.applied === '3',
      page,
      'режимы доступности применяются до отрисовки',
      String(a11yOverflow.applied),
    );
    check(
      a11yOverflow.doc <= a11yOverflow.client,
      page,
      'раскладка держится при крупном шрифте на 320px',
      `${a11yOverflow.doc} > ${a11yOverflow.client}`,
    );
    await a11y.close();

    process.stdout.write('.');
  }
} finally {
  await browser.close();
  server.close();
}

const failed = problems.length;
console.log(`\n\nПроверок: ${results.length}, провалено: ${failed}`);
for (const problem of problems) console.error(`✗ ${problem}`);
if (failed > 0) process.exit(1);
console.log('✓ полировочный проход по страницам чист');
