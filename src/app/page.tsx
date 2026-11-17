import { HomeAtlas } from "@/components/atlas/HomeAtlas";
import { Destinations } from "@/components/home/Destinations";
import { JourneyPreview } from "@/components/home/JourneyPreview";
import { UnchartedTeaser } from "@/components/home/UnchartedTeaser";

/*
  The homepage (DESIGN_SPEC.md 7): one scene and one scroll (hero, chart, zoom out), then plain
  sections on --space: the destinations, a journey, Uncharted. The atlas's list view lives on
  /explore; here the Destinations section is what "Skip to destinations" lands on.
*/
export default function Home() {
  return (
    <>
      <HomeAtlas />
      <Destinations />
      <JourneyPreview />
      <UnchartedTeaser />
    </>
  );
}
