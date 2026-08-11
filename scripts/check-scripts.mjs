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
  const dist = join(ROOT, 'dist');
  if (!existsSync(dist)) {
    console.log('· dist не собран — бюджет скриптов проверяется после сборки');
    return false;
  }

  const LIMIT_KB = 120;
  let worst = { page: '', kb: 0 };
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
    `${bad ? '✗' : '✓'} скрипты страницы: максимум ${worst.kb.toFixed(1)} КБ gz / ${LIMIT_KB} КБ` +
      (worst.page ? ` (${worst.page})` : ''),
  );
  return bad;
}

if (checkPageScripts()) {
  console.error('\nБюджет скриптов нарушен — сборка остановлена.');
  process.exit(1);
}
