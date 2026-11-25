/**
 * Поведение главной и страниц проектов в дизайне v9 (перенесено из утверждённого макета v9, без страницы-презентации).
 * Движение — только в ответ на действие и одно появление ключевых фото при первом показе; при reduce motion его нет.
 */
import { createLink } from '../../data/create3d';
import { waLink } from '../../data/site';

const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const base = import.meta.env.BASE_URL;
const $ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => r.querySelector<T>(s);
const $$ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => Array.from(r.querySelectorAll<T>(s));

/* ---------- нижняя панель телефона и меню ----------
   Скрыта на первом экране; появляется, когда кнопки первого экрана ушли вверх; прячется у формы, у «Хотите похожую
   мебель?» и в подвале, при вводе текста (клавиатура) и при открытом меню. */
function setupBar() {
  const site = $('.site'), bar = $('.x-bar'), menu = $<HTMLElement>('.x-menu');
  if (!site || !bar) return;
  // лаборатория: кнопки мобильного первого экрана концепции, если она видима; иначе — v9
  const lab = $('[data-hero-acts]', site);
  const start = (lab && lab.offsetParent ? lab : null) || $('.v-acts', site) || $('.x-ph', site);
  const stops = $$('.x-form,.x-cta,.x-ftr', site);
  const st = { passed: false, stops: [] as Element[], focus: false, menu: false };
  const upd = () => {
    const show = st.passed && !st.stops.length && !st.focus && !st.menu;
    bar.classList.toggle('on', show);
    bar.setAttribute('aria-hidden', show ? 'false' : 'true');
    (bar as HTMLElement & { inert: boolean }).inert = !show;
  };
  const io = new IntersectionObserver((es) => {
    for (const e of es) {
      if (e.target === start) st.passed = !e.isIntersecting && e.boundingClientRect.bottom <= 1;
      else {
        const i = st.stops.indexOf(e.target);
        if (e.isIntersecting && i < 0) st.stops.push(e.target);
        if (!e.isIntersecting && i >= 0) st.stops.splice(i, 1);
      }
    }
    upd();
  }, { threshold: 0 });
  if (start) io.observe(start);
  stops.forEach((x) => io.observe(x));
  site.addEventListener('focusin', (e) => { if ((e.target as Element).matches('input,textarea,select')) { st.focus = true; upd(); } });
  site.addEventListener('focusout', (e) => { if ((e.target as Element).matches('input,textarea,select')) { st.focus = false; upd(); } });

  let opener: HTMLElement | null = null;
  const openMenu = (from: HTMLElement) => {
    if (!menu) return;
    opener = from; menu.hidden = false; st.menu = true; upd();
    document.documentElement.style.overflow = 'hidden';
    $$('[data-menu-open]').forEach((b) => b.setAttribute('aria-expanded', 'true'));
    $<HTMLElement>('.x-menu-x', menu)?.focus();
  };
  const closeMenu = (restore = true) => {
    if (!menu || menu.hidden) return;
    menu.hidden = true; st.menu = false; upd();
    document.documentElement.style.overflow = '';
    $$('[data-menu-open]').forEach((b) => b.setAttribute('aria-expanded', 'false'));
    if (restore) opener?.focus();
  };
  document.addEventListener('click', (e) => {
    const b = (e.target as Element).closest<HTMLElement>('[data-menu-open]');
    if (b) { e.preventDefault(); openMenu(b); }
  });
  if (menu) {
    menu.addEventListener('click', (e) => {
      const t = e.target as Element;
      if (t.closest('.x-menu-x')) closeMenu();
      else if (t.closest('a')) closeMenu(false); // переход по ссылке: меню закрывается, навигация идёт как обычно
    });
    menu.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeMenu();
      if (e.key === 'Tab') { // фокус не уходит из открытого меню
        const f = $$<HTMLElement>('a,button', menu).filter((x) => !x.hasAttribute('disabled'));
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  }
  upd();
}

/* ---------- категории: анфилада арок ----------
   Компьютер: арка раскрывается при наведении или фокусе; раскладка через transform — без сдвигов макета (CLS).
   Телефон: лента арок, шкала и номер следуют за прокруткой пальцем, текущая арка выходит вперёд. */
function railSync(row: HTMLElement) {
  const stage = row.closest('.c-stage');
  const rail = (stage ? stage.nextElementSibling : row.nextElementSibling) as HTMLElement | null;
  if (!rail || !rail.classList.contains('c-rail') || !rail.offsetWidth) return;
  const arches = $$('.c-arch', row);
  const max = row.scrollWidth - row.clientWidth, fr = row.clientWidth / row.scrollWidth, pos = max > 0 ? row.scrollLeft / max : 0;
  const bar = $('.c-bar i', rail)!;
  bar.style.setProperty('--w', (fr * 100).toFixed(1) + '%');
  bar.style.setProperty('--x', (pos * (1 / fr - 1) * 100).toFixed(1) + '%');
  let idx = pos > 0.985 ? arches.length - 1 : Math.round(row.scrollLeft / (arches[1].offsetLeft - arches[0].offsetLeft));
  idx = Math.max(0, Math.min(arches.length - 1, idx));
  $('.c-num b', rail)!.textContent = String(idx + 1);
  arches.forEach((x, i) => x.classList.toggle('on', i === idx));
}
const railAll = () => $$('.c-enf').forEach(railSync);

function enfLayout(row: HTMLElement, now: boolean) {
  const arches = $$('.c-arch', row);
  if (getComputedStyle(row).overflowX === 'auto') { // телефон: обычная лента
    row.classList.remove('c-abs');
    arches.forEach((a) => { a.style.removeProperty('--w'); a.style.removeProperty('--x'); });
    return;
  }
  const W = row.clientWidth, gap = 14, n = arches.length, G = 3.1;
  if (!W) return;
  const u = (W - gap * (n - 1)) / (G + n - 1);
  let x = 0;
  if (now) row.classList.add('c-now');
  row.classList.add('c-abs');
  for (const a of arches) {
    const w = a.classList.contains('on') ? u * G : u;
    a.style.setProperty('--w', w.toFixed(1) + 'px');
    a.style.setProperty('--x', x.toFixed(1) + 'px');
    a.style.setProperty('--wn', u.toFixed(1) + 'px');
    x += w + gap;
  }
  if (now) requestAnimationFrame(() => requestAnimationFrame(() => row.classList.remove('c-now')));
}
const enfAll = () => $$('.c-enf').forEach((r) => enfLayout(r, true));

function setupArches() {
  const open = (a: HTMLElement) => {
    const row = a.closest<HTMLElement>('.c-enf');
    if (!row) return;
    $$('.c-arch', row).forEach((x) => x.classList.toggle('on', x === a));
    if (row.classList.contains('c-abs')) enfLayout(row, false);
  };
  document.addEventListener('mouseover', (e) => {
    const a = (e.target as Element).closest<HTMLElement>('.c-arch');
    if (a && !a.classList.contains('on') && $('.c-enf.c-abs')) open(a);
  });
  document.addEventListener('focusin', (e) => {
    const a = (e.target as Element).closest<HTMLElement>('.c-arch');
    if (a) open(a);
  });
  let raf = 0;
  document.addEventListener('scroll', (e) => {
    const row = e.target as HTMLElement;
    if (!row.classList || !row.classList.contains('c-enf') || raf) return;
    raf = requestAnimationFrame(() => { raf = 0; railSync(row); });
  }, { passive: true, capture: true });
  // тёплый свет следует за курсором по открытой арке (только мышь)
  let lraf = 0;
  document.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse' || RM) return;
    const f = (e.target as Element).closest?.<HTMLElement>('.c-arch.on .c-frame');
    if (!f || lraf) return;
    lraf = requestAnimationFrame(() => {
      lraf = 0;
      const q = f.getBoundingClientRect();
      f.style.setProperty('--lx', ((e.clientX - q.left) / q.width * 100).toFixed(1) + '%');
      f.style.setProperty('--ly', ((e.clientY - q.top) / q.height * 100).toFixed(1) + '%');
    });
  }, { passive: true });
}

