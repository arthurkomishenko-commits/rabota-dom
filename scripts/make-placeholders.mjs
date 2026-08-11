/**
 * Генерация нейтральных заглушек для демо-контента (бриф §13, DEC-0014).
 *
 * Что делает: рисует схематичные «чертёжные» кадры в языке дизайна проекта
 * и сохраняет их растром 1600×1200 (4:3) — чтобы они проходили те же бюджеты,
 * что и настоящие фотографии.
 * Запуск: npm run demo:placeholders
 *
 * Заглушки существуют ровно потому, что брать изображения из интернета
 * запрещено категорически, даже «для теста». Схема, нарисованная нами, честна:
 * она не притворяется фотографией.
 */
import sharp from 'sharp';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const W = 1600;
const H = 1200;

/** Цвета — токены светлой темы из docs/DESIGN_TOKENS.md. */
const BG = '#f7f7f9';
const LINE = '#5f6b80';
const HAIR = '#cbd5e1';
const ACCENT = '#98461a';

const frame = (inner, caption) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${BG}"/>
  <g stroke="${HAIR}" stroke-width="1">
    ${Array.from({ length: 15 }, (_, i) => `<line x1="0" y1="${i * 80}" x2="${W}" y2="${i * 80}"/>`).join('')}
    ${Array.from({ length: 20 }, (_, i) => `<line x1="${i * 80}" y1="0" x2="${i * 80}" y2="${H}"/>`).join('')}
  </g>
  ${inner}
  <g font-family="Helvetica, Arial, sans-serif" fill="${LINE}">
    <text x="80" y="1110" font-size="34" letter-spacing="2">${caption}</text>
    <text x="80" y="1155" font-size="26" fill="${ACCENT}">СХЕМА · ДЕМО-ДАННЫЕ</text>
  </g>
  <rect x="40" y="40" width="${W - 80}" height="${H - 80}" fill="none" stroke="${LINE}" stroke-width="2"/>
