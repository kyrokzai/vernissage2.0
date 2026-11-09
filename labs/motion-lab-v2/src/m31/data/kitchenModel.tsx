import type { ReactNode } from "react";
import type { ElSpec } from "../sceneDriver";
import { DimH, DimV } from "../../scenes/kit";

/*
 * ДЕМОНСТРАЦИОННАЯ КУХНЯ M3.1. Единая система координат 1600 × 900, фронтальная камера ~1,5 м.
 * Размеры условные (4 200 × 2 700 мм) и не относятся к реальному проекту VERNISSAGE.
 * Каждый элемент нарисован в ФИНАЛЬНЫХ координатах; этап определяет только момент и ось монтажа.
 */
export const VIEW = { w: 1600, h: 900 };
export const G = { X0: 520, X1: 1500, TOP: 110, BOT: 630, NT: 300, NB: 440 };
const { X0, X1, TOP, BOT, NT, NB } = G;
const MW = (X1 - X0) / 6;
const IS = { x: 600, w: 680, top: 604, bot: 822 }; // остров
const mod = (i: number) => ({ x: X0 + i * MW + 2, w: MW - 4 });

export type ModelEl = ElSpec & { node: ReactNode };

/** Части фасадов: [модуль, y, высота, y ручки]. Модули 2 и 3 — ниша: верх навесной, низ напольный. */
const FACADES: [number, number, number, number][] = [];
/** Колонны 1 и 4 с проёмом под духовой шкаф (292–446): проём заложен в корпус с этапа «Конструкция». */
const OVEN = { y0: 292, y1: 446 };
const OVEN_MODULES = [1, 4];
for (let i = 0; i < 6; i++) {
  if (i === 2 || i === 3) FACADES.push([i, TOP, NT - TOP - 6, TOP + 110], [i, NB + 6, BOT - NB - 6, NB + 30]);
  else if (OVEN_MODULES.includes(i)) FACADES.push([i, TOP, OVEN.y0 - TOP - 4, 200], [i, OVEN.y1 + 2, BOT - OVEN.y1 - 2, 480]);
  else FACADES.push([i, TOP, 368 - TOP, 300], [i, 372, BOT - 372, 390]);
}

