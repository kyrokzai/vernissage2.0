/** Мобильное меню: полноэкранный тёмный слой, Esc и ссылки закрывают, фокус удерживается внутри. */
export function initMenu() {
  const d = document, h = d.documentElement;
  const btn = d.getElementById('menu-btn'), menu = d.getElementById('menu');
  if (!btn || !menu) return;
  const set = (open: boolean) => {
    if (open) { menu.hidden = false; requestAnimationFrame(() => menu.classList.add('on')); }
    else { menu.classList.remove('on'); setTimeout(() => { if (!menu.classList.contains('on')) menu.hidden = true; }, 450); }
    h.classList.toggle('menu-open', open);
    btn.setAttribute('aria-expanded', String(open));
    btn.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    if (open) setTimeout(() => menu.querySelector<HTMLElement>('a')?.focus({ preventScroll: true }), 60);
  };
  btn.addEventListener('click', () => set(btn.getAttribute('aria-expanded') !== 'true'));
  menu.addEventListener('click', (e) => { if ((e.target as HTMLElement).closest('a')) set(false); });
  d.addEventListener('keydown', (e) => {
    if (btn.getAttribute('aria-expanded') !== 'true') return;
    if (e.key === 'Escape') { set(false); btn.focus(); }
    if (e.key === 'Tab') {
      const f = [btn, ...menu.querySelectorAll<HTMLElement>('a')];
      const i = f.indexOf(d.activeElement as HTMLElement);
      if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
    }
  });
  matchMedia('(min-width:1160px)').addEventListener('change', (m) => { if (m.matches) set(false); });
}
