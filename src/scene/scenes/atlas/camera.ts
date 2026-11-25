/**
 * The camera rig: one zoom scalar over four stops, 0 close in, 1 the whole galaxy, 2 the cosmic
 * web, 3 the supervoid around it (ARCHITECTURE.md 4, D-119), 4 the observable universe (D-130). Keys, log-distance interpolation and lens shift ported from
 * the F1 prototype (removed in D-135; in git history); the keys are centred now that no copy sits beside the galaxy (D-092).
 *
 * Free control adds a turn and a tilt on top of the key for the current zoom. A dive (D-096) then
 * carries the camera from wherever it is into one named place: the look turns toward it and the
 * distance closes on it, on a log scale, so the approach is as smooth from the web as from the disc.
 */

import { Vector3, type PerspectiveCamera } from "three";
import { clamp, mix, sstep } from "./model";

interface Key {
  d: number;
  el: number;
  az: number;
  sx: number;
  sy: number;
}

export const KEYS_DESK: readonly Key[] = [
  { d: 1.95, el: 31, az: 0.1, sx: 0.06, sy: 0.16 },
  { d: 3.55, el: 44, az: 0.22, sx: 0.0, sy: 0.04 },
  { d: 2600, el: 55, az: 0.55, sx: 0.0, sy: 0.1 },
  // the supervoids (D-119, D-132): far enough that the whole web is a patch of wall, centred where
  // the walls of three voids meet (world.ts places the voids)
  { d: 11000, el: 62, az: 0.7, sx: 0.0, sy: 0.04 },
  // the observable universe (D-130): further off still (inside the far plane), our web in the
  // middle of the frame, for it is the middle of the sphere world.ts draws around it
  { d: 24000, el: 66, az: 0.8, sx: 0.0, sy: 0.0 },
  // the Multiverse and the Omniverse (D-184): the camera holds still; the universe shrinks into a
  // line of universes, and the line into a row of lights among many bubbles (world.ts, multiverse.ts)
  { d: 24000, el: 66, az: 0.8, sx: 0.0, sy: 0.0 },
  { d: 24000, el: 66, az: 0.8, sx: 0.0, sy: 0.0 },
];

export const KEYS_PHONE: readonly Key[] = [
  { d: 3.0, el: 36, az: 0.0, sx: 0.0, sy: 0.22 },
  { d: 8.3, el: 52, az: 0.22, sx: 0.0, sy: 0.1 },
  { d: 3000, el: 60, az: 0.55, sx: 0.0, sy: 0.2 },
  // on a phone too the web sits where the three walls meet
  { d: 12500, el: 64, az: 0.7, sx: 0.0, sy: 0.0 },
  { d: 26000, el: 66, az: 0.8, sx: 0.0, sy: 0.08 },
  { d: 26000, el: 66, az: 0.8, sx: 0.0, sy: 0.08 },
  { d: 26000, el: 66, az: 0.8, sx: 0.0, sy: 0.08 },
];

/** The stop the zoom ends at: the Omniverse (D-184), past the Multiverse and the observable universe (D-130). */
export const LAST_STOP = KEYS_DESK.length - 1;

/**
 * The start page (D-107): the galaxy large on the right, seen lower and from further off, with the
 * planet, moons, asteroids and ship before it (start.ts). `intro` blends from here (1) to stop 1 (0).
 * `roll` turns the view about its axis so the galaxy rises to the upper right, its face opened
 * toward the ship coming from the lower left (D-109); it unwinds during the flight in.
 */
// D-199: closer (d 4.3 to 3.3), so the galaxy fills the upper right as the mockup's does
// D-205: a little lower and further right (sx 0.3 to 0.37, sy 0.15 to 0.06)
export const START_DESK: Key & { roll: number } = { d: 3.3, el: 46, az: -0.35, sx: 0.37, sy: 0.06, roll: -0.42 };
export const START_PHONE: Key & { roll: number } = { d: 9.5, el: 48, az: -0.35, sx: 0.0, sy: 0.34, roll: -0.3 };

/** Phone compositions apply when the view is taller than 5:4 (the prototype's `phone()`). */
export const isPhone = (width: number, height: number) => width / height < 0.8;

const DEG = Math.PI / 180;
/** How close a finished dive stands to its place: inside the glow. */
const DIVE_END = 0.012;

const look = new Vector3();
const away = new Vector3();

export function placeCamera(
  camera: PerspectiveCamera,
  zoom: number,
  width: number,
  height: number,
  yaw = 0,
  pitch = 0,
  focus: Vector3 | null = null,
  dive = 0,
  intro = 0,
): void {
  const phone = isPhone(width, height);
  const K = phone ? KEYS_PHONE : KEYS_DESK;
  const i = Math.min(LAST_STOP - 1, Math.floor(zoom));
  const f = sstep(0, 1, zoom - i);
  const a = K[i];
  const b = K[i + 1];
  // the start page's view blends in over the stop's (it is only ever shown at stop 1)
  const s = phone ? START_PHONE : START_DESK;
  const g = sstep(0, 1, intro);
  const lerpKey = (k: keyof Key) => mix(mix(a[k], b[k], f), s[k], g);
  const d = Math.exp(mix(mix(Math.log(a.d), Math.log(b.d), f), Math.log(s.d), g));
  // the tilt never takes the view under the disc or straight down onto it
  const el = clamp(lerpKey("el") * DEG + pitch, 14 * DEG, 84 * DEG);
  const az = lerpKey("az") + yaw;
  camera.aspect = width / height;
  camera.position.set(Math.sin(az) * Math.cos(el) * d, Math.sin(el) * d, Math.cos(az) * Math.cos(el) * d);
  look.set(0, 0, 0);

  const k = focus ? sstep(0, 1, dive) : 0;
  if (focus && k > 0) {
    look.lerp(focus, sstep(0, 0.55, dive));
    away.copy(camera.position).sub(focus);
    const from = Math.max(away.length(), DIVE_END);
    away.normalize().multiplyScalar(Math.exp(mix(Math.log(from), Math.log(DIVE_END), k)));
    camera.position.copy(focus).add(away);
  }
  camera.lookAt(look);
  if (g > 0) camera.rotateZ(s.roll * g);
  camera.updateProjectionMatrix();
  // lens shift: moves the subject without changing perspective; a dive centres its place
  camera.projectionMatrix.elements[8] = -lerpKey("sx") * (1 - k);
  camera.projectionMatrix.elements[9] = -lerpKey("sy") * (1 - k);
  camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
  camera.updateMatrixWorld(true);
}
