/**
 * The site's own facts for metadata, the sitemap and structured data (O7). One place.
 *
 * The address comes from `NEXT_PUBLIC_SITE_URL` (set it in Vercel when the site is deployed,
 * D-087). Until then it falls back to a placeholder on a reserved domain, so nothing points at a
 * real site by accident.
 */

import type { Metadata } from "next";

export const SITE_NAME = "Cosmic Archive";
export const SITE_TAGLINE = "Explore the extraordinary.";
export const SITE_DESCRIPTION = "A living atlas of the universe, from the worlds around us to its deepest mysteries.";

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

export const DEFAULT_OG = ogImage("atlas", "Our own illustration of a spiral galaxy, drawn with map-maker's ink.");

/** Open Graph images for the subject scenes, by scene id. */
export const SCENE_OG: Readonly<Record<string, { name: string; alt: string }>> = {
  atlas: { name: "galaxies", alt: "Our own illustration of a spiral galaxy, with its ticked ring." },
  "black-hole": { name: "black-holes", alt: "Our own illustration of a black hole and its bent disc of gas." },
  nebula: { name: "nebulae", alt: "Our own illustration of a star-forming cloud, with contour ink." },
  quasar: { name: "quasars", alt: "Our own illustration of a quasar: a bright core, its jets and its host galaxy." },
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
