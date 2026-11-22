/**
 * URL switches for deterministic stills (ARCHITECTURE.md 3.3). Client only.
 *
 *   ?shot=1        render one frame, no loop, no fade (screenshots and posters)
 *   ?t=12          scene time for that frame (only with shot)
 *   ?zoom=1        hold the atlas at a stop whatever the page asks: 0 close in, 1 the galaxy, 2 the web, 3 the supervoid, 4 the universe (only with shot)
 *   ?tier=low|medium|high|static   force a quality and keep it: the governor is off (tests and posters)
 *   ?dive=0.7&focus=core   hold a dive part of the way into a named place (only with shot): stills of the flight
 */

import type { ParticleTier } from "../quality/tiers";

export interface SceneParams {
  shot: boolean;
  time: number | null;
  zoom: number | null;
  tier: ParticleTier | "static" | null;
  dive: number | null;
  focus: string | null;
}

const TIERS = new Set(["low", "medium", "high", "static"]);

let cached: SceneParams | null = null;

export function sceneParams(): SceneParams {
  if (cached) return cached;
  const q = new URLSearchParams(window.location.search);
  const shot = q.get("shot") === "1";
  const t = Number.parseFloat(q.get("t") ?? "");
  const tier = q.get("tier");
  const zoom = Number.parseFloat(q.get("zoom") ?? "");
  const dive = Number.parseFloat(q.get("dive") ?? "");
  cached = {
    shot,
    time: shot ? (Number.isFinite(t) ? t : 12) : null,
    zoom: shot && Number.isFinite(zoom) ? Math.min(4, Math.max(0, zoom)) : null,
    tier: tier && TIERS.has(tier) ? (tier as SceneParams["tier"]) : null,
    dive: shot && Number.isFinite(dive) ? Math.min(1, Math.max(0, dive)) : null,
    focus: shot ? q.get("focus") : null,
  };
  return cached;
}

/** Live scenes start at the same time as the posters, so the cross-fade is seamless. */
export const START_TIME = 12;
