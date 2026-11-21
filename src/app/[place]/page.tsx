import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PlaceView } from "@/components/screen/PlaceView";
import { getPlace, placeIds } from "@/lib/content/places";
import { ogImage, pageMetadata, PLACE_OG } from "@/lib/site";

/* One place (DESIGN_SPEC.md 7): its scene, its name and one line. Static: one page per place. */

export const dynamicParams = false;

export function generateStaticParams() {
  return placeIds().map((place) => ({ place }));
}

type Props = { params: Promise<{ place: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const place = getPlace((await params).place);
  if (!place) return {};
  const og = PLACE_OG[place.id];
  return pageMetadata({ title: place.name, description: place.line, path: `/${place.id}`, image: og ? ogImage(og.name, og.alt) : undefined });
}

export default async function PlacePage({ params }: Props) {
  const place = getPlace((await params).place);
  if (!place) notFound();
  return <PlaceView place={{ name: place.name, line: place.line, scene: place.id, anchor: place.anchor, stop: place.stop, outTo: "/" }} />;
}
