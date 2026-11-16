/**
 * The atlas scene: the galaxy (Level 1) and, from F3b, the cosmic web (Level 2).
 * Mounted by the host through the registry; never imported by a page.
 */

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import type { PerspectiveCamera } from "three";
import type { SceneBudget, SceneProps } from "../../host/types";
import { RUNGS } from "../../quality/tiers";
import { isPhone } from "./camera";
import { COUNTS } from "./model";
import { AtlasWorld } from "./world";

export const budget: SceneBudget = {
  drawCalls: 20, // 12 particle layers, 5 ink lines, trail, vessel (limit 30)
  particles: { low: COUNTS.low.disc, medium: COUNTS.medium.disc, high: COUNTS.high.disc },
};

export default function AtlasScene({ rung, time, zoom, onReady }: SceneProps) {
  const camera = useThree((s) => s.camera) as PerspectiveCamera;
  const width = useThree((s) => s.size.width);
  const height = useThree((s) => s.size.height);
  const dpr = useThree((s) => s.viewport.dpr);
  const invalidate = useThree((s) => s.invalidate);
  const { particles, glow } = RUNGS[rung];
  const narrow = isPhone(width, height);

  // Particle attributes are built once per tier (and per phone/desktop composition), never per frame.
  const world = useMemo(() => new AtlasWorld(particles, narrow), [particles, narrow]);
  useEffect(() => () => world.dispose(), [world]);

  useLayoutEffect(() => {
    world.setGlow(glow);
    world.resize(camera, width, height, dpr);
    invalidate();
  }, [world, glow, camera, width, height, dpr, invalidate]);

  const drawn = useRef(false);
  useFrame(() => {
    world.frame(camera, time.current, zoom.current, width, height);
    if (!drawn.current) {
      drawn.current = true;
      requestAnimationFrame(() => onReady()); // the frame is on screen by the next animation frame
    }
  });

  return <primitive object={world.root} />;
}
