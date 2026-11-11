/** Карточка первого экрана: клик, Enter/Пробел или таймер (полоска в точках) листают объекты. */
export function initHeroCard() {
  const card = document.getElementById('hcard');
  if (!card) return;
  const sl = [...card.querySelectorAll<HTMLElement>('.slide')];
  const dots = [...card.querySelectorAll<HTMLElement>('.hc-dots i')];
  const L = document.getElementById('hc-l')!, T = document.getElementById('hc-t')!;
  let cur = 0, busy = false;
  // следующий кадр подгружаем заранее
  const warm = (n: number) => sl[n]?.classList.remove('lz');
  warm(1);
  function go(n: number) {
    if (busy || n === cur) return; busy = true;
    const from = sl[cur], to = sl[n];
    warm(n); warm((n + 1) % sl.length);
    sl.forEach((x) => x.classList.remove('prev'));
    from.classList.remove('on'); from.classList.add('prev'); to.classList.add('on');
    card!.classList.add('swap');
    setTimeout(() => { L.textContent = to.dataset.l || ''; T.textContent = to.dataset.t || ''; card!.classList.remove('swap'); }, 380);
    dots[cur].classList.remove('on'); void dots[n].offsetWidth; dots[n].classList.add('on');
    cur = n;
    setTimeout(() => { from.classList.remove('prev'); busy = false; }, 1150);
  }
  const next = () => go((cur + 1) % sl.length);
  card.addEventListener('click', next);
  card.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); next(); } });
  dots.forEach((dt) => dt.addEventListener('animationend', () => { if (dt.classList.contains('on')) next(); }));
}
