/**
 * Репозиторий работ портфолио.
 *
 * Что делает: отдаёт работы для локали. ЕДИНСТВЕННОЕ место, знающее, откуда
 * они берутся (ARCHITECTURE_PRINCIPLES §2) — сейчас `astro:content`, завтра
 * может быть D1 или внешний API, и поменяется только этот файл.
 * Вход: локаль, slug. Выход: записи коллекции.
 * Кто использует: страницы. Компоненты получают данные через props.
 *
 * Фикстуры (`fixture: true`) не отдаются НИКОГДА: они существуют только для
 * проверки схемы. Отсечение здесь, а не в вызывающем коде, — чтобы забыть
 * про фильтр было негде.
 */
import { getCollection, type CollectionEntry } from 'astro:content';
import type { Locale } from '../config/site';

export type WorkEntry = CollectionEntry<'works'>;

/** id записи имеет вид `work-01/ru` — локаль это последний сегмент. */
function localeOf(entry: WorkEntry): string {
  return entry.id.split('/').pop() ?? '';
}

export async function getWorks(locale: Locale): Promise<WorkEntry[]> {
  const entries = await getCollection('works', (entry) => entry.data.fixture !== true);

  return entries
    .filter((entry) => localeOf(entry) === locale)
    .sort((a, b) => b.data.publishedAt.localeCompare(a.data.publishedAt));
}

export async function getWork(locale: Locale, slug: string): Promise<WorkEntry | undefined> {
  const works = await getWorks(locale);
  return works.find((entry) => entry.data.slug === slug);
}
