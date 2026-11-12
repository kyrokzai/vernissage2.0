/**
 * Общие анимации страницы (порт референса на TypeScript):
 * бегущая лента, разбивка заголовков на слова, появление блоков (IntersectionObserver),
 * счётчики, подсветка под курсором, магнитные кнопки, свечение, наклон карточки,
 * выбор услуги для квиза и единый цикл прокрутки (прогресс, шапка, параллакс, карточки услуг, таймлайн).
 */
import { initLazy } from './lazy';

export function initCore() {
  const d = document, w = window, h = d.documentElement;
  const rmq = matchMedia('(prefers-reduced-motion: reduce)');
  let rm = rmq.matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const $ = <T extends Element = HTMLElement>(s: string, c: ParentNode = d) => [...c.querySelectorAll<T>(s)] as T[];

  /* 1. бесшовные ленты: дублируем содержимое, CSS сдвигает на -50% */
  $('[data-loop]').forEach((t) => {
    [...t.children].forEach((n) => {
      const c = n.cloneNode(true) as HTMLElement;
      c.setAttribute('aria-hidden', 'true'); c.removeAttribute('role'); c.removeAttribute('aria-label'); c.setAttribute('tabindex', '-1');
      t.appendChild(c);
    });
  });

  initLazy();

  /* 2. заголовки: каждое слово выезжает из-под маски */
  function split(root: Element) {
    let k = 0;
    (function walk(node: Node, inGt: boolean) {
      [...node.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          const frag = d.createDocumentFragment();
          (n.nodeValue || '').split(/(\s+)/).forEach((p) => {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(d.createTextNode(' ')); return; }
            const o = d.createElement('span'); o.className = 'w'; o.setAttribute('aria-hidden', 'true');
            const i = d.createElement('span'); i.className = 'wi' + (inGt ? ' gt' : ''); i.style.setProperty('--k', String(k++)); i.textContent = p;
            o.appendChild(i); frag.appendChild(o);
          });
          n.parentNode!.replaceChild(frag, n);
        } else if (n.nodeType === 1) {
          const el = n as Element;
          const g = el.classList.contains('gt');
          if (g) el.classList.remove('gt');
          walk(el, inGt || g);
        }
      });
    })(root, false);
  }
  $('[data-split]').forEach((el) => {
    el.setAttribute('aria-label', (el.textContent || '').replace(/\s+/g, ' ').trim());
    split(el);
  });

  /* 3. появление при прокрутке: тип анимации по селектору, задержка по номеру в ряду */
  ([
    ['.sec-head > .label, .sec-head > .lead, .sec-head > .btn', 'up'],
    ['.cmp > div', 'up'], ['.why', 'up'], ['.faq details', 'up'],
    ['.tl li', 'left'], ['.quiz-intro > .label, .quiz-intro > .lead, .quiz-bul', 'up'],
    ['.quiz', 'zoom'], ['.ct-grid > *', 'up'], ['.sv-txt > *', 'up'],
    ['.sv-ph', 'clip'], ['.bt', 'clip'], ['.pf .frame', 'clip'], ['.pf figcaption', 'left'], ['.cs .frame', 'clip'], ['.cs figcaption', 'left'],
    ['.marq', 'up'], ['.strip', 'up'], ['.pf-more', 'up'], ['.demo-note', 'up'],
  ] as const).forEach(([sel, kind]) => {
    $(sel).forEach((el) => {
      if (el.hasAttribute('data-r')) return;
      el.setAttribute('data-r', kind);
      const i = [...el.parentElement!.children].indexOf(el);
      el.style.setProperty('--d', (Math.min(i, 5) * 0.09).toFixed(2) + 's');
    });
  });
  const pending = new Set($('[data-r], [data-split]'));
  const show = (el: Element) => { el.classList.add('in'); pending.delete(el); io?.unobserve(el); };
  let io: IntersectionObserver | null = null;
  if ('IntersectionObserver' in w) {
    // блок проявляется, когда его верх поднялся выше 90% высоты окна
    io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting || e.boundingClientRect.bottom < 0) show(e.target); }),
      { rootMargin: '0px 0px -10% 0px' });
    pending.forEach((el) => io!.observe(el));
  } else pending.forEach(show);

  /* 4. счётчики */
  if ('IntersectionObserver' in w && !rm) {
    const co = new IntersectionObserver((es) => es.forEach((en) => {
      if (!en.isIntersecting) return;
      co.unobserve(en.target);
      const el = en.target as HTMLElement, to = Number(el.dataset.count), t0 = performance.now();
      el.textContent = '0';
      const f = (t: number) => {
        const p = Math.min(1, (t - t0) / 1600);
        el.textContent = String(Math.round(to * (1 - Math.pow(1 - p, 3))));
        if (p < 1) requestAnimationFrame(f);
      };
      requestAnimationFrame(f);
    }), { threshold: 0.6 });
    $('[data-count]').forEach((el) => co.observe(el));
  }

  /* 5. подсветка под курсором */
  $('.spot').forEach((el) => el.addEventListener('pointermove', (e) => {
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', e.clientX - r.left + 'px');
    el.style.setProperty('--my', e.clientY - r.top + 'px');
  }));

  /* 6. магнитные кнопки, свечение за курсором, наклон карточки (только мышь, без уменьшения движения) */
  if (fine && !rm) {
    $('.btn').forEach((b) => {
      b.addEventListener('pointermove', (e) => {
        const r = b.getBoundingClientRect();
        b.style.transform = `translate(${((e.clientX - r.left - r.width / 2) * 0.18).toFixed(1)}px,${((e.clientY - r.top - r.height / 2) * 0.3).toFixed(1)}px)`;
      });
      b.addEventListener('pointerleave', () => { b.style.transform = ''; });
    });
    const glow = d.getElementById('glow');
    if (glow) {
      let gx = innerWidth / 2, gy = innerHeight / 2, tx = gx, ty = gy, seen = false, run = false;
      const loop = () => {
        gx += (tx - gx) * 0.08; gy += (ty - gy) * 0.08;
        glow.style.transform = `translate3d(${gx.toFixed(1)}px,${gy.toFixed(1)}px,0)`;
        // цикл останавливается, когда свечение догнало курсор
        if (Math.abs(tx - gx) + Math.abs(ty - gy) > 0.5) requestAnimationFrame(loop); else run = false;
      };
      w.addEventListener('pointermove', (e) => {
        tx = e.clientX; ty = e.clientY;
        if (!seen) { seen = true; gx = tx; gy = ty; glow.classList.add('on'); }
        if (!run) { run = true; requestAnimationFrame(loop); }
      }, { passive: true });
    }
    const tilt = d.getElementById('tilt'), hero = d.querySelector<HTMLElement>('.hero');
    if (tilt && hero) {
      hero.addEventListener('pointermove', (e) => {
        const nx = e.clientX / innerWidth - 0.5, ny = e.clientY / innerHeight - 0.5;
        tilt.style.transform = `perspective(900px) rotateY(${(nx * 10).toFixed(2)}deg) rotateX(${(-ny * 10).toFixed(2)}deg)`;
      });
      hero.addEventListener('pointerleave', () => { tilt.style.transform = ''; });
    }
  }

  /* 7. ссылки, отмечающие услугу в квизе */
  $<HTMLAnchorElement>('a[data-pick]').forEach((a) => a.addEventListener('click', () => {
    d.dispatchEvent(new CustomEvent('vn:pick', { detail: { value: a.dataset.pick, text: a.dataset.pickText || a.textContent!.trim() } }));
  }));

  /* 8. единый цикл прокрутки */
  const bar = d.querySelector<HTMLElement>('.bar'), prog = d.querySelector<HTMLElement>('.progress');
  const pars = $('[data-par]'), stack = $('.sv'), tl = d.getElementById('tl'), tlw = tl?.parentElement, tlis = tl ? $('li', tl) : [];
  let ticking = false;
  function frame() {
    ticking = false;
    const y = scrollY, vh = innerHeight, max = h.scrollHeight - vh;
    if (pending.size && y >= max - 4) [...pending].forEach(show);
    if (prog) prog.style.transform = `scaleX(${(max > 0 ? y / max : 0).toFixed(4)})`;
    bar?.classList.toggle('scrolled', y > 40);
    if (rm) return;
    pars.forEach((el) => {
      const r = el.parentElement!.getBoundingClientRect();
      if (r.bottom < -300 || r.top > vh + 300) return;
      const c = r.top + r.height / 2 - vh / 2;
      el.style.transform = `translate3d(0,${(-c * parseFloat(el.dataset.par!)).toFixed(1)}px,0)`;
    });
    const wide = innerWidth > 860;
    stack.forEach((el, i) => {
      const nx = stack[i + 1];
      if (!nx || !wide) { el.style.transform = ''; el.style.removeProperty('--dim'); return; }
      const st = 96 + i * 22, nt = nx.getBoundingClientRect().top;
      const p = Math.max(0, Math.min(1, 1 - (nt - (st + 22)) / (el.offsetHeight * 0.9)));
      el.style.transform = `scale(${(1 - p * 0.05).toFixed(4)})`;
      // затемнение оверлеем вместо filter: brightness — дешевле для Safari
      el.style.setProperty('--dim', (p * 0.5).toFixed(3));
    });
    if (tl && tlw) {
      const tr = tl.getBoundingClientRect();
      tlw.style.setProperty('--p', Math.max(0, Math.min(1, (vh * 0.62 - tr.top) / tr.height)).toFixed(3));
      tlis.forEach((li) => li.classList.toggle('on', li.getBoundingClientRect().top < vh * 0.62));
    }
  }
  const req = () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } };
  w.addEventListener('scroll', req, { passive: true });
  w.addEventListener('resize', req);
  rmq.addEventListener('change', () => { rm = rmq.matches; h.classList.toggle('rm', rm); if (rm) { pars.forEach((el) => (el.style.transform = '')); stack.forEach((el) => { el.style.transform = ''; el.style.removeProperty('--dim'); }); } req(); });
  frame();
}
