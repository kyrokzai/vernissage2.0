/**
 * Галереи: плитки мебели меняют кадры сами, клик открывает полноэкранный просмотр
 * (свайп, колесо, стрелки, Esc, миниатюры). После последнего фото — слайд-приглашение в квиз.
 * Данные приходят из <script type="application/json" id="vn-gal">.
 */
type Item = { c: string; cap: string; demo: boolean; video?: string };
type Gal = { t: string; k: string; i: Item[]; pick?: string | null; cta?: [string, string] };

export function initGallery() {
  const d = document, h = d.documentElement;
  const data = d.getElementById('vn-gal');
  if (!data) return;
  const GAL: Record<string, Gal> = JSON.parse(data.textContent || '{}');
  const rm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = <T extends Element = HTMLElement>(s: string, c: ParentNode = d) => [...c.querySelectorAll<T>(s)] as T[];
  const byId = (id: string) => d.getElementById(id)!;

  /* 1. плитки мебели: фоновая смена кадров */
  $<HTMLAnchorElement>('.bt[data-gal]').forEach((a, n) => {
    const key = a.dataset.gal!;
    a.addEventListener('click', (e) => { e.preventDefault(); open(key, 0, a); });
    const layers = $('.ph.cyc', a);
    if (rm || layers.length < 2) return;
    let cur = 0, hov = false, seen = false;
    a.addEventListener('pointerenter', () => { hov = true; });
    a.addEventListener('pointerleave', () => { hov = false; });
    new IntersectionObserver(([e]) => { seen = e.isIntersecting; }).observe(a);
    setInterval(() => {
      if (hov || !seen || d.hidden || h.classList.contains('lb-open')) return;
      layers[cur].classList.remove('on'); cur = (cur + 1) % layers.length;
      layers[cur].classList.remove('lz'); layers[cur].classList.add('on');
      layers[(cur + 1) % layers.length].classList.remove('lz');
    }, 4300 + n * 900);
  });

  /* лента и карточки */
  $('.marq-track .mqi:not([aria-hidden])').forEach((m) => {
    m.setAttribute('tabindex', '0'); m.setAttribute('role', 'button'); m.setAttribute('aria-haspopup', 'dialog');
    m.setAttribute('aria-label', (m.getAttribute('aria-label') || '') + ': открыть галерею');
  });
  d.addEventListener('click', (e) => {
    const t = e.target as HTMLElement;
    const m = t.closest<HTMLElement>('.mqi');
    if (m) {
      const c = 'i-' + m.dataset.img; const ix = Math.max(0, GAL.works.i.findIndex((it) => it.c === c));
      open('works', ix, m); return;
    }
    const f = t.closest<HTMLElement>('.pf');
    if (f && !t.closest('a')) { open('portfolio', Number(f.dataset.i) || 0, f); return; }
    const cs = t.closest<HTMLElement>('.cs');
    if (cs) open('cs_' + cs.dataset.case, 0, cs);
  });
  d.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const t = e.target as HTMLElement;
    if (t?.matches?.('.mqi[tabindex], .pf, .cs')) { e.preventDefault(); t.click(); }
  });

  /* 2. полноэкранная галерея */
  const lb = byId('lb'), stage = byId('lb-stage'), cap = byId('lb-cap'), ttl = byId('lb-title'),
    thumbs = byId('lb-thumbs'), dots = byId('lb-dots'), cnt = byId('lb-count'), demo = byId('lb-demo'),
    prevB = byId('lb-prev') as HTMLButtonElement, nextB = byId('lb-next') as HTMLButtonElement, closeB = byId('lb-x') as HTMLButtonElement;
  let cur = 0, N = 0, items: Item[] = [], lastFocus: HTMLElement | null = null, cooling = false, curKey = '';

  const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
  function build(key: string) {
    const g = GAL[key]; curKey = key; items = g.i; N = items.length;
    stage.replaceChildren(); thumbs.replaceChildren(); dots.replaceChildren();
    ttl.innerHTML = '<small>' + esc(g.k) + '</small>' + esc(g.t);
    items.forEach((it, i) => {
      const sl = d.createElement('div'); sl.className = 'lb-slide'; sl.style.setProperty('--i', String(i));
      sl.innerHTML = `<div class="lb-bgimg ph ${it.c}"></div><div class="lb-img ph ${it.c}" role="img" aria-label="${esc(it.cap)}">` +
        (it.video ? `<video class="lb-vid" muted playsinline loop preload="none" data-src="${esc(it.video)}" aria-hidden="true"></video><span class="lb-play">Видео</span>` : '') + '</div>';
      stage.appendChild(sl);
      const th = d.createElement('button'); th.type = 'button'; th.className = 'lb-th ph ' + it.c;
      th.setAttribute('aria-label', 'Фото ' + (i + 1) + (it.video ? ', видео' : '')); th.addEventListener('click', () => go(i)); thumbs.appendChild(th);
      dots.appendChild(d.createElement('i'));
    });
    const cs = d.createElement('div'); cs.className = 'lb-slide'; cs.style.setProperty('--i', String(N));
    cs.innerHTML = `<div class="lb-bgimg ph ${items[0].c}"></div><div class="lb-cta"><p class="label">${esc(g.cta ? g.cta[0] : 'Понравился стиль?')}</p><h2>${g.cta ? g.cta[1] : 'Рассчитаем ваш проект <span class="gt">за 1 минуту</span>'}</h2><p>Ответьте на пять коротких вопросов, и мы подготовим предварительную стоимость и подберём похожие реализованные объекты.</p><button class="btn btn-primary" type="button" id="lb-go">Рассчитать стоимость</button><small>или листайте дальше: откроется расчёт</small></div>`;
    stage.appendChild(cs);
    const q = d.createElement('button'); q.type = 'button'; q.className = 'lb-th q'; q.textContent = 'Расчёт';
    q.setAttribute('aria-label', 'Перейти к расчёту стоимости'); q.addEventListener('click', () => go(N)); thumbs.appendChild(q);
    dots.appendChild(d.createElement('i'));
    byId('lb-go').addEventListener('click', toQuiz);
  }
  function syncVideo() {
    $<HTMLVideoElement>('.lb-vid', stage).forEach((v) => {
      const own = Number((v.closest('.lb-slide') as HTMLElement).style.getPropertyValue('--i'));
      if (own === cur && lb.classList.contains('on')) {
        if (!v.src) v.src = v.dataset.src || '';
        if (!rm) v.play().then(() => v.classList.add('on')).catch(() => {});
        else v.controls = true;
      } else { v.pause(); }
    });
  }
  function go(n: number) {
    n = Math.max(0, Math.min(N, n)); cur = n;
    lb.style.setProperty('--cur', String(n)); lb.style.setProperty('--dx', '0px');
    $('.lb-slide', lb).forEach((sl, i) => { sl.classList.toggle('cur', i === n); sl.setAttribute('aria-hidden', i === n ? 'false' : 'true'); });
    $('.lb-th', lb).forEach((t, i) => {
      t.classList.toggle('on', i === n);
      if (i === n) { t.setAttribute('aria-current', 'true'); try { t.scrollIntoView({ block: 'nearest', inline: 'center' }); } catch { /* старые браузеры */ } }
      else t.removeAttribute('aria-current');
    });
    $('i', dots).forEach((t, i) => t.classList.toggle('on', i === n));
    const q = n === N;
    cap.textContent = q ? '' : items[n].cap;
    demo.hidden = q || !items[n].demo;
    cnt.textContent = q ? 'Следующий шаг: расчёт стоимости' : n + 1 + ' / ' + N;
    prevB.disabled = n === 0;
    nextB.classList.toggle('go', q);
    nextB.setAttribute('aria-label', q ? 'Перейти к расчёту стоимости' : 'Следующее фото');
    syncVideo();
  }
  function open(key: string, idx: number, from?: HTMLElement) {
    if (!GAL[key]) return;
    build(key); lastFocus = from || (d.activeElement as HTMLElement);
    lb.removeAttribute('inert'); lb.setAttribute('aria-hidden', 'false');
    lb.style.setProperty('--cur', String(idx)); lb.classList.add('on'); h.classList.add('lb-open');
    go(idx);
    setTimeout(() => closeB.focus(), 60);
  }
  function close() {
    if (!lb.classList.contains('on')) return;
    lb.classList.remove('on'); lb.setAttribute('aria-hidden', 'true'); lb.setAttribute('inert', ''); h.classList.remove('lb-open');
    $<HTMLVideoElement>('.lb-vid', stage).forEach((v) => v.pause());
    try { lastFocus?.focus({ preventScroll: true }); } catch { /* элемент мог исчезнуть */ }
  }
  function toQuiz() {
    close();
    const g = GAL[curKey];
    const pk = g.pick === undefined ? 'Мебель на заказ' : g.pick;
    if (pk) d.dispatchEvent(new CustomEvent('vn:pick', { detail: { value: pk, text: pk } }));
    byId('quiz')?.scrollIntoView({ behavior: rm ? 'auto' : 'smooth', block: 'start' });
  }
  const next = () => { if (cur >= N) toQuiz(); else go(cur + 1); };
  const prev = () => go(cur - 1);
  nextB.addEventListener('click', next); prevB.addEventListener('click', prev); closeB.addEventListener('click', close);

  d.addEventListener('keydown', (e) => {
    if (!lb.classList.contains('on')) return;
    const k = e.key;
    if (k === 'Escape') close();
    else if (k === 'ArrowRight' || k === 'ArrowDown' || k === 'PageDown') { e.preventDefault(); next(); }
    else if (k === 'ArrowLeft' || k === 'ArrowUp' || k === 'PageUp') { e.preventDefault(); prev(); }
    else if (k === 'Tab') {
      const f = $<HTMLButtonElement>('button:not([disabled])', lb).filter((b) => b.offsetParent !== null);
      if (!f.length) return;
      const i = f.indexOf(d.activeElement as HTMLButtonElement);
      if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
    }
  });
  lb.addEventListener('wheel', (e) => {
    e.preventDefault(); if (cooling) return;
    const v = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    if (Math.abs(v) < 18) return; cooling = true; setTimeout(() => { cooling = false; }, 750);
    if (v > 0) next(); else prev();
  }, { passive: false });

  /* свайп и перетаскивание */
  let sx: number | null = null, sy = 0, raw = 0, dragging = false;
  stage.addEventListener('pointerdown', (e) => {
    if ((e.target as HTMLElement).closest('button')) return;
    sx = e.clientX; sy = e.clientY; raw = 0; dragging = false;
  });
  stage.addEventListener('pointermove', (e) => {
    if (sx === null) return;
    const x = e.clientX - sx, y = e.clientY - sy;
    if (!dragging) {
      if (Math.abs(x) > 8 && Math.abs(x) > Math.abs(y)) { dragging = true; lb.classList.add('drag'); try { stage.setPointerCapture(e.pointerId); } catch { /* */ } }
      else return;
    }
    raw = x;
    const edge = (cur === 0 && x > 0) || (cur === N && x < 0);
    lb.style.setProperty('--dx', (edge ? x * 0.35 : x) + 'px');
  });
  function endDrag() {
    if (sx === null) return;
    const was = dragging, mv = raw; sx = null; dragging = false;
    lb.classList.remove('drag'); lb.style.setProperty('--dx', '0px');
    if (!was) return;
    if (mv < -60) next(); else if (mv > 60) prev();
  }
  stage.addEventListener('pointerup', endDrag);
  stage.addEventListener('pointercancel', endDrag);
}
