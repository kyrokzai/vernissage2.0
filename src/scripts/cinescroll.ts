/**
 * VERNISSAGE CINEMATIC SCROLL — видео, управляемое прокруткой (canvas, покадрово).
 *
 * Качество (лаборатория сравнения):
 * - кадры в исходном разрешении видео 834×1112; варианты Original (JPEG ~q97, 4:4:4), Premium (WebP q90),
 *   Ultra (WebP без потерь), «Было» (прежние 600×800 q62 на телефоне);
 * - холст в полной плотности экрана (devicePixelRatio до 3, раньше было ограничение 2 и лишнее растяжение);
 * - масштабирование в браузере с imageSmoothingQuality = 'high';
 * - смешивание соседних кадров по умолчанию выключено (оно давало двоение и мягкость при движении камеры).
 * Параметры в адресе: ?q=original|premium|ultra|legacy&blend=1&fit=arch — переключатель на странице меняет их без перезагрузки.
 *
 * Прокрутка родная: sticky-сцена, пассивный scroll, кадр = прогресс; стоп — кадр стоит, назад — видео назад.
 */
const html = document.documentElement;
const sec = document.querySelector<HTMLElement>('[data-cs]');

function clamp(v: number, a = 0, b = 1) { return Math.min(b, Math.max(a, v)); }
function seg(p: number, a: number, b: number) { return clamp((p - a) / (b - a)); }
const ease = (t: number) => 1 - Math.pow(1 - t, 3);

type Q = 'original' | 'premium' | 'ultra' | 'legacy';

