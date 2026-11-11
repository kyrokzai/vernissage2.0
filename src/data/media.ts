import type { ImageMetadata } from 'astro';

/**
 * Реестр изображений. Ключ = имя файла без расширения, CSS-класс = `i-<ключ>`.
 * src/assets/vn  — реальные материалы VERNISSAGE (ветка gh-pages);
 * src/assets/ref — изображения из утверждённого референса: демонстрационные, права не подтверждены.
 */
const mods = import.meta.glob<{ default: ImageMetadata }>('../assets/{ref,vn}/*.{jpg,webp}', { eager: true });

export type Img = { key: string; meta: ImageMetadata; demo: boolean };
export const IMAGES: Record<string, Img> = {};
for (const [path, mod] of Object.entries(mods)) {
  const key = path.split('/').pop()!.replace(/\.(jpg|webp)$/, '');
  IMAGES[key] = { key, meta: mod.default, demo: path.includes('/ref/') };
}

export function img(key: string): Img {
  const i = IMAGES[key];
  if (!i) throw new Error(`Нет изображения «${key}»`);
  return i;
}
export const isDemo = (key: string) => img(key).demo;
/** классы фото-слоя: `ph i-key` (+ `lz` для отложенной загрузки) */
export const ph = (key: string, lazy = true) => `ph i-${img(key).key}${lazy ? ' lz' : ''}`;
