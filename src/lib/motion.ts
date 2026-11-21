/**
 * Whether the scenes move: they hold still when the device asks for reduced motion, and move
 * otherwise. There is no Pause button any more (D-099); the device's own setting decides.
 *
 * The value lives on `<html data-motion="on|paused">` so CSS can react to it. An inline script in
 * the root layout sets it before first paint, and it follows the setting if it changes while the
 * page is open. The scene system (src/scene) reads it through `getMotion` and `subscribeMotion`.
 */

export type Motion = "on" | "paused";

const QUERY = "(prefers-reduced-motion: reduce)";

/** Runs in <head> before paint. Kept tiny and self-contained (no imports). */
export const motionInitScript = `(function(){var d=document.documentElement;d.setAttribute("data-motion",window.matchMedia&&matchMedia(${JSON.stringify(QUERY)}).matches?"paused":"on")})()`;

const listeners = new Set<() => void>();

export function getMotion(): Motion {
  return document.documentElement.dataset.motion === "paused" ? "paused" : "on";
}

/** What the server renders before the client knows the visitor's setting. */
export function getServerMotion(): Motion {
  return "on";
}

if (typeof window !== "undefined") {
  matchMedia(QUERY).addEventListener("change", (event) => {
    document.documentElement.dataset.motion = event.matches ? "paused" : "on";
    listeners.forEach((listener) => listener());
  });
}

export function subscribeMotion(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
