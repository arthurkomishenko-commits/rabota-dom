/**
 * Точечная проверка карточки-«паспорта объекта».
 *
 * Что делает: читает у карточки в обеих панелях витрины то, что скриншот
 * на общем плане не показывает — текст метрик после работы алгоритма bidi
 * и реальную геометрию «спила». Плюс снимает карточку крупно.
 * Запуск: npm run build:ui && node scripts/verify-card.mjs
 */
import { chromium } from 'playwright';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { serveDist } from './lib/serve-dist.mjs';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '../docs/evidence/f1');

const { server, url } = await serveDist();
const browser = await chromium.launch();

try {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: 2,
  });
  const tab = await context.newPage();
  await tab.goto(url('__ui/'), { waitUntil: 'networkidle' });

  for (const dir of ['ltr', 'rtl']) {
    const data = await tab.evaluate((d) => {
      const card = document.querySelector(`[dir="${d}"] .card`);
      const figure = card?.querySelector('.card__figure');
      const metrics = Array.from(
        document.querySelectorAll(`[dir="${d}"] .card__metric`),
      ).map((m) => `${m.querySelector('dt')?.textContent}=${m.querySelector('dd')?.textContent}`);

      return {
        clipPath: figure ? getComputedStyle(figure).clipPath : null,
        // ВНИМАНИЕ: textContent — это порядок DOM, а НЕ визуальный порядок.
        // Bidi-дефект им не доказать (BUG-0005): строка читается одинаково
        // и до, и после фикса. Здесь это только для сверки состава метрик;
        // визуальное доказательство — снимок card-*.png ниже.
        metrics,
      };
    }, dir);

    console.log(`\n${dir.toUpperCase()}`);
    console.log(`  clip-path: ${data.clipPath}`);
    console.log(`  метрики:   ${data.metrics.join(' | ')}`);

    await tab
      .locator(`[dir="${dir}"] .card`)
      .first()
      .screenshot({ path: join(OUT, `card-${dir}.png`) });
  }

  // Диммер: в hero-подобном блоке фильтра быть не должно (DEC-0005).
  const darkContext = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    colorScheme: 'dark',
  });
  const darkTab = await darkContext.newPage();
  await darkTab.goto(url('__ui/'), { waitUntil: 'networkidle' });

  const filters = await darkTab.evaluate(() => ({
    dimmed: getComputedStyle(document.querySelector('.photo-dim img')).filter,
    heroLike: getComputedStyle(document.querySelector('[data-hero-like] img')).filter,
  }));
  console.log(`\nтёмная тема · photo-dim: ${filters.dimmed}`);
  console.log(`тёмная тема · как в hero: ${filters.heroLike}`);

  await darkTab.locator('[dir="ltr"] .card').first().screenshot({
    path: join(OUT, 'card-ltr-dark.png'),
  });

  await darkContext.close();
  await context.close();
} finally {
  await browser.close();
  server.close();
}
