import { useScene } from "./kit";

/** Общие материалы демонстрационных сцен: шпон, камень, латунь, бетон, свет. */
export function Defs() {
  const { uid } = useScene();
  const i = (n: string) => `${uid}-${n}`;
  const lg = (id: string, x2: number, y2: number, stops: [number, string, number?][]) => (
    <linearGradient id={i(id)} x1="0" y1="0" x2={x2} y2={y2}>
      {stops.map(([o, c, a = 1], k) => <stop key={k} offset={o} stopColor={c} stopOpacity={a} />)}
    </linearGradient>
  );
  return (
    <defs>
      {lg("wall", 0, 1, [[0, "#bcb09e"], [1, "#8f8370"]])}
      {lg("wallDark", 0, 1, [[0, "#6f6a63"], [1, "#4e4a45"]])}
      {lg("concrete", 0, 1, [[0, "#8d8a85"], [1, "#6b6863"]])}
      {lg("ceil", 0, 1, [[0, "#000", 0.5], [1, "#000", 0]])}
      {lg("sky", 0, 1, [[0, "#f3f4f0"], [1, "#cbd3d1"]])}
      {lg("dusk", 0, 1, [[0, "#41506a"], [1, "#a77f63"]])}
      {lg("floorShade", 0, 1, [[0, "#000", 0.08], [1, "#000", 0.62]])}
      {lg("beam", 1, 1, [[0, "#fff6e6", 0.5], [1, "#fff6e6", 0]])}
      {lg("beamV", 0, 1, [[0, "#fff6e6", 0.42], [1, "#fff6e6", 0]])}
      {lg("stone", 0, 1, [[0, "#ece7dd"], [0.6, "#d8d0c3"], [1, "#c6bdaf"]])}
      {lg("stoneTop", 0, 1, [[0, "#d9d2c6"], [1, "#efeae2"]])}
      {lg("brass", 1, 1, [[0, "#6e5129"], [0.35, "#d6b47a"], [0.7, "#8a6a3a"], [1, "#e3c891"]])}
      {lg("glass", 0, 1, [[0, "#1d1d1f"], [0.5, "#0d0d0e"], [1, "#232325"]])}
      {lg("led", 0, 1, [[0, "#ffd9a3", 0.95], [1, "#ffd9a3", 0]])}
      {lg("ledUp", 0, 1, [[0, "#ffd9a3", 0], [1, "#ffd9a3", 0.9]])}
      {lg("shadeR", 1, 0, [[0, "#000", 0], [1, "#000", 0.45]])}
      {lg("shadeL", 1, 0, [[0, "#000", 0.45], [1, "#000", 0]])}
      {lg("fabric", 0, 1, [[0, "#c9bfaf"], [1, "#a99d8b"]])}
      {lg("leather", 0, 1, [[0, "#8a5136"], [1, "#5c3322"]])}
      {lg("contact", 0, 1, [[0, "#000", 0.55], [1, "#000", 0]])}
      <radialGradient id={i("glow")}><stop offset="0" stopColor="#ffd6a0" /><stop offset="1" stopColor="#ffd6a0" stopOpacity="0" /></radialGradient>
      <radialGradient id={i("pool")}><stop offset="0" stopColor="#ffe2b8" stopOpacity=".55" /><stop offset="1" stopColor="#ffe2b8" stopOpacity="0" /></radialGradient>
      <radialGradient id={i("shadow")}><stop offset="0" stopColor="#000" stopOpacity=".6" /><stop offset="1" stopColor="#000" stopOpacity="0" /></radialGradient>
      <radialGradient id={i("vig")} cx=".5" cy=".46" r=".78"><stop offset=".5" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity=".7" /></radialGradient>
      <pattern id={i("walnut")} width="26" height="900" patternUnits="userSpaceOnUse">
        <rect width="26" height="900" fill="#5b3a24" />
        <rect x="3" width="1" height="900" fill="#3d2616" opacity=".7" />
        <rect x="8" width="2" height="900" fill="#6f4a2f" opacity=".6" />
        <rect x="14" width="1" height="900" fill="#2e1c10" opacity=".55" />
        <rect x="20" width="2" height="900" fill="#76513a" opacity=".45" />
      </pattern>
      <pattern id={i("oak")} width="22" height="900" patternUnits="userSpaceOnUse">
        <rect width="22" height="900" fill="#a9845e" />
        <rect x="4" width="1" height="900" fill="#8b6845" opacity=".6" />
        <rect x="11" width="2" height="900" fill="#b9946d" opacity=".6" />
        <rect x="17" width="1" height="900" fill="#7d5c3c" opacity=".5" />
      </pattern>
      <pattern id={i("birch")} width="18" height="900" patternUnits="userSpaceOnUse">
        <rect width="18" height="900" fill="#d8c6a4" />
        <rect x="5" width="1" height="900" fill="#c5b08b" opacity=".6" />
        <rect x="12" width="1" height="900" fill="#e6d7b9" opacity=".7" />
      </pattern>
      <pattern id={i("planks")} width="1600" height="40" patternUnits="userSpaceOnUse">
        <rect width="1600" height="40" fill="#7c6047" />
        <rect y="39" width="1600" height="1" fill="#4c3a2b" />
        <rect x="310" width="1" height="40" fill="#4c3a2b" opacity=".5" />
        <rect x="1150" width="1" height="40" fill="#4c3a2b" opacity=".5" />
      </pattern>
      <pattern id={i("screed")} width="60" height="60" patternUnits="userSpaceOnUse">
        <rect width="60" height="60" fill="#6f6b65" />
        <circle cx="12" cy="18" r="1.2" fill="#5d5954" />
        <circle cx="44" cy="40" r="1" fill="#827e78" />
        <circle cx="30" cy="8" r=".8" fill="#5d5954" />
      </pattern>
      <pattern id={i("fluted")} width="14" height="900" patternUnits="userSpaceOnUse">
        <rect width="14" height="900" fill="#8a6440" />
        <rect width="3" height="900" fill="#5e4129" opacity=".75" />
        <rect x="7" width="3" height="900" fill="#a7805a" opacity=".55" />
      </pattern>
    </defs>
  );
}
