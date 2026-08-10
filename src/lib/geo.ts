/**
 * Работа с координатами точек карты.
 *
 * Что делает: добавляет случайное смещение к уже огрублённым координатам.
 * Вход: координата и ключ. Выход: смещённая координата.
 * Кто использует: страница карты.
 *
 * ПРИВАТНОСТЬ ДВУХСЛОЙНАЯ (бриф §5). Первый слой — огрубление при вводе:
 * схема не примет больше трёх знаков после запятой (~110 м), это проверяется
 * на сборке. Второй слой — смещение 50–100 м при отрисовке, здесь.
 *
 * Смещение детерминировано: одна и та же работа всегда оказывается в одной
 * и той же точке. Случайное при каждой загрузке выглядело бы как дрожание
 * и, что важнее, позволило бы усреднить настоящие координаты по нескольким
 * заходам — то есть отменило бы саму защиту.
 */

const EARTH_METERS_PER_DEGREE = 111_320;

/** Простой детерминированный хэш строки. Криптостойкость здесь не нужна. */
function hash(seed: string): number {
  let value = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    value ^= seed.charCodeAt(i);
    value = Math.imul(value, 16777619);
  }
  return (value >>> 0) / 2 ** 32;
}

export interface Point {
  lat: number;
  lng: number;
}

/**
 * Смещает точку на 50–100 метров в направлении, зависящем от ключа.
 * @param seed стабильный ключ работы (slug) — от него зависит и расстояние,
 * и направление, поэтому результат воспроизводим.
 */
export function jitter(point: Point, seed: string): Point {
  const distance = 50 + hash(`${seed}:d`) * 50;
  const angle = hash(`${seed}:a`) * Math.PI * 2;

  const deltaLat = (distance * Math.cos(angle)) / EARTH_METERS_PER_DEGREE;
  const deltaLng =
    (distance * Math.sin(angle)) /
    (EARTH_METERS_PER_DEGREE * Math.cos((point.lat * Math.PI) / 180));

  return { lat: point.lat + deltaLat, lng: point.lng + deltaLng };
}

/** Центр набора точек — чтобы карта открывалась там, где есть работы. */
export function center(points: Point[]): Point {
  if (points.length === 0) return { lat: 32.7, lng: 35.3 };
  const lat = points.reduce((sum, p) => sum + p.lat, 0) / points.length;
  const lng = points.reduce((sum, p) => sum + p.lng, 0) / points.length;
  return { lat, lng };
}

/** Гейт брифа §5: меньше шести точек — карта и тизер скрыты. */
export const MIN_MAP_POINTS = 6;
export const mapIsPublic = (count: number): boolean => count >= MIN_MAP_POINTS;
