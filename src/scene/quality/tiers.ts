/**
 * Quality tiers (ARCHITECTURE.md 3.4). No three here: the loader uses this before any 3D code loads.
 *
 * A "rung" is one step of the governor's ladder. Stepping down goes pixels first, then
 * particle count, then glow (3.5). `still` is not a rung: it is the loop being stopped
 * (reduced motion), with the counts of whatever rung is active.
 */

export type ParticleTier = "low" | "medium" | "high";

export interface Rung {
  name: string;
  pixels: ParticleTier;
  particles: ParticleTier;
  /** Fraction of the large glow sprites drawn. */
  glow: 1 | 0.5;
}

export const RUNGS: readonly Rung[] = [
  { name: "high", pixels: "high", particles: "high", glow: 1 },
  { name: "medium", pixels: "medium", particles: "medium", glow: 1 },
  { name: "medium-pixels", pixels: "low", particles: "medium", glow: 1 },
  { name: "low", pixels: "low", particles: "low", glow: 1 },
  { name: "low-glow", pixels: "low", particles: "low", glow: 0.5 },
];

export const RUNG_HIGH = 0;
export const RUNG_MEDIUM = 1;
export const RUNG_LOW = 3;
export const LAST_RUNG = RUNGS.length - 1;

/** A rung index, or `static`: the poster only, no WebGL. */
export type Quality = number | "static";

/** Canvas pixels per tier: the same cost on a phone and on a large monitor. */
export const PIXEL_BUDGET: Record<ParticleTier, number> = {
  low: 1.2e6,
  medium: 2.3e6,
  high: 4e6,
};

export function pixelRatio(rung: Rung, cssWidth: number, cssHeight: number, deviceRatio: number): number {
  const fit = Math.sqrt(PIXEL_BUDGET[rung.pixels] / Math.max(1, cssWidth * cssHeight));
  return Math.min(deviceRatio || 1, fit);
}

const SESSION_KEY = "cosmic-archive:quality";

export function rememberQuality(quality: Quality): void {
  try {
    sessionStorage.setItem(SESSION_KEY, quality === "static" ? "static" : RUNGS[quality].name);
  } catch {
    // storage blocked: the governor just starts fresh next page view
  }
}

function recalled(): Quality | null {
  try {
    const name = sessionStorage.getItem(SESSION_KEY);
    if (name === "static") return "static";
    const index = RUNGS.findIndex((rung) => rung.name === name);
    return index >= 0 ? index : null;
  } catch {
    return null;
  }
}

function hasWebGL2(): boolean {
  try {
    const gl = document.createElement("canvas").getContext("webgl2");
    if (!gl) return false;
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return true;
  } catch {
    return false;
  }
}

type NavigatorHints = Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };

/**
 * Picks the starting quality. A first visit never starts on `high`: the governor earns it, and
 * the session then remembers what it settled on.
 * `override` comes from `?tier=` (tests and posters) and wins over everything.
 */
export function detectQuality(override: ParticleTier | "static" | null): Quality {
  if (override === "static") return "static";
  if (override) return override === "high" ? RUNG_HIGH : override === "medium" ? RUNG_MEDIUM : RUNG_LOW;

  const remembered = recalled();
  if (remembered !== null) return remembered;

  const nav = navigator as NavigatorHints;
  if (!hasWebGL2() || nav.connection?.saveData) return "static";

  const touchSmall = matchMedia("(pointer: coarse)").matches && Math.min(innerWidth, innerHeight) < 600;
  const fewCores = (nav.hardwareConcurrency ?? 8) <= 4;
  const smallMemory = (nav.deviceMemory ?? 8) <= 4;
  return touchSmall || fewCores || smallMemory ? RUNG_LOW : RUNG_MEDIUM;
}
