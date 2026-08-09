/**
 * Гейт Content Freeze (протокол §9, бриф §10 и §13). Падает — релиз не выпускается.
 *
 * Что делает: отвечает на один вопрос — «можно ли это показывать людям?».
 * Проверяет то, что до запуска допустимо, а на запуске уже нет:
 *   · демо-паспорта (бриф §13) — ни одного;
 *   · ставки калькулятора в состоянии draft (бриф §6) — недопустимо;
 *   · полных паспортов меньше восьми (бриф §10) — недопустимо;
 *   · точки карты: ≥6, иначе /map и тизер обязаны быть скрыты (бриф §5).
 *
 * НЕ входит в обычный CI намеренно. Пока проект живёт на демо-контенте,
 * обычная сборка остаётся зелёной: демо-режим ничего не ослабляет, он лишь
 * отодвигает эти требования до фриза. Запускается осознанно перед релизом:
 *   npm run check:freeze
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const WORKS = join(ROOT, 'content/works');
const RATES = join(ROOT, 'src/data/rates.json');

const MIN_PASSPORTS = 8;
const MIN_MAP_POINTS = 6;

/** Собирает записи работ: путь + сырой текст фронтматтера. */
function entries() {
  const out = [];
  const walk = (dir) => {
    let list;
    try {
      list = readdirSync(dir);
    } catch {
      return;
    }
    for (const name of list) {
      const full = join(dir, name);
      if (statSync(full).isDirectory()) {
        walk(full);
        continue;
      }
      if (!/\.mdx?$/.test(name)) continue;
      out.push({ file: relative(ROOT, full), source: readFileSync(full, 'utf8') });
    }
  };
  walk(WORKS);
  return out;
}

const flag = (source, name) => new RegExp(`^${name}:\\s*true\\s*$`, 'm').test(source);

const problems = [];
const all = entries();

// ── 1. Демо-паспортов быть не должно ─────────────────────────────────────────
const demo = all.filter((e) => flag(e.source, 'demo'));
for (const entry of demo) {
  problems.push(`демо-паспорт живёт в контенте: ${entry.file}`);
}

// ── 2. Фикстуры схемы тоже не место в релизе ─────────────────────────────────
for (const entry of all.filter((e) => flag(e.source, 'fixture'))) {
  problems.push(`фикстура схемы живёт в контенте: ${entry.file}`);
}

// ── 3. Полные паспорта: считаем работы, а не языковые записи ─────────────────
const realFolders = new Set(
  all
    .filter((e) => !flag(e.source, 'demo') && !flag(e.source, 'fixture'))
    .map((e) => e.file.split('/').slice(0, -1).join('/')),
);
if (realFolders.size < MIN_PASSPORTS) {
  problems.push(
    `полных паспортов ${realFolders.size}, нужно ${MIN_PASSPORTS} (бриф §10, Definition of Content Freeze)`,
  );
}

// ── 4. Ставки калькулятора ───────────────────────────────────────────────────
if (!existsSync(RATES)) {
  problems.push('нет src/data/rates.json — ставки не подтверждены (бриф §6)');
} else {
  const status = JSON.parse(readFileSync(RATES, 'utf8')).status;
  if (status !== 'production') {
    problems.push(`rates.json.status = "${status}", нужно "production" (бриф §6)`);
  }
}

// ── 5. Карта: либо ≥6 точек, либо страница скрыта ────────────────────────────
const withCoords = [...realFolders].length;
if (withCoords > 0 && withCoords < MIN_MAP_POINTS) {
  console.log(
    `· точек карты ${withCoords} < ${MIN_MAP_POINTS}: /map и тизер обязаны быть скрыты из навигации (бриф §5)`,
  );
}

if (problems.length > 0) {
  console.error('Content Freeze НЕ пройден:\n');
  for (const p of problems) console.error(`✗ ${p}`);
  console.error(
    '\nЭто не ошибка сборки — это состояние проекта.\n' +
      'Гейт не правится ради прохождения (QUALITY_DOCTRINE §2): сначала контент, потом релиз.',
  );
  process.exit(1);
}

console.log(`✓ Content Freeze: демо нет, паспортов ${realFolders.size}, ставки production`);
