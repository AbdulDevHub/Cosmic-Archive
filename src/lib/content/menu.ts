/**
 * The places as the dock's Places list and search see them (D-139): grouped by where they are
 * found, with only what a link needs. Built on the server (the layout) and handed to the header,
 * so the facts and sources in `src/content/places.ts` never reach the browser for it.
 */

import { PLACES, type Place, type PlaceId } from "./places";

export interface MenuPlace {
  id: PlaceId;
  name: string;
  veil: string;
}

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
  const top = root(place);
  if (top.id === "solar-system" || top.id === "quasar-galaxy") return top.name;
  return top.stop >= 2 ? "The Cosmic Web" : "A Spiral Galaxy";
}

const ORDER = ["A Spiral Galaxy", "A Solar System", "The Cosmic Web", "A Quasar Galaxy"];

export function menuGroups(): MenuGroup[] {
  const groups = new Map<string, MenuPlace[]>();
  for (const place of PLACES) {
    const name = groupOf(place);
    const list = groups.get(name) ?? [];
    // the group's own place (the solar system, the quasar galaxy) leads its list
    const entry = { id: place.id, name: place.name, veil: place.veil };
    if (root(place) === place && name === place.name) list.unshift(entry);
    else list.push(entry);
    groups.set(name, list);
  }
  return [...groups.entries()]
    .sort(([a], [b]) => ORDER.indexOf(a) - ORDER.indexOf(b))
    .map(([name, places]) => ({ name, places }));
}