</svg>`;

/** Пергола: столбы, балки, ламели, размерная линия. */
const pergola = frame(
  `
  <g stroke="${LINE}" stroke-width="6" fill="none">
    <rect x="300" y="300" width="1000" height="26"/>
    <line x1="340" y1="326" x2="340" y2="900"/>
    <line x1="1260" y1="326" x2="1260" y2="900"/>
    <line x1="300" y1="900" x2="1300" y2="900" stroke-width="3"/>
  </g>
  <g stroke="${LINE}" stroke-width="3">
    ${Array.from({ length: 17 }, (_, i) => `<line x1="${330 + i * 58}" y1="330" x2="${330 + i * 58}" y2="392"/>`).join('')}
  </g>
  <g stroke="${ACCENT}" stroke-width="2" stroke-dasharray="10 8">
    <line x1="300" y1="240" x2="1300" y2="240"/>
    <line x1="300" y1="220" x2="300" y2="260"/>
    <line x1="1300" y1="220" x2="1300" y2="260"/>
  </g>`,
  'ПЕРГОЛА · ФРОНТАЛЬНАЯ ПРОЕКЦИЯ',
);

/** Забор: столбики, лаги, доски с просветами. */
const fence = frame(
  `
  <g stroke="${LINE}" stroke-width="6" fill="none">
    <line x1="260" y1="880" x2="1340" y2="880" stroke-width="3"/>
    ${[260, 800, 1340].map((x) => `<line x1="${x}" y1="380" x2="${x}" y2="880"/>`).join('')}
    <line x1="260" y1="470" x2="1340" y2="470" stroke-width="4"/>
    <line x1="260" y1="780" x2="1340" y2="780" stroke-width="4"/>
  </g>
  <g stroke="${LINE}" stroke-width="14">
    ${Array.from({ length: 22 }, (_, i) => `<line x1="${290 + i * 48}" y1="400" x2="${290 + i * 48}" y2="860"/>`).join('')}
  </g>
  <g stroke="${ACCENT}" stroke-width="2" stroke-dasharray="10 8">
    <line x1="1380" y1="380" x2="1380" y2="880"/>
    <line x1="1360" y1="380" x2="1400" y2="380"/>
    <line x1="1360" y1="880" x2="1400" y2="880"/>
  </g>`,
  'ЗАБОР · ЗАПОЛНЕНИЕ С ПРОСВЕТАМИ',
);

/** Узел: крепление балки к опоре. */
const node = frame(
  `
  <g stroke="${LINE}" stroke-width="8" fill="none">
    <rect x="600" y="380" width="120" height="520"/>
    <rect x="480" y="440" width="600" height="90"/>
  </g>
  <g stroke="${ACCENT}" stroke-width="5">
    <circle cx="660" cy="470" r="22" fill="none"/>
    <circle cx="660" cy="500" r="22" fill="none"/>
    <line x1="700" y1="470" x2="900" y2="380"/>
  </g>
  <g font-family="Helvetica, Arial, sans-serif" fill="${ACCENT}">
    <text x="910" y="375" font-size="34">M12</text>
  </g>`,
  'УЗЕЛ · КРЕПЛЕНИЕ БАЛКИ К ОПОРЕ',
);

/** Пергола в процессе: опоры и балки выставлены, ламелей ещё нет. */
const pergolaProcess = frame(
  `
  <g stroke="${LINE}" stroke-width="6" fill="none">
    <rect x="300" y="300" width="1000" height="26"/>
    <line x1="340" y1="326" x2="340" y2="900"/>
    <line x1="1260" y1="326" x2="1260" y2="900"/>
    <line x1="300" y1="900" x2="1300" y2="900" stroke-width="3"/>
  </g>
  <g stroke="${ACCENT}" stroke-width="3" stroke-dasharray="12 10">
    ${[340, 1260].map((x) => `<line x1="${x - 70}" y1="900" x2="${x + 70}" y2="900"/>`).join('')}
  </g>
  <g font-family="Helvetica, Arial, sans-serif" fill="${ACCENT}">
    <text x="620" y="980" font-size="30">опоры выведены по уровню</text>
  </g>`,
  'ПЕРГОЛА · ЭТАП КАРКАСА',
);

/** Забор в процессе: столбы и лаги выставлены, заполнения ещё нет. */
const fenceProcess = frame(
  `
  <g stroke="${LINE}" stroke-width="6" fill="none">
    <line x1="260" y1="880" x2="1340" y2="880" stroke-width="3"/>
    ${[260, 800, 1340].map((x) => `<line x1="${x}" y1="380" x2="${x}" y2="880"/>`).join('')}
    <line x1="260" y1="470" x2="1340" y2="470" stroke-width="4"/>
    <line x1="260" y1="780" x2="1340" y2="780" stroke-width="4"/>
  </g>
  <g stroke="${ACCENT}" stroke-width="3" stroke-dasharray="12 10">
    ${[260, 800, 1340].map((x) => `<line x1="${x - 60}" y1="880" x2="${x + 60}" y2="880"/>`).join('')}
  </g>
  <g font-family="Helvetica, Arial, sans-serif" fill="${ACCENT}">
    <text x="1000" y="960" font-size="30">опоры забетонированы</text>
  </g>`,
  'ЗАБОР · ЭТАП КАРКАСА',
);

const OUT = [
  ['pergola-scheme.jpg', pergola],
  ['pergola-process-scheme.jpg', pergolaProcess],
  ['fence-scheme.jpg', fence],
  ['fence-process-scheme.jpg', fenceProcess],
  ['node-scheme.jpg', node],
];

const dir = join(ROOT, 'content/_placeholders');
mkdirSync(dir, { recursive: true });

for (const [name, svg] of OUT) {
  const buffer = await sharp(Buffer.from(svg)).jpeg({ quality: 86 }).toBuffer();
  writeFileSync(join(dir, name), buffer);
  console.log(`✓ ${name}  ${W}×${H}, ${(buffer.length / 1024).toFixed(0)} КБ`);
}
