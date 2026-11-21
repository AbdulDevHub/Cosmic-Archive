import type { Metadata } from "next";
import { AtlasView, type Spot, type StopWords } from "@/components/screen/AtlasView";
import { PLACES, STOPS } from "@/lib/content/places";
import { jsonLd, pageMetadata, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";

export const metadata: Metadata = pageMetadata({ description: SITE_DESCRIPTION, path: "/" });

/** The site, for search engines (schema.org WebSite). */
const WEBSITE = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  url: SITE_URL,
  description: SITE_DESCRIPTION,
  inLanguage: "en",
};

const STOP_WORDS: StopWords[] = STOPS.map(({ zoom, name, line }) => ({ zoom, name, line }));

const SPOTS: Spot[] = [
  ...PLACES.map((place) => ({ id: place.id, name: place.name, href: `/${place.id}`, anchor: place.anchor, stop: place.stop === 2 ? 2 : 1, veil: place.veil }) satisfies Spot),
  // seen from the web, the galaxy is one light among many: it glides back in, it opens no page
  { id: "galaxy", name: "The galaxy", href: null, anchor: "home", stop: 2, veil: "" },
];

/* The universe (DESIGN_SPEC.md 7): one scene, three stops, the places you can click. */
export default function Home() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(WEBSITE) }} />
      <AtlasView stops={STOP_WORDS} spots={SPOTS} />
    </>
  );
}
