# Манифест 01 — Фундамент (F0)
Размещение: `docs/manifests/01-foundation.md` · Образец формата для всех манифестов

## Цель
Рабочий каркас: репозиторий собирается, три локали открываются, RTL и темы работают, CI зелёный. Ни одного пикселя дизайна — только фундамент, на котором ничего не придётся переделывать.

## Связь с брифом
§2 (платформа: i18n, темы, шрифты), §10 (CI), протокол §5, §8 (100dvh — заложить с первого коммита).

## Что нужно от Артура (до старта)
1. Создать репозиторий `rabota-dom` (GitHub), включить Pages (ветка деплоя) и Actions. ЗАЧЕМ: место производства. КАК: github.com → New repository → Settings → Pages.
2. Подтвердить, что секреты пока не нужны (бот подключается в F4).

## Шаги (каждый проверяется до перехода к следующему)
1. `npm create astro@latest` (минимальный шаблон, TypeScript strict) + Tailwind. Проверка: `npm run build` чист.
2. Конфиг i18n: `defaultLocale: 'he'`, `locales: ['he','ru','en']`, `prefixDefaultLocale: false`; `/admin` исключён из языковой матрицы (собирается как обычная статика). Проверка: `/` → иврит, `/ru/`, `/en/` → 200; `/admin/` зарезервирован и не локализуется.
3. `BaseLayout.astro`: `<html lang dir>` из локали; hreflang на все локали + `x-default` → `/`. Проверка: view-source трёх страниц — правильные lang/dir/hreflang.
4. `styles/variables.css`: токены обеих тем из брифа §7 (палитра Gemini, radius 2px); каскад темы: inline-скрипт в `<head>` (localStorage → prefers-color-scheme → light), `data-theme`, тумблер-заглушка. Проверка: скрины светлой/тёмной, отсутствие FOUC.
5. Rubik: @fontsource, три сабсета unicode-range (he/cyr/lat), preload критического. Проверка: network — на ивритской странице грузится только нужный сабсет, каждый ≤40 КБ.
6. Глобальный CSS: logical properties база, `100dvh`-утилита (100vh запрещён), prefers-reduced-motion каркас, фокус-кольца (outline 2px accent, offset 2px). Проверка: RTL-страница зеркалит тестовый флекс; фокус виден с клавиатуры.
7. CI: workflow build (+ деплой на Pages), кэш npm. LHCI подключается в F3, здесь — только сборка. Проверка: Action зелёный на тестовом PR, сайт открывается на github.io.
8. `CLAUDE.md` (конвенции, команды, definition of done, каркас BANNED_PHRASES из EDITORIAL.md) + инициализация `docs/*` по протоколу §3.

## Критерии приёмки
- `npm run build` без ошибок и ворнингов; Action зелёный; сайт доступен на Pages.
- `/` — иврит RTL; `/ru/` `/en/` — LTR; hreflang + x-default корректны (view-source приложен).
- Тема: каскад работает, выбор переживает перезагрузку; скрины обеих тем.
- Шрифт-сабсеты ≤40 КБ каждый (network-скрин).
- В коде нет 100vh, нет хардкода left/right в layout-утилитах.

## Отчёт (по протоколу §7)
Лог сборки · скрины: 3 локали × 2 темы (6 шт) + network шрифтов + зелёный Action · список файлов · что перенесено в F1.

## Риски
Неправильная база i18n = переделка всех страниц позже → поэтому фаза закрывается только после проверки view-source всех локалей. FOUC темы → inline-скрипт строго в `<head>` до CSS.

---

## Факты выполнения (заполняется по ходу; протокол §5)

### Шаг 0 — раскладка документов · ✅ 07.08.2026
Создан `docs/manifests`; `PLAN.md` → `docs/PLAN.md`; `MANIFEST_01_foundation.md` → `docs/manifests/01-foundation.md`; `START_PROMPT.md` удалён.
Факт — дерево:
```
CLAUDE_CODE_PROTOCOL.md · EDITORIAL.md · PROJECT_BRIEF.md
docs/PLAN.md · docs/manifests/01-foundation.md
```

