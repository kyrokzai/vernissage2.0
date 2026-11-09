import { ScrollProgress } from "../engine/progress";
import { currentStage, stageProgress } from "../engine/math";
import type { SceneDriver } from "./sceneDriver";
import { MOTION, N_STAGES } from "./data/stages";

export type ControllerEvents = {
  /** Каждый кадр: прогресс 0..1 (для индикатора; без React). */
  onTick: (p: number) => void;
  /** Только при смене этапа — здесь допустим React-рендер. */
  onStage: (stage: number) => void;
  onPlaying: (playing: boolean) => void;
};

/**
 * AnimationController — единая точка управления сборкой.
 * Состояние: прокрутка страницы → прогресс → драйвер сцены. Автовоспроизведение, перезапуск и переход
 * к этапу только прокручивают страницу, поэтому прокрутка вперёд/назад и кнопки не конфликтуют.
 */
export class AssemblyController {
  private sp: ScrollProgress;
  private drivers = new Set<SceneDriver>();
  private stage = -1;
  private playing = false;
  private stepTimer = 0;
  private p = 0;
  private ev: ControllerEvents;
  reduced = false;

  constructor(track: HTMLElement, ev: ControllerEvents) {
    this.ev = ev;
    this.sp = new ScrollProgress(track, {
      onProgress: (cur) => this.render(cur),
      onTweenEnd: (reason) => {
        if (this.playing && (reason === "interrupted" || !this.stepTimer)) this.setPlaying(false);
      },
      onUserInput: () => this.pause(),
      // Касание или пробел на кнопках панели — это команда, а не прокрутка: её обрабатывает сама кнопка.
      ignoreInput: (e) => e.target instanceof Element && !!e.target.closest("[data-m31-controls]"),
    });
    this.sp.smoothing = MOTION.smoothing;
  }

  destroy() {
    this.pause();
    this.sp.destroy();
    this.drivers.clear();
  }

  /** Подключить драйвер сцены (демо- или фото-режим). Можно несколько: сцена + HTML-заголовок. */
  attach(d: SceneDriver) {
    d.reduced = this.reduced;
    d.hold = MOTION.hold;
    this.drivers.add(d);
    d.apply(this.p);
    return () => { this.drivers.delete(d); };
  }

  setReduced(r: boolean) {
    this.reduced = r;
    this.pause();
    this.sp.reduced = r;
    for (const d of this.drivers) { d.reduced = r; d.invalidate(); }
    this.sp.snap();
  }

  private render(p: number) {
    this.p = p;
    for (const d of this.drivers) d.apply(p);
    this.ev.onTick(p);
    const s = currentStage(p, N_STAGES);
    if (s !== this.stage) {
      this.stage = s;
      this.ev.onStage(s);
    }
  }

  private setPlaying(v: boolean) {
    if (this.playing === v) return;
    this.playing = v;
    this.ev.onPlaying(v);
  }

  get isPlaying() { return this.playing; }
  get progress() { return this.p; }

  play() {
    if (this.playing) return;
    this.setPlaying(true);
    if (!this.reduced) {
      this.sp.play(MOTION.autoplayMs);
      return;
    }
    // Уменьшенное движение: этапы сменяются мгновенно с паузой на каждом.
    let k = currentStage(this.sp.fromScroll(), N_STAGES);
    if (k >= N_STAGES - 1) { k = 0; this.sp.seek(0); }
    this.stepTimer = window.setInterval(() => {
      k += 1;
      this.sp.seek(stageProgress(k, N_STAGES));
      if (k >= N_STAGES - 1) this.pause();
    }, MOTION.reducedStepMs);
  }

  pause() {
    if (this.stepTimer) { clearInterval(this.stepTimer); this.stepTimer = 0; }
    this.sp.stop();
    this.setPlaying(false);
  }

  toggle() { if (this.playing) this.pause(); else this.play(); }

  /** Вернуть сборку в начало без перезагрузки страницы. */
  restart() {
    this.pause();
    this.sp.seek(0, this.reduced ? 0 : MOTION.restartMs);
  }

  goToStage(k: number) {
    this.pause();
    this.sp.seek(stageProgress(Math.max(0, Math.min(N_STAGES - 1, k)), N_STAGES), this.reduced ? 0 : MOTION.seekMs);
  }

  /** Ручной ползунок: мгновенно, со сглаживанием движения сцены. */
  scrub(p: number) {
    this.pause();
    this.sp.seek(p);
  }
}
