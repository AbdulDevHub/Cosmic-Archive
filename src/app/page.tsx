import type { Metadata } from "next";
import { AtlasView, type Spot, type StopWords } from "@/components/screen/AtlasView";
import { PLACES, STOPS } from "@/lib/content/places";
import { DEFAULT_OG, jsonLd, pageMetadata, SITE_DESCRIPTION, SITE_NAME, SITE_TITLE, SITE_URL } from "@/lib/site";

export const metadata: Metadata = { ...pageMetadata({ description: SITE_DESCRIPTION, path: "/" }), title: { absolute: SITE_TITLE } };

/** The site, for search engines (schema.org): the WebSite, and (D-207) what it is, a free web app that runs in the browser. */
const WEBSITE = [
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    inLanguage: "en",
  },
  {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    image: `${SITE_URL}${DEFAULT_OG.url}`,
    applicationCategory: "EducationalApplication",
    operatingSystem: "Any",
    browserRequirements: "Requires JavaScript and WebGL 2.",
    isAccessibleForFree: true,
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  },
];

const STOP_WORDS: StopWords[] = STOPS.map(({ zoom, name, line, video }) => ({ zoom, name, line, video }));

const SPOTS: Spot[] = [
  // places inside other places (D-132) are found in their parent's scene, not in the atlas
  ...PLACES.filter((place) => !place.inside).map((place) => ({ id: place.id, name: place.name, href: `/${place.id}`, anchor: place.anchor, stop: place.stop === 2 ? 2 : 1, veil: place.veil }) satisfies Spot),
  // seen from the web, the galaxy is one light among many: it glides back in, it opens no page
  { id: "galaxy", name: "The Galaxy", href: null, anchor: "home", stop: 2, veil: "" },
  // and from the supervoid, the web around it is one patch of a wall: it glides back in (D-119)
  { id: "web", name: "The Cosmic Web", href: null, anchor: "patch", stop: 3, veil: "" },
  // and from the observable universe, the supervoid is lost at its middle, where we are: it glides back (D-130)
  { id: "supervoid", name: "The Supervoid", href: null, anchor: "voidspot", stop: 4, veil: "" },
  // and from the Multiverse, the observable universe is the small ball at the line's left end: it glides back (D-184)
  { id: "universe", name: "The Universe", href: null, anchor: "ball", stop: 5, veil: "" },
  // and from the Omniverse, the Multiverse is a small row of lights: it glides back (D-184)
  { id: "multiverse", name: "The Multiverse", href: null, anchor: "multi", stop: 6, veil: "" },
];

/* The universe (DESIGN_SPEC.md 7): one scene, seven stops, the places you can click. */
export default function Home() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(WEBSITE) }} />
      <AtlasView stops={STOP_WORDS} spots={SPOTS} />
    </>
  );
}
