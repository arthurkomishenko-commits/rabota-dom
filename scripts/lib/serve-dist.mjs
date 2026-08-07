/**
 * Статический сервер для собранного `dist/`.
 *
 * Что делает: поднимает http-сервер на свободном порту и раздаёт содержимое
 * `dist/` под базовым путём проекта. Возвращает `{ server, origin, url }`.
 * Кто использует: `scripts/polish-pass.mjs`, `scripts/shots-ui.mjs`.
 *
 * Почему не `astro preview`: в Astro 7 это фоновый демон — переживает процесс,
 * игнорирует повторный `--port`, делает прогон недетерминированным (DEC-0010).
 *
 * Выделено в отдельный модуль при ВТОРОМ реальном использовании
 * (ARCHITECTURE_PRINCIPLES §1), не раньше.
 */
import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const DIST = join(ROOT, 'dist');
const BASE = '/rabota-dom/';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.woff2': 'font/woff2',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
};

export function serveDist() {
  const server = createServer((req, res) => {
    const pathname = decodeURIComponent(new URL(req.url ?? '/', 'http://x').pathname);
    const rel = pathname.startsWith(BASE) ? pathname.slice(BASE.length) : pathname.slice(1);
    let file = join(DIST, rel);

    if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
    if (!existsSync(file)) {
      res.writeHead(404, { 'content-type': 'text/plain' });
      res.end('not found');
      return;
    }

    res.writeHead(200, { 'content-type': MIME[extname(file)] ?? 'application/octet-stream' });
    createReadStream(file).pipe(res);
  });

  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      const port = typeof address === 'object' && address ? address.port : 0;
      const origin = `http://127.0.0.1:${port}`;
      resolve({ server, origin, url: (path = '') => `${origin}${BASE}${path}` });
    });
  });
}
