/**
 * Проверка конвенций вёрстки. Падает — билд в CI красный.
 *
 * Закрывает два критерия приёмки манифеста 01:
 *   1. в коде нет `100vh` (бриф §8, протокол §8) — только `100dvh`;
 *   2. нет физических left/right в раскладке — только логические свойства,
 *      иначе RTL придётся чинить руками на каждой странице (бриф §2).
 *
 * Осознанное исключение помечается комментарием `physical-ok` в той же строке.
 * Проверка banned-phrases по EDITORIAL.md — отдельный скрипт, фаза F2.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join, relative } from 'node:path';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'src');
const EXTENSIONS = new Set(['.astro', '.css', '.ts', '.js', '.mjs']);
const ESCAPE_HATCH = 'physical-ok';

/** Правила для любого содержимого файла. */
const ANY_RULES = [
  {
    pattern: /100vh/g,
    message: '100vh запрещён — используйте 100dvh (утилиты h-viewport / min-h-viewport)',
  },
];

/** Правила только для CSS (файлы .css и блоки <style> внутри .astro). */
const CSS_RULES = [
  {
    pattern: /\b(?:margin|padding|border|scroll-margin|scroll-padding|inset)-(?:left|right)\s*:/g,
    message: 'физическое свойство — используйте логическое (-inline-start / -inline-end)',
  },
  {
    pattern: /\btext-align\s*:\s*(?:left|right)\b/g,
    message: 'text-align: left/right — используйте start / end',
  },
  {
    pattern: /(?:^|[;{])\s*(?:left|right)\s*:/gm,
    message: 'смещение left/right — используйте inset-inline-start / inset-inline-end',
  },
  {
    pattern: /\bfloat\s*:\s*(?:left|right)\b/g,
    message: 'float: left/right — используйте inline-start / inline-end',
  },
];

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (EXTENSIONS.has(extname(entry))) out.push(full);
  }
  return out;
}

/** Возвращает только содержимое <style> с сохранением нумерации строк. */
function styleBlocksOnly(source) {
  const masked = source.split('\n').map(() => '');
  const re = /<style[^>]*>([\s\S]*?)<\/style>/g;
  let match;

  while ((match = re.exec(source)) !== null) {
    const startLine = source.slice(0, match.index).split('\n').length - 1;
    match[1].split('\n').forEach((line, i) => {
      masked[startLine + i] = line;
    });
  }
  return masked.join('\n');
}

function check(file) {
  const source = readFileSync(file, 'utf8');
  const lines = source.split('\n');
  const problems = [];

  const scan = (haystack, rules) => {
    for (const rule of rules) {
      rule.pattern.lastIndex = 0;
      let match;
      while ((match = rule.pattern.exec(haystack)) !== null) {
        const lineNo = haystack.slice(0, match.index).split('\n').length;
        const line = lines[lineNo - 1] ?? '';
        if (line.includes(ESCAPE_HATCH)) continue;
        problems.push({ lineNo, text: line.trim(), message: rule.message });
      }
    }
  };

  scan(source, ANY_RULES);

  const ext = extname(file);
  if (ext === '.css') scan(source, CSS_RULES);
  else if (ext === '.astro') scan(styleBlocksOnly(source), CSS_RULES);

  return problems;
}

let total = 0;
for (const file of walk(SRC)) {
  for (const problem of check(file)) {
    total += 1;
    console.error(`${relative(ROOT, file)}:${problem.lineNo}  ${problem.message}`);
    console.error(`    ${problem.text}`);
  }
}

if (total > 0) {
  console.error(`\nНарушений конвенций: ${total}.`);
  process.exit(1);
}

console.log('✓ конвенции: 100vh не найден, физических left/right в раскладке нет');
