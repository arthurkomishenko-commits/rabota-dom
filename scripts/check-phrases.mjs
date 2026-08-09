/**
 * Проверка запрещённых фраз (EDITORIAL.md §2). Падает — билд в CI красный.
 *
 * Что делает: ищет вхождения из `scripts/banned-phrases.json` в текстах,
 * которые видит посетитель: записи работ (`content/works/**\/*.mdx`) и словарь
 * интерфейса (`src/data/dictionary.ts`).
 * Запуск: npm run check:phrases
 *
 * Список лежит в JSON, а не продублирован в CLAUDE.md: две копии списка
 * однажды разойдутся, и разойдутся молча.
 *
 * Проверка не читает саму себя и свой источник — иначе единственным способом
 * её пройти стало бы маскирование литералов, то есть хитрость против
 * собственной проверки (QUALITY_DOCTRINE §2, урок BUG-0004).
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PHRASES = JSON.parse(readFileSync(join(ROOT, 'scripts/banned-phrases.json'), 'utf8'));

const TARGETS = [
  { dir: join(ROOT, 'content'), match: /\.mdx?$/ },
  { dir: join(ROOT, 'src/data'), match: /dictionary\.ts$/ },
];

const SELF_EXEMPT = new Set(['scripts/check-phrases.mjs', 'scripts/banned-phrases.json']);

function walk(dir, match) {
  const out = [];
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const entry of entries) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full, match));
    else if (match.test(entry)) out.push(full);
  }
  return out;
}

const problems = [];
let scanned = 0;

for (const target of TARGETS) {
  for (const file of walk(target.dir, target.match)) {
    const rel = relative(ROOT, file);
    if (SELF_EXEMPT.has(rel)) continue;
    scanned += 1;

    const lines = readFileSync(file, 'utf8').split('\n');
    lines.forEach((line, i) => {
      const haystack = line.toLowerCase();
      for (const [lang, list] of Object.entries(PHRASES)) {
        if (lang.startsWith('_')) continue;
        for (const phrase of list) {
          if (haystack.includes(phrase.toLowerCase())) {
            problems.push({ rel, lineNo: i + 1, lang, phrase, text: line.trim() });
          }
        }
      }
    });
  }
}

if (problems.length > 0) {
  for (const p of problems) {
    console.error(`${p.rel}:${p.lineNo}  запрещённая фраза [${p.lang}]: «${p.phrase}»`);
    console.error(`    ${p.text}`);
  }
  console.error(
    `\nЗапрещённых фраз: ${problems.length}.\n` +
      'Текст возвращается на переработку по EDITORIAL.md — список не правится ради прохождения.',
  );
  process.exit(1);
}

console.log(`✓ запрещённых фраз нет (проверено файлов: ${scanned})`);
