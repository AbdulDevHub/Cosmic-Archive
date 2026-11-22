import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PlaceView } from "@/components/screen/PlaceView";
import { getPlace, placeIds, PLACES } from "@/lib/content/places";
import { ogImage, pageMetadata, PLACE_OG } from "@/lib/site";

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
  const inner = PLACES.filter((entry) => entry.inside === place.id).map((entry) => ({ id: entry.id, name: entry.name, href: `/${entry.id}`, anchor: entry.anchor, veil: entry.veil }));
  return <PlaceView place={{ name: place.name, line: place.line, scene: place.id, anchor: place.anchor, ...out }} inner={inner} />;
}
