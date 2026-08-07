/**
 * Чистые функции работы с языковыми маршрутами.
 *
 * Что делает: разбирает pathname на base / локаль / маршрут и отвечает на вопросы
 * «какая это локаль», «входит ли путь в языковую матрицу», «какой у него маршрут».
 * Вход: `pathname` вида `/rabota-dom/ru/portfolio/`. Выход: строки и флаги.
 * Кто использует: `src/layouts/BaseLayout.astro`, страницы.
 *
 * Побочных эффектов нет. Зависит только от `src/config/site.ts`
 * (ARCHITECTURE_PRINCIPLES §2: lib → config, и никуда больше).
 */
import {
  BASE_URL,
  DEFAULT_LOCALE,
  LOCALES,
  NON_LOCALIZED_PREFIXES,
  type Locale,
} from '../config/site';

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

/**
 * Убирает base-префикс из pathname.
 * Astro отдаёт `Astro.url.pathname` вместе с base (`/rabota-dom/ru/`).
 */
export function stripBase(pathname: string): string {
  if (BASE_URL === '/') return pathname || '/';

  const trimmed = BASE_URL.endsWith('/') ? BASE_URL.slice(0, -1) : BASE_URL;
  if (pathname === trimmed) return '/';
  if (pathname.startsWith(`${trimmed}/`)) return pathname.slice(trimmed.length);
  return pathname || '/';
}

/** Локаль текущего URL. У локали по умолчанию префикса нет, поэтому она же и фоллбек. */
export function getLocaleFromPath(pathname: string): Locale {
  const segment = stripBase(pathname).split('/').filter(Boolean)[0];
  return segment && isLocale(segment) && segment !== DEFAULT_LOCALE ? segment : DEFAULT_LOCALE;
}

/** Путь вне языковой матрицы: hreflang и переключатель языка для него не строятся. */
export function isNonLocalizedPath(pathname: string): boolean {
  const path = stripBase(pathname);
  return NON_LOCALIZED_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`));
}

/**
 * «Ключ маршрута» — путь без base и без языкового префикса: `/`, `/portfolio/`.
 * По нему строятся ссылки на ту же страницу в других локалях.
 */
export function getRouteKey(pathname: string): string {
  const path = stripBase(pathname);
  const segments = path.split('/').filter(Boolean);

  if (segments.length > 0 && isLocale(segments[0]!) && segments[0] !== DEFAULT_LOCALE) {
    segments.shift();
  }

  return segments.length === 0 ? '/' : `/${segments.join('/')}/`;
}
