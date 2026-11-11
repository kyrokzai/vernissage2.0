/**
 * Отложенная загрузка фоновых фото: класс `lz` отключает background-image (см. ImageStyles.astro).
 * Снимаем его, когда элемент подходит к экрану. Группы (`.marq`, `.bt`, `.dw-stage`) загружаются целиком,
 * потому что их содержимое скрыто обрезкой или прозрачностью.
 */
export function initLazy() {
  const d = document;
  const GROUPS = '.marq, .bt, .dw-stage, .hero-card';
  const reveal = (el: Element) => {
    if (el.matches(GROUPS)) el.querySelectorAll('.lz').forEach((n) => n.classList.remove('lz'));
    el.classList.remove('lz');
  };
  if (!('IntersectionObserver' in window)) { d.querySelectorAll('.lz').forEach((n) => n.classList.remove('lz')); return; }
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) { reveal(e.target); io.unobserve(e.target); }
  }), { rootMargin: '120% 0px' });
  const groups = [...d.querySelectorAll(GROUPS)].filter((g) => g.querySelector('.lz'));
  groups.forEach((g) => io.observe(g));
  d.querySelectorAll('.lz').forEach((n) => { if (!groups.some((g) => g.contains(n))) io.observe(n); });
}
