/**
 * The site-wide "Pause motion" preference (WCAG 2.2.2).
 *
 * The value lives on `<html data-motion="on|paused">` so CSS can react to it, and in
 * localStorage so it survives visits. An inline script in the root layout sets it
 * before first paint; reduced motion defaults it to paused. The scene system
 * (src/scene) reads it through `getMotion` and `subscribeMotion`.
 */

export type Motion = "on" | "paused";

export const MOTION_STORAGE_KEY = "cosmic-archive:motion";

/** Runs in <head> before paint. Kept tiny and self-contained (no imports). */
export const motionInitScript = `(function(){var d=document.documentElement,m;try{m=localStorage.getItem(${JSON.stringify(
  MOTION_STORAGE_KEY,
)})}catch(e){}if(m!=="on"&&m!=="paused"){m=window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches?"paused":"on"}d.setAttribute("data-motion",m)})()`;

const listeners = new Set<() => void>();

export function getMotion(): Motion {
  return document.documentElement.dataset.motion === "paused" ? "paused" : "on";
}

/** What the server renders before the client knows the visitor's choice. */
export function getServerMotion(): Motion {
  return "on";
}

export function setMotion(next: Motion): void {
  document.documentElement.dataset.motion = next;
  try {
    localStorage.setItem(MOTION_STORAGE_KEY, next);
  } catch {
    // Storage can be blocked (private mode); the choice still holds for this page view.
  }
  listeners.forEach((listener) => listener());
}

/** Keeps other open tabs in step: one site-wide setting, not one per tab. */
function onStorage(event: StorageEvent): void {
  if (event.key !== MOTION_STORAGE_KEY) return;
  if (event.newValue !== "on" && event.newValue !== "paused") return;
  document.documentElement.dataset.motion = event.newValue;
  listeners.forEach((listener) => listener());
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", onStorage);
}

export function subscribeMotion(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
