import { clamp, easeFn, type Ease } from "./math";

export type ProgressEvents = {
  /** Каждый кадр, пока сглаженный прогресс догоняет цель. */
  onProgress: (current: number, target: number) => void;
  /** Автовоспроизведение или перемотка закончились или были прерваны. */
  onTweenEnd?: (reason: "done" | "interrupted") => void;
  /** Посетитель сам прокручивает, касается или нажимает клавиши прокрутки. */
  onUserInput?: () => void;
  /** События, которые не считаются прокруткой посетителя (например, касание кнопок панели управления). */
  ignoreInput?: (e: Event) => boolean;
};

const SCROLL_KEYS = ["ArrowDown", "ArrowUp", "PageDown", "PageUp", " ", "Home", "End"];

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
  private tweenExpectY = -1;
  private top = 0;
  private len = 1;
  private ro: ResizeObserver;
  private track: HTMLElement;
  private ev: ProgressEvents;
  smoothing = 0.4; // 0 — без сглаживания, 1 — максимально мягко
  reduced = false;

  constructor(track: HTMLElement, ev: ProgressEvents) {
    this.track = track;
    this.ev = ev;
    addEventListener("scroll", this.onScroll, { passive: true });
    addEventListener("resize", this.onResize);
    addEventListener("orientationchange", this.onResize);
    addEventListener("pageshow", this.onPageShow);
    visualViewport?.addEventListener("resize", this.onResize);
    for (const t of ["wheel", "touchstart", "keydown"] as const) addEventListener(t, this.onUser, { passive: true });
    this.ro = new ResizeObserver(this.onResize);
    this.ro.observe(track);
    this.measure();
    this.target = this.current = this.fromScroll();
    this.ev.onProgress(this.current, this.target);
  }

  destroy() {
    removeEventListener("scroll", this.onScroll);
    removeEventListener("resize", this.onResize);
    removeEventListener("orientationchange", this.onResize);
    removeEventListener("pageshow", this.onPageShow);
    visualViewport?.removeEventListener("resize", this.onResize);
    for (const t of ["wheel", "touchstart", "keydown"] as const) removeEventListener(t, this.onUser);
    this.ro.disconnect();
    cancelAnimationFrame(this.raf);
    cancelAnimationFrame(this.tweenRaf);
    this.raf = this.tweenRaf = 0;
  }

  /** Размеры дорожки кэшируются: при прокрутке читается только scrollY, без пересчёта раскладки. */
  private measure() {
    this.top = this.track.getBoundingClientRect().top + scrollY;
    this.len = Math.max(1, this.track.offsetHeight - innerHeight);
  }
  fromScroll() {
    return clamp((scrollY - this.top) / this.len);
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
  private onResize = () => {
    this.measure();
    this.onScroll();
  };
  /** Возврат на страницу (в том числе из кэша Safari): состояние сразу берётся из прокрутки, без анимации. */
  private onPageShow = () => {
    this.measure();
    this.target = this.current = this.fromScroll();
    this.ev.onProgress(this.current, this.target);
  };

  private onUser = (e: Event) => {
    if (e.type === "keydown" && !SCROLL_KEYS.includes((e as KeyboardEvent).key)) return;
    if (this.ev.ignoreInput?.(e)) return;
    this.ev.onUserInput?.();
    if (this.tweenRaf) this.stop("interrupted");
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

  /** Сглаженный прогресс сразу становится равен прокрутке (например, после смены режима движения). */
  snap() {
    this.measure();
    this.target = this.current = this.fromScroll();
    this.ev.onProgress(this.current, this.target);
  }

  /** Перевести сборку на прогресс p: мгновенно (ползунок) или плавной перемоткой (кнопки этапов). */
  seek(p: number, durMs = 0, ease: Ease = "cinema") {
    this.stop();
    this.measure();
    const to = Math.round(this.top + clamp(p) * this.len);
    if (durMs <= 0 || this.reduced) {
      scrollTo({ top: to, behavior: "instant" as ScrollBehavior });
      return;
    }
    const from = scrollY;
    const t0 = performance.now();
    const f = easeFn(ease);
    this.tweenExpectY = from;
    const tick = (now: number) => {
      // Если прокрутка ушла не туда, куда её ставила перемотка (полоса прокрутки, жест) — уступаем посетителю.
      if (Math.abs(scrollY - this.tweenExpectY) > 3) {
        this.tweenRaf = 0;
        this.ev.onTweenEnd?.("interrupted");
        return;
      }
      const k = clamp((now - t0) / durMs);
      const y = Math.round(from + (to - from) * f(k));
      scrollTo({ top: y, behavior: "instant" as ScrollBehavior });
      this.tweenExpectY = scrollY;
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
