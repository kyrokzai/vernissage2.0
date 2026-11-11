/**
 * «От детали — к целому»: состояние сцены — чистая функция прогресса прокрутки p ∈ [0, 1].
 * Прокрутка вниз ведёт от макро к целому, вверх — обратно. В DOM пишутся только transform/opacity/clip-path.
 */
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ease = (t: number) => 1 - Math.pow(1 - t, 3);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// окно появления кадра [a, b], масштаб от s0 к s1 (камера «отъезжает» от макро)
const SHOTS = [
  { a: 0.0, b: 0.17, s0: 1.5, s1: 1.18 },
  { a: 0.13, b: 0.3, s0: 1.42, s1: 1.14 },
  { a: 0.26, b: 0.43, s0: 1.34, s1: 1.08 },
  { a: 0.39, b: 0.56, s0: 1.28, s1: 1.04 },
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
  const video = sec.querySelector<HTMLVideoElement>('.dw-video')!;
  const fin = sec.querySelector<HTMLElement>('.dw-final')!;
  const lis = [...sec.querySelectorAll<HTMLElement>('.dw-ch li')];
  const rail = sec.querySelector<HTMLElement>('.dw-rail-p')!;
  const ticks = [...sec.querySelectorAll<HTMLElement>('.dw-rail span')];
  let visible = false, near = false, loaded = false, chap = -1, top = 0, span = 1;

  const measure = () => {
    const r = sec.getBoundingClientRect();
    top = r.top + scrollY;
    span = Math.max(1, sec.offsetHeight - innerHeight);
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
      el.style.transform = `scale(${lerp(s.s0, s.s1, t).toFixed(4)})`;
      el.style.visibility = o > 0 ? 'visible' : 'hidden';
    });
    // фильм: из «окна» в полный кадр
    const fo = clamp((p - 0.52) / FADE);
    const open = ease(clamp((p - 0.53) / 0.2));
    const iy = lerp(22, 0, open), ix = lerp(30, 0, open), rr = lerp(28, 0, open);
    film.style.opacity = fo.toFixed(3);
    film.style.visibility = fo > 0 ? 'visible' : 'hidden';
    film.style.clipPath = `inset(${iy.toFixed(2)}% ${ix.toFixed(2)}% round ${rr.toFixed(1)}px)`;
    film.style.transform = `scale(${lerp(1.12, 1, open).toFixed(4)})`;
    const dim = ease(clamp((p - 0.78) / 0.1));
    film.style.filter = `brightness(${lerp(1, 0.32, dim).toFixed(3)}) saturate(${lerp(1, 0.6, dim).toFixed(3)})`;
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
