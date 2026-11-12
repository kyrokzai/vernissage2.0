/**
 * «От детали — к целому»: состояние сцены — чистая функция прогресса прокрутки p ∈ [0, 1].
 * Прокрутка вниз ведёт от макро к целому, вверх — обратно.
 * Производительность: в DOM пишутся только transform/opacity и только изменившиеся значения;
 * раскрытие видео — масштаб слоя с обратным масштабом содержимого (без clip-path и перерисовки).
 */
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ease = (t: number) => 1 - Math.pow(1 - t, 3);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// окно появления кадра [a, b], масштаб от s0 к s1 (камера «отъезжает» от макро)
const SHOTS = [
  { a: 0.0, b: 0.17, s0: 1.38, s1: 1.04 },
  { a: 0.13, b: 0.3, s0: 1.32, s1: 1.02 },
  { a: 0.26, b: 0.43, s0: 1.3, s1: 1.02 },
  { a: 0.39, b: 0.56, s0: 1.26, s1: 1 },
];
const FADE = 0.045;
const CHAPTERS = [0, 0.27, 0.53, 0.8];

/** запись стиля только при изменении значения: без лишних пересчётов стилей на каждом кадре */
const last = new WeakMap<HTMLElement, Record<string, string>>();
function put(el: HTMLElement, prop: string, val: string) {
  let m = last.get(el); if (!m) { m = {}; last.set(el, m); }
  if (m[prop] === val) return;
  m[prop] = val;
  if (prop.startsWith('--')) el.style.setProperty(prop, val); else (el.style as unknown as Record<string, string>)[prop] = val;
}

