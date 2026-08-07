# DESIGN_TOKENS.md — Rabota Dom
Статус: production · Источник: принятая спецификация внешнего арт-ревью (раунды 1–2) · Тёмные состояния кнопки — выведены командой из палитры, финальная полировка в F1. Разложить в `styles/variables.css`; менять значения без согласования запрещено (бриф §7).

## Палитра

```css
:root {
  /* Светлая тема (default) */
  --bg: #F7F7F9;            /* фон, холодный */
  --surface: #FFFFFF;       /* поверхности, карточки */
  --text-main: #1E242B;     /* основной текст, «графит» */
  --text-muted: #64748B;    /* вторичный текст, плейсхолдеры */
  --accent-wood: #C25E24;   /* акцент «кедр» */
  --accent-wood-hover: #A04A1A;
  --border-metal: #CBD5E1;  /* линии чертежа, бордеры */
  --radius-base: 2px;       /* инженерная фаска, глобально */
}

[data-theme="dark"] {
  --bg: #121417;            /* тёмный анодированный металл */
  --surface: #1A1D23;
  --text-main: #E2E8F0;     /* светлый пепел */
  --text-muted: #94A3B8;
  --accent-wood: #E07A3E;   /* светлее для контраста на тёмном */
  --accent-wood-hover: #F29054;
  --border-metal: #2D333B;  /* «фрезеровка» 1px */
}
```

Контраст: пары text-main/bg обеих тем проходят AA с запасом; `--accent-wood` — для акцентов, кнопок и крупных элементов, НЕ для мелкого сплошного текста (светлый вариант на белом на грани AA для small text). Проверка контраста — часть гейта F1.

## Кнопка «матовый алюминий» (Primary CTA)

Светлая тема:
- normal: `background: linear-gradient(180deg, #F8FAFC 0%, #E2E8F0 100%); border: 1px solid #CBD5E1; color: #1E242B; box-shadow: inset 0 1px 0 #FFFFFF, 0 1px 2px rgba(0,0,0,.05);`
- hover: `background: linear-gradient(180deg, #FFFFFF 0%, #F1F5F9 100%); border-color: #94A3B8;`
- active: `background: #E2E8F0; box-shadow: inset 0 2px 4px rgba(0,0,0,.1);`
- focus: `outline: 2px solid var(--accent-wood); outline-offset: 2px;`
- disabled: `opacity: .5; filter: grayscale(100%); cursor: not-allowed;`

Тёмная тема (выведено, полировка в F1):
- normal: `background: linear-gradient(180deg, #262B33 0%, #1A1D23 100%); border: 1px solid #3A414B; color: #E2E8F0; box-shadow: inset 0 1px 0 rgba(255,255,255,.06), 0 1px 2px rgba(0,0,0,.4);`
- hover: `background: linear-gradient(180deg, #2D333B 0%, #22262D 100%); border-color: #4A525D;`
- active: `background: #1A1D23; box-shadow: inset 0 2px 4px rgba(0,0,0,.5);`
- focus/disabled: как в светлой (focus-акцент тёмной темы = #E07A3E автоматически через переменную).

## Инпуты формы
- normal: `background: var(--surface); border: 1px solid var(--border-metal); border-bottom-width: 2px;`
- focus: `border-color: var(--accent-wood); outline: none;` (нижняя «линия чертежа» становится активной)
- placeholder: `color: var(--text-muted);`

## Тег материала (на карточках)
`background: var(--text-main); color: var(--surface); padding: 4px 8px; font-size: 12px; text-transform: uppercase; letter-spacing: .05em; font-weight: 500;`

## Фокус-кольцо (глобально, все интерактивы, обе темы)
`outline: 2px solid var(--accent-wood); outline-offset: 2px;`

## Фото в тёмной теме (ТОЛЬКО статичные фото ниже фолда; в hero и сборках filter запрещён — бриф §7)
- Диммер: overlay `rgba(0,0,0,.2)`, плавно гаснет на hover.
- `[data-theme="dark"] img:not(:hover) { filter: grayscale(15%) contrast(90%); transition: filter .3s ease; }`
- Изоляция: контейнер фото `box-shadow: inset 0 0 0 1px rgba(255,255,255,.1);`

## Типографика (напоминание из брифа §7)
Rubik self-host. Иврит: база 18px, ru/en: 16px. line-height 1.6 (заголовки 1.1). Ширина текстового блока ≤65ch. Лого: Rubik Medium, uppercase, letter-spacing .05em.
