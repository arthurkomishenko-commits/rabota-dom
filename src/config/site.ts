/**
 * Единственный модуль конфигурации проекта.
 *
 * Что делает: отдаёт все настройки, от которых зависит код — адрес сайта, базовый
 * путь, языковую матрицу. Магические константы в компонентах и страницах запрещены
 * (ARCHITECTURE_PRINCIPLES §2).
 * Вход: нет. Выход: константы и типы.
 * Кто использует: `src/lib/*`, `src/data/*`, `src/layouts/*`, `src/pages/*`.
 *
 * ВАЖНО про адрес и base: их значения заданы в `astro.config.mjs` и здесь НЕ
 * дублируются — читаются из окружения, которое Astro наполняет из того же конфига
 * (DEC-0002). Переезд на домен остаётся правкой двух строк в одном файле.
 *
 * Здесь намеренно НЕТ телефона, ставок, лимитов и ссылок на соцсети: в F0 их
 * никто не использует, а константа без потребителя — спекулятивная конструкция
 * (ARCHITECTURE_PRINCIPLES §1). Они появятся в фазе первого реального применения.
 */

/** Абсолютный адрес сайта без завершающего слэша, например `https://example.com`. */
export const SITE_URL: string = import.meta.env.SITE;

/** Базовый путь с завершающим слэшем: `/rabota-dom/` или `/`. */
export const BASE_URL: string = import.meta.env.BASE_URL;

// ── Языковая матрица (бриф §2) ────────────────────────────────────────────────

export const LOCALES = ['he', 'ru', 'en'] as const;
export type Locale = (typeof LOCALES)[number];

/** Иврит — язык по умолчанию, живёт в корне без префикса. */
export const DEFAULT_LOCALE: Locale = 'he';

export const LOCALE_DIR: Record<Locale, 'rtl' | 'ltr'> = {
  he: 'rtl',
  ru: 'ltr',
  en: 'ltr',
};

/**
 * Название языка на нём самом. Решение Артура от 07.08.2026: язык выбирает тот,
 * кто НЕ читает текущий язык страницы, поэтому подпись обязана быть на целевом
 * языке. Цена — загрузка всех трёх сабсетов (DEC-0008).
 */
export const LOCALE_LABEL: Record<Locale, string> = {
  he: 'עברית',
  ru: 'Русский',
  en: 'English',
};

/**
 * Карта маршрутов сайта (бриф §3). Один источник путей: страницы, навигация,
 * hreflang и sitemap берут адреса отсюда, а не пишут строками по месту.
 * Локализация — через `astro:i18n`, который сам добавит base и префикс языка.
 */
export const ROUTES = {
  home: '/',
  portfolio: '/portfolio/',
  services: '/services/',
  pergolas: '/pergolas/',
  canopies: '/canopies/',
  fences: '/fences/',
  calculator: '/calculator/',
  map: '/map/',
  about: '/about/',
  contact: '/contact/',
  privacy: '/privacy/',
  accessibility: '/accessibility/',
} as const;

export type RouteKey = keyof typeof ROUTES;

/**
 * Публичный запуск. Пока `false`:
 *  · все страницы несут `noindex` (DEC-0006);
 *  · `robots.txt` закрывает сайт целиком;
 *  · `sitemap.xml` не генерируется.
 *
 * Один признак на все три места. Раньше `noindex` жил в пропсах страниц,
 * и robots мог бы разрешить то, что страницы запрещают — расхождение,
 * которое заметили бы уже по выдаче.
 *
 * Переключается в `true` вместе с Content Freeze, одной правкой,
 * и это фиксируется в DECISIONS.
 */
export const PUBLIC_LAUNCH = false;

/**
 * Контакты (бриф §2). Телефон = WhatsApp, один номер.
 * Хранится в E.164 (§3 принципов); показывается в местном виде.
 * Это единственное место, где номер записан — проверка границ не пустит
 * его литералом никуда больше.
 */
const PHONE_E164 = '+972549731889';

export const PHONE_HREF = `tel:${PHONE_E164}`;
export const PHONE_DISPLAY = '054-973-1889';
export const WHATSAPP_URL = `https://wa.me/${PHONE_E164.replace('+', '')}`;

/**
 * Порядок главного меню. Отдельно от карты маршрутов: не всё, что существует,
 * попадает в навигацию — калькулятор скрыт, пока ставки в draft (бриф §6),
 * карта скрыта, пока точек меньше шести (бриф §5).
 */
export const NAV_ORDER = [
  'portfolio',
  'services',
  'about',
  'contact',
] as const satisfies readonly RouteKey[];

/**
 * Пути (без base), которые не входят в языковую матрицу — бриф §2, §9.
 * `/__ui` — витрина компонентов; в production-сборке её маршрута не существует
 * вовсе (DEC-0011), запись здесь страхует локальные и showcase-сборки.
 */
export const NON_LOCALIZED_PREFIXES = ['/admin', '/__ui'] as const;
