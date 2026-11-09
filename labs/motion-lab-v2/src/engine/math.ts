/* Чистые функции без зависимостей — переносятся в Astro как есть. */
export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const smoothstep = (x: number) => {
  const c = clamp(x);
  return c * c * (3 - 2 * c);
};

export type Ease = "cinema" | "settle" | "linear";
export const EASES: Record<Ease, [number, number, number, number]> = {
  cinema: [0.65, 0, 0.15, 1], // переходы между этапами, перемотка к этапу
  settle: [0.2, 0.7, 0.2, 1], // установка элемента: быстро подходит, мягко «садится» на место
  linear: [0, 0, 1, 1],
};

const cache = new Map<Ease, (x: number) => number>();
/** Решатель cubic-bezier: те же кривые, что в CSS. */
export function easeFn(e: Ease) {
  const hit = cache.get(e);
  if (hit) return hit;
  const [x1, y1, x2, y2] = EASES[e];
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const sx = (t: number) => ((ax * t + bx) * t + cx) * t;
  const sy = (t: number) => ((ay * t + by) * t + cy) * t;
  const fn = (x: number) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let lo = 0, hi = 1, t = x;
    for (let i = 0; i < 24; i++) {
      const v = sx(t);
      if (Math.abs(v - x) < 1e-5) break;
      if (v < x) lo = t; else hi = t;
      t = (lo + hi) / 2;
    }
    return sy(t);
  };
  cache.set(e, fn);
  return fn;
}

/**
 * Прогресс перехода к этапу s (1..N-1) по общему прогрессу p (0..1).
 * hold — доля каждого сегмента, на которой этап стоит неподвижно (поровну до и после).
 * В режиме уменьшенного движения этапы переключаются мгновенно.
 */
export function stageT(p: number, N: number, hold: number, s: number, reduced: boolean) {
  const x = clamp(p) * (N - 1) - (s - 1);
  if (reduced) return x >= 0.5 ? 1 : 0;
  const h = Math.min(Math.max(hold, 0), 0.9);
  return clamp((x - h / 2) / (1 - h));
}
export const currentStage = (p: number, N: number) => Math.round(clamp(p) * (N - 1));
export const stageProgress = (k: number, N: number) => (N <= 1 ? 0 : k / (N - 1));
