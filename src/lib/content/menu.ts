/**
 * The places as the dock's Places list and search see them (D-139): grouped by where they are
 * found, with only what a link needs. Built on the server (the layout) and handed to the header,
 * so the facts and sources in `src/content/places.ts` never reach the browser for it.
 */

import { FLIGHTS, type Flight } from "@content/flights";
import { PLACES, type Place, type PlaceId } from "./places";

export interface MenuPlace {
  id: PlaceId;
  name: string;
  veil: string;
  /**
   * Where a hint leads (D-206): the scene the place is found in, as its own Zoom Out goes there.
   * `parent` is the place it is inside, or null for the atlas; `anchor` is its body there.
   */
  parent: PlaceId | null;
  outTo: string;
  outZoom: number;
  outVeil: string;
  anchor: string;
}

/** --space: the atlas's own darkness (as in the place page's Zoom Out). */
const ATLAS_VEIL = "#090a1c";

export interface MenuGroup {
  name: string;
  places: MenuPlace[];
}

const byId = new Map(PLACES.map((place) => [place.id, place]));

/** The outermost place a place is found inside, or itself. */
function root(place: Place): Place {
  let at = place;
  while (at.inside) at = byId.get(at.inside) ?? at;
  return at;
}

function groupOf(place: Place): string {
  // the Starbase's ideas are many: they get their own group, the Starbase leading it (D-174)
  // (and the journey down from it, D-190: a cell, its DNA, an atom, its nucleus, quarks, strings)
  for (let at: Place | undefined = place; at; at = at.inside ? byId.get(at.inside) : undefined) if (at.id === "starbase") return "The Starbase";
  const top = root(place);
  if (top.id === "solar-system" || top.id === "quasar-galaxy") return top.name;
  return top.stop >= 2 ? "The Cosmic Web" : "A Spiral Galaxy";
}

const ORDER = ["A Spiral Galaxy", "A Solar System", "The Cosmic Web", "A Quasar Galaxy", "The Starbase"];

export function menuGroups(): MenuGroup[] {
  const groups = new Map<string, MenuPlace[]>();
  for (const place of PLACES) {
    const name = groupOf(place);
    const list = groups.get(name) ?? [];
    // the group's own place (the solar system, the quasar galaxy) leads its list
    const parent = place.inside ? byId.get(place.inside) : undefined;
    const out = parent ? { outTo: `/${parent.id}`, outZoom: 1, outVeil: parent.veil } : { outTo: "/", outZoom: place.stop === 2 ? 2 : 1, outVeil: ATLAS_VEIL }; // a hint opens on the whole galaxy or the web, where the beacon shows
    const entry: MenuPlace = { id: place.id, name: place.name, veil: place.veil, parent: parent?.id ?? null, anchor: place.anchor, ...out };
    if ((root(place) === place && name === place.name) || place.id === "starbase") list.unshift(entry);
    else list.push(entry);
    groups.set(name, list);
  }
  return [...groups.entries()]
    .sort(([a], [b]) => ORDER.indexOf(a) - ORDER.indexOf(b))
    .map(([name, places]) => ({ name, places }));
}

// ---- the flights (D-151): each stop with what a move to it needs, built on the server too ----

export interface FlightStep {
  id: PlaceId;
  name: string;
  veil: string;
  /** The body it is found at, when it is inside the place before it: the flight dives into it. */
  anchor: string;
  inside?: PlaceId;
}

export interface MenuFlight {
  id: Flight["id"];
  name: string;
  kind: Flight["kind"];
  steps: FlightStep[];
}

export function menuFlights(): MenuFlight[] {
  return FLIGHTS.map((flight) => ({
    id: flight.id,
    name: flight.name,
    kind: flight.kind,
    steps: flight.places.map((id) => {
      const place = byId.get(id);
      if (!place) throw new Error(`flights: ${flight.id} names no place ${id}`);
      return { id, name: place.name, veil: place.veil, anchor: place.anchor, ...(place.inside ? { inside: place.inside } : {}) };
    }),
  }));
}
