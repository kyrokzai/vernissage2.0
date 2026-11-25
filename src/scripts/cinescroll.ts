/**
 * VERNISSAGE CINEMATIC SCROLL — видео, управляемое прокруткой.
 *
 * Почему canvas, а не <video>.currentTime: в Safari на iPhone перемотка MP4 по прокрутке идёт рывками
 * (декодер ищет ключевые кадры, события seek приходят с опозданием). Здесь 97 кадров видео лежат как WebP;
 * кадр = прогресс прохождения секции, между соседними кадрами — плавное смешивание.
 *
 * - Прокрутка родная: сцена «прилипает» через CSS sticky, обработчик scroll пассивный, без preventDefault и «догоняния».
 *   Остановили прокрутку — кадр стоит; назад — видео идёт назад.
 * - Память iPhone: храним сжатые кадры (≈ 2 МБ), а декодированными держим только ~24 кадра вокруг текущего.
 * - Нет JS, «уменьшить движение», экономия трафика (класс cs-on не ставится в <head>) — статичный кадр и весь текст.
 */
const html = document.documentElement;
const sec = document.querySelector<HTMLElement>('[data-cs]');

function clamp(v: number, a = 0, b = 1) { return Math.min(b, Math.max(a, v)); }
function seg(p: number, a: number, b: number) { return clamp((p - a) / (b - a)); }
const ease = (t: number) => 1 - Math.pow(1 - t, 3);

