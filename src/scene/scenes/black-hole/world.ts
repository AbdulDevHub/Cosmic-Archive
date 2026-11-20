/**
 * The black hole's three.js objects: one full-screen triangle and one shader material
 * (ARCHITECTURE.md 5), and the composition.
 *
 * The composition is set in CSS pixels, not by a camera: the hole stands at a chosen point of
 * the window and is a chosen size, so the page's copy has its calm zone at every window size.
 * The scene also tells the DOM where its named places are (`ANCHORS`), for the page's callouts.
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
const RING_RADIUS = 10.9;

export const isPhone = (width: number, height: number) => width / height < 0.8;

/** Where the hole stands and how big it is, in CSS pixels. */
function compose(width: number, height: number) {
  if (isPhone(width, height)) {
    return { x: width * 0.5, y: height * 0.31, scale: Math.min(width * 0.043, height * 0.027) };
  }
  // right of centre, clear of the copy at the lower left; never wider than the room beside it
  return { x: width * 0.66, y: height * 0.455, scale: Math.min(height * 0.034, width * 0.0235) };
}

/**
 * The places a callout can point at. `content/subjects/black-holes.mdx` names one per callout;
 * the scene owns where each is. Disc points are given in the disc's plane (radius, angle); the
 * ones set by bent light are given as an offset on screen, in horizon radii.
 */
const TOWARD_CAMERA = Math.atan2(Math.cos(AZIMUTH), Math.sin(AZIMUTH));
type Anchor = { screen: readonly [number, number] } | { plane: readonly [number, number] };
const ANCHORS: Record<string, Anchor> = {
  shadow: { screen: [0, 0] },
  lensed: { screen: [-0.6, 4.5] },
  disc: { plane: [8.2, TOWARD_CAMERA + 1.05] },
  bright: { plane: [5.4, -AZIMUTH] },
};

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
  const points: SceneFrame["points"] = {};
  for (const name of Object.keys(ANCHORS)) points[name] = { x: 0, y: 0, on: true };
  return { zoom: 0, width: 1, height: 1, narrow: false, points, radius: 1, shade: () => 0 };
}

export class BlackHoleWorld {
  readonly root: Mesh;
  private readonly material: ShaderMaterial;
  private readonly cam: Vector3;
  private readonly fwd: Vector3;
  private readonly right: Vector3;
  private readonly up: Vector3;

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
        uRing: { value: 1 },
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
    u.uScale.value = scale;
    u.uRing.value = RING_RADIUS * scale;
    u.uSteps.value = MARCH[tier].steps;
    u.uStride.value = MARCH[tier].stride;

    const focal = scale * CAMERA_DISTANCE;
    const rel = new Vector3();
    for (const [name, anchor] of Object.entries(ANCHORS)) {
      const point = frame.points[name];
      if ("screen" in anchor) {
        point.x = x + anchor.screen[0] * scale;
        point.y = y - anchor.screen[1] * scale;
        continue;
      }
      const [r, angle] = anchor.plane;
      rel.set(r * Math.cos(angle), 0, r * Math.sin(angle)).sub(this.cam);
      const depth = rel.dot(this.fwd);
      point.x = x + (rel.dot(this.right) / depth) * focal;
      point.y = y - (rel.dot(this.up) / depth) * focal;
    }

    frame.width = width;
    frame.height = height;
    frame.narrow = isPhone(width, height);
    frame.radius = DISC_RADIUS * scale;
    // Bright where the disc is: a band across the hole along the rolled frame, and the bent
    // light around the shadow.
    const cos = Math.cos(ROLL);
    const sin = Math.sin(ROLL);
    frame.shade = (px, py) => {
      const dx = (px - x) / scale;
      const dy = (y - py) / scale;
      const along = dx * cos + dy * sin;
      const across = -dx * sin + dy * cos;
      const band = Math.abs(along) < DISC_RADIUS && Math.abs(across) < 1.9 ? 0.85 : 0;
      return Math.max(band, Math.hypot(dx, dy) < 5.6 ? 0.7 : 0);
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
