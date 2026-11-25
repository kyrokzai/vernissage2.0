/**
 * ЭКСПЕРИМЕНТ «Cinematic Experience» (ветка experiment/cinematic). Слой поверх v9, стабильную сборку не меняет.
 *
 * Правила:
 * - прокрутка родная: ни ScrollSmoother, ни normalizeScroll, ни preventDefault на wheel/touch; сцены «прилипают» CSS sticky;
 * - анимируются только transform и opacity; scrub: true (без инерционного «догоняния»), кроме разовых появлений;
 * - GSAP (ScrollTrigger, SplitText) грузится только здесь и только если класс html.cine уже выставлен в <head>
 *   (нет «уменьшить движение» и экономии трафика). Не загрузился — класс снимается, остаётся статичная v9;
 * - страница конструктора /create-3d/ GSAP не грузит.
 */
type G = any; // GSAP подключается с CDN в прототипе; в рабочей версии — npm-пакет и типы

const html = document.documentElement;
const CDN = 'https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/';
const $ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => r.querySelector<T>(s);
const $$ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => Array.from(r.querySelectorAll<T>(s));
const mobile = () => matchMedia('(max-width: 700px)').matches;

function load(src: string) {
  return new Promise<void>((res, rej) => {
    const s = document.createElement('script');
    s.src = src; s.async = true; s.crossOrigin = 'anonymous';
    s.onload = () => res(); s.onerror = () => rej(new Error(src));
    document.head.appendChild(s);
  });
}

/* ---------- сцена «Через арку»: покадровая последовательность на canvas ---------- */
function scene(g: G) {
  const sec = $<HTMLElement>('[data-cine]');
  if (!sec) return;
  const mob = mobile();
  const dir = (mob ? sec.dataset.m : sec.dataset.d)!;
  const n = Number(mob ? sec.dataset.mn : sec.dataset.dn);
  const cv = $<HTMLCanvasElement>('.cn-cv', sec)!, ctx = cv.getContext('2d', { alpha: false })!;
  const poster = $('.cn-poster', sec)!;
  poster.classList.add('show');
  const imgs: (HTMLImageElement | null)[] = new Array(n).fill(null);
  let cur = -1, want = 0;

  // сначала каждый 8-й кадр, потом 4-й, 2-й, все: прокрутка сразу «живая», детали догружаются
  const order: number[] = [];
  for (const st of [8, 4, 2, 1]) for (let i = 0; i < n; i += st) if (!order.includes(i)) order.push(i);
  if (!order.includes(n - 1)) order.splice(1, 0, n - 1);
  let started = false;
  const start = () => {
    if (started) return; started = true;
    let k = 0;
    const next = () => {
      if (k >= order.length) return;
      const i = order[k++];
      const im = new Image();
      im.decoding = 'async';
      im.src = `${dir}${String(i + 1).padStart(3, '0')}.webp`;
      im.decode().then(() => { imgs[i] = im; if (cur < 0 || Math.abs(i - want) < Math.abs(cur - want)) draw(want, true); }).catch(() => {}).finally(next);
    };
    for (let c = 0; c < 6; c++) next();
  };
  new IntersectionObserver((es, io) => { if (es.some((e) => e.isIntersecting)) { start(); io.disconnect(); } }, { rootMargin: '25% 0px' }).observe(sec);
  addEventListener('scroll', start, { once: true, passive: true });

  const size = () => {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    cv.width = Math.round(cv.clientWidth * dpr); cv.height = Math.round(cv.clientHeight * dpr);
    draw(want, true);
  };
  function draw(i: number, force = false) {
    want = i;
    let j = -1;
    for (let d = 0; d < n; d++) { if (imgs[i - d]) { j = i - d; break; } if (imgs[i + d]) { j = i + d; break; } }
    if (j < 0 || (j === cur && !force)) return;
    cur = j;
    const im = imgs[j]!, W = cv.width, H = cv.height;
    const s = Math.max(W / im.naturalWidth, H / im.naturalHeight);
    const w = im.naturalWidth * s, h = im.naturalHeight * s;
    ctx.drawImage(im, (W - w) / 2, (H - h) / 2, w, h);
    poster.classList.remove('show');
  }
  addEventListener('resize', size, { passive: true });
  size();

  const tl = g.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: { trigger: sec, start: 'top top', end: 'bottom bottom', scrub: true,
      onUpdate: (s: { progress: number }) => draw(Math.round(s.progress * (n - 1))) },
  });
  const portal = $(mob ? '.cn-portal--m' : '.cn-portal--d', sec), fg = $('.cn-fg', sec), scrim = $('.cn-scrim', sec), veil = $('.cn-veil', sec);
  tl.fromTo(portal, { scale: 1 }, { scale: mob ? 7 : 5.6, duration: 0.5, ease: 'power2.in' }, 0)
    .to(portal, { opacity: 0, duration: 0.07 }, 0.45)
    .fromTo(fg, { xPercent: 0, yPercent: 0, rotate: 0 }, { xPercent: -70, yPercent: -35, rotate: -8, duration: 0.6 }, 0)
    .to(fg, { opacity: 0, duration: 0.1 }, 0.5)
    .fromTo([scrim, $('.cn-cap', sec)], { opacity: 0 }, { opacity: 1, duration: 0.12 }, 0.3)
    .fromTo($('.cn-h', sec), { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.06, ease: 'power2.out' }, 0.2)
    .to($('.cn-h', sec), { opacity: 0, duration: 0.05 }, 0.9);
  const line = (k: number, a: number, b: number) => {
    const el = $(`.cn-l[data-l="${k}"]`, sec);
    tl.fromTo(el, { opacity: 0, yPercent: 45 }, { opacity: 1, yPercent: 0, duration: 0.07, ease: 'power2.out' }, a)
      .to(el, { opacity: 0, yPercent: -35, duration: 0.06, ease: 'power2.in' }, b);
  };
  line(1, 0.22, 0.4); line(2, 0.44, 0.62); line(3, 0.66, 0.9);
  // в конце сцена не гаснет: следующий раздел наезжает на неё, когда «прилипание» заканчивается
  tl.fromTo(veil, { opacity: 0 }, { opacity: 0.18, duration: 0.08 }, 0.92).set({}, {}, 1);
}