if (sec && html.classList.contains('cs-on')) {
  const mob = matchMedia('(max-width: 760px)').matches;
  const dir = (mob ? sec.dataset.m : sec.dataset.d)!;
  const n = Number(sec.dataset.n);
  const stick = sec.querySelector<HTMLElement>('.cs-stick')!;
  const frame = sec.querySelector<HTMLElement>('.cs-frame')!;
  const cv = sec.querySelector<HTMLCanvasElement>('.cs-cv')!;
  const ctx = cv.getContext('2d', { alpha: false })!;
  const poster = sec.querySelector<HTMLElement>('.cs-poster')!;
  const beats = Array.from(sec.querySelectorAll<HTMLElement>('.cs-beat'));
  const cue = sec.querySelector<HTMLElement>('.cs-cue');

  const blobs: (Blob | null)[] = new Array(n).fill(null);
  const cache = new Map<number, ImageBitmap | HTMLImageElement>();
  const pending = new Set<number>();
  const LIMIT = mob ? 24 : 40;
  const hasBitmap = 'createImageBitmap' in window;
  let p = 0, drawnKey = '', need = true;

  // ---------- загрузка: каждый 8-й кадр, затем 4-й, 2-й, все ----------
  const order: number[] = [];
  for (const st of [8, 4, 2, 1]) for (let i = 0; i < n; i += st) if (!order.includes(i)) order.push(i);
  if (!order.includes(n - 1)) order.splice(1, 0, n - 1);
  let k = 0, failed = 0;
  const next = () => {
    if (k >= order.length) return;
    const i = order[k++];
    fetch(`${dir}${String(i + 1).padStart(3, '0')}.webp`)
      .then((r) => (r.ok ? r.blob() : Promise.reject(r.status)))
      .then((b) => { blobs[i] = b; if (Math.abs(i - p * (n - 1)) < 6) { decode(i); } })
      .catch(() => { failed++; if (failed > 8) html.classList.remove('cs-on'); })
      .finally(next);
  };
  for (let c = 0; c < 6; c++) next();

  // ---------- декодирование с ограничением памяти ----------
  function decode(i: number) {
    if (i < 0 || i >= n || cache.has(i) || pending.has(i) || !blobs[i]) return;
    pending.add(i);
    const done = (bm: ImageBitmap | HTMLImageElement) => {
      pending.delete(i); cache.set(i, bm);
      if (cache.size > LIMIT) {
        const cur = p * (n - 1);
        let far = -1, dist = -1;
        for (const key of cache.keys()) { const d = Math.abs(key - cur); if (d > dist) { dist = d; far = key; } }
        const old = cache.get(far); cache.delete(far);
        if (old && 'close' in old) (old as ImageBitmap).close();
      }
      need = true; schedule();
    };
    if (hasBitmap) createImageBitmap(blobs[i]!).then(done).catch(() => pending.delete(i));
    else { const im = new Image(); im.src = URL.createObjectURL(blobs[i]!); im.decode().then(() => done(im)).catch(() => pending.delete(i)); }
  }
  function nearest(i: number) {
    for (let d = 0; d < n; d++) { if (cache.has(i - d)) return i - d; if (cache.has(i + d)) return i + d; }
    return -1;
  }

  // ---------- рисование ----------
  function size() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    cv.width = Math.round(frame.clientWidth * dpr); cv.height = Math.round(frame.clientHeight * dpr);
    drawnKey = ''; need = true; schedule();
  }
  function blit(img: ImageBitmap | HTMLImageElement, alpha: number) {
    const W = cv.width, H = cv.height;
    const iw = (img as ImageBitmap).width, ih = (img as ImageBitmap).height;
    const s = Math.max(W / iw, H / ih), w = iw * s, h = ih * s;
    ctx.globalAlpha = alpha;
    ctx.drawImage(img, (W - w) / 2, (H - h) / 2, w, h);
  }
  function draw() {
    const f = p * (n - 1), i0 = Math.floor(f), a = f - i0;
    for (let d = -3; d <= 6; d++) decode(i0 + d); // соседи — заранее
    const j0 = cache.has(i0) ? i0 : nearest(i0);
    if (j0 < 0) return;
    const j1 = j0 === i0 && a > 0.02 && cache.has(i0 + 1) ? i0 + 1 : -1;
    const key = `${j0}:${j1}:${j1 < 0 ? 0 : a.toFixed(2)}:${cv.width}`;
    if (key === drawnKey) return;
    drawnKey = key;
    blit(cache.get(j0)!, 1);
    if (j1 >= 0) blit(cache.get(j1)!, a);
    ctx.globalAlpha = 1;
    if (!cv.classList.contains('ready')) { cv.classList.add('ready'); poster.classList.add('hide'); }
  }

  // ---------- текст и свет по прогрессу ----------
  const beatWin: [number, number, number, number][] = [[-1, 0, 0.22, 0.3], [0.33, 0.41, 0.58, 0.66], [0.7, 0.78, 2, 2]];
  function copy() {
    beats.forEach((b, i) => {
      const [a0, a1, b0, b1] = beatWin[i];
      const tin = a0 < 0 ? 1 : ease(seg(p, a0, a1));
      const tout = ease(seg(p, b0, b1));
      const o = tin * (1 - tout);
      b.style.opacity = o.toFixed(3);
      b.style.transform = `translate3d(0,${((1 - tin) * 26 - tout * 26).toFixed(1)}px,0)`;
      b.style.visibility = o < 0.01 ? 'hidden' : 'visible';
    });
    if (cue) cue.style.opacity = String(1 - seg(p, 0.02, 0.08));
    sec!.style.setProperty('--p', p.toFixed(4));
    // глубина: камера слегка «въезжает», к концу сцена чуть уходит вглубь перед следующим разделом
    const zoom = 1 + 0.04 * p - 0.03 * ease(seg(p, 0.9, 1));
    frame.style.transform = `scale(${zoom.toFixed(4)})`;
  }

  // ---------- прокрутка ----------
  let raf = 0;
  function schedule() { if (!raf) raf = requestAnimationFrame(tick); }
  function tick() {
    raf = 0;
    const r = sec!.getBoundingClientRect();
    const len = sec!.offsetHeight - stick.offsetHeight;
    const np = clamp(-r.top / (len || 1));
    if (np !== p || need) { p = np; need = false; draw(); copy(); }
  }
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', size, { passive: true });
  size(); tick();
}
