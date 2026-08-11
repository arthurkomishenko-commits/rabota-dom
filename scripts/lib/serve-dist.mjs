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
import { createGzip } from 'node:zlib';
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

export function serveDist(port = 0) {
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

    /*
     * СЖАТИЕ ОБЯЗАТЕЛЬНО, и это не удобство раздачи (BUG-0019).
     *
     * GitHub Pages отдаёт текстовые ресурсы сжатыми. Раздавая их сырыми,
     * этот сервер заставлял Lighthouse мерить полезную нагрузку, которой
     * не существует: модуль GSAP считался как 111 КБ вместо 43.5, то есть
     * гейт производительности наказывал за трафик, которого у человека нет.
     *
     * Это исправление ТОЧНОСТИ измерения, а не послабление порога: порог
     * 2000 мс не тронут, и заявлен он про реального человека на Pages.
     * Мерить то, чего в жизни не происходит, — нарушение кодекса §6
     * в обе стороны: и когда цифры хуже правды, и когда лучше.
     */
    const type = MIME[extname(file)] ?? 'application/octet-stream';
    const compressible = /^(text\/|application\/(javascript|json|xml)|image\/svg)/.test(type);
    const accepts = /\bgzip\b/.test(req.headers['accept-encoding'] ?? '');

    if (compressible && accepts) {
      res.writeHead(200, { 'content-type': type, 'content-encoding': 'gzip', vary: 'accept-encoding' });
      createReadStream(file).pipe(createGzip()).pipe(res);
      return;
    }

    res.writeHead(200, { 'content-type': type });
    createReadStream(file).pipe(res);
  });

  return new Promise((resolve) => {
    server.listen(port, '127.0.0.1', () => {
      const address = server.address();
      const port = typeof address === 'object' && address ? address.port : 0;
      const origin = `http://127.0.0.1:${port}`;
      resolve({ server, origin, url: (path = '') => `${origin}${BASE}${path}` });
    });
  });
}
