/**
 * Сервер для прогона Lighthouse на фиксированном порту.
 *
 * ЗАЧЕМ ОТДЕЛЬНО. `staticDistDir` раздаёт `dist` из корня, а страницы ссылаются
 * на ресурсы через base `/rabota-dom/`. В такой раздаче CSS, шрифты и скрипты
 * отвечают 404, и Lighthouse измеряет страницу БЕЗ оформления: получаются
 * прекрасные цифры, не имеющие отношения к сайту. Найдено по единственной
 * зацепке — «errors in console» в best-practices.
 *
 * Здесь раздаётся тот же `dist`, но под настоящим базовым путём.
 */
import { serveDist } from './lib/serve-dist.mjs';

const PORT = 4319;
const { origin } = await serveDist(PORT);
console.log(`lhci server ready at ${origin}`);
