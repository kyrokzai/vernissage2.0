import type { ReactNode } from "react";
import { A, camera, useStage, useUrl, type V3 } from "./kit";
import { Defs } from "./Defs";

/*
 * ДЕМОНСТРАЦИОННЫЙ РЕСТОРАН. Камера от входа: высота 1,6 м, центральная перспектива.
 * Зал условно 8 × 12 × 3,6 м — не реальный проект VERNISSAGE.
 * Координаты в метрах: X — поперёк зала, Y — вверх, Z — глубина от камеры.
 */
const cam = camera(900, 800, 420, 1.6);
const { P, poly } = cam;
const W = 4, HH = 3.6, Z0 = 2, Z1 = 14;

type BoxP = { x0: number; x1: number; y0: number; y1: number; z0: number; z1: number; front: string; side?: string; cap?: string; outline?: boolean };
/** Параллелепипед: рисуются только видимые камере грани. */
function Box({ x0, x1, y0, y1, z0, z1, front, side, cap, outline }: BoxP) {
  const faces: { pts: V3[]; fill: string }[] = [];
  if (x1 < 0) faces.push({ pts: [[x1, y0, z0], [x1, y0, z1], [x1, y1, z1], [x1, y1, z0]], fill: side || front });
  if (x0 > 0) faces.push({ pts: [[x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]], fill: side || front });
  if (y1 < cam.h) faces.push({ pts: [[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]], fill: cap || front });
  if (y0 > cam.h) faces.push({ pts: [[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]], fill: cap || front });
  faces.push({ pts: [[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0]], fill: front });
  return (
    <g>
      {faces.map((f, i) =>
        outline
          ? <polygon key={i} className="ln" pathLength={1} points={poly(...f.pts)} fill="none" stroke="#E3C891" strokeWidth="1.6" />
          : <polygon key={i} points={poly(...f.pts)} fill={f.fill} />,
      )}
    </g>
  );
}
const Floorshadow = ({ x0, x1, z0, z1, U }: { x0: number; x1: number; z0: number; z1: number; U: (n: string) => string }) => (
  <polygon points={poly([x0 - 0.12, 0, z0 - 0.12], [x1 + 0.12, 0, z0 - 0.12], [x1 + 0.12, 0, z1 + 0.12], [x0 - 0.12, 0, z1 + 0.12])} fill={U("shadow")} opacity=".9" />
);
const sx = (x: number, y: number, z: number) => P(x, y, z)[0];
const sy = (x: number, y: number, z: number) => P(x, y, z)[1];

export const RESTAURANT_STAGES = [
  { title: "Бетонная коробка", text: "Колонны, коммуникации и дневной свет из витража." },
  { title: "Конструктив", text: "Каркас барной стойки, подиум и потолочные рамы." },
  { title: "Отделка", text: "Пол, стеновые панели, потолок и облицовка бара." },
  { title: "Мебель", text: "Банкетка, столы и стулья — рядами от дальних к ближним." },
  { title: "Освещение", text: "Подвесы над каждым столом и подсветка бара." },
  { title: "Готовый зал", text: "Сервировка, бутылки на баре и растения." },
];

function Pendant({ x, z, U }: { x: number; z: number; U: (n: string) => string }) {
  const [cx, cy] = P(x, 2.0, z);
  const r = 330 / z;
  return (
    <>
      <A s={4} d={0.1 + (14 - z) * 0.04} u={0.4} m="drop" k={420 / z}>
        <line x1={sx(x, HH, z)} y1={sy(x, HH, z)} x2={sx(x, 2.25, z)} y2={sy(x, 2.25, z)} stroke="#16100c" strokeWidth="1.5" />
        <Box x0={x - 0.17} x1={x + 0.17} y0={2.05} y1={2.25} z0={z - 0.17} z1={z + 0.17} front={U("brass")} cap="#ffe6c0" />
      </A>
      <A s={4} d={0.45 + (14 - z) * 0.03} u={0.3} m="light">
        <ellipse cx={cx} cy={cy} rx={r * 1.6} ry={r * 1.2} fill={U("glow")} opacity=".55" />
        <ellipse cx={cx} cy={sy(x, 0.76, z)} rx={r * 1.1} ry={r * 0.25} fill={U("pool")} />
      </A>
    </>
  );
}

