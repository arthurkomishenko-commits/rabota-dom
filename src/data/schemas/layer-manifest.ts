/**
 * Схема манифеста слоёв анимационного объекта.
 *
 * Что делает: описывает набор слоёв сборки (hero-пергола, забор) и валидирует
 * ограничения, которые в F5 будет поздно обнаруживать глазами.
 * Вход: нет. Выход: Zod-схема + TS-тип.
 * Кто использует: `src/data/` (загрузка манифестов), проверки сборки.
 *
 * Z-ПОЛОСЫ (бриф §8, протокол §8): слои объектов 10–40, портрет и оверлеи ≥50.
 * Слой со `zIndex >= 50` перекрыл бы портрет мастера в hero — это не «некрасиво»,
 * это сломанная режиссура кадра. Билд падает.
 *
 * Схема заводится сейчас, в F2, потому что F5 должна прийти на готовый контракт,
 * а не изобретать его вместе с анимацией. Кода анимаций здесь нет.
 */
import { z } from 'zod';

/** Верхняя граница полосы объектов. Всё, что выше, — портрет и оверлеи. */
export const OBJECT_Z_MAX = 49;

const layerSchema = z.object({
  /** Имя слоя как в исходнике Blender/PSD — чтобы ассет можно было найти. */
  name: z.string().min(2),
  src: z.string().min(3),
  /**
   * Канвас-правило (бриф §8): слой экспортируется размером ровно финального
   * канваса, прозрачный фон, без кропа. Размеры обязательны — без них
   * `<img>` не получит width/height и страница будет прыгать.
   */
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  zIndex: z
    .number()
    .int()
    .min(10, 'слои объектов начинаются с 10')
    .max(OBJECT_Z_MAX, `слои объектов — 10–${OBJECT_Z_MAX}; ≥50 занято портретом и оверлеями`),
});

export const layerManifestSchema = z
  .object({
    schemaVersion: z.literal(1),
    object: z.string().min(2),
    /** Полный вариант: 5–7 структурных слоёв на объект (бриф §8). */
    layers: z.array(layerSchema).min(3).max(7),
    /** Ступени деградации-лестницы. Простое подмножество слоёв, не другой объект. */
    mobile: z.array(z.string()).optional(),
    simplified: z.array(z.string()).min(1).max(3).optional(),
  })
  .superRefine((manifest, ctx) => {
    const names = new Set(manifest.layers.map((l) => l.name));

    for (const variant of ['mobile', 'simplified'] as const) {
      for (const name of manifest[variant] ?? []) {
        if (!names.has(name)) {
          ctx.addIssue({
            code: 'custom',
            path: [variant],
            message: `слой «${name}» не существует в основном наборе`,
          });
        }
      }
    }
  });

export type LayerManifest = z.infer<typeof layerManifestSchema>;