if (sec && html.classList.contains('cs-on')) {
  const mob = matchMedia('(max-width: 760px)').matches;
  const base = sec.dataset.base!;
  const n = Number(sec.dataset.n);
  const SETS: Record<Q, { dir: string; ext: string; label: string }> = {
    original: { dir: `${base}q/original/`, ext: 'jpg', label: 'Original · JPEG 834×1112' },
    premium: { dir: `${base}q/premium/`, ext: 'webp', label: 'Premium · WebP q90 834×1112' },
    ultra: { dir: `${base}q/ultra/`, ext: 'webp', label: 'Ultra · WebP без потерь 834×1112' },
    legacy: { dir: mob ? `${base}m/` : `${base}d/`, ext: 'webp', label: mob ? 'Было · WebP q62 600×800' : 'Было · WebP q66 834×1112' },
  };
  const url = new URL(location.href);
  let q = (url.searchParams.get('q') as Q) in SETS ? (url.searchParams.get('q') as Q) : 'premium';
  let blend = url.searchParams.get('blend') === '1';
  let fit = url.searchParams.get('fit') === 'arch' ? 'arch' : 'cover';

  const stick = sec.querySelector<HTMLElement>('.cs-stick')!;
  const frame = sec.querySelector<HTMLElement>('.cs-frame')!;
  const cv = sec.querySelector<HTMLCanvasElement>('.cs-cv')!;
  const ctx = cv.getContext('2d', { alpha: false })!;
  const poster = sec.querySelector<HTMLElement>('.cs-poster')!;
  const beats = Array.from(sec.querySelectorAll<HTMLElement>('.cs-beat'));
  const cue = sec.querySelector<HTMLElement>('.cs-cue');
  const stat = sec.querySelector<HTMLElement>('[data-cs-stat]');

  let blobs: (Blob | null)[] = [];
  const cache = new Map<number, ImageBitmap | HTMLImageElement>();
  const pending = new Set<number>();
  const LIMIT = mob ? 24 : 40;
  const hasBitmap = 'createImageBitmap' in window;
  let p = 0, drawnKey = '', need = true, gen = 0, loaded = 0, bytes = 0, natW = 0, natH = 0;

  // ---------- загрузка набора кадров: каждый 8-й, затем 4-й, 2-й, все ----------
  const order: number[] = [];
  for (const st of [8, 4, 2, 1]) for (let i = 0; i < n; i += st) if (!order.includes(i)) order.push(i);
  if (!order.includes(n - 1)) order.splice(1, 0, n - 1);
  function loadSet() {
    const my = ++gen;
    blobs = new Array(n).fill(null); loaded = 0; bytes = 0;
    for (const bm of cache.values()) if ('close' in bm) (bm as ImageBitmap).close();
    cache.clear(); pending.clear(); drawnKey = '';
    const set = SETS[q];
    let k = 0, failed = 0;
    const next = () => {
      if (my !== gen || k >= order.length) return;
      const i = order[k++];
      fetch(`${set.dir}${String(i + 1).padStart(3, '0')}.${set.ext}`)
        .then((r) => (r.ok ? r.blob() : Promise.reject(r.status)))
        .then((b) => { if (my !== gen) return; blobs[i] = b; loaded++; bytes += b.size; if (Math.abs(i - p * (n - 1)) < 6) decode(i); info(); })
        .catch(() => { failed++; if (failed > 8 && my === gen && !cache.size) html.classList.remove('cs-on'); })
        .finally(next);
    };
    for (let c = 0; c < 6; c++) next();
    info();
  }

  // ---------- декодирование с ограничением памяти ----------
  function decode(i: number) {
    if (i < 0 || i >= n || cache.has(i) || pending.has(i) || !blobs[i]) return;
    const my = gen;
    pending.add(i);
    const done = (bm: ImageBitmap | HTMLImageElement) => {
      if (my !== gen) { if ('close' in bm) (bm as ImageBitmap).close(); return; }
      pending.delete(i); cache.set(i, bm);
      natW = (bm as ImageBitmap).width; natH = (bm as ImageBitmap).height;
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

  // ---------- рисование в полной плотности экрана ----------
  let dpr = 1;
  function size() {
    dpr = Math.min(devicePixelRatio || 1, 3);
    cv.width = Math.round(frame.clientWidth * dpr); cv.height = Math.round(frame.clientHeight * dpr);
    drawnKey = ''; need = true; schedule(); info();
  }
  function blit(img: ImageBitmap | HTMLImageElement, alpha: number) {
    const W = cv.width, H = cv.height;
    const iw = (img as ImageBitmap).width, ih = (img as ImageBitmap).height;
    const s = Math.max(W / iw, H / ih), w = iw * s, h = ih * s;
    ctx.imageSmoothingEnabled = true;
    (ctx as CanvasRenderingContext2D & { imageSmoothingQuality: string }).imageSmoothingQuality = 'high';
    ctx.globalAlpha = alpha;
    ctx.drawImage(img, (W - w) / 2, (H - h) / 2, w, h);
  }
  function draw() {
    const f = p * (n - 1);
    const i0 = blend ? Math.floor(f) : Math.round(f), a = blend ? f - Math.floor(f) : 0;
    for (let d = -3; d <= 6; d++) decode(i0 + d);
    const j0 = cache.has(i0) ? i0 : nearest(i0);
    if (j0 < 0) return;
    const j1 = blend && j0 === i0 && a > 0.02 && cache.has(i0 + 1) ? i0 + 1 : -1;
    const key = `${q}:${j0}:${j1}:${j1 < 0 ? 0 : a.toFixed(2)}:${cv.width}x${cv.height}`;
    if (key === drawnKey) return;
    drawnKey = key;
    blit(cache.get(j0)!, 1);
    if (j1 >= 0) blit(cache.get(j1)!, a);
    ctx.globalAlpha = 1;
    if (!cv.classList.contains('ready')) { cv.classList.add('ready'); poster.classList.add('hide'); }
  }

  // ---------- текст и глубина по прогрессу ----------
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
    // без масштабирования холста трансформацией (оно размывало кадр) — глубину дают текст и свет
  }

  // ---------- сведения для сравнения ----------
  function info() {
    if (!stat) return;
    const sw = natW || 834, sh = natH || 1112;
    const s = Math.max(cv.width / sw, cv.height / sh);
    stat.textContent = `${SETS[q].label} · кадров ${loaded}/${n} · ${(bytes / 1048576).toFixed(1)} МБ · экран ×${dpr} · холст ${cv.width}×${cv.height} · увеличение ×${s.toFixed(2)}${blend ? ' · смешивание' : ''}`;
  }

  // ---------- переключатель ----------
  const ui = sec.querySelector<HTMLElement>('[data-cs-ui]');
  function syncUi() {
    sec!.classList.toggle('fit-arch', fit === 'arch');
    ui?.querySelectorAll<HTMLButtonElement>('[data-q]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.q === q)));
    ui?.querySelector<HTMLButtonElement>('[data-blend]')?.setAttribute('aria-pressed', String(blend));
    ui?.querySelector<HTMLButtonElement>('[data-fit]')?.setAttribute('aria-pressed', String(fit === 'arch'));
    const u = new URL(location.href);
    u.searchParams.set('q', q);
    if (blend) u.searchParams.set('blend', '1'); else u.searchParams.delete('blend');
    if (fit === 'arch') u.searchParams.set('fit', 'arch'); else u.searchParams.delete('fit');
    history.replaceState(null, '', u);
  }
  ui?.addEventListener('click', (e) => {
    const b = (e.target as Element).closest<HTMLButtonElement>('button');
    if (!b) return;
    if (b.dataset.q && b.dataset.q !== q) { q = b.dataset.q as Q; syncUi(); loadSet(); }
    else if (b.hasAttribute('data-blend')) { blend = !blend; syncUi(); drawnKey = ''; need = true; schedule(); info(); }
    else if (b.hasAttribute('data-fit')) { fit = fit === 'arch' ? 'cover' : 'arch'; syncUi(); requestAnimationFrame(size); }
    else if (b.hasAttribute('data-ui-toggle')) ui.classList.toggle('open');
  });

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
  // Размер холста — всегда по фактическому размеру сцены. Без этого холст мог создаться до загрузки стилей
  // (754×348 вместо 1179×1977 на iPhone) и растягивался в ~6 раз — главная причина размытия в прежней сборке.
  if ('ResizeObserver' in window) {
    let lw = 0, lh = 0;
    new ResizeObserver(() => { if (frame.clientWidth !== lw || frame.clientHeight !== lh) { lw = frame.clientWidth; lh = frame.clientHeight; size(); } }).observe(frame);
  }
  addEventListener('load', size, { once: true });
  syncUi(); loadSet(); size(); tick();
  (window as unknown as { __cs: unknown }).__cs = { get q() { return q; }, get loaded() { return loaded; }, get p() { return p; } };
}
