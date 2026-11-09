import { A, DimH, DimV, Measure, useStage, useUrl } from "./kit";
import { Defs } from "./Defs";

/*
 * ДЕМОНСТРАЦИОННАЯ КУХНЯ. Фронтальная камера, высота ~1,5 м.
 * Размеры условные (4 200 × 2 700 мм) и не относятся к реальному проекту VERNISSAGE.
 * Все элементы нарисованы в финальных координатах — между этапами геометрия не меняется.
 */
const X0 = 520, X1 = 1500, MW = (X1 - X0) / 6, TOP = 110, BOT = 630, NT = 300, NB = 440;
const IS = { x: 600, w: 680, top: 604, bot: 822 }; // остров
const mod = (i: number) => ({ x: X0 + i * MW + 2, w: MW - 4 });

export const KITCHEN_STAGES = [
  { title: "Пустое помещение", text: "Стены, пол и окно. Отсюда начинается каждый проект." },
  { title: "Замеры", text: "Размеры ниши, уровень и выводы коммуникаций. Размеры демонстрационные." },
  { title: "Корпуса", text: "Модули встают по чертежу слева направо, затем каркас острова." },
  { title: "Фасады", text: "Фасады навешиваются на корпуса, рисунок шпона идёт через всю стену." },
  { title: "Столешница", text: "Камень ложится на остров, фартук и полка ниши — на место." },
  { title: "Техника", text: "Шкафы-колонны получают духовые шкафы, остров — варочную панель и мойку." },
  { title: "Освещение", text: "Подсветка ниши, подвесы над островом и вечерний свет." },
  { title: "Готовый интерьер", text: "Стулья, детали и финальная цветокоррекция." },
];

