/**
 * «От детали — к целому»: состояние сцены — чистая функция прогресса прокрутки p ∈ [0, 1].
 * Прокрутка вниз ведёт от макро к целому, вверх — обратно. В DOM пишутся только transform/opacity/clip-path.
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

export function initDetailToWhole() {
  const sec = document.getElementById('detail');
  if (!sec) return;
  const h = document.documentElement;
  const rm = matchMedia('(prefers-reduced-motion: reduce)');
  const shots = [...sec.querySelectorAll<HTMLElement>('.dw-shot:not(.dw-film)')];
  const film = sec.querySelector<HTMLElement>('.dw-film')!;
  const filmDim = sec.querySelector<HTMLElement>('.dw-dim')!;
  const video = sec.querySelector<HTMLVideoElement>('.dw-video')!;
  const fin = sec.querySelector<HTMLElement>('.dw-final')!;
  const lis = [...sec.querySelectorAll<HTMLElement>('.dw-ch li')];
  const rail = sec.querySelector<HTMLElement>('.dw-rail-p')!;
  const ticks = [...sec.querySelectorAll<HTMLElement>('.dw-rail span')];
  const probe = sec.querySelector<HTMLElement>('.dw-probe')!;
  const ins = shots.map((el) => el.querySelector<HTMLElement>('.dw-in')!);
  const wins = shots.map((el) => el.querySelector<HTMLElement>('.dw-win')!);
  let visible = false, near = false, loaded = false, chap = -1, top = 0, span = 1;
  // «окно» детали в процентах сцены: из него раскрывается готовый интерьер
  let win = { t: 22, r: 30, b: 22, l: 30, rad: 28 };

  const measure = () => {
    const r = sec.getBoundingClientRect();
    top = r.top + scrollY;
    span = Math.max(1, sec.offsetHeight - innerHeight);
    const st = probe.parentElement!.getBoundingClientRect(), w = probe.getBoundingClientRect();
    if (st.width && w.width) win = {
      t: ((w.top - st.top) / st.height) * 100, b: ((st.bottom - w.bottom) / st.height) * 100,
      l: ((w.left - st.left) / st.width) * 100, r: ((st.right - w.right) / st.width) * 100,
      rad: parseFloat(getComputedStyle(probe).borderTopLeftRadius) || 28,
    };
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
      el.style.opacity = o.toFixed(3);
      el.style.visibility = o > 0 ? 'visible' : 'hidden';
      if (o <= 0) return;
      ins[i].style.transform = `scale(${lerp(s.s0, s.s1, t).toFixed(4)})`;
      wins[i].style.translate = `0 ${lerp(26, -26, t).toFixed(1)}px`;
    });
    // фильм: из «окна» в полный кадр
    const fo = clamp((p - 0.52) / FADE);
    const open = ease(clamp((p - 0.53) / 0.2));
    const k = 1 - open, f2 = (v: number) => (v * k).toFixed(2);
    film.style.opacity = fo.toFixed(3);
    film.style.visibility = fo > 0 ? 'visible' : 'hidden';
    film.style.clipPath = `inset(${f2(win.t)}% ${f2(win.r)}% ${f2(win.b)}% ${f2(win.l)}% round ${(win.rad * k).toFixed(1)}px)`;
    film.style.transform = `scale(${lerp(1.08, 1, open).toFixed(4)})`;
    const dim = ease(clamp((p - 0.78) / 0.1));
    filmDim.style.opacity = (dim * 0.68).toFixed(3);
    // финал: знак VERNISSAGE
    const q = clamp((p - 0.8) / 0.14);
    fin.style.setProperty('--q', ease(q).toFixed(4));
    fin.style.visibility = q > 0 ? 'visible' : 'hidden';
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
    rail.style.transform = `scaleY(${p.toFixed(4)})`;
  }

  let ticking = false;
  const req = () => { if (!ticking && (visible || near)) { ticking = true; requestAnimationFrame(() => { ticking = false; render(); }); } };
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) { measure(); req(); } else if (!video.paused) video.pause(); }).observe(sec);
  new IntersectionObserver(([e]) => { near = e.isIntersecting; if (near) loadVideo(); }, { rootMargin: '100% 0px' }).observe(sec);
  addEventListener('scroll', req, { passive: true });
  addEventListener('resize', () => { measure(); req(); });
  new ResizeObserver(() => { measure(); req(); }).observe(document.body);
  document.addEventListener('vn:entered', () => { measure(); req(); });
  rm.addEventListener('change', () => { h.classList.toggle('rm', rm.matches); if (rm.matches) video.pause(); measure(); req(); });
  measure(); render();
}
