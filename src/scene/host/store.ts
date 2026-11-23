/**
 * The scene store (ARCHITECTURE.md 3.1): a small external store, no three.
 *
 * Pages reach the scene system only through <SceneSlot> and the functions in the "for pages"
 * sections: the slot calls `requestScene`, `withdrawScene` and `setSlotVisible`; a page's own
 * controls call `setSceneInput` (wheel, drag, keys) or `animateSceneInput` (a click: a timed
 * glide) and read what the scene drew through `subscribeSceneFrame`. The flow between scenes
 * (flow.ts) sets the next scene's opening view with `setOpening`. Everything else is for the host.
 */

import { useSyncExternalStore } from "react";
import { rememberQuality, type Quality } from "../quality/tiers";

export type SceneId = "atlas" | "black-hole" | "nebula" | "quasar" | "neutron-star" | "star" | "strange-star" | "dyson-sphere" | "moon" | "solar-system" | "blue-world" | "asteroid" | "quasar-galaxy" | "quasi-star" | "gravastar" | "supernova-remnant" | "magnetar" | "black-hole-merger" | "comet" | "ringed-giant" | "wormhole";
/** The atlas (`/`, free control and zoom stops) or one place (a page of its own). */
export type SceneMode = "atlas" | "place";

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

export function requestScene(id: SceneId, mode: SceneMode, wanted: Partial<SceneInput> = {}): number {
  clearTimeout(unmountTimer);
  const slot = { token: nextToken++, id, mode };
  // every scene opens all the way in (D-112): the atlas close to the disc, a place as large as it
  // gets, unless the page asks for another view; the flow between scenes, when one is under way, wins
  const flowing = Object.keys(opening).length > 0;
  // (the flow clears the opening once the move is over, not here: React's development mode mounts a slot twice)
  Object.assign(input, { zoom: 0, yaw: 0, pitch: 0, focus: null, dive: 0, arrive: 1, intro: 0 }, flowing ? opening : wanted);
  tweens.clear();
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
  /** The atlas's stops: 0 close in, 1 the whole galaxy, 2 the cosmic web, 3 the supervoid, 4 the observable universe (ARCHITECTURE.md 4, D-130). */
  zoom: number;
  /** Turn about the vertical axis, in radians, from free control. */
  yaw: number;
  /** Tilt, in radians, from free control. */
  pitch: number;
  /** The atlas anchor the camera dives toward, or null. */
  focus: string | null;
  /** How far the atlas camera has dived into `focus`: 0 not at all, 1 inside it. */
  dive: number;
  /** How far a place scene has arrived: 0 small and far off, 1 whole (D-096). */
  arrive: number;
  /** The atlas's start page: 1 its view (the galaxy on the right, the planet and ship before it), 0 the galaxy (D-107). */
  intro: number;
}

/** The numbers in SceneInput: what a glide can move. */
export type SceneNumber = "zoom" | "yaw" | "pitch" | "dive" | "arrive" | "intro";

export const ZOOM_MIN = 0;
export const ZOOM_MAX = 4;
const PITCH_LIMIT = 0.3;

const input: SceneInput = { zoom: 0, yaw: 0, pitch: 0, focus: null, dive: 0, arrive: 1, intro: 0 };
let inputListener: (() => void) | null = null;
let opening: Partial<SceneInput> = {};

/** A timed glide of one number, from where the camera was drawn when it started. */
export interface SceneTween {
  from: number | null;
  to: number;
  start: number;
  ms: number;
}
const tweens = new Map<SceneNumber, SceneTween>();

const clampInput = (key: SceneNumber, value: number) =>
  key === "zoom" ? Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, value)) : key === "pitch" ? Math.min(PITCH_LIMIT, Math.max(-PITCH_LIMIT, value)) : key === "dive" || key === "arrive" || key === "intro" ? Math.min(1, Math.max(0, value)) : value;

export function getSceneInput(): Readonly<SceneInput> {
  return input;
}

/** Moves the camera's target; the host eases toward it. Cancels any glide of the same numbers. */
export function setSceneInput(patch: Partial<SceneInput>): void {
  for (const key of ["zoom", "yaw", "pitch", "dive", "arrive", "intro"] as const) {
    const value = patch[key];
    if (value === undefined) continue;
    input[key] = clampInput(key, value);
    tweens.delete(key);
  }
  if (patch.focus !== undefined) input.focus = patch.focus;
  inputListener?.();
}

/** A click's move: each number glides to its target over `ms`, eased in and out (D-097). */
export function animateSceneInput(patch: Partial<Record<SceneNumber, number>>, ms: number): void {
  const start = performance.now();
  for (const [key, value] of Object.entries(patch) as [SceneNumber, number][]) {
    input[key] = clampInput(key, value);
    tweens.set(key, { from: null, to: input[key], start, ms });
  }
  inputListener?.();
}

/** The glides in progress; the host fills in `from` on the first frame of each. */
export function getSceneTweens(): ReadonlyMap<SceneNumber, SceneTween> {
  return tweens;
}

export function endSceneTween(key: SceneNumber): void {
  tweens.delete(key);
}

/** The view the next scene a page asks for opens on (the flow between scenes), until the flow clears it. */
export function setOpening(patch: Partial<SceneInput>): void {
  opening = { ...patch };
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
 * What the DOM needs to place over a frame (hotspots). One object per scene,
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
  /** A length in CSS pixels that scales with the subject on screen. */
  radius: number;
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
