/**
 * The camera rig: one zoom scalar, 0 hero, 1 chart, 2 cosmic web (ARCHITECTURE.md 4).
 * Keys, log-distance interpolation and lens shift ported from prototype/look.html.
 * The hero sits close and fairly high: the galaxy overflows the frame, so the pull-back
 * to the web has somewhere to go.
 *
 * Free control (`/explore`) adds a turn and a tilt on top of the key for the current zoom.
 */

import type { PerspectiveCamera } from "three";
import { clamp, mix, sstep } from "./model";

interface Key {
  d: number;
  el: number;
  az: number;
  sx: number;
  sy: number;
}

export const KEYS_DESK: readonly Key[] = [
  { d: 1.95, el: 31, az: 0.1, sx: 0.4, sy: 0.2 },
  { d: 3.4, el: 50, az: 0.22, sx: 0.31, sy: 0.0 },
  { d: 2600, el: 55, az: 0.55, sx: 0.0, sy: 0.1 },
];

export const KEYS_PHONE: readonly Key[] = [
  { d: 3.0, el: 36, az: 0.0, sx: 0.0, sy: 0.38 },
  { d: 8.1, el: 62, az: 0.22, sx: 0.0, sy: 0.2 },
  { d: 3000, el: 60, az: 0.55, sx: 0.0, sy: 0.2 },
];

/** Phone compositions apply when the view is taller than 5:4 (the prototype's `phone()`). */
export const isPhone = (width: number, height: number) => width / height < 0.8;

const DEG = Math.PI / 180;

export function placeCamera(camera: PerspectiveCamera, zoom: number, width: number, height: number, yaw = 0, pitch = 0): void {
  const K = isPhone(width, height) ? KEYS_PHONE : KEYS_DESK;
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
  camera.lookAt(0, 0, 0);
  camera.updateProjectionMatrix();
  // lens shift: moves the subject without changing perspective
  camera.projectionMatrix.elements[8] = -mix(a.sx, b.sx, f);
  camera.projectionMatrix.elements[9] = -mix(a.sy, b.sy, f);
  camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
  camera.updateMatrixWorld(true);
}
