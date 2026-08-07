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
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
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
];

/** Кейсы, которые обязаны ПРОЙТИ: escape-hatch'и и корректно оформленная времянка. */
const ALLOWED_CASES = [
  ['escape-physical.css', '.a { margin-left: 4px; } /* physical-ok: сторонний виджет */'],
  ['temp-with-dec.ts', '// TEMP(DEC-0007) ждём подключения расширения\nexport const c = 1;'],
];

const results = [];

function runCheck(which) {
  const script = which === 'markers' ? 'check-markers.mjs' : 'check-conventions.mjs';
  try {
    execFileSync('node', [join(ROOT, 'scripts', script)], { cwd: ROOT, encoding: 'utf8' });
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
