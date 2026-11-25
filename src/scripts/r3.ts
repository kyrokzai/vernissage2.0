/**
 * Cinematic Experience 3.0 — сцена «Войти в дом» по принципу studiochenille.com (изучено 25.11.2026):
 * - кадры фильма (WebP, исходное разрешение 9:16) на непрозрачном <canvas>; холст в полной плотности экрана (≤3),
 *   размер меняется только при настоящем изменении сцены — не стираем холст на каждое движение адресной строки iOS;
 * - «тяжёлая камера»: прогресс догоняет прокрутку экспоненциально, k = 1 − e^(−7·dt);
 * - соседние кадры смешиваются только в движении; в покое прогресс доводится до ближайшего загруженного кадра — без двоения;
 * - загрузка: каждый 6-й кадр, затем остальные — ближайшие к зрителю первыми; кадр рисуется только после decode();
 * - финал: съёмка растворяется в реальной фотографии VERNISSAGE, затем текст и кнопки; пауза-плато до следующего раздела;
 * - широкий экран: вертикальная съёмка целиком по центру над размытой копией себя (без растягивания исходника).
 * Прокрутка родная (sticky). Без класса html.cs-on (уменьшить движение / Save-Data) сцена статична — работает CSS.
 */
const html = document.documentElement;
const sec = document.querySelector<HTMLElement>('[data-jr]');
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const seg = (p: number, a: number, b: number) => clamp((p - a) / (b - a));
const ease = (t: number) => t * t * (3 - 2 * t);

const VIDEO_END = 0.8;   // доля сцены, на которую растянут фильм
const DIS_A = 0.72, DIS_B = 0.86; // растворение в реальную фотографию

