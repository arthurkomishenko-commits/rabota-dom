/**
 * Словари интерфейса.
 *
 * ВНИМАНИЕ: сейчас здесь только СИСТЕМНЫЕ строки фазы F0 (техническая
 * страница-проверка и тумблер темы). Продающих текстов тут нет и быть
 * не должно — они появятся в F3 и проходят EDITORIAL.md + вычитку иврита
 * Владимиром. CI-проверка banned-phrases подключается в F2 и будет
 * сканировать этот файл тоже.
 */
import type { Locale } from './config';

type Dict = {
  /** <title> технической страницы F0 */
  scaffoldTitle: string;
  scaffoldHeading: string;
  /** Подпись тумблера: на какую тему переключит нажатие */
  themeLight: string;
  themeDark: string;
  dirLabel: string;
  fontLabel: string;
  /** Полоса для проверки зеркалирования RTL */
  mirrorLabel: string;
  start: string;
  end: string;
};

export const UI: Record<Locale, Dict> = {
  he: {
    scaffoldTitle: 'Rabota Dom — שלד טכני',
    scaffoldHeading: 'שלד טכני',
    themeLight: 'מצב בהיר',
    themeDark: 'מצב כהה',
    dirLabel: 'כיוון',
    fontLabel: 'גופן',
    mirrorLabel: 'בדיקת כיוון',
    start: 'התחלה',
    end: 'סוף',
  },
  ru: {
    scaffoldTitle: 'Rabota Dom — технический каркас',
    scaffoldHeading: 'Технический каркас',
    themeLight: 'Светлая тема',
    themeDark: 'Тёмная тема',
    dirLabel: 'Направление',
    fontLabel: 'Шрифт',
    mirrorLabel: 'Проверка направления',
    start: 'Начало',
    end: 'Конец',
  },
  en: {
    scaffoldTitle: 'Rabota Dom — technical scaffold',
    scaffoldHeading: 'Technical scaffold',
    themeLight: 'Light theme',
    themeDark: 'Dark theme',
    dirLabel: 'Direction',
    fontLabel: 'Font',
    mirrorLabel: 'Direction check',
    start: 'Start',
    end: 'End',
  },
};
