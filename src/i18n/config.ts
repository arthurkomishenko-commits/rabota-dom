/**
 * Языковая матрица проекта. Бриф §2.
 *
 * '/' = иврит (RTL, без префикса) · '/ru/' · '/en/'.
 * '/admin' в матрицу не входит — собирается как обычная статика (бриф §2, §9).
 */

export const LOCALES = ['he', 'ru', 'en'] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'he';

export const LOCALE_DIR: Record<Locale, 'rtl' | 'ltr'> = {
  he: 'rtl',
  ru: 'ltr',
  en: 'ltr',
};

/** Имя языка на самом языке — для переключателя. */
export const LOCALE_LABEL: Record<Locale, string> = {
  he: 'עברית',
  ru: 'Русский',
  en: 'English',
};

/** Префиксы (без base), которые не локализуются. */
export const NON_LOCALIZED_PREFIXES = ['/admin'] as const;

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

/**
 * Убирает base-префикс из pathname.
 * Astro отдаёт `Astro.url.pathname` вместе с base ('/rabota-dom/ru/').
 * Значение base читается из окружения — второй копии константы в коде нет.
 */
export function stripBase(pathname: string): string {
  const base = import.meta.env.BASE_URL || '/';
  if (base === '/') return pathname || '/';

  const trimmed = base.endsWith('/') ? base.slice(0, -1) : base;
  if (pathname === trimmed) return '/';
  if (pathname.startsWith(`${trimmed}/`)) return pathname.slice(trimmed.length);
  return pathname || '/';
}

/** Локаль текущего URL. Для дефолтной локали префикса нет, поэтому она же и фоллбек. */
export function getLocaleFromPath(pathname: string): Locale {
  const segment = stripBase(pathname).split('/').filter(Boolean)[0];
  return segment && isLocale(segment) && segment !== DEFAULT_LOCALE ? segment : DEFAULT_LOCALE;
}

/** Путь вне языковой матрицы — hreflang и переключатель языка для него не строятся. */
export function isNonLocalizedPath(pathname: string): boolean {
  const path = stripBase(pathname);
  return NON_LOCALIZED_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`));
}

/**
 * «Ключ маршрута» — путь без base и без языкового префикса: '/', '/portfolio/'.
 * По нему строятся ссылки на те же страницы в других локалях.
 */
export function getRouteKey(pathname: string): string {
  const path = stripBase(pathname);
  const segments = path.split('/').filter(Boolean);

  if (segments.length > 0 && isLocale(segments[0]!) && segments[0] !== DEFAULT_LOCALE) {
    segments.shift();
  }

  return segments.length === 0 ? '/' : `/${segments.join('/')}/`;
}
