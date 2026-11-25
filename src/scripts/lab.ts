/**
 * Лаборатория мобильного первого экрана: видео, лента комнат, параллакс прокрутки.
 * Видео играет, только пока видно, и не играет при «уменьшить движение» или экономии трафика (остаётся постер).
 * Параллакс — GSAP ScrollTrigger, который загружает cine.ts; здесь только ждём его. Прокрутка родная.
 */
type G = any;
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const SAVE = !!(navigator as G).connection?.saveData;
const phone = () => matchMedia('(max-width: 700px)').matches;

// видео: только на экране
document.querySelectorAll<HTMLVideoElement>('[data-lab-video]').forEach((v) => {
  if (RM || SAVE) return;
  new IntersectionObserver((es) => {
    for (const e of es) { if (e.isIntersecting) v.play().catch(() => {}); else v.pause(); }
  }, { threshold: 0.15 }).observe(v);
});

// B: активная карточка и точки по горизонтальной прокрутке ленты
const rail = document.querySelector<HTMLElement>('[data-lab-rail]');
if (rail) {
  const cards = Array.from(rail.children) as HTMLElement[];
  const dots = Array.from(document.querySelectorAll<HTMLElement>('.lbx-dots i'));
  const io = new IntersectionObserver((es) => {
    for (const e of es) if (e.intersectionRatio > 0.6) {
      const i = cards.indexOf(e.target as HTMLElement);
      cards.forEach((c, k) => c.classList.toggle('on', k === i));
      dots.forEach((d, k) => d.classList.toggle('on', k === i));
    }
  }, { root: rail, threshold: [0.6] });
  cards.forEach((c) => io.observe(c));
}

function whenGsap() {
  return new Promise<G>((res) => {
    const t0 = performance.now();
    const tick = () => {
      if ((window as G).__cine && (window as G).gsap) return res((window as G).gsap);
      if (performance.now() - t0 > 15000) return;
      requestAnimationFrame(tick);
    };
    tick();
  });
}

if (!RM && phone()) whenGsap().then((g) => {
  const lab = document.querySelector<HTMLElement>('[data-lab]');
  if (!lab) return;
  const kind = lab.dataset.lab;
  const st = { trigger: lab, start: 'top top', end: 'bottom top', scrub: true };
  if (kind === 'a') {
    // арка на месте, «камера» внутри неё отстаёт от прокрутки и приближается; текст не наезжает на арку
    g.fromTo('.la-arch .lab-vid', { yPercent: 0, scale: 1.1 }, { yPercent: 14, scale: 1.22, ease: 'none', scrollTrigger: st });
    g.to('.la-tag', { yPercent: -60, opacity: 0, ease: 'none', scrollTrigger: { ...st, end: 'center top' } });
  } else if (kind === 'b') {
    g.to('.lbx-top', { y: -60, opacity: 0.25, ease: 'none', scrollTrigger: st });
    g.to('.lbx-rail', { y: -24, ease: 'none', scrollTrigger: st });
  } else if (kind === 'c') {
    // первый экран «прилипает»: прогресс — первая высота экрана прокрутки
    const sc = { trigger: document.documentElement, start: 0, end: () => lab.offsetHeight, scrub: true };
    g.to('.lc-txt', { y: -110, opacity: 0, ease: 'power1.in', scrollTrigger: sc });
    g.to('.lc-stage', { scale: 1.12, ease: 'none', scrollTrigger: sc });
    g.to('.lc-fg', { y: -220, x: 40, ease: 'none', scrollTrigger: sc });
    g.to('.lc .lh', { opacity: 0, ease: 'none', scrollTrigger: { ...sc, end: () => lab.offsetHeight * 0.5 } });
  }
});
