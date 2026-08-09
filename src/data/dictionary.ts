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
  /** Маркер демо-данных (бриф §13). Исчезнет вместе с демо-контентом. */
  demo: { badge: string };
  /** Материалы: в данных — код, у человека — слово на его языке. */
  materials: { wood: string; metal: string; combo: string };

  /** Навигация и общие подписи каркаса страницы (неймспейс `nav.*`, §3). */
  nav: {
    label: string;
    home: string;
    portfolio: string;
    services: string;
    about: string;
    contact: string;
    privacy: string;
    accessibility: string;
    skipToContent: string;
    brandDescriptor: string;
  };

  /** Юридические страницы. Простым языком, без канцелярита (EDITORIAL §10). */
  legal: {
    privacyTitle: string;
    privacyIntro: string;
    privacyWhat: string;
    privacyWhatBody: string;
    privacyWhy: string;
    privacyWhyBody: string;
    privacyKeep: string;
    privacyKeepBody: string;
    privacyReviews: string;
    privacyReviewsBody: string;
    privacyRights: string;
    privacyRightsBody: string;
    accessibilityTitle: string;
    accessibilityIntro: string;
    accessibilityDone: string;
    accessibilityDoneBody: string;
    accessibilityLimits: string;
    accessibilityLimitsBody: string;
    accessibilityContact: string;
    updated: string;
  };

  /** Типы работ: в данных — код, у человека — слово. */
  types: { pergola: string; canopy: string; fence: string };

  /** Портфолио: список, фильтры, страница паспорта. */
  portfolio: {
    title: string;
    intro: string;
    empty: string;
    filters: string;
    filterAll: string;
    filterType: string;
    filterMaterial: string;
    filterCity: string;
    found: string;
    reset: string;
    hardPart: string;
    photos: string;
    openPhoto: string;
    closeLightbox: string;
    prevPhoto: string;
    nextPhoto: string;
    duration: string;
    otherWorks: string;
    backToList: string;
  };

  /** Страница 404. */
  notFound: { title: string; body: string; toHome: string };
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
    demo: { badge: 'נתוני הדגמה' },
    materials: { wood: 'עץ', metal: 'מתכת', combo: 'משולב' },
    types: { pergola: 'פרגולה', canopy: 'קירוי', fence: 'גדר' },
    portfolio: {
      title: 'עבודות',
      intro: 'כל עבודה עם מידות, חומר וזמן ביצוע. בלי מספרים שאי אפשר לבדוק.',
      empty: 'עדיין לא העלינו עבודות לאתר. כתבו לנו — נראה תמונות בוואטסאפ.',
      filters: 'סינון עבודות',
      filterAll: 'הכול',
      filterType: 'סוג',
      filterMaterial: 'חומר',
      filterCity: 'עיר',
      found: 'נמצאו עבודות',
      reset: 'איפוס סינון',
      hardPart: 'מה היה הכי מורכב',
      photos: 'תמונות',
      openPhoto: 'פתיחת התמונה בגודל מלא',
      closeLightbox: 'סגירה',
      prevPhoto: 'התמונה הקודמת',
      nextPhoto: 'התמונה הבאה',
      duration: 'זמן ביצוע',
      otherWorks: 'עבודות נוספות',
      backToList: 'לכל העבודות',
    },
    nav: {
      label: 'ניווט ראשי',
      home: 'דף הבית',
      portfolio: 'עבודות',
      services: 'שירותים',
      about: 'על האומן',
      contact: 'יצירת קשר',
      privacy: 'פרטיות',
      accessibility: 'נגישות',
      skipToContent: 'דילוג לתוכן',
      brandDescriptor: 'פרגולות, קירויים וגדרות. נוף הגליל וצפון הארץ',
    },
    legal: {
      privacyTitle: 'איך אנחנו מטפלים בפרטים שלכם',
      privacyIntro: 'בקצרה ובלי ערפל משפטי. אם משהו לא ברור, שאלו ונענה בשפה פשוטה.',
      privacyWhat: 'מה אנחנו מקבלים',
      privacyWhatBody: 'שם וטלפון שהשארתם בטופס. אם כתבתם בוואטסאפ, מה שכתבתם שם. עיר לפי בחירה. שום דבר נוסף איננו אוספים ואיננו קונים.',
      privacyWhy: 'בשביל מה',
      privacyWhyBody: 'כדי לחזור אליכם ולדבר על העבודה. איננו שולחים דיוור ואיננו מעבירים את הפרטים לאף אחד.',
      privacyKeep: 'כמה זמן שומרים',
      privacyKeepBody: 'את הפנייה — כל עוד מתנהלת השיחה והעבודה. אחר כך היא לא נחוצה לנו. תבקשו למחוק, נמחק.',
      privacyReviews: 'חוות דעת ותמונות',
      privacyReviewsBody: 'חוות דעת מתפרסמת רק בהסכמתכם ואחרי בדיקה של האומן. שיניתם דעת — כתבו לנו, ונסיר אותה תוך שבעה ימים. תמונות של החצר עולות רק אם אתם בסדר עם זה, ואנחנו שואלים מראש.',
      privacyRights: 'הזכויות שלכם',
      privacyRightsBody: 'אפשר לבקש לראות מה יש אצלנו, לתקן או למחוק. הודעה בוואטסאפ או שיחה מספיקות.',
      accessibilityTitle: 'נגישות האתר',
      accessibilityIntro: 'אנחנו בונים את האתר כך שאפשר יהיה להשתמש בו עם מקלדת, עם קורא מסך ובראייה חלשה.',
      accessibilityDone: 'מה כבר נעשה',
      accessibilityDoneBody: 'סימון עם משמעות, לא ערימת קופסאות. כל פקד נגיש מהמקלדת ורואים איפה הפוקוס. לתמונות יש תיאור טקסטואלי. הניגודיות נמדדת ולא מוערכת בעין. יש מצב בהיר וכהה, והבחירה נשמרת. אנימציות נעצרות אם המערכת מבקשת זאת.',
      accessibilityLimits: 'מה עדיין לא מכוסה',
      accessibilityLimitsBody: 'מצב הגופן לדיסלקציה מכסה אותיות לטיניות וקיריליות. גופן חופשי לדיסלקציה בעברית אינו קיים, ולכן בעברית אנחנו מפצים בגודל וברווחים. זה פחות ממה שהיינו רוצים, ואנחנו אומרים זאת בגלוי.',
      accessibilityContact: 'מצאתם תקלה — כתבו לנו. נבדוק ונתקן.',
      updated: 'עודכן',
    },
    notFound: {
      title: 'הדף הזה לא קיים',
      body: 'ייתכן שהקישור התיישן, או שיש טעות בכתובת.',
      toHome: 'לדף הבית',
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
    demo: { badge: 'Демо-данные' },
    materials: { wood: 'Дерево', metal: 'Металл', combo: 'Комбо' },
    types: { pergola: 'Пергола', canopy: 'Навес', fence: 'Забор' },
    portfolio: {
      title: 'Работы',
      intro: 'Каждая работа с размерами, материалом и сроком. Без цифр, которые нельзя проверить.',
      empty: 'Работы на сайт ещё не выложены. Напишите — покажем фотографии в WhatsApp.',
      filters: 'Фильтр работ',
      filterAll: 'Все',
      filterType: 'Тип',
      filterMaterial: 'Материал',
      filterCity: 'Город',
      found: 'Найдено работ',
      reset: 'Сбросить фильтр',
      hardPart: 'Что было самым сложным',
      photos: 'Фотографии',
      openPhoto: 'Открыть фото в полный размер',
      closeLightbox: 'Закрыть',
      prevPhoto: 'Предыдущее фото',
      nextPhoto: 'Следующее фото',
      duration: 'Срок работ',
      otherWorks: 'Другие работы',
      backToList: 'Ко всем работам',
    },
    nav: {
      label: 'Основная навигация',
      home: 'Главная',
      portfolio: 'Работы',
      services: 'Услуги',
      about: 'О мастере',
      contact: 'Связаться',
      privacy: 'Конфиденциальность',
      accessibility: 'Доступность',
      skipToContent: 'Перейти к содержимому',
      brandDescriptor: 'Перголы, навесы и заборы. Ноф-ха-Галиль и север Израиля',
    },
    legal: {
      privacyTitle: 'Как мы обращаемся с вашими данными',
      privacyIntro: 'Коротко и без юридического тумана. Если что-то осталось непонятным — спросите, ответим человеческим языком.',
      privacyWhat: 'Что мы получаем',
      privacyWhatBody: 'Имя и телефон, которые вы сами оставили в форме. Если писали в WhatsApp — то, что написали. Город указывается по желанию. Ничего больше мы не собираем и не покупаем.',
      privacyWhy: 'Зачем',
      privacyWhyBody: 'Чтобы перезвонить и обсудить работу. Рассылок мы не делаем и никому ваши данные не передаём.',
      privacyKeep: 'Сколько храним',
      privacyKeepBody: 'Заявку — пока идёт разговор и работа. Дальше она нам не нужна. Попросите удалить — удалим.',
      privacyReviews: 'Отзывы и фото',
      privacyReviewsBody: 'Отзыв публикуется только с вашего согласия и после проверки мастером. Передумали — напишите, и мы удалим отзыв в течение семи дней. Фото двора публикуем, только если вы не против; спрашиваем заранее.',
      privacyRights: 'Ваши права',
      privacyRightsBody: 'Вы можете попросить показать, что у нас есть, исправить или удалить. Для этого достаточно написать в WhatsApp или позвонить.',
      accessibilityTitle: 'Доступность сайта',
      accessibilityIntro: 'Мы делаем сайт так, чтобы им можно было пользоваться с клавиатуры, со скринридером и при слабом зрении.',
      accessibilityDone: 'Что уже сделано',
      accessibilityDoneBody: 'Разметка со смыслом, а не набор блоков. Каждый элемент управления достижим с клавиатуры, и видно, где сейчас фокус. У изображений есть текстовые описания. Контраст проверяется измерением, а не на глаз. Есть светлая и тёмная темы, и выбор сохраняется. Анимации отключаются, если так настроена система.',
      accessibilityLimits: 'Что пока не покрыто',
      accessibilityLimitsBody: 'Режим шрифта для дислексии работает для латиницы и кириллицы. Свободного шрифта для дислексии на иврите не существует, поэтому для иврита мы компенсируем размером и интервалами — это меньше, чем хотелось бы, и мы говорим об этом прямо.',
      accessibilityContact: 'Нашли проблему — напишите. Разберёмся и исправим.',
      updated: 'Обновлено',
    },
    notFound: {
      title: 'Такой страницы нет',
      body: 'Возможно, ссылка устарела или в адресе опечатка.',
      toHome: 'На главную',
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
    demo: { badge: 'Demo data' },
    materials: { wood: 'Wood', metal: 'Metal', combo: 'Combo' },
    types: { pergola: 'Pergola', canopy: 'Canopy', fence: 'Fence' },
    portfolio: {
      title: 'Work',
      intro: 'Every project with sizes, material and time on site. No numbers you cannot verify.',
      empty: 'Nothing is published here yet. Write to us and we will show photos on WhatsApp.',
      filters: 'Filter the work',
      filterAll: 'All',
      filterType: 'Type',
      filterMaterial: 'Material',
      filterCity: 'City',
      found: 'Projects found',
      reset: 'Reset filter',
      hardPart: 'The hard part',
      photos: 'Photos',
      openPhoto: 'Open the photo full size',
      closeLightbox: 'Close',
      prevPhoto: 'Previous photo',
      nextPhoto: 'Next photo',
      duration: 'Time on site',
      otherWorks: 'Other work',
      backToList: 'All projects',
    },
    nav: {
      label: 'Main navigation',
      home: 'Home',
      portfolio: 'Work',
      services: 'Services',
      about: 'About',
      contact: 'Get in touch',
      privacy: 'Privacy',
      accessibility: 'Accessibility',
      skipToContent: 'Skip to content',
      brandDescriptor: 'Pergolas, canopies and fences. Nof HaGalil and northern Israel',
    },
    legal: {
      privacyTitle: 'How we handle your data',
      privacyIntro: 'Short, and without legal fog. If something stays unclear, ask us and we will answer in plain words.',
      privacyWhat: 'What we receive',
      privacyWhatBody: 'The name and phone number you leave in the form. If you write on WhatsApp, whatever you write there. City is optional. We collect nothing else and buy nothing.',
      privacyWhy: 'What for',
      privacyWhyBody: 'To call you back and discuss the work. We run no mailing lists and pass your data to no one.',
      privacyKeep: 'How long we keep it',
      privacyKeepBody: 'The request stays while we talk and while the work runs. After that we do not need it. Ask us to delete it and we will.',
      privacyReviews: 'Reviews and photos',
      privacyReviewsBody: 'A review is published only with your consent and after the master checks it. Changed your mind? Write to us and we remove it within seven days. Photos of your yard go up only if you are fine with it, and we ask in advance.',
      privacyRights: 'Your rights',
      privacyRightsBody: 'You can ask to see what we hold, to correct it or to delete it. A message on WhatsApp or a call is enough.',
      accessibilityTitle: 'Accessibility',
      accessibilityIntro: 'We build this site so it can be used with a keyboard, with a screen reader and with low vision.',
      accessibilityDone: 'What is already done',
      accessibilityDoneBody: 'Markup with meaning, not a pile of boxes. Every control is reachable by keyboard and the focus is visible. Images carry text descriptions. Contrast is measured, not guessed. There are light and dark themes, and the choice is remembered. Animations stop if the system asks for it.',
      accessibilityLimits: 'What is not covered yet',
      accessibilityLimitsBody: 'The dyslexia font mode covers Latin and Cyrillic. No free dyslexia font exists for Hebrew, so for Hebrew we compensate with size and spacing. That is less than we would like, and we say so plainly.',
      accessibilityContact: 'Found a problem? Write to us. We will look into it and fix it.',
      updated: 'Updated',
    },
    notFound: {
      title: 'This page does not exist',
      body: 'The link may be outdated, or there is a typo in the address.',
      toHome: 'Go to the home page',
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
