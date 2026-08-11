/**
 * Пользовательские сценарии: сайт проходят как человек, а не как страницы.
 *
 * Что делает: играет сквозные пути по собранному `dist/` — поиск работы,
 * клавиатурный обход, панель доступности «включить всё», пустое состояние
 * фильтра и monkey-тест. Каждый сценарий идёт на трёх языках и в двух темах.
 * Запуск: npm run scenarios
 *
 * ЧЕМ ЭТО ОТЛИЧАЕТСЯ ОТ `polish:pages`. Полировка проверяет страницы по одной
 * и по чек-листу: у каждой ли кнопки есть имя, нет ли горизонтальной прокрутки.
 * Она не заметит, что путь «главная → работы → фильтр → карточка» обрывается
 * на третьем шаге, потому что каждая страница по отдельности исправна.
 *
 * ПОЧЕМУ ДВЕ ТЕМЫ. Тёмная тема — не перекраска: контраст, тени и рамки в ней
 * задаются другими токенами, и элемент, видимый в светлой, может исчезнуть
 * в тёмной. Проверять одну — значит проверять половину.
 *
 * ЧЕГО ЭТОТ ПРОГОН НЕ ДЕЛАЕТ (кодекс §6). Он не отправляет форму на настоящий
 * Worker: адрес в сборке — production, и слать туда мусор нельзя. Ветки ответов
 * 429/500/offline покрыты отдельно, тестами Worker'а на моках.
 */
import { ENGINES } from './lib/engines.mjs';
import { serveDist } from './lib/serve-dist.mjs';

const LOCALES = [
  { code: 'he', prefix: '', dir: 'rtl' },
  { code: 'ru', prefix: 'ru/', dir: 'ltr' },
  { code: 'en', prefix: 'en/', dir: 'ltr' },
];

const THEMES = ['light', 'dark'];

const results = [];
const problems = [];
let CONTEXT = '';

const check = (ok, what, detail = '') => {
  results.push(ok);
  if (!ok) problems.push(`${CONTEXT} · ${what}${detail ? ` — ${detail}` : ''}`);
};

const { server, url } = await serveDist();

/** Тема ставится до первой отрисовки: иначе меряем светлую и записываем как тёмную. */
async function openPage(browser, theme) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await context.addInitScript(`document.documentElement.dataset.theme = ${JSON.stringify(theme)};`);
  return { context, page: await context.newPage() };
}

const consoleErrors = (page, sink) => {
  page.on('console', (message) => {
    if (message.type() === 'error') sink.push(message.text());
  });
  page.on('pageerror', (error) => sink.push(String(error)));
};

