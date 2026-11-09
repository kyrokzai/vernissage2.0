import { memo, useMemo } from "react";
import { SceneProvider } from "../scenes/kit";
import { Defs } from "../scenes/Defs";
import { buildKitchen } from "./data/kitchenModel";
import type { ElSpec } from "./sceneDriver";
import type { Plate } from "./assetLoader";

const REVEAL = new Set(["up", "ltr", "center", "centerV"]);

/**
 * Демонстрационная векторная сцена. Рисуется ОДИН раз; дальше её меняет только SceneDriver.
 * Все элементы изначально скрыты (display:none) — драйвер выставляет состояние до первого кадра.
 */
export const KitchenStage = memo(function KitchenStage({ uid, viewBox, fit }: { uid: string; viewBox: string; fit: "meet" | "slice" }) {
  const model = useMemo(() => buildKitchen((n) => `url(#${uid}-${n})`), [uid]);
  return (
    <svg className="m31-svg" viewBox={viewBox} preserveAspectRatio={`xMidYMid ${fit}`} role="img" aria-label="Демонстрационная сцена: сборка кухни с островом">
      <SceneProvider value={{ p: 1, N: 2, hold: 0, reduced: false, uid }}>
        <Defs />
      </SceneProvider>
      {model.base}
      {model.els.map(({ node, ...spec }) => <El key={spec.id} spec={spec} uid={uid}>{node}</El>)}
    </svg>
  );
});

function El({ spec, uid, children }: { spec: ElSpec; uid: string; children: React.ReactNode }) {
  if (!REVEAL.has(spec.m)) return <g data-el={spec.id} style={{ display: "none" }}>{children}</g>;
  const [x, y, w, h] = spec.box || [0, 0, 1600, 900];
  const cid = `${uid}-clip-${spec.id}`;
  const edge = spec.m === "up" || spec.m === "ltr";
  return (
    <g data-el={spec.id} style={{ display: "none" }}>
      <clipPath id={cid}><rect data-clip x={x} y={y} width={0} height={0} /></clipPath>
      <g clipPath={`url(#${cid})`}>{children}</g>
      {edge && <rect data-edge x={x} y={y} width={spec.m === "up" ? w : 2} height={spec.m === "up" ? 2 : h} fill="#E3C891" opacity=".85" />}
    </g>
  );
}

/** Фото-режим: согласованные кадры этапов одной камеры, раскрываются маской снизу вверх (по ходу монтажа). */
export const PLATE_SPECS = (n: number): ElSpec[] => Array.from({ length: n - 1 }, (_, i) => ({ id: `plate-${i + 1}`, s: i + 1, d: 0, u: 1, m: "up" }));

export const PhotoPlates = memo(function PhotoPlates({ plates }: { plates: Plate[] }) {
  return (
    <div className="m31-plates" role="img" aria-label="Сборка кухни: фото-кадры этапов">
      {plates.map((p, i) => (
        <img key={i} data-el={i === 0 ? undefined : `plate-${i}`} src={p.src} srcSet={p.srcset} alt="" decoding="async" style={i === 0 ? undefined : { display: "none" }} />
      ))}
    </div>
  );
});
