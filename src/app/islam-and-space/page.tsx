import type { Metadata } from "next";
import { VersesView } from "@/components/screen/VersesView";
import { VERSES, VERSES_LINE, VERSES_TITLE } from "@/content/verses";
import { jsonLd, ogImage, pageMetadata, SITE_NAME, SITE_URL } from "@/lib/site";

/* Islam and Space (D-136 item 13, D-179): verses on the heavens over the Seven Heavens. Static. */

const DESCRIPTION = "Verses from the Quran on the heavens and the universe, set over our own drawing of the Seven Heavens.";

export const metadata: Metadata = pageMetadata({
  title: VERSES_TITLE,
  description: DESCRIPTION,
  path: "/islam-and-space",
  image: ogImage("islam-and-space", "Our own illustration of the Seven Heavens: layers of soft light, indigo to warm white."),
});

const structured = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: VERSES_TITLE,
  description: DESCRIPTION,
  url: `${SITE_URL}/islam-and-space`,
  isPartOf: { "@type": "WebSite", name: SITE_NAME, url: SITE_URL },
  citation: VERSES.map((verse) => ({ "@type": "Quotation", text: verse.text, url: verse.url })),
};

export default function IslamAndSpacePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(structured) }} />
      <VersesView title={VERSES_TITLE} line={VERSES_LINE} verses={VERSES} />
    </>
  );
}
