/**
 * Бюджеты ассетов. Падает — билд в CI красный (бриф §10, протокол §9).
 *
 * F0: только сабсеты шрифта (≤40 КБ каждый) — это критерий гейта F0.
 * Дальше сюда добавляются бюджеты изображений (sharp, F2–F3) и JS.
 */
import { readdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const BUDGETS = [
  {
    label: 'сабсет шрифта',
    dir: join(ROOT, 'src/styles/fonts'),
    match: /\.woff2$/,
    maxKb: 40,
    /** Ожидаемый состав: лишний сабсет — тоже нарушение бюджета страницы. */
    expected: [
      'rubik-hebrew-wght-normal.woff2',
      'rubik-cyrillic-wght-normal.woff2',
      'rubik-latin-wght-normal.woff2',
    ],
  },
];

let failed = false;

for (const budget of BUDGETS) {
  const files = readdirSync(budget.dir).filter((f) => budget.match.test(f));

  for (const file of files.sort()) {
    const kb = statSync(join(budget.dir, file)).size / 1024;
    const ok = kb <= budget.maxKb;
    if (!ok) failed = true;
    console.log(`${ok ? '✓' : '✗'} ${file.padEnd(34)} ${kb.toFixed(1).padStart(6)} КБ / ${budget.maxKb} КБ`);
  }

  if (budget.expected) {
    const extra = files.filter((f) => !budget.expected.includes(f));
    const missing = budget.expected.filter((f) => !files.includes(f));
    for (const f of extra) {
      failed = true;
      console.error(`✗ лишний ${budget.label}: ${f} — проектом не используется`);
    }
    for (const f of missing) {
      failed = true;
      console.error(`✗ отсутствует ${budget.label}: ${f}`);
    }
  }
}

if (failed) {
  console.error('\nБюджеты нарушены — сборка остановлена.');
  process.exit(1);
}

console.log('✓ бюджеты в норме');