/* ---------- галерея «Наши работы»: сначала миниатюра, затем фото, затем деталь и подпись ---------- */
function setupGallery() {
  document.addEventListener('click', (e) => {
    const t = (e.target as Element).closest<HTMLElement>('.w-th');
    if (!t) return;
    const g = t.closest<HTMLElement>('[data-gallery]')!, k = t.dataset.k;
    $$('.w-th', g).forEach((b) => b.setAttribute('aria-pressed', b === t ? 'true' : 'false'));
    $$('.w-main .ph', g).forEach((p) => p.classList.toggle('on', p.dataset.k === k));
    let d: HTMLElement | null = null;
    $$('.w-detail .ph', g).forEach((p) => { const on = p.dataset.k === k; p.classList.toggle('on', on); if (on) d = p; });
    const dc = $('[data-wdcap]', g), c = $('[data-wcap]', g);
    setTimeout(() => {
      if (c) c.textContent = t.dataset.cap || '';
      if (d && dc) dc.textContent = (d as HTMLElement).dataset.dcap || '';
    }, RM ? 0 : 140);
  });
}

/* ---------- 3D: выбор планировки и отделки показывает готовый рендер этого сочетания,
   а «Создать самому в 3D» открывает настоящий конструктор с тем же выбором ---------- */
