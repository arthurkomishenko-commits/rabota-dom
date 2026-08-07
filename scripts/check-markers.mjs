/**
 * Проверка меток-костылей. Падает — билд в CI красный.
 * QUALITY_DOCTRINE §1 и §8.
 *
 * Временное решение допустимо ТОЛЬКО при внешней блокировке и только со ссылкой
 * на решение: `// TEMP(DEC-0012) ждём ассет от Артура`. Без ссылки на DEC любая
 * из меток валит сборку — чтобы «времянка» не превращалась в постоянную тихо.
 *
 * Подавление ошибок (`@ts-ignore`, `eslint-disable`, `test.skip`) — тоже метка:
 * доктрина считает это хитростью, если оно не объяснено решением.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join, relative } from 'node:path';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SCAN_DIRS = ['src', 'scripts', 'worker'];
const EXTENSIONS = new Set(['.astro', '.css', '.ts', '.js', '.mjs', '.json']);

/** Метка → человеческое объяснение, что с ней делать. */
const MARKERS = [
  { pattern: /\bTEMP\b/, what: 'временное решение' },
  { pattern: /\bHACK\b/, what: 'обход вместо причины' },
  { pattern: /\bFIXME\b/, what: 'незакрытая проблема' },
  { pattern: /@ts-ignore\b/, what: 'подавление ошибки типов' },
  { pattern: /@ts-expect-error\b/, what: 'подавление ошибки типов' },
  { pattern: /eslint-disable/, what: 'отключение линтера' },
  { pattern: /\b(?:test|it|describe)\.skip\b/, what: 'отключённый тест' },
];

/** Ссылка на решение: DEC-0007 и т.п. */
const DEC_REFERENCE = /DEC-\d{4}/;

/**
 * Файлы, где метки присутствуют как ДАННЫЕ, а не как костыль: определение самого
 * правила и его самотест. Проверка не должна ловить собственный исходник —
 * иначе единственным способом её пройти становится маскировка литералов
 * склейкой строк, то есть хитрость против собственной проверки
 * (QUALITY_DOCTRINE §2). Список закрытый и расширяется только осознанно.
 */
const SELF_EXEMPT = new Set(['scripts/check-markers.mjs', 'scripts/selftest-checks.mjs']);

function walk(dir) {
  const out = [];
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return out; // каталога ещё нет — worker появится в F4
  }
  for (const entry of entries) {
    const full = join(dir, entry);
    if (entry === 'node_modules') continue;
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (EXTENSIONS.has(extname(entry))) out.push(full);
  }
  return out;
}

const problems = [];

for (const dir of SCAN_DIRS) {
  for (const file of walk(join(ROOT, dir))) {
    const rel = relative(ROOT, file);
    if (SELF_EXEMPT.has(rel)) continue;

    const lines = readFileSync(file, 'utf8').split('\n');

    lines.forEach((line, i) => {
      for (const marker of MARKERS) {
        if (!marker.pattern.test(line)) continue;
        if (DEC_REFERENCE.test(line)) continue;
        problems.push({ file: rel, lineNo: i + 1, what: marker.what, text: line.trim() });
      }
    });
  }
}

if (problems.length > 0) {
  for (const p of problems) {
    console.error(`${p.file}:${p.lineNo}  ${p.what} без ссылки на решение (DEC-XXXX)`);
    console.error(`    ${p.text}`);
  }
  console.error(
    `\nМеток без обоснования: ${problems.length}.\n` +
      'Либо чините первопричину, либо заводите решение в docs/DECISIONS.md ' +
      'и ссылайтесь на него в метке (QUALITY_DOCTRINE §1).',
  );
  process.exit(1);
}

console.log('✓ меток-костылей без ссылки на решение нет');
