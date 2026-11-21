/**
 * The journey "A star's life" (PROJECT_BLUEPRINT.md 7, Journeys): the stops in order, what
 * happens at each, and why it leads to the next. Facts only, each stop tied to sources that were
 * fetched and read (PROJECT_BLUEPRINT.md 6.2); the layout lives in src/components/journey. The
 * homepage's preview is made from this file, so the two never disagree.
 *
 * The line forks where the science forks: first on the star's mass, then, for a heavy star, on the
 * mass of the core its explosion leaves. No mass thresholds in solar masses except the one NASA's
 * black-hole page gives: the sources fetched for this journey give different figures for the
 * other forks, so the words say "lighter" and "heavier" instead (D-079).
 */

import type { Evidence, Source } from "../destinations";

export const JOURNEY_SOURCES: readonly Source[] = [
  {
    id: "nasa-stars",
    title: "Stars",
    publisher: "NASA Science",
    url: "https://science.nasa.gov/universe/stars/",
    checked: "2026-11-20",
  },
  {
    id: "nasa-imagine-stars",
    title: "Stars",
    publisher: "NASA Imagine the Universe!",
    url: "https://imagine.gsfc.nasa.gov/science/objects/stars1.html",
    checked: "2026-11-20",
  },
  {
    id: "nasa-imagine-white-dwarfs",
    title: "White Dwarfs",
    publisher: "NASA Imagine the Universe!",
    url: "https://imagine.gsfc.nasa.gov/science/objects/dwarfs2.html",
    checked: "2026-11-20",
  },
  {
    id: "nasa-imagine-neutron-stars",
    title: "Neutron Stars",
    publisher: "NASA Imagine the Universe!",
    url: "https://imagine.gsfc.nasa.gov/science/objects/neutron_stars1.html",
    checked: "2026-11-20",
  },
  {
    id: "nasa-imagine-supernovae",
    title: "Supernovae",
    publisher: "NASA Imagine the Universe!",
    url: "https://imagine.gsfc.nasa.gov/science/objects/supernovae1.html",
    checked: "2026-11-20",
  },
  {
    id: "nasa-black-hole-types",
    title: "Black Hole Types",
    publisher: "NASA Science",
    url: "https://science.nasa.gov/universe/black-holes/types/",
    checked: "2026-11-20",
  },
];

/** One stop on the line. */
export interface JourneyStop {
  id: string;
  label: string;
  /** What happens here. */
  note: string;
  /** Why it leads to the next stop (or to the fork). A last stop has none. */
  why?: string;
  /** A shorter note for the homepage's preview, when the stop appears there. */
  short?: string;
  /** A subject page this stop opens, once it exists. */
  subject?: string;
  evidence: Evidence;
  /** The sources of the note and the why. */
  sources: readonly string[];
}

/** Where the line divides, and why. */
export interface JourneyFork {
  why: string;
  sources: readonly string[];
  branches: readonly JourneyBranch[];
}

/** One way on from a fork. */
export interface JourneyBranch {
  id: string;
  /** Which stars (or cores) take this way. */
  who: string;
  /** The same, standing alone, for a branch that ends on the homepage's preview. */
  preview?: string;
  sources: readonly string[];
  stops: readonly JourneyStop[];
  /** A branch may divide again after its last stop. */
  fork?: JourneyFork;
}

export interface Journey {
  id: string;
  title: string;
  /** One sentence under the title. */
  hook: string;
  description: string;
  lastReviewed: string;
  sources: readonly Source[];
  /** Before the first fork, in order. */
  trunk: readonly JourneyStop[];
  fork: JourneyFork;
  /** The trunk's stops the homepage's preview shows. */
  previewTrunk: readonly string[];
}

