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

/**
 * До Content Freeze noindex обязаны нести ВСЕ страницы (DEC-0006).
 * Раньше здесь был список из четырёх файлов — он бы молча пропустил каждую
 * новую страницу F3. Проверяем то, что реально лежит в dist, а не то,
 * что помнил автор списка (урок BUG-0006: полнота набора проверяется явно).
 */
/**
 * OG-карточки рисует браузер (DEC-0019) и они КОММИТЯТСЯ, а не создаются
 * каждой сборкой: на раннере CI браузера нет, и делать его обязательным ради
 * картинок, которые меняются раз в месяц, — плохой обмен.
 *
 * Но «коммитятся» без проверки означает «однажды забудут». Здесь сверяется
 * полнота: у каждой работы обязана быть карточка на каждом языке. Забыли
 * `npm run og` после новой работы — сборка красная, а не молча с пустым
 * превью в мессенджере (кодекс §6: полнота проверяется явно).
 */
function checkOgCards() {
  const worksDir = join(ROOT, 'content/works');
  const ogDir = join(ROOT, 'public/og');
  const missing = [];

  let folders = [];
  try {
    folders = readdirSync(worksDir).filter((name) => statSync(join(worksDir, name)).isDirectory());
  } catch {
    return missing;
  }

  for (const folder of folders) {
    for (const locale of ['he', 'ru', 'en']) {
      const entry = join(worksDir, folder, `${locale}.mdx`);
      if (!existsSync(entry)) continue;

      const slug = readFileSync(entry, 'utf8').match(/^slug:\s*(\S+)\s*$/m)?.[1];
      if (!slug) continue;

      if (!existsSync(join(ogDir, `${slug}-${locale}.png`))) {
        missing.push(`нет OG-карточки og/${slug}-${locale}.png — запустите npm run og`);
      }
    }
  }

  for (const locale of ['he', 'ru', 'en']) {
    if (!existsSync(join(ogDir, `site-${locale}.png`))) {
      missing.push(`нет общей OG-карточки og/site-${locale}.png — запустите npm run og`);
    }
  }

  return missing;
}

const NOINDEX_EXEMPT = new Set(['404.html']);

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

/**
 * Каждый пункт меню обязан вести на существующую страницу — во всех локалях.
 * Ссылка в навигации, ведущая в 404, не производит ошибку сборки сама по себе:
 * она просто существует. Проверяем явно (кодекс §6, урок BUG-0006).
 */
const NAV_ROUTES = ['portfolio', 'services', 'about', 'contact'];
const ROUTE_PATHS = {
  portfolio: 'portfolio',
  services: 'services',
  about: 'about',
  contact: 'contact',
};

const pages = files.filter((f) => f.endsWith('.html'));

for (const locale of ['', 'ru/', 'en/']) {
  for (const key of NAV_ROUTES) {
    const path = ROUTE_PATHS[key];
    const exists =
      pages.includes(`${locale}${path}/index.html`) || pages.includes(`${locale}${path}.html`);
    if (!exists) {
      problems.push(
        `пункт меню «${key}» ведёт в никуда: нет страницы ${locale}${path}/ (локаль «${locale || 'he'}»)`,
      );
    }
  }
}
if (pages.length === 0) problems.push('в dist нет ни одной страницы');

problems.push(...checkOgCards());

for (const page of pages) {
  if (NOINDEX_EXEMPT.has(page)) continue;
  if (!readFileSync(join(DIST, page), 'utf8').includes('name="robots"')) {
    problems.push(`dist/${page} без noindex — до Content Freeze сайт staging (DEC-0006)`);
  }
}

if (problems.length > 0) {
  for (const p of problems) console.error(`✗ ${p}`);
  console.error(`\nПубличный контур нарушен: ${problems.length}.`);
  process.exit(1);
}

console.log(
  `✓ публичный контур: ${files.length} файлов, страниц ${pages.length}, витрины нет, noindex на месте`,
);
