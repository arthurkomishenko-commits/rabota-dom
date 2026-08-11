/**
 * Бюджет скриптов страницы. ОТДЕЛЬНАЯ проверка, и это принципиально.
 *
 * ПОЧЕМУ НЕ ВНУТРИ `check:budgets`. Тот запускается ДО `astro build`, потому что
 * меряет исходники: сабсеты шрифта и фотографии работ. Бюджет скриптов меряет
 * СБОРКУ — и, стоя в той же цепочке, он молча оценивал предыдущую сборку.
 * Поймано на факте: GSAP весит 43.5 КБ gz, а проверка показывала 1.9 и была
 * зелёной. Проверка, измеряющая вчерашнее состояние, хуже её отсутствия:
 * отсутствие честно молчит, а эта отвечала «в норме» (кодекс §6).
 *
 * ДВА ЧИСЛА, А НЕ ОДНО (BUG-0019). Критический путь — то, что скачивается
 * при загрузке и конкурирует за канал с содержимым; именно он стоил проекту
 * полсекунды LCP. Полный объём — критический путь плюс всё, что достижимо
 * по динамическим импортам. Считать только первое значило бы разрешить себе
 * обойти бюджет ленивой загрузкой: перенёс мегабайт в `import()` — и гейт
 * зелёный. Оба числа сравниваются с одним порогом брифа §10.
 *
 * Запуск: npm run check:scripts — после сборки.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/**
 * Бюджет JavaScript: 120 КБ gzip на страницу (бриф §10).
 *
 * ЗАЧЕМ ИМЕННО СЕЙЧАС. Проверка заводится ПЕРЕД тем, как в проект приходит
 * GSAP, а не после. Гейт, добавленный после превышения, всегда подгоняется
 * под факт; гейт, стоящий до, показывает цену каждого следующего килобайта.
 *
 * ЧТО СЧИТАЕТСЯ. И внешние файлы, на которые ссылается страница, и **встроенные
 * в HTML** блоки. Второе обязательно: Astro встраивает мелкие скрипты прямо
 * в разметку, и первая версия этой проверки, считавшая только `src`, показывала
 * честный ноль на страницах со скриптами. Проверка, меряющая не то, что
 * заявлено, хуже отсутствия проверки (кодекс §6).
 *
 * Считается по странице, а не по сумме `dist`: у сайта нет единого бандла,
 * и сумма всех чанков не соответствует тому, что скачает хоть один человек.
 * `application/ld+json` и `application/json` не считаются — это данные,
 * а не исполняемый код.
 *
 * ЧЕГО НЕ СЧИТАЕТ. Brotli: GitHub Pages отдаёт его, и реальные числа будут
 * примерно на 15–20 % ниже. Считаем по gzip, потому что порог в брифе задан
 * в gzip; занижать оценку сжатием было бы подгонкой под порог.
 */
function checkPageScripts() {
  /*
   * Каталог можно передать аргументом. Это нужно самотесту: его фикстура
   * не должна зависеть от того, собран ли проект. Первая версия клала
   * пробную страницу в настоящий `dist` — и падала в CI, где самотест идёт
   * ДО сборки. Проверка, работающая только при удачном порядке шагов,
   * не проверка (кодекс §6).
   */
  const dist = process.argv[2] ? join(process.cwd(), process.argv[2]) : join(ROOT, 'dist');
  if (!existsSync(dist)) {
    console.log('· dist не собран — бюджет скриптов проверяется после сборки');
    return false;
  }

  const LIMIT_KB = 120;
  let worst = { page: '', kb: 0 };
  let worstTotal = { page: '', kb: 0 };
  let bad = false;
  const cache = new Map();

  const gzipKb = (file) => {
    if (!cache.has(file)) cache.set(file, gzipSync(readFileSync(file)).length / 1024);
    return cache.get(file);
  };

  const walk = (dir) => {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) walk(full);
      else if (entry.endsWith('.html')) {
        const html = readFileSync(full, 'utf8');
        const srcs = new Set([...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map((m) => m[1]));
        let kb = 0;
        for (const src of srcs) {
          const local = join(dist, src.replace(/^\/rabota-dom/, ''));
          if (existsSync(local)) kb += gzipKb(local);
        }

        // Встроенные блоки: всё, кроме `type="application/..."` — это данные.
        let inline = '';
        for (const match of html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)) {
          const attrs = match[1];
          if (/src=/.test(attrs)) continue;
          if (/type="application\//.test(attrs)) continue;
          inline += match[2];
        }
        if (inline.trim()) kb += gzipSync(Buffer.from(inline)).length / 1024;

        /*
         * Полный объём: обходим граф чанков по ссылкам вида `_astro/имя.js`
         * внутри самих чанков. Так учитывается и то, что подгружается
         * динамическим `import()` и в разметке не объявлено.
         */
        const seen = new Set();
        const queue = [...srcs].map((s) => s.replace(/^\/rabota-dom/, ''));
        let total = kb;
        while (queue.length > 0) {
          const rel = queue.pop();
          if (seen.has(rel)) continue;
          seen.add(rel);
          const local = join(dist, rel);
          if (!existsSync(local)) continue;
          if (![...srcs].some((s) => s.replace(/^\/rabota-dom/, '') === rel)) total += gzipKb(local);
          const code = readFileSync(local, 'utf8');
          /*
           * Ссылки внутри чанков ОТНОСИТЕЛЬНЫЕ: `./stage.BzItV9bF.js`,
           * без префикса каталога. Первая версия искала `_astro/…` и находила
           * только ссылки из HTML — то есть показывала «весь JS 2.4 КБ» там,
           * где по динамическим импортам подтягивается ещё 43. Проверка снова
           * мерила не то, что заявляла; теперь путь достраивается от каталога
           * самого чанка.
           */
          const dir = dirname(rel);
          for (const ref of code.matchAll(/\.\/[A-Za-z0-9._-]+\.js/g)) {
            queue.push(join(dir, ref[0].slice(2)));
          }
        }
        if (total > worstTotal.kb) worstTotal = { page: relative(dist, full), kb: total };
        if (total > LIMIT_KB) {
          bad = true;
          console.error(`✗ ${relative(dist, full)} — весь JS ${total.toFixed(1)} КБ gz > ${LIMIT_KB}`);
        }
        if (kb > worst.kb) worst = { page: relative(dist, full), kb };
        if (kb > LIMIT_KB) {
          bad = true;
          console.error(`✗ ${relative(dist, full)} — скрипты ${kb.toFixed(1)} КБ gz > ${LIMIT_KB}`);
        }
      }
    }
  };

  walk(dist);
  console.log(
    `${bad ? '✗' : '✓'} критический путь: максимум ${worst.kb.toFixed(1)} КБ gz / ${LIMIT_KB} КБ` +
      (worst.page ? ` (${worst.page})` : ''),
  );
  console.log(
    `${bad ? '✗' : '✓'} весь JS страницы: максимум ${worstTotal.kb.toFixed(1)} КБ gz / ${LIMIT_KB} КБ` +
      (worstTotal.page ? ` (${worstTotal.page})` : ''),
  );
  return bad;
}

if (checkPageScripts()) {
  console.error('\nБюджет скриптов нарушен — сборка остановлена.');
  process.exit(1);
}
