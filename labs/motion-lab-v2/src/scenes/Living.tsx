import { A, useStage, useUrl } from "./kit";
import { Defs } from "./Defs";

/*
 * ДЕМОНСТРАЦИОННАЯ ГОСТИНАЯ. Камера по центру комнаты, взгляд на медиастену, окна справа.
 * Планировка условная и не относится к реальному проекту VERNISSAGE.
 */
const BW = { x0: 330, x1: 1270, y0: 120, y1: 640 }; // задняя стена
const lerp2 = (a: [number, number], b: [number, number], t: number): [number, number] => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
/** Точка на правой стене: u — от задней стены (0) к камере (1), v — от пола (0) к потолку (1). */
const R = (u: number, v: number) => {
  const b = lerp2([BW.x1, BW.y1], [1600, 1010], u), t = lerp2([BW.x1, BW.y0], [1600, -40], u);
  return lerp2(b, t, v);
};
/** Точка на полу: x — от левой стены (0) к правой (1), u — глубина. */
const F = (x: number, u: number): [number, number] => {
  const back = lerp2([BW.x0, BW.y1], [BW.x1, BW.y1], x), front = lerp2([0, 1010], [1600, 1010], x);
  return lerp2(back, front, u);
};
const pts = (...p: [number, number][]) => p.map((q) => q.map((n) => n.toFixed(1)).join(",")).join(" ");
const win = (u0: number, u1: number) => pts(R(u0, 0.06), R(u1, 0.06), R(u1, 0.94), R(u0, 0.94));

export const LIVING_STAGES = [
  { title: "Помещение", text: "Бетонные стены, черновая стяжка и оконные проёмы." },
  { title: "Архитектура", text: "Реечные панели, ниша, покрытие пола и скрытый карниз." },
  { title: "Корпусная мебель", text: "Медиаконсоль и встроенные стеллажи по обе стороны ниши." },
  { title: "Мягкая мебель", text: "Диван и кресло у окна." },
  { title: "Столы и ковёр", text: "Ковёр раскатывается от стены, столики встают на место." },
  { title: "Свет", text: "Подсветка карниза, стеллажей и торшер. Вечер за окном." },
  { title: "Готовая композиция", text: "Книги, керамика, искусство и растения." },
];

