/**
 * «Создать в 3D» — страница сайта VERNISSAGE с 3D-конструктором.
 *
 * Конструктор — отдельный продукт (движок FORMIQ, сборка покупателя VERNISSAGE: четыре шага «Модель · Размеры · Цвет ·
 * Заявка», без режима для специалистов и без цен). Сайт его не копирует: страница показывает его во фрейме и передаёт
 * только разрешённые параметры выбора — что создать, планировку и отделку. Адрес сборки задаётся при сборке сайта
 * (PUBLIC_VN_CONFIGURATOR_URL); по умолчанию — тестовый Preview ветки интеграции.
 */
// experiment/cinematic: сборка конструктора feature/vernissage-cinematic — «На сайт салона» возвращает на сайт, открывший
// конструктор (параметр home, разрешённые адреса проверяет конструктор), с проектом и выбранным языком.
const PREVIEW = 'https://formiq-configurator-git-feature-vernissage-cinematic-kyrokzai.vercel.app/';
const fromEnv = import.meta.env.PUBLIC_VN_CONFIGURATOR_URL as string | undefined;
/** https:// — опубликованная сборка; http://127.0.0.1 — только локальные проверки. */
const valid = (u: string | undefined) => !!u && /^(https:\/\/[\w.-]+|http:\/\/127\.0\.0\.1:\d{2,5})\/([\w./-]*)$/.test(u);
export const CONFIGURATOR_URL = valid(fromEnv) ? fromEnv! : PREVIEW;
export const CONFIGURATOR_ORIGIN = new URL(CONFIGURATOR_URL).origin;

/** Что можно открыть ссылкой: значение ?start конструктора → подпись на сайте. */
export const STARTS = [
  ['kitchen', 'Кухня'],
  ['wardrobe', 'Шкаф'],
  ['tv', 'Гостиная'],
  ['hallway', 'Прихожая'],
  ['chest', 'Комод'],
  ['shelving', 'Стеллаж'],
  ['desk', 'Кабинет'],
  ['bathroom', 'Ванная'],
] as const;
export const LAYOUTS = ['straight', 'corner', 'island'] as const;
export const FINISHES = ['oak', 'walnut', 'ivory', 'graphite'] as const;
type Start = (typeof STARTS)[number][0];
const has = <T extends string>(list: readonly T[], v: string | null): v is T => v !== null && (list as readonly string[]).includes(v);

/**
 * Разделы сайта v9 → что открыть в конструкторе (для ссылок главной страницы v9).
 * «Спальни» — шкафы и световые линии, «Кабинеты» — встроенный стеллаж и стол.
 */
export const CATEGORY_LINKS: Record<string, Start> = {
  'Кухни': 'kitchen', 'Шкафы и гардеробные': 'wardrobe', 'Гостиные': 'tv', 'Спальни': 'wardrobe', 'Ванные': 'bathroom', 'Кабинеты': 'desk',
};

/** Адрес фрейма: только известные параметры; остальное из адреса страницы во фрейм не попадает. */
export function frameSrc(search: string, embed = true): string {
  let q: URLSearchParams;
  try { q = new URLSearchParams(search); } catch { q = new URLSearchParams(); }
  const out = new URLSearchParams();
  if (embed) out.set('embed', '1');
  out.set('theme', 'light');
  out.set('lang', typeof document !== 'undefined' && document.documentElement.lang === 'kk' ? 'kk' : 'ru');
  if (typeof location !== 'undefined') out.set('home', location.origin + import.meta.env.BASE_URL);
  const start = q.get('start'), layout = q.get('layout'), finish = q.get('finish');
  if (has(STARTS.map((s) => s[0]), start)) {
    out.set('start', start);
    if (start === 'kitchen' && has(LAYOUTS, layout)) out.set('layout', layout);
    if (has(FINISHES, finish)) out.set('finish', finish);
  }
  return CONFIGURATOR_URL + '?' + out.toString();
}

/** Ссылка сайта на страницу конструктора с выбором (для категорий и раздела 3D главной). */
export function createLink(base: string, start?: Start, layout?: (typeof LAYOUTS)[number], finish?: (typeof FINISHES)[number]): string {
  const q = new URLSearchParams();
  if (start) q.set('start', start);
  if (start === 'kitchen' && layout) q.set('layout', layout);
  if (start && finish) q.set('finish', finish);
  const s = q.toString();
  return base + 'create-3d/' + (s ? '?' + s : '');
}
