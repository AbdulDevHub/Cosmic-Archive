import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PlaceView } from "@/components/screen/PlaceView";
import { getPlace, placeIds, PLACES } from "@/lib/content/places";
import { jsonLd, ogImage, pageMetadata, PLACE_OG, SITE_NAME, SITE_URL } from "@/lib/site";

/* One place (DESIGN_SPEC.md 7): its scene, its name and one line. Static: one page per place. */

export const dynamicParams = false;

export function generateStaticParams() {
  return placeIds().map((place) => ({ place }));
}

type Props = { params: Promise<{ place: string }> };

const ATLAS_VEIL = "#090a1c"; // --space: the atlas's own darkness

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const place = getPlace((await params).place);
  if (!place) return {};
  const og = PLACE_OG[place.id];
  return pageMetadata({ title: place.name, description: place.line, path: `/${place.id}`, image: og ? ogImage(og.name, og.alt) : undefined });
}

export default async function PlacePage({ params }: Props) {
  const place = getPlace((await params).place);
  if (!place) notFound();
  // inside another place (D-132), Zoom Out goes back to that place, framed, dived into this one
  const parent = place.inside ? getPlace(place.inside) : undefined;
  const out = parent ? { outTo: `/${parent.id}`, outZoom: 1, outVeil: parent.veil } : { outTo: "/", outZoom: place.stop === 2 ? 2 : 0, outVeil: ATLAS_VEIL };
  const inner = [
    ...PLACES.filter((entry) => entry.inside === place.id).map((entry) => ({ id: entry.id, name: entry.name, href: `/${entry.id}`, anchor: entry.anchor, veil: entry.veil })),
    // places this one also leads to (D-133: the wormhole's throat to the quasar galaxy)
    ...PLACES.filter((entry) => entry.through === place.id && entry.throughAnchor).map((entry) => ({ id: entry.id, name: entry.name, href: `/${entry.id}`, anchor: entry.throughAnchor as string, veil: entry.veil })),
  ];
  // arrived through another place (D-133), Zoom Out goes back through it
  const via = place.through ? getPlace(place.through) : undefined;
  const through = via && place.throughAnchor ? { from: via.id, outTo: `/${via.id}`, outZoom: 1, outVeil: via.veil, anchor: place.throughAnchor } : undefined;
  // the page for search engines: a WebPage inside the site, and the trail to it (schema.org)
  const trail = [{ name: SITE_NAME, path: "/" }, ...(parent ? [{ name: parent.name, path: `/${parent.id}` }] : []), { name: place.name, path: `/${place.id}` }];
  const structured = [
    { "@context": "https://schema.org", "@type": "WebPage", name: place.name, description: place.line, url: `${SITE_URL}/${place.id}`, isPartOf: { "@type": "WebSite", name: SITE_NAME, url: SITE_URL } },
    { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: trail.map((step, index) => ({ "@type": "ListItem", position: index + 1, name: step.name, item: `${SITE_URL}${step.path}` })) },
  ];
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(structured) }} />
      <PlaceView place={{ name: place.name, line: place.line, video: place.video, scene: place.id, anchor: place.anchor, ...out, through }} inner={inner} />
    </>
  );
}
