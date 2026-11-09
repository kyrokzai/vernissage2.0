import { useEffect, useRef, useState } from "react";
import { Slider } from "@/components/ui/slider";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollProgress } from "./engine/progress";
import { currentStage, stageProgress } from "./engine/math";
import { SCENES, SceneView, sceneById, type SceneId } from "./scenes";
import { Compare, DEFAULT_SETTINGS, I, Logo, Row, Scrubber, StageSelect, useMedia, useSettings } from "./ui/controls";

const pad = (n: number) => String(n).padStart(2, "0");

export default function App() {
  const [st, set] = useSettings();
  const sysReduced = useMedia("(prefers-reduced-motion: reduce)");
  const reduced = st.motion === "on" || (st.motion === "system" && sysReduced);
  const mobile = useMedia("(max-width: 760px)");

  const [sceneId, setSceneId] = useState<SceneId>("kitchen");
  const scene = sceneById(sceneId);
  const N = scene.stages.length;
  const [mode, setMode] = useState<"build" | "compare">("build");
  const [cmp, setCmp] = useState<[number, number]>([0, N - 1]);
  const [p, setP] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [openSettings, setOpenSettings] = useState(false);

  const track = useRef<HTMLDivElement>(null);
  const ctrl = useRef<ScrollProgress | null>(null);

  useEffect(() => {
    const c = new ScrollProgress(track.current!, { onProgress: (cur) => setP(cur), onTweenEnd: () => setPlaying(false) });
    ctrl.current = c;
    return () => c.destroy();
  }, []);
  useEffect(() => {
    if (!ctrl.current) return;
    ctrl.current.smoothing = st.smoothing;
    ctrl.current.reduced = reduced;
  }, [st.smoothing, reduced]);
  useEffect(() => setCmp([0, N - 1]), [sceneId, N]);

  const stage = currentStage(p, N);
  const seek = (v: number) => { ctrl.current?.seek(v); setPlaying(false); };
  const toStage = (k: number) => { ctrl.current?.seek(stageProgress(k, N), reduced ? 0 : 900); setPlaying(false); };
  const togglePlay = () => {
    const c = ctrl.current;
    if (!c) return;
    if (playing) { c.stop(); setPlaying(false); return; }
    c.play(st.autoplay * 1000);
    setPlaying(true);
  };
  const toStart = () => ctrl.current?.seek(0, reduced ? 0 : 1400);

  return (
    <div className={`page ${reduced ? "rm" : ""}`}>
      <header className="intro">
        <div className="intro-top">
          <Logo />
          <span className="badge">Motion Lab V2 · прототип</span>
        </div>
        <div className="intro-body">
          <h1>Как собирается интерьер</h1>
          <p>Прокрутите страницу вниз — помещение соберётся от пустых стен до готового интерьера. Прокрутите вверх — разберётся в обратном порядке. Остановиться можно на любом моменте.</p>
          <p className="intro-note">Все три сцены — демонстрационные: планировка и размеры условные, это не реальные проекты VERNISSAGE.</p>
        </div>
        <div className="scroll-cue" aria-hidden="true"><span />Прокрутите</div>
      </header>

      <div ref={track} className="track" style={{ height: `${Math.max(2, st.length) * 100}svh` }}>
        <section className="stage" aria-label="Интерактивная сборка интерьера">
          <div className="stage-top">
            <div className="projects" role="tablist" aria-label="Объект">
              {SCENES.map((s) => (
                <button key={s.id} role="tab" type="button" aria-selected={s.id === sceneId} className="proj-tab" onClick={() => setSceneId(s.id)}>
                  {s.title}
                </button>
              ))}
            </div>
            <div className="stage-tools">
              <div className="seg" role="group" aria-label="Режим просмотра">
                <button type="button" aria-pressed={mode === "build"} onClick={() => setMode("build")}>Сборка</button>
                <button type="button" aria-pressed={mode === "compare"} onClick={() => setMode("compare")}>До / После</button>
              </div>
              <button type="button" className="icon-btn" onClick={() => setOpenSettings(true)} aria-label="Настройки движения">{I.gear}</button>
            </div>
          </div>

          <div className="stage-view">
            <div className="scene-box" key={sceneId}>
              {mode === "build" ? (
                <SceneView scene={scene} p={p} hold={st.hold} reduced={reduced} uid="main" mobile={mobile} />
              ) : (
                <Compare scene={scene} a={cmp[0]} b={cmp[1]} hold={st.hold} mobile={mobile} />
              )}
              <span className="demo-tag">Демонстрационная сцена · прототип</span>
            </div>
          </div>

          <div className="stage-bottom">
            {mode === "build" ? (
              <>
                <div className="caption" aria-live="polite">
                  <span className="cap-n">{pad(stage + 1)} / {pad(N)} · {scene.kind}</span>
                  <h2>{scene.stages[stage].title}</h2>
                  <p>{scene.stages[stage].text}</p>
                </div>
                <div className="controls">
                  <button type="button" className="play" onClick={togglePlay} aria-label={playing ? "Пауза" : "Автовоспроизведение"} aria-pressed={playing}>
                    {playing ? I.pause : I.play}
                  </button>
                  <Scrubber p={p} N={N} stage={stage} titles={scene.stages.map((s) => s.title)} onSeek={seek} onStage={toStage} />
                  <span className="pct" aria-hidden="true">{Math.round(p * 100)}%</span>
                </div>
              </>
            ) : (
              <div className="cmp-controls">
                <p>Перетащите разделитель или используйте стрелки. Геометрия сцены одинакова на всех этапах, поэтому кадры совпадают.</p>
                <StageSelect label="Слева" value={cmp[0]} stages={scene.stages} onChange={(v) => setCmp([v, cmp[1]])} />
                <StageSelect label="Справа" value={cmp[1]} stages={scene.stages} onChange={(v) => setCmp([cmp[0], v])} />
              </div>
            )}
          </div>
        </section>
      </div>

      <footer className="outro">
        <h2>Интерьер собран</h2>
        <p>Прокрутите вверх, и сцена разберётся в обратном порядке. Или вернитесь к началу сборки.</p>
        <button type="button" className="btn-ghost" onClick={toStart}>К началу сборки</button>
      </footer>

      <Sheet open={openSettings} onOpenChange={setOpenSettings}>
        <SheetContent side={mobile ? "bottom" : "right"} className="settings">
          <SheetHeader>
            <SheetTitle>Настройки движения</SheetTitle>
            <SheetDescription>Сохраняются в этом браузере.</SheetDescription>
          </SheetHeader>
          <div className="settings-body">
            <Row label="Скорость сборки при прокрутке" value={`${st.length} экранов`}>
              <Slider value={[st.length]} min={2} max={10} step={0.5} onValueChange={(v) => set({ length: v[0] })} aria-label="Длина прокрутки" />
              <small>Меньше экранов — быстрее сборка, больше — спокойнее.</small>
            </Row>
            <Row label="Плавность" value={st.smoothing === 0 ? "нет" : `${Math.round(st.smoothing * 100)}%`}>
              <Slider value={[st.smoothing]} min={0} max={1} step={0.05} onValueChange={(v) => set({ smoothing: v[0] })} aria-label="Плавность" />
              <small>Сглаживает рывки колеса мыши. Прокрутка не перехватывается.</small>
            </Row>
            <Row label="Пауза на каждом этапе" value={`${Math.round(st.hold * 100)}%`}>
              <Slider value={[st.hold]} min={0} max={0.6} step={0.05} onValueChange={(v) => set({ hold: v[0] })} aria-label="Пауза на этапе" />
              <small>Доля прокрутки, на которой этап стоит неподвижно.</small>
            </Row>
            <Row label="Автовоспроизведение" value={`${st.autoplay} с`}>
              <Slider value={[st.autoplay]} min={6} max={40} step={1} onValueChange={(v) => set({ autoplay: v[0] })} aria-label="Длительность автовоспроизведения" />
            </Row>
            <Row label="Уменьшение движения" value={reduced ? "включено" : "выключено"}>
              <Select value={st.motion} onValueChange={(v) => set({ motion: v as typeof st.motion })}>
                <SelectTrigger className="h-10" aria-label="Уменьшение движения"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="system">Как в системе{sysReduced ? " (уменьшено)" : ""}</SelectItem>
                  <SelectItem value="on">Уменьшить движение</SelectItem>
                  <SelectItem value="off">Полная анимация</SelectItem>
                </SelectContent>
              </Select>
              <small>Этапы переключаются без движения, перемотка мгновенная.</small>
            </Row>
            <button type="button" className="btn-ghost" onClick={() => set(DEFAULT_SETTINGS)}>Сбросить настройки</button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