const LAY: Record<string, string> = { straight: 'Прямая кухня', corner: 'Угловая кухня', island: 'Кухня с островом' };
const FIN: Record<string, string> = { oak: 'светлый дуб', walnut: 'орех натуральный', ivory: 'слоновая кость', graphite: 'графит' };
type Layout = 'straight' | 'corner' | 'island';
type Finish = 'oak' | 'walnut' | 'ivory' | 'graphite';
function setupKit3D() {
  document.addEventListener('click', (e) => {
    const b = (e.target as Element).closest<HTMLElement>('[data-lay],[data-fin]');
    if (!b) return;
    const box = b.closest<HTMLElement>('[data-k3]')!;
    const attr = b.hasAttribute('data-lay') ? 'data-lay' : 'data-fin';
    $$(`[${attr}]`, box).forEach((x) => x.setAttribute('aria-pressed', x === b ? 'true' : 'false'));
    const lay = $<HTMLElement>('[data-lay][aria-pressed="true"]', box)!.dataset.lay as Layout;
    const fin = $<HTMLElement>('[data-fin][aria-pressed="true"]', box)!.dataset.fin as Finish;
    $$('[data-kview] .r', box).forEach((r) => r.classList.toggle('on', r.dataset.r === `${lay}-${fin}`));
    $('[data-kstate]', box)!.textContent = `${LAY[lay]}, ${FIN[fin]}`;
    const cta = $<HTMLAnchorElement>('[data-k3-cta]', box);
    if (cta) cta.href = createLink(base, 'kitchen', lay, fin);
  });
}

/* ---------- одноразовое появление ключевых фото: фото видно сразу, только «оседает» и получает тень ---------- */
function reveal() {
  if (RM || !('IntersectionObserver' in window)) return;
  $$('.pj-hero').forEach((h) => {
    const el = h.parentElement!;
    el.classList.add('pj-pre');
    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.remove('pj-pre')));
  });
  $$('.c-enf,.w-spread,.pj-fig.full').forEach((el) => {
    if (document.documentElement.classList.contains('cine') && !el.classList.contains('pj-fig')) return; // эксперимент: появление ведёт cine.ts
    if (el.getBoundingClientRect().top < innerHeight * 0.9) return;
    const pre = el.classList.contains('c-enf') ? 'c-pre' : el.classList.contains('w-spread') ? 'w-pre' : 'f-pre';
    const inn = pre === 'c-pre' ? 'c-in' : 'w-in';
    el.classList.add(pre);
    const io = new IntersectionObserver((es) => {
      if (!es.some((x) => x.isIntersecting)) return;
      io.disconnect();
      requestAnimationFrame(() => {
        el.classList.add(inn); el.classList.remove(pre);
        setTimeout(() => el.classList.remove(inn), 2400);
      });
    }, { threshold: 0.25 });
    io.observe(el);
  });
}

/* ---------- страница проекта: «Рис. N» прокручивает к рисунку и на секунду выделяет его ---------- */
function setupToc() {
  document.addEventListener('click', (e) => {
    const a = (e.target as Element).closest<HTMLAnchorElement>('.pj-toc a[href^="#fig"]');
    if (!a) return;
    const f = document.getElementById(a.getAttribute('href')!.slice(1));
    if (!f) return;
    e.preventDefault();
    f.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'center' });
    $$('.pj-fig.hl').forEach((x) => x.classList.remove('hl'));
    f.classList.add('hl');
    history.replaceState(null, '', a.getAttribute('href'));
    setTimeout(() => f.classList.remove('hl'), 1600);
  });
}

/* ---------- заявка: собирает сообщение и открывает WhatsApp салона; сайт ничего не отправляет сам ---------- */
function setupLead() {
  const form = $<HTMLFormElement>('#lead-form');
  if (!form) return;
  const err = $('#f-err', form)!;
  const tel = $<HTMLInputElement>('#f-tel', form)!, ok = $<HTMLInputElement>('#f-ok', form)!;
  const fail = (msg: string, el: HTMLElement) => { err.textContent = msg; err.hidden = false; el.focus(); };
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    err.hidden = true;
    const digits = tel.value.replace(/\D/g, '');
    if (digits.length < 10) return fail('Укажите телефон: на него менеджер перезвонит или напишет.', tel);
    if (!ok.checked) return fail('Отметьте согласие на обработку персональных данных.', ok);
    const name = ($<HTMLInputElement>('#f-name', form)!.value || '').trim();
    const msg = ($<HTMLTextAreaElement>('#f-msg', form)!.value || '').trim();
    const text = ['Здравствуйте! Заявка на расчёт мебели с сайта VERNISSAGE.', name && `Имя: ${name}`, `Телефон: ${tel.value.trim()}`, msg && `Что нужно: ${msg}`]
      .filter(Boolean).join('\n');
    const url = waLink(text);
    const w = window.open(url, '_blank', 'noopener');
    if (!w) location.href = url;
  });
}

setupBar();
setupArches();
setupGallery();
setupKit3D();
setupToc();
setupLead();
railAll();
enfAll();
reveal();
addEventListener('resize', () => { railAll(); enfAll(); });
document.fonts?.ready.then(enfAll);
