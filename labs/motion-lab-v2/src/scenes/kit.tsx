import { createContext, useContext, useId, type ReactNode } from "react";
import { clamp, easeFn, smoothstep, stageT } from "../engine/math";

/* ───────── Контекст сцены: прогресс и настройки ───────── */
export type SceneCtx = { p: number; N: number; hold: number; reduced: boolean; uid: string };
const Ctx = createContext<SceneCtx>({ p: 1, N: 2, hold: 0.3, reduced: false, uid: "s" });
export const SceneProvider = Ctx.Provider;
export const useScene = () => useContext(Ctx);
export function useStage(s: number) {
  const c = useContext(Ctx);
  return stageT(c.p, c.N, c.hold, s, c.reduced);
}
/** Ссылка на общий градиент или узор сцены с уникальным префиксом (две копии сцены в режиме «До / После»). */
export function useUrl() {
  const { uid } = useContext(Ctx);
  return (name: string) => `url(#${uid}-${name})`;
}

const settle = easeFn("settle");
/** Локальный прогресс элемента. Длительность обрезается так, чтобы движение всегда завершалось к концу этапа (d + u ≤ 1). */
const local = (t: number, d: number, u: number) => {
  const dd = clamp(d, 0, 0.98);
  const uu = Math.max(0.02, Math.min(u, 1 - dd));
  return settle(clamp((t - dd) / uu));
};

/*
 * Способы монтажа. Элемент всегда нарисован в своих ФИНАЛЬНЫХ координатах:
 * rise / drop / left / right — короткий подход по оси монтажа (без масштабирования);
 * up / down / ltr / rtl — раскрытие в направлении монтажа (отделка, панели, покрытия), с кромкой;
 * draw — прорисовка линий (замеры, разметка, конструктив);
 * light — свет и световые пятна; contact — тень, появляющаяся в момент касания.
 */
export type Motion = "rise" | "drop" | "left" | "right" | "up" | "down" | "ltr" | "rtl" | "draw" | "light" | "contact";

type AProps = {
  s: number; // этап, на котором элемент появляется
  d?: number; // задержка внутри перехода (0..1)
  u?: number; // длительность внутри перехода (0..1)
  m?: Motion;
  k?: number; // ход по оси монтажа, в единицах сцены
  box?: [number, number, number, number]; // область раскрытия для up/down/ltr/rtl
  out?: number; // этап, на котором элемент уходит (например, замеры гаснут при фасадах)
  edge?: boolean; // показывать кромку раскрытия
  children: ReactNode;
};

export function A({ s, d = 0, u = 1, m = "rise", k = 36, box, out, edge = true, children }: AProps) {
  const t = useStage(s);
  const tOut = useStage(out ?? 99);
  const rid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const { uid } = useScene();
  const e = local(t, d, u);
  const o = out ? 1 - smoothstep(tOut * 1.4) : 1;
  if (e <= 0.0005 || o <= 0.0005) return null;
  const op = Math.min(1, e * 2.4) * o;
  switch (m) {
    case "rise": return <g transform={`translate(0 ${k * (1 - e)})`} opacity={op}>{children}</g>;
    case "drop": return <g transform={`translate(0 ${-k * (1 - e)})`} opacity={op}>{children}</g>;
    case "left": return <g transform={`translate(${-k * (1 - e)} 0)`} opacity={op}>{children}</g>;
    case "right": return <g transform={`translate(${k * (1 - e)} 0)`} opacity={op}>{children}</g>;
    case "draw": return <g className="drw" style={{ ["--dr" as string]: 1 - e, opacity: o }}>{children}</g>;
    case "light": return <g opacity={e * o}>{children}</g>;
    case "contact": return <g opacity={smoothstep((e - 0.55) / 0.45) * o}>{children}</g>;
    default: {
      const [x, y, w, h] = box || [0, 0, 1600, 900];
      const r =
        m === "up" ? { x, y: y + h * (1 - e), w, h: h * e } :
        m === "down" ? { x, y, w, h: h * e } :
        m === "ltr" ? { x, y, w: w * e, h } :
        { x: x + w * (1 - e), y, w: w * e, h };
      const id = `${uid}-${rid}`;
      const showEdge = edge && e < 0.999;
      return (
        <g opacity={o}>
          <clipPath id={id}><rect x={r.x} y={r.y} width={Math.max(0, r.w)} height={Math.max(0, r.h)} /></clipPath>
          <g clipPath={`url(#${id})`}>{children}</g>
          {showEdge && (m === "up" || m === "down"
            ? <rect x={x} y={m === "up" ? r.y - 1 : r.y + r.h - 1} width={w} height={2} fill="#E3C891" opacity={0.85} />
            : <rect x={m === "ltr" ? r.x + r.w - 1 : r.x - 1} y={y} width={2} height={h} fill="#E3C891" opacity={0.85} />)}
        </g>
      );
    }
  }
}

