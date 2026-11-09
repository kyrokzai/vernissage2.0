import { useEffect, useRef, useState, type ReactNode } from "react";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { clamp, stageProgress } from "../engine/math";
import { SceneView, type SceneDef } from "../scenes";

/* ───────── Настройки ───────── */
export type Settings = { length: number; autoplay: number; smoothing: number; hold: number; motion: "system" | "on" | "off" };
export const DEFAULT_SETTINGS: Settings = { length: 5, autoplay: 16, smoothing: 0.4, hold: 0.3, motion: "system" };
const KEY = "vernissage-motion-lab-v2";
export function useSettings() {
  const [s, setS] = useState<Settings>(() => {
    try {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem(KEY) || "{}") };
    } catch {
      return DEFAULT_SETTINGS;
    }
  });
  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* хранилище недоступно */ }
  }, [s]);
  return [s, (p: Partial<Settings>) => setS((o) => ({ ...o, ...p }))] as const;
}
export function useMedia(q: string) {
  const [v, setV] = useState(() => matchMedia(q).matches);
  useEffect(() => {
    const m = matchMedia(q);
    const on = () => setV(m.matches);
    m.addEventListener("change", on);
    return () => m.removeEventListener("change", on);
  }, [q]);
  return v;
}

/* ───────── Иконки ───────── */
export const I = {
  play: <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l10.5-6.5z" fill="currentColor" /></svg>,
  pause: <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7.5 5.5h3v13h-3zM13.5 5.5h3v13h-3z" fill="currentColor" /></svg>,
  gear: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M4 7h10M18 7h2M4 17h4M12 17h8" /><circle cx="16" cy="7" r="2" /><circle cx="10" cy="17" r="2" /></svg>,
  arrows: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M9 7l-5 5 5 5M15 7l5 5-5 5" /></svg>,
};
export function Logo() {
  return (
    <span className="logo">
      <svg viewBox="0 0 40 40" aria-hidden="true"><rect x="8.5" y="8.5" width="23" height="23" transform="rotate(45 20 20)" fill="none" stroke="currentColor" strokeWidth="1.5" /><path d="M14.5 23.5 20 18l5.5 5.5" fill="none" stroke="currentColor" strokeWidth="1.5" /></svg>
      <span>VERNISSAGE</span>
    </span>
  );
}

/* ───────── Ползунок прогресса с кнопками этапов ───────── */
export function Scrubber({ p, N, stage, titles, onSeek, onStage }: { p: number; N: number; stage: number; titles: string[]; onSeek: (v: number) => void; onStage: (k: number) => void }) {
  return (
    <div className="scrub">
      <div className="scrub-ticks" role="group" aria-label="Этапы сборки">
        {titles.map((t, k) => (
          <button
            key={k}
            type="button"
            className={`tick ${k === stage ? "is-on" : k < stage ? "is-past" : ""}`}
            style={{ left: `${stageProgress(k, N) * 100}%` }}
            onClick={() => onStage(k)}
            aria-label={`Этап ${k + 1}: ${t}`}
            aria-current={k === stage ? "step" : undefined}
            title={t}
          >
            <span>{k + 1}</span>
          </button>
        ))}
      </div>
      <Slider className="scrub-slider" value={[p * 100]} min={0} max={100} step={0.1} onValueChange={(v) => onSeek(v[0] / 100)} aria-label="Прогресс сборки, проценты" />
    </div>
  );
}

/* ───────── Сравнение «До / После» ───────── */
export function Compare({ scene, a, b, hold, mobile }: { scene: SceneDef; a: number; b: number; hold: number; mobile: boolean }) {
  const [x, setX] = useState(0.5);
  const box = useRef<HTMLDivElement>(null);
  const drag = useRef(false);
  const N = scene.stages.length;
  const setFrom = (clientX: number) => {
    const r = box.current!.getBoundingClientRect();
    setX(clamp((clientX - r.left) / r.width, 0.02, 0.98));
  };
  return (
    <div
      ref={box}
      className="cmp"
      onPointerDown={(e) => { drag.current = true; (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); setFrom(e.clientX); }}
      onPointerMove={(e) => drag.current && setFrom(e.clientX)}
      onPointerUp={() => (drag.current = false)}
      onPointerCancel={() => (drag.current = false)}
    >
      <SceneView scene={scene} p={stageProgress(b, N)} hold={hold} reduced uid="cmpB" mobile={mobile} />
      <div className="cmp-top" style={{ clipPath: `inset(0 ${(1 - x) * 100}% 0 0)` }}>
        <SceneView scene={scene} p={stageProgress(a, N)} hold={hold} reduced uid="cmpA" mobile={mobile} />
      </div>
      <span className="cmp-label l">До · {scene.stages[a].title}</span>
      <span className="cmp-label r">После · {scene.stages[b].title}</span>
      <div className="cmp-line" style={{ left: `${x * 100}%` }}>
        <button
          type="button"
          className="cmp-handle"
          role="slider"
          aria-label="Граница сравнения «До / После»"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(x * 100)}
          onKeyDown={(e) => {
            const step = e.shiftKey ? 0.1 : 0.03;
            if (e.key === "ArrowLeft") { e.preventDefault(); setX((v) => clamp(v - step, 0.02, 0.98)); }
            if (e.key === "ArrowRight") { e.preventDefault(); setX((v) => clamp(v + step, 0.02, 0.98)); }
            if (e.key === "Home") setX(0.02);
            if (e.key === "End") setX(0.98);
          }}
        >
          {I.arrows}
        </button>
      </div>
    </div>
  );
}

export function StageSelect({ label, value, stages, onChange }: { label: string; value: number; stages: { title: string }[]; onChange: (v: number) => void }) {
  return (
    <label className="stage-select">
      <span>{label}</span>
      <Select value={String(value)} onValueChange={(v) => onChange(Number(v))}>
        <SelectTrigger className="h-10" aria-label={label}><SelectValue /></SelectTrigger>
        <SelectContent>
          {stages.map((s, i) => <SelectItem key={i} value={String(i)}>{i + 1}. {s.title}</SelectItem>)}
        </SelectContent>
      </Select>
    </label>
  );
}

export function Row({ label, value, children }: { label: string; value: string; children: ReactNode }) {
  return (
    <div className="set-row">
      <div className="set-head"><span>{label}</span><b>{value}</b></div>
      {children}
    </div>
  );
}
