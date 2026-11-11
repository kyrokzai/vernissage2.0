/** Переключатель темы: тёмная по умолчанию, выбор запоминается; смена — круг, расходящийся от кнопки. */
export function initTheme() {
  const d = document, h = d.documentElement, btn = d.getElementById('theme-btn');
  if (!btn) return;
  const rm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const meta = d.querySelector('meta[name="theme-color"]');
  function paint(t: string) {
    h.setAttribute('data-theme', t);
    btn!.setAttribute('aria-pressed', t === 'light' ? 'true' : 'false');
    btn!.setAttribute('aria-label', t === 'light' ? 'Включить тёмную тему' : 'Включить светлую тему');
    meta?.setAttribute('content', t === 'light' ? '#F6F2EA' : '#0A0E0C');
    try { localStorage.setItem('vn_theme', t); } catch { /* приватный режим */ }
  }
  paint(h.getAttribute('data-theme') || 'dark');
  btn.addEventListener('click', () => {
    const next = h.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    const r = btn.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
    if (rm) { paint(next); return; }
    const doc = d as Document & { startViewTransition?: (cb: () => void) => unknown };
    if (doc.startViewTransition) {
      const mx = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
      h.style.setProperty('--vx', x + 'px'); h.style.setProperty('--vy', y + 'px'); h.style.setProperty('--vtmax', Math.ceil(mx) + 'px');
      doc.startViewTransition(() => paint(next));
    } else {
      h.classList.add('theming'); paint(next); setTimeout(() => h.classList.remove('theming'), 900);
    }
  });
}
