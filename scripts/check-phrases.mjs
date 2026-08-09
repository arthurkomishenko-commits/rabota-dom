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
// EDITORIAL.md намеренно содержит список целиком — он сверяется, а не сканируется.

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

/**
 * Сверка человеческого документа с машинным списком.
 * EDITORIAL.md держит те же фразы для чтения; расхождение означает, что кто-то
 * правил один источник и забыл второй — а это ровно тот тихий разъезд,
 * из-за которого правило перестаёт работать незаметно.
 */
function checkEditorialSync() {
  const editorial = readFileSync(join(ROOT, 'EDITORIAL.md'), 'utf8');
  const block = editorial.match(
    /<!-- BANNED_PHRASES_START[\s\S]*?-->([\s\S]*?)<!-- BANNED_PHRASES_END -->/,
  )?.[1];

  if (!block) {
    console.error('✗ EDITORIAL.md: блок BANNED_PHRASES_START/END не найден');
    return true;
  }

  const listed = new Set([...block.matchAll(/[«"]([^«»"]+)[»"]/g)].map((m) => m[1].trim()));
  const machine = new Set(
    Object.entries(PHRASES)
      .filter(([lang]) => !lang.startsWith('_'))
      .flatMap(([, list]) => list),
  );

  const missing = [...machine].filter((p) => !listed.has(p));
  const extra = [...listed].filter((p) => !machine.has(p));

  for (const p of missing) console.error(`✗ EDITORIAL.md не содержит фразу из JSON: «${p}»`);
  for (const p of extra) console.error(`✗ EDITORIAL.md содержит фразу, которой нет в JSON: «${p}»`);

  if (missing.length + extra.length > 0) {
    console.error('  Источник — scripts/banned-phrases.json; блок в EDITORIAL.md правится вместе с ним.');
    return true;
  }

  console.log(`✓ EDITORIAL.md и banned-phrases.json совпадают (${machine.size} фраз)`);
  return false;
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

const desynced = checkEditorialSync();

if (problems.length > 0 || desynced) {
  for (const p of problems) {
    console.error(`${p.rel}:${p.lineNo}  запрещённая фраза [${p.lang}]: «${p.phrase}»`);
    console.error(`    ${p.text}`);
  }
  if (problems.length > 0) {
    console.error(
      `\nЗапрещённых фраз: ${problems.length}.\n` +
        'Текст возвращается на переработку по EDITORIAL.md — список не правится ради прохождения.',
    );
  }
  process.exit(1);
}

console.log(`✓ запрещённых фраз нет (проверено файлов: ${scanned})`);