export const A_STARS_LIFE: Journey = {
  id: "a-stars-life",
  title: "A star's life",
  hook: "One line from a cloud of gas to three very different ends, and why each step leads to the next.",
  description: "How a star forms in a cold cloud, shines for millions to trillions of years, and ends as a white dwarf, a neutron star or a black hole, depending on its mass.",
  lastReviewed: "2026-11-20",
  sources: JOURNEY_SOURCES,
  trunk: [
    {
      id: "cloud",
      label: "A cold cloud",
      note: "Stars form in large clouds of gas and dust called molecular clouds, from 1,000 to 10 million times the mass of the Sun and as much as hundreds of light-years across.",
      why: "The cloud is cold, so its gas clumps into dense pockets. Some clumps collide or gather more matter, and their gravity grows with their mass, until some of them collapse.",
      short: "Stars form in large clouds of gas and dust. Gravity makes clumps of the cloud collapse and heat up.",
      subject: "nebulae",
      evidence: "established",
      sources: ["nasa-stars"],
    },
    {
      id: "protostar",
      label: "A protostar",
      note: "As a clump collapses, friction heats the material and a protostar forms, a baby star. One cloud makes many of them, which is why such clouds are called stellar nurseries.",
      why: "As the protostar gains mass its core grows hotter and denser, until it is hot and dense enough for hydrogen to start fusing into helium.",
      evidence: "established",
      sources: ["nasa-stars", "nasa-imagine-stars"],
    },
    {
      id: "star",
      label: "A star",
      note: "Its core fuses hydrogen into helium. The energy released heats the star and stops it collapsing under its own gravity. This is the longest phase of a star's life, and the Sun is roughly midway through it.",
      why: "Mass sets the pace: heavier stars burn their fuel faster. Some low-mass stars will shine for trillions of years, some massive stars for only a few million. When the core runs out of hydrogen it starts to collapse, and the squeeze makes the star slowly puff up.",
      short: "Its core fuses hydrogen into helium, the longest phase of a star's life.",
      evidence: "established",
      sources: ["nasa-stars"],
    },
  ],
  previewTrunk: ["cloud", "star"],
  fork: {
    why: "How a star ends depends strongly on its mass.",
    sources: ["nasa-stars"],
    branches: [
      {
        id: "low-mass",
        who: "A low-mass star, like the Sun",
        preview: "A low-mass star",
        sources: ["nasa-stars"],
        stops: [
          {
            id: "giant",
            label: "A giant",
            note: "Its atmosphere keeps expanding until it is a giant, while its core fuses helium into carbon. This will be the Sun's fate, in several billion years.",
            why: "Some giants become unstable and pulsate, throwing off part of their atmosphere. In the end all the outer layers blow away.",
            evidence: "established",
            sources: ["nasa-stars"],
          },
          {
            id: "planetary-nebula",
            label: "A planetary nebula",
            note: "The outer layers become an expanding cloud of dust and gas around what is left of the star.",
            why: "Once the outer layers are gone, all that is left of the star is its core.",
            subject: "nebulae",
            evidence: "established",
            sources: ["nasa-stars"],
          },
          {
            id: "white-dwarf",
            label: "White dwarf",
            note: "A roughly Earth-sized cinder that cools over billions of years. It does not collapse any further because the electrons packed into its core push back against gravity.",
            short: "Its outer layers blow away as a planetary nebula. The core left behind is a white dwarf.",
            evidence: "established",
            sources: ["nasa-stars", "nasa-imagine-stars", "nasa-imagine-white-dwarfs"],
          },
        ],
      },
      {
        id: "high-mass",
        who: "A high-mass star",
        sources: ["nasa-stars"],
        stops: [
          {
            id: "heavier-fuels",
            label: "Heavier fuels",
            note: "The outer layers swell into a red supergiant. Inside, fusion goes on to heavier elements, such as oxygen, neon and magnesium, and in the largest stars all the way to iron. Each new fuel buys the core less time.",
            why: "Fusing iron would take energy instead of releasing it. With a core of iron, nothing holds the star up against gravity any more.",
            evidence: "established",
            sources: ["nasa-stars", "nasa-imagine-stars"],
          },
          {
            id: "supernova",
            label: "A supernova",
            note: "The iron core collapses until the nuclei push back, then rebounds, and a shock wave runs out through the star: a huge explosion. The material thrown off is a supernova remnant, and it enriches the clouds that will make the next stars.",
            why: "The core survives the explosion as an incredibly dense remnant.",
            subject: "nebulae",
            evidence: "established",
            sources: ["nasa-stars", "nasa-imagine-supernovae"],
          },
        ],
        fork: {
          why: "What the core becomes depends on the core's own mass.",
          sources: ["nasa-imagine-stars"],
          branches: [
            {
              id: "lighter-core",
              who: "A lighter core",
              preview: "A high-mass star",
              sources: ["nasa-imagine-neutron-stars"],
              stops: [
                {
                  id: "neutron-star",
                  label: "Neutron star",
                  note: "The collapse crushes every proton and electron of the core together into neutrons, and the neutrons stop it: about the mass of a sun, about 20 kilometres across.",
                  short: "It explodes as a supernova, and its core survives as an incredibly dense remnant.",
                  evidence: "established",
                  sources: ["nasa-imagine-neutron-stars", "nasa-stars"],
                },
              ],
            },
            {
              id: "heavier-core",
              who: "A heavier core",
              // nasa-black-hole-types: "If it had around 20 times the Sun's mass or more, the star's core
              // collapses into a stellar-mass black hole." The mass is the star's.
              preview: "Around 20 times the Sun's mass or more",
              sources: ["nasa-imagine-neutron-stars"],
              stops: [
                {
                  id: "black-hole",
                  label: "Black hole",
                  note: "Even neutrons cannot stop the collapse. If the star had around 20 times the Sun's mass or more, its core collapses into a stellar-mass black hole.",
                  short: "The collapsing core becomes a stellar-mass black hole.",
                  subject: "black-holes",
                  evidence: "established",
                  sources: ["nasa-imagine-supernovae", "nasa-black-hole-types"],
                },
              ],
            },
          ],
        },
      },
    ],
  },
};

