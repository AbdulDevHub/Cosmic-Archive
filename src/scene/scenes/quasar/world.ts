/**
 * The quasar: the black-hole scene seen from far off, with jets (D-073). The same shader as
 * `scenes/black-hole`, compiled with `QUASAR` defined, on one full-screen triangle.
 *
 * As with the black hole, the composition is set in CSS pixels: the core stands at a chosen point
 * of the window and a horizon radius is a chosen number of pixels, so the page's copy keeps its
 * calm zone at every window size. The jets leave along the disc's axis; the camera's roll tilts
 * them off the vertical. The scene tells the DOM where its named places are (`ANCHORS`).
 */

import { BufferAttribute, BufferGeometry, Mesh, ShaderMaterial, Vector2, Vector3 } from "three";
import type { SceneFrame } from "../../host/store";
import type { ParticleTier } from "../../quality/tiers";
import { BLACK_HOLE_FRAGMENT, QUAD_VERTEX } from "../black-hole/shader.glsl";
import { cameraBasis, MARCH } from "../black-hole/world";

// The view, in horizon radii: far off and higher above the disc than on the Black Holes page, so
// the disc is a small bright oval and the jets stand out of it.
const CAMERA_DISTANCE = 120;
const ELEVATION = (24 * Math.PI) / 180;
const AZIMUTH = 0.6;
const RING_RADIUS = 14; // around the core, inside the host galaxy
const MARCH_RADIUS = 26; // rays are bent only this close to the hole; beyond, the bending is too small to see
const HOST_ANGLE = -0.25; // the host galaxy's long axis on screen, radians from the horizontal

export const isPhone = (width: number, height: number) => width / height < 0.8;

/** Where the core stands, how big a horizon radius is, how long each jet is and how it leans. */
function compose(width: number, height: number) {
  if (isPhone(width, height)) {
    const scale = Math.min(width * 0.0135, height * 0.0063);
    // the jets cross the narrow screen on a diagonal, leaving the upper left and the lower right for the labels
    return { x: width * 0.5, y: height * 0.36, scale, jet: (height * 0.25) / scale, roll: (42 * Math.PI) / 180 };
  }
  // right of centre, the near jet rising to the upper right, the far one falling past the copy's right edge
  const scale = Math.min(height * 0.0062, width * 0.0042);
  return { x: width * 0.64, y: height * 0.5, scale, jet: (height * 0.36) / scale, roll: (20 * Math.PI) / 180 };
}

/**
 * The places a callout can point at. `content/subjects/quasars.mdx` names one per callout; the
 * scene owns where each is. `screen` is an offset in horizon radii, y up; `jet` a fraction of a
 * jet's length along it (negative: the far jet); `host` a point in the host galaxy's own axes.
 */
type Anchor = { screen: readonly [number, number] } | { jet: number } | { host: readonly [number, number] };
const ANCHORS: Record<string, Anchor> = {
  nucleus: { screen: [0, 0] },
  jet: { jet: 0.5 },
  counterjet: { jet: -0.55 },
  host: { host: [-24, 4] },
};

export function makeFrame(): SceneFrame {
  const points: SceneFrame["points"] = {};
  for (const name of Object.keys(ANCHORS)) points[name] = { x: 0, y: 0, on: true };
  return { zoom: 0, width: 1, height: 1, narrow: false, points, radius: 1, shade: () => 0 };
}

export class QuasarWorld {
  readonly root: Mesh;
  private readonly material: ShaderMaterial;
  private roll = Number.NaN;

  constructor() {
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3));
    this.material = new ShaderMaterial({
      vertexShader: QUAD_VERTEX,
      fragmentShader: BLACK_HOLE_FRAGMENT,
      defines: { QUASAR: "" },
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
        uCam: { value: new Vector3() },
        uRight: { value: new Vector3() },
        uUp: { value: new Vector3() },
        uFwd: { value: new Vector3() },
        uJetDir: { value: new Vector2(0, 1) },
        uJetLength: { value: 40 },
        uHostAngle: { value: HOST_ANGLE },
        uMarch: { value: 1 },
      },
    });
    this.root = new Mesh(geometry, this.material);
    this.root.frustumCulled = false;
  }

  /** Everything that depends on the window or the tier: set when they change, not per frame. */
  resize(width: number, height: number, dpr: number, tier: ParticleTier, frame: SceneFrame): void {
    const { x, y, scale, jet, roll } = compose(width, height);
    const u = this.material.uniforms;
    if (roll !== this.roll) {
      this.roll = roll;
      const { cam, fwd, right, up } = cameraBasis(CAMERA_DISTANCE, ELEVATION, AZIMUTH, roll);
      u.uCam.value.copy(cam);
      u.uFwd.value.copy(fwd);
      u.uRight.value.copy(right);
      u.uUp.value.copy(up);
      // the disc's axis (world y) seen on screen: the near jet, since the camera is above the disc
      u.uJetDir.value.set(right.y, up.y).normalize();
    }
    u.uResolution.value.set(Math.round(width * dpr), Math.round(height * dpr));
    u.uDpr.value = dpr;
    u.uCentre.value.set(x, y);
    u.uScale.value = scale;
    u.uRing.value = RING_RADIUS * scale;
    u.uSteps.value = MARCH[tier].steps;
    u.uStride.value = MARCH[tier].stride;
    u.uJetLength.value = jet;
    u.uMarch.value = MARCH_RADIUS * scale;

    const dir = u.uJetDir.value as Vector2;
    const c = Math.cos(HOST_ANGLE);
    const s = Math.sin(HOST_ANGLE);
    for (const [name, anchor] of Object.entries(ANCHORS)) {
      const point = frame.points[name];
      let ux: number;
      let uy: number;
      if ("screen" in anchor) [ux, uy] = anchor.screen;
      else if ("jet" in anchor) [ux, uy] = [dir.x * anchor.jet * jet, dir.y * anchor.jet * jet];
      else [ux, uy] = [c * anchor.host[0] - s * anchor.host[1], s * anchor.host[0] + c * anchor.host[1]];
      point.x = x + ux * scale;
      point.y = y - uy * scale;
    }

    frame.width = width;
    frame.height = height;
    frame.narrow = isPhone(width, height);
    frame.radius = RING_RADIUS * scale;
    // Bright at the core and along the jets; the ring; faint over the host galaxy; dark elsewhere.
    frame.shade = (px, py) => {
      const ux = (px - x) / scale;
      const uy = (y - py) / scale;
      const r = Math.hypot(ux, uy);
      if (r < 8) return 0.95;
      if (Math.abs(r - RING_RADIUS) < 2.5) return 0.6; // the ticked ring: keep labels off it
      const along = Math.abs(ux * dir.x + uy * dir.y);
      const across = Math.abs(ux * dir.y - uy * dir.x);
      if (along < jet * 1.05 && across < 3 + along * 0.06) return 0.75;
      const hx = (c * ux + s * uy) / 40;
      const hy = (-s * ux + c * uy) / 16;
      return Math.hypot(hx, hy) < 0.9 ? 0.35 : 0;
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
