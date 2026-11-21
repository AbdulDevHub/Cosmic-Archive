/**
 * The quasar: the black-hole scene seen from far off, with jets (D-073). The same shader as
 * `scenes/black-hole`, compiled with `QUASAR` defined, on one full-screen triangle.
 *
 * As with the black hole, the composition is set in CSS pixels: the core stands in the middle of
 * the window and the jets reach most of the way to its edges (D-092). The jets leave along the
 * disc's axis; the camera's roll tilts them off the vertical. On arrival (`view.arrive`, D-096)
 * the whole quasar grows from far off to that size.
 */

import { BufferAttribute, BufferGeometry, Mesh, ShaderMaterial, Vector2, Vector3, type Texture } from "three";
import type { SceneFrame, SceneInput } from "../../host/store";
import type { ParticleTier } from "../../quality/tiers";
import { BLACK_HOLE_FRAGMENT, QUAD_VERTEX } from "../black-hole/shader.glsl";
import { cameraBasis, MARCH, placeScale } from "../black-hole/world";

// The view, in horizon radii: far off and higher above the disc than on the Black Holes page, so
// the disc is a small bright oval and the jets stand out of it.
const CAMERA_DISTANCE = 120;
const ELEVATION = (24 * Math.PI) / 180;
const AZIMUTH = 0.6;
const RADIUS = 14; // horizon radii: the core and its glare, inside the host galaxy
/** How large the quasar is when an arrival starts, as a share of its full size. */
const ARRIVE_FROM = 0.3;
/** Moving all the way closer goes right in to the core: the disc and the hole's shadow show. */
const CLOSE = 14;
const MARCH_RADIUS = 26; // rays are bent only this close to the hole; beyond, the bending is too small to see
const HOST_ANGLE = -0.25; // the host galaxy's long axis on screen, radians from the horizontal

export const isPhone = (width: number, height: number) => width / height < 0.8;

/** Where the core stands, how big a horizon radius is, how long each jet is and how it leans. */
function compose(width: number, height: number) {
  if (isPhone(width, height)) {
    const scale = Math.min(width * 0.0145, height * 0.0068);
    // the jets cross the narrow screen on a diagonal
    return { x: width * 0.5, y: height * 0.44, scale, jet: (height * 0.3) / scale, roll: (30 * Math.PI) / 180 };
  }
  const scale = Math.min(height * 0.0072, width * 0.005);
  return { x: width * 0.5, y: height * 0.5, scale, jet: (height * 0.4) / scale, roll: (20 * Math.PI) / 180 };
}

export function makeFrame(): SceneFrame {
  return { zoom: 0, width: 1, height: 1, narrow: false, points: {}, radius: 1 };
}

export class QuasarWorld {
  readonly root: Mesh;
  private readonly material: ShaderMaterial;
  private roll = Number.NaN;
  private scale = 1;
  private yaw = Number.NaN;
  private pitch = Number.NaN;
  private width = 1;
  private height = 1;

  constructor(sky: Texture) {
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
        uSky: { value: sky },
      },
    });
    this.root = new Mesh(geometry, this.material);
    this.root.frustumCulled = false;
  }

  /** Everything that depends on the window or the tier: set when they change, not per frame. */
  resize(width: number, height: number, dpr: number, tier: ParticleTier, frame: SceneFrame): void {
    const { x, y, scale, jet, roll } = compose(width, height);
    const u = this.material.uniforms;
    this.width = width;
    this.height = height;
    if (roll !== this.roll) {
      this.roll = roll;
      this.aim(roll);
    }
    u.uResolution.value.set(Math.round(width * dpr), Math.round(height * dpr));
    u.uDpr.value = dpr;
    u.uCentre.value.set(x, y);
    this.scale = scale;
    u.uSteps.value = MARCH[tier].steps;
    u.uStride.value = MARCH[tier].stride;
    u.uJetLength.value = jet;

    frame.width = width;
    frame.height = height;
    frame.narrow = isPhone(width, height);
    frame.radius = RADIUS * scale;
  }

  /**
   * The visitor's view: how far the quasar has arrived and how close they have moved (its size;
   * all the way closer is inside the glare, at the disc), and a drag, which turns the camera
   * around it, so the jets swing and the far one comes into view.
   */
  setView(view: SceneInput): void {
    const scale = this.scale * placeScale(view.arrive, view.zoom, ARRIVE_FROM, CLOSE);
    const u = this.material.uniforms;
    u.uScale.value = scale;
    u.uMarch.value = MARCH_RADIUS * scale;
    if (view.yaw === this.yaw && view.pitch === this.pitch) return;
    this.yaw = view.yaw;
    this.pitch = view.pitch;
    this.aim(compose(this.width, this.height).roll);
  }

  /** Points the camera: the composition's roll, turned and lifted by the visitor's drag. */
  private aim(roll: number): void {
    const u = this.material.uniforms;
    const yaw = Number.isNaN(this.yaw) ? 0 : this.yaw;
    const pitch = Number.isNaN(this.pitch) ? 0 : this.pitch;
    const { cam, fwd, right, up } = cameraBasis(CAMERA_DISTANCE, ELEVATION - pitch, AZIMUTH + yaw, roll);
    u.uCam.value.copy(cam);
    u.uFwd.value.copy(fwd);
    u.uRight.value.copy(right);
    u.uUp.value.copy(up);
    // the disc's axis (world y) seen on screen: the near jet, since the camera is above the disc
    u.uJetDir.value.set(right.y, up.y).normalize();
  }

  setTime(seconds: number): void {
    this.material.uniforms.uTime.value = seconds;
  }

  dispose(): void {
    this.root.geometry.dispose();
    this.material.dispose();
  }
}