if (sec && html.classList.contains('cs-on')) {
  const stick = sec.querySelector<HTMLElement>('.jr-stick')!;
  const stage = sec.querySelector<HTMLElement>('[data-jr-stage]')!;
  const cv = sec.querySelector<HTMLCanvasElement>('.jr-cv')!;
  const ctx = cv.getContext('2d', { alpha: false })!;
  const poster = sec.querySelector<HTMLElement>('.jr-poster')!;
  const real = sec.querySelector<HTMLElement>('.jr-real')!;
  const shade = sec.querySelector<HTMLElement>('.jr-shade')!;
  const vig = sec.querySelector<HTMLElement>('.jr-vig')!;
  const cap = sec.querySelector<HTMLElement>('[data-jr-cap]');
  const bOpen = sec.querySelector<HTMLElement>('[data-beat="open"]')!;
  const bMid = sec.querySelector<HTMLElement>('[data-beat="mid"]')!;
  const bFin = sec.querySelector<HTMLElement>('[data-beat="fin"]')!;
  const hint = sec.querySelector<HTMLElement>('.jr-hint');
  const dir = sec.dataset.dir!, n = Number(sec.dataset.n), FW = Number(sec.dataset.fw), FH = Number(sec.dataset.fh);

  const frames: HTMLImageElement[] = new Array(n);
  const loaded: boolean[] = new Array(n).fill(false);
  let target = 0, current = -1, raf = 0, last = 0, drawnKey = '', moving = false;

  // ---------- загрузка ----------
  const queue: number[] = [];
  for (let i = 0; i < n; i += 6) queue.push(i);
  if (!queue.includes(n - 1)) queue.push(n - 1);
  const rest = () => { const cur = Math.round(clamp(target / VIDEO_END) * (n - 1)); return [...Array(n).keys()].filter((i) => !frames[i]).sort((a, b) => Math.abs(a - cur) - Math.abs(b - cur)); };
  let active = 0;
  const pump = () => {
    while (active < 6) {
      let i = queue.shift();
      if (i === undefined) { const r = rest(); if (!r.length) return; i = r[0]; }
      if (frames[i]) continue;
      const im = new Image(); im.decoding = 'async'; frames[i] = im; active++;
      im.src = `${dir}${String(i + 1).padStart(3, '0')}.webp`;
      im.decode().then(() => { loaded[i!] = true; drawnKey = ''; request(); }).catch(() => {}).finally(() => { active--; pump(); });
    }
  };
  pump();

  // ---------- холст ----------
  let landscape = false;
  const wings = document.createElement('canvas'); wings.width = 18; wings.height = 32;
  const wctx = wings.getContext('2d')!;
  function size() {
    const dpr = Math.min(devicePixelRatio || 1, 3);
    const w = Math.round(stage.clientWidth * dpr), h = Math.round(stage.clientHeight * dpr);
    landscape = stage.clientWidth / stage.clientHeight > FW / FH * 1.15;
    if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; drawnKey = ''; }
    ctx.imageSmoothingEnabled = true; (ctx as CanvasRenderingContext2D & { imageSmoothingQuality: string }).imageSmoothingQuality = 'high';
    request();
  }
  function blit(img: HTMLImageElement, alpha: number) {
    const W = cv.width, H = cv.height;
    ctx.globalAlpha = alpha;
    if (!landscape) {
      const s = Math.max(W / FW, H / FH), w = FW * s, h = FH * s;
      ctx.drawImage(img, (W - w) / 2, (H - h) / 2, w, h);
    } else {
      // размытая копия на весь экран + вся вертикальная съёмка по центру
      wctx.drawImage(img, 0, 0, wings.width, wings.height);
      ctx.drawImage(wings, 0, 0, W, H);
      ctx.fillStyle = 'rgba(20,15,11,.45)'; ctx.fillRect(0, 0, W, H);
      const s = H / FH, w = FW * s;
      ctx.drawImage(img, (W - w) / 2, 0, w, H);
    }
    ctx.globalAlpha = 1;
  }
  function nearest(i: number) {
    for (let d = 0; d < n; d++) { if (i - d >= 0 && loaded[i - d]) return i - d; if (i + d < n && loaded[i + d]) return i + d; }
    return -1;
  }
  function drawVideo(p: number) {
    const f = clamp(p / VIDEO_END) * (n - 1);
    const i0 = Math.floor(f), i1 = Math.min(n - 1, i0 + 1), frac = f - i0;
    const a = loaded[i0] ? i0 : nearest(i0);
    if (a < 0) return;
    const b = moving && a === i0 && frac > 0.02 && loaded[i1] ? i1 : -1;
    const key = `${a}:${b}:${b < 0 ? 0 : frac.toFixed(2)}:${cv.width}x${cv.height}`;
    if (key === drawnKey) return;
    drawnKey = key;
    blit(frames[a], 1);
    if (b >= 0) blit(frames[b], frac);
    if (!cv.classList.contains('ready')) { cv.classList.add('ready'); poster.classList.add('gone'); }
  }

  // ---------- текст, свет, растворение ----------
  function choreo(p: number) {
    const dis = ease(seg(p, DIS_A, DIS_B));
    real.style.opacity = dis.toFixed(3);
    real.style.transform = `scale(${(1.06 - 0.06 * ease(seg(p, DIS_A, 1))).toFixed(4)})`;
    if (cap) cap.style.opacity = (1 - dis).toFixed(3);
    // затемнение под текст: полное у титров и финала, слабее в середине пути — съёмка ярче
    shade.style.opacity = (1 - 0.6 * seg(p, 0.1, 0.22) + 0.45 * seg(p, 0.78, 0.9)).toFixed(3);
    vig.style.opacity = (0.2 * seg(p, 0.3, 0.6) + 0.2 * seg(p, DIS_A, 0.9)).toFixed(3);
    const o1 = 1 - ease(seg(p, 0.05, 0.15));
    bOpen.style.opacity = o1.toFixed(3); bOpen.style.transform = `translate3d(0,${(-36 * (1 - o1)).toFixed(1)}px,0)`;
    bOpen.style.visibility = o1 < 0.01 ? 'hidden' : 'visible';
    if (hint) hint.style.opacity = (1 - seg(p, 0.005, 0.04)).toFixed(3);
    const m = ease(seg(p, 0.34, 0.42)) * (1 - ease(seg(p, 0.54, 0.62)));
    bMid.style.opacity = m.toFixed(3); bMid.style.transform = `translate3d(0,${(24 * (1 - ease(seg(p, 0.34, 0.42))) - 24 * ease(seg(p, 0.54, 0.62))).toFixed(1)}px,0)`;
    const fo = ease(seg(p, 0.84, 0.91));
    bFin.style.opacity = fo.toFixed(3); bFin.style.transform = `translate3d(0,${(28 * (1 - fo)).toFixed(1)}px,0)`;
    bFin.style.visibility = fo < 0.01 ? 'hidden' : 'visible';
  }

  // ---------- прокрутка: тяжёлая камера и чистый кадр в покое ----------
  function read() {
    const travel = sec!.offsetHeight - stick.offsetHeight;
    target = travel > 0 ? clamp(-sec!.getBoundingClientRect().top / travel) : 0;
  }
  function settle() {
    if (target >= VIDEO_END * 0.98) return false;
    let i = Math.round((target / VIDEO_END) * (n - 1));
    const j = nearest(i); if (j < 0) return false; i = j;
    const s = (i / (n - 1)) * VIDEO_END;
    if (Math.abs(s - target) < 0.00005) return false;
    target = s; return true;
  }
  function tick(now: number) {
    const dt = last ? Math.min((now - last) / 1000, 0.05) : 0.016; last = now;
    const k = 1 - Math.exp(-7 * dt);
    current = current < 0 ? target : current + (target - current) * k;
    if (Math.abs(target - current) < 0.0004) current = target;
    moving = current !== target;
    drawVideo(current); choreo(current);
    if (current !== target || settle()) raf = requestAnimationFrame(tick);
    else { raf = 0; last = 0; moving = false; drawnKey = ''; drawVideo(current); }
  }
  function request() { read(); if (!raf) raf = requestAnimationFrame(tick); }
  addEventListener('scroll', request, { passive: true });
  if ('ResizeObserver' in window) new ResizeObserver(size).observe(stage); else addEventListener('resize', size);
  size();
  (window as unknown as { __jr: unknown }).__jr = { get p() { return current; }, get loaded() { return loaded.filter(Boolean).length; }, n };
}
