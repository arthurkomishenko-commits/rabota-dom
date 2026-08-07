/**
 * Проверка конвенций вёрстки и границ слоёв. Падает — билд в CI красный.
 *
 * Что закрывает:
 *   · манифест 01: в коде нет `100vh`, нет физических left/right в раскладке;
 *   · ARCHITECTURE_PRINCIPLES §6: границы слоёв, `astro:content` только в data,
 *     `fetch(` только в lib/api и worker, литералы цен и телефона только
 *     в config/data, зарезервированные URL не заняты (§4).
 *
 * Осознанное отступление помечается комментарием `physical-ok` (для CSS) или
 * `boundary-ok(DEC-XXXX)` (для границ) в той же строке — и записью в DECISIONS.
 */
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { dirname, extname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'src');
const EXTENSIONS = new Set(['.astro', '.css', '.ts', '.js', '.mjs']);

const problems = [];
const report = (file, lineNo, message, text) =>
  problems.push({ file: relative(ROOT, file), lineNo, message, text: text.trim() });

// ─────────────────────────────────────────────────────────────────────────────
// 1. Вёрстка: единица vh и физические направления
// ─────────────────────────────────────────────────────────────────────────────

const ANY_RULES = [
  {
    pattern: /100vh/g,
    message: 'единица vh запрещена — используйте 100dvh (h-viewport / min-h-viewport)',
  },
];

