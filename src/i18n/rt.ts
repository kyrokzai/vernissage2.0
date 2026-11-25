// Перевод строк, которые создают скрипты (уведомления формы, подписи 3D-раздела, сообщение WhatsApp).
// Тот же словарь, что и для страниц (src/i18n/kk.json, раздел ui); язык — атрибут lang страницы.
import { ui } from './kk.json';
export const LANG: 'ru' | 'kk' = document.documentElement.lang === 'kk' ? 'kk' : 'ru';
export const tr = (s: string): string => (LANG === 'kk' && (ui as Record<string, string>)[s]) || s;
/** Корень сайта на текущем языке: для ссылок, которые строит скрипт. */
export const langBase = import.meta.env.BASE_URL + (LANG === 'kk' ? 'kk/' : '');
