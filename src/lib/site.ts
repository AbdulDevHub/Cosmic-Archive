/**
 * The site's own facts for metadata, the sitemap and structured data (O7). One place.
 *
 * The address comes from `NEXT_PUBLIC_SITE_URL` (set it in Vercel when the site is deployed,
 * D-087). Until then it falls back to a placeholder on a reserved domain, so nothing points at a
 * real site by accident.
 */

import type { Metadata } from "next";

export const SITE_NAME = "Cosmic Archive";
export const SITE_DESCRIPTION = "The universe, to look at: click from the cosmic web into a galaxy, a nebula, a black hole and a quasar.";

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://cosmic-archive.example").replace(/\/$/, "");

// Say so loudly in a production build without the address: every canonical link, card and the
// sitemap would point at the placeholder. A warning, not an error, so local builds still run.
if (!process.env.NEXT_PUBLIC_SITE_URL && process.env.NODE_ENV === "production" && typeof window === "undefined") {
  console.warn("NEXT_PUBLIC_SITE_URL is not set: canonical links, Open Graph tags and the sitemap point at https://cosmic-archive.example. Set it before deploying (README, D-087).");
}

/** The Open Graph image for a page: our own scene stills (never telescope photos, D-018). */
export function ogImage(name: string, alt: string) {
  return { url: `/og/${name}.jpg`, width: 1200, height: 630, alt };
}

export const DEFAULT_OG = ogImage("atlas", "Our own illustration of a spiral galaxy.");

/** Open Graph images for the places, by place id. */
export const PLACE_OG: Readonly<Record<string, { name: string; alt: string }>> = {
  "black-hole": { name: "black-hole", alt: "Our own illustration of a black hole and its bent disc of gas." },
  nebula: { name: "nebula", alt: "Our own illustration of a star-forming cloud." },
  quasar: { name: "quasar", alt: "Our own illustration of a quasar: a bright core, its jets and its host galaxy." },
  "neutron-star": { name: "neutron-star", alt: "Our own illustration of a neutron star sweeping its beams of light." },
  star: { name: "star", alt: "Our own illustration of a yellow star, like the Sun." },
  "strange-star": { name: "strange-star", alt: "Our own illustration of a strange star, which may be made of quarks." },
  "dyson-sphere": { name: "dyson-sphere", alt: "Our own illustration of an imagined Dyson swarm around a star." },
  "wormhole": { name: "wormhole", alt: "Our own illustration of a hypothetical wormhole: a ring of lensed light round a throat that shows another sky." },
  "gravastar": { name: "gravastar", alt: "Our own illustration of a hypothetical gravastar: a dark bubble inside a thin, shining shell." },
  "supernova-remnant": { name: "supernova-remnant", alt: "Our own illustration of a supernova remnant: a ragged shell of glowing gas round a tiny star." },
  "quasi-star": { name: "quasi-star", alt: "Our own illustration of a hypothetical quasi-star: a vast red star with a black hole feeding at its heart." },
  "solar-system": { name: "solar-system", alt: "Our own illustration of a solar system: a yellow star, four planets, a ringed giant and a belt of asteroids." },
  "blue-world": { name: "blue-world", alt: "Our own illustration of an Earthlike world: blue oceans, clouds, city lights on its night side, and its moon." },
  "asteroid": { name: "asteroid", alt: "Our own illustration of an asteroid: a lumpy, cratered rock lit hard from one side, a blue planet far behind it." },
  "quasar-galaxy": { name: "quasar-galaxy", alt: "Our own illustration of a quasar galaxy: a tilted spiral with a blinding heart and two jets along its axis." },
  "moon": { name: "moon", alt: "Our own illustration of a moon: grey, cratered, with dark lava plains, lit hard from one side." },
};

/** A JSON-LD block, safe to put in a <script> (no closing tag can end it early). */
export function jsonLd(data: object): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

/**
 * A page's metadata: its title and description, its canonical address, and Open Graph and
 * Twitter cards carrying the same words and image. Next replaces a parent's `openGraph` object
 * as a whole, so each page states all of it.
 */
export function pageMetadata({
  title,
  description,
  path,
  image = DEFAULT_OG,
  type = "website",
  modified,
}: {
  title?: string;
  description: string;
  path: string;
  image?: ReturnType<typeof ogImage>;
  type?: "website" | "article";
  modified?: string;
}): Metadata {
  const shown = title ?? SITE_NAME;
  return {
    ...(title ? { title } : {}),
    description,
    alternates: { canonical: path },
    openGraph: {
      type,
      siteName: SITE_NAME,
      locale: "en_GB",
      title: shown,
      description,
      url: path,
      images: [image],
      ...(type === "article" && modified ? { modifiedTime: modified } : {}),
    },
    twitter: { card: "summary_large_image", title: shown, description, images: [image.url] },
  };
}
