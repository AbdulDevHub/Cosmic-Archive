/**
 * The Black Holes subject scene: a black hole and its disc of gas, with light bent as the
 * hole's gravity bends it. One draw call. Mounted by the host through the registry; never
 * imported by a page.
 */

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import type { SceneBudget, SceneProps } from "../../host/types";
import { RUNGS } from "../../quality/tiers";
import { BlackHoleWorld, makeFrame } from "./world";

export const budget: SceneBudget = {
  drawCalls: 1,
  particles: { low: 0, medium: 0, high: 0 }, // no particles: the cost is steps per pixel (world.ts)
};

export default function BlackHoleScene({ rung, time, publish, onReady }: SceneProps) {
  const width = useThree((s) => s.size.width);
  const height = useThree((s) => s.size.height);
  const dpr = useThree((s) => s.viewport.dpr);
  const invalidate = useThree((s) => s.invalidate);
  const tier = RUNGS[rung].particles;

  const world = useMemo(() => new BlackHoleWorld(), []);
  useEffect(() => () => world.dispose(), [world]);
  const frame = useMemo(() => makeFrame(), []);

  useLayoutEffect(() => {
    world.resize(width, height, dpr, tier, frame);
    invalidate();
  }, [world, frame, width, height, dpr, tier, invalidate]);

  const drawn = useRef(false);
  useFrame(() => {
    world.setTime(time.current);
    publish(frame);
    if (!drawn.current) {
      drawn.current = true;
      requestAnimationFrame(() => onReady()); // the frame is on screen by the next animation frame
    }
  });

  return <primitive object={world.root} />;
}
