/**
 * Пересинхронизация сабсетов Rubik из @fontsource-variable/rubik в репозиторий.
 *
 * Шрифты лежат в src/styles/fonts/ (self-host, бриф §2), а не тянутся из
 * node_modules во время сборки: так их URL проходит через Vite и получает
 * хэш и base автоматически, а состав сабсетов зафиксирован в истории.
 *
 * Запускать после обновления пакета:  npm run fonts:sync
 * Скрипт падает, если сабсет превысил бюджет 40 КБ (бриф §2, §10).
 */
import { copyFileSync, mkdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'node_modules/@fontsource-variable/rubik/files');
const DEST = join(ROOT, 'src/styles/fonts');

/** Только эти сабсеты. Arabic и italic проекту не нужны. */
const SUBSETS = ['hebrew', 'cyrillic', 'latin'];
const BUDGET_KB = 40;

mkdirSync(DEST, { recursive: true });

let failed = false;
for (const subset of SUBSETS) {
  const file = `rubik-${subset}-wght-normal.woff2`;
  copyFileSync(join(SRC, file), join(DEST, file));

  const kb = statSync(join(DEST, file)).size / 1024;
  const ok = kb <= BUDGET_KB;
  if (!ok) failed = true;
  console.log(`${ok ? '✓' : '✗'} ${file.padEnd(34)} ${kb.toFixed(1)} KB / ${BUDGET_KB} KB`);
}

if (failed) {
  console.error(`\nСабсет превысил бюджет ${BUDGET_KB} КБ — сборка остановлена.`);
  process.exit(1);
}
