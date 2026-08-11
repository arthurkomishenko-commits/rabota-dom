/**
 * Проверка анимационной системы: обещания F5 измеряются, а не объявляются.
 *
 * Что делает: открывает страницу со сборками в трёх режимах и проверяет
 * четыре утверждения, каждое из которых иначе осталось бы словами:
 *
 *   1. Содержимое видно БЕЗ движения. Финальное состояние лежит в вёрстке,
 *      поэтому при отключённом JS блоки остаются на месте и видимы.
 *   2. `prefers-reduced-motion` показывает финал СРАЗУ. Не «не анимирует»,
 *      а показывает тот же кадр: человек, попросивший меньше движения,
 *      не должен получить меньше содержимого.
 *   3. Уход со страницы не оставляет живых ScrollTrigger'ов.
 *   4. Движение не роняет консоль.
 *
 * Запуск: npm run check:motion — после сборки.
 *
 * ПОЧЕМУ ПУНКТ 1 ПЕРВЫЙ. Это единственное, что защищает содержимое от отказа
 * скрипта, и ровно на этом уже дважды ловились: BUG-0010 (без JS три H1)
 * и BUG-0017 (кнопка без имени до выполнения скрипта). Анимация — третий
 * повод повторить ту же ошибку, и здесь она проверяется машинно.
 */
import { ENGINES } from './lib/engines.mjs';
import { serveDist } from './lib/serve-dist.mjs';

const PAGES = ['', 'ru/', 'en/'];

const results = [];
const problems = [];

const check = (ok, what, detail = '') => {
  results.push(ok);
  if (!ok) problems.push(`${what}${detail ? ` — ${detail}` : ''}`);
};

const { server, url } = await serveDist();

/** Видимость по факту раскладки, а не по наличию узла в DOM. */
const VISIBLE = `(() => {
  const marked = Array.from(document.querySelectorAll('[data-reveal]'));
  if (marked.length === 0) return { marked: 0, visible: 0 };
  const visible = marked.filter((el) => {
    const style = getComputedStyle(el);
    const box = el.getBoundingClientRect();
    return style.visibility !== 'hidden' && Number(style.opacity) > 0.99
      && box.width > 0 && box.height > 0;
  });
  return { marked: marked.length, visible: visible.length };
})()`;

for (const engine of ENGINES) {
  const browser = await engine.launcher.launch();

  for (const path of PAGES) {
    const label = `[${engine.name} /${path}]`;

    // ── 1. Без JS содержимое на месте ────────────────────────────────────
    {
      const context = await browser.newContext({ javaScriptEnabled: false });
      const page = await context.newPage();
      await page.goto(url(path), { waitUntil: 'load' });
      const state = await page.evaluate(VISIBLE);
      check(
        state.marked === 0 || state.visible === state.marked,
        `${label} без JS помеченные блоки видны`,
        `${state.visible}/${state.marked}`,
      );
      await context.close();
    }

    // ── 2. Меньше движения — тот же кадр, сразу ───────────────────────────
    {
      const context = await browser.newContext({ reducedMotion: 'reduce' });
      const page = await context.newPage();
      await page.goto(url(path), { waitUntil: 'networkidle' });
      const state = await page.evaluate(VISIBLE);
      check(
        state.marked === 0 || state.visible === state.marked,
        `${label} reduced-motion показывает финал сразу`,
        `${state.visible}/${state.marked}`,
      );
      await context.close();
    }

    // ── 3. С включённым движением содержимое НЕ спрятано ──────────────────
    // Проверка, которой не хватало и которая пропустила BUG-0020: прежние
    // два случая смотрели страницу без JS и с «меньше движения», то есть
    // ровно там, где анимации нет. Обычный случай — скрипт работает,
    // движение активно — не проверялся вовсе, и на живом сайте две секции
    // висели пустыми до первой прокрутки.
    {
      const context = await browser.newContext();
      const page = await context.newPage();
      await page.goto(url(path), { waitUntil: 'networkidle' });
      await page.evaluate(`new Promise((resolve) => {
        if (window.__motion) return resolve(true);
        document.addEventListener('motion:ready', () => resolve(true), { once: true });
        setTimeout(() => resolve(false), 5000);
      })`);
      await page.waitForTimeout(400);

      const hidden = await page.evaluate(`(() => {
        const out = [];
        for (const el of document.querySelectorAll('[data-reveal]')) {
          if (Number(getComputedStyle(el).opacity) < 0.99) out.push(el.className || el.tagName);
        }
        return out;
      })()`);

      check(
        hidden.length === 0,
        `${label} с включённым движением ничего не спрятано до прокрутки`,
        hidden.join(', '),
      );
      await context.close();
    }

    // ── 4. Уборка и чистая консоль ────────────────────────────────────────
    {
      const context = await browser.newContext();
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', (error) => errors.push(String(error)));
      page.on('console', (message) => {
        if (message.type() === 'error') errors.push(message.text());
      });
      await page.goto(url(path), { waitUntil: 'networkidle' });

      /*
       * Движение грузится лениво (BUG-0019), поэтому его надо разбудить
       * и ДОЖДАТЬСЯ — иначе проверка измерит страницу, на которой сцены
       * ещё нет, и объявит уборку безупречной по факту отсутствия.
       */
      await page.evaluate(`new Promise((resolve) => {
        if (window.__motion) return resolve(true);
        document.addEventListener('motion:ready', () => resolve(true), { once: true });
        window.dispatchEvent(new Event('scroll'));
        setTimeout(() => resolve(false), 5000);
      })`);

      /*
       * Считаем триггеры ДО и ПОСЛЕ уборки. Одного «после» мало: ноль после
       * уборки на странице, где движения и не было, ничего не доказывает.
       */
      const counts = await page.evaluate(`(() => {
        const stage = window.__motion;
        if (!stage) return { before: -1, after: -1 };
        const before = stage.liveTriggers();
        stage.destroy();
        return { before, after: stage.liveTriggers() };
      })()`);

      if (counts.before === -1) {
        check(true, `${label} сцены на странице нет — проверять уборку нечего`);
      } else {
        check(counts.before > 0, `${label} сцена действительно создала триггеры`, `${counts.before}`);
        check(counts.after === 0, `${label} после уборки живых триггеров нет`, `${counts.after}`);
      }
      check(errors.length === 0, `${label} движение не роняет консоль`, errors.slice(0, 2).join(' | '));
      await context.close();
    }
  }

  await browser.close();
}

server.close();

const failed = results.filter((ok) => !ok).length;
console.log(`\nПроверок движения: ${results.length}, провалено: ${failed}`);
if (problems.length > 0) {
  console.error('\nНаходки:');
  for (const problem of problems) console.error(`  · ${problem}`);
  process.exit(1);
}
console.log('✓ анимационная система: содержимое не зависит от скрипта, уборка полная');
