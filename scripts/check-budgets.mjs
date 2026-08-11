/**
 * Бюджеты ассетов. Падает — билд в CI красный (бриф §10, протокол §9).
 *
 * F0: сабсеты шрифта (≤40 КБ каждый) — критерий гейта F0.
 * F2: оригиналы фотографий работ — 1600–2400px по длинной стороне, ≤1.5 МБ
 *     (DEC-0013). Нижняя граница — чтобы хватило на retina-карточку, верхняя —
 *     чтобы в git не оседал мёртвый вес, который всё равно ужмётся при сборке.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { dirname, join, relative } from 'node:path';
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
      'opendyslexic-latin-400-normal.woff2',
    ],
    /**
     * Шрифт дислексии не лежит в критическом пути: его @font-face объявлен
     * внутри селектора режима, поэтому файл скачивается только при включении.
     * Лимит 40 КБ здесь неприменим — он про то, что грузится всегда.
     * Собственный потолок оставлен, чтобы «только при включении» не стало
     * оправданием для мегабайта.
     */
    overrides: { 'opendyslexic-latin-400-normal.woff2': 160 },
  },
];

/**
 * Размеры картинки из заголовка файла — без зависимостей.
 * Поддержаны форматы, которые реально кладут в паспорта: JPEG, PNG, WebP.
 */
function imageSize(file) {
  const b = readFileSync(file);

  if (b[0] === 0xff && b[1] === 0xd8) {
    let i = 2;
    while (i < b.length) {
      if (b[i] !== 0xff) {
        i += 1;
        continue;
      }
      const marker = b[i + 1];
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
        return { height: b.readUInt16BE(i + 5), width: b.readUInt16BE(i + 7) };
      }
      i += 2 + b.readUInt16BE(i + 2);
    }
  }

  if (b.subarray(1, 4).toString() === 'PNG') {
    return { width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
  }

  if (b.subarray(8, 12).toString() === 'WEBP') {
    const kind = b.subarray(12, 16).toString();
    if (kind === 'VP8X') return { width: b.readUIntLE(24, 3) + 1, height: b.readUIntLE(27, 3) + 1 };
    if (kind === 'VP8 ') return { width: b.readUInt16LE(26) & 0x3fff, height: b.readUInt16LE(28) & 0x3fff };
    if (kind === 'VP8L') {
      const n = b.readUInt32LE(21);
      return { width: (n & 0x3fff) + 1, height: ((n >> 14) & 0x3fff) + 1 };
    }
  }

  return null;
}

/** Оригиналы фотографий работ (DEC-0013). */
function checkWorkPhotos() {
  const root = join(ROOT, 'content/works');
  const MIN_SIDE = 1600;
  const MAX_SIDE = 2400;
  const MAX_KB = 1536;
  let bad = false;
  let count = 0;

  const walk = (dir) => {
    let entries;
    try {
      entries = readdirSync(dir);
    } catch {
      return;
    }
    for (const entry of entries) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) {
        walk(full);
        continue;
      }
      if (!/\.(jpe?g|png|webp)$/i.test(entry)) continue;

      count += 1;
      const kb = statSync(full).size / 1024;
      const size = imageSize(full);
      const rel = full.slice(ROOT.length + 1);

      if (!size) {
        bad = true;
        console.error(`✗ ${rel} — не удалось прочитать размеры`);
        continue;
      }

      const long = Math.max(size.width, size.height);
      const problems = [];
      if (long < MIN_SIDE) problems.push(`длинная сторона ${long} < ${MIN_SIDE}`);
      if (long > MAX_SIDE) problems.push(`длинная сторона ${long} > ${MAX_SIDE}`);
      if (kb > MAX_KB) problems.push(`${kb.toFixed(0)} КБ > ${MAX_KB} КБ`);

      if (problems.length > 0) {
        bad = true;
        console.error(`✗ ${rel} — ${problems.join(', ')}`);
      } else {
        console.log(`✓ ${rel.padEnd(50)} ${long}px, ${kb.toFixed(0)} КБ`);
      }
    }
  };

  walk(root);
  if (count === 0) console.log('· фотографий работ пока нет — проверять нечего');
  return bad;
}

let failed = false;

for (const budget of BUDGETS) {
  const files = readdirSync(budget.dir).filter((f) => budget.match.test(f));

  for (const file of files.sort()) {
    const kb = statSync(join(budget.dir, file)).size / 1024;
    const limit = budget.overrides?.[file] ?? budget.maxKb;
    const ok = kb <= limit;
    if (!ok) failed = true;
    console.log(`${ok ? '✓' : '✗'} ${file.padEnd(38)} ${kb.toFixed(1).padStart(6)} КБ / ${limit} КБ`);
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

if (checkWorkPhotos()) failed = true;

if (failed) {
  console.error('\nБюджеты нарушены — сборка остановлена.');
  process.exit(1);
}

console.log('✓ бюджеты в норме');
