/**
 * Полировочный проход — чек-лист edge-cases из QUALITY_DOCTRINE §4.
 *
 * Что делает: раздаёт собранный `dist/` собственным статическим сервером и прогоняет по
 * страницам проверки, которые обычная сборка не ловит: отключённый JS,
 * клавиатурная навигация, узкий вьюпорт, очень длинные строки, reduced-motion,
 * иврит и RTL.
 * Запуск: npm run polish  (сборка выполняется сама)
 *
 * Проверяется собранный dist, а не живой сайт: полировка идёт ДО деплоя.
 */
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const BASE = '/rabota-dom/';
let ORIGIN = '';
const url = (path = '') => `${ORIGIN}${BASE}${path}`;

/**
 * Свой статический сервер вместо `astro preview`.
 * В Astro 7 preview — фоновый демон: он переживает процесс, игнорирует повторный
 * `--port` и делает прогон недетерминированным. Раздать собранный `dist/`
 * тридцатью строками надёжнее, чем подстраиваться под жизненный цикл демона.
 */
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.woff2': 'font/woff2',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
};

function startStaticServer() {
  const server = createServer((req, res) => {
    const pathname = decodeURIComponent(new URL(req.url ?? '/', 'http://x').pathname);
    const relative = pathname.startsWith(BASE) ? pathname.slice(BASE.length) : pathname.slice(1);
    let file = join(DIST, relative);

    if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
    if (!existsSync(file)) {
      res.writeHead(404, { 'content-type': 'text/plain' });
      res.end('not found');
      return;
    }

    res.writeHead(200, { 'content-type': MIME[extname(file)] ?? 'application/octet-stream' });
    createReadStream(file).pipe(res);
  });

  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      ORIGIN = `http://127.0.0.1:${typeof address === 'object' && address ? address.port : 0}`;
      resolve(server);
    });
  });
}

const results = [];
const say = (ok, text, detail = '') => {
  results.push({ ok, text, detail });
  console.log(`${ok ? '✓' : '✗'} ${text}${detail ? `  — ${detail}` : ''}`);
};

const server = await startStaticServer();
const browser = await chromium.launch();

try {

  // ── 1. Отключённый JS: каскад темы обязан работать без него ───────────────
  for (const scheme of ['light', 'dark']) {
    const context = await browser.newContext({ javaScriptEnabled: false, colorScheme: scheme });
    const tab = await context.newPage();
    await tab.goto(url(), { waitUntil: 'load' });

    const state = await tab.evaluate(() => ({
      // Фон задан на <html> и наследуется холстом; у body он прозрачный — это норма.
      bg: getComputedStyle(document.documentElement).backgroundColor,
      colorScheme: getComputedStyle(document.documentElement).colorScheme,
      hasHeading: Boolean(document.querySelector('h1')?.textContent?.trim()),
      themeAttr: document.documentElement.dataset.theme ?? null,
    }));

    // Без JS атрибут не проставляется — тему обязана дать медиазапросом сама CSS.
    const expected = scheme === 'dark' ? 'rgb(18, 20, 23)' : 'rgb(247, 247, 249)';
    say(
      state.themeAttr === null && state.bg === expected && state.colorScheme === scheme,
      `без JS · системная ${scheme} → фон ${state.bg}, color-scheme ${state.colorScheme}`,
    );
    say(state.hasHeading, `без JS · содержимое страницы отрендерено`);
    await context.close();
  }

  // ── 2. Клавиатура: фокус доходит до тумблера и кольцо видно ───────────────
  {
    const context = await browser.newContext();
    const tab = await context.newPage();
    await tab.goto(url(), { waitUntil: 'networkidle' });
    await tab.keyboard.press('Tab');

    const focus = await tab.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return null;
      const s = getComputedStyle(el);
      return {
        tag: el.tagName.toLowerCase(),
        hasToggle: el.hasAttribute('data-theme-toggle'),
        outlineWidth: s.outlineWidth,
        outlineStyle: s.outlineStyle,
        outlineOffset: s.outlineOffset,
      };
    });

    say(
      Boolean(focus) && focus.hasToggle,
      'клавиатура · первый Tab попадает на тумблер темы',
      focus ? focus.tag : 'фокус никуда не встал',
    );
    say(
      Boolean(focus) && focus.outlineStyle !== 'none' && parseFloat(focus.outlineWidth) >= 2,
      'клавиатура · фокус-кольцо видно',
      focus ? `outline ${focus.outlineWidth} ${focus.outlineStyle}, offset ${focus.outlineOffset}` : '',
    );
    await context.close();
  }

  // ── 3. Узкий вьюпорт: горизонтальной прокрутки быть не должно ─────────────
  for (const [locale, path] of [
    ['he', ''],
    ['ru', 'ru/'],
    ['en', 'en/'],
  ]) {
    const context = await browser.newContext({ viewport: { width: 320, height: 640 } });
    const tab = await context.newPage();
    await tab.goto(url(path), { waitUntil: 'networkidle' });

    const overflow = await tab.evaluate(() => ({
      doc: document.documentElement.scrollWidth,
      client: document.documentElement.clientWidth,
    }));
    say(
      overflow.doc <= overflow.client,
      `320px · ${locale} · нет горизонтальной прокрутки`,
      `scrollWidth ${overflow.doc} ≤ clientWidth ${overflow.client}`,
    );
    await context.close();
  }

  // ── 4. Очень длинная строка без пробелов не разрывает раскладку ───────────
  {
    const context = await browser.newContext({ viewport: { width: 320, height: 640 } });
    const tab = await context.newPage();
    await tab.goto(url(), { waitUntil: 'networkidle' });

    const overflow = await tab.evaluate(() => {
      const h1 = document.querySelector('h1');
      if (h1) h1.textContent = 'א'.repeat(120);
      return {
        doc: document.documentElement.scrollWidth,
        client: document.documentElement.clientWidth,
      };
    });
    say(
      overflow.doc <= overflow.client,
      '320px · длинная строка без пробелов не ломает раскладку',
      `scrollWidth ${overflow.doc} ≤ clientWidth ${overflow.client}`,
    );
    await context.close();
  }

  // ── 5. reduced-motion: переходы схлопнуты в мгновенные ────────────────────
  {
    const context = await browser.newContext({ reducedMotion: 'reduce' });
    const tab = await context.newPage();
    await tab.goto(url(), { waitUntil: 'networkidle' });

    const duration = await tab.evaluate(() => {
      const el = document.querySelector('[data-theme-toggle]');
      return el ? getComputedStyle(el).transitionDuration : null;
    });
    say(
      duration !== null && parseFloat(duration) <= 0.001,
      'reduced-motion · переходы мгновенные',
      `transition-duration ${duration}`,
    );
    await context.close();
  }
} finally {
  await browser.close();
  server.close();
}

const failed = results.filter((r) => !r.ok).length;
console.log(`\nПолировочный проход: ${results.length - failed}/${results.length}`);
if (failed > 0) process.exit(1);
