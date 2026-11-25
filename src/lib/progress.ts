/**
 * What the visitor has found (D-206): the places they have visited, remembered in this browser,
 * and the one place a hint is pointing at right now. The Places menu reads it: a visited place is
 * unlocked (a choice flies there), one whose parent scene is open to them is a hint (a choice flies
 * to that parent and lights the place's beacon there), the rest are locked. The atlas's levels count
 * as places too (D-207): the galaxy once the visitor is past Begin, the cosmic web once they reach
 * it, so nothing is a hint before they have been there. Client only.
 */

import { useSyncExternalStore } from "react";

const VISITED_KEY = "cosmic-atlas:visited";
const HINT_KEY = "cosmic-atlas:hint";

let visited: ReadonlySet<string> = new Set();
let hint: string | null = null;
const listeners = new Set<() => void>();
const EMPTY: ReadonlySet<string> = new Set();

if (typeof window !== "undefined") {
  try {
    const saved = JSON.parse(localStorage.getItem(VISITED_KEY) ?? "[]");
    if (Array.isArray(saved)) visited = new Set(saved.filter((id): id is string => typeof id === "string"));
    hint = sessionStorage.getItem(HINT_KEY);
  } catch {
    // storage blocked: nothing found yet, for this visit
  }
}

const emit = () => listeners.forEach((listener) => listener());
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

/** A place's page has opened: it is found for good, and a hint pointing at it is done. */
export function markVisited(id: string): void {
  let changed = false;
  if (!visited.has(id)) {
    visited = new Set([...visited, id]);
    changed = true;
    try {
      localStorage.setItem(VISITED_KEY, JSON.stringify([...visited]));
    } catch {
      // storage blocked: found for this visit only
    }
  }
  if (hint === id) {
    setHint(null);
    return;
  }
  if (changed) emit();
}

/** The place whose beacon should glow, or null. Held for the session, so it survives the flight to its parent. */
export function setHint(id: string | null): void {
  if (hint === id) return;
  hint = id;
  try {
    if (id) sessionStorage.setItem(HINT_KEY, id);
    else sessionStorage.removeItem(HINT_KEY);
  } catch {
    // storage blocked: the hint holds while this page does
  }
  emit();
}

export function getHint(): string | null {
  return hint;
}

/**
 * For a scene's effect: returns the cleanup that ends a hint shown among `ids` when the visitor
 * leaves that scene without taking it. Only once it has been up a moment, so React's dev-mode
 * mount, unmount and mount again does not end a hint that has just arrived.
 */
export function dropHintOnLeave(ids: readonly string[]): () => void {
  const since = performance.now();
  return () => {
    if (performance.now() - since > 1500 && hint !== null && ids.includes(hint)) setHint(null);
  };
}

export function useVisited(): ReadonlySet<string> {
  return useSyncExternalStore(subscribe, () => visited, () => EMPTY);
}

export function useHint(): string | null {
  return useSyncExternalStore(subscribe, () => hint, () => null);
}

export type Access = "unlocked" | "hint" | "locked";

/** A place's state in the menu: `parent` is the place or atlas level (`atlas:galaxy`, `atlas:web`) it is found in. */
export function accessOf(id: string, parent: string, found: ReadonlySet<string>): Access {
  if (found.has(id)) return "unlocked";
  return found.has(parent) ? "hint" : "locked";
}
