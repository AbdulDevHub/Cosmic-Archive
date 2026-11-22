/**
 * The neutron star (D-116): our own illustration of a pulsar. A tiny, blazing blue-white ball,
 * hot where its magnetic poles meet the surface; two beams of light from those poles sweep round
 * as it spins, flaring when one points our way; a glowing ring of wind at its equator; and the
 * stars behind it bent by its gravity. One draw call, no particles. Mounted by the host through
 * the registry; never imported by a page.
 */

import type { SceneBudget, SceneProps } from "../../host/types";
import { SKY_CHUNK } from "../../shaders/sky.glsl";
import { ORB_COMMON, useOrbScene, type OrbConfig } from "../shared/orb";

export const budget: SceneBudget = {
  drawCalls: 1,
  particles: { low: 0, medium: 0, high: 0 }, // no particles: the cost is per pixel
};

const FRAGMENT = /* glsl */ `
${ORB_COMMON}
#define SKY_LAYERS 4
${SKY_CHUNK}

const vec3 WHITE = vec3(1.0, 0.98, 0.95);
const vec3 HOT = vec3(0.72, 0.85, 1.0);
const vec3 BLUE = vec3(0.3, 0.52, 1.0);
const vec3 VIOLET = vec3(0.58, 0.38, 1.0);
const vec3 ROSE = vec3(0.98, 0.38, 0.7);
const float PERIOD = 2.4;        // seconds a turn: slowed for the eye; real ones turn in milliseconds to seconds
const float TILT = 0.62;         // the magnetic axis leans this far from the spin axis, radians
const float RING = 3.4;          // the equatorial wind's radius, in star radii

/* the deep sky, the screen read as a small patch of the sphere, bent around the star */
vec3 sky(vec2 css, vec2 u, float r){
  vec2 size = uResolution / uDpr;
  // light passing close to the star is bent: each pixel sees the sky from a little further out
  vec2 bent = css + (r > 1.0 ? normalize(u) * vec2(1.0, -1.0) * uScale * 1.6 / r : vec2(0.0));
  vec2 v = (bent - size * 0.5) / size.y;
  return skyDeep(normalize(vec3(v * 1.4, -1.0)), 0.75);
}

/* one beam of light from a magnetic pole; a is the pole's direction, z toward the visitor */
vec3 beam(vec2 u, vec3 a, float r){
  vec2 dir = a.xy;
  float len = length(dir);
  vec3 light = vec3(0.0);
  if (len > 0.02) {
    dir /= len;
    float along = dot(u, dir) / len;   // foreshortened: a beam toward us looks short
    float across = abs(u.x * dir.y - u.y * dir.x);
    float width = 0.18 + max(along, 0.0) * len * 0.11;
    float cone = exp(-(across * across) / (width * width)) * smoothstep(0.85, 1.2, along * len + 0.15) * exp(-max(along, 0.0) * len * 0.07);
    float core = exp(-(across * across) / (width * width * 0.08));
    // hidden where it passes behind the star
    float behind = (a.z < 0.0 && r < 1.0) ? 0.0 : 1.0;
    light = (mix(BLUE, VIOLET, smoothstep(2.0, 14.0, along * len)) * cone * 0.9 + WHITE * core * cone * 0.9) * behind;
  }
  // a flash when the beam sweeps across the visitor
  float facing = pow(max(a.z, 0.0), 10.0);
  light += WHITE * facing * (2.2 / (1.0 + r * r * 0.6));
  return light;
}

void main(){
  vec2 css = vec2(gl_FragCoord.x, uResolution.y - gl_FragCoord.y) / uDpr;
  vec2 q = css - uCentre;
  q.y = -q.y;
  vec2 u = q / uScale;     // star radii, y up
  float r = length(u);
  float t = uTime;

  // the visitor's turn: dragging tips the spin axis toward or away from them
  mat3 view = turnX(0.38 - uPitch) * turnY(uYaw);
  mat3 back = transpose(view);
  float spin = t * TAU / PERIOD;
  vec3 magBody = vec3(sin(TILT), cos(TILT), 0.0);       // the magnetic axis, in the star's own frame
  mat3 turning = turnY(spin);
  vec3 mag = view * (turning * magBody);                // ...seen by the visitor
  vec3 axis = view * vec3(0.0, 1.0, 0.0);

  vec3 col = sky(css, u, r);

  // ---- the equatorial wind: a glowing, turbulent ring in the plane of the spin ----
  // a ray straight into the screen at u meets the plane dot(p, axis) = 0 at depth z
  float z = abs(axis.z) > 0.03 ? -(u.x * axis.x + u.y * axis.y) / axis.z : 1e3;
  vec3 onPlane = back * vec3(u, z);
  float pr = length(onPlane.xz);
  float swirl = atan(onPlane.z, onPlane.x) - t * 0.25;
  float gas = fbm3(vec3(cos(swirl) * pr, sin(swirl) * pr, t * 0.05) * 0.9);
  float ring = exp(-pow((pr - RING) / (1.1 + 0.6 * gas), 2.0)) * (0.35 + 0.9 * gas) + exp(-pr * 0.9) * 0.25;
  float ringHidden = (z < 0.0 && r < 1.0) ? 0.0 : 1.0;
  vec3 wind = mix(VIOLET, mix(BLUE, ROSE, gas), 0.6) * ring * 0.55 * ringHidden * step(z, 1e2);

  // ---- the beams, behind and in front ----
  vec3 beams = beam(u, mag, r) + beam(u, -mag, r);

  // ---- the star itself ----
  vec3 starLight = vec3(0.0);
  float body = 0.0;
  if (r < 1.0) {
    vec3 n = vec3(u, sqrt(1.0 - r * r));
    vec3 b = transpose(turning) * (back * n);          // a point on the surface, in the star's frame
    float mu = n.z;
    float crust = fbm3(b * 6.0 + 3.0);
    float poles = exp(-(1.0 - abs(dot(b, magBody))) * 26.0);
    vec3 surface = mix(BLUE * 0.9, HOT, 0.55 + 0.45 * mu) * (0.75 + 0.45 * crust);
    surface = mix(surface, WHITE * 1.6, poles);
    starLight = surface * (0.65 + 0.55 * mu) * 1.25;
    body = smoothstep(1.0, 0.96, r);
  }
  // its glare: a tight white core and a wide blue halo
  float glow = exp(-max(r - 1.0, 0.0) * 2.2) * 0.85 + 0.22 / (1.0 + r * r * 0.4);

  col = col * (1.0 - body) + starLight * body + wind + beams + mix(HOT, BLUE, 0.4) * glow * (1.0 - body * 0.6);
  // a soft roll-off instead of a hard clip at white
  col = col / (1.0 + max(col - 0.85, 0.0) * 0.9);
  gl_FragColor = vec4(col, 1.0);
}
`;

const CONFIG: OrbConfig = {
  fragment: FRAGMENT,
  // small at its framing, its beams reaching across the window; all the way in it is larger
  framing: (width, height) => Math.min(height * 0.045, width * 0.03),
  close: 3.2,
  arriveFrom: 0.3,
  detail: { low: 0, medium: 1, high: 2 },
};

export default function NeutronStarScene(props: SceneProps) {
  return <primitive object={useOrbScene(CONFIG, props)} />;
}
