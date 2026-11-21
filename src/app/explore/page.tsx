import type { Metadata } from "next";
import { DestinationList } from "@/components/atlas/DestinationList";
import { ExploreAtlas } from "@/components/atlas/ExploreAtlas";
import { pageMetadata } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "Explore",
  description: "The atlas under your own control: move through a spiral galaxy, then pull back until it is one point of light in the cosmic web.",
  path: "/explore",
});

/* The atlas with free control (ARCHITECTURE.md 2), then the same destinations as a plain list. */
export default function Explore() {
  return (
    <>
      <ExploreAtlas />
      <DestinationList />
    </>
  );
}
