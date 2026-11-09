import { clamp, easeFn, type Ease } from "./math";

export type ProgressEvents = {
  /** Каждый кадр, пока сглаженный прогресс догоняет цель. */
  onProgress: (current: number, target: number) => void;
  /** Автовоспроизведение или перемотка к этапу закончились или были прерваны. */
  onTweenEnd?: (reason: "done" | "interrupted") => void;
};

/**
 * Единое состояние прогресса сборки.
 *
 * Источник истины — прокрутка страницы внутри «дорожки» (track). Ползунок, кнопки этапов
 * и автовоспроизведение не меняют прогресс напрямую: они прокручивают страницу.
 * Поэтому способы управления не спорят друг с другом, а прокрутка вверх всегда разбирает сцену.
 */
export class ScrollProgress {
  private target = 0;
  private current = 0;
  private raf = 0;
  private last = 0;
  private tweenRaf = 0;
  private ro: ResizeObserver;
  smoothing = 0.4; // 0 — без сглаживания, 1 — максимально мягко
  reduced = false;

  private track: HTMLElement;
  private ev: ProgressEvents;

  constructor(track: HTMLElement, ev: ProgressEvents) {
    this.track = track;
    this.ev = ev;
    addEventListener("scroll", this.onScroll, { passive: true });
    addEventListener("resize", this.onScroll);
    for (const t of ["wheel", "touchstart", "keydown"] as const) addEventListener(t, this.onUser, { passive: true });
    this.ro = new ResizeObserver(this.onScroll);
    this.ro.observe(track);
    this.target = this.current = this.fromScroll();
    this.ev.onProgress(this.current, this.target);
  }

  destroy() {
    removeEventListener("scroll", this.onScroll);
    removeEventListener("resize", this.onScroll);
    for (const t of ["wheel", "touchstart", "keydown"] as const) removeEventListener(t, this.onUser);
    this.ro.disconnect();
    cancelAnimationFrame(this.raf);
    cancelAnimationFrame(this.tweenRaf);
  }

  private range() {
    const top = this.track.getBoundingClientRect().top + scrollY;
    return { top, len: Math.max(1, this.track.offsetHeight - innerHeight) };
  }
  fromScroll() {
    const { top, len } = this.range();
    return clamp((scrollY - top) / len);
  }
  get value() {
    return this.current;
  }
  get isTweening() {
    return this.tweenRaf !== 0;
  }

  private onScroll = () => {
    this.target = this.fromScroll();
    if (!this.raf) {
      this.last = performance.now();
      this.raf = requestAnimationFrame(this.step);
    }
  };

  private onUser = (e: Event) => {
    if (!this.tweenRaf) return;
    if (e.type === "keydown") {
      const k = (e as KeyboardEvent).key;
      if (!["ArrowDown", "ArrowUp", "PageDown", "PageUp", " ", "Home", "End"].includes(k)) return;
    }
    this.stop("interrupted");
  };

  private step = (now: number) => {
    const dt = Math.min(0.1, (now - this.last) / 1000);
    this.last = now;
    const tau = this.reduced ? 0 : this.smoothing * 0.45;
    if (tau < 0.001) this.current = this.target;
    else this.current += (this.target - this.current) * (1 - Math.exp(-dt / tau));
    if (Math.abs(this.target - this.current) < 0.0003) this.current = this.target;
    this.ev.onProgress(this.current, this.target);
    this.raf = this.current !== this.target ? requestAnimationFrame(this.step) : 0;
  };

  /** Перевести сборку на прогресс p: мгновенно (ползунок) или плавной перемоткой (кнопки этапов). */
  seek(p: number, durMs = 0, ease: Ease = "cinema") {
    this.stop();
    const { top, len } = this.range();
    const to = top + clamp(p) * len;
    if (durMs <= 0 || this.reduced) {
      scrollTo({ top: to, behavior: "instant" as ScrollBehavior });
      return;
    }
    const from = scrollY;
    const t0 = performance.now();
    const f = easeFn(ease);
    const tick = (now: number) => {
      const k = clamp((now - t0) / durMs);
      scrollTo({ top: from + (to - from) * f(k), behavior: "instant" as ScrollBehavior });
      if (k < 1) this.tweenRaf = requestAnimationFrame(tick);
      else {
        this.tweenRaf = 0;
        this.ev.onTweenEnd?.("done");
      }
    };
    this.tweenRaf = requestAnimationFrame(tick);
  }

  /** Автовоспроизведение: равномерная прокрутка до конца. Любое действие посетителя его останавливает. */
  play(fullDurationMs: number) {
    let p = this.fromScroll();
    if (p >= 0.999) {
      this.seek(0);
      p = 0;
    }
    this.seek(1, Math.max(300, fullDurationMs * (1 - p)), "linear");
  }

  stop(reason: "interrupted" | "silent" = "silent") {
    if (!this.tweenRaf) return;
    cancelAnimationFrame(this.tweenRaf);
    this.tweenRaf = 0;
    if (reason === "interrupted") this.ev.onTweenEnd?.("interrupted");
  }
}