export function initDetailToWhole() {
  const sec = document.getElementById('detail');
  if (!sec) return;
  const h = document.documentElement;
  const rm = matchMedia('(prefers-reduced-motion: reduce)');
  const shots = [...sec.querySelectorAll<HTMLElement>('.dw-shot:not(.dw-film)')];
  const film = sec.querySelector<HTMLElement>('.dw-film')!;
  const filmDim = sec.querySelector<HTMLElement>('.dw-dim')!;
  const filmIn = sec.querySelector<HTMLElement>('.dw-film-in')!;
  const filmZ = sec.querySelector<HTMLElement>('.dw-film-z')!;
  const logo = sec.querySelector<HTMLElement>('.dw-logo')!;
  const video = sec.querySelector<HTMLVideoElement>('.dw-video')!;
  const fin = sec.querySelector<HTMLElement>('.dw-final')!;
  const lis = [...sec.querySelectorAll<HTMLElement>('.dw-ch li')];
  const rail = sec.querySelector<HTMLElement>('.dw-rail-p')!;
  const ticks = [...sec.querySelectorAll<HTMLElement>('.dw-rail span')];
  const probe = sec.querySelector<HTMLElement>('.dw-probe')!;
  const ins = shots.map((el) => el.querySelector<HTMLElement>('.dw-in')!);
  const wins = shots.map((el) => el.querySelector<HTMLElement>('.dw-win')!);
  let visible = false, near = false, loaded = false, chap = -1, top = 0, span = 1;
  // «окно» детали в пикселях сцены: из него раскрывается готовый интерьер
  let W = innerWidth, H = innerHeight;
  let win = { x: W * 0.3, y: H * 0.22, w: W * 0.4, h: H * 0.56, rad: 28 };

  const measure = () => {
    const r = sec.getBoundingClientRect();
    top = r.top + scrollY;
    span = Math.max(1, sec.offsetHeight - innerHeight);
    const st = probe.parentElement!.getBoundingClientRect(), w = probe.getBoundingClientRect();
    if (st.width && w.width) {
      W = st.width; H = st.height;
      win = { x: w.left - st.left, y: w.top - st.top, w: w.width, h: w.height, rad: parseFloat(getComputedStyle(probe).borderTopLeftRadius) || 28 };
    }
    last.delete(film); last.delete(filmIn);
  };

  function loadVideo() {
    if (loaded || rm.matches) return;
    loaded = true;
    const port = innerHeight > innerWidth;
    video.poster = (port ? video.dataset.posterPort : video.dataset.posterLand) || '';
    video.src = (port ? video.dataset.port : video.dataset.land) || '';
  }

  function render() {
    if (rm.matches) return;
    const p = clamp((scrollY - top) / span);
    shots.forEach((el, i) => {
      const s = SHOTS[i];
      const o = clamp((p - s.a) / FADE) * clamp((s.b - p) / FADE);
      const t = ease(clamp((p - s.a) / (s.b - s.a)));
      put(el, 'opacity', o.toFixed(3));
      put(el, 'visibility', o > 0 ? 'visible' : 'hidden');
      if (o <= 0) return;
      put(ins[i], 'transform', `scale(${lerp(s.s0, s.s1, t).toFixed(4)})`);
      put(wins[i], 'translate', `0 ${lerp(26, -26, t).toFixed(1)}px`);
    });
    // фильм: из «окна» в полный кадр
    const fo = clamp((p - 0.52) / FADE);
    const open = ease(clamp((p - 0.53) / 0.2));
    put(film, 'opacity', fo.toFixed(3));
    put(film, 'visibility', fo > 0 ? 'visible' : 'hidden');
    if (fo > 0) {
      const x = lerp(win.x, 0, open), y = lerp(win.y, 0, open);
      const sx = lerp(win.w, W, open) / W, sy = lerp(win.h, H, open) / H, r = win.rad * (1 - open);
      put(film, 'transform', `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0) scale(${sx.toFixed(4)},${sy.toFixed(4)})`);
      put(film, 'borderRadius', r > 0.5 ? `${(r / sx).toFixed(1)}px / ${(r / sy).toFixed(1)}px` : '0');
      put(filmIn, 'transform', `scale(${(1 / sx).toFixed(4)},${(1 / sy).toFixed(4)}) translate3d(${(-x).toFixed(1)}px,${(-y).toFixed(1)}px,0)`);
      put(filmZ, 'transform', `scale(${lerp(1.08, 1, open).toFixed(4)})`);
      const dim = ease(clamp((p - 0.78) / 0.1));
      put(filmDim, 'opacity', (dim * 0.68).toFixed(3));
    }
    // финал: знак VERNISSAGE
    const q = clamp((p - 0.8) / 0.14);
    put(fin, '--q', ease(q).toFixed(3));
    put(fin, 'visibility', q > 0 ? 'visible' : 'hidden');
    logo.classList.toggle('shine', q >= 1);
    // видео играет, только пока его видно
    if (fo > 0 && visible) { loadVideo(); if (video.paused && video.src) video.play().catch(() => {}); }
    else if (!video.paused) video.pause();
    // главы
    let c = 0; CHAPTERS.forEach((v, i) => { if (p >= v) c = i; });
    if (c !== chap) {
      chap = c;
      lis.forEach((li, i) => li.classList.toggle('on', i === c));
      ticks.forEach((t, i) => t.classList.toggle('on', i <= c));
    }
    put(rail, 'transform', `scaleY(${p.toFixed(3)})`);
  }

  let ticking = false;
  const req = () => { if (!ticking && (visible || near)) { ticking = true; requestAnimationFrame(() => { ticking = false; render(); }); } };
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) { measure(); req(); } else if (!video.paused) video.pause(); }).observe(sec);
  new IntersectionObserver(([e]) => { near = e.isIntersecting; if (near) loadVideo(); }, { rootMargin: '100% 0px' }).observe(sec);
  // пока сцена под шапкой: без backdrop-filter у шапки и без шумового слоя (они пересчитывались поверх видео каждый кадр)
  new IntersectionObserver(([e]) => h.classList.toggle('over-dw', e.isIntersecting), { rootMargin: '0px 0px -88% 0px' }).observe(sec);
  addEventListener('scroll', req, { passive: true });
  addEventListener('resize', () => { measure(); req(); });
  new ResizeObserver(() => { measure(); req(); }).observe(document.body);
  document.addEventListener('vn:entered', () => { measure(); req(); });
  rm.addEventListener('change', () => { h.classList.toggle('rm', rm.matches); if (rm.matches) video.pause(); measure(); req(); });
  measure(); render();
}
