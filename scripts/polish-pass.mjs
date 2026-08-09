/**
 * Полировочный проход — чек-лист edge-cases из QUALITY_DOCTRINE §4.
 *
 * Что делает: раздаёт собранный `dist/` (см. lib/serve-dist.mjs) и прогоняет по
 * страницам проверки, которые обычная сборка не ловит: отключённый JS,
 * клавиатурная навигация, узкий вьюпорт, очень длинные строки, reduced-motion,
 * иврит и RTL.
 * Запуск: npm run polish  (сборка выполняется сама)
 *
 * Проверяется собранный dist, а не живой сайт: полировка идёт ДО деплоя.
 */
import { chromium } from 'playwright';
import { serveDist } from './lib/serve-dist.mjs';

const results = [];
const say = (ok, text, detail = '') => {
  results.push({ ok, text, detail });
  console.log(`${ok ? '✓' : '✗'} ${text}${detail ? `  — ${detail}` : ''}`);
};

const { server, url } = await serveDist();
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

  // ── 6. Витрина F1. Проверки включаются только если она есть в dist:
  //       production-сборка их не касается (DEC-0011).
  const showcase = await fetch(url('__ui/'));
  if (!showcase.ok) {
    console.log('· витрина в dist отсутствует — проверки F1 пропущены (это норма для production)');
  } else {
    // 6.1 Клавиатура: каждый интерактив достижим и имеет видимое кольцо.
    {
      const context = await browser.newContext();
      const tab = await context.newPage();
      await tab.goto(url('__ui/'), { waitUntil: 'networkidle' });

      const audit = await tab.evaluate(() => {
        const nodes = Array.from(
          document.querySelectorAll('a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])'),
        );
        const noRing = [];
        for (const node of nodes) {
          node.focus();
          const s = getComputedStyle(node);
          if (s.outlineStyle === 'none' || parseFloat(s.outlineWidth) < 2) {
            noRing.push(node.textContent?.trim().slice(0, 24) || node.tagName.toLowerCase());
          }
        }
        return { total: nodes.length, noRing };
      });

      say(
        audit.noRing.length === 0,
        `клавиатура · кольцо видно на всех ${audit.total} интерактивах витрины`,
        audit.noRing.length ? `без кольца: ${audit.noRing.join(', ')}` : '',
      );

      // Отключённая кнопка не должна попадать в обход табом.
      const disabledFocusable = await tab.evaluate(() => {
        const el = document.querySelector('button[disabled]');
        if (!el) return null;
        el.focus();
        return document.activeElement === el;
      });
      say(disabledFocusable === false, 'клавиатура · отключённая кнопка не получает фокус');

      await context.close();
    }

    // 6.1b Доступные имена: у каждого интерактива имя непустое (Норма А).
    {
      const context = await browser.newContext();
      const tab = await context.newPage();
      await tab.goto(url('__ui/'), { waitUntil: 'networkidle' });

      const audit = await tab.evaluate(() => {
        // Тот же порядок, что у скринридера: label → labelledby → текст → title.
        const accessibleName = (el) => {
          const byLabel = el.getAttribute('aria-label')?.trim();
          if (byLabel) return byLabel;
          // Поля формы называются элементом <label for> или обрамляющим <label>.
          // Пропустить это — значит объявить нарушением корректную разметку.
          if (el.id) {
            const forLabel = document.querySelector(`label[for="${el.id}"]`)?.textContent?.trim();
            if (forLabel) return forLabel;
          }
          const wrapping = el.closest('label')?.textContent?.trim();
          if (wrapping) return wrapping;
          const ref = el.getAttribute('aria-labelledby');
          if (ref) {
            const parts = ref
              .split(/\s+/)
              .map((id) => document.getElementById(id)?.textContent?.trim() ?? '')
              .filter(Boolean);
            if (parts.length) return parts.join(' ');
          }
          const text = el.textContent?.trim();
          if (text) return text;
          return el.getAttribute('title')?.trim() ?? '';
        };

        const nodes = Array.from(
          document.querySelectorAll('a[href], button, input, select, textarea, [role="button"]'),
        );
        const nameless = [];
        const doubled = [];

        for (const node of nodes) {
          const name = accessibleName(node);
          if (!name) {
            nameless.push(node.outerHTML.slice(0, 70));
            continue;
          }
          // Двойная озвучка: описание дословно повторяет имя.
          const described = node.getAttribute('aria-describedby');
          if (described) {
            const desc = described
              .split(/\s+/)
              .map((id) => document.getElementById(id)?.textContent?.trim() ?? '')
              .join(' ');
            if (desc && desc === name) doubled.push(name);
          }
        }
        return { total: nodes.length, nameless, doubled };
      });

      say(
        audit.nameless.length === 0,
        `доступные имена · все ${audit.total} интерактивов названы`,
        audit.nameless.length ? `без имени: ${audit.nameless.join(' | ')}` : '',
      );
      say(
        audit.doubled.length === 0,
        'доступные имена · нет двойной озвучки (описание не повторяет имя)',
        audit.doubled.length ? audit.doubled.join(', ') : '',
      );
      await context.close();
    }

    // 6.1c Подсказка: клавиатура, Esc, hoverable, persistent (WCAG 1.4.13).
    {
      const context = await browser.newContext();
      const tab = await context.newPage();
      await tab.goto(url('__ui/'), { waitUntil: 'networkidle' });

      const target = tab.locator('[data-tooltip] button').first();
      await target.focus();
      const openedOnFocus = await tab.evaluate(
        () => document.querySelector('[data-tooltip][data-open]') !== null,
      );
      say(openedOnFocus, 'подсказка · открывается по клавиатурному фокусу без задержки');

      await tab.waitForTimeout(1200);
      const stillOpen = await tab.evaluate(
        () => document.querySelector('[data-tooltip][data-open]') !== null,
      );
      say(stillOpen, 'подсказка · persistent: сама по таймеру не исчезает');

      await tab.keyboard.press('Escape');
      const closed = await tab.evaluate(
        () => document.querySelector('[data-tooltip][data-open]') === null,
      );
      const focusKept = await tab.evaluate(
        () => document.activeElement?.closest('[data-tooltip]') !== null,
      );
      say(closed, 'подсказка · dismissible: Escape закрывает');
      say(focusKept, 'подсказка · Escape не уводит фокус с цели');

      const overlap = await tab.evaluate(() => {
        const root = document.querySelector('[data-tooltip]');
        if (!root) return null;
        root.setAttribute('data-open', 'true');
        const t = root.querySelector('.tt__target').getBoundingClientRect();
        const b = root.querySelector('.tt__bubble').getBoundingClientRect();
        return !(b.bottom <= t.top || b.top >= t.bottom);
      });
      say(overlap === false, 'подсказка · не накрывает собственную цель');

      await context.close();
    }

    // 6.2 Узкий вьюпорт: витрина не порождает горизонтальную прокрутку,
    //     а цели sticky-панели остаются достаточно крупными.
    {
      const context = await browser.newContext({ viewport: { width: 320, height: 640 } });
      const tab = await context.newPage();
      await tab.goto(url('__ui/'), { waitUntil: 'networkidle' });

      const state = await tab.evaluate(() => {
        const doc = document.documentElement;
        const targets = Array.from(document.querySelectorAll('.channels__item')).map((n) => {
          const r = n.getBoundingClientRect();
          return Math.min(r.width, r.height);
        });
        return { doc: doc.scrollWidth, client: doc.clientWidth, targets };
      });

      say(
        state.doc <= state.client,
        '320px · витрина без горизонтальной прокрутки',
        `scrollWidth ${state.doc} ≤ clientWidth ${state.client}`,
      );
      say(
        state.targets.length > 0 && state.targets.every((t) => t >= 44),
        '320px · цели sticky-панели ≥44px по короткой стороне',
        `минимум ${Math.min(...state.targets).toFixed(0)}px из ${state.targets.length}`,
      );
      await context.close();
    }

    // 6.3 Диммер фото строго опт-ин: в hero-подобном блоке фильтра нет (DEC-0005).
    {
      const context = await browser.newContext({ colorScheme: 'dark' });
      const tab = await context.newPage();
      await tab.goto(url('__ui/'), { waitUntil: 'networkidle' });

      const filters = await tab.evaluate(() => ({
        dimmed: getComputedStyle(document.querySelector('.photo-dim img')).filter,
        heroLike: getComputedStyle(document.querySelector('[data-hero-like] img')).filter,
      }));

      say(filters.dimmed !== 'none', 'тёмная тема · photo-dim приглушает', filters.dimmed);
      say(filters.heroLike === 'none', 'тёмная тема · в hero-подобном блоке фильтра нет', filters.heroLike);
      await context.close();
    }

    // 6.4 Без JS витрина остаётся читаемой (значения токенов подставляет скрипт —
    //     их отсутствие ожидаемо,а разметка обязана остаться целой).
    {
      const context = await browser.newContext({ javaScriptEnabled: false });
      const tab = await context.newPage();
      await tab.goto(url('__ui/'), { waitUntil: 'load' });
      const ok = await tab.evaluate(
        () => document.querySelectorAll('.card').length > 0 && Boolean(document.querySelector('h1')),
      );
      say(ok, 'без JS · витрина рендерится, карточки на месте');
      await context.close();
    }
  }
} finally {
  await browser.close();
  server.close();
}

const failed = results.filter((r) => !r.ok).length;
console.log(`\nПолировочный проход: ${results.length - failed}/${results.length}`);
if (failed > 0) process.exit(1);
