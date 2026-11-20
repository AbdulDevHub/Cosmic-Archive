/**
 * The nebula's three.js objects: one full-screen triangle and one shader material
 * (ARCHITECTURE.md 5), and the composition.
 *
 * As with the black hole, the composition is set in CSS pixels, not by a camera: the cluster
 * stands at a chosen point of the window and the cloud is a chosen size, so the page's copy keeps
 * its calm zone at every window size. The scene tells the DOM where its named places are
 * (`ANCHORS`), for the page's callouts.
 */

import { BufferAttribute, BufferGeometry, Mesh, ShaderMaterial, Vector2 } from "three";
import type { SceneFrame } from "../../host/store";
import type { ParticleTier } from "../../quality/tiers";
import { NEBULA_FRAGMENT, QUAD_VERTEX } from "./shader.glsl";

/** Octaves of the gas's noise per tier: the cost is per pixel, and the pixel budget already scales. */
const OCTAVES: Record<ParticleTier, number> = { low: 4, medium: 5, high: 6 };

const RING_RADIUS = 6.3; // units, around the cavity (CAVITY in the shader is 4.6)
const CAVITY = 4.6;

export const isPhone = (width: number, height: number) => width / height < 0.8;

/** Where the cluster stands and how big a unit is, in CSS pixels. */
function compose(width: number, height: number) {
  if (isPhone(width, height)) {
    return { x: width * 0.5, y: height * 0.25, scale: Math.min(width * 0.05, height * 0.024) };
  }
  // right of centre, clear of the copy at the lower left; the columns reach down past the fold
  return { x: width * 0.655, y: height * 0.37, scale: Math.min(height * 0.04, width * 0.026) };
}

/**
 * The places a callout can point at, in units from the cluster, y up. `content/subjects/nebulae.mdx`
 * names one per callout; the scene owns where each is.
 */
const ANCHORS: Record<string, readonly [number, number]> = {
  cluster: [0.0, 0.2],
  pillar: [0.5, -5.3],
  front: [-5.0, 0.1],
  glow: [8.6, -3.4],
};

export function makeFrame(): SceneFrame {
  const points: SceneFrame["points"] = {};
  for (const name of Object.keys(ANCHORS)) points[name] = { x: 0, y: 0, on: true };
  return { zoom: 0, width: 1, height: 1, narrow: false, points, radius: 1, shade: () => 0 };
}

export class NebulaWorld {
  readonly root: Mesh;
  private readonly material: ShaderMaterial;

  constructor() {
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3));
    this.material = new ShaderMaterial({
      vertexShader: QUAD_VERTEX,
      fragmentShader: NEBULA_FRAGMENT,
      depthTest: false,
      depthWrite: false,
      uniforms: {
        uResolution: { value: new Vector2(1, 1) },
        uDpr: { value: 1 },
        uCentre: { value: new Vector2(0, 0) },
        uScale: { value: 1 },
        uRing: { value: 1 },
        uTime: { value: 0 },
        uOctaves: { value: OCTAVES.medium },
        uNorm: { value: 1 },
      },
    });
    this.root = new Mesh(geometry, this.material);
    this.root.frustumCulled = false;
  }

  /** Everything that depends on the window or the tier: set when they change, not per frame. */
  resize(width: number, height: number, dpr: number, tier: ParticleTier, frame: SceneFrame): void {
    const { x, y, scale } = compose(width, height);
    const octaves = OCTAVES[tier];
    const u = this.material.uniforms;
    u.uResolution.value.set(Math.round(width * dpr), Math.round(height * dpr));
    u.uDpr.value = dpr;
    u.uCentre.value.set(x, y);
    u.uScale.value = scale;
    u.uRing.value = RING_RADIUS * scale;
    u.uOctaves.value = octaves;
    u.uNorm.value = 1 / (1 - 0.5 ** octaves); // the weights 1/2 + 1/4 + ... sum to this

    for (const [name, [ax, ay]] of Object.entries(ANCHORS)) {
      const point = frame.points[name];
      point.x = x + ax * scale;
      point.y = y - ay * scale;
    }

    frame.width = width;
    frame.height = height;
    frame.narrow = isPhone(width, height);
    frame.radius = RING_RADIUS * scale;
    // Bright on the cavity's wall and the cluster; mid over the body of the cloud; dark elsewhere.
    frame.shade = (px, py) => {
      const dx = (px - x) / scale;
      const dy = (y - py) / scale;
      const r = Math.hypot(dx, dy);
      if (r < 2) return 0.9;
      if (Math.abs(r - CAVITY) < 1.4) return 0.8;
      const body = Math.hypot((dx - 1.6) / 16, (dy + 4.6) / 10);
      return body < 0.8 ? 0.55 : 0;
    };
  }

  setTime(seconds: number): void {
    this.material.uniforms.uTime.value = seconds;
  }

  dispose(): void {
    this.root.geometry.dispose();
    this.material.dispose();
  }
}
