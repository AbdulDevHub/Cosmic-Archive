/**
 * The atlas scene: the galaxy (stops 0 and 1), the cosmic web (stop 2) and the supervoid (stop 3, D-119), on one zoom scalar.
 * Mounted by the host through the registry; never imported by a page.
 */

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import type { PerspectiveCamera } from "three";
import type { SceneBudget, SceneProps } from "../../host/types";
import { RUNGS } from "../../quality/tiers";
import { isPhone } from "./camera";
import { COUNTS } from "./model";
import { bakeSky } from "../../sky";
import { AtlasWorld, makeFrame } from "./world";

export const budget: SceneBudget = {
  // The most drawn in one frame: on the start page, the sky, 11 galaxy layers and 6 for the
  // planet, its air, the moons, the rocks, the ship and its engines (limit 30); mid-way between
  // the levels 16; at the web itself 7; out in the supervoid 8 (its foam is one full-screen
  // triangle over the sky, D-119).
  drawCalls: 18,
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
  const gl = useThree((s) => s.gl);
  // the deep sky's clouds behind the galaxy and the web, drawn once (D-101)
  const sky = useMemo(() => bakeSky(gl), [gl]);
  useEffect(() => () => sky.dispose(), [sky]);
  const world = useMemo(() => new AtlasWorld(particles, narrow, sky.texture), [particles, narrow, sky]);
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
