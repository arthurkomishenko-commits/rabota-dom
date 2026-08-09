/**
 * Репозиторий словарей интерфейса.
 *
 * Что делает: отдаёт набор строк для одной локали. Единственное место, знающее,
 * ОТКУДА берутся строки (ARCHITECTURE_PRINCIPLES §2). Сейчас это литерал в модуле;
 * когда словари переедут в `astro:content` или во внешний источник, поменяется
 * только этот файл — вызывающий код не заметит.
 * Вход: локаль. Выход: `Dictionary`.
 * Кто использует: страницы (`src/pages/*`). Компоненты получают строки через props.
 *
 * Ключи — по неймспейсам (ARCHITECTURE_PRINCIPLES §3): новый раздел сайта заводит
 * новый неймспейс, а не правит существующие.
 *
 * ВНИМАНИЕ: здесь только СИСТЕМНЫЕ строки. Продающих текстов нет и быть не должно —
 * они появятся в F3, проходят EDITORIAL.md и вычитку иврита Владимиром.
 * Неймспейс `scaffold` удаляется в F3 вместе с технической страницей.
 */
import type { Locale } from '../config/site';

export type Dictionary = {
  /** Подписи единиц измерения. Живут в словаре: это текст, а не данные. */
  units: {
    m: string;
    m2: string;
    lm: string;
    mm: string;
    pcs: string;
    days: string;
  };
  theme: {
    /** Подпись тумблера показывает, КУДА переключит нажатие. */
    toLight: string;
    toDark: string;
  };
  scaffold: {
    title: string;
    heading: string;
    dirLabel: string;
    fontLabel: string;
    mirrorLabel: string;
    start: string;
    end: string;
    langNavLabel: string;
  };
};

const DICTIONARIES: Record<Locale, Dictionary> = {
  he: {
    units: { m: 'מ׳', m2: 'מ״ר', lm: 'מ׳', mm: 'מ״מ', pcs: 'יח׳', days: 'ימים' },
    theme: {
      toLight: 'מצב בהיר',
      toDark: 'מצב כהה',
    },
    scaffold: {
      title: 'Rabota Dom — שלד טכני',
      heading: 'שלד טכני',
      dirLabel: 'כיוון',
      fontLabel: 'גופן',
      mirrorLabel: 'בדיקת כיוון',
      start: 'התחלה',
      end: 'סוף',
      langNavLabel: 'בחירת שפה',
    },
  },
  ru: {
    units: { m: 'м', m2: 'м²', lm: 'пог. м', mm: 'мм', pcs: 'шт', days: 'дней' },
    theme: {
      toLight: 'Светлая тема',
      toDark: 'Тёмная тема',
    },
    scaffold: {
      title: 'Rabota Dom — технический каркас',
      heading: 'Технический каркас',
      dirLabel: 'Направление',
      fontLabel: 'Шрифт',
      mirrorLabel: 'Проверка направления',
      start: 'Начало',
      end: 'Конец',
      langNavLabel: 'Выбор языка',
    },
  },
  en: {
    units: { m: 'm', m2: 'm²', lm: 'lm', mm: 'mm', pcs: 'pcs', days: 'days' },
    theme: {
      toLight: 'Light theme',
      toDark: 'Dark theme',
    },
    scaffold: {
      title: 'Rabota Dom — technical scaffold',
      heading: 'Technical scaffold',
      dirLabel: 'Direction',
      fontLabel: 'Font',
      mirrorLabel: 'Direction check',
      start: 'Start',
      end: 'End',
      langNavLabel: 'Language',
    },
  },
};

export function getDictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale];
}
