/**
 * The black hole's three.js objects: one full-screen triangle and one shader material
 * (ARCHITECTURE.md 5), and the composition.
 *
 * The composition is set in CSS pixels, not by a camera: the hole stands in the middle of the
 * window, as large as the window allows (D-092). On arrival (`view.arrive`, D-096) it grows from
 * far off to that size.
 */

import { BufferAttribute, BufferGeometry, Mesh, ShaderMaterial, Vector2, Vector3 } from "three";
import type { SceneFrame } from "../../host/store";
import type { ParticleTier } from "../../quality/tiers";
import { BLACK_HOLE_FRAGMENT, MAX_STEPS, QUAD_VERTEX } from "./shader.glsl";

/** How finely a ray is marched: steps, and the step as a fraction of the distance to the hole. */
export const MARCH: Record<ParticleTier, { steps: number; stride: number }> = {
  low: { steps: 60, stride: 0.15 },
  medium: { steps: 88, stride: 0.105 },
  high: { steps: MAX_STEPS, stride: 0.075 },
};

// The view, in units of the horizon's radius: a little above the disc's plane, and rolled, so
// the disc crosses the frame on a slant.
const CAMERA_DISTANCE = 30;
const ELEVATION = (8.5 * Math.PI) / 180;
const AZIMUTH = 0.6;
const ROLL = (-11 * Math.PI) / 180;
const DISC_RADIUS = 10;
/** How large the hole is when an arrival starts, as a share of its full size. */
const ARRIVE_FROM = 0.28;

export const isPhone = (width: number, height: number) => width / height < 0.8;

/** Where the hole stands and how big it is, in CSS pixels: centred, the disc well inside the frame. */
function compose(width: number, height: number) {
  if (isPhone(width, height)) return { x: width * 0.5, y: height * 0.45, scale: Math.min(width * 0.046, height * 0.03) };
  return { x: width * 0.5, y: height * 0.48, scale: Math.min(height * 0.042, width * 0.03) };
}

/** The camera, looking at the hole from a distance, a height above the disc and a turn, then rolled. */
export function cameraBasis(distance: number, elevation: number, azimuth: number, roll: number) {
  const cam = new Vector3(Math.cos(elevation) * Math.sin(azimuth), Math.sin(elevation), Math.cos(elevation) * Math.cos(azimuth)).multiplyScalar(distance);
  const fwd = cam.clone().normalize().negate();
  const right0 = new Vector3().crossVectors(fwd, new Vector3(0, 1, 0)).normalize();
  const up0 = new Vector3().crossVectors(right0, fwd);
  const right = right0.clone().multiplyScalar(Math.cos(roll)).addScaledVector(up0, Math.sin(roll));
  const up = up0.clone().multiplyScalar(Math.cos(roll)).addScaledVector(right0, -Math.sin(roll));
  return { cam, fwd, right, up };
}

export function makeFrame(): SceneFrame {
  return { zoom: 0, width: 1, height: 1, narrow: false, points: {}, radius: 1 };
}

export class BlackHoleWorld {
  readonly root: Mesh;
  private readonly material: ShaderMaterial;
  private readonly cam: Vector3;
  private readonly fwd: Vector3;
  private readonly right: Vector3;
  private readonly up: Vector3;
  private scale = 1;

  constructor() {
    ({ cam: this.cam, fwd: this.fwd, right: this.right, up: this.up } = cameraBasis(CAMERA_DISTANCE, ELEVATION, AZIMUTH, ROLL));

    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3));
    this.material = new ShaderMaterial({
      vertexShader: QUAD_VERTEX,
      fragmentShader: BLACK_HOLE_FRAGMENT,
      depthTest: false,
      depthWrite: false,
      uniforms: {
        uResolution: { value: new Vector2(1, 1) },
        uDpr: { value: 1 },
        uCentre: { value: new Vector2(0, 0) },
        uScale: { value: 1 },
        uTime: { value: 0 },
        uSteps: { value: MARCH.medium.steps },
        uStride: { value: MARCH.medium.stride },
        uCam: { value: this.cam },
        uRight: { value: this.right },
        uUp: { value: this.up },
        uFwd: { value: this.fwd },
      },
    });
    this.root = new Mesh(geometry, this.material);
    this.root.frustumCulled = false;
  }

  /** Everything that depends on the window or the tier: set when they change, not per frame. */
  resize(width: number, height: number, dpr: number, tier: ParticleTier, frame: SceneFrame): void {
    const { x, y, scale } = compose(width, height);
    const u = this.material.uniforms;
    u.uResolution.value.set(Math.round(width * dpr), Math.round(height * dpr));
    u.uDpr.value = dpr;
    u.uCentre.value.set(x, y);
    this.scale = scale;
    u.uSteps.value = MARCH[tier].steps;
    u.uStride.value = MARCH[tier].stride;

    frame.width = width;
    frame.height = height;
    frame.narrow = isPhone(width, height);
    frame.radius = DISC_RADIUS * scale;
  }

  /** How far the hole has arrived: 0 small and far off, 1 full size. */
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
