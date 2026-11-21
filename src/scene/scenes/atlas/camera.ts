/**
 * The camera rig: one zoom scalar over three stops, 0 close in, 1 the whole galaxy, 2 the cosmic
 * web (ARCHITECTURE.md 4). Keys, log-distance interpolation and lens shift ported from
 * prototype/look.html; the keys are centred now that no copy sits beside the galaxy (D-092).
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
];

export const KEYS_PHONE: readonly Key[] = [
  { d: 3.0, el: 36, az: 0.0, sx: 0.0, sy: 0.22 },
  { d: 8.3, el: 52, az: 0.22, sx: 0.0, sy: 0.1 },
  { d: 3000, el: 60, az: 0.55, sx: 0.0, sy: 0.2 },
];

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
): void {
  const phone = isPhone(width, height);
  const K = phone ? KEYS_PHONE : KEYS_DESK;
  const i = Math.min(1, Math.floor(zoom));
  const f = sstep(0, 1, zoom - i);
  const a = K[i];
  const b = K[i + 1];
  const d = Math.exp(mix(Math.log(a.d), Math.log(b.d), f));
  // the tilt never takes the view under the disc or straight down onto it
  const el = clamp(mix(a.el, b.el, f) * DEG + pitch, 14 * DEG, 84 * DEG);
  const az = mix(a.az, b.az, f) + yaw;
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
  camera.updateProjectionMatrix();
  // lens shift: moves the subject without changing perspective; a dive centres its place
  camera.projectionMatrix.elements[8] = -mix(a.sx, b.sx, f) * (1 - k);
  camera.projectionMatrix.elements[9] = -mix(a.sy, b.sy, f) * (1 - k);
  camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
  camera.updateMatrixWorld(true);
}