export function Restaurant() {
  const U = useUrl();
  const t4 = useStage(4);
  const items: { z: number; node: ReactNode }[] = [];

  // Колонны
  for (const z of [6, 10]) for (const x of [-2, 2])
    items.push({ z: z - 0.2, node: <Box key={`c${x}${z}`} x0={x - 0.2} x1={x + 0.2} y0={0} y1={HH} z0={z - 0.2} z1={z + 0.2} front="#8a8781" side="#74716c" /> });

  // Задний бар (полки на левой стене)
  items.push({ z: 11.5, node: (
    <g key="backbar">
      <A s={1} d={0.5} u={0.5} m="draw" out={2}><Box outline x0={-4} x1={-3.75} y0={1.2} y1={2.9} z0={5.5} z1={10.5} front="" /></A>
      <A s={2} d={0.55} u={0.4} m="rtl" box={[sx(-4, 0, 5.5) - 10, sy(-4, 2.9, 5.5) - 10, sx(-4, 0, 10.5) - sx(-4, 0, 5.5) + 20, 400]}>
        <Box x0={-4} x1={-3.75} y0={1.2} y1={2.9} z0={5.5} z1={10.5} front={U("walnut")} side="#3d2616" />
        {[1.75, 2.3].map((y) => <polygon key={y} points={poly([-3.75, y, 5.5], [-3.75, y, 10.5], [-3.75, y + 0.04, 10.5], [-3.75, y + 0.04, 5.5])} fill={U("brass")} />)}
      </A>
      <A s={4} d={0.3} u={0.4} m="light">
        {[1.75, 2.3].map((y) => <polygon key={y} points={poly([-3.75, y + 0.04, 5.5], [-3.75, y + 0.04, 10.5], [-3.75, y + 0.4, 10.5], [-3.75, y + 0.4, 5.5])} fill={U("ledUp")} opacity=".6" />)}
      </A>
      <A s={5} d={0.2} u={0.5} m="rise" k={6}>
        {Array.from({ length: 16 }, (_, i) => {
          const z = 5.8 + i * 0.29, y = i % 2 ? 1.79 : 2.34;
          return <rect key={i} x={sx(-3.78, y, z) - 2} y={sy(-3.78, y + 0.32, z)} width={Math.max(2, 60 / z)} height={sy(-3.78, y, z) - sy(-3.78, y + 0.32, z)} fill={["#3f5a3a", "#7a2f25", "#c9b48f", "#2b3a4a"][i % 4]} />;
        })}
      </A>
    </g>
  ) });

  // Барная стойка
  items.push({ z: 11, node: (
    <g key="bar">
      <A s={1} d={0} u={0.5} m="draw" out={3}><Box outline x0={-3.4} x1={-2.6} y0={0} y1={1.1} z0={5} z1={11} front="" /></A>
      <A s={1} d={0.35} u={0.45} m="up" box={[0, sy(-3.4, 1.1, 5) - 10, 700, 400]}><Box x0={-3.4} x1={-2.6} y0={0} y1={1.1} z0={5} z1={11} front="#c7b593" cap="#d8c6a4" /></A>
      <A s={2} d={0.6} u={0.4} m="rtl" box={[0, sy(-3.4, 1.15, 5) - 10, sx(-2.6, 0, 11) + 10, 420]}>
        <Box x0={-3.4} x1={-2.6} y0={0} y1={1.05} z0={5} z1={11} front={U("fluted")} side={U("fluted")} />
        <Box x0={-3.45} x1={-2.5} y0={1.05} y1={1.12} z0={4.95} z1={11} front={U("stone")} cap={U("stoneTop")} />
      </A>
      <A s={4} d={0.2} u={0.4} m="light">
        <line x1={sx(-2.55, 0.06, 5)} y1={sy(-2.55, 0.06, 5)} x2={sx(-2.55, 0.06, 11)} y2={sy(-2.55, 0.06, 11)} stroke="#ffe2b8" strokeWidth="3" />
        <polygon points={poly([-2.55, 0, 5], [-1.6, 0, 5], [-1.6, 0, 11], [-2.55, 0, 11])} fill={U("pool")} />
      </A>
    </g>
  ) });

  // Барные стулья
  for (let z = 5.5; z <= 10.5; z += 1)
    items.push({ z: z - 0.15, node: (
      <g key={`st${z}`}>
        <A s={3} d={0.5 + (11 - z) * -0.02 + 0.1} u={0.4} m="contact"><Floorshadow x0={-2.45} x1={-2.15} z0={z - 0.15} z1={z + 0.15} U={U} /></A>
        <A s={3} d={0.6 - (11 - z) * 0.02} u={0.4} m="drop" k={300 / z}>
          <Box x0={-2.32} x1={-2.28} y0={0} y1={0.72} z0={z - 0.02} z1={z + 0.02} front="#1b1511" />
          <Box x0={-2.47} x1={-2.13} y0={0.72} y1={0.78} z0={z - 0.17} z1={z + 0.17} front={U("leather")} cap="#8a5136" />
        </A>
      </g>
    ) });

  // Банкетка вдоль правой стены
  items.push({ z: 13.5, node: (
    <g key="banq">
      <A s={3} d={0} u={0.45} m="contact"><Floorshadow x0={3.3} x1={4} z0={4} z1={13} U={U} /></A>
      <A s={3} d={0} u={0.45} m="rise" k={40}>
        <Box x0={3.85} x1={4} y0={0.45} y1={1.15} z0={4} z1={13} front={U("leather")} side={U("leather")} cap="#6b3f2b" />
        <Box x0={3.3} x1={4} y0={0} y1={0.45} z0={4} z1={13} front={U("leather")} side="#4a2a1c" cap="#7a4630" />
      </A>
    </g>
  ) });

  // Столы у банкетки и центральные столы
  const tables: [number, number][] = [[2.8, 11], [2.8, 9], [2.8, 7], [2.8, 5], [0, 12.5], [0, 9.5], [0, 6.5]];
  for (const [x, z] of tables) {
    const d = 0.15 + (14 - z) * 0.05;
    const chairs = x > 0 ? [x - 0.75] : [x - 0.8, x + 0.8];
    items.push({ z: z - 0.35, node: (
      <g key={`t${x}${z}`}>
        <A s={3} d={d} u={0.4} m="contact"><Floorshadow x0={x - 0.35} x1={x + 0.35} z0={z - 0.35} z1={z + 0.35} U={U} /></A>
        {chairs.map((cxp) => (
          <A key={cxp} s={3} d={d + 0.05} u={0.4} m="drop" k={300 / z}>
            <Box x0={cxp - 0.2} x1={cxp + 0.2} y0={0} y1={0.45} z0={z - 0.2} z1={z + 0.2} front="#2a211b" cap="#3a2e25" />
            <Box x0={cxp + (cxp < x ? -0.2 : 0.16)} x1={cxp + (cxp < x ? -0.16 : 0.2)} y0={0.45} y1={0.92} z0={z - 0.2} z1={z + 0.2} front="#2a211b" side="#3a2e25" />
          </A>
        ))}
        <A s={3} d={d} u={0.4} m="drop" k={340 / z}>
          <Box x0={x - 0.03} x1={x + 0.03} y0={0} y1={0.72} z0={z - 0.03} z1={z + 0.03} front="#16100c" />
          <Box x0={x - 0.35} x1={x + 0.35} y0={0.72} y1={0.76} z0={z - 0.35} z1={z + 0.35} front={U("stone")} cap={U("stoneTop")} />
        </A>
        <Pendant x={x} z={z} U={U} />
        <A s={5} d={0.1 + (14 - z) * 0.04} u={0.35} m="drop" k={80 / z}>
          {[-0.15, 0.15].map((o) => {
            const [px, py] = P(x + o, 0.765, z);
            return <ellipse key={o} cx={px} cy={py} rx={95 / z} ry={22 / z} fill="#efeae2" />;
          })}
          <rect x={sx(x, 0.76, z) - 4 / z * 6} y={sy(x, 0.95, z)} width={Math.max(2, 36 / z)} height={sy(x, 0.76, z) - sy(x, 0.95, z)} fill="#c9b48f" opacity=".85" />
        </A>
      </g>
    ) });
  }

  // Растения у колонн
  for (const [x, z] of [[-1.5, 9.6], [1.5, 5.6]] as [number, number][])
    items.push({ z: z - 0.25, node: (
      <A key={`pl${x}`} s={5} d={0.5} u={0.4} m="rise" k={160 / z}>
        <Box x0={x - 0.22} x1={x + 0.22} y0={0} y1={0.5} z0={z - 0.22} z1={z + 0.22} front="#3a332c" cap="#2a241f" />
        {[[-0.15, 1.0, 0.35], [0.1, 1.3, 0.4], [0.2, 0.9, 0.3]].map(([o, y, r], j) => {
          const [px, py] = P(x + o, y, z);
          return <ellipse key={j} cx={px} cy={py} rx={(r * 900) / z / 2.2} ry={(r * 900) / z / 1.6} fill={["#4f5e3e", "#5d6c47", "#46553a"][j]} />;
        })}
      </A>
    ) });

  items.sort((a, b) => b.z - a.z);
  const backRect = [P(-W, HH, Z1), P(W, 0, Z1)];

  return (
    <g>
      <Defs />
      {/* 0 — бетонная коробка */}
      <polygon points={poly([-W, HH, Z0], [W, HH, Z0], [W, HH, Z1], [-W, HH, Z1])} fill="#5c5955" />
      <polygon points={poly([-W, 0, Z0], [-W, HH, Z0], [-W, HH, Z1], [-W, 0, Z1])} fill="#7b7873" />
      <polygon points={poly([W, 0, Z0], [W, HH, Z0], [W, HH, Z1], [W, 0, Z1])} fill="#86837e" />
      <polygon points={poly([-W, 0, Z0], [W, 0, Z0], [W, 0, Z1], [-W, 0, Z1])} fill={U("screed")} />
      <rect x={backRect[0][0]} y={backRect[0][1]} width={backRect[1][0] - backRect[0][0]} height={backRect[1][1] - backRect[0][1]} fill="#8d8a85" />
      <polygon points={poly([-3.6, 0.3, Z1], [3.6, 0.3, Z1], [3.6, 3.3, Z1], [-3.6, 3.3, Z1])} fill={U("sky")} />
      <A s={4} m="light" d={0.05}><polygon points={poly([-3.6, 0.3, Z1], [3.6, 0.3, Z1], [3.6, 3.3, Z1], [-3.6, 3.3, Z1])} fill={U("dusk")} opacity=".85" /></A>
      {[-1.2, 1.2].map((x) => <polygon key={x} points={poly([x - 0.04, 0.3, Z1], [x + 0.04, 0.3, Z1], [x + 0.04, 3.3, Z1], [x - 0.04, 3.3, Z1])} fill="#2b2622" />)}
      <polygon points={poly([-3.6, 2.4, Z1], [3.6, 2.4, Z1], [3.6, 2.45, Z1], [-3.6, 2.45, Z1])} fill="#2b2622" />
      <polygon points={poly([-3.6, 0, Z1], [3.6, 0, Z1], [2.6, 0, 6], [-2.6, 0, 6])} fill={U("beamV")} opacity={0.7 * (1 - t4)} />
      {[-1, 1].map((x) => <polygon key={x} points={poly([x - 0.15, 3.35, 2.4], [x + 0.15, 3.35, 2.4], [x + 0.15, 3.35, Z1], [x - 0.15, 3.35, Z1])} fill="#4c4945" />)}

      {/* 1 — конструктив: подиум и потолочные рамы */}
      <A s={1} d={0.2} u={0.5} m="draw" out={2}><Box outline x0={1.6} x1={W} y0={0} y1={0.3} z0={8} z1={Z1} front="" /></A>
      <A s={1} d={0.5} u={0.4} m="up" box={[sx(1.6, 0, 8) - 10, sy(1.6, 0.3, 8) - 10, 700, 200]}><Box x0={1.6} x1={W} y0={0} y1={0.3} z0={8} z1={Z1} front="#5f5a53" cap="#6c665e" /></A>

      {/* 2 — отделка */}
      <A s={2} u={0.5} m="down" box={[0, sy(0, 0, Z1), 1600, 900 - sy(0, 0, Z1)]}>
        <polygon points={poly([-W, 0, Z0], [W, 0, Z0], [W, 0, Z1], [-W, 0, Z1])} fill="#a99883" />
        <polygon points={poly([-W, 0, Z0], [W, 0, Z0], [W, 0, Z1], [-W, 0, Z1])} fill={U("floorShade")} />
        {Array.from({ length: 24 }, (_, i) => -W + i * (2 * W / 24)).map((x) => <line key={x} x1={sx(x, 0, Z0)} y1={sy(x, 0, Z0)} x2={sx(x, 0, Z1)} y2={sy(x, 0, Z1)} stroke="#8e7e6b" strokeWidth="1" opacity=".5" />)}
      </A>
      <A s={2} d={0.15} u={0.5} m="ltr" box={[backRect[1][0], -480, 1600 - backRect[1][0], 1700]}>
        <polygon points={poly([W, 0, Z0], [W, HH, Z0], [W, HH, Z1], [W, 0, Z1])} fill={U("walnut")} />
        {Array.from({ length: 48 }, (_, i) => Z0 + i * 0.25).map((z) => <line key={z} x1={sx(W, 0, z)} y1={sy(W, 0, z)} x2={sx(W, HH, z)} y2={sy(W, HH, z)} stroke="#2e1c10" strokeWidth={Math.max(0.6, 6 / z)} />)}
        <polygon points={poly([W, 0, Z0], [W, HH, Z0], [W, HH, Z1], [W, 0, Z1])} fill={U("shadeR")} opacity=".5" />
      </A>
      <A s={2} d={0.3} u={0.5} m="rtl" box={[0, -480, backRect[0][0], 1700]}>
        <polygon points={poly([-W, 0, Z0], [-W, HH, Z0], [-W, HH, Z1], [-W, 0, Z1])} fill="#b4a690" />
        <polygon points={poly([-W, 0, Z0], [-W, HH, Z0], [-W, HH, Z1], [-W, 0, Z1])} fill={U("shadeL")} opacity=".6" />
      </A>
      <A s={2} d={0.45} u={0.45} m="up" box={[0, -480, 1600, sy(0, HH, Z1) + 480]}>
        <polygon points={poly([-W, HH, Z0], [W, HH, Z0], [W, HH, Z1], [-W, HH, Z1])} fill="#2c2723" />
        {Array.from({ length: 20 }, (_, i) => -W + 0.2 + i * 0.4).map((x) => <line key={x} x1={sx(x, HH, Z0)} y1={sy(x, HH, Z0)} x2={sx(x, HH, Z1)} y2={sy(x, HH, Z1)} stroke="#4a423b" strokeWidth="2" />)}
      </A>
      {[4, 6, 8, 10, 12].map((z) => (
        <g key={z}>
          <A s={1} d={0.25 + (14 - z) * 0.03} u={0.4} m="drop" k={300 / z}>
            <Box x0={-W} x1={W} y0={3.15} y1={3.3} z0={z} z1={z + 0.12} front="#24201c" cap="#1b1815" />
          </A>
        </g>
      ))}

      {/* 3–5 — предметы по глубине: от дальних к ближним */}
      {items.map((it) => it.node)}

      {/* 4 — вечерний свет поверх зала */}
      <A s={4} m="light" u={0.8}><rect width="1600" height="900" fill="#0b0805" opacity=".34" /></A>
      <A s={4} m="light" u={0.8}><rect width="1600" height="900" fill="#ff9e48" opacity=".1" style={{ mixBlendMode: "soft-light" }} /></A>
      {tables.map(([x, z]) => (
        <A key={`g${x}${z}`} s={4} d={0.5 + (14 - z) * 0.03} u={0.3} m="light">
          <ellipse cx={sx(x, 2.0, z)} cy={sy(x, 2.0, z)} rx={(330 / z) * 1.3} ry={(330 / z) * 0.9} fill={U("glow")} opacity=".5" />
        </A>
      ))}
      <A s={5} d={0.3} u={0.7} m="light"><rect width="1600" height="900" fill={U("vig")} /></A>
    </g>
  );
}
