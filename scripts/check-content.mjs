/**
 * Целостность контента работ. Падает — билд в CI красный.
 *
 * Что делает: проверяет то, что схема проверить не может, потому что она видит
 * записи по одной:
 *   · у каждой работы есть все три языковые версии;
 *   · `id` и `slug` совпадают во всех версиях одной работы;
 *   · один и тот же `slug` не занят двумя разными работами.
 *
 * ЗАЧЕМ — BUG-0006. Loader брал `id` записи из поля `slug`, а `slug` у трёх
 * языков общий по определению (это URL). Записи схлопывались в одну, и две
 * локали из трёх молча исчезали из коллекции: сборка зелёная, страниц нет.
 * Схема этого не видела — каждая запись по отдельности была валидна.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const WORKS = join(ROOT, 'content/works');
const LOCALES = ['he', 'ru', 'en'];

const field = (source, name) => source.match(new RegExp(`^${name}:\\s*(\\S+)\\s*$`, 'm'))?.[1];

const problems = [];
let folders = 0;

let list;
try {
  list = readdirSync(WORKS);
} catch {
  list = [];
}

const slugOwners = new Map();

for (const name of list) {
  const dir = join(WORKS, name);
  if (!statSync(dir).isDirectory()) continue;
  folders += 1;

  const present = new Map();
  for (const locale of LOCALES) {
    const file = join(dir, `${locale}.mdx`);
    try {
      present.set(locale, readFileSync(file, 'utf8'));
    } catch {
      problems.push(`${name}: нет версии «${locale}» — работа не откроется на этом языке`);
    }
  }

  const ids = new Set([...present.values()].map((s) => field(s, 'id')));
  const slugs = new Set([...present.values()].map((s) => field(s, 'slug')));

  if (ids.size > 1) problems.push(`${name}: id различается между языками (${[...ids].join(', ')})`);
  if (slugs.size > 1) {
    problems.push(
      `${name}: slug различается между языками (${[...slugs].join(', ')}) — переключатель языка приведёт в никуда`,
    );
  }

  for (const slug of slugs) {
    if (!slug) continue;
    const owner = slugOwners.get(slug);
    if (owner && owner !== name) problems.push(`slug «${slug}» занят двумя работами: ${owner} и ${name}`);
    slugOwners.set(slug, name);
  }
}

if (problems.length > 0) {
  for (const p of problems) console.error(`✗ ${p}`);
  console.error(`\nЦелостность контента нарушена: ${problems.length}.`);
  process.exit(1);
}

console.log(`✓ контент цел: работ ${folders}, у каждой три языковые версии, слаги уникальны`);