### Шаг «Git и репозиторий» · ✅ 07.08.2026
`git init -b main`, `.gitignore` (45 строк: dist, .astro, node_modules, .env*, .dev.vars, .wrangler, .lighthouseci, OS/IDE), коммит `docs: production package v2.0`, remote + push.
Факт — `git log --oneline`: `86d4ee8 docs: production package v2.0` (6 файлов, +318).
Факт — `git remote -v`: `origin https://github.com/arthurkomishenko-commits/rabota-dom.git` (fetch/push).
Факт — пуш подтверждён на стороне GitHub, не локально: `gh api repos/.../commits/main` → `86d4ee8`; дерево на remote содержит все 6 файлов.
Авторизация не потребовалась: `gh auth status` → аккаунт `arthurkomishenko-commits`, scopes `repo, workflow`.
Факт — Pages включены: `gh api .../pages` → `build_type: "workflow"`, `source.branch: main`, `html_url: https://arthurkomishenko-commits.github.io/rabota-dom/`.

### Шаг 1 — каркас Astro + Tailwind · ✅ 07.08.2026
Скаффолд `npm create astro@latest -- --template minimal --typescript strict` собран в отдельной папке и перенесён в репозиторий (в корне уже был git + документы). `npx astro add tailwind --yes`.
Версии (факт): Node v24.14.1 · npm 11.11.0 · **astro v7.2.0** · tailwindcss 4.3.3 через `@tailwindcss/vite` 4.3.3.
`tsconfig.json` наследует `astro/tsconfigs/strict`.
Факт — `npm run build`:
```
[types] Generated 822ms
[build] output: "static"
generating static routes
  ├─ /index.html (+12ms)
[build] 1 page(s) built in 1.29s
[build] Complete!
```
Ошибок и ворнингов нет.
Замечание к версии: Astro 7 новее моей базы знаний — i18n-API сверен по типам установленного пакета (`node_modules/astro/dist/types/public/config.d.ts`), а не по памяти: `i18n.locales`, `i18n.defaultLocale`, `i18n.routing.prefixDefaultLocale` присутствуют.

### Ответы Артура на блокеры · 07.08.2026
Домен — вариант (б): `base: '/rabota-dom'`, централизованно (DEC-0002).
Палитра — файл `docs/DESIGN_TOKENS.md`, статус production.
Git-идентичность — `git config --local` на `arthurkomishenko-commits`, применено:
коммит `a9587ca` подписан правильным автором (проверено `gh api`).

### Шаг 2 — i18n · ✅ 07.08.2026
`astro.config.mjs`: `defaultLocale: 'he'`, `locales: ['he','ru','en']`,
`routing.prefixDefaultLocale: false`, `trailingSlash: 'always'`.
`site` и `base` заданы там же и нигде не дублируются (DEC-0002); в коде — `Astro.site`
и `import.meta.env.BASE_URL`, межъязыковые ссылки через `astro:i18n`.
`src/i18n/config.ts`: языковая матрица, `stripBase`, `getRouteKey`, `isNonLocalizedPath`.
`/admin` вынесен из матрицы.
Факт — собранные маршруты: `/index.html`, `/ru/index.html`, `/en/index.html`,
`/admin/index.html`.
Факт — живой сайт (curl, HTTP-коды и атрибуты документа):
```
/         200  <html lang="he" dir="rtl">   hreflang: есть
/ru/      200  <html lang="ru" dir="ltr">   hreflang: есть
/en/      200  <html lang="en" dir="ltr">   hreflang: есть
/admin/   200  <html lang="en" dir="ltr">   hreflang: НЕТ ← вне языковой матрицы
```

### Шаг 3 — BaseLayout · ✅ 07.08.2026
`lang`/`dir` из локали, canonical, hreflang на три локали + `x-default` → ивритская версия
того же маршрута, `noindex` до Content Freeze (DEC-0006).
Факт — view-source ивритской страницы:
```html
<html lang="he" dir="rtl">
<link rel="alternate" hreflang="he"        href=".../rabota-dom/">
<link rel="alternate" hreflang="ru"        href=".../rabota-dom/ru/">
<link rel="alternate" hreflang="en"        href=".../rabota-dom/en/">
<link rel="alternate" hreflang="x-default" href=".../rabota-dom/">
<link rel="canonical"                      href=".../rabota-dom/">
```
На `/admin/` тегов `alternate` нет — исключение из матрицы подтверждено.

