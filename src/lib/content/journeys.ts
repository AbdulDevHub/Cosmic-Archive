/**
 * The journeys (content/journeys/*.ts), checked once at build time with the same rule as
 * `npm run check` (cited.ts `journeyProblems`): a stop that names a missing source, or one that
 * leads on without saying why, fails the build. Also the homepage's preview of a journey, made
 * from the journey itself so the two never disagree.
 */

import { A_STARS_LIFE } from "@content/journeys/a-stars-life";
import type { Journey, JourneyBranch, JourneyFork, JourneyStop } from "@content/journeys/a-stars-life";
import { journeyProblems } from "./cited";

export type { Journey, JourneyBranch, JourneyFork, JourneyStop } from "@content/journeys/a-stars-life";

const JOURNEYS: readonly Journey[] = [A_STARS_LIFE];

for (const journey of JOURNEYS) {
  const problems = journeyProblems(journey.sources, journey);
  if (problems.length > 0) throw new Error(`content/journeys/${journey.id}.ts:\n  ${problems.join("\n  ")}`);
}

export function allJourneys(): readonly Journey[] {
  return JOURNEYS;
}

export function getJourney(id: string): Journey | undefined {
  return JOURNEYS.find((journey) => journey.id === id);
}

/** A stop as the homepage's preview shows it: the short note, and for an end, which stars reach it. */
export interface PreviewStop extends JourneyStop {
  branch?: string;
}

export interface JourneyPreview {
  id: string;
  title: string;
  fork: string;
  trunk: readonly PreviewStop[];
  ends: readonly PreviewStop[];
}

/** The ends of a fork, depth first: the last stop of every branch that does not divide again. */
function ends(fork: JourneyFork, preview?: string): PreviewStop[] {
  return fork.branches.flatMap((branch: JourneyBranch) => {
    if (branch.fork) return ends(branch.fork, branch.preview ?? preview);
    const stop = branch.stops[branch.stops.length - 1];
    return [{ ...stop, note: stop.short ?? stop.note, branch: branch.preview ?? preview ?? branch.who }];
  });
}

export function previewOf(journey: Journey): JourneyPreview {
  return {
    id: journey.id,
    title: journey.title,
    fork: journey.fork.why,
    trunk: journey.previewTrunk.flatMap((id) => {
      const stop = journey.trunk.find((entry) => entry.id === id);
      return stop ? [{ ...stop, note: stop.short ?? stop.note }] : [];
    }),
    ends: ends(journey.fork),
  };
}
