/**
 * Cinematic Redesign 2.0 — движение при прокрутке (GSAP ScrollTrigger, родная прокрутка, scrub: true).
 * Параллакс только у фотографий внутри рамок, текст не плывёт. Моменты: word-highlight (заявление), pinned-chapters (шаги).
 * «Уменьшить движение» и экономия трафика: ничего не запускаем, всё видно сразу.
 */
type G = any;
const html = document.documentElement;
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const SAVE = !!(navigator as G).connection?.saveData;
const CDN = 'https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/';
const $ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => r.querySelector<T>(s);
const $$ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => Array.from(r.querySelectorAll<T>(s));

function load(src: string) {
  return new Promise<void>((res, rej) => { const s = document.createElement('script'); s.src = src; s.async = true; s.onload = () => res(); s.onerror = () => rej(); document.head.appendChild(s); });
}

/* ---------- pinned-chapters: активный шаг — тот, что пересекает середину экрана (без GSAP) ---------- */
function process() {
  const steps = $$('.pc2-s'), phs = $$('.pc2-ph');
  if (!steps.length) return;
  const set = (i: number) => { steps.forEach((s, k) => s.classList.toggle('on', k === i)); phs.forEach((p, k) => p.classList.toggle('on', k === i)); };
  const io = new IntersectionObserver((es) => { for (const e of es) if (e.isIntersecting) set(Number((e.target as HTMLElement).dataset.i)); }, { rootMargin: '-48% 0px -48% 0px' });
  steps.forEach((s) => io.observe(s));
}

/* ---------- указатель комнат: на компьютере фото комнаты справа по наведению и фокусу ---------- */
function rooms() {
  const pks = $$('.rm2-pk');
  if (!pks.length) return;
  const set = (i: number) => pks.forEach((p, k) => p.classList.toggle('on', k === i));
  set(0);
  $$('.rm2-row').forEach((r) => {
    const i = Number(r.dataset.i);
    r.addEventListener('pointerenter', () => set(i));
    r.addEventListener('focus', () => set(i));
  });
}

/* ---------- word-highlight: слово «загорается», когда его строка проходит середину экрана ---------- */
function words(ST: G) {
  const box = $('[data-r2-words]');
  if (!box) return;
  const ws = $$('.w', box);
  const upd = () => { const line = innerHeight * 0.56; for (const w of ws) w.classList.toggle('lit', w.getBoundingClientRect().top < line); };
  ST.create({ trigger: box, start: 'top bottom', end: 'bottom top', onUpdate: upd, onRefresh: upd });
  upd();
}

async function init() {
  process(); rooms();
  if (RM || SAVE) return;
  html.classList.add('r2-on');
  try { await load(CDN + 'gsap.min.js'); await load(CDN + 'ScrollTrigger.min.js'); } catch { html.classList.remove('r2-on'); return; }
  const w = window as G, g = w.gsap, ST = w.ScrollTrigger;
  g.registerPlugin(ST);
  ST.config({ ignoreMobileResize: true });

  // 1. первый экран: фото уходит медленнее страницы (глубина), следующий раздел наезжает сверху
  if ($('[data-r2-hero]')) g.to('[data-r2-hero]', { yPercent: 16, ease: 'none', scrollTrigger: { trigger: '.h2o', start: 'top top', end: 'bottom top', scrub: true } });

  // 2. заявление
  words(ST);

  // 4. проект: кадр раскрывается из рамки к полной ширине, фото внутри «оседает»
  const st = $('[data-r2-reveal]');
  if (st) {
    const sc = { trigger: st, start: 'top 92%', end: 'top 18%', scrub: true };
    g.fromTo('.pj2-frame', { scale: 0.86 }, { scale: 1, ease: 'none', scrollTrigger: sc });
    g.fromTo('.pj2-img', { scale: 1.22 }, { scale: 1.04, ease: 'none', scrollTrigger: sc });
  }

  // многослойный параллакс: фото внутри рамок с разной глубиной
  $$('[data-r2-depth]').forEach((f) => {
    const d = Number(f.dataset.r2Depth) || 5, img = $('img', f);
    if (img) g.fromTo(img, { yPercent: -d }, { yPercent: d, ease: 'none', scrollTrigger: { trigger: f, start: 'top bottom', end: 'bottom top', scrub: true } });
  });

  // появление фотографий из маски, один раз
  const rv = Array.from(document.querySelectorAll<HTMLElement>('.rm2-th, .cr2-th, .wk2-g figure, .mt2-grid figure, .pj2-pair figure, .bz2-f, .r2-tail .k-stage'));
  rv.forEach((el) => el.setAttribute('data-r2-rv', ''));
  ST.batch(rv, { start: 'top 88%', once: true, onEnter: (els: Element[]) => els.forEach((el, i) => setTimeout(() => el.classList.add('in'), i * 110)) });
  document.fonts?.ready.then(() => ST.refresh());
  addEventListener('load', () => ST.refresh(), { once: true });
  w.__r2 = true;
}
init();
