/**
 * Сверка контракта сайта и Worker'а.
 *
 * Копия контракта на стороне Worker'а осознанная: сервисы деплоятся независимо
 * (ARCHITECTURE_PRINCIPLES §2). Но независимость без сверки — это тихий разъезд:
 * однажды на сайте поменяют маску телефона, Worker останется со старой, и часть
 * заявок начнёт отбиваться без видимой причины.
 *
 * Здесь читаются ОБА файла и сравниваются правила, от которых зависит,
 * дойдёт ли заявка. Не структура кода, а именно значения.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const site = readFileSync(join(ROOT, 'src/lib/api/contract.ts'), 'utf8');
const worker = readFileSync(join(ROOT, 'worker/src/contract.ts'), 'utf8');

/**
 * Достаёт значение константы и приводит к сравнимому виду: различия в записи
 * (`as const`, кавычки, пробелы) — это оформление, а не расхождение контракта.
 * Сравнивать нужно смысл, иначе тест начнёт падать на форматировании
 * и его отключат.
 */
const value = (source: string, name: string) =>
  source
    .match(new RegExp(`${name}\\s*=\\s*([^;\\n]+)`))?.[1]
    ?.replace(/\bas const\b/, '')
    .replace(/['"]/g, '')
    .replace(/\s+/g, '')
    .trim();

describe('контракт сайта и Worker не разъехались', () => {
  test('версия API совпадает', () => {
    assert.equal(value(site, 'API_VERSION'), value(worker, 'API_VERSION'));
  });

  test('маска телефона совпадает', () => {
    assert.equal(value(site, 'PHONE_PATTERN'), value(worker, 'PHONE_PATTERN'));
  });

  test('минимальная пауза перед отправкой совпадает', () => {
    assert.equal(value(site, 'MIN_ELAPSED_MS'), value(worker, 'MIN_ELAPSED_MS'));
  });

  test('нормализация телефона реализована одинаково', () => {
    const extract = (source: string) =>
      source
        .slice(source.indexOf('function normalizePhone'))
        .split('}')[0]
        .replace(/\s+/g, ' ')
        .trim();
    assert.equal(extract(site), extract(worker));
  });

  test('пути точек входа совпадают', () => {
    const paths = (source: string) => [...source.matchAll(/\/api\/\$\{API_VERSION\}\/(\w+)/g)].map((m) => m[1]).sort();
    assert.deepEqual(paths(site), paths(worker));
  });
});
