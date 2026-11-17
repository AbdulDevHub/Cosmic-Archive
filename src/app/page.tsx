import { DestinationList } from "@/components/atlas/DestinationList";
import { HomeAtlas } from "@/components/atlas/HomeAtlas";

/*
  The homepage (DESIGN_SPEC.md 7): one scene and one scroll (hero, chart, zoom out), then the
  atlas as a plain list. The sections below the scene (destinations, a journey, Uncharted) are O1.
*/
export default function Home() {
  return (
    <>
      <HomeAtlas />
      <DestinationList />
    </>
  );
}
