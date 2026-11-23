/**
 * The flow between scenes (D-096). No three: pages call `diveInto` and `pullOut`, and the Veil in
 * the root layout shows what it says.
 *
 * Going in: the atlas camera dives into the place's anchor, the screen passes through the
 * place's own dark colour (the veil), the place's page opens under it, and the place grows in
 * from far off as the veil lifts. Going out is the same, reversed: the place shrinks away, the
 * atlas opens dived into that anchor and pulls back to the stop the place was found at.
 *
 * With reduced motion there is no dive and no growth, only a short cross-fade through
 * the veil.
 */


import { useSyncExternalStore } from "react";
import { animateSceneInput, getSceneState, setOpening, setSceneInput, subscribeScene, type SceneInput } from "./store";
import { playSample } from "@/lib/sound";
import { sceneParams } from "./params";

/**
 * `diving`: the camera is moving, the veil is up but takes clicks, so nothing else starts.
 * `leaving`: the veil falls. `veiled`: the next page is opening under it. `lifting`: it fades.
 */
export type FlowPhase = "idle" | "diving" | "leaving" | "veiled" | "lifting";

export interface FlowState {
  phase: FlowPhase;
  /** The veil's colour: the darkness of the scene on the far side. */
  veil: string;
}

const DIVE_MS = 1400;
const VEIL_AT = 900; // the veil starts to fall this far into the dive
const SHRINK_MS = 900;
const SHRINK_VEIL_AT = 350;
const ARRIVE_MS = 1700;
const UNDO_MS = 700; // a move called off: the camera glides back
const CALM_MS = 220; // reduced motion: the whole cross-fade, each way
/** The veil's own fade, in CSS; kept here so the phases wait for it. */
export const VEIL_FADE_MS = { normal: 500, calm: CALM_MS } as const;

const SPACE = "#090a1c";
let state: FlowState = { phase: "idle", veil: SPACE };
const listeners = new Set<() => void>();
let timers: ReturnType<typeof setTimeout>[] = [];
/** What to do once the next page's scene has drawn its first frame. */
let onArrive: (() => void) | null = null;
let leftToken: number | null = null;
/** The page the move started from, and the glide that undoes its first half. */
let leftPath: string | null = null;
let undo: Partial<Record<"dive" | "arrive", number>> = {};

function set(patch: Partial<FlowState>): void {
  state = { ...state, ...patch };
  listeners.forEach((listener) => listener());
}

export function getFlow(): FlowState {
  return state;
}