export function Living() {
  const U = useUrl();
  const t5 = useStage(5);
  const shelves = (x: number) => [190, 290, 390, 490].map((y) => <rect key={y} x={x + 8} y={y} width="164" height="6" fill="#3e2716" />);
  return (
    <g>
      <Defs />
      {/* 0 — помещение */}
      <polygon points={pts([0, -40], [1600, -40], [BW.x1, BW.y0], [BW.x0, BW.y0])} fill="#8e8a84" />
      <polygon points={pts([0, -40], [BW.x0, BW.y0], [BW.x0, BW.y1], [0, 1010])} fill="#7a766f" />
      <polygon points={pts([1600, -40], [BW.x1, BW.y0], [BW.x1, BW.y1], [1600, 1010])} fill="#86827b" />
      <rect x={BW.x0} y={BW.y0} width={BW.x1 - BW.x0} height={BW.y1 - BW.y0} fill={U("concrete")} />
      <polygon points={pts([BW.x0, BW.y1], [BW.x1, BW.y1], [1600, 1010], [0, 1010])} fill={U("screed")} />
      <polygon points={win(0.08, 0.42)} fill={U("sky")} />
      <polygon points={win(0.52, 0.9)} fill={U("sky")} />
      <A s={5} m="light" d={0.1}><polygon points={win(0.08, 0.42)} fill={U("dusk")} opacity=".8" /><polygon points={win(0.52, 0.9)} fill={U("dusk")} opacity=".8" /></A>
      <polygon points={pts(R(0.08, 0), R(0.42, 0), F(0.15, 0.55), F(0.45, 0.25))} fill={U("beamV")} opacity={0.6 * (1 - t5)} />

      {/* 1 — архитектура */}
      <A s={1} u={0.55} m="rtl" box={[0, BW.y1, 1600, 380]}>
        <polygon points={pts([BW.x0, BW.y1], [BW.x1, BW.y1], [1600, 1010], [0, 1010])} fill={U("planks")} />
        <polygon points={pts([BW.x0, BW.y1], [BW.x1, BW.y1], [1600, 1010], [0, 1010])} fill={U("floorShade")} />
      </A>
      <A s={1} d={0.05} u={0.4} m="draw">
        <polygon className="ln" pathLength={1} points={win(0.08, 0.42)} fill="none" stroke="#1b1714" strokeWidth="7" />
        <polygon className="ln" pathLength={1} points={win(0.52, 0.9)} fill="none" stroke="#1b1714" strokeWidth="7" />
      </A>
      <A s={1} d={0.2} u={0.6} m="up" box={[BW.x0, BW.y0, BW.x1 - BW.x0, BW.y1 - BW.y0]}>
        <rect x={BW.x0} y={BW.y0} width={BW.x1 - BW.x0} height={BW.y1 - BW.y0} fill="#2a1a10" />
        {Array.from({ length: 52 }, (_, i) => <rect key={i} x={BW.x0 + 2 + i * 18} y={BW.y0} width="12" height={BW.y1 - BW.y0} fill={U("walnut")} />)}
        <rect x="620" y="250" width="360" height="230" fill="#1a120c" />
        <rect x="620" y="250" width="360" height="12" fill="#000" opacity=".4" />
      </A>
      <A s={1} d={0.4} u={0.5} m="up" box={[0, -40, BW.x0, 1050]}>
        <polygon points={pts([0, -40], [BW.x0, BW.y0], [BW.x0, BW.y1], [0, 1010])} fill="#b7aa97" />
        <polygon points={pts([0, -40], [BW.x0, BW.y0], [BW.x0, BW.y1], [0, 1010])} fill={U("shadeL")} />
      </A>
      <A s={1} d={0.6} u={0.4} m="draw">
        <polyline className="ln" pathLength={1} points={pts([0, -10], [BW.x0 + 14, BW.y0 + 16], [BW.x1 - 14, BW.y0 + 16], [1600, -10])} fill="none" stroke="#2b241e" strokeWidth="4" />
      </A>

      {/* 2 — корпусная мебель */}
      {[360, 1060].map((x, i) => (
        <g key={x}>
          <A s={2} d={i * 0.15} u={0.5} m="rise" k={40}>
            <rect x={x} y="150" width="180" height="490" fill={U("walnut")} />
            <rect x={x + 8} y="158" width="164" height="474" fill="#24170e" />
            {shelves(x)}
          </A>
          <A s={2} d={i * 0.15} u={0.5} m="contact"><rect x={x - 6} y="636" width="192" height="12" fill={U("contact")} /></A>
        </g>
      ))}
      <A s={2} d={0.35} u={0.5} m="rise" k={30}>
        <rect x="570" y="540" width="460" height="86" fill={U("walnut")} />
        <rect x="570" y="540" width="460" height="86" fill={U("shadeR")} opacity=".6" />
        <rect x="570" y="536" width="460" height="5" fill={U("brass")} />
        {[685, 800, 915].map((x) => <line key={x} x1={x} x2={x} y1="544" y2="622" stroke="#2e1c10" strokeWidth="2" />)}
      </A>
      <A s={2} d={0.35} u={0.5} m="contact"><rect x="560" y="624" width="480" height="18" fill={U("contact")} /></A>

      {/* 3 — мягкая мебель */}
      <A s={3} d={0.35} u={0.5} m="contact"><ellipse cx="1240" cy="790" rx="130" ry="20" fill={U("shadow")} /></A>
      <A s={3} d={0.35} u={0.5} m="drop" k={40}>
        <rect x="1150" y="660" width="190" height="110" rx="22" fill="#8c7d6a" />
        <rect x="1250" y="610" width="96" height="150" rx="22" fill="#7a6c5b" />
        <rect x="1160" y="700" width="170" height="40" rx="14" fill="#9b8c79" />
      </A>
      <A s={3} d={0} u={0.5} m="drop" k={50}>
        <rect x="420" y="760" width="760" height="200" rx="46" fill={U("fabric")} />
        <rect x="440" y="736" width="720" height="70" rx="34" fill="#cfc5b5" />
        <rect x="420" y="760" width="760" height="200" rx="46" fill={U("shadeR")} opacity=".35" />
      </A>

      {/* 4 — ковёр и столы */}
      <A s={4} u={0.55} m="down" box={[380, 680, 840, 120]}>
        <polygon points={pts(F(0.25, 0.1), F(0.75, 0.1), F(0.8, 0.42), F(0.2, 0.42))} fill="#d3c8b6" />
        <polygon points={pts(F(0.27, 0.12), F(0.73, 0.12), F(0.77, 0.4), F(0.23, 0.4))} fill="none" stroke="#b6a891" strokeWidth="3" />
      </A>
      <A s={4} d={0.4} u={0.45} m="contact"><ellipse cx="800" cy="736" rx="140" ry="14" fill={U("shadow")} /></A>
      <A s={4} d={0.4} u={0.45} m="drop" k={34}>
        <rect x="760" y="704" width="80" height="30" fill="#2f2016" />
        <ellipse cx="800" cy="702" rx="130" ry="20" fill={U("stoneTop")} />
        <ellipse cx="800" cy="706" rx="130" ry="20" fill="none" stroke="#bdb3a5" strokeWidth="3" />
      </A>
      <A s={4} d={0.6} u={0.4} m="contact"><ellipse cx="1110" cy="742" rx="40" ry="8" fill={U("shadow")} /></A>
      <A s={4} d={0.6} u={0.4} m="drop" k={30}>
        <rect x="1094" y="690" width="32" height="50" fill="#2f2016" />
        <ellipse cx="1110" cy="690" rx="36" ry="8" fill={U("brass")} />
      </A>

      {/* 5 — свет */}
      <A s={5} m="light" u={0.8}><rect width="1600" height="900" fill="#0b0805" opacity=".32" /></A>
      <A s={5} d={0.15} u={0.5} m="light">
        <rect x={BW.x0} y={BW.y0 + 14} width={BW.x1 - BW.x0} height="120" fill={U("led")} opacity=".7" />
        <polyline points={pts([0, -10], [BW.x0 + 14, BW.y0 + 16], [BW.x1 - 14, BW.y0 + 16], [1600, -10])} fill="none" stroke="#ffe2b8" strokeWidth="3" />
        {[360, 1060].map((x) => [196, 296, 396, 496].map((y) => <rect key={`${x}${y}`} x={x + 8} y={y} width="164" height="40" fill={U("led")} opacity=".55" />))}
        <rect x="620" y="250" width="360" height="230" fill={U("ledUp")} opacity=".35" />
      </A>
      <A s={5} d={0.4} u={0.45} m="drop" k={70}>
        <line x1="1390" y1="790" x2="1390" y2="470" stroke="#16100c" strokeWidth="4" />
        <path d="M1360 470 h60 l-12 -46 h-36 z" fill="#e8dfcf" />
        <ellipse cx="1390" cy="792" rx="30" ry="6" fill="#16100c" />
      </A>
      <A s={5} d={0.65} u={0.35} m="light">
        <ellipse cx="1390" cy="470" rx="130" ry="110" fill={U("glow")} opacity=".55" />
        <ellipse cx="1300" cy="780" rx="150" ry="24" fill={U("pool")} />
      </A>

      {/* 6 — готовая композиция */}
      {[360, 1060].flatMap((x, si) => [190, 290, 390].map((y, r) => (
        <A key={`${x}-${y}`} s={6} d={0.05 + si * 0.1 + r * 0.06} u={0.35} m="rise" k={10}>
          {Array.from({ length: 6 }, (_, b) => (
            <rect key={b} x={x + 20 + b * 14 + (r % 2) * 40} y={y - 46 + (b % 3) * 4} width="11" height={46 - (b % 3) * 4} fill={["#8f3b2e", "#cfc4b2", "#3f4b3a", "#b08d57", "#e8e0d2", "#5a4a3c"][(b + r) % 6]} />
          ))}
          <ellipse cx={x + 140} cy={y - 14} rx="14" ry="16" fill="#cdbfa9" />
        </A>
      )))}
      <A s={6} d={0.3} u={0.45} m="drop" k={24}>
        <rect x="670" y="282" width="260" height="168" fill="#e9e1d3" />
        <rect x="686" y="298" width="228" height="136" fill="#c9b48f" />
        <path d="M686 400 Q760 330 820 380 T914 350 V434 H686 Z" fill="#7d6a52" />
      </A>
      <A s={6} d={0.45} u={0.35} m="rise" k={10}>
        <rect x="640" y="506" width="26" height="30" rx="8" fill="#e6ddcf" />
        <rect x="940" y="496" width="20" height="40" rx="6" fill="#3a2a1e" />
      </A>
      <A s={6} d={0.5} u={0.35} m="drop" k={12}>
        <rect x="520" y="748" width="90" height="40" rx="14" fill="#8a5136" />
        <rect x="990" y="748" width="90" height="40" rx="14" fill="#5d6c47" />
      </A>
      <A s={6} d={0.6} u={0.4} m="rise" k={20}>
        <rect x="270" y="700" width="70" height="90" rx="8" fill="#3a332c" />
        {[[-30, -60, 40, 110], [10, -90, 36, 140], [36, -50, 32, 90]].map(([dx, dy, rx, ry], j) => (
          <ellipse key={j} cx={305 + dx} cy={700 + dy} rx={rx / 2} ry={ry / 2} fill={["#4f5e3e", "#5d6c47", "#46553a"][j]} />
        ))}
      </A>
      <A s={6} d={0.3} u={0.7} m="light"><rect width="1600" height="900" fill={U("vig")} /></A>
    </g>
  );
}
