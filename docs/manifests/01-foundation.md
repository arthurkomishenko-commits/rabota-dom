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

### Шаг 2 — i18n · ⏸ ожидает решения по домену (см. «Открытые вопросы»)
### Шаг 4 — токены тем · ⛔ заблокирован: значений палитры Gemini нет ни в одном документе пакета

---

## Открытые вопросы к Артуру (блокируют шаги 2–4 и 7)
1. **Домен и базовый путь.** Pages настроены как project page → `/rabota-dom/`. Бриф §2 требует `/` = иврит без префикса. Нужно решение: домен сейчас или временный `base: '/rabota-dom'`.
2. **Палитра токенов Gemini** (бриф §7) — значений нет в пакете. Без них шаг 4 не выполняется по-настоящему.
3. **Git-идентичность:** коммит подписан `arthurhomekomishenko-gif <arthur.home.komishenko@gmail.com>`, GitHub-аккаунт — `arthurkomishenko-commits`. Нужно подтвердить email для атрибуции коммитов.
