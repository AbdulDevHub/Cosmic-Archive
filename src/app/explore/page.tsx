import type { Metadata } from "next";
import { DestinationList } from "@/components/atlas/DestinationList";
import { ExploreAtlas } from "@/components/atlas/ExploreAtlas";

export const metadata: Metadata = {
  title: "Explore",
  description: "The atlas under your own control: move through a spiral galaxy, then pull back until it is one point of light in the cosmic web.",
};

/* The atlas with free control (ARCHITECTURE.md 2), then the same destinations as a plain list. */
export default function Explore() {
  return (
    <>
      <ExploreAtlas />
      <DestinationList />
    </>
  );
}
