/**
 * Генерация OG-карточек «паспорт объекта» 1200×630 (бриф §7).
 *
 * ПОЧЕМУ БРАУЗЕР, А НЕ SATORI. Бриф закладывал satori с обязательным
 * визуальным тестом ивритской карточки и фоллбеком на рендер браузером.
 * Тест satori не прошёл, и это видно на снимке `/tmp/og-he.png`:
 *   · буквы внутри ивритских слов переставлены (satori не реализует
 *     двунаправленный алгоритм, он просто разворачивает порядок символов);
 *   · цифры года и латиница отрисованы квадратами — satori не подставляет
 *     глифы из соседнего сабсета, а каждый сабсет Rubik покрывает своё письмо.
 * Оба дефекта неустранимы настройкой: это устройство инструмента.
 *
 * Браузер делает и bidi, и подстановку глифов правильно — он этим и занимается.
 * Шрифты берутся из репозитория, никакой сети.
 *
 * Запуск: npm run og  (входит в `npm run build`).
 * Результат: `public/og/*.png` — попадают в сборку как обычная статика.
 */
import { chromium } from 'playwright';
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'public/og');
const FONTS = join(ROOT, 'src/styles/fonts');

const WIDTH = 1200;
const HEIGHT = 630;

/** Шрифты встраиваются как data: — сеть при рендере не нужна вообще. */
function fontFace(file, unicodeRange) {
  const data = readFileSync(join(FONTS, file)).toString('base64');
  return `@font-face{font-family:'Rubik';font-weight:300 900;font-display:block;
    src:url(data:font/woff2;base64,${data}) format('woff2-variations');
    unicode-range:${unicodeRange};}`;
}

const FONT_CSS = [
  fontFace('rubik-hebrew-wght-normal.woff2', 'U+0307-0308,U+0590-05FF,U+200C-2010,U+20AA,U+25CC,U+FB1D-FB4F'),
  fontFace('rubik-cyrillic-wght-normal.woff2', 'U+0301,U+0400-045F,U+0490-0491,U+04B0-04B1,U+2116'),
  fontFace('rubik-latin-wght-normal.woff2', 'U+0000-00FF,U+0131,U+0152-0153,U+2000-206F,U+20AC,U+2122'),
].join('\n');

/**
 * Разметка карточки. Токены — из `docs/DESIGN_TOKENS.md`; здесь они записаны
 * значениями, потому что страница рендерится изолированно, без стилей сайта.
 */
function html({ title, city, year, material, rtl }) {
  const dir = rtl ? 'rtl' : 'ltr';
  return `<!doctype html><html dir="${dir}"><head><meta charset="utf-8"><style>
    ${FONT_CSS}
    *{margin:0;padding:0;box-sizing:border-box}
    body{width:${WIDTH}px;height:${HEIGHT}px;background:#f7f7f9;color:#1e242b;
      font-family:'Rubik',sans-serif;font-weight:500;
      padding:64px;display:flex;flex-direction:column;justify-content:space-between}
    .tag{align-self:flex-start;background:#1e242b;color:#fff;font-size:24px;
      padding:8px 16px;border-radius:2px;text-transform:uppercase;letter-spacing:.05em}
    h1{font-size:68px;line-height:1.15;max-width:1000px;font-weight:500}
    .foot{display:flex;flex-direction:column;gap:20px}
    .rule{height:1px;background:#cbd5e1}
    .row{display:flex;justify-content:space-between;align-items:center;
      font-size:32px;color:#5f6b80}
    /* flex-start следует направлению: в RTL это правый край, как и заголовок. */
    .brand{font-size:28px;color:#98461a;letter-spacing:.05em;direction:ltr;
      align-self:flex-start}
  </style></head><body>
    <div><span class="tag">${material}</span><h1>${title}</h1></div>
    <div class="foot">
      <div class="rule"></div>
      <div class="row"><span>${city}</span><bdi dir="ltr">${year}</bdi></div>
      <span class="brand">RABOTA DOM</span>
    </div>
  </body></html>`;
}

/**
 * Материал в данных хранится кодом (`wood`/`metal`/`combo`) — это правильно,
 * коды не переводятся. Но на карточке человек должен видеть слово на своём
 * языке, а не `COMBO`. Подписи продублированы здесь потому, что скрипт
 * работает до сборки и словарь сайта ему недоступен; расхождение поймает
 * визуальная проверка карточек.
 */
const MATERIAL_LABEL = {
  he: { wood: 'עץ', metal: 'מתכת', combo: 'משולב' },
  ru: { wood: 'Дерево', metal: 'Металл', combo: 'Комбо' },
  en: { wood: 'Wood', metal: 'Metal', combo: 'Combo' },
};

/** Карточки собираются из тех же записей, что и страницы. */
function cards() {
  const worksDir = join(ROOT, 'content/works');
  const out = [];
  if (!existsSync(worksDir)) return out;

  for (const folder of readdirSync(worksDir)) {
    const dir = join(worksDir, folder);
    if (!statSync(dir).isDirectory()) continue;

    for (const locale of ['he', 'ru', 'en']) {
      const file = join(dir, `${locale}.mdx`);
      if (!existsSync(file)) continue;
      const source = readFileSync(file, 'utf8');
      const field = (name) => source.match(new RegExp(`^${name}:\\s*"?([^"\\n]+)"?\\s*$`, 'm'))?.[1]?.trim();

      out.push({
        name: `${field('slug')}-${locale}`,
        title: field('title') ?? '',
        city: field('city') ?? '',
        year: source.match(/year:\s*\{\s*kind:\s*year,\s*value:\s*(\d+)/)?.[1] ?? '',
        material: MATERIAL_LABEL[locale]?.[field('material') ?? ''] ?? '',
        rtl: locale === 'he',
      });
    }
  }
  return out;
}

mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: WIDTH, height: HEIGHT } });
const page = await context.newPage();

/** Общая карточка сайта — для страниц без собственного паспорта. */
const SITE_CARDS = [
  { name: 'site-he', title: 'פרגולות, קירויים וגדרות', city: 'נוף הגליל', year: '', material: 'RABOTA DOM', rtl: true },
  { name: 'site-ru', title: 'Перголы, навесы и заборы', city: 'Ноф-ха-Галиль', year: '', material: 'RABOTA DOM', rtl: false },
  { name: 'site-en', title: 'Pergolas, canopies and fences', city: 'Nof HaGalil', year: '', material: 'RABOTA DOM', rtl: false },
];

let count = 0;
for (const card of [...SITE_CARDS, ...cards()]) {
  await page.setContent(html(card), { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: join(OUT, `${card.name}.png`) });
  count += 1;
}

await browser.close();
console.log(`✓ OG-карточек: ${count} → public/og/`);
