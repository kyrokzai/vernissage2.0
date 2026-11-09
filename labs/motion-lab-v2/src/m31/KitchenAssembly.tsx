import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { AssemblyController } from "./controller";
import { SceneDriver, type ElSpec } from "./sceneDriver";
import { KitchenStage, PhotoPlates, PLATE_SPECS } from "./KitchenStage";
import { AssemblyControls, ProgressIndicator, type ProgressHandle } from "./Controls";
import { buildKitchen, FINAL_TITLE_SPEC } from "./data/kitchenModel";
import { MOTION, N_STAGES } from "./data/stages";
import { loadPlates, manifestFromURL } from "./assetLoader";

type Layout = "desktop" | "stack" | "phone" | "landscape";
const VIEWS: Record<Layout, { viewBox: string; fit: "meet" | "slice" }> = {
  desktop: { viewBox: "0 0 1600 900", fit: "meet" },
  stack: { viewBox: "0 0 1600 900", fit: "meet" },
  landscape: { viewBox: "0 0 1600 900", fit: "meet" },
  // Узкий экран: та же камера и геометрия, только кадрирование по стене кухни и острову
  phone: { viewBox: "520 40 990 860", fit: "slice" },
};

function useMedia(q: string) {
  const [v, setV] = useState(() => matchMedia(q).matches);
  useEffect(() => {
    const m = matchMedia(q);
    const on = () => setV(m.matches);
    m.addEventListener("change", on);
    return () => m.removeEventListener("change", on);
  }, [q]);
  return v;
}
function useLayout(): Layout {
  const landscape = useMedia("(orientation: landscape) and (max-height: 520px)");
  const phone = useMedia("(max-width: 600px) and (orientation: portrait)");
  const stack = useMedia("(max-width: 900px) and (orientation: portrait)");
  return landscape ? "landscape" : phone ? "phone" : stack ? "stack" : "desktop";
}

const PREF_KEY = "vernissage-m31-motion";
function readPref(): "auto" | "full" | "reduced" {
  try {
    const v = localStorage.getItem(PREF_KEY);
    return v === "full" || v === "reduced" ? v : "auto";
  } catch {
    return "auto";
  }
}

const KITCHEN_SPECS: ElSpec[] = buildKitchen(() => "").els.map(({ node: _node, ...spec }) => spec);

