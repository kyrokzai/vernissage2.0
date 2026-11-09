import { clamp, easeFn, smoothstep, stageT } from "../engine/math";

/*
 * Драйвер сцены M3.1 — без React.
 * Сцена отрисовывается один раз; при прокрутке драйвер меняет только атрибуты transform / opacity /
 * clip у нужных элементов и только если значение действительно изменилось. Это исключает
 * React-рендеры на каждый пиксель прокрутки и пересчёт раскладки.
 */

/** Способ монтажа. Элемент всегда нарисован в финальных координатах — движение только по оси монтажа. */
export type Motion =
  | "rise" // корпус поднимается от пола
  | "drop" // навесной элемент опускается сверху
  | "left" | "right" // фасад навешивается со стороны петель
  | "up" | "ltr" // раскрытие покрытия в направлении монтажа (с кромкой)
  | "center" | "centerV" // прорисовка от центра (размерные линии, уровень)
  | "light" // свет, световые пятна, цветокоррекция
  | "contact"; // тень, появляющаяся в момент касания

export type ElSpec = {
  id: string;
  s: number; // этап появления (0 — виден всегда)
  d?: number; // задержка внутри перехода, 0..1
  u?: number; // длительность внутри перехода, 0..1
  m: Motion;
  k?: number; // ход по оси монтажа, в единицах сцены (для HTML — в пикселях)
  box?: [number, number, number, number]; // область раскрытия
  out?: number; // этап, на котором элемент гаснет
  outTo?: number; // до какой прозрачности гаснет (по умолчанию до 0)
};

const settle = easeFn("settle");

/** Локальный прогресс элемента; длительность обрезается, чтобы движение всегда завершалось к концу этапа. */
export function localT(t: number, d = 0, u = 1) {
  const dd = clamp(d, 0, 0.98);
  const uu = Math.max(0.02, Math.min(u, 1 - dd));
  return settle(clamp((t - dd) / uu));
}

/** Состояние элемента при прогрессе p. Чистая функция — одинаковый результат при прокрутке вперёд и назад. */
export function elementState(spec: ElSpec, p: number, N: number, hold: number, reduced: boolean) {
  const e = spec.s <= 0 ? 1 : localT(stageT(p, N, hold, spec.s, reduced), spec.d, spec.u);
  let o = 1;
  if (spec.out) {
    const f = smoothstep(stageT(p, N, hold, spec.out, reduced) * 1.4);
    o = 1 - f * (1 - (spec.outTo ?? 0));
  }
  return { e, o };
}

const r2 = (n: number) => Math.round(n * 100) / 100;

type Bound = {
  spec: ElSpec;
  el: SVGGElement | HTMLElement;
  html: boolean;
  clip: SVGRectElement | null;
  edge: SVGRectElement | null;
  last: string;
};

export class SceneDriver {
  private nodes: Bound[] = [];
  private N: number;
  hold = 0.3;
  reduced = false;
  missing: string[] = [];

  constructor(root: Element, specs: ElSpec[], N: number) {
    this.N = N;
    for (const spec of specs) {
      const el = root.querySelector<SVGGElement | HTMLElement>(`[data-el="${spec.id}"]`);
      if (!el) {
        this.missing.push(spec.id);
        continue;
      }
      this.nodes.push({
        spec,
        el,
        html: el instanceof HTMLElement,
        clip: el.querySelector<SVGRectElement>("[data-clip]"),
        edge: el.querySelector<SVGRectElement>("[data-edge]"),
        last: "",
      });
    }
  }
  get size() {
    return this.nodes.length;
  }

  apply(p: number) {
    for (const n of this.nodes) {
      const { e, o } = elementState(n.spec, p, this.N, this.hold, this.reduced);
      this.write(n, e, o);
    }
  }

  /** Сбросить кэш записанных значений (после смены режима или повторного монтирования). */
  invalidate() {
    for (const n of this.nodes) n.last = "";
  }

  /**
   * Вычисляет итоговые значения атрибутов и пишет их в DOM, только если строка значений изменилась.
   * Ключ кэша — сами записываемые значения, поэтому состояние строго определяется прогрессом
   * и не зависит от направления прокрутки.
   */
  private write(n: Bound, e: number, o: number) {
    const { spec, el, html } = n;
    const st = el.style;
    if (!(e > 0.0005 && o > 0.0005)) {
      if (n.last !== "h") { n.last = "h"; st.display = "none"; }
      return;
    }
    const k = spec.k ?? 36;
    const appear = Math.min(1, e * 2.4) * o;
    let tr = "", op = "", clip = "", edge = "";
    switch (spec.m) {
      case "rise": tr = `0 ${r2(k * (1 - e))}`; op = appear.toFixed(3); break;
      case "drop": tr = `0 ${r2(-k * (1 - e))}`; op = appear.toFixed(3); break;
      case "left": tr = `${r2(-k * (1 - e))} 0`; op = appear.toFixed(3); break;
      case "right": tr = `${r2(k * (1 - e))} 0`; op = appear.toFixed(3); break;
      case "light": op = (e * o).toFixed(3); break;
      case "contact": op = (smoothstep((e - 0.55) / 0.45) * o).toFixed(3); break;
      default: {
        op = o.toFixed(3);
        if (html) {
          const inv = `${r2((1 - e) * 100)}%`, half = `${r2((1 - e) * 50)}%`;
          clip = spec.m === "up" ? `inset(${inv} 0 0 0)` : spec.m === "ltr" ? `inset(0 ${inv} 0 0)` : spec.m === "center" ? `inset(0 ${half} 0 ${half})` : `inset(${half} 0 ${half} 0)`;
          break;
        }
        const [x, y, w, h] = spec.box || [0, 0, 1600, 900];
        let rx = x, ry = y, rw = w, rh = h;
        if (spec.m === "up") { ry = y + h * (1 - e); rh = h * e; }
        else if (spec.m === "ltr") rw = w * e;
        else if (spec.m === "center") { rw = w * e; rx = x + (w - rw) / 2; }
        else { rh = h * e; ry = y + (h - rh) / 2; }
        clip = [rx, ry, Math.max(0, rw), Math.max(0, rh)].map(r2).join(",");
        if (n.edge) edge = e >= 0.999 ? "none" : String(r2(spec.m === "up" ? ry - 1 : rx + rw - 1));
      }
    }
    const key = `${tr}|${op}|${clip}|${edge}`;
    if (key === n.last) return;
    n.last = key;
    st.display = "";
    if (html) {
      if (tr) st.transform = `translate3d(${tr.replace(" ", "px, ")}px, 0)`;
      st.opacity = op;
      if (clip) st.clipPath = clip;
      return;
    }
    if (tr) el.setAttribute("transform", `translate(${tr})`);
    el.setAttribute("opacity", op);
    if (clip && n.clip) {
      const [cx, cy, cw, ch] = clip.split(",");
      n.clip.setAttribute("x", cx);
      n.clip.setAttribute("y", cy);
      n.clip.setAttribute("width", cw);
      n.clip.setAttribute("height", ch);
    }
    if (n.edge) {
      if (edge === "none") n.edge.setAttribute("display", "none");
      else if (edge) {
        n.edge.removeAttribute("display");
        n.edge.setAttribute(spec.m === "up" ? "y" : "x", edge);
      }
    }
  }
}