export function buildKitchen(U: (name: string) => string): { base: ReactNode; els: ModelEl[] } {
  const els: ModelEl[] = [];
  const add = (spec: ElSpec, node: ReactNode) => els.push({ ...spec, node });

  /* STAGE 0 — пустое помещение (неподвижная основа) */
  const base = (
    <g>
      <rect width="1600" height="650" fill={U("wall")} />
      <rect width="1600" height="120" fill={U("ceil")} />
      <rect x="70" y="92" width="340" height="516" fill="#2b241e" />
      <rect x="84" y="106" width="312" height="488" fill={U("sky")} />
    </g>
  );
  add({ id: "window-dusk", s: 5, m: "light", d: 0, u: 0.8 }, <rect x="84" y="106" width="312" height="488" fill={U("dusk")} opacity=".75" />);
  add({ id: "window-frame", s: 0, m: "light" }, (
    <g>
      <rect x="236" y="106" width="8" height="488" fill="#2b241e" />
      <rect x="84" y="350" width="312" height="6" fill="#2b241e" />
      <rect y="640" width="1600" height="260" fill={U("planks")} />
      <rect y="640" width="1600" height="260" fill={U("floorShade")} />
      <rect y="636" width="1600" height="6" fill="#d9d0c2" opacity=".55" />
    </g>
  ));
  add({ id: "daylight", s: 0, m: "light", out: 5, outTo: 0.15 }, <polygon points="84,640 396,640 1000,900 300,900" fill={U("beam")} />);

  /* STAGE 1 — конструкция: замеры, корпуса, каркас острова */
  add({ id: "dim-w", s: 1, d: 0, u: 0.45, m: "center", box: [X0 - 30, 40, X1 - X0 + 60, 64], out: 2 }, <DimH x1={X0} x2={X1} y={72} label="4 200 мм" k={0.85} />);
  add({ id: "dim-h", s: 1, d: 0.1, u: 0.45, m: "centerV", box: [1500, TOP - 20, 70, BOT - TOP + 40], out: 2 }, <DimV x={1530} y1={TOP} y2={BOT} label="2 700 мм" k={0.85} />);
  add({ id: "level", s: 1, d: 0.15, u: 0.4, m: "center", box: [0, 340, 1600, 46], out: 2 }, (
    <g>
      <line x1="40" x2="1560" y1="372" y2="372" stroke="#E9D3A8" strokeWidth="1.6" />
      <rect x="52" y="346" width="136" height="22" rx="3" fill="rgba(0,0,0,.66)" />
      <text x="60" y="362" fill="#E9D3A8" fontSize="15" fontFamily="Onest, sans-serif">лазерный уровень</text>
    </g>
  ));
  for (let i = 0; i < 6; i++) {
    const { x, w } = mod(i);
    const shelf = (y: number) => <line key={y} x1={x + 10} x2={x + w - 10} y1={y} y2={y} stroke="#a58c66" strokeWidth="3" />;
    const lowerOnly = i === 2 || i === 3;
    add({ id: `carcass-${i}`, s: 1, d: 0.2 + 0.05 * i, u: 0.4, m: "rise", k: 34 }, lowerOnly ? (
      <g><rect x={x} y={NB + 6} width={w} height={BOT - NB - 6} fill={U("birch")} stroke="#a58c66" strokeWidth="2" />{shelf(540)}</g>
    ) : (
      <g>
        <rect x={x} y={TOP} width={w} height={BOT - TOP} fill={U("birch")} stroke="#a58c66" strokeWidth="2" />
        {OVEN_MODULES.includes(i) ? (
          <>{shelf(200)}<rect x={x + 6} y={OVEN.y0} width={w - 12} height={OVEN.y1 - OVEN.y0} fill="#120c08" />{shelf(OVEN.y0 - 2)}{shelf(OVEN.y1 + 1)}{shelf(540)}</>
        ) : (
          <>{shelf(250)}{shelf(380)}{shelf(510)}</>
        )}
      </g>
    ));
  }
  add({ id: "niche-back", s: 1, d: 0.45, u: 0.35, m: "up", box: [X0 + 2 * MW, NT - 6, 2 * MW, NB - NT + 12] }, <rect x={X0 + 2 * MW} y={NT - 6} width={2 * MW} height={NB - NT + 12} fill="#2a1d14" />);
  add({ id: "wall-contact", s: 1, d: 0.35, u: 0.4, m: "contact" }, <rect x={X0} y={626} width={X1 - X0} height={16} fill={U("contact")} />);
  add({ id: "island-carcass", s: 1, d: 0.6, u: 0.4, m: "rise", k: 44 }, (
    <g>
      <rect x={IS.x} y={IS.top} width={IS.w} height={IS.bot - IS.top} fill={U("birch")} stroke="#a58c66" strokeWidth="2" />
      {[1, 2, 3].map((j) => <line key={j} x1={IS.x + (IS.w / 4) * j} x2={IS.x + (IS.w / 4) * j} y1={IS.top} y2={IS.bot} stroke="#a58c66" strokeWidth="3" />)}
    </g>
  ));
  add({ id: "island-contact", s: 1, d: 0.6, u: 0.4, m: "contact" }, <ellipse cx="940" cy="836" rx="430" ry="26" fill={U("shadow")} />);

  /* STAGE 2 — корпусная мебель: навесные модули и фасады */
  for (const i of [2, 3]) {
    const { x, w } = mod(i);
    add({ id: `upper-${i}`, s: 2, d: 0.05 * (i - 2), u: 0.35, m: "drop", k: 34 }, (
      <g>
        <rect x={x} y={TOP} width={w} height={NT - TOP - 6} fill={U("birch")} stroke="#a58c66" strokeWidth="2" />
        <line x1={x + 10} x2={x + w - 10} y1={205} y2={205} stroke="#a58c66" strokeWidth="3" />
      </g>
    ));
  }
  FACADES.forEach(([i, y, h], idx) => {
    const { x, w } = mod(i);
    add({ id: `facade-${idx}`, s: 2, d: 0.2 + 0.035 * idx, u: 0.38, m: i % 2 === 0 ? "left" : "right", k: 24 }, <rect x={x} y={y} width={w} height={h} fill={U("walnut")} />);
  });
  add({ id: "island-facade", s: 2, d: 0.7, u: 0.3, m: "ltr", box: [IS.x, IS.top, IS.w, IS.bot - IS.top] }, (
    <g>
      <rect x={IS.x} y={IS.top} width={IS.w} height={IS.bot - IS.top} fill={U("walnut")} />
      <rect x={IS.x} y={IS.top} width={IS.w} height={IS.bot - IS.top} fill={U("shadeR")} />
    </g>
  ));

  /* STAGE 3 — поверхности */
  add({ id: "backsplash", s: 3, d: 0, u: 0.45, m: "up", box: [X0 + 2 * MW, NT, 2 * MW, NB - NT] }, (
    <g>
      <rect x={X0 + 2 * MW + 2} y={NT} width={2 * MW - 4} height={NB - NT} fill={U("stone")} />
      <path d={`M${X0 + 2 * MW + 20} ${NT + 30} C ${X0 + 2.6 * MW} ${NT + 80}, ${X0 + 3.2 * MW} ${NT + 20}, ${X0 + 4 * MW - 10} ${NT + 110}`} stroke="#b9ae9f" strokeWidth="2" fill="none" opacity=".7" />
    </g>
  ));
  add({ id: "island-top", s: 3, d: 0.3, u: 0.45, m: "drop", k: 70 }, (
    <g>
      <polygon points={`${IS.x - 24},${IS.top - 4} ${IS.x + IS.w + 24},${IS.top - 4} ${IS.x + IS.w + 4},${IS.top - 30} ${IS.x - 4},${IS.top - 30}`} fill={U("stoneTop")} />
      <rect x={IS.x - 24} y={IS.top - 4} width={IS.w + 48} height="22" fill={U("stone")} />
    </g>
  ));
  add({ id: "top-contact", s: 3, d: 0.4, u: 0.4, m: "contact" }, <rect x={IS.x - 24} y={IS.top + 18} width={IS.w + 48} height="10" fill={U("contact")} />);
  add({ id: "waterfall-l", s: 3, d: 0.65, u: 0.3, m: "up", box: [IS.x - 24, IS.top + 18, 24, IS.bot - IS.top - 18] }, <rect x={IS.x - 24} y={IS.top + 18} width="24" height={IS.bot - IS.top - 18} fill={U("stone")} />);
  add({ id: "waterfall-r", s: 3, d: 0.7, u: 0.3, m: "up", box: [IS.x + IS.w, IS.top + 18, 24, IS.bot - IS.top - 18] }, <rect x={IS.x + IS.w} y={IS.top + 18} width="24" height={IS.bot - IS.top - 18} fill={U("stone")} />);
  add({ id: "niche-shelf", s: 3, d: 0.8, u: 0.2, m: "rise", k: 14 }, <rect x={X0 + 2 * MW + 6} y={NB - 2} width={2 * MW - 12} height="8" fill="#3a2a1e" />);

  /* STAGE 4 — детали: техника, фурнитура, освещение */
  OVEN_MODULES.forEach((mi, j) => {
    const { x, w } = mod(mi);
    add({ id: `oven-${mi}`, s: 4, d: 0.05 + 0.08 * j, u: 0.3, m: "rise", k: 12 }, (
      <g>
        <rect x={x + 10} y={296} width={w - 20} height={142} rx="3" fill={U("glass")} stroke="#3a3a3c" strokeWidth="2" />
        <rect x={x + 22} y={308} width={w - 44} height="4" fill={U("brass")} />
        <rect x={x + w / 2 - 22} y={322} width="44" height="12" rx="2" fill="#1f2a2a" />
        <rect x={x + w / 2 - 14} y={326} width="28" height="4" fill="#E9D3A8" opacity=".8" />
      </g>
    ));
  });
  add({ id: "cooktop", s: 4, d: 0.3, u: 0.25, m: "drop", k: 26 }, (
    <g>
      <polygon points="700,597 900,597 896,583 704,583" fill="#141416" />
      {[740, 800, 860].map((x) => <ellipse key={x} cx={x} cy={590} rx="16" ry="3.5" fill="none" stroke="#3b3b3e" strokeWidth="1.4" />)}
    </g>
  ));
  add({ id: "sink", s: 4, d: 0.36, u: 0.25, m: "drop", k: 26 }, (
    <g>
      <polygon points="1080,597 1200,597 1197,583 1083,583" fill="#9d978e" />
      <polygon points="1088,594 1192,594 1190,586 1090,586" fill="#5a5650" />
    </g>
  ));
  add({ id: "faucet", s: 4, d: 0.42, u: 0.25, m: "drop", k: 40 }, (
    <g>
      <path d="M1150 584 V532 Q1150 512 1130 512 H1118" stroke={U("brass")} strokeWidth="6" fill="none" strokeLinecap="round" />
      <rect x="1146" y="578" width="10" height="8" fill={U("brass")} />
    </g>
  ));
  FACADES.forEach(([i, , , hy], idx) => {
    const { x, w } = mod(i);
    const hx = i % 2 === 0 ? x + w - 16 : x + 12;
    add({ id: `handle-${idx}`, s: 4, d: 0.45 + 0.012 * idx, u: 0.18, m: i % 2 === 0 ? "left" : "right", k: 8 }, <rect x={hx} y={hy} width="4" height="70" fill={U("brass")} />);
  });

  // Вечерний свет финала лежит ПОД светильниками, чтобы их свечение оставалось читаемым
  add({ id: "evening", s: 5, d: 0, u: 0.7, m: "light" }, <rect width="1600" height="900" fill="#0b0805" opacity=".32" />);
  add({ id: "evening-warm", s: 5, d: 0, u: 0.7, m: "light" }, <rect width="1600" height="900" fill="#ff9e48" opacity=".1" style={{ mixBlendMode: "soft-light" }} />);

  add({ id: "niche-led", s: 4, d: 0.62, u: 0.2, m: "light" }, (
    <g>
      <rect x={X0 + 2 * MW + 4} y={NT} width={2 * MW - 8} height="140" fill={U("led")} />
      <rect x={X0 + 2 * MW + 4} y={NT - 2} width={2 * MW - 8} height="4" fill="#ffe7c2" />
    </g>
  ));
  [760, 940, 1120].forEach((x, i) => {
    add({ id: `pendant-${i}`, s: 4, d: 0.6 + 0.06 * i, u: 0.25, m: "drop", k: 90 }, (
      <g>
        <line x1={x} y1={0} x2={x} y2={432} stroke="#16100c" strokeWidth="2" />
        <path d={`M${x - 42} 454 Q${x} 412 ${x + 42} 454 Z`} fill={U("brass")} />
      </g>
    ));
    add({ id: `pendant-glow-${i}`, s: 4, d: 0.78 + 0.04 * i, u: 0.14, m: "light" }, (
      <g>
        <ellipse cx={x} cy={488} rx="120" ry="70" fill={U("glow")} opacity=".5" />
        <ellipse cx={x} cy={IS.top - 14} rx="90" ry="12" fill={U("pool")} />
      </g>
    ));
  });
  add({ id: "toe-led", s: 4, d: 0.85, u: 0.15, m: "light" }, (
    <g>
      <rect x={IS.x + 10} y={IS.bot - 4} width={IS.w - 20} height="3" fill="#ffe2b8" />
      <ellipse cx="940" cy={IS.bot + 18} rx="360" ry="16" fill={U("pool")} />
    </g>
  ));

  /* STAGE 5 — финал: стулья, детали, цветокоррекция */
  [790, 940, 1090].forEach((x, i) => {
    add({ id: `stool-contact-${i}`, s: 5, d: 0.1 + i * 0.08, u: 0.35, m: "contact" }, <ellipse cx={x} cy="870" rx="60" ry="10" fill={U("shadow")} />);
    add({ id: `stool-${i}`, s: 5, d: 0.1 + i * 0.08, u: 0.35, m: "drop", k: 30 }, (
      <g>
        <rect x={x - 38} y="700" width="76" height="14" rx="7" fill="#1b1511" />
        <rect x={x - 34} y="664" width="68" height="40" rx="10" fill={U("leather")} />
        <rect x={x - 3} y="714" width="6" height="150" fill="#1b1511" />
        <rect x={x - 30} y="824" width="60" height="4" rx="2" fill={U("brass")} />
      </g>
    ));
  });
  add({ id: "decor", s: 5, d: 0.35, u: 0.3, m: "rise", k: 10 }, (
    <g>
      <rect x={X0 + 2 * MW + 40} y={NB - 88} width="30" height="84" rx="6" fill="#cdc2b0" />
      <circle cx={X0 + 2 * MW + 112} cy={NB - 28} r="24" fill="#8c7a66" />
      <rect x={X0 + 3 * MW + 60} y={NB - 34} width="90" height="30" fill="#e0d6c6" />
      <rect x={X0 + 4 * MW - 70} y={NB - 100} width="34" height="96" fill="#3a2a1e" />
    </g>
  ));
  add({ id: "bowl", s: 5, d: 0.45, u: 0.25, m: "drop", k: 14 }, (
    <g>
      <ellipse cx="980" cy={IS.top - 22} rx="46" ry="8" fill="#d9cfbf" />
      <circle cx="968" cy={IS.top - 30} r="9" fill="#c98a3f" />
      <circle cx="988" cy={IS.top - 31} r="8" fill="#b7a24e" />
    </g>
  ));
  add({ id: "plant", s: 5, d: 0.5, u: 0.3, m: "rise", k: 20 }, (
    <g>
      <rect x="430" y="560" width="64" height="78" rx="6" fill="#3a332c" />
      {([[-26, -40, 34, 70], [8, -60, 30, 82], [30, -30, 28, 60]] as const).map(([dx, dy, rx, ry], j) => (
        <ellipse key={j} cx={462 + dx} cy={560 + dy} rx={rx / 2} ry={ry / 2} fill={["#4f5e3e", "#5d6c47", "#46553a"][j]} />
      ))}
    </g>
  ));
  add({ id: "grade", s: 5, d: 0.2, u: 0.7, m: "light" }, <rect width="1600" height="900" fill={U("vig")} />);

  return { base, els };
}

/** Финальный заголовок — HTML поверх сцены, управляется тем же драйвером. */
export const FINAL_TITLE_SPEC: ElSpec = { id: "final-title", s: 5, d: 0.5, u: 0.4, m: "rise", k: 18 };