/* ---------- первый экран ---------- */
function hero(g: G, Split: G) {
  const v = $('.v');
  if (!v) return;
  const st = { trigger: v, start: 'top top', end: 'bottom top', scrub: true };
  g.fromTo('.v-photo img', { yPercent: 0, scale: 1.1 }, { yPercent: 7, scale: 1.1, ease: 'none', scrollTrigger: st });
  g.to('.v-inset', { y: -50, ease: 'none', scrollTrigger: st });
  g.to('.v-fgb', { y: -260, rotate: -142, ease: 'none', scrollTrigger: st });
  g.to('.v-gobo', { y: 60, ease: 'none', scrollTrigger: { ...st } });
  // тень листвы и ветка качаются только пока первый экран виден
  (window as G).ScrollTrigger.create({ trigger: v, start: 'top top', end: 'bottom top', onToggle: (s: { isActive: boolean }) => v.classList.toggle('paused', !s.isActive) });
}

/* ---------- заголовки разделов: строки из маски, один раз ---------- */
function headings(g: G, Split: G) {
  $$('.x-h2').forEach((h) => {
    Split.create(h, { type: 'lines', mask: 'lines', autoSplit: true, linesClass: 'cn-ln',
      onSplit: (self: { lines: Element[] }) => g.from(self.lines, { yPercent: 110, duration: 1.05, ease: 'expo.out', stagger: 0.09,
        scrollTrigger: { trigger: h, start: 'top 88%', once: true } }) });
    const lead = h.parentElement?.querySelector('.x-lead');
    if (lead) g.from(lead, { opacity: 0, y: 18, duration: 0.9, ease: 'power2.out', delay: 0.25, scrollTrigger: { trigger: h, start: 'top 88%', once: true } });
  });
}

