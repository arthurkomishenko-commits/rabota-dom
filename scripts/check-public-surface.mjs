/**
 * Проверка публичного контура собранного `dist/`. Падает — билд в CI красный.
 *
 * Витрина `/__ui/` не должна попасть в публикацию никогда (DEC-0011). Её
 * маршрут не существует в production-сборке by design, но «by design» — это
 * намерение, а не гарантия: достаточно однажды протечь переменной окружения
 * в CI, и витрина уедет на Pages молча. Здесь проверяется факт: что лежит в dist.
 *
 * Запускается ПОСЛЕ сборки, до загрузки артефакта на Pages.
 */
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');

/** Маршруты, которых в публичной сборке быть не может ни при каких условиях. */
const FORBIDDEN_ROUTES = ['__ui'];

/**
 * Слаги записей, помеченных `fixture: true`. Фикстуры существуют только для
 * проверки схемы и не должны порождать ни одной страницы (манифест 03, шаг 8).
 * Репозиторий `src/data/works.ts` их и так отсекает — здесь проверяется факт,
 * а не намерение: если фильтр однажды снимут, поймает эта проверка.
 */
function fixtureSlugs() {
  const root = join(ROOT, 'content/works');
  const slugs = [];

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
      if (!/\.mdx?$/.test(entry)) continue;

      const source = readFileSync(full, 'utf8');
      if (!/^fixture:\s*true\s*$/m.test(source)) continue;
      const slug = source.match(/^slug:\s*(\S+)\s*$/m)?.[1];
      if (slug) slugs.push(slug);
    }
  };

  walk(root);
  return [...new Set(slugs)];
}

/** Страницы, которые обязаны нести noindex до Content Freeze (DEC-0006). */
const MUST_BE_NOINDEX = ['index.html', 'ru/index.html', 'en/index.html', 'admin/index.html'];

if (!existsSync(DIST)) {
  console.error('dist/ не найден — сначала соберите проект.');
  process.exit(1);
}

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

const problems = [];
const files = walk(DIST).map((f) => relative(DIST, f));

for (const route of FORBIDDEN_ROUTES) {
  const leaked = files.filter((f) => f.split('/').includes(route));
  for (const file of leaked) {
    problems.push(`запрещённый маршрут в публичной сборке: dist/${file}`);
  }
}

for (const slug of fixtureSlugs()) {
  const leaked = files.filter((f) => f.split('/').includes(slug));
  for (const file of leaked) {
    problems.push(`фикстура попала в публичную сборку: dist/${file} (слаг «${slug}»)`);
  }
}

for (const page of MUST_BE_NOINDEX) {
  const full = join(DIST, page);
  if (!existsSync(full)) {
    problems.push(`ожидалась страница dist/${page}, её нет`);
    continue;
  }
  if (!readFileSync(full, 'utf8').includes('name="robots"')) {
    problems.push(`dist/${page} без noindex — до Content Freeze сайт staging (DEC-0006)`);
  }
}

if (problems.length > 0) {
  for (const p of problems) console.error(`✗ ${p}`);
  console.error(`\nПубличный контур нарушен: ${problems.length}.`);
  process.exit(1);
}

console.log(`✓ публичный контур: ${files.length} файлов, витрины нет, noindex на месте`);
