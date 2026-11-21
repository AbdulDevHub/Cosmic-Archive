/**
 * The atlas scene: the galaxy (stops 0 and 1) and the cosmic web (stop 2), on one zoom scalar.
 * Mounted by the host through the registry; never imported by a page.
 */

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import type { PerspectiveCamera } from "three";
import type { SceneBudget, SceneProps } from "../../host/types";
import { RUNGS } from "../../quality/tiers";
import { isPhone } from "./camera";
import { COUNTS } from "./model";
import { AtlasWorld, makeFrame } from "./world";

export const budget: SceneBudget = {
  // The most drawn in one frame is mid-way between the levels: 11 galaxy layers and the web's 4
  // (limit 30). At the web itself it is 6.
  drawCalls: 15,
  particles: {
    low: COUNTS.low.disc + COUNTS.low.web,
    medium: COUNTS.medium.disc + COUNTS.medium.web,
    high: COUNTS.high.disc + COUNTS.high.web,
  },
};

export default function AtlasScene({ rung, time, view, publish, onReady }: SceneProps) {
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
  const frame = useMemo(() => makeFrame(), []);

  useLayoutEffect(() => {
    world.setGlow(glow);
    world.resize(camera, width, height, dpr);
    invalidate();
  }, [world, glow, camera, width, height, dpr, invalidate]);

  const drawn = useRef(false);
  useFrame(() => {
    world.frame(camera, time.current, view.current, width, height, frame);
    publish(frame);
    if (!drawn.current) {
      drawn.current = true;
      requestAnimationFrame(() => onReady()); // the frame is on screen by the next animation frame
    }
  });

  return <primitive object={world.root} />;
}
