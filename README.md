# Rabota Dom

Трёхъязычный сайт-портфолио мастера: перголы, навесы и заборы.
Ноф-ха-Галиль и север Израиля.

Иврит — `/` (RTL, без префикса), русский — `/ru/`, английский — `/en/`.

## Стек

Astro 7 · Tailwind 4 · TypeScript strict · полная статика · GitHub Pages + Actions.
Дальше по фазам: Cloudflare Worker для заявок (F4), GSAP (F5), Leaflet (F6).

## Запуск

```bash
npm ci
npm run dev      # дев-сервер
npm run build    # проверки + сборка
npm run check    # проверки без сборки
```

## Документы

| Файл | О чём |
| --- | --- |
| `PROJECT_BRIEF.md` | все решения проекта — источник правды |
| `CLAUDE_CODE_PROTOCOL.md` | рабочий регламент производства |
| `EDITORIAL.md` | правила текстов |
| `CLAUDE.md` | конвенции кода, команды, definition of done |
| `docs/PLAN.md` | фазы F0–F9 и гейты |
| `docs/DESIGN_TOKENS.md` | токены дизайн-системы (production) |
| `docs/DECISIONS.md` | журнал решений |
| `docs/manifests/` | манифест на каждую фазу |

## Статус

Фаза **F0 — фундамент**. До Content Freeze сайт на Pages — staging-проверка,
все страницы закрыты `noindex`.