export function Kitchen() {
  const U = useUrl();
  const t6 = useStage(6);
  return (
    <g>
      <Defs />
      {/* 0 — пустое помещение */}
      <rect width="1600" height="650" fill={U("wall")} />
      <rect width="1600" height="120" fill={U("ceil")} />
      <rect x="70" y="92" width="340" height="516" fill="#2b241e" />
      <rect x="84" y="106" width="312" height="488" fill={U("sky")} />
      <A s={6} m="light" d={0.1}><rect x="84" y="106" width="312" height="488" fill={U("dusk")} opacity=".75" /></A>
      <rect x="236" y="106" width="8" height="488" fill="#2b241e" />
      <rect x="84" y="350" width="312" height="6" fill="#2b241e" />
      <rect y="640" width="1600" height="260" fill={U("planks")} />
      <rect y="640" width="1600" height="260" fill={U("floorShade")} />
      <polygon points="84,640 396,640 1000,900 300,900" fill={U("beam")} opacity={1 - t6 * 0.8} />
      <rect y="636" width="1600" height="6" fill="#d9d0c2" opacity=".55" />

      {/* 1 — замеры */}
      <Measure s={1} u={0.6} out={3}>{(d) => <DimH x1={X0} x2={X1} y={72} label="4 200 мм" d={d} k={0.85} />}</Measure>
      <Measure s={1} d={0.15} u={0.6} out={3}>{(d) => <DimV x={1530} y1={TOP} y2={BOT} label="2 700 мм" d={d} k={0.85} />}</Measure>
      <A s={1} d={0.3} u={0.5} m="draw" out={3}>
        <line className="ln" pathLength={1} x1="40" x2="1580" y1="372" y2="372" stroke="#E9D3A8" strokeWidth="1.6" />
      </A>
      <A s={1} d={0.55} u={0.4} m="light" out={3}>
        <text x="60" y="362" fill="#E9D3A8" fontSize="15" fontFamily="Onest, sans-serif">лазерный уровень</text>
        {[[700, 560, "220 В"], [1320, 560, "220 В"], [1010, 548, "вода"]].map(([x, y, l]) => (
          <g key={`${x}`}>
            <circle cx={x} cy={y} r="9" fill="none" stroke="#E9D3A8" strokeWidth="1.6" />
            <path d={`M${+x - 5} ${y}h10M${x} ${+y - 5}v10`} stroke="#E9D3A8" strokeWidth="1.4" />
            <text x={+x + 16} y={+y + 5} fill="#ECE6DA" fontSize="14" fontFamily="Onest, sans-serif">{l}</text>
          </g>
        ))}
      </A>
      <A s={1} d={0.4} u={0.6} m="draw" out={4}>
        <polygon className="ln" pathLength={1} points={`${IS.x},${IS.bot + 6} ${IS.x + IS.w},${IS.bot + 6} ${IS.x + IS.w + 26},${IS.bot + 40} ${IS.x - 26},${IS.bot + 40}`} fill="none" stroke="#E9D3A8" strokeWidth="1.6" />
      </A>

      {/* 2 — корпуса: напольные колонны поднимаются, навесные модули ниши опускаются */}
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const { x, w } = mod(i);
        const shelf = (y: number) => <line key={y} x1={x + 10} x2={x + w - 10} y1={y} y2={y} stroke="#a58c66" strokeWidth="3" />;
        if (i === 2 || i === 3)
          return (
            <g key={i}>
              <A s={2} d={0.06 * i} u={0.45} m="drop" k={34}>
                <rect x={x} y={TOP} width={w} height={NT - TOP - 6} fill={U("birch")} stroke="#a58c66" strokeWidth="2" />{shelf(205)}
              </A>
              <A s={2} d={0.06 * i + 0.04} u={0.45} m="rise" k={34}>
                <rect x={x} y={NB + 6} width={w} height={BOT - NB - 6} fill={U("birch")} stroke="#a58c66" strokeWidth="2" />{shelf(540)}
              </A>
            </g>
          );
        return (
          <A key={i} s={2} d={0.06 * i} u={0.45} m="rise" k={34}>
            <rect x={x} y={TOP} width={w} height={BOT - TOP} fill={U("birch")} stroke="#a58c66" strokeWidth="2" />
            {shelf(250)}{shelf(380)}{shelf(510)}
          </A>
        );
      })}
      <A s={2} d={0.15} u={0.5} m="up" box={[X0 + 2 * MW, NT - 6, 2 * MW, NB - NT + 12]} edge={false}>
        <rect x={X0 + 2 * MW} y={NT - 6} width={2 * MW} height={NB - NT + 12} fill="#2a1d14" />
      </A>
      <A s={2} d={0.3} u={0.5} m="contact"><rect x={X0} y={626} width={X1 - X0} height={16} fill={U("contact")} /></A>
      <A s={2} d={0.5} u={0.5} m="rise" k={44}>
        <rect x={IS.x} y={IS.top} width={IS.w} height={IS.bot - IS.top} fill={U("birch")} stroke="#a58c66" strokeWidth="2" />
        {[1, 2, 3].map((j) => <line key={j} x1={IS.x + (IS.w / 4) * j} x2={IS.x + (IS.w / 4) * j} y1={IS.top} y2={IS.bot} stroke="#a58c66" strokeWidth="3" />)}
      </A>
      <A s={2} d={0.5} u={0.5} m="contact"><ellipse cx="940" cy="836" rx="430" ry="26" fill={U("shadow")} /></A>

      {/* 3 — фасады: навешиваются на корпуса со стороны петель */}
      {[0, 1, 2, 3, 4, 5].flatMap((i) => {
        const { x, w } = mod(i);
        const hx = i % 2 === 0 ? x + w - 16 : x + 12;
        const parts = i === 2 || i === 3 ? [[TOP, NT - TOP - 6, TOP + 110], [NB + 6, BOT - NB - 6, NB + 30]] : [[TOP, 368 - TOP, 300], [372, BOT - 372, 390]];
        return parts.map(([y, h, hy], j) => (
          <A key={`${i}-${j}`} s={3} d={0.05 * i + 0.03 * j} u={0.45} m={i % 2 === 0 ? "left" : "right"} k={26}>
            <rect x={x} y={y} width={w} height={h} fill={U("walnut")} />
            <rect x={hx} y={hy} width="4" height="70" fill={U("brass")} />
          </A>
        ));
      })}
      <A s={3} d={0.55} u={0.45} m="ltr" box={[IS.x, IS.top, IS.w, IS.bot - IS.top]}>
        <rect x={IS.x} y={IS.top} width={IS.w} height={IS.bot - IS.top} fill={U("walnut")} />
        <rect x={IS.x} y={IS.top} width={IS.w} height={IS.bot - IS.top} fill={U("shadeR")} />
      </A>

      {/* 4 — столешница и фартук */}
      <A s={4} d={0.05} u={0.5} m="up" box={[X0 + 2 * MW, NT, 2 * MW, NB - NT]}>
        <rect x={X0 + 2 * MW + 2} y={NT} width={2 * MW - 4} height={NB - NT} fill={U("stone")} />
        <path d={`M${X0 + 2 * MW + 20} ${NT + 30} C ${X0 + 2.6 * MW} ${NT + 80}, ${X0 + 3.2 * MW} ${NT + 20}, ${X0 + 4 * MW - 10} ${NT + 110}`} stroke="#b9ae9f" strokeWidth="2" fill="none" opacity=".7" />
      </A>
      <A s={4} d={0.35} u={0.5} m="drop" k={70}>
        <polygon points={`${IS.x - 24},${IS.top - 4} ${IS.x + IS.w + 24},${IS.top - 4} ${IS.x + IS.w + 4},${IS.top - 30} ${IS.x - 4},${IS.top - 30}`} fill={U("stoneTop")} />
        <rect x={IS.x - 24} y={IS.top - 4} width={IS.w + 48} height="22" fill={U("stone")} />
      </A>
      <A s={4} d={0.45} u={0.5} m="contact"><rect x={IS.x - 24} y={IS.top + 18} width={IS.w + 48} height="10" fill={U("contact")} /></A>
      <A s={4} d={0.7} u={0.3} m="rise" k={14}><rect x={X0 + 2 * MW + 6} y={NB - 2} width={2 * MW - 12} height="8" fill="#3a2a1e" /></A>

      {/* 5 — техника */}
      {[[1, 0], [4, 0.2]].map(([mi, dd]) => {
        const { x, w } = mod(mi);
        return (
          <g key={mi}>
            <A s={5} d={dd} u={0.3} m="light"><rect x={x + 6} y={292} width={w - 12} height={150} fill="#120c08" /></A>
            <A s={5} d={dd + 0.15} u={0.45} m="rise" k={12}>
              <rect x={x + 10} y={296} width={w - 20} height={142} rx="3" fill={U("glass")} stroke="#3a3a3c" strokeWidth="2" />
              <rect x={x + 22} y={308} width={w - 44} height="4" fill={U("brass")} />
              <rect x={x + w / 2 - 22} y={322} width="44" height="12" rx="2" fill="#1f2a2a" />
              <rect x={x + w / 2 - 14} y={326} width="28" height="4" fill="#E9D3A8" opacity=".8" />
            </A>
          </g>
        );
      })}
      <A s={5} d={0.5} u={0.4} m="drop" k={26}>
        <polygon points="700,597 900,597 896,583 704,583" fill="#141416" />
        {[740, 800, 860].map((x) => <ellipse key={x} cx={x} cy={590} rx="16" ry="3.5" fill="none" stroke="#3b3b3e" strokeWidth="1.4" />)}
      </A>
      <A s={5} d={0.62} u={0.4} m="drop" k={26}>
        <polygon points="1080,597 1200,597 1197,583 1083,583" fill="#9d978e" />
        <polygon points="1088,594 1192,594 1190,586 1090,586" fill="#5a5650" />
      </A>
      <A s={5} d={0.72} u={0.35} m="drop" k={40}>
        <path d="M1150 584 V532 Q1150 512 1130 512 H1118" stroke={U("brass")} strokeWidth="6" fill="none" strokeLinecap="round" />
        <rect x="1146" y="578" width="10" height="8" fill={U("brass")} />
      </A>

      {/* 6 — освещение */}
      <A s={6} m="light" u={0.8}><rect width="1600" height="900" fill="#0b0805" opacity=".3" /></A>
      <A s={6} m="light" u={0.8}><rect width="1600" height="900" fill="#ff9e48" opacity=".1" style={{ mixBlendMode: "soft-light" }} /></A>
      <A s={6} d={0.1} u={0.4} m="light">
        <rect x={X0 + 2 * MW + 4} y={NT} width={2 * MW - 8} height="140" fill={U("led")} />
        <rect x={X0 + 2 * MW + 4} y={NT - 2} width={2 * MW - 8} height="4" fill="#ffe7c2" />
      </A>
      {[760, 940, 1120].map((x, i) => (
        <g key={x}>
          <A s={6} d={0.2 + i * 0.1} u={0.4} m="drop" k={90}>
            <line x1={x} y1={0} x2={x} y2={432} stroke="#16100c" strokeWidth="2" />
            <path d={`M${x - 42} 454 Q${x} 412 ${x + 42} 454 Z`} fill={U("brass")} />
          </A>
          <A s={6} d={0.5 + i * 0.1} u={0.35} m="light">
            <ellipse cx={x} cy={488} rx="120" ry="70" fill={U("glow")} opacity=".5" />
            <ellipse cx={x} cy={IS.top - 14} rx="90" ry="12" fill={U("pool")} />
          </A>
        </g>
      ))}
      <A s={6} d={0.6} u={0.4} m="light">
        <rect x={IS.x + 10} y={IS.bot - 4} width={IS.w - 20} height="3" fill="#ffe2b8" />
        <ellipse cx="940" cy={IS.bot + 18} rx="360" ry="16" fill={U("pool")} />
      </A>

      {/* 7 — готовый интерьер */}
      {[790, 940, 1090].map((x, i) => (
        <g key={x}>
          <A s={7} d={0.05 + i * 0.1} u={0.45} m="contact"><ellipse cx={x} cy="870" rx="60" ry="10" fill={U("shadow")} /></A>
          <A s={7} d={0.05 + i * 0.1} u={0.45} m="drop" k={30}>
            <rect x={x - 38} y="700" width="76" height="14" rx="7" fill="#1b1511" />
            <rect x={x - 34} y="664" width="68" height="40" rx="10" fill={U("leather")} />
            <rect x={x - 3} y="714" width="6" height="150" fill="#1b1511" />
            <rect x={x - 30} y="824" width="60" height="4" rx="2" fill={U("brass")} />
          </A>
        </g>
      ))}
      <A s={7} d={0.4} u={0.4} m="rise" k={10}>
        <rect x={X0 + 2 * MW + 40} y={NB - 88} width="30" height="84" rx="6" fill="#cdc2b0" />
        <circle cx={X0 + 2 * MW + 112} cy={NB - 28} r="24" fill="#8c7a66" />
        <rect x={X0 + 3 * MW + 60} y={NB - 34} width="90" height="30" fill="#e0d6c6" />
        <rect x={X0 + 4 * MW - 70} y={NB - 100} width="34" height="96" fill="#3a2a1e" />
      </A>
      <A s={7} d={0.55} u={0.35} m="drop" k={14}>
        <ellipse cx="980" cy={IS.top - 22} rx="46" ry="8" fill="#d9cfbf" />
        <circle cx="968" cy={IS.top - 30} r="9" fill="#c98a3f" />
        <circle cx="988" cy={IS.top - 31} r="8" fill="#b7a24e" />
      </A>
      <A s={7} d={0.6} u={0.4} m="rise" k={20}>
        <rect x="430" y="560" width="64" height="78" rx="6" fill="#3a332c" />
        {[[-26, -40, 34, 70], [8, -60, 30, 82], [30, -30, 28, 60]].map(([dx, dy, rx, ry], j) => (
          <ellipse key={j} cx={462 + dx} cy={560 + dy} rx={rx / 2} ry={ry / 2} fill={["#4f5e3e", "#5d6c47", "#46553a"][j]} />
        ))}
      </A>
      <A s={7} d={0.3} u={0.7} m="light"><rect width="1600" height="900" fill={U("vig")} /></A>
    </g>
  );
}
