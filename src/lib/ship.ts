/**
 * The visitor's ship (D-118): one of five classes, chosen on the start page and remembered. The
 * start scene reads it every frame (`getShip`) and swaps the model when it changes. Client only;
 * imports nothing from three.
 */

import { useSyncExternalStore } from "react";

export const SHIPS = [
  { id: "sovereign", name: "Sovereign", role: "The Elegant Flagship" },
  { id: "predator", name: "Predator", role: "The Intimidating Cruiser" },
  { id: "celestial", name: "Celestial", role: "The Legendary Vessel" },
  { id: "discovery", name: "Discovery", role: "The Experimental Explorer" },
  { id: "colossus", name: "Colossus", role: "The Mobile Expedition Fortress" },
] as const;

export type ShipClass = (typeof SHIPS)[number]["id"];

const STORAGE_KEY = "cosmic-archive:ship";
const DEFAULT: ShipClass = "sovereign";
const isShip = (value: unknown): value is ShipClass => SHIPS.some((ship) => ship.id === value);

let current: ShipClass = DEFAULT;
const listeners = new Set<() => void>();

if (typeof window !== "undefined") {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (isShip(saved)) current = saved;
  } catch {
    // storage blocked: the default for this visit
  }
}

export function getShip(): ShipClass {
  return current;
}

export function setShip(ship: ShipClass): void {
  if (ship === current) return;
  current = ship;
  try {
    localStorage.setItem(STORAGE_KEY, ship);
  } catch {
    // storage blocked: the choice holds for this visit
  }
  listeners.forEach((listener) => listener());
}

export function useShip(): ShipClass {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => current,
    () => DEFAULT,
  );
}
