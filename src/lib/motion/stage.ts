/**
 * Сцена: единственное место, где создаётся и уничтожается движение.
 *
 * Что делает: настраивает GSAP один раз на страницу, даёт область
 * (`gsap.context()`) с гарантированной уборкой и переключает ступень
 * деградации на лету.
 * Вход: корневой элемент и функция режиссуры. Выход: управление сценой.
 * Кто использует: компоненты сборок через свои `<script>`.
 *
 * ПОЧЕМУ ОБЛАСТЬ, А НЕ ПРОСТО `gsap.to` (протокол §8). Твины и ScrollTrigger'ы
 * живут дольше страницы: при переходе назад-вперёд браузер отдаёт страницу
 * из bfcache вместе с висящими таймлайнами, и они начинают дёргать элементы,
 * которых уже нет. `gsap.context()` собирает всё созданное внутри и снимает
 * одним `revert()` — включая ScrollTrigger'ы и изменённые стили.
 *
 * ПОЧЕМУ ЗАПРЕЩЁН `setTimeout` ДЛЯ СИНХРОНИЗАЦИИ (бриф §8). Таймер не знает
 * ни о кадрах, ни о загрузке шрифта, ни о троттлинге CPU ×4. Синхронизация
 * делается таймлайном и колбэками GSAP; ожидание внешнего события — событием.
 *
 * ПОЧЕМУ ФИНАЛЬНОЕ СОСТОЯНИЕ В ВЁРСТКЕ, А АНИМАЦИЯ ЧЕРЕЗ `from` (бриф §8).
 * Если движение не запустится — не загрузился скрипт, отключён JS, упала
 * ступень — человек увидит готовый кадр, а не пустоту. Обратный порядок
 * («сверстать пусто и показать анимацией») делает содержимое заложником
 * исполнения скрипта; это ровно та ошибка, что уже стоила BUG-0010 и BUG-0017.
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import { currentTier, onReducedMotionChange, type MotionTier } from './capability';

let registered = false;

/**
 * Регистрация плагинов и глобальные настройки — ровно один раз.
 * `normalizeScroll` и `ignoreMobileResize` требует бриф §8: первое убирает
 * рассинхрон инерционной прокрутки, второе — прыжок при появлении и исчезании
 * адресной строки на телефоне.
 */
function setupOnce(): void {
  if (registered) return;
  registered = true;

  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.normalizeScroll(true);
  ScrollTrigger.config({ ignoreMobileResize: true });
}

export type StageApi = {
  /** Ступень, на которой сцена сейчас построена. */
  tier: MotionTier;
  /** GSAP-область — всё созданное внутри снимается одним `revert()`. */
  gsap: typeof gsap;
  /** Множитель горизонтали: -1 в RTL. */
  invertX: -1 | 1;
};

export type Choreography = (api: StageApi) => void;

export type Stage = {
  /** Снять всё движение и вернуть исходные стили. */
  destroy(): void;
  /** Ступень, на которой сцена построена сейчас. */
  tier(): MotionTier;
  /**
   * Сколько ScrollTrigger'ов живо прямо сейчас. Нужно проверке уборки:
   * «мы всё убрали» обязано быть измеримым числом, а не обещанием.
   */
  liveTriggers(): number;
};

/**
 * Создаёт сцену на корневом элементе.
 *
 * Режиссура получает ступень и сама решает, что показывать: на `still` она
 * обязана поставить финал через `gsap.set`, а не пропустить построение —
 * иначе человек с «меньше движения» увидит недособранный кадр.
 */
export function createStage(root: HTMLElement, choreography: Choreography): Stage {
  setupOnce();

  let tier = currentTier();
  let context = build();

  function build() {
    return gsap.context(() => {
      choreography({
        tier,
        gsap,
        invertX: document.documentElement.dir === 'rtl' ? -1 : 1,
      });
    }, root);
  }

  /*
   * Смена настройки «меньше движения» пересобирает сцену целиком.
   * Именно пересобирает, а не «останавливает»: остановленный посередине
   * таймлайн оставляет кадр в промежуточном состоянии, которого нет
   * ни в одном варианте режиссуры.
   */
  const unsubscribe = onReducedMotionChange(() => {
    context.revert();
    tier = currentTier();
    context = build();
  });

  return {
    destroy() {
      unsubscribe();
      context.revert();
    },
    tier: () => tier,
    liveTriggers: () => ScrollTrigger.getAll().length,
  };
}

/**
 * Число живых ScrollTrigger'ов. Нужно проверке «уход со страницы не оставляет
 * живых таймлайнов»: утверждение «мы всё убрали» должно быть измеримым,
 * а не декларативным (кодекс §6).
 */
export function liveTriggerCount(): number {
  return ScrollTrigger.getAll().length;
}