export function subscribeFlow(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useFlow<T>(select: (s: FlowState) => T): T {
  return useSyncExternalStore(
    subscribeFlow,
    () => select(state),
    () => select({ phase: "idle", veil: SPACE }),
  );
}

/** True when stillness is asked for: the device's reduced motion (data-motion), or a still for a screenshot. */
export function calm(): boolean {
  return document.documentElement.dataset.motion === "paused" || matchMedia("(prefers-reduced-motion: reduce)").matches || sceneParams().shot;
}

function later(ms: number, run: () => void): void {
  timers.push(setTimeout(run, ms));
}

function reset(): void {
  timers.forEach(clearTimeout);
  timers = [];
  onArrive = null;
}

/** True while a move between scenes is under way, from the first click: a second one waits. */
export function flowBusy(): boolean {
  return state.phase !== "idle";
}

/**
 * Leaves for another scene's page. `opening` is the view the next scene starts on once motion
 * is allowed; `arrive` is the glide that then brings it to rest.
 */
function leave(push: (href: string) => void, href: string, veil: string, out: { glide: Partial<Record<"dive" | "arrive", number>>; ms: number; veilAt: number; undo: Partial<Record<"dive" | "arrive", number>> }, opening: Partial<SceneInput>, rest: Partial<SceneInput>, arrive: Partial<Record<"dive" | "arrive" | "zoom", number>>): void {
  if (flowBusy()) return;
  reset();
  leftToken = getSceneState().slot?.token ?? null;
  leftPath = location.pathname;
  undo = out.undo;
  // Back, or another link, before the page has changed: the move is called off, never forced through
  const go = (next: Partial<SceneInput>, then: () => void) => {
    if (location.pathname !== leftPath) return cancelFlow();
    setOpening(next);
    set({ phase: "veiled" });
    onArrive = then;
    push(href);
  };
  playSample("travel"); // the owner's warp-out, into a place or back out of one (D-114)
  if (calm()) {
    set({ phase: "leaving", veil });
    later(CALM_MS, () => go({ ...opening, ...rest }, lift));
    return;
  }
  set({ phase: "diving", veil });
  animateSceneInput(out.glide, out.ms);
  later(out.veilAt, () => set({ phase: "leaving" }));
  later(out.ms, () =>
    go(opening, () => {
      animateSceneInput(arrive, ARRIVE_MS);
      lift();
    }),
  );
}

/** From the atlas into a place: dive into its anchor, then open its page. */
export function diveInto(push: (href: string) => void, href: string, anchor: string, veil: string): void {
  if (flowBusy()) return;
  setSceneInput({ focus: anchor });
  leave(push, href, veil, { glide: { dive: 1 }, ms: DIVE_MS, veilAt: VEIL_AT, undo: { dive: 0 } }, { arrive: 0 }, { arrive: 1 }, { arrive: 1 });
}

/**
 * From anywhere straight to a place (D-139: search and the dock's Places): no anchor to dive into,
 * so the veil falls at once and the place arrives as after a dive.
 */
export function jumpTo(push: (href: string) => void, href: string, veil: string): void {
  if (location.pathname === href) return;
  leave(push, href, veil, { glide: {}, ms: JUMP_MS, veilAt: 0, undo: {} }, { arrive: 0 }, { arrive: 1 }, { arrive: 1 });
}
const JUMP_MS = 600;

/** From a place back out to the atlas, at the stop the place was found at. */
export function pullOut(push: (href: string) => void, href: string, anchor: string, zoom: number, veil: string): void {
  leave(push, href, veil, { glide: { arrive: 0 }, ms: SHRINK_MS, veilAt: SHRINK_VEIL_AT, undo: { arrive: 1 } }, { zoom, focus: anchor, dive: 1 }, { dive: 0 }, { dive: 0 });
}

/** The veil lifts; the flow is idle once it has faded. The next scene's opening has been used. */
function lift(): void {
  onArrive = null;
  setOpening({});
  set({ phase: "lifting" });
  later(calm() ? CALM_MS : VEIL_FADE_MS.normal + 200, () => set({ phase: "idle", veil: SPACE }));
}

/**
 * Calls the move off: no page change is pushed, no opening is left for a later page, and if the
 * scene it started from is still on screen, its camera glides back to where it was.
 */
export function cancelFlow(): void {
  if (state.phase === "idle") return;
  reset();
  setOpening({});
  if (getSceneState().slot?.token === leftToken) {
    if (calm()) setSceneInput(undo);
    else animateSceneInput(undo, UNDO_MS);
  }
  set({ phase: "lifting" });
  later(VEIL_FADE_MS.normal, () => set({ phase: "idle", veil: SPACE }));
}

/** Lifts the veil whatever happened: the next page drew no scene (no WebGL), or it never came. */
export function releaseFlow(): void {
  if (state.phase !== "veiled") return;
  if (getSceneState().slot?.token === leftToken) cancelFlow(); // the page never changed (Back, mid-move)
  else lift();
}

/** The page changed while the move was still on the page it started from (Back, a header link). */
export function flowPathChanged(path: string): void {
  if ((state.phase === "diving" || state.phase === "leaving") && leftPath !== null && path !== leftPath) cancelFlow();
}

// The next page's scene has drawn its first frame: bring it to rest and lift the veil.
if (typeof window !== "undefined") {
  subscribeScene(() => {
    if (state.phase !== "veiled" || !onArrive) return;
    const s = getSceneState();
    if (!s.slot || s.slot.token === leftToken || s.readyToken !== s.slot.token) return;
    const run = onArrive;
    onArrive = null;
    // one frame more, so the first frame of the new scene is the one under the veil
    requestAnimationFrame(() => {
      if (state.phase === "veiled") run();
    });
  });
}