for (const engine of ENGINES) {
  const browser = await engine.launcher.launch();

  for (const locale of LOCALES) {
    for (const theme of THEMES) {
      CONTEXT = `[${engine.name} · ${locale.code} · ${theme}]`;
      const home = `${url}${locale.prefix}`;

      // ── Сценарий 1: человек ищет работу и доходит до связи ────────────────
      {
        const { context, page } = await openPage(browser, theme);
        const errors = [];
        consoleErrors(page, errors);

        await page.goto(home, { waitUntil: 'networkidle' });
        check(
          (await page.locator('html').getAttribute('dir')) === locale.dir,
          'направление документа соответствует языку',
        );

        const toPortfolio = page.locator('nav a[href*="portfolio"], nav a[href*="avodot"]').first();
        check(await toPortfolio.isVisible(), 'из шапки есть путь к работам');
        await toPortfolio.click();
        await page.waitForLoadState('networkidle');

        const cards = page.locator('[data-work]');
        const total = await cards.count();
        check(total > 0, 'на странице работ есть карточки', `найдено ${total}`);

        const firstLink = cards.first().locator('a').first();
        check(await firstLink.isVisible(), 'карточка ведёт в паспорт');
        await firstLink.click();
        await page.waitForLoadState('networkidle');

        check((await page.locator('h1').count()) === 1, 'в паспорте ровно один H1');
        check(
          (await page.locator('img').count()) >= 3,
          'в паспорте показаны кадры работы',
        );

        const whatsapp = page.locator('a[href*="wa.me"]').first();
        check(await whatsapp.count() > 0, 'с паспорта есть путь в WhatsApp');

        check(errors.length === 0, 'консоль чиста на всём пути', errors.slice(0, 2).join(' | '));
        await context.close();
      }

      // ── Сценарий 2: клавиатурный обход без мыши ───────────────────────────
      {
        const { context, page } = await openPage(browser, theme);
        await page.goto(home, { waitUntil: 'networkidle' });

        let reached = 0;
        let invisibleFocus = 0;
        for (let i = 0; i < 25; i += 1) {
          await page.keyboard.press('Tab');
          const state = await page.evaluate(() => {
            const el = document.activeElement;
            if (!el || el === document.body) return null;
            const style = getComputedStyle(el);
            const box = el.getBoundingClientRect();
            return {
              tag: el.tagName,
              hidden: style.visibility === 'hidden' || style.display === 'none',
              sized: box.width > 0 && box.height > 0,
              outline: style.outlineStyle !== 'none' || style.boxShadow !== 'none',
            };
          });
          if (!state) continue;
          reached += 1;
          if (state.hidden || !state.sized) invisibleFocus += 1;
        }

        check(reached > 5, 'клавиатура доходит до элементов управления', `${reached} остановок`);
        check(invisibleFocus === 0, 'фокус не уходит в невидимый элемент', `${invisibleFocus} шт.`);
        await context.close();
      }

      // ── Сценарий 3: панель доступности «включить всё» ─────────────────────
      {
        const { context, page } = await openPage(browser, theme);
        const errors = [];
        consoleErrors(page, errors);
        await page.goto(home, { waitUntil: 'networkidle' });

        const opener = page.locator('[data-a11y-open], [aria-controls*="a11y"]').first();
        if ((await opener.count()) > 0) {
          await opener.click();
          const toggles = page.locator('[data-a11y-panel] input[type="checkbox"]');
          const count = await toggles.count();
          for (let i = 0; i < count; i += 1) {
            await toggles.nth(i).check({ force: true }).catch(() => {});
          }
          check(count > 0, 'панель доступности отдаёт режимы', `${count} шт.`);

          const overflow = await page.evaluate(
            () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
          );
          check(overflow <= 1, 'со всеми режимами нет горизонтальной прокрутки', `${overflow}px`);
          check(errors.length === 0, 'режимы не роняют скрипт', errors.slice(0, 2).join(' | '));
        } else {
          check(false, 'кнопка панели доступности найдена');
        }
        await context.close();
      }

      // ── Сценарий 4: фильтр без результатов объясняет себя ─────────────────
      {
        const { context, page } = await openPage(browser, theme);
        await page.goto(`${url}${locale.prefix}portfolio/?type=canopy&material=metal`, {
          waitUntil: 'networkidle',
        });
        const visible = await page.locator('[data-work]:visible').count();
        const text = (await page.locator('main').innerText()).trim();
        check(text.length > 40, 'пустой результат не оставляет пустое место', `${visible} карточек`);
        await context.close();
      }

      // ── Сценарий 5: monkey — случайные тычки, консоль обязана молчать ─────
      {
        const { context, page } = await openPage(browser, theme);
        const errors = [];
        consoleErrors(page, errors);
        await page.goto(home, { waitUntil: 'networkidle' });

        const targets = await page.locator('a, button, [role="button"], summary').all();
        // Детерминированный «случай»: шаг по простому числу, чтобы прогон
        // повторялся. Случайность, которую нельзя воспроизвести, находит баг
        // ровно один раз и больше никогда.
        for (let i = 0; i < Math.min(targets.length, 20); i += 1) {
          const target = targets[(i * 7) % targets.length];
          await target.click({ timeout: 1500, trial: false }).catch(() => {});
          await page.goto(home, { waitUntil: 'domcontentloaded' }).catch(() => {});
        }
        check(errors.length === 0, 'monkey не поднял ошибок в консоли', errors.slice(0, 3).join(' | '));
        await context.close();
      }
    }
  }

  await browser.close();
}

server.close();

const failed = results.filter((ok) => !ok).length;
console.log(`\nСценарных проверок: ${results.length}, провалено: ${failed}`);
if (problems.length > 0) {
  console.error('\nНаходки:');
  for (const problem of problems) console.error(`  · ${problem}`);
  process.exit(1);
}
console.log('✓ сценарии проходят на трёх движках, трёх языках и в двух темах');