const CSS_RULES = [
  {
    pattern: /\b(?:margin|padding|border|scroll-margin|scroll-padding|inset)-(?:left|right)\s*:/g,
    message: 'физическое свойство — используйте логическое (-inline-start / -inline-end)',
  },
  {
    pattern: /\btext-align\s*:\s*(?:left|right)\b/g,
    message: 'text-align: left/right — используйте start / end',
  },
  {
    pattern: /(?:^|[;{])\s*(?:left|right)\s*:/gm,
    message: 'смещение left/right — используйте inset-inline-start / inset-inline-end',
  },
  {
    pattern: /\bfloat\s*:\s*(?:left|right)\b/g,
    message: 'float: left/right — используйте inline-start / inline-end',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// 2. Границы слоёв (ARCHITECTURE_PRINCIPLES §2, §6)
// ─────────────────────────────────────────────────────────────────────────────

/** Кто кого имеет право импортировать. Всё остальное — нарушение направления. */
const ALLOWED_IMPORTS = {
  config: ['config'],
  lib: ['config', 'lib'],
  data: ['config', 'lib', 'data'],
  components: ['config', 'lib', 'components', 'styles'],
  layouts: ['config', 'lib', 'components', 'layouts', 'styles'],
  pages: ['config', 'lib', 'data', 'components', 'layouts', 'pages', 'styles'],
  styles: ['styles'],
};

const LAYER_RULES = [
  {
    layers: ['data'],
    pattern: /from\s+['"]astro:content['"]|import\s*\(\s*['"]astro:content['"]/g,
    message: '`astro:content` разрешён только в src/data/ — источник данных знает только data',
    invert: true, // разрешено ТОЛЬКО в перечисленных слоях
  },
  {
    layers: ['lib/api'],
    pattern: /\bfetch\s*\(/g,
    message: 'сетевые вызовы только в src/lib/api/ и worker/ — компоненты вызывают функции',
    invert: true,
  },
  {
    layers: ['config', 'data'],
    pattern: /\+?972\d{9}|\b05\d{8}\b/g,
    message: 'литерал телефона вне config/data — телефон живёт в конфиге (§3)',
    invert: true,
  },
  {
    layers: ['config', 'data'],
    pattern: /₪\s*\d|\b\d+\s*₪|\b(?:price|rate|cost|amount)\s*[:=]\s*\d/gi,
    message: 'литерал цены вне config/data — деньги живут в данных, целыми агоротами (§3)',
    invert: true,
  },
];

/** URL-пространство, зарезервированное на будущее (§4). Занимать нельзя. */
const RESERVED_ROUTES = ['shop', 'cart', 'pay', 'account', 'api'];

function layerOf(file) {
  const rel = relative(SRC, file);
  if (rel.startsWith('..')) return null;
  const parts = rel.split('/');
  if (parts[0] === 'lib' && parts[1] === 'api') return 'lib/api';
  return parts[0] ?? null;
}

/** Слой, на который указывает относительный импорт. */
function importLayer(fromFile, spec) {
  if (!spec.startsWith('.')) return null;
  return layerOf(resolve(dirname(fromFile), spec));
}

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (EXTENSIONS.has(extname(entry))) out.push(full);
  }
  return out;
}

/** Возвращает только содержимое <style> с сохранением нумерации строк. */
function styleBlocksOnly(source) {
  const masked = source.split('\n').map(() => '');
  const re = /<style[^>]*>([\s\S]*?)<\/style>/g;
  let match;
  while ((match = re.exec(source)) !== null) {
    const startLine = source.slice(0, match.index).split('\n').length - 1;
    match[1].split('\n').forEach((line, i) => {
      masked[startLine + i] = line;
    });
  }
  return masked.join('\n');
}

const exempt = (line, kind) =>
  kind === 'css' ? line.includes('physical-ok') : /boundary-ok\(DEC-\d+\)/.test(line);

function scan(file, haystack, rules, lines, kind) {
  for (const rule of rules) {
    rule.pattern.lastIndex = 0;
    let match;
    while ((match = rule.pattern.exec(haystack)) !== null) {
      const lineNo = haystack.slice(0, match.index).split('\n').length;
      const line = lines[lineNo - 1] ?? '';
      if (exempt(line, kind)) continue;
      report(file, lineNo, rule.message, line);
    }
  }
}

for (const file of walk(SRC)) {
  const source = readFileSync(file, 'utf8');
  const lines = source.split('\n');
  const ext = extname(file);
  const layer = layerOf(file);

  scan(file, source, ANY_RULES, lines, 'css');
  if (ext === '.css') scan(file, source, CSS_RULES, lines, 'css');
  else if (ext === '.astro') scan(file, styleBlocksOnly(source), CSS_RULES, lines, 'css');

  // Правила «разрешено только в этих слоях»
  for (const rule of LAYER_RULES) {
    if (rule.layers.includes(layer)) continue;
    scan(file, source, [rule], lines, 'boundary');
  }

  // Направление зависимостей. `import type` пропускаем: типы не создают
  // связи во время выполнения, а контракты живут в data (§2, схемы).
  const allowed = ALLOWED_IMPORTS[layer] ?? null;
  if (allowed) {
    const re = /^\s*import\s+(type\s+)?([\s\S]*?)from\s+['"]([^'"]+)['"]/gm;
    let match;
    while ((match = re.exec(source)) !== null) {
      const isTypeOnly = Boolean(match[1]) || /^\s*\{\s*type\s/.test(match[2] ?? '');
      const target = importLayer(file, match[3] ?? '');
      if (!target || target === layer || isTypeOnly) continue;
      if (allowed.includes(target)) continue;

      const lineNo = source.slice(0, match.index).split('\n').length;
      const line = lines[lineNo - 1] ?? '';
      if (exempt(line, 'boundary')) continue;
      report(
        file,
        lineNo,
        `запрещённое направление: ${layer} → ${target} (разрешено: ${allowed.join(', ')})`,
        line,
      );
    }
  }
}

// Зарезервированные маршруты
const pagesDir = join(SRC, 'pages');
if (existsSync(pagesDir)) {
  for (const entry of readdirSync(pagesDir)) {
    const name = entry.replace(/\.(astro|md|mdx|ts|js)$/, '');
    if (RESERVED_ROUTES.includes(name)) {
      report(
        join(pagesDir, entry),
        1,
        `маршрут /${name} зарезервирован на будущее и не должен быть занят (§4)`,
        entry,
      );
    }
  }
}

if (problems.length > 0) {
  for (const p of problems) {
    console.error(`${p.file}:${p.lineNo}  ${p.message}`);
    console.error(`    ${p.text}`);
  }
  console.error(`\nНарушений конвенций и границ: ${problems.length}.`);
  process.exit(1);
}

console.log('✓ конвенции: vh не найден, физических left/right нет');
console.log('✓ границы слоёв, источники данных, литералы и зарезервированные URL — чисто');
