/**
 * Проверка: текст написан — и никуда не выводится.
 *
 * Что делает: берёт листовые ключи словаря (`name: string`) и ищет обращение
 * к каждому в коде. Ключ, к которому никто не обращается, — это фраза, которую
 * кто-то сочинил и вычитал на трёх языках, а читатель её не увидит.
 * Запуск: npm run check:dead-text
 *
 * ОТКУДА ВЗЯЛАСЬ — BUG-0016. Тело паспорта работы рендерилось «в никуда»
 * с самой F2, и вместе с ним не доходила пометка «данные выдуманы». Поймал это
 * не тест, а взгляд на скриншот. По правилу цепочки (одна находка → поиск
 * братьев того же класса) прогон по словарю нашёл ещё один: `otherWorks` —
 * заголовок блока «Другие работы», которого не существовало.
 *
 * ЧЕГО ЭТА ПРОВЕРКА НЕ ДЕЛАЕТ, И ЭТО ВАЖНО СКАЗАТЬ ЧЕСТНО (кодекс §6):
 * она видит только словарь. Тело MDX, поле схемы или пропс, которые никуда
 * не выводятся, ей недоступны — там нет ключа, который можно искать. Она также
 * считает ключ живым, если обращение к нему стоит внутри кода, который сам
 * никогда не выполняется. Это проверка одного конкретного класса, а не
 * гарантия «весь текст доходит до читателя».
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/**
 * Путь к словарю можно передать аргументом. Это нужно самотесту: подсунуть
 * фикстуру с заведомо мёртвым ключом, не трогая настоящий словарь. Правило
 * кодекса §2 — у каждой проверки есть нарушающая фикстура, — иначе выполнить
 * было бы нечем: ключи живут в одном конкретном файле.
 */
const DICT = process.argv[2] ? join(process.cwd(), process.argv[2]) : join(ROOT, 'src/data/dictionary.ts');

const source = readFileSync(DICT, 'utf8');
const typeBlock = source.slice(
  source.indexOf('export type Dictionary'),
  source.indexOf('const DICTIONARIES'),
);

if (!typeBlock) {
  console.error('✗ не найдено объявление типа Dictionary — проверка не может работать вслепую');
  process.exit(1);
}

/** Листовые ключи: те, у которых значение — строка, число или флаг. */
const leaves = new Set();
for (const match of typeBlock.matchAll(/^\s{4,8}([a-zA-Z][a-zA-Z0-9]*)\??:\s*(string|boolean|number)/gm)) {
  leaves.add(match[1]);
}

/**
 * Файлы, где имя ключа встречается как ДАННЫЕ, а не как обращение к словарю.
 * Сейчас это самотест: он подсаживает заведомо мёртвый ключ и ищет его имя
 * в выводе, то есть содержит эту строку в кавычках. Без исключения проверка
 * считала бы подсаженный ключ живым и молча пропускала бы собственную фикстуру.
 * Тот же приём и по той же причине уже применён в `check-markers.mjs`.
 * Список закрытый и расширяется только осознанно.
 */
const DATA_NOT_USAGE = new Set([join(ROOT, 'scripts/selftest-checks.mjs')]);

const files = [];
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path);
    else if (/\.(astro|ts|mjs)$/.test(path) && path !== DICT && !DATA_NOT_USAGE.has(path)) files.push(path);
  }
};
walk(join(ROOT, 'src'));
walk(join(ROOT, 'scripts'));

const code = files.map((file) => readFileSync(file, 'utf8')).join('\n');
const dead = [...leaves].filter((key) => !new RegExp(`[.\\['"\`]${key}\\b`).test(code));

if (dead.length > 0) {
  console.error(`✗ строки словаря не выводятся никуда (${dead.length}):`);
  for (const key of dead) console.error(`  · ${key}`);
  console.error('\nЛибо вывести их, либо удалить: третьего состояния у текста нет.');
  process.exit(1);
}

console.log(`✓ мёртвых строк в словаре нет (ключей проверено: ${leaves.size})`);
