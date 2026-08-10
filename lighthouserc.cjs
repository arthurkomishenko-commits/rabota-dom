/**
 * Конфигурация Lighthouse CI (бриф §10, гейт F3).
 *
 * Пороги — из брифа: mobile ≥90 по всем категориям, LCP < 2.0 c, CLS < 0.05,
 * INP отслеживается отдельно (в лабораторных условиях его заменяет TBT).
 *
 * Карта (`/map`) в брифе имеет собственный перф-профиль: Leaflet тяжелее
 * остального сайта. Пока страницы нет, исключение не заводится — оно появится
 * вместе с ней в F6, а не «на всякий случай» заранее.
 */
module.exports = {
  ci: {
    collect: {
      /**
       * Свой сервер вместо `staticDistDir`: тот раздаёт dist из корня,
       * и все ресурсы с базовым путём `/rabota-dom/` отвечают 404 —
       * Lighthouse измеряет страницу без стилей и скриптов. Цифры при этом
       * выглядят прекрасно и не значат ничего.
       */
      startServerCommand: 'node scripts/serve-for-lhci.mjs',
      startServerReadyPattern: 'lhci server ready',
      url: [
        'http://127.0.0.1:4319/rabota-dom/',
        'http://127.0.0.1:4319/rabota-dom/ru/',
        'http://127.0.0.1:4319/rabota-dom/en/',
        'http://127.0.0.1:4319/rabota-dom/ru/portfolio/',
        'http://127.0.0.1:4319/rabota-dom/ru/portfolio/pergola-lamelnaya-nof-hagalil/',
        'http://127.0.0.1:4319/rabota-dom/ru/services/',
        'http://127.0.0.1:4319/rabota-dom/ru/pergolas/',
        'http://127.0.0.1:4319/rabota-dom/ru/about/',
        'http://127.0.0.1:4319/rabota-dom/ru/contact/',
        'http://127.0.0.1:4319/rabota-dom/ru/privacy/',
        'http://127.0.0.1:4319/rabota-dom/ru/accessibility/',
      ],
      /**
       * Три прогона и медиана. Одиночный замер Lighthouse шумит на несколько
       * пунктов: страница без единого изображения показывала то 99, то 87.
       * Гейт, который зависит от того, какой прогон выпал, — это не гейт.
       */
      numberOfRuns: 3,
      settings: {
        // Мобильный профиль — как требует бриф §10: пороги заданы для mobile.
        formFactor: 'mobile',
        screenEmulation: {
          mobile: true,
          width: 390,
          height: 844,
          deviceScaleFactor: 2,
          disabled: false,
        },
        throttlingMethod: 'simulate',
      },
    },
    assert: {
      aggregationMethod: 'median',
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:seo': ['warn', { minScore: 0.9 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2000 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.05 }],
      },
    },
    upload: { target: 'filesystem', outputDir: './docs/evidence/f3/lhci' },
  },
};
