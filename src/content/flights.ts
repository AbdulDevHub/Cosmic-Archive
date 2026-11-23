/**
 * The flights (D-136 item 7, D-151): routes through the places, flown from the dock's Flights.
 *
 * A flight holds no facts of its own: it is a name and an order of places, and each stop shows the
 * place's own name and sourced line from `places.ts`. A guided flight waits for the visitor's Next;
 * the tour flies itself, a few seconds at each place, and can be skipped at any moment.
 *
 * Between two stops the flight is the site's own move (flow.ts): a place inside the one before is
 * dived into through its body; any other place is reached as the last one shrinks away, through
 * the veil, and the next arrives.
 */

import type { PlaceId } from "./places";

export type FlightId = "star-life" | "black-hole-to-quasar" | "grand-tour";

export interface Flight {
  id: FlightId;
  name: string;
  /** `guided`: the visitor moves on with Next. `tour`: hands-off, with Skip. */
  kind: "guided" | "tour";
  places: readonly PlaceId[];
}

export const FLIGHTS: readonly Flight[] = [
  {
    // a star like the Sun, from the cloud it forms in to the cinder it leaves (NASA "Star Basics")
    id: "star-life",
    name: "A Star's Life",
    kind: "guided",
    places: ["molecular-cloud", "nebula", "star", "red-giant", "planetary-nebula", "white-dwarf"],
  },
  {
    // a black hole, two of them merging, then the feeding giant at a galaxy's heart
    id: "black-hole-to-quasar",
    name: "Black Hole to Quasar",
    kind: "guided",
    places: ["black-hole", "black-hole-merger", "quasar-galaxy", "quasar"],
  },
  {
    // the hands-off tour: from a world like ours outward to the web the galaxies hang in
    id: "grand-tour",
    name: "The Grand Tour",
    kind: "tour",
    places: ["blue-world", "ringed-giant", "comet", "star", "nebula", "supernova-remnant", "magnetar", "black-hole", "black-hole-merger", "wormhole", "quasar-galaxy", "quasar", "dark-matter"],
  },
];
