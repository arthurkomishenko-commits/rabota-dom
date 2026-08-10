/**
 * Шаблон OG-карточки «паспорт объекта» 1200×630 (бриф §7).
 *
 * Что делает: описывает карточку структурой, которую понимает satori.
 * Вход: заголовок, город, год, материал, направление письма.
 * Выход: объект-описание. Кто использует: `src/pages/og/*`.
 *
 * ИВРИТ ТРЕБУЕТ ЯВНОГО НАПРАВЛЕНИЯ. Satori не применяет двунаправленный
 * алгоритм сам: без `direction: 'rtl'` ивритская строка выкладывается слева
 * направо, и карточка выглядит как ошибка вёрстки. Проверено рендером,
 * а не предположено — бриф §7 прямо требует визуальный тест ивритской карточки.
 *
 * Элементы иврита и латиницы разделены по разным узлам: смешивать их в одной
 * строке — верный способ получить переставленные куски.
 */

export interface OgInput {
  title: string;
  city: string;
  year: string;
  material: string;
  /** Строка бренда — всегда латиницей и всегда слева направо. */
  brand: string;
  rtl: boolean;
}

const COLORS = {
  bg: '#f7f7f9',
  surface: '#ffffff',
  text: '#1e242b',
  muted: '#5f6b80',
  accent: '#98461a',
  border: '#cbd5e1',
};

export function ogCard(input: OgInput) {
  const align = input.rtl ? 'flex-end' : 'flex-start';

  return {
    type: 'div',
    props: {
      style: {
        display: 'flex',
        flexDirection: 'column',
        width: '1200px',
        height: '630px',
        backgroundColor: COLORS.bg,
        padding: '64px',
        justifyContent: 'space-between',
        // Направление задаётся явно — satori сам этого не сделает.
        direction: input.rtl ? 'rtl' : 'ltr',
      },
      children: [
        {
          type: 'div',
          props: {
            style: { display: 'flex', flexDirection: 'column', alignItems: align, gap: '18px' },
            children: [
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    backgroundColor: COLORS.text,
                    color: COLORS.surface,
                    fontSize: '24px',
                    padding: '8px 16px',
                    borderRadius: '2px',
                  },
                  children: input.material,
                },
              },
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    fontSize: '68px',
                    color: COLORS.text,
                    lineHeight: 1.15,
                    maxWidth: '1000px',
                    textAlign: input.rtl ? 'right' : 'left',
                  },
                  children: input.title,
                },
              },
            ],
          },
        },
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              flexDirection: 'column',
              alignItems: align,
              gap: '20px',
              width: '100%',
            },
            children: [
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    width: '100%',
                    height: '1px',
                    backgroundColor: COLORS.border,
                  },
                  children: '',
                },
              },
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    width: '100%',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  },
                  children: [
                    {
                      type: 'div',
                      props: {
                        style: { display: 'flex', fontSize: '32px', color: COLORS.muted },
                        children: input.city,
                      },
                    },
                    // Год — цифры, всегда слева направо, отдельным узлом.
                    {
                      type: 'div',
                      props: {
                        style: {
                          display: 'flex',
                          fontSize: '32px',
                          color: COLORS.muted,
                          direction: 'ltr',
                        },
                        children: input.year,
                      },
                    },
                  ],
                },
              },
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    fontSize: '28px',
                    color: COLORS.accent,
                    letterSpacing: '0.05em',
                    // Бренд латиницей: собственное направление, чтобы его
                    // не развернуло вместе с ивритской карточкой.
                    direction: 'ltr',
                  },
                  children: input.brand,
                },
              },
            ],
          },
        },
      ],
    },
  };
}
