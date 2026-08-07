/**
 * Скриншоты витрины компонентов для доказательств гейта F1.
 *
 * Что делает: раздаёт собранный `dist/` и снимает `/__ui/` в обеих темах.
 * Направления снимать отдельно не нужно: каждый образец на витрине показан
 * сразу в LTR и RTL (см. `src/showcase/Specimen.astro`).
 * Выход: `docs/evidence/f1/ui-{light,dark}.png`.
 *
 * Требует сборку с витриной:  npm run build:ui && node scripts/shots-ui.mjs
 * (обёрнуто в `npm run shots:ui`).
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { serveDist } from './lib/serve-dist.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'docs/evidence/f1');

mkdirSync(OUT, { recursive: true });

const { server, url } = await serveDist();
const browser = await chromium.launch();

try {
  const response = await fetch(url('__ui/'));
  if (!response.ok) {
    throw new Error(
      'Витрина не найдена в dist. Соберите с флагом: npm run build:ui',
    );
  }

  for (const scheme of ['light', 'dark']) {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 900 },
      colorScheme: scheme,
    });
    const tab = await context.newPage();
    await tab.goto(url('__ui/'), { waitUntil: 'networkidle' });

    const theme = await tab.evaluate(() => document.documentElement.dataset.theme);
    const tokens = await tab.evaluate(() =>
      Array.from(document.querySelectorAll('[data-token]')).map((n) => n.textContent?.trim()),
    );

    await tab.screenshot({ path: join(OUT, `ui-${scheme}.png`), fullPage: true });
    console.log(`✓ ui-${scheme}.png · data-theme="${theme}" · токены: ${tokens.join(' ')}`);

    await context.close();
  }
} finally {
  await browser.close();
  server.close();
}
