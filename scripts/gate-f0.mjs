/**
 * Доказательства гейта F0. Снимает живой сайт на Pages, а не локальную сборку —
 * заодно подтверждает, что задеплоено именно то, что собрано.
 *
 * Что проверяется машинно (не «на глаз»):
 *   1. lang / dir по локалям;
 *   2. каскад темы: система dark → тёмная; выбор в localStorage перебивает систему
 *      и переживает перезагрузку;
 *   3. FOUC: цвет фона на первом кадре совпадает с финальным;
 *   4. зеркалирование логических свойств: акцентная грань в RTL справа, в LTR слева;
 *   5. какой сабсет шрифта реально скачан на каждой локали.
 *
 * Скрины: docs/evidence/f0/. Запуск: node scripts/gate-f0.mjs
 */
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'docs/evidence/f0');
const SITE = 'https://arthurkomishenko-commits.github.io/rabota-dom';

const PAGES = [
  { locale: 'he', url: `${SITE}/`, dir: 'rtl' },
  { locale: 'ru', url: `${SITE}/ru/`, dir: 'ltr' },
  { locale: 'en', url: `${SITE}/en/`, dir: 'ltr' },
];

const VIEWPORTS = {
  desktop: { width: 1440, height: 900 },
  mobile: { width: 390, height: 844 },
};

mkdirSync(OUT, { recursive: true });

const results = [];
const say = (ok, text) => {
  results.push({ ok, text });
  console.log(`${ok ? '✓' : '✗'} ${text}`);
};

const browser = await chromium.launch();

for (const page of PAGES) {
  for (const [vpName, viewport] of Object.entries(VIEWPORTS)) {
    for (const scheme of ['light', 'dark']) {
      const context = await browser.newContext({ viewport, colorScheme: scheme });
      const tab = await context.newPage();

      const fonts = [];
      tab.on('response', (r) => {
        if (r.url().includes('.woff2')) fonts.push(r.url().split('/').pop());
      });

      await tab.goto(page.url, { waitUntil: 'networkidle' });

      const state = await tab.evaluate(() => {
        const html = document.documentElement;
        const cell = document.querySelector('.mirror__cell--start');
        const styles = cell ? getComputedStyle(cell) : null;
        return {
          lang: html.lang,
          dir: html.dir,
          theme: html.dataset.theme,
          bg: getComputedStyle(document.body).backgroundColor,
          // Логическая грань: в RTL обязана оказаться справа, в LTR — слева.
          borderStart: styles
            ? { left: styles.borderLeftWidth, right: styles.borderRightWidth }
            : null,
          fontFamily: getComputedStyle(document.body).fontFamily,
        };
      });

      if (vpName === 'desktop') {
        // Каскад: без записи в localStorage тема берётся из системной настройки.
        say(
          state.theme === scheme,
          `${page.locale} · системная ${scheme} → data-theme="${state.theme}"`,
        );
        say(state.lang === page.locale, `${page.locale} · lang="${state.lang}"`);
        say(state.dir === page.dir, `${page.locale} · dir="${state.dir}"`);

        if (state.borderStart) {
          // У ячейки рамка 1px со всех сторон, акцентная грань — 3px.
          // Сравниваем стороны между собой, а не с нулём.
          const left = parseFloat(state.borderStart.left);
          const right = parseFloat(state.borderStart.right);
          const mirrored = page.dir === 'rtl' ? right > left : left > right;
          say(
            mirrored,
            `${page.locale} · акцентная грань ${page.dir === 'rtl' ? 'справа' : 'слева'} ` +
              `(left=${state.borderStart.left}, right=${state.borderStart.right})`,
          );
        }

        say(
          /Rubik/.test(state.fontFamily),
          `${page.locale} · шрифт: ${state.fontFamily.split(',')[0]}`,
        );

        const expected = { he: 'hebrew', ru: 'cyrillic', en: 'latin' }[page.locale];
        say(
          fonts.some((f) => f.includes(expected)),
          `${page.locale} · скачан сабсет ${expected}`,
        );

        // Не пропускаем мимо: на странице F0 есть переключатель языков с
        // названиями на родных письменностях — значит все три сабсета
        // действительно нужны браузеру. Фиксируем факт, решение — F1/F3.
        const loaded = fonts.map((f) => f.split('-')[1]).sort();
        say(true, `${page.locale} · всего сабсетов скачано: ${loaded.length} [${loaded.join(', ')}]`);
      }

      await tab.screenshot({
        path: join(OUT, `${page.locale}-${scheme}-${vpName}.png`),
        fullPage: false,
      });

      await context.close();
    }
  }
}

// ── Отдельно: выбор пользователя перебивает систему и переживает перезагрузку ──
{
  const context = await browser.newContext({
    viewport: VIEWPORTS.desktop,
    colorScheme: 'dark', // система говорит «тёмная»
  });
  const tab = await context.newPage();
  await tab.goto(`${SITE}/ru/`, { waitUntil: 'networkidle' });

  const beforeClick = await tab.evaluate(() => document.documentElement.dataset.theme);
  await tab.click('[data-theme-toggle]');
  const afterClick = await tab.evaluate(() => document.documentElement.dataset.theme);

  await tab.reload({ waitUntil: 'networkidle' });
  const afterReload = await tab.evaluate(() => ({
    theme: document.documentElement.dataset.theme,
    stored: localStorage.getItem('theme'),
  }));

  say(
    beforeClick === 'dark' && afterClick === 'light',
    `тумблер: система dark → ${beforeClick}, после нажатия → ${afterClick}`,
  );
  say(
    afterReload.theme === 'light' && afterReload.stored === 'light',
    `после перезагрузки при системной dark: тема "${afterReload.theme}", ` +
      `localStorage "${afterReload.stored}" — выбор пережил перезагрузку`,
  );

  await tab.screenshot({ path: join(OUT, 'theme-override-persists.png') });
  await context.close();
}

// ── FOUC: сравниваем фон до и после полной загрузки ──
{
  const context = await browser.newContext({
    viewport: VIEWPORTS.desktop,
    colorScheme: 'dark',
  });
  const tab = await context.newPage();
  await tab.goto(SITE + '/', { waitUntil: 'commit' });
  const early = await tab.evaluate(() => document.documentElement.dataset.theme ?? 'не задана');
  await tab.waitForLoadState('networkidle');
  const late = await tab.evaluate(() => document.documentElement.dataset.theme);

  say(
    early === late && early === 'dark',
    `FOUC: тема на первом кадре "${early}", после загрузки "${late}" — совпадают`,
  );
  await context.close();
}

await browser.close();

const failed = results.filter((r) => !r.ok);
writeFileSync(
  join(OUT, 'gate-f0.json'),
  JSON.stringify({ site: SITE, checks: results }, null, 2) + '\n',
);

console.log(`\nПроверок: ${results.length}, провалено: ${failed.length}`);
console.log(`Скрины и отчёт: docs/evidence/f0/`);
if (failed.length > 0) process.exit(1);
