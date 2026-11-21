import type { Metadata } from "next";
import { HomeAtlas } from "@/components/atlas/HomeAtlas";
import { Destinations } from "@/components/home/Destinations";
import { JourneyPreview } from "@/components/home/JourneyPreview";
import { UnchartedTeaser } from "@/components/home/UnchartedTeaser";
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

/*
  The homepage (DESIGN_SPEC.md 7): one scene and one scroll (hero, chart, zoom out), then plain
  sections on --space: the destinations, a journey, Uncharted. The atlas's list view lives on
  /explore; here the Destinations section is what "Skip to destinations" lands on.
*/
export default function Home() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(WEBSITE) }} />
      <HomeAtlas />
      <Destinations />
      <JourneyPreview />
      <UnchartedTeaser />
    </>
  );
}
