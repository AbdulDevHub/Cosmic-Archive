/**
 * The nebula's three.js objects: one full-screen triangle and one shader material
 * (ARCHITECTURE.md 5), and the composition.
 *
 * As with the black hole, the composition is set in CSS pixels, not by a camera: the cluster
 * stands a little above the middle of the window, its columns rising toward it from below, and
 * the cloud fills the frame (D-092). On arrival (`view.arrive`, D-096) it grows to that size.
 */

import { BufferAttribute, BufferGeometry, Mesh, ShaderMaterial, Vector2 } from "three";
import type { SceneFrame } from "../../host/store";
import type { ParticleTier } from "../../quality/tiers";
import { NEBULA_FRAGMENT, QUAD_VERTEX } from "./shader.glsl";

/** Octaves of the gas's noise per tier: the cost is per pixel, and the pixel budget already scales. */
const OCTAVES: Record<ParticleTier, number> = { low: 4, medium: 5, high: 6 };

const RADIUS = 6.3; // units: a little past the cavity's wall (CAVITY in the shader is 4.6)
/** How large the cloud is when an arrival starts, as a share of its full size. */
const ARRIVE_FROM = 0.4;

export const isPhone = (width: number, height: number) => width / height < 0.8;

/** Where the cluster stands and how big a unit is, in CSS pixels. */
function compose(width: number, height: number) {
  if (isPhone(width, height)) return { x: width * 0.5, y: height * 0.34, scale: Math.min(width * 0.056, height * 0.027) };
  return { x: width * 0.52, y: height * 0.4, scale: Math.min(height * 0.046, width * 0.03) };
}

export function makeFrame(): SceneFrame {
  return { zoom: 0, width: 1, height: 1, narrow: false, points: {}, radius: 1 };
}

export class NebulaWorld {
  readonly root: Mesh;
  private readonly material: ShaderMaterial;
  private scale = 1;

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
    this.scale = scale;
    u.uOctaves.value = octaves;
    u.uNorm.value = 1 / (1 - 0.5 ** octaves); // the weights 1/2 + 1/4 + ... sum to this

    frame.width = width;
    frame.height = height;
    frame.narrow = isPhone(width, height);
    frame.radius = RADIUS * scale;
  }

  /** How far the cloud has arrived: 0 small and far off, 1 full size. */
  setArrive(arrive: number): void {
    this.material.uniforms.uScale.value = this.scale * (ARRIVE_FROM + (1 - ARRIVE_FROM) * arrive);
  }

  setTime(seconds: number): void {
    this.material.uniforms.uTime.value = seconds;
  }

  dispose(): void {
    this.root.geometry.dispose();
    this.material.dispose();
  }
}
