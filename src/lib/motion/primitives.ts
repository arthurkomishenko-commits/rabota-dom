/**
 * Примитивы движения. Их немного и они намеренно скучные.
 *
 * Что делает: даёт набор проверенных приёмов, из которых собирается режиссура.
 * Вход: элементы и параметры. Выход: таймлайны GSAP внутри текущей области.
 * Кто использует: режиссура сборок; вызывается только внутри `createStage`.
 *
 * ПОЧЕМУ ПРИМИТИВЫ, А НЕ ЭФФЕКТЫ ПО МЕСТУ. Эффект, написанный по месту,
 * невозможно продеградировать: чтобы отключить его на слабой машине, нужно
 * помнить о нём. Примитив знает про ступень сам, и «выключить движение»
 * перестаёт быть перечнем мест, которые кто-то может забыть.
 *
 * ОБЩЕЕ ПРАВИЛО ВСЕХ ПРИМИТИВОВ. Финальное состояние уже в вёрстке; примитив
 * анимирует **из** смещённого состояния (`from`). На ступени `still` он ставит
 * финал мгновенно и не создаёт ни одного триггера.
 */
import type { StageApi } from './stage';

/** Длительности и смещения — единые, чтобы страница дышала в одном ритме. */
const RISE_DISTANCE = 24;
const RISE_DURATION = 0.6;
const STAGGER_STEP = 0.08;

/** Сборки скрабятся 1–1.5 (бриф §8): движение привязано к прокрутке, не ко времени. */
const SCRUB = 1.2;

type Targets = string | Element | Element[] | NodeListOf<Element>;

/**
 * Появление: подъём с прозрачностью, один раз.
 *
 * `once` вместо `toggleActions` осознанно: повторное проигрывание при каждом
 * пересечении превращает страницу в мигающую гирлянду, а вернувшийся человек
 * видит не тот кадр, который оставил.
 */
export function reveal(api: StageApi, targets: Targets, options: { stagger?: boolean } = {}): void {
  const { gsap, tier } = api;

  if (tier === 'still') {
    gsap.set(targets, { opacity: 1, y: 0, clearProps: 'transform' });
    return;
  }

  gsap.from(targets, {
    opacity: 0,
    y: RISE_DISTANCE,
    duration: RISE_DURATION,
    ease: 'power2.out',
    stagger: options.stagger ? STAGGER_STEP : 0,
    scrollTrigger: {
      trigger: targets as gsap.DOMTarget,
      start: 'top 85%',
      once: true,
    },
  });
}

/**
 * Прочерчивание линии: штрих идёт от начала к концу, как рука по чертежу.
 *
 * Требует, чтобы у элемента был `pathLength`, то есть это `<path>`, `<line>`
 * или `<polyline>`. Проверять это здесь нечем — SVG приходит из разметки,
 * поэтому примитив тихо не сделает ничего для не-SVG, а не сломает страницу.
 */
export function draw(api: StageApi, targets: Targets): void {
  const { gsap, tier } = api;

  if (tier === 'still') {
    gsap.set(targets, { strokeDashoffset: 0 });
    return;
  }

  gsap.fromTo(
    targets,
    { strokeDasharray: '1 1', strokeDashoffset: 1 },
    {
      strokeDashoffset: 0,
      duration: 1.1,
      ease: 'none',
      stagger: STAGGER_STEP,
      scrollTrigger: { trigger: targets as gsap.DOMTarget, start: 'top 80%', once: true },
    },
  );
}

/**
 * Счётчик: число добегает до своего значения.
 *
 * Конечное значение берётся из разметки — оно уже там и видно без скрипта.
 * Форматирование не трогаем: число могло прийти из `TechnicalValue`
 * с изоляцией направления, и переписывать его строкой значит сломать RTL
 * (BUG-0005).
 */
export function countUp(api: StageApi, element: HTMLElement): void {
  const { gsap, tier } = api;
  const final = Number(element.textContent?.replace(/[^\d.-]/g, ''));
  if (!Number.isFinite(final)) return;
  if (tier === 'still' || tier === 'simplified') return;

  const state = { value: 0 };
  const suffix = element.textContent?.replace(/[\d.,\s-]+/g, '') ?? '';

  gsap.to(state, {
    value: final,
    duration: 1.2,
    ease: 'power1.out',
    onUpdate: () => {
      element.textContent = `${Math.round(state.value)}${suffix ? ` ${suffix}` : ''}`;
    },
    onComplete: () => {
      // Возврат исходной строки: наше форматирование заведомо беднее.
      element.textContent = element.dataset.final ?? element.textContent;
    },
    scrollTrigger: { trigger: element, start: 'top 85%', once: true },
  });
}

/**
 * Сборка: слои съезжаются к финалу по прокрутке.
 *
 * Горизонталь умножается на `invertX` — в RTL детали приезжают с другой
 * стороны. Вертикаль не трогается: гравитация от языка не зависит.
 *
 * Стоп на 85–90 % (бриф §3): сборка не должна доигрывать «в никуда» —
 * последние проценты прокрутки уходят на то, чтобы кадр постоял собранным.
 */
export function assemble(
  api: StageApi,
  container: HTMLElement,
  parts: Array<{ element: Element; fromX?: number; fromY?: number }>,
): void {
  const { gsap, tier, invertX } = api;

  if (tier === 'still') {
    gsap.set(
      parts.map((p) => p.element),
      { x: 0, y: 0, opacity: 1 },
    );
    return;
  }

  const timeline = gsap.timeline({
    scrollTrigger: {
      trigger: container,
      start: 'top 70%',
      end: 'bottom 90%',
      scrub: SCRUB,
    },
  });

  parts.forEach((part, index) => {
    timeline.from(
      part.element,
      {
        x: (part.fromX ?? 0) * invertX,
        y: part.fromY ?? 0,
        opacity: 0,
        ease: 'power2.out',
      },
      index * 0.1,
    );
  });
}
