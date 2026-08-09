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

  /** Услуги: общая страница и три страницы типов. */
  services: {
    title: string;
    intro: string;
    what: string;
    materials: string;
    priceFactors: string;
    ourWorks: string;
    cta: string;
    ctaNote: string;
    pergolaTitle: string;
    pergolaLead: string;
    pergolaWhat: string;
    pergolaMaterials: string;
    pergolaPrice: string;
    canopyTitle: string;
    canopyLead: string;
    canopyWhat: string;
    canopyMaterials: string;
    canopyPrice: string;
    fenceTitle: string;
    fenceLead: string;
    fenceWhat: string;
    fenceMaterials: string;
    fencePrice: string;
  };

  /** О мастере и контакты. Траст-формула — дословно из брифа §1. */
  about: {
    title: string;
    lead: string;
    trustFormula: string;
    howTitle: string;
    step1: string;
    step2: string;
    step3: string;
    step4: string;
    principlesTitle: string;
    principle1: string;
    principle2: string;
    principle3: string;
    guarantee: string;
    guaranteeBody: string;
  };
  contact: {
    title: string;
    lead: string;
    whatsapp: string;
    call: string;
    formTitle: string;
    priceHonesty: string;
  };

  /** Главная: десять экранов по брифу §3. */
  home: {
    heroKicker: string;
    heroTitle: string;
    heroLead: string;
    heroCta: string;
    heroCallLabel: string;
    trustTitle: string;
    trustPoint2: string;
    trustPoint3: string;
    latestTitle: string;
    latestAll: string;
    howTitle: string;
    formTitle: string;
    formLead: string;
    principlesTitle: string;
    faqTitle: string;
    finalTitle: string;
    finalLead: string;
    mapTeaserTitle: string;
    mapTeaserBody: string;
    mapTeaserCta: string;
  };
  /** FAQ: вопрос и ответ. Цена и гарантия — формулы брифа §1 дословно. */
  faq: { q: string; a: string }[];

  /** Формы: подписи, состояния, ошибки. */
  forms: {
    name: string;
    namePlaceholder: string;
    phone: string;
    phonePlaceholder: string;
    city: string;
    cityPlaceholder: string;
    comment: string;
    submit: string;
    sending: string;
    consent: string;
    thanksTitle: string;
    thanksBody: string;
    sendAnother: string;
    errorPhone: string;
    errorName: string;
    rateLimited: string;
    serverError: string;
    offline: string;
    whatsappFallback: string;
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
    services: {
      title: 'שירותים',
      intro: 'שלושה סוגי עבודה. בכל אחד — מה זה, ממה מרכיבים ומה משפיע על המחיר.',
      what: 'מה זה',
      materials: 'ממה מרכיבים',
      priceFactors: 'מה משפיע על המחיר',
      ourWorks: 'עבודות מסוג זה',
      cta: 'קבלת הערכה ראשונית',
      ctaNote: 'כל פרויקט מחושב לגופו. נגיע, נמדוד ונאמר מחיר — הערכה ראשונית בלי התחייבות.',
      pergolaTitle: 'פרגולות',
      pergolaLead: 'צל מעל הרחבה או הכניסה, בלי להפוך את החצר לחדר סגור.',
      pergolaWhat: 'מבנה עם עמודים וקורות. השלבים מעבירים אוויר ושוברים את השמש, ובחורף נותנים לאור להיכנס.',
      pergolaMaterials: 'עץ, אלומיניום או שילוב. אלומיניום לא מתעוות בלחות; עץ חם למראה ודורש תחזוקה.',
      pergolaPrice: 'שטח, אופן החיבור לקיר או עמידה חופשית, סוג הכיסוי, שיפוע הרחבה ופירוק של מבנה קודם.',
      canopyTitle: 'קירויים',
      canopyLead: 'הגנה מגשם ומשמש מעל כניסה, חניה או מרפסת.',
      canopyWhat: 'קירוי סגור יותר מפרגולה: המים יורדים לצד שנקבע מראש, לא על הראש.',
      canopyMaterials: 'שלד מתכת או אלומיניום, כיסוי אטום או פוליקרבונט.',
      canopyPrice: 'מפתח, שיפוע, ניקוז והאם יש למה להתחבר בקיר.',
      fenceTitle: 'גדרות',
      fenceLead: 'גבול המגרש: פחות מבטים מבחוץ, בלי קיר אטום מבפנים.',
      fenceWhat: 'עמודים, קורות ומילוי. הרווחים קובעים כמה רואים ואיך עובר האוויר.',
      fenceMaterials: 'עץ, מתכת או שילוב. העמודים מבוטנים תמיד.',
      fencePrice: 'אורך, גובה, הפרשי גובה במגרש, מספר השערים וסוג המילוי.',
    },
    about: {
      title: 'על האומן',
      lead: 'ולדימיר עובד בצפון הארץ. פרגולות, קירויים וגדרות — עץ, מתכת ושילוב.',
      trustFormula: 'ולדימיר — הפנים של הפרויקט: מייעץ, מבצע את המדידה ומפקח על העבודה. את ההתקנה מבצע הצוות הקבוע שלו — בלי קבלני משנה ובלי מתווכים.',
      howTitle: 'איך מתנהלת העבודה',
      step1: 'קשר — מספרים מה רוצים, שולחים תמונה של המקום.',
      step2: 'מדידה — מגיעים, מודדים, אומרים מה אפשרי ומה לא.',
      step3: 'ייצור — חותכים ומכינים לפי המידות שנמדדו.',
      step4: 'התקנה — מרכיבים, מיישרים במפלס ומנקים אחרינו.',
      principlesTitle: 'עקרונות',
      principle1: 'לא מבטיחים תאריך שאי אפשר לעמוד בו. אם משהו זז — מודיעים מראש, לא ביום האחרון.',
      principle2: 'החומרים נבחרים לפי האקלים כאן, לא לפי מה שנשאר במחסן.',
      principle3: 'אחרי סיום העבודה החצר נשארת נקייה. זה חלק מהעבודה, לא טובה.',
      guarantee: 'אחריות',
      guaranteeBody: 'על כל העבודות ניתנת אחריות. היא מכסה את המבנה ואת ההתקנה; משך האחריות והתנאים נקבעים בהסכם לפני תחילת העבודה.',
    },
    contact: {
      title: 'יצירת קשר',
      lead: 'נענה בדרך שנוחה לכם.',
      whatsapp: 'כתיבה בוואטסאפ',
      call: 'שיחת טלפון',
      formTitle: 'להשאיר פנייה',
      priceHonesty: 'כל פרויקט מחושב לגופו. אחרי מדידה חינם נאמר מחיר — הערכה ראשונית בלי התחייבות.',
    },
    home: {
      heroKicker: 'ולדימיר · נוף הגליל',
      heroTitle: 'פרגולות, קירויים וגדרות',
      heroLead: 'מגיעים, מודדים ואומרים מחיר. אחר כך אתם מחליטים.',
      heroCta: 'קבלת הערכה ראשונית',
      heroCallLabel: 'טלפון',
      trustTitle: 'למה סומכים',
      trustPoint2: 'התקנה מסודרת וזמנים אמיתיים. את משך העבודה רואים בכל עבודה באתר, לא רק במילים.',
      trustPoint3: 'החומרים נבחרים לפי האקלים כאן: לחות, שמש וקרבה לים.',
      latestTitle: 'עבודות אחרונות',
      latestAll: 'כל העבודות',
      howTitle: 'איך מתנהלת העבודה',
      formTitle: 'להשאיר פנייה',
      formLead: 'נענה בדרך שנוחה לכם.',
      principlesTitle: 'עקרונות',
      faqTitle: 'שאלות שחוזרות',
      finalTitle: 'נדבר על החצר שלכם',
      finalLead: 'שלחו תמונה של המקום — נאמר מה אפשרי.',
      mapTeaserTitle: 'מפת העבודות',
      mapTeaserBody: 'לראות מה נבנה קרוב אליכם.',
      mapTeaserCta: 'פתיחת המפה',
    },
    forms: {
      name: 'שם',
      namePlaceholder: 'איך לפנות אליכם',
      phone: 'טלפון',
      phonePlaceholder: '050 000 0000',
      city: 'עיר',
      cityPlaceholder: 'לא חובה',
      comment: 'מה רוצים לבנות',
      submit: 'שליחת פנייה',
      sending: 'שולח…',
      consent: 'בשליחה אתם מסכימים שנשמור את השם והטלפון כדי לחזור אליכם.',
      thanksTitle: 'קיבלנו',
      thanksBody: 'נחזור אליכם. אם ממהרים — כתבו בוואטסאפ, שם עונים מהר יותר.',
      sendAnother: 'שליחת פנייה נוספת',
      errorPhone: 'נראה שחסרה ספרה במספר. פורמט: 050 000 0000',
      errorName: 'איך לפנות אליכם?',
      rateLimited: 'יותר מדי ניסיונות. נסו בעוד שעה או כתבו בוואטסאפ.',
      serverError: 'לא הצלחנו לשלוח. כתבו בוואטסאפ — זה יגיע מיד.',
      offline: 'אין חיבור. כתבו בוואטסאפ — זה יגיע מיד.',
      whatsappFallback: 'שליחה בוואטסאפ',
    },
    faq: [
      { q: 'כמה זה עולה?', a: 'כל פרויקט מחושב לגופו. אחרי מדידה חינם נאמר מחיר — הערכה ראשונית בלי התחייבות.' },
      { q: 'יש אחריות?', a: 'על כל העבודות ניתנת אחריות. היא מכסה את המבנה ואת ההתקנה; משך האחריות והתנאים נקבעים בהסכם לפני תחילת העבודה.' },
      { q: 'כמה זמן זה לוקח?', a: 'בכל עבודה באתר רשום כמה ימים היא לקחה. פרגולה בגודל בינוני — בדרך כלל כמה ימי עבודה אחרי הייצור.' },
      { q: 'עץ או אלומיניום?', a: 'אלומיניום לא מתעוות מלחות ודורש פחות תחזוקה. עץ נראה חם יותר. בשילוב לוקחים מכל אחד את מה שמתאים למקום.' },
      { q: 'צריך היתר?', a: 'תלוי בגודל ובמיקום ביחס לגבול המגרש. במדידה נאמר מה המצב אצלכם.' },
      { q: 'מה עם תחזוקה?', a: 'אלומיניום — שטיפה. עץ — שכבת הגנה אחת לכמה שנים, תלוי בחשיפה לשמש.' },
      { q: 'לאן מגיעים?', a: 'נוף הגליל והסביבה. למרחקים גדולים יותר — לפי היקף העבודה.' },
      { q: 'איך משלמים?', a: 'התנאים נקבעים בהסכם לפני תחילת העבודה, כדי שלא יהיו הפתעות באמצע.' },
      { q: 'אפשר לשנות משהו תוך כדי?', a: 'עדיף לפני הייצור: אחרי החיתוך שינוי עולה זמן וחומר. נאמר מראש מה עוד אפשר לשנות.' },
      { q: 'מי מנקה אחרי העבודה?', a: 'אנחנו. החצר נשארת נקייה — זה חלק מהעבודה, לא טובה.' },
    ],
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
    services: {
      title: 'Услуги',
      intro: 'Три типа работ. По каждому — что это, из чего собираем и что влияет на цену.',
      what: 'Что это',
      materials: 'Из чего собираем',
      priceFactors: 'Что влияет на цену',
      ourWorks: 'Работы этого типа',
      cta: 'Получить предварительную оценку',
      ctaNote: 'Каждый проект рассчитывается индивидуально. Приедем, замерим и назовём цену — предварительная оценка без обязательств.',
      pergolaTitle: 'Перголы',
      pergolaLead: 'Тень над площадкой или входом, без превращения двора в закрытую комнату.',
      pergolaWhat: 'Конструкция из опор и балок. Ламели пропускают воздух и разбивают солнце, а зимой дают свету пройти.',
      pergolaMaterials: 'Дерево, алюминий или комбинация. Алюминий не ведёт от влаги; дерево теплее на вид и требует ухода.',
      pergolaPrice: 'Площадь, крепление к стене или отдельная стойка, тип покрытия, уклон площадки и демонтаж старой конструкции.',
      canopyTitle: 'Навесы',
      canopyLead: 'Защита от дождя и солнца над входом, машиной или террасой.',
      canopyWhat: 'Навес закрытее перголы: вода уходит в заранее выбранную сторону, а не на голову.',
      canopyMaterials: 'Каркас из металла или алюминия, покрытие сплошное или поликарбонат.',
      canopyPrice: 'Пролёт, уклон, водоотвод и есть ли к чему крепиться в стене.',
      fenceTitle: 'Заборы',
      fenceLead: 'Граница участка: меньше взглядов снаружи, без глухой стены внутри.',
      fenceWhat: 'Опоры, лаги и заполнение. Просветы решают, насколько двор просматривается и как проходит воздух.',
      fenceMaterials: 'Дерево, металл или комбинация. Опоры бетонируются всегда.',
      fencePrice: 'Длина, высота, перепад по участку, число калиток и ворот, тип заполнения.',
    },
    about: {
      title: 'О мастере',
      lead: 'Владимир работает на севере Израиля. Перголы, навесы и заборы — дерево, металл, комбинация.',
      trustFormula: 'Владимир — лицо проекта: консультирует, делает замер и контролирует работу. Монтаж выполняет его постоянная команда — без субподрядчиков и посредников.',
      howTitle: 'Как проходит работа',
      step1: 'Связь — рассказываете, что хотите, присылаете фото места.',
      step2: 'Замер — приезжаем, меряем, говорим, что возможно, а что нет.',
      step3: 'Изготовление — режем и готовим по снятым размерам.',
      step4: 'Монтаж — собираем, выводим по уровню и убираем за собой.',
      principlesTitle: 'Принципы',
      principle1: 'Не обещаем дату, в которую нельзя уложиться. Если что-то сдвигается — говорим заранее, а не в последний день.',
      principle2: 'Материалы подбираются под здешний климат, а не по остаткам на складе.',
      principle3: 'После работы двор остаётся чистым. Это часть работы, а не одолжение.',
      guarantee: 'Гарантия',
      guaranteeBody: 'На все работы предоставляется гарантия. Она покрывает конструкцию и монтаж; срок и условия фиксируются в договоре перед началом работ.',
    },
    contact: {
      title: 'Связаться',
      lead: 'Ответим удобным для вас способом.',
      whatsapp: 'Написать в WhatsApp',
      call: 'Позвонить',
      formTitle: 'Оставить заявку',
      priceHonesty: 'Каждый проект рассчитывается индивидуально. После бесплатного замера назовём цену — предварительная оценка без обязательств.',
    },
    home: {
      heroKicker: 'Владимир · Ноф-ха-Галиль',
      heroTitle: 'Перголы, навесы и заборы',
      heroLead: 'Приезжаем, замеряем и называем цену. Дальше решаете вы.',
      heroCta: 'Получить предварительную оценку',
      heroCallLabel: 'Телефон',
      trustTitle: 'Почему доверяют',
      trustPoint2: 'Аккуратный монтаж и честные сроки. Срок работ виден в каждом объекте на сайте, а не только на словах.',
      trustPoint3: 'Материалы подбираются под здешний климат: влажность, солнце и близость моря.',
      latestTitle: 'Последние проекты',
      latestAll: 'Все работы',
      howTitle: 'Как проходит работа',
      formTitle: 'Оставить заявку',
      formLead: 'Ответим удобным для вас способом.',
      principlesTitle: 'Принципы',
      faqTitle: 'Частые вопросы',
      finalTitle: 'Поговорим о вашем дворе',
      finalLead: 'Пришлите фото места — скажем, что там возможно.',
      mapTeaserTitle: 'Карта работ',
      mapTeaserBody: 'Посмотреть, что построено рядом с вами.',
      mapTeaserCta: 'Открыть карту',
    },
    forms: {
      name: 'Имя',
      namePlaceholder: 'Как к вам обращаться',
      phone: 'Телефон',
      phonePlaceholder: '050 000 0000',
      city: 'Город',
      cityPlaceholder: 'Необязательно',
      comment: 'Что хотите построить',
      submit: 'Отправить заявку',
      sending: 'Отправляем…',
      consent: 'Отправляя, вы соглашаетесь, что мы сохраним имя и телефон, чтобы перезвонить.',
      thanksTitle: 'Получили',
      thanksBody: 'Перезвоним. Если срочно — напишите в WhatsApp, там отвечаем быстрее.',
      sendAnother: 'Отправить ещё заявку',
      errorPhone: 'Похоже, в номере не хватает цифры. Формат: 050 000 0000',
      errorName: 'Как к вам обращаться?',
      rateLimited: 'Слишком много попыток — попробуйте через час или напишите в WhatsApp.',
      serverError: 'Не смогли отправить. Напишите в WhatsApp — дойдёт сразу.',
      offline: 'Нет связи. Напишите в WhatsApp — дойдёт сразу.',
      whatsappFallback: 'Отправить через WhatsApp',
    },
    faq: [
      { q: 'Сколько это стоит?', a: 'Каждый проект рассчитывается индивидуально. После бесплатного замера назовём цену — предварительная оценка без обязательств.' },
      { q: 'Есть гарантия?', a: 'На все работы предоставляется гарантия. Она покрывает конструкцию и монтаж; срок и условия фиксируются в договоре перед началом работ.' },
      { q: 'Сколько времени занимает?', a: 'У каждой работы на сайте указано, сколько дней она заняла. Пергола среднего размера — обычно несколько рабочих дней после изготовления.' },
      { q: 'Дерево или алюминий?', a: 'Алюминий не ведёт от влаги и требует меньше ухода. Дерево выглядит теплее. В комбинации берут от каждого то, что подходит месту.' },
      { q: 'Нужно ли разрешение?', a: 'Зависит от размера и расстояния до границы участка. На замере скажем, как обстоит дело у вас.' },
      { q: 'Что с уходом?', a: 'Алюминий — помыть. Дерево — слой защиты раз в несколько лет, в зависимости от того, сколько на него светит.' },
      { q: 'Куда приезжаете?', a: 'Ноф-ха-Галиль и окрестности. Дальше — по объёму работы.' },
      { q: 'Как происходит оплата?', a: 'Условия фиксируются в договоре до начала работ, чтобы посреди процесса не возникало сюрпризов.' },
      { q: 'Можно что-то поменять по ходу?', a: 'Лучше до изготовления: после раскроя изменение стоит времени и материала. Заранее скажем, что ещё можно поменять.' },
      { q: 'Кто убирает после работы?', a: 'Мы. Двор остаётся чистым — это часть работы, а не одолжение.' },
    ],
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
    services: {
      title: 'Services',
      intro: 'Three kinds of work. For each one: what it is, what it is built from and what moves the price.',
      what: 'What it is',
      materials: 'What we build it from',
      priceFactors: 'What moves the price',
      ourWorks: 'Work of this kind',
      cta: 'Get a preliminary estimate',
      ctaNote: 'Every project is calculated individually. We come, measure and name the price — a preliminary estimate with no obligation.',
      pergolaTitle: 'Pergolas',
      pergolaLead: 'Shade over a patio or an entrance, without turning the yard into a closed room.',
      pergolaWhat: 'Posts and beams. Slats let air through and break the sun, and in winter they let the light in.',
      pergolaMaterials: 'Wood, aluminium or a combination. Aluminium does not warp in damp; wood looks warmer and needs care.',
      pergolaPrice: 'Area, wall-mounted or free-standing, type of cover, slope of the ground and removal of an old structure.',
      canopyTitle: 'Canopies',
      canopyLead: 'Cover from rain and sun over an entrance, a car or a terrace.',
      canopyWhat: 'A canopy is more closed than a pergola: water leaves to a side chosen in advance, not onto your head.',
      canopyMaterials: 'Steel or aluminium frame, solid cover or polycarbonate.',
      canopyPrice: 'Span, slope, drainage and whether there is something to fix to in the wall.',
      fenceTitle: 'Fences',
      fenceLead: 'The edge of the plot: fewer looks from outside, no blank wall inside.',
      fenceWhat: 'Posts, rails and infill. The gaps decide how exposed the yard is and how air passes.',
      fenceMaterials: 'Wood, steel or a combination. Posts are always set in concrete.',
      fencePrice: 'Length, height, drop along the plot, number of gates and the type of infill.',
    },
    about: {
      title: 'About',
      lead: 'Vladimir works in northern Israel. Pergolas, canopies and fences — wood, steel, combinations.',
      trustFormula: 'Vladimir is the face of the project: he advises, takes the measurements and oversees the work. The installation is done by his permanent crew — no subcontractors and no middlemen.',
      howTitle: 'How the work goes',
      step1: 'Contact — you tell us what you want and send a photo of the place.',
      step2: 'Measuring — we come, measure, and say what is possible and what is not.',
      step3: 'Fabrication — we cut and prepare to the measurements taken.',
      step4: 'Installation — we assemble, level it and clean up after ourselves.',
      principlesTitle: 'Principles',
      principle1: 'We do not promise a date we cannot keep. If something shifts, we say so in advance, not on the last day.',
      principle2: 'Materials are chosen for the climate here, not for what is left in the store.',
      principle3: 'The yard is left clean. That is part of the job, not a favour.',
      guarantee: 'Guarantee',
      guaranteeBody: 'All work carries a guarantee. It covers the structure and the installation; the term and conditions are fixed in the contract before the work starts.',
    },
    contact: {
      title: 'Get in touch',
      lead: 'We will answer in whichever way suits you.',
      whatsapp: 'Write on WhatsApp',
      call: 'Call',
      formTitle: 'Leave a request',
      priceHonesty: 'Every project is calculated individually. After a free measurement we name the price — a preliminary estimate with no obligation.',
    },
    home: {
      heroKicker: 'Vladimir · Nof HaGalil',
      heroTitle: 'Pergolas, canopies and fences',
      heroLead: 'We come, we measure, we name the price. Then you decide.',
      heroCta: 'Get a preliminary estimate',
      heroCallLabel: 'Phone',
      trustTitle: 'Why people trust us',
      trustPoint2: 'Careful installation and honest timing. The time on site is shown on every project here, not just claimed.',
      trustPoint3: 'Materials are chosen for the climate here: damp, sun and the sea nearby.',
      latestTitle: 'Latest projects',
      latestAll: 'All projects',
      howTitle: 'How the work goes',
      formTitle: 'Leave a request',
      formLead: 'We will answer in whichever way suits you.',
      principlesTitle: 'Principles',
      faqTitle: 'Questions that come up',
      finalTitle: 'Let us talk about your yard',
      finalLead: 'Send a photo of the place and we will say what is possible there.',
      mapTeaserTitle: 'Map of the work',
      mapTeaserBody: 'See what has been built near you.',
      mapTeaserCta: 'Open the map',
    },
    forms: {
      name: 'Name',
      namePlaceholder: 'How should we address you',
      phone: 'Phone',
      phonePlaceholder: '050 000 0000',
      city: 'City',
      cityPlaceholder: 'Optional',
      comment: 'What you want to build',
      submit: 'Send the request',
      sending: 'Sending…',
      consent: 'By sending you agree that we keep your name and phone in order to call you back.',
      thanksTitle: 'Got it',
      thanksBody: 'We will call you back. If it is urgent, write on WhatsApp — we answer faster there.',
      sendAnother: 'Send another request',
      errorPhone: 'A digit seems to be missing. Format: 050 000 0000',
      errorName: 'How should we address you?',
      rateLimited: 'Too many attempts — try again in an hour or write on WhatsApp.',
      serverError: 'We could not send it. Write on WhatsApp — it arrives right away.',
      offline: 'No connection. Write on WhatsApp — it arrives right away.',
      whatsappFallback: 'Send via WhatsApp',
    },
    faq: [
      { q: 'How much does it cost?', a: 'Every project is calculated individually. After a free measurement we name the price — a preliminary estimate with no obligation.' },
      { q: 'Is there a guarantee?', a: 'All work carries a guarantee. It covers the structure and the installation; the term and conditions are fixed in the contract before the work starts.' },
      { q: 'How long does it take?', a: 'Every project here shows how many days it took. A medium pergola is usually a few working days after fabrication.' },
      { q: 'Wood or aluminium?', a: 'Aluminium does not warp in damp and needs less care. Wood looks warmer. A combination takes from each what suits the place.' },
      { q: 'Do I need a permit?', a: 'It depends on the size and the distance to the plot boundary. At the measurement we will tell you how it stands for you.' },
      { q: 'What about maintenance?', a: 'Aluminium — wash it. Wood — a protective coat every few years, depending on how much sun it gets.' },
      { q: 'Where do you travel?', a: 'Nof HaGalil and around. Further out depends on the size of the job.' },
      { q: 'How does payment work?', a: 'The terms are fixed in the contract before the work starts, so nothing surprises you halfway.' },
      { q: 'Can something be changed along the way?', a: 'Better before fabrication: after cutting, a change costs time and material. We say in advance what can still be changed.' },
      { q: 'Who cleans up afterwards?', a: 'We do. The yard is left clean — that is part of the job, not a favour.' },
    ],
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
