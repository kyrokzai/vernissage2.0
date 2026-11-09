import { forwardRef, useImperativeHandle, useRef } from "react";
import { stageProgress } from "../engine/math";
import { N_STAGES, STAGES } from "./data/stages";

export type ProgressHandle = { set: (p: number) => void };

const I = {
  play: <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l10.5-6.5z" fill="currentColor" /></svg>,
  pause: <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7.5 5.5h3v13h-3zM13.5 5.5h3v13h-3z" fill="currentColor" /></svg>,
  restart: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M5 12a7 7 0 1 0 2.2-5.1" /><path d="M5 4.5V9h4.5" /></svg>,
};

/**
 * ProgressIndicator — ползунок общего прогресса и кнопки этапов.
 * Значение ползунка обновляется императивно (без React) на каждом кадре.
 */
export const ProgressIndicator = forwardRef<ProgressHandle, { stage: number; onScrub: (p: number) => void; onStage: (k: number) => void }>(
  function ProgressIndicator({ stage, onScrub, onStage }, ref) {
    const range = useRef<HTMLInputElement>(null);
    const pct = useRef<HTMLSpanElement>(null);
    const fill = useRef<HTMLDivElement>(null);
    const lastPct = useRef(-1);
    useImperativeHandle(ref, () => ({
      set(p: number) {
        const v = Math.round(p * 1000);
        if (range.current && document.activeElement !== range.current) range.current.value = String(v);
        if (fill.current) fill.current.style.transform = `scaleX(${p.toFixed(4)})`;
        const n = Math.round(p * 100);
        if (n !== lastPct.current && pct.current && range.current) {
          lastPct.current = n;
          pct.current.textContent = `${n}%`;
          range.current.setAttribute("aria-valuetext", `${n}%, ${STAGES[Math.round(p * (N_STAGES - 1))].title}`);
        }
      },
    }));
    return (
      <div className="m31-progress">
        <div className="m31-ticks" role="group" aria-label="Перейти к этапу">
          {STAGES.map((s, k) => (
            <button
              key={k}
              type="button"
              className={`m31-tick ${k === stage ? "is-on" : k < stage ? "is-past" : ""}`}
              style={{ left: `${stageProgress(k, N_STAGES) * 100}%` }}
              onClick={() => onStage(k)}
              aria-label={`Этап ${k}: ${s.title}`}
              aria-current={k === stage ? "step" : undefined}
              title={s.title}
            >
              <span>{k}</span>
            </button>
          ))}
        </div>
        <div className="m31-range">
          <div className="m31-rail" aria-hidden="true"><div ref={fill} className="m31-fill" /></div>
          <input
            ref={range}
            type="range"
            min={0}
            max={1000}
            step={1}
            defaultValue={0}
            aria-label="Общий прогресс сборки"
            onInput={(e) => onScrub(Number((e.target as HTMLInputElement).value) / 1000)}
          />
        </div>
        <span ref={pct} className="m31-pct" aria-hidden="true">0%</span>
      </div>
    );
  },
);

export function AssemblyControls({ stage, playing, reduced, onToggle, onRestart, onMode }: {
  stage: number;
  playing: boolean;
  reduced: boolean;
  onToggle: () => void;
  onRestart: () => void;
  onMode: (reduced: boolean) => void;
}) {
  const s = STAGES[stage];
  return (
    <>
      <div className="m31-status" aria-live="polite">
        <span className="m31-code">{s.code} · {stage + 1} из {N_STAGES}</span>
        <h2>{s.title}</h2>
        <p>{s.text}</p>
      </div>
      <div className="m31-buttons">
        <button type="button" className="m31-play" onClick={onToggle} aria-pressed={playing} aria-label={playing ? "Пауза" : "Воспроизвести сборку"}>
          {playing ? I.pause : I.play}
        </button>
        <button type="button" className="m31-btn" onClick={onRestart} aria-label="Начать сборку заново">
          {I.restart}<span>Restart</span>
        </button>
        <div className="m31-mode" role="group" aria-label="Режим движения">
          <button type="button" aria-pressed={!reduced} onClick={() => onMode(false)}>Full Experience</button>
          <button type="button" aria-pressed={reduced} onClick={() => onMode(true)}>Reduced Motion</button>
        </div>
      </div>
    </>
  );
}
