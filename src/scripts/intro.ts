/** Вступление «двери»: открывается колесом, свайпом, клавишами или кнопками; снимает блокировку прокрутки. */
export function initIntro() {
  const d = document, h = d.documentElement, el = d.getElementById('intro');
  if (!el) return;
  if (!h.classList.contains('lock')) { el.remove(); return; }
  const rm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let done = false, ty: number | null = null;
  const unlock = () => { h.classList.remove('lock'); d.dispatchEvent(new CustomEvent('vn:entered')); };
  function enter(sel: string) {
    if (done) return; done = true;
    el!.classList.add('open');
    const t = sel ? d.querySelector(sel) : null;
    if (t) { unlock(); t.scrollIntoView({ behavior: 'instant' as ScrollBehavior, block: 'start' }); }
    else setTimeout(unlock, rm ? 0 : 750);
    setTimeout(() => { if (h.classList.contains('lock')) unlock(); el!.remove(); }, rm ? 30 : 2300);
  }
  el.querySelectorAll<HTMLElement>('[data-go]').forEach((b) =>
    b.addEventListener('click', (e) => { e.preventDefault(); enter(b.getAttribute('data-go') || ''); }));
  addEventListener('wheel', (e) => { if (!done && e.deltaY > 6) enter(''); }, { passive: true });
  addEventListener('touchstart', (e) => { ty = e.touches[0].clientY; }, { passive: true });
  addEventListener('touchmove', (e) => { if (!done && ty !== null && ty - e.touches[0].clientY > 24) enter(''); }, { passive: true });
  addEventListener('keydown', (e) => {
    if (done) return;
    if (['ArrowDown', 'PageDown', ' ', 'End', 'Enter'].includes(e.key) && !(e.target as HTMLElement).closest('a,button')) { e.preventDefault(); enter(''); }
  });
  // фокус внутри диалога: начинаем с главной кнопки
  el.tabIndex = -1;
  requestAnimationFrame(() => el.focus({ preventScroll: true }));
}
