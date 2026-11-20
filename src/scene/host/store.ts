/**
 * The scene store (ARCHITECTURE.md 3.1): a small external store, no three.
 *
 * Pages reach the scene system only through <SceneSlot> and the functions in the "for pages"
 * sections: the slot calls `requestScene`, `withdrawScene` and `setSlotVisible`; a page's own
 * controls call `setSceneInput` (scroll, wheel, drag, keys) and read what the scene drew through
 * `subscribeSceneFrame`. Everything else here is for the host.
 */

import { useSyncExternalStore } from "react";
import { rememberQuality, type Quality } from "../quality/tiers";

export type SceneId = "atlas" | "black-hole" | "nebula" | "quasar";
/** How the page drives the scene: by scroll position (`/`), by free control (`/explore`), or not at all (a subject page). */
export type SceneMode = "scroll" | "explore" | "subject";

/** The zoom a page opens on: the hero on `/`, the chart on `/explore`. */
const OPENING_ZOOM: Record<SceneMode, number> = { scroll: 0, explore: 1, subject: 0 };

export interface SlotRequest {
  token: number;
  id: SceneId;
  mode: SceneMode;
}

export type SceneStatus = "ok" | "lost";

export interface SceneState {
  /** True once any page has asked for a scene. The host then stays for the visit: one WebGL context. */
  asked: boolean;
  /** What the current page asks for. */
  slot: SlotRequest | null;
  /** What the canvas holds; lags `slot` by the fade-out when a page leaves. */
  mounted: SlotRequest | null;
  slotVisible: boolean;
  /** Null until a slot first asks for a scene and the device is checked. */
  quality: Quality | null;
  /** Token of the slot whose scene has drawn its first frame. */
  readyToken: number | null;
  status: SceneStatus;
}

const FADE_MS = 300;

const initial: SceneState = {
  asked: false,
  slot: null,
  mounted: null,
  slotVisible: false,
  quality: null,
  readyToken: null,
  status: "ok",
};

let state = initial;
let nextToken = 1;
let unmountTimer: ReturnType<typeof setTimeout> | undefined;
const listeners = new Set<() => void>();

function set(patch: Partial<SceneState>): void {
  state = { ...state, ...patch };
  listeners.forEach((listener) => listener());
}

export function getSceneState(): SceneState {
  return state;
}

export function subscribeScene(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Select a primitive or a stored object; never build a new object in the selector. */
export function useSceneState<T>(select: (s: SceneState) => T): T {
  return useSyncExternalStore(
    subscribeScene,
    () => select(state),
    () => select(initial),
  );
}

/** True while this page's scene is drawn on the canvas: the DOM may then be laid over it. */
export const sceneIsLive = (s: SceneState): boolean =>
  s.slot !== null && s.readyToken === s.slot.token && s.status === "ok" && s.quality !== "static";

// ---- for pages, through <SceneSlot> ----

export function requestScene(id: SceneId, mode: SceneMode): number {
  clearTimeout(unmountTimer);
  const slot = { token: nextToken++, id, mode };
  input.zoom = OPENING_ZOOM[mode];
  input.yaw = 0;
  input.pitch = 0;
  set({ asked: true, slot, mounted: slot, slotVisible: true });
  return slot.token;
}

export function withdrawScene(token: number): void {
  if (state.slot?.token !== token) return;
  set({ slot: null, slotVisible: false });
  // "ready" describes the page on screen; a page without a scene must not inherit it
  const root = document.documentElement.dataset;
  if (root.scene === "ready") delete root.scene;
  // Let the canvas fade to --space before the scene is unmounted and disposed.
  unmountTimer = setTimeout(() => {
    if (!state.slot) set({ mounted: null, readyToken: null });
  }, FADE_MS);
}

export function setSlotVisible(token: number, visible: boolean): void {
  if (state.slot?.token === token && state.slotVisible !== visible) set({ slotVisible: visible });
}

// ---- for pages: what the visitor asks of the scene ----

/**
 * Where the visitor wants the camera. Not React state: it changes on every scroll and pointer
 * event, and the host eases toward it frame by frame.
 */
export interface SceneInput {
  /** 0 hero, 1 chart, 2 cosmic web (ARCHITECTURE.md 4). */
  zoom: number;
  /** Turn about the vertical axis, in radians, from free control. */
  yaw: number;
  /** Tilt, in radians, from free control. */
  pitch: number;
}

export const ZOOM_MIN = 0;
export const ZOOM_MAX = 2;
const PITCH_LIMIT = 0.3;

const input: SceneInput = { zoom: 0, yaw: 0, pitch: 0 };
let inputListener: (() => void) | null = null;

export function getSceneInput(): Readonly<SceneInput> {
  return input;
}

export function setSceneInput(patch: Partial<SceneInput>): void {
  if (patch.zoom !== undefined) input.zoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, patch.zoom));
  if (patch.yaw !== undefined) input.yaw = patch.yaw;
  if (patch.pitch !== undefined) input.pitch = Math.min(PITCH_LIMIT, Math.max(-PITCH_LIMIT, patch.pitch));
  inputListener?.();
}

// ---- for pages: what the scene drew ----

export interface ScenePoint {
  /** CSS pixels from the top left of the viewport. */
  x: number;
  y: number;
  /** False when the point is behind the camera. */
  on: boolean;
}

/**
 * What the DOM needs to draw over a frame (beacons and their labels). One object per scene,
 * rewritten in place each frame: read it inside the listener, do not keep it.
 */
export interface SceneFrame {
  /** The zoom this frame was drawn at (the eased value, not the input). */
  zoom: number;
  width: number;
  height: number;
  /** True when the scene used its phone composition. */
  narrow: boolean;
  /** Named places in the scene, projected to the screen. */
  points: Record<string, ScenePoint>;
  /** A length in CSS pixels that scales with the subject, for sizing leader lines. */
  radius: number;
  /** How bright the scenery is under a screen point, 0 to 1. */
  shade: (x: number, y: number) => number;
}

const frameListeners = new Set<(frame: SceneFrame) => void>();
let lastFrame: SceneFrame | null = null;

/** Called once per drawn frame, in the same animation frame as the draw. */
export function subscribeSceneFrame(listener: (frame: SceneFrame) => void): () => void {
  frameListeners.add(listener);
  return () => {
    frameListeners.delete(listener);
  };
}

/** The last frame drawn for the page on screen, or null. */
export function getSceneFrame(): SceneFrame | null {
  return state.slot ? lastFrame : null;
}

// ---- for the host ----

export function setQuality(quality: Quality, remember = true): void {
  if (remember) rememberQuality(quality);
  set({ quality });
  const root = document.documentElement.dataset;
  root.sceneQuality = String(quality);
  if (quality === "static") root.scene = "static";
}

export function markReady(token: number): void {
  if (state.readyToken !== token) set({ readyToken: token });
  document.documentElement.dataset.scene = "ready";
}

export function setStatus(status: SceneStatus): void {
  if (state.status !== status) set({ status });
}

/** The host asks to be told when the input changes, so it can draw a frame while the loop is stopped. */
export function onSceneInput(listener: () => void): () => void {
  inputListener = listener;
  return () => {
    if (inputListener === listener) inputListener = null;
  };
}

export function publishSceneFrame(frame: SceneFrame): void {
  lastFrame = frame;
  frameListeners.forEach((listener) => listener(frame));
}