### Шаг 4 — токены обеих тем и каскад · ✅ 07.08.2026
`src/styles/variables.css` — значения из `docs/DESIGN_TOKENS.md` дословно, включая
5 состояний кнопки в обеих темах. Каскад темы — inline-скрипт в `<head>` до CSS:
localStorage → `prefers-color-scheme` → light. Тумблер пишет выбор в localStorage.
Одно осознанное отступление — DEC-0005: диммер фото сделан опт-ин классом `photo-dim`,
а не глобальным `[data-theme="dark"] img`, иначе filter попал бы на hero и сборки,
что запрещено брифом §7. Значения токенов не менялись.
Факт — `npm run gate:f0`, машинные проверки на живом сайте:
```
✓ he/ru/en · системная light → data-theme="light"
✓ he/ru/en · системная dark  → data-theme="dark"
✓ тумблер: система dark → dark, после нажатия → light
✓ после перезагрузки при системной dark: тема "light", localStorage "light"
✓ FOUC: тема на первом кадре "dark", после загрузки "dark" — совпадают
```
Скрины: `docs/evidence/f0/{he,ru,en}-{light,dark}-{desktop,mobile}.png` (12 шт.)
и `theme-override-persists.png`.

### Шаг 5 — Rubik, сабсеттинг · ✅ 07.08.2026
Три сабсета (hebrew, cyrillic, latin), variable, normal — в `src/styles/fonts/`
(DEC-0003). Preload — только сабсет языка страницы (DEC-0004).
Факт — бюджеты, `npm run check:budgets`:
```
✓ rubik-cyrillic-wght-normal.woff2     14.8 КБ / 40 КБ
✓ rubik-hebrew-wght-normal.woff2        9.1 КБ / 40 КБ
✓ rubik-latin-wght-normal.woff2        34.5 КБ / 40 КБ
```
Факт — preload в собранном HTML различается по локали:
`/` → `rubik-hebrew…`, `/ru/` → `rubik-cyrillic…`, `/en/` → `rubik-latin…`.
Факт — реально скачано браузером: на каждой локали **три** сабсета, а не один.
Причина установлена и это не ошибка настройки: на странице присутствуют все три
письменности (переключатель языков подписан на родных языках, лого — латиницей).
Развилка вынесена в `docs/DECISIONS.md` → «ОТКРЫТО · Переключатель языков».

### Шаг 6 — глобальный CSS · ✅ 07.08.2026
Логические свойства, утилиты `h-viewport` / `min-h-viewport` на `100dvh`,
каркас `prefers-reduced-motion` (мгновенный финал), фокус-кольца
`outline: 2px solid var(--accent-wood); outline-offset: 2px` на всех интерактивах
через `:where()` (нулевая специфичность).
Факт — зеркалирование проверено вычисленными стилями, не глазами:
```
✓ he · акцентная грань справа (left=1px, right=3px)
✓ ru · акцентная грань слева  (left=3px, right=1px)
✓ en · акцентная грань слева  (left=3px, right=1px)
```
Факт — `npm run check:conventions`, включая негативный тест:
```
чистый прогон:  ✓ конвенции: 100vh не найден, физических left/right нет   (exit=0)
негативный:     3 нарушения найдены                                        (exit=1)
```

### Шаг 7 — CI · ✅ 07.08.2026
`.github/workflows/ci.yml`: конвенции → бюджеты → типы → сборка → артефакт → деплой
на Pages. Кэш npm, Node 24, `concurrency` с отменой предыдущих прогонов.
Факт — прогон `31210862393`, conclusion=**success**, оба job зелёные
(«Сборка и проверки» 22 s, «Деплой на Pages» 9 s), аннотаций нет.
В первом прогоне были предупреждения о Node 20 в actions — версии подняты
до актуальных мажоров (checkout v7, setup-node v7, configure-pages v6,
upload-pages-artifact v5, deploy-pages v5), предупреждения ушли.
Факт — сайт живой: `https://arthurkomishenko-commits.github.io/rabota-dom/` → 200.

