/**
 * Реестр браузерных движков для аудита.
 *
 * Что делает: отдаёт список движков и общие профили вьюпортов.
 * Кто использует: полировка и сценарии симуляционного аудита.
 *
 * ЗАЧЕМ ТРИ ДВИЖКА. До сих пор всё проверялось на Chromium. Основная
 * аудитория сайта — израильский мобайл, то есть в большой части iPhone,
 * а это WebKit. Проверять RTL, `dvh`, `<dialog>`, `clip-path` и нативные
 * поля формы только в Chromium — значит не проверять их для половины людей,
 * ради которых сайт делается. Firefox добавлен третьим, потому что он
 * отличается от обоих и ловит то, что Chromium и WebKit пропускают вместе.
 */
import { chromium, firefox, webkit } from 'playwright';

export const ENGINES = [
  { name: 'chromium', launcher: chromium },
  { name: 'webkit', launcher: webkit },
  { name: 'firefox', launcher: firefox },
];

/**
 * Вьюпорты. Альбомный телефон здесь не для полноты списка: именно в нём
 * ломаются липкие панели и «высота экрана», потому что высота становится
 * меньше ширины, а адресная строка съедает ещё часть.
 */
export const VIEWPORTS = [
  { name: '320', width: 320, height: 640 },
  { name: '375', width: 375, height: 812 },
  { name: '768', width: 768, height: 1024 },
  { name: '1440', width: 1440, height: 900 },
  { name: 'landscape-phone', width: 844, height: 390 },
];

/** Мобильная сеть и слабый процессор — условия, в которых сайт живёт. */
export const THROTTLE = {
  // 3G: ~1.6 Мбит/с вниз, 750 Кбит/с вверх, задержка 150 мс.
  network: { downloadThroughput: (1.6 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8, latency: 150 },
  cpuRate: 4,
};

/**
 * Троттлинг ставится через протокол CDP и существует только в Chromium.
 * В WebKit и Firefox его нет — там сценарии идут на полной скорости,
 * и это честно указывается в отчёте, а не выдаётся за проверенное.
 */
export async function applyThrottle(page, engineName) {
  if (engineName !== 'chromium') return false;

  const client = await page.context().newCDPSession(page);
  await client.send('Network.enable');
  await client.send('Network.emulateNetworkConditions', { offline: false, ...THROTTLE.network });
  await client.send('Emulation.setCPUThrottlingRate', { rate: THROTTLE.cpuRate });
  return true;
}
