/**
 * Измерение контраста пар токенов по WCAG 2.x. Падает — билд красный.
 *
 * Что делает: читает значения ИЗ `src/styles/variables.css` (а не из копии
 * в скрипте — копия однажды разойдётся) и считает коэффициент контраста для
 * пар, которые реально встречаются на странице.
 * Запуск: npm run check:contrast
 *
 * Пороги WCAG 2.1 AA — требование Израиля (бриф §10):
 *   4.5 : 1  обычный текст
 *   3.0 : 1  крупный текст (≥18.66px bold или ≥24px) и нетекстовые элементы
 *            (границы, фокус-кольца, иконки) — 1.4.11
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CSS = readFileSync(join(ROOT, 'src/styles/variables.css'), 'utf8');
const GLOBAL = readFileSync(join(ROOT, 'src/styles/global.css'), 'utf8');

/**
 * Режим «усиленный контраст» — отдельный вариант токенов (Норма Б, бриф §15).
 * Он обязан проходить ту же измеримую проверку, что и обычная тема: иначе
 * «усиление» остаётся словом на кнопке. Значения читаются из global.css,
 * то есть из реализации, а не из копии в этом скрипте.
 */
function a11yBlock(selector) {
  const block = GLOBAL.split(selector)[1]?.split('}')[0] ?? '';
  const pick = (name) => block.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{3,8})`))?.[1];
  return {
    bg: pick('bg'),
    surface: pick('surface'),
    'text-main': pick('text-main'),
    'text-muted': pick('text-muted'),
    'border-metal': pick('border-metal'),
    'accent-text': pick('accent-text'),
    'accent-wood': pick('accent-wood'),
  };
}

const A11Y_VARIANTS = [
  { label: 'усиленный контраст · светлая', tokens: a11yBlock("[data-a11y-contrast='on'] {") },
  {
    label: 'усиленный контраст · тёмная',
    tokens: a11yBlock("[data-a11y-contrast='on'][data-theme='dark'] {"),
  },
];

/** Достаёт `--имя: #hex;` из источника токенов. */
function token(name) {
  const match = CSS.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{3,8})`));
  if (!match) throw new Error(`токен --${name} не найден в variables.css`);
  return match[1];
}

function toRgb(hex) {
  let h = hex.slice(1);
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
}

/** Относительная яркость, WCAG 2.x. */
function luminance(hex) {
  const [r, g, b] = toRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function ratio(a, b) {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

/**
 * Пары: [описание, передний план, фон, минимум, где встречается].
 *
 * ПОПРАВКА к первой версии этой проверки: она требовала 3:1 от ЛЮБОЙ границы.
 * Это неверно — WCAG 1.4.11 требует 3:1 от того, что необходимо для опознания
 * элемента управления, а декоративная рамка карточки к этому не относится.
 * Порог не ослаблен: он предъявлен там, где действительно применим —
 * к нижней «линии чертежа» поля, которая и опознаёт поле, поскольку заливка
 * поля от страницы почти не отличается. Согласовано с Артуром, DEC-0012.
 */
function pairs(theme) {
  const t = (name) => token(`${theme}-${name}`);
  return [
    // ── обычный текст, 4.5 ──────────────────────────────────────────────
    ['основной текст на фоне', t('text-main'), t('bg'), 4.5, 'вся типографика страницы'],
    ['основной текст на поверхности', t('text-main'), t('surface'), 4.5, 'карточки, поля'],
    ['вторичный текст на фоне', t('text-muted'), t('bg'), 4.5, 'подписи, штамп карточки'],
    ['вторичный текст на поверхности', t('text-muted'), t('surface'), 4.5, 'плейсхолдеры, метрики'],
    ['текст кнопки на её фоне', t('btn-text'), t('btn-bg-active'), 4.5, 'кнопка «матовый алюминий»'],
    ['тег материала: текст на плашке', t('surface'), t('text-main'), 4.5, 'тег на карточке'],
    ['акцентный текст на фоне', t('accent-text'), t('bg'), 4.5, 'ссылки, вторичный CTA'],
    ['акцентный текст на поверхности', t('accent-text'), t('surface'), 4.5, 'ошибка поля, ссылки в карточке'],

    // ── нетекстовые элементы, 3.0 (WCAG 1.4.11) ─────────────────────────
    ['фокус-кольцо на фоне', t('accent-wood'), t('bg'), 3.0, 'кольцо на всех интерактивах'],
    ['фокус-кольцо на поверхности', t('accent-wood'), t('surface'), 3.0, 'кольцо на всех интерактивах'],
    ['линия чертежа поля на поверхности', t('text-muted'), t('surface'), 3.0, 'опознание поля ввода'],
    ['линия чертежа поля в фокусе', t('accent-wood'), t('surface'), 3.0, 'состояние фокуса поля'],
  ];
}

/**
 * Информационные пары: порога нет, но цифру полезно видеть.
 * Декоративная рамка карточки под 1.4.11 не подпадает — она ничего не опознаёт;
 * заливка поля против фона показывает, ПОЧЕМУ опознание повешено на линию.
 */
function informational(theme) {
  const t = (name) => token(`${theme}-${name}`);
  return [
    ['декоративная рамка на поверхности', t('border-metal'), t('surface'), 'рамка карточки'],
    ['заливка поля против фона страницы', t('surface'), t('bg'), 'поэтому опознаёт линия, а не заливка'],
    ['акцент как крупный элемент на фоне', t('accent-wood'), t('bg'), 'кнопки, крупные акценты'],
  ];
}

let failed = 0;
const notes = [];

for (const theme of ['light', 'dark']) {
  console.log(`\n── ${theme === 'light' ? 'светлая' : 'тёмная'} тема ──`);
  for (const [label, fg, bg, min, where] of pairs(theme)) {
    const value = ratio(fg, bg);
    const ok = value >= min;
    if (!ok) {
      failed += 1;
      notes.push(`${theme}: ${label} — ${value.toFixed(2)} при пороге ${min} (${where})`);
    }
    console.log(
      `${ok ? '✓' : '✗'} ${label.padEnd(36)} ${fg} на ${bg}  ${value.toFixed(2)} : 1  (мин ${min})`,
    );
  }

  for (const [label, fg, bg, where] of informational(theme)) {
    console.log(
      `· ${label.padEnd(36)} ${fg} на ${bg}  ${ratio(fg, bg).toFixed(2)} : 1  (справочно — ${where})`,
    );
  }
}

// ── Режимы панели доступности ────────────────────────────────────────────────
for (const variant of A11Y_VARIANTS) {
  const t = variant.tokens;
  if (!t.bg) {
    failed += 1;
    notes.push(`${variant.label}: токены не найдены в global.css`);
    continue;
  }

  console.log(`\n── ${variant.label} ──`);
  const checks = [
    ['основной текст на фоне', t['text-main'], t.bg, 4.5],
    ['вторичный текст на фоне', t['text-muted'], t.bg, 4.5],
    ['акцентный текст на поверхности', t['accent-text'], t.surface, 4.5],
    ['граница как элемент управления', t['border-metal'], t.surface, 3.0],
    ['фокус-кольцо на фоне', t['accent-wood'], t.bg, 3.0],
  ];

  for (const [label, fg, bg, min] of checks) {
    const value = ratio(fg, bg);
    const ok = value >= min;
    if (!ok) {
      failed += 1;
      notes.push(`${variant.label}: ${label} — ${value.toFixed(2)} при пороге ${min}`);
    }
    console.log(
      `${ok ? '✓' : '✗'} ${label.padEnd(36)} ${fg} на ${bg}  ${value.toFixed(2)} : 1  (мин ${min})`,
    );
  }
}

if (failed > 0) {
  console.error(`\nПар ниже порога AA: ${failed}`);
  for (const note of notes) console.error(`  · ${note}`);
  console.error(
    '\nПорог не трогать. Решение — правило употребления или отдельный токен,\n' +
      'и только через Артура с записью в DECISIONS (QUALITY_DOCTRINE §2, §7).',
  );
  process.exit(1);
}

console.log('\n✓ все пары проходят AA');