### Шаг 8 — файловая дисциплина · ✅ 07.08.2026
`CLAUDE.md` (конвенции, таблица команд, definition of done, массив BANNED_PHRASES),
`docs/TODO.md`, `docs/DECISIONS.md` (DEC-0001…0007 + открытая развилка),
`docs/BUGS.md`, `docs/SESSION_SUMMARY.md`, `README.md`, `AGENTS.md` (ссылка на CLAUDE.md).

---

## Проверка критериев приёмки

| Критерий | Статус | Доказательство |
| --- | --- | --- |
| `npm run build` без ошибок и ворнингов | ✅ | 4 страницы, лог сборки чист |
| Action зелёный | ✅ | прогон `31210862393`, success, без аннотаций |
| Сайт доступен на Pages | ✅ | 4 URL отдают 200 |
| `/` — иврит RTL, `/ru/` `/en/` — LTR | ✅ | view-source + вычисленные стили |
| hreflang + x-default корректны | ✅ | view-source трёх локалей приложен |
| Тема: каскад работает, выбор переживает перезагрузку | ✅ | `gate:f0`, 45/45 |
| Скрины обеих тем | ✅ | 12 скринов, десктоп + мобайл |
| Сабсеты ≤40 КБ каждый | ✅ | 9.1 / 14.8 / 34.5 КБ, проверяется в CI |
| В коде нет `100vh`, нет хардкода left/right | ✅ | `check:conventions`, негативный тест пройден |

### Проверка на реальном устройстве · ✅ 07.08.2026
Скрины от Артура: `docs/evidence/f0/phone/`.

**Что подтверждено скринами:**
- Иврит, светлая тема: контент прижат к правому краю, лого справа, акцентная грань
  3px у ячейки «התחלה» справа, переключатель языков читается справа налево —
  RTL зеркалится на реальном устройстве, а не только в headless.
- Русский, тёмная тема: фон тёмный по токену, акцентная грань слева у «Начало»,
  кнопка «матовый алюминий» с градиентом читается на тёмном.
- Rubik рендерит все три письменности: ивритский заголовок, кириллица,
  латинское лого, и «עברית» внутри LTR-навигации.
- Обе темы применяются на устройстве; переключатель показывает противоположную
  тему («מצב כהה» на светлой, «Светлая тема» на тёмной) — состояние согласовано.

**Чего скрины НЕ показывают** (и я это не выдаю за проверенное): сохранение выбора
темы после перезагрузки именно на устройстве и модель/браузер (кадры обрезаны по
содержимому, системной панели не видно). Перезагрузка покрыта машинно на десктопе
(`gate:f0`), механизм один и тот же — `localStorage` + inline-скрипт.

**Пункт гейта закрыт.**

---

## Полировочный проход F0 (QUALITY_DOCTRINE §4) · 07.08.2026

Прогон: `npm run polish` — 11/11. Найдено два реальных дефекта, оба починены
по правилу первопричины и записаны в `docs/BUGS.md`.

- **BUG-0002 — тёмная тема не работала без JavaScript.** Тёмные токены жили только
  в `[data-theme='dark']`, а атрибут ставит скрипт. Вторая ступень каскада из
  брифа §2 существовала лишь как побочный эффект работы JS.
  Починено перестройкой `variables.css` на три ступени; значения палитр
  по-прежнему записаны ровно один раз.
- **BUG-0003 — длинная строка без пробелов растягивала документ** до 1347px при
  вьюпорте 320px. Починено `overflow-wrap: break-word` в базовом слое.

Пройдено без замечаний: клавиатурная навигация и видимость фокус-кольца,
отсутствие горизонтальной прокрутки на 320px во всех трёх локалях,
мгновенные переходы при `reduced-motion`, рендер контента без JS.

Проверки после правок:
```
npm run check   → конвенции и границы ✓ · метки ✓ · бюджеты ✓ · самотест 16/16 ✓ · типы 0/0/0
npm run polish  → 11/11
npm run gate:f0 → 45/45 (поведение с включённым JS не изменилось)
```
