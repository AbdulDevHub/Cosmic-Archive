/**
 * The flights (D-151): a guided route through the places, or the hands-off tour. No three.
 *
 * A flight keeps which of its stops the visitor is at. Each step is the site's own move between
 * scenes (flow.ts): a place inside the one before is dived into through its body (the white dwarf
 * in its nebula, the quasar in its galaxy); any other is reached as the last place shrinks away,
 * through the veil, and the next one arrives.
 *
 * A guided flight moves on when the visitor presses Next. The tour moves on by itself, a few
 * seconds at each place, drifting the camera slowly back and round while it waits; with reduced
 * motion there is no drift, each place is a still and the moves are the short cross-fade.
 * Skip ends it at any moment, and so does anything that takes the visitor elsewhere (Zoom Out, a
 * hotspot, Back, search): the flight never fights the visitor.
 *
 * Sound: a flight only starts from a click in the dock, so every warp it plays comes after the
 * visitor's first gesture (D-100). It lives in memory only: a reload ends it.
 */

import { useSyncExternalStore } from "react";
import { calm, diveInto, flowBusy, flyOn, getFlow, jumpTo, subscribeFlow } from "@/scene/host/flow";
import { animateSceneInput, getSceneInput } from "@/scene/host/store";
import type { MenuFlight } from "./content/menu";
import { setVia } from "./via";

type Push = (href: string) => void;

export interface FlightState {
  flight: MenuFlight | null;
  /** The stop the flight is at, or flying to. */
  index: number;
  /** True from a step's first moment until the next place's page is up. */
  moving: boolean;
}

/** How long the tour stays at each place, once it has arrived; a little longer as stills. */
const TOUR_MS = 9000;
const TOUR_CALM_MS = 10000;
/** While it waits, the tour's camera eases back from all the way in and turns a little. */
const DRIFT_ZOOM = 0.4;
const DRIFT_YAW = 0.3;

const EMPTY: FlightState = { flight: null, index: 0, moving: false };
let state: FlightState = EMPTY;
const listeners = new Set<() => void>();
let push: Push | null = null;
let dwell: ReturnType<typeof setTimeout> | undefined;

function set(patch: Partial<FlightState>): void {
  state = { ...state, ...patch };
  listeners.forEach((listener) => listener());
}

export function getFlight(): FlightState {
  return state;
}

export function useFlight<T>(select: (s: FlightState) => T): T {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => select(state),
    () => select(EMPTY),
  );
}

const hrefOf = (id: string) => `/${id}`;

/** The router's push, kept fresh by the flight bar. */
export function setFlightPush(next: Push): void {
  push = next;
}

function clearDwell(): void {
  clearTimeout(dwell);
  dwell = undefined;
}

/** Starts a flight from its first stop: flown to at once, or begun here if the visitor is already there. */
export function startFlight(flight: MenuFlight, go: Push): void {
  if (flowBusy() || flight.steps.length === 0) return;
  push = go;
  clearDwell();
  const first = flight.steps[0];
  set({ flight, index: 0, moving: false });
  if (location.pathname === hrefOf(first.id)) {
    settle();
    return;
  }
  set({ moving: true });
  setVia(first.id, null); // Zoom Out goes the usual way from a flight's stops
  jumpTo(go, hrefOf(first.id), first.veil);
  if (!flowBusy()) set({ moving: false }); // the move did not start
}

/** On to the next stop; at the last one, the flight ends. */
export function nextStep(): void {
  const { flight, index, moving } = state;
  if (!flight || moving || flowBusy() || !push) return;
  const at = flight.steps[index];
  const next = flight.steps[index + 1];
  if (!next) {
    endFlight();
    return;
  }
  clearDwell();
  set({ index: index + 1, moving: true });
  const href = hrefOf(next.id);
  setVia(next.id, null);
  // a place inside this one is dived into through its body; any other is flown on to
  if (next.inside === at.id && location.pathname === hrefOf(at.id)) diveInto(push, href, next.anchor, next.veil);
  else flyOn(push, href, next.veil);
  if (!flowBusy()) set({ index, moving: false });
}

export function endFlight(): void {
  clearDwell();
  if (state.flight) set(EMPTY);
}

/** The visitor is at the flight's current stop and the veil is up: the tour waits there, then moves on. */
function settle(): void {
  const { flight, index } = state;
  if (!flight || flight.kind !== "tour") return;
  clearDwell();
  const still = calm();
  if (!still) {
    const { yaw } = getSceneInput();
    animateSceneInput({ zoom: DRIFT_ZOOM, yaw: yaw + DRIFT_YAW }, TOUR_MS);
  }
  const wait = (ms: number) => {
    dwell = setTimeout(() => {
      // never moves on while the tab is hidden or another move is under way
      if (document.hidden || flowBusy()) return wait(800);
      if (state.flight !== flight || state.index !== index) return;
      nextStep();
    }, ms);
  };
  wait(still ? TOUR_CALM_MS : TOUR_MS);
}

/** The page changed: the flight's own move arriving, or the visitor going somewhere else. */
export function flightPathChanged(path: string): void {
  const { flight, index, moving } = state;
  if (!flight) return;
  const here = path === hrefOf(flight.steps[index].id);
  if (moving && here) set({ moving: false });
  else if (!here && !moving) endFlight();
}

if (typeof window !== "undefined") {
  subscribeFlow(() => {
    if (getFlow().phase !== "idle" || !state.flight) return;
    const here = location.pathname === hrefOf(state.flight.steps[state.index].id);
    // the move was called off (Back mid-dive): the flight ends where the visitor is
    if (!here) return endFlight();
    if (state.moving) set({ moving: false });
    settle();
  });
}
