/**
 * Самотест проверок. Отвечает на вопрос «а проверка вообще работает?».
 *
 * Зелёная проверка на чистом коде не доказывает ничего: она была бы зелёной и
 * будучи сломанной. Поэтому на каждое правило заводится нарушающая фикстура,
 * и мы убеждаемся, что правило падает именно на ней и именно с нужным сообщением.
 * QUALITY_DOCTRINE §2 — «выдать непроверенное за проверенное» запрещено.
 *
 * Фикстуры создаются во временном каталоге внутри src/ (иначе проверка их не
 * увидит) и удаляются всегда, даже при падении.
 */
import { execFileSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const FIXTURES = join(ROOT, 'src/__selftest__');

/** Каждый кейс: файл-фикстура, какая проверка, ожидаемый фрагмент сообщения. */
const CASES = [
  // ── check-conventions: вёрстка ────────────────────────────────────────────
  ['vh.css', '.a { block-size: 100vh; }', 'conventions', 'единица vh'],
  ['physical-margin.css', '.a { margin-left: 4px; }', 'conventions', 'физическое свойство'],
  ['physical-align.css', '.a { text-align: left; }', 'conventions', 'text-align'],
  ['physical-offset.css', '.a { position: absolute; left: 0; }', 'conventions', 'смещение'],
  ['physical-float.css', '.a { float: right; }', 'conventions', 'float'],

  // ── check-conventions: границы (ARCHITECTURE_PRINCIPLES §6) ───────────────
  [
    'content-outside-data.ts',
    "import { getCollection } from 'astro:content';\nexport const x = getCollection;",
    'conventions',
    'astro:content',
  ],
  ['fetch-outside-api.ts', 'export const load = () => fetch("/x");', 'conventions', 'сетевые вызовы'],
  ['phone-literal.ts', 'export const p = "972549731889";', 'conventions', 'литерал телефона'],
  ['price-literal.ts', 'export const price = 1000;', 'conventions', 'литерал цены'],

  // ── check-markers (QUALITY_DOCTRINE §8) ───────────────────────────────────
  ['temp-no-dec.ts', '// TEMP пока не приехал ассет\nexport const a = 1;', 'markers', 'временное решение'],
  ['ts-ignore.ts', '// @ts-ignore\nexport const b = 1;', 'markers', 'подавление ошибки типов'],

  // ── BUG-0005: ручная обёртка bdi вне своего владельца ─────────────────────
  ['manual-bdi.astro', '<p><bdi dir="ltr">100×50</bdi></p>', 'conventions', 'ручная обёртка <bdi>'],
];

/** Кейсы, которые обязаны ПРОЙТИ: escape-hatch'и и корректно оформленная времянка. */
const ALLOWED_CASES = [
  ['escape-physical.css', '.a { margin-left: 4px; } /* physical-ok: сторонний виджет */'],
  ['temp-with-dec.ts', '// TEMP(DEC-0007) ждём подключения расширения\nexport const c = 1;'],
];

const results = [];

const SCRIPTS = {
  markers: 'check-markers.mjs',
  conventions: 'check-conventions.mjs',
  phrases: 'check-phrases.mjs',
  budgets: 'check-budgets.mjs',
  scripts: 'check-scripts.mjs',
  content: 'check-content.mjs',
  deadText: 'check-dead-text.mjs',
};

function runCheck(which, ...args) {
  const script = SCRIPTS[which] ?? SCRIPTS.conventions;
  try {
    execFileSync('node', [join(ROOT, 'scripts', script), ...args], { cwd: ROOT, encoding: 'utf8' });
    return { failed: false, output: '' };
  } catch (error) {
    return { failed: true, output: `${error.stdout ?? ''}${error.stderr ?? ''}` };
  }
}

try {
  // Нарушающие фикстуры — проверка обязана упасть с нужным сообщением.
  for (const [name, body, which, expected] of CASES) {
    rmSync(FIXTURES, { recursive: true, force: true });
    mkdirSync(FIXTURES, { recursive: true });
    writeFileSync(join(FIXTURES, name), `${body}\n`);

    const { failed, output } = runCheck(which);
    const ok = failed && output.includes(expected);
    results.push([ok, `${name} → ловится правилом «${expected}»`]);
  }

  // Разрешённые фикстуры — проверка обязана остаться зелёной.
  for (const [name, body] of ALLOWED_CASES) {
    rmSync(FIXTURES, { recursive: true, force: true });
    mkdirSync(FIXTURES, { recursive: true });
    writeFileSync(join(FIXTURES, name), `${body}\n`);

    const conventions = runCheck('conventions');
    const markers = runCheck('markers');
    const ok = !conventions.failed && !markers.failed;
    results.push([ok, `${name} → осознанное исключение пропускается`]);
  }

  // Направление зависимостей проверяем отдельно: фикстура должна лежать
  // в реальном слое `components`, а не во временном каталоге.
  {
    const probe = join(ROOT, 'src/components/__selftest-direction.ts');
    writeFileSync(probe, "import { getDictionary } from '../data/dictionary';\nexport const d = getDictionary;\n");
    const { failed, output } = runCheck('conventions');
    rmSync(probe, { force: true });
    results.push([
      failed && output.includes('components → data'),
      'components → data (не type-import) → ловится правилом направления',
    ]);
  }

  // Запрещённая фраза в записи работы (EDITORIAL.md).
  {
    const dir = join(ROOT, 'content/works/__selftest');
    mkdirSync(dir, { recursive: true });
    const probe = join(dir, 'ru.mdx');
    writeFileSync(probe, '---\nslug: x\n---\n\nМы предлагаем вам широкий спектр услуг.\n');
    const { failed, output } = runCheck('phrases');
    rmSync(dir, { recursive: true, force: true });
    results.push([
      failed && output.includes('широкий спектр'),
      'запрещённая фраза в записи работы → ловится',
    ]);
  }

  // Пропавшая языковая версия работы (BUG-0006).
  {
    const file = join(ROOT, 'content/works/work-02-fence/he.mdx');
    const before = readFileSync(file, 'utf8');
    rmSync(file);
    const { failed, output } = runCheck('content');
    writeFileSync(file, before);
    results.push([
      failed && output.includes('нет версии'),
      'у работы пропала языковая версия → ловится',
    ]);
  }

  // Превышение бюджета скриптов на странице (бриф §10).
  // Фикстура САМОДОСТАТОЧНА: своя папка, а не настоящий `dist`. Первая версия
  // клала пробную страницу в `dist` и падала в CI, где самотест идёт до сборки.
  // Порог при этом НЕ трогается — проверяется тот, что защищает релиз.
  {
    const fake = join(ROOT, 'src/__selftest__/dist');
    mkdirSync(fake, { recursive: true });
    const probe = join(fake, '__selftest-budget.html');
    // 512 КБ случайных байтов в base64: gzip такое почти не сжимает.
    const noise = randomBytes(384 * 1024).toString('base64');
    writeFileSync(probe, `<html><body><script>const x=${JSON.stringify(noise)};<\/script></body></html>`);
    const { failed, output } = runCheck('scripts', 'src/__selftest__/dist');
    rmSync(join(ROOT, 'src/__selftest__'), { recursive: true, force: true });
    results.push([
      failed && output.includes('__selftest-budget.html'),
      'страница со скриптами тяжелее 120 КБ gz → ловится бюджетом',
    ]);
  }

  // Строка словаря, которая никуда не выводится (BUG-0016).
  // Фикстура — отдельный файл словаря: ключи живут в одном конкретном файле,
  // и подсунуть их иначе, не трогая настоящий, нельзя.
  {
    const dir = join(ROOT, 'src/__selftest__');
    mkdirSync(dir, { recursive: true });
    const probe = join(dir, 'dictionary-fixture.ts');
    writeFileSync(
      probe,
      'export type Dictionary = {\n  portfolio: {\n    title: string;\n    neverRenderedAnywhere: string;\n  };\n};\n\nconst DICTIONARIES = {};\n',
    );
    const { failed, output } = runCheck('deadText', 'src/__selftest__/dictionary-fixture.ts');
    rmSync(dir, { recursive: true, force: true });
    results.push([
      failed && output.includes('neverRenderedAnywhere'),
      'строка словаря не выводится никуда → ловится',
    ]);
  }

  // Расхождение EDITORIAL.md и banned-phrases.json.
  {
    const file = join(ROOT, 'EDITORIAL.md');
    const before = readFileSync(file, 'utf8');
    writeFileSync(file, before.replace('«богатый опыт» · ', ''));
    const { failed, output } = runCheck('phrases');
    writeFileSync(file, before);
    results.push([
      failed && output.includes('не содержит фразу из JSON'),
      'EDITORIAL.md разошёлся с banned-phrases.json → ловится',
    ]);
  }

  // Фотография ниже нижней границы размера (DEC-0013).
  {
    const dir = join(ROOT, 'content/works/__selftest/photos');
    mkdirSync(dir, { recursive: true });
    // 1×1 PNG: заведомо меньше 1600px по длинной стороне.
    const png = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      'base64',
    );
    writeFileSync(join(dir, 'cover.png'), png);
    const { failed, output } = runCheck('budgets');
    rmSync(join(ROOT, 'content/works/__selftest'), { recursive: true, force: true });
    results.push([
      failed && output.includes('длинная сторона'),
      'фото меньше 1600px → ловится бюджетом',
    ]);
  }

  // Зарезервированный маршрут.
  {
    const probe = join(ROOT, 'src/pages/shop.astro');
    writeFileSync(probe, '<p>x</p>\n');
    const { failed, output } = runCheck('conventions');
    rmSync(probe, { force: true });
    results.push([failed && output.includes('зарезервирован'), '/shop → маршрут зарезервирован']);
  }
} finally {
  rmSync(FIXTURES, { recursive: true, force: true });
}

// Контроль: после уборки обе проверки снова зелёные.
{
  const conventions = runCheck('conventions');
  const markers = runCheck('markers');
  results.push([!conventions.failed && !markers.failed, 'после уборки фикстур — снова чисто']);
}

for (const [ok, text] of results) console.log(`${ok ? '✓' : '✗'} ${text}`);

const failed = results.filter(([ok]) => !ok).length;
console.log(`\nСамотест проверок: ${results.length - failed}/${results.length}`);
if (failed > 0) process.exit(1);
