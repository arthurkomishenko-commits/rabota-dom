/**
 * Сборка объектов JSON-LD.
 *
 * Что делает: превращает данные страницы в схемы schema.org.
 * Вход: значения со страницы. Выход: обычные объекты.
 * Кто использует: страницы через `StructuredData.astro`.
 *
 * Чистые функции без побочных эффектов; ничего не знают ни про Astro,
 * ни про то, откуда пришли данные.
 */

export interface BusinessInput {
  siteUrl: string;
  name: string;
  description: string;
  phone: string;
  areaServed: string[];
  languages: string[];
}

export function localBusiness(input: BusinessInput): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: input.name,
    description: input.description,
    url: input.siteUrl,
    telephone: input.phone,
    areaServed: input.areaServed.map((name) => ({ '@type': 'Place', name })),
    availableLanguage: input.languages,
    // Ни рейтинга, ни цен: их нет на странице, значит их нет и здесь.
  };
}

export interface ServiceInput {
  siteUrl: string;
  name: string;
  description: string;
  providerName: string;
  areaServed: string[];
}

export function service(input: ServiceInput): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: input.name,
    description: input.description,
    provider: { '@type': 'LocalBusiness', name: input.providerName },
    areaServed: input.areaServed.map((name) => ({ '@type': 'Place', name })),
  };
}

export interface WorkInput {
  url: string;
  name: string;
  description: string;
  image: string;
  city: string;
  year: number;
  material: string;
  creatorName: string;
}

export function creativeWork(input: WorkInput): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: input.name,
    description: input.description,
    url: input.url,
    image: input.image,
    dateCreated: String(input.year),
    material: input.material,
    locationCreated: { '@type': 'Place', name: input.city },
    creator: { '@type': 'Person', name: input.creatorName },
  };
}
