/**
 * The scene store (ARCHITECTURE.md 3.1): a small external store, no three.
 *
 * Pages reach the scene system only through <SceneSlot>, which calls `requestScene`,
 * `withdrawScene` and `setSlotVisible`. Everything else here is for the host.
 */

import { useSyncExternalStore } from "react";
import { rememberQuality, type Quality } from "../quality/tiers";

export type SceneId = "atlas";
export type SceneMode = "hero";

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

// ---- for pages, through <SceneSlot> ----

export function requestScene(id: SceneId, mode: SceneMode): number {
  clearTimeout(unmountTimer);
  const slot = { token: nextToken++, id, mode };
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
