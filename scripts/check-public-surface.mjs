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
