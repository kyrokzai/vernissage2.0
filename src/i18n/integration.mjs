// i18n VERNISSAGE: единая система локализации по принципу gettext. Страницы и компоненты пишутся один раз (русский —
// исходный язык), словарь src/i18n/kk.json переводит их при сборке: для каждой страницы из PAGES создаётся /kk/…
// с lang="kk", переведёнными текстами, атрибутами, SEO-метаданными, JSON-LD, сообщениями WhatsApp и ссылками внутри
// казахской версии. Строки скриптов (уведомления формы и т. п.) переводит src/i18n/rt.ts из того же словаря (раздел ui).
// Непереведённые строки сборка перечисляет в предупреждении (I18N_DUMP=файл — полный список).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DICT = JSON.parse(fs.readFileSync(new URL('./kk.json', import.meta.url), 'utf8'));
import { PAGES } from './pages.mjs';
const KZ = /[ӘәҒғҚқҢңӨөҰұҮүІіҺһ]/;
const CYR = /[А-Яа-яЁё]/;
const ENT = { nbsp: ' ', amp: '&', quot: '"', '#39': "'", '#x27': "'", lt: '<', gt: '>', mdash: '—', ndash: '–', laquo: '«', raquo: '»', hellip: '…' };
const dec = (s) => s.replace(/&(#?\w+);/g, (m, e) => ENT[e] ?? (e[0] === '#' ? String.fromCodePoint(e[1] === 'x' ? parseInt(e.slice(2), 16) : +e.slice(1)) : m));
const key = (s) => dec(s).replace(/[\s ]+/g, ' ').trim();
const escT = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/ /g, '&nbsp;');
const escA = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/ /g, '&nbsp;');
const T = { ...DICT.pages, ...DICT.ui };
const KW = new Set([...Object.values(T), ...Object.values(DICT.html || {}).map((h) => h.replace(/<[^>]+>/g, ' '))].join(' ').split(/[\s\u00a0]+/));

function makeTr(missing) {
  return (raw) => {
    const k = key(raw);
    if (!k || !CYR.test(k)) return null;
    if (T[k] != null) return T[k];
    if (!KZ.test(k) && !k.split(' ').every((w) => KW.has(w))) missing.add(k);
    return null;
  };
}

export function translate(html, base, missing) {
  const tr = makeTr(missing);
  // 1) фрагменты с разметкой внутри (порядок слов в казахском отличается) — до разбора по узлам
  for (const [ru, kk] of Object.entries(DICT.html || {})) html = html.split(ru).join(kk);
  const parts = html.split(/(<script\b[^>]*>[\s\S]*?<\/script>|<style\b[^>]*>[\s\S]*?<\/style>|<[^>]+>)/);
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    if (!p) continue;
    if (p.startsWith('<script')) {
      if (p.includes('application/ld+json')) parts[i] = p.replace(/(<script[^>]*>)([\s\S]*?)(<\/script>)/, (m, a, j, b) => {
        const walk = (v) => typeof v === 'string' ? (tr(v) ?? v) : Array.isArray(v) ? v.map(walk) : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, walk(x)])) : v;
        const o = walk(JSON.parse(j)); o.inLanguage = 'kk';
        return a + JSON.stringify(o) + b;
      });
      continue;
    }
    if (p.startsWith('<style')) continue;
    if (p[0] === '<') { parts[i] = tag(p, base, tr); continue; }
    const t = tr(p);
    if (t != null) { const lead = p.match(/^[\s]*/)[0], tail = p.match(/[\s]*$/)[0]; parts[i] = lead + escT(t) + tail; }
  }
  return parts.join('');
}

function tag(t, base, tr) {
  if (/^<html\b/.test(t)) t = t.replace(/\blang="ru"/, 'lang="kk"');
  const hreflang = /\shreflang=/.test(t);
  return t.replace(/\s([\w:-]+)="([^"]*)"/g, (m, a, v) => {
    if (a === 'href' || a === 'data-src' || a === 'src') {
      let u = v;
      u = u.replace(/([?&;]lang=)ru\b/g, '$1kk');
      if (u.startsWith('https://wa.me/')) u = u.replace(/text=([^&"]*)/, (mm, q) => { const s = decodeURIComponent(q.replace(/&amp;/g, '&')); const k = tr(s); return 'text=' + encodeURIComponent(k ?? s); });
      if (a === 'href' && !hreflang && u.startsWith(base)) {
        const rest = u.slice(base.length), p = rest.split(/[?#]/)[0];
        if (!rest.startsWith('kk/') && PAGES.includes(p) && !/^\S+\.\w+$/.test(p)) u = base + 'kk/' + rest;
      }
      return u === v ? m : ` ${a}="${u}"`;
    }
    if (a === 'content' && /^ru_RU$/.test(v)) return ` ${a}="kk_KZ"`;
    if (/^(class|id|style|data-dir|srcset|sizes|type|rel|name|property|charset|data-[\w-]*-?id)$/.test(a)) return m;
    const k = tr(v);
    return k == null ? m : ` ${a}="${escA(k)}"`;
  });
}

export default function i18n({ base = '/' } = {}) {
  return {
    name: 'vn-i18n',
    hooks: {
      'astro:build:done': ({ dir, logger }) => {
        const root = fileURLToPath(dir);
        const missing = new Set();
        for (const p of PAGES) {
          const src = path.join(root, p, 'index.html');
          if (!fs.existsSync(src)) continue;
          let html = translate(fs.readFileSync(src, 'utf8'), base, missing);
          // canonical казахской страницы — её собственный адрес; ссылка-переключатель отмечает текущий язык
          html = html.replace(/<link rel="canonical" href="([^"]*)"/, (m, u) => { const x = new URL(u); x.pathname = x.pathname.replace(new RegExp('^' + base), base + 'kk/'); return `<link rel="canonical" href="${x.href}"`; })
            .replace(/<meta property="og:url" content="([^"]*)"/, (m, u) => { const x = new URL(u); x.pathname = x.pathname.replace(new RegExp('^' + base), base + 'kk/'); return `<meta property="og:url" content="${x.href}"`; })
            .replace(/ aria-current="true" data-lang="ru"/g, ' data-lang="ru"').replace(/ data-lang="kk"/g, ' aria-current="true" data-lang="kk"');
          const out = path.join(root, 'kk', p, 'index.html');
          fs.mkdirSync(path.dirname(out), { recursive: true });
          fs.writeFileSync(out, html);
        }
        if (missing.size) {
          logger.warn(`i18n: нет перевода для ${missing.size} строк`);
          if (process.env.I18N_DUMP) fs.writeFileSync(process.env.I18N_DUMP, JSON.stringify([...missing], null, 1));
        } else logger.info('i18n: казахская версия собрана, все строки переведены');
      },
    },
  };
}
