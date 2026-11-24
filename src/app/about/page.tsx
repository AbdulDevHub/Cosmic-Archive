import type { Metadata } from "next";
import { AboutView } from "@/components/screen/AboutView";
import { VERSES, VERSES_LINE, VERSES_TITLE } from "@/content/verses";
import { jsonLd, ogImage, pageMetadata, SITE_NAME, SITE_URL } from "@/lib/site";

/* About (D-184): the site, how to travel it, and Islam and Space (D-179), over the cosmic web. Static. */

const DESCRIPTION = "About Cosmic Atlas, a journey through the universe drawn live in your browser, and a few verses from the Quran on the heavens.";

export const metadata: Metadata = pageMetadata({
  title: "About",
  description: DESCRIPTION,
  path: "/about",
  image: ogImage("about", "Our own illustration of the cosmic web: countless galaxies strung along threads of light."),
});

const structured = {
  "@context": "https://schema.org",
  "@type": "AboutPage",
  name: `About ${SITE_NAME}`,
  description: DESCRIPTION,
  url: `${SITE_URL}/about`,
  isPartOf: { "@type": "WebSite", name: SITE_NAME, url: SITE_URL },
  citation: VERSES.map((verse) => ({ "@type": "Quotation", text: verse.text, url: verse.url })),
};

export default function AboutPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(structured) }} />
      <AboutView versesTitle={VERSES_TITLE} versesLine={VERSES_LINE} verses={VERSES} />
    </>
  );
}