/* ---------- арки: занавес поднимается, фото «оседает» ---------- */
function arches(g: G) {
  const frames = $$('.c-frame');
  if (!frames.length) return;
  frames.forEach((f) => { const c = document.createElement('span'); c.className = 'cn-cur'; f.appendChild(c); });
  (window as G).ScrollTrigger.batch(frames, { start: 'top 88%', once: true,
    onEnter: (b: Element[]) => {
      g.to(b.map((f) => $('.cn-cur', f)), { scaleY: 0, duration: 1.35, ease: 'expo.inOut', stagger: 0.09 });
      g.fromTo(b.map((f) => $('.ph img', f)), { scale: 1.22 }, { scale: 1, duration: 1.9, ease: 'expo.out', stagger: 0.09, clearProps: 'transform' });
    } });
}

/* ---------- «Работы»: многослойный параллакс ---------- */
function works(g: G) {
  const sp = $('.w-spread');
  if (!sp) return;
  const a = mobile() ? 3 : 6;
  const st = { trigger: sp, start: 'top bottom', end: 'bottom top', scrub: true };
  g.fromTo($$('.w-main .ph img', sp), { yPercent: -a, scale: 1.12 }, { yPercent: a, scale: 1.12, ease: 'none', scrollTrigger: st });
  g.fromTo($('.w-detail', sp), { y: mobile() ? 16 : 48 }, { y: mobile() ? -16 : -48, ease: 'none', scrollTrigger: st });
}

/* ---------- мягкий свет между разделами ---------- */
function lights(g: G) {
  $$('.x-sec').forEach((s) => {
    const l = document.createElement('div'); l.className = 'cn-light'; l.setAttribute('aria-hidden', 'true');
    s.prepend(l); s.style.overflowX = 'clip';
    g.fromTo(l, { yPercent: -12, opacity: 0.6 }, { yPercent: 28, opacity: 1, ease: 'none', scrollTrigger: { trigger: s, start: 'top bottom', end: 'bottom top', scrub: true } });
  });
}

/* ---------- 3D-раздел и переход к конструктору ---------- */
function kit(g: G) {
  const stage = $('.k-stage');
  if (stage) g.fromTo(stage, { yPercent: 5, scale: 0.965 }, { yPercent: 0, scale: 1, ease: 'none', scrollTrigger: { trigger: stage, start: 'top bottom', end: 'top 45%', scrub: true } });
  // общий элемент для View Transition: рендер «перетекает» в окно конструктора на /create-3d/ (Chrome 126+, Safari 18.2+)
  $$('[data-k3-cta]').forEach((a) => a.addEventListener('click', () => {
    const view = $('.k-view');
    if (view) (view.style as CSSStyleDeclaration & { viewTransitionName: string }).viewTransitionName = 'k3';
  }));
  addEventListener('pageshow', () => { const view = $('.k-view'); if (view) view.style.removeProperty('view-transition-name'); });
}

async function init() {
  if (!html.classList.contains('cine')) return;
  if (document.querySelector('[data-r2]')) return; // Redesign 2.0 ведёт своё движение (r2.ts)
  if (document.readyState !== 'complete') await new Promise((r) => addEventListener('load', r, { once: true }));
  await new Promise((r) => ('requestIdleCallback' in window ? (window as G).requestIdleCallback(r, { timeout: 1200 }) : setTimeout(r, 200)));
  try {
    await load(CDN + 'gsap.min.js');
    await Promise.all([load(CDN + 'ScrollTrigger.min.js'), load(CDN + 'SplitText.min.js')]);
  } catch {
    html.classList.remove('cine'); // нет сети до CDN — статичная v9
    return;
  }
  const w = window as G, g = w.gsap;
  g.registerPlugin(w.ScrollTrigger, w.SplitText);
  w.ScrollTrigger.config({ ignoreMobileResize: true });
  scene(g); hero(g, w.SplitText); headings(g, w.SplitText); arches(g); works(g); lights(g); kit(g);
  document.fonts?.ready.then(() => w.ScrollTrigger.refresh());
  (window as G).__cine = true;
}
init();
