/**
 * The places and the atlas's stops (content/places.ts), checked once at build time with the same
 * rule as `npm run check`: a line without a fetched source fails the build.
 */

import { FEATURED, PLACES, SOURCES, STOPS, type Place, type PlaceId, type Stop, type StopIndex } from "@content/places";
import { placeProblems } from "./place-check";

export { FEATURED, PLACES, SOURCES, STOPS } from "@content/places";
export type { AtlasAnchor, Featured, Place, PlaceId, Source, Stop, StopIndex } from "@content/places";

const problems = placeProblems(SOURCES, [...STOPS, ...PLACES, ...FEATURED]);
if (problems.length > 0) throw new Error(`content/places.ts:\n  ${problems.join("\n  ")}`);

export function getPlace(id: string): Place | undefined {
  return PLACES.find((place) => place.id === id);
}

export function placeIds(): PlaceId[] {
  return PLACES.map((place) => place.id);
}

export function stopAt(zoom: StopIndex): Stop {
  const stop = STOPS.find((entry) => entry.zoom === zoom);
  if (!stop) throw new Error(`content: no stop at zoom ${zoom}`);
  return stop;
}

/** The places whose hotspots show at a stop. */
export function placesAt(zoom: StopIndex): Place[] {
  return PLACES.filter((place) => place.stop === zoom);
}
