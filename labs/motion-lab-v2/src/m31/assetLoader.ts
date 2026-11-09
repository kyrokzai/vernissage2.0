/*
 * Загрузка согласованных фото-кадров этапов (реальные материалы VERNISSAGE).
 * Сейчас реальных кадров нет, поэтому по умолчанию работает демонстрационная векторная сцена.
 * Кадры можно подключить без пересборки: m31.html?plates=/путь/stage-{n}.webp  ({n} = 0…5).
 * Требования к кадрам — в README, раздел M3.1.
 */
export type Plate = { src: string; srcset?: string };
export type PlateManifest = { plates: Plate[] };
export type LoadResult = { mode: "photo" | "demo"; failed: string[]; reason?: string };

export function manifestFromURL(stageCount: number, search = location.search): PlateManifest | null {
  const tpl = new URLSearchParams(search).get("plates");
  if (!tpl || !tpl.includes("{n}")) return null;
  return { plates: Array.from({ length: stageCount }, (_, n) => ({ src: tpl.replace("{n}", String(n)) })) };
}

function loadOne(p: Plate, timeoutMs: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    const t = setTimeout(() => { img.src = ""; reject(new Error(`timeout: ${p.src}`)); }, timeoutMs);
    signal?.addEventListener("abort", () => { clearTimeout(t); img.src = ""; reject(new Error("aborted")); }, { once: true });
    img.onload = () => {
      clearTimeout(t);
      (img.decode ? img.decode() : Promise.resolve()).then(resolve, resolve);
    };
    img.onerror = () => { clearTimeout(t); reject(new Error(`failed: ${p.src}`)); };
    if (p.srcset) img.srcset = p.srcset;
    img.src = p.src;
  });
}

/** Порядок важности: пустое помещение и финал первыми, затем промежуточные этапы. */
export async function loadPlates(m: PlateManifest, opts: { timeoutMs?: number; signal?: AbortSignal } = {}): Promise<LoadResult> {
  const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  if (conn?.saveData) return { mode: "demo", failed: [], reason: "экономия трафика" };
  const order = [0, m.plates.length - 1, ...m.plates.map((_, i) => i).slice(1, -1)];
  const failed: string[] = [];
  const results = await Promise.allSettled(order.map((i) => loadOne(m.plates[i], opts.timeoutMs ?? 8000, opts.signal)));
  results.forEach((r, k) => { if (r.status === "rejected") failed.push(m.plates[order[k]].src); });
  if (opts.signal?.aborted) return { mode: "demo", failed, reason: "отменено" };
  return failed.length ? { mode: "demo", failed, reason: "не все кадры загрузились" } : { mode: "photo", failed };
}