/* ───────── Размерные линии (акцент A) ───────── */
export function DimH({ x1, x2, y, label, d = 1, k = 1 }: { x1: number; x2: number; y: number; label: string; d?: number; k?: number }) {
  const cx = (x1 + x2) / 2, half = ((x2 - x1) / 2) * d, tick = clamp((d - 0.8) / 0.2);
  const fs = 20 * k, lw = label.length * fs * 0.56 + 24 * k;
  return (
    <g stroke="#C9B48F" fill="none" strokeWidth={1.8 * k}>
      <line x1={cx - half} x2={cx + half} y1={y} y2={y} />
      <g opacity={tick}>
        <line x1={x1} x2={x1} y1={y - 13 * k} y2={y + 13 * k} />
        <line x1={x2} x2={x2} y1={y - 13 * k} y2={y + 13 * k} />
        <line x1={x1 - 7 * k} x2={x1 + 7 * k} y1={y + 7 * k} y2={y - 7 * k} />
        <line x1={x2 - 7 * k} x2={x2 + 7 * k} y1={y + 7 * k} y2={y - 7 * k} />
        <rect x={cx - lw / 2} y={y - fs * 0.85} width={lw} height={fs * 1.7} rx={3 * k} fill="rgba(0,0,0,.7)" stroke="none" />
        <text x={cx} y={y + fs * 0.36} textAnchor="middle" fill="#ECE6DA" stroke="none" fontSize={fs} fontFamily="Onest, system-ui, sans-serif">{label}</text>
      </g>
    </g>
  );
}
export function DimV({ x, y1, y2, label, d = 1, k = 1 }: { x: number; y1: number; y2: number; label: string; d?: number; k?: number }) {
  const cy = (y1 + y2) / 2, half = ((y2 - y1) / 2) * d, tick = clamp((d - 0.8) / 0.2);
  const fs = 20 * k, lw = label.length * fs * 0.56 + 24 * k;
  return (
    <g stroke="#C9B48F" fill="none" strokeWidth={1.8 * k}>
      <line x1={x} x2={x} y1={cy - half} y2={cy + half} />
      <g opacity={tick}>
        <line x1={x - 13 * k} x2={x + 13 * k} y1={y1} y2={y1} />
        <line x1={x - 13 * k} x2={x + 13 * k} y1={y2} y2={y2} />
        <line x1={x - 7 * k} x2={x + 7 * k} y1={y1 + 7 * k} y2={y1 - 7 * k} />
        <line x1={x - 7 * k} x2={x + 7 * k} y1={y2 + 7 * k} y2={y2 - 7 * k} />
        <g transform={`rotate(-90 ${x} ${cy})`}>
          <rect x={x - lw / 2} y={cy - fs * 0.85} width={lw} height={fs * 1.7} rx={3 * k} fill="rgba(0,0,0,.7)" stroke="none" />
          <text x={x} y={cy + fs * 0.36} textAnchor="middle" fill="#ECE6DA" stroke="none" fontSize={fs} fontFamily="Onest, system-ui, sans-serif">{label}</text>
        </g>
      </g>
    </g>
  );
}
/** Размерная линия с прорисовкой по этапу. */
export function Measure({ s, d = 0, u = 0.7, out, children }: { s: number; d?: number; u?: number; out?: number; children: (draw: number) => ReactNode }) {
  const t = useStage(s);
  const tOut = useStage(out ?? 99);
  const e = local(t, d, u);
  const o = out ? 1 - smoothstep(tOut * 1.4) : 1;
  if (e <= 0.0005 || o <= 0.0005) return null;
  return <g opacity={Math.min(1, e * 3) * o}>{children(e)}</g>;
}

/* ───────── Перспектива (для гостиной и ресторана) ───────── */
export type V3 = [number, number, number];
export function camera(f: number, cx: number, cy: number, h: number) {
  const P = (X: number, Y: number, Z: number): [number, number] => [cx + (f * X) / Z, cy - (f * (Y - h)) / Z];
  const poly = (...pts: V3[]) => pts.map((q) => P(...q).map((n) => n.toFixed(1)).join(",")).join(" ");
  return { P, poly, h };
}
