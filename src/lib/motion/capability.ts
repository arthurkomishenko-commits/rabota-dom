/**
 * Ступень деградации: на что способна эта машина и чего хочет этот человек.
 *
 * Что делает: определяет, какой вариант режиссуры показывать.
 * Вход: нет (читает окружение браузера). Выход: ступень.
 * Кто использует: `src/lib/motion/*` и компоненты сборок.
 *
 * ЛЕСТНИЦА, А НЕ ФЛАГ (бриф §8). Ступеней четыре, и они не взаимозаменяемы:
 *
 *   full        — полный вариант манифеста
 *   mobile      — подмножество слоёв для узкого экрана
 *   simplified  — слабая машина: три слоя, без пыли
 *   still       — `prefers-reduced-motion`: финальный кадр сразу
 *
 * ПОЧЕМУ `still` НЕ «ВЫКЛЮЧИТЬ АНИМАЦИИ». Человек, попросивший меньше движения,
 * должен увидеть **тот же кадр**, а не пустое место. Поэтому ступень называется
 * «неподвижно», а не «без анимации»: финал ставится мгновенно через `gsap.set`,
 * и содержимое остаётся полным.
 *
 * ПОЧЕМУ ЧИТАЕМ ОДИН РАЗ. `deviceMemory` и `hardwareConcurrency` не меняются
 * в течение жизни страницы, а `prefers-reduced-motion` — меняется, и на него
 * подписываемся отдельно: человек может переключить настройку, не перезагружая
 * страницу, и тогда движение обязано прекратиться сразу.
 */

export type MotionTier = 'full' | 'mobile' | 'simplified' | 'still';

/** Порог узкого экрана — тот же, что у раскладки секций (64rem). */
const MOBILE_MAX = 1024;

/** Слабая машина по брифу §8. */
const WEAK_MEMORY_GB = 4;
const WEAK_CORES = 4;

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';

/** `deviceMemory` есть не везде — отсутствие не означает «слабая». */
function isWeakDevice(): boolean {
  const nav = navigator as Navigator & { deviceMemory?: number };
  const memory = nav.deviceMemory;
  const cores = nav.hardwareConcurrency;

  if (typeof memory === 'number' && memory <= WEAK_MEMORY_GB) return true;
  if (typeof cores === 'number' && cores <= WEAK_CORES) return true;
  return false;
}

export function currentTier(): MotionTier {
  if (window.matchMedia(REDUCED_MOTION).matches) return 'still';
  if (isWeakDevice()) return 'simplified';
  if (window.innerWidth <= MOBILE_MAX) return 'mobile';
  return 'full';
}

/**
 * Подписка на смену настройки «меньше движения».
 * Возвращает функцию отписки — вызывать её обязан тот, кто подписался.
 */
export function onReducedMotionChange(handler: (reduced: boolean) => void): () => void {
  const query = window.matchMedia(REDUCED_MOTION);
  const listener = (event: MediaQueryListEvent) => handler(event.matches);
  query.addEventListener('change', listener);
  return () => query.removeEventListener('change', listener);
}

/**
 * Направление документа как ЧИСЛО-множитель для горизонтальных смещений.
 *
 * ЗАЧЕМ ИМЕННО ТАК (бриф §8, «RTL как параметр»). Зеркальной копии таймлайна
 * не заводится: две копии расходятся при первой же правке. Вместо этого
 * горизонталь умножается на этот множитель, а вертикаль не трогается вовсе —
 * гравитация в иврите та же.
 */
export function rtlInvertX(): -1 | 1 {
  return document.documentElement.dir === 'rtl' ? -1 : 1;
}