export function KitchenAssembly() {
  const sysReduced = useMedia("(prefers-reduced-motion: reduce)");
  const [pref, setPref] = useState(readPref);
  const reduced = pref === "reduced" || (pref === "auto" && sysReduced);
  const layout = useLayout();
  const view = VIEWS[layout];

  const [stage, setStage] = useState(0);
  const [playing, setPlaying] = useState(false);
  const manifest = useMemo(() => manifestFromURL(N_STAGES), []);
  const [assets, setAssets] = useState<{ mode: "loading" | "demo" | "photo"; note?: string }>(manifest ? { mode: "loading" } : { mode: "demo" });

  const track = useRef<HTMLDivElement>(null);
  const sceneRoot = useRef<HTMLDivElement>(null);
  const ctrl = useRef<AssemblyController | null>(null);
  const prog = useRef<ProgressHandle>(null);

  // Контроллер создаётся до подключения сцены (оба эффекта — layout, выполняются по порядку)
  useLayoutEffect(() => {
    const c = new AssemblyController(track.current!, {
      onTick: (p) => prog.current?.set(p),
      onStage: setStage,
      onPlaying: setPlaying,
    });
    ctrl.current = c;
    return () => {
      c.destroy();
      ctrl.current = null;
    };
  }, []);

  useLayoutEffect(() => {
    const c = ctrl.current, root = sceneRoot.current;
    if (!c || !root || assets.mode === "loading") return;
    const specs = assets.mode === "photo" ? [...PLATE_SPECS(N_STAGES), FINAL_TITLE_SPEC] : [...KITCHEN_SPECS, FINAL_TITLE_SPEC];
    const d = new SceneDriver(root, specs, N_STAGES);
    if (d.missing.length) console.warn("M3.1: не найдены элементы сцены", d.missing);
    return c.attach(d);
  }, [assets.mode, layout]);

  useEffect(() => { ctrl.current?.setReduced(reduced); }, [reduced]);

  useEffect(() => {
    if (!manifest) return;
    const ac = new AbortController();
    loadPlates(manifest, { signal: ac.signal })
      .then((r) => { if (!ac.signal.aborted) setAssets(r.mode === "photo" ? { mode: "photo" } : { mode: "demo", note: `Фото-кадры не загрузились (${r.reason}) — показан демонстрационный режим.` }); })
      .catch(() => { if (!ac.signal.aborted) setAssets({ mode: "demo", note: "Фото-кадры недоступны — показан демонстрационный режим." }); });
    return () => ac.abort();
  }, [manifest]);

  const setMode = (r: boolean) => {
    const v = r ? "reduced" : "full";
    setPref(v);
    try { localStorage.setItem(PREF_KEY, v); } catch { /* хранилище недоступно */ }
  };

  return (
    <div className={`m31 lay-${layout} ${reduced ? "is-reduced" : ""}`}>
      <header className="m31-intro">
        <div className="m31-intro-top">
          <span className="m31-logo">
            <svg viewBox="0 0 40 40" aria-hidden="true"><rect x="8.5" y="8.5" width="23" height="23" transform="rotate(45 20 20)" fill="none" stroke="currentColor" strokeWidth="1.5" /><path d="M14.5 23.5 20 18l5.5 5.5" fill="none" stroke="currentColor" strokeWidth="1.5" /></svg>
            <span>VERNISSAGE</span>
          </span>
          <span className="m31-badge">Motion Lab V2 · M3.1</span>
        </div>
        <div className="m31-intro-body">
          <h1>Сборка кухни</h1>
          <p>Прокручивайте страницу: пустое помещение шаг за шагом превращается в готовую кухню. Прокрутка вверх разбирает её в обратном порядке, остановиться можно на любом моменте.</p>
          <p className="m31-note">Демонстрационная сцена: планировка и размеры условные, это не реальный проект VERNISSAGE.</p>
        </div>
        <div className="m31-cue" aria-hidden="true"><span />Прокрутите</div>
      </header>

      <div ref={track} className="m31-track" style={{ height: `${MOTION.trackScreens * 100}svh` }}>
        <section className="m31-stage" aria-label="Интерактивная сборка кухни">
          <div className="m31-scene-cell">
            <div ref={sceneRoot} className="m31-scene">
              {assets.mode === "photo" && manifest ? (
                <PhotoPlates plates={manifest.plates} />
              ) : assets.mode === "demo" ? (
                <KitchenStage uid="m31" viewBox={view.viewBox} fit={view.fit} />
              ) : (
                <div className="m31-loading">Загружаем кадры…</div>
              )}
              <div data-el="final-title" className="m31-final" style={{ display: "none" }}>
                <span>Финал</span>
                <h3>Кухня, собранная по размеру</h3>
              </div>
              <span className="m31-tag">{assets.mode === "photo" ? "Фото-режим" : "Демонстрационная сцена · прототип"}</span>
              {assets.note && <span className="m31-tag m31-tag-warn" role="status">{assets.note}</span>}
            </div>
          </div>
          <div className="m31-panel" data-m31-controls>
            <AssemblyControls
              stage={stage}
              playing={playing}
              reduced={reduced}
              onToggle={() => ctrl.current?.toggle()}
              onRestart={() => ctrl.current?.restart()}
              onMode={setMode}
            />
            <ProgressIndicator ref={prog} stage={stage} onScrub={(p) => ctrl.current?.scrub(p)} onStage={(k) => ctrl.current?.goToStage(k)} />
          </div>
        </section>
      </div>

      <footer className="m31-outro">
        <h2>Кухня собрана</h2>
        <p>Прокрутите вверх — кухня разберётся в обратном порядке. Или начните сборку заново.</p>
        <button type="button" className="m31-link" onClick={() => ctrl.current?.restart()}>Собрать заново</button>
      </footer>
    </div>
  );
}
