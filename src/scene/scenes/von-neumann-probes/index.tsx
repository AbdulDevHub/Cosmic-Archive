/**
 * Von Neumann Probes (D-167): our own illustration of self-copying probes spreading through a
 * galaxy, a megastructure idea in A Quasar Galaxy. A spiral galaxy seen at a slant; from one star
 * system near its edge a front of mint-green light spreads slowly across it, system after system
 * waking as copies arrive, each a small, sharp mint spark that pulses as it builds the next; behind
 * the front, the reached stars keep a soft silver glow; ahead of it, the galaxy is still its own
 * colours. The front grows, then fades and starts again. One full-screen shader, one draw call, no
 * particles. Its own colour family: mint green, silver and indigo.
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

const vec3 MINT = vec3(0.4, 1.0, 0.75);
const vec3 SILVER = vec3(0.82, 0.86, 0.95);
const vec3 INDIGO = vec3(0.25, 0.22, 0.6);
const vec3 WARM = vec3(1.0, 0.82, 0.6);
const float CYCLE = 40.0;

void main(){
  vec2 css = vec2(gl_FragCoord.x, uResolution.y - gl_FragCoord.y) / uDpr;
  vec2 q = css - uCentre;
  q.y = -q.y;
  vec2 u = q / uScale;     // the galaxy's radii, y up
  float t = uTime;
  vec2 size = uResolution / uDpr;
  vec3 col = skyDeep(normalize(vec3((css - size * 0.5) / size.y * 1.3, -1.0)), 0.4) * 0.55;

  // the disc, back onto its plane
  float st = clamp(0.5 + uPitch * 0.6, 0.25, 0.9);
  vec2 d = vec2(u.x, u.y / st);
  float a0 = uYaw + t * 0.004;
  d = vec2(cos(a0) * d.x - sin(a0) * d.y, sin(a0) * d.x + cos(a0) * d.y);
  float r = length(d);
  float th = atan(d.y, d.x);
  float wind = th - log(max(r, 0.02)) * 2.4;
  float arms = pow(0.5 + 0.5 * cos(2.0 * wind + fbm3(vec3(d * 3.0, 1.0)) - 0.5), 2.5);
  float disc = exp(-r / 0.38) * smoothstep(1.05, 0.65, r);
  vec3 galaxy = mix(WARM, INDIGO * 1.6, smoothstep(0.05, 0.6, r)) * disc * (0.25 + 1.3 * arms);
  galaxy += WARM * exp(-length(u) / 0.06) * 0.7;
  col += galaxy * 0.8;

  // the front: spreading from a system near the edge, over the cycle
  vec2 origin = vec2(0.62, -0.2);
  float age = mod(t + 4.0, CYCLE);   // the poster frame (t = 12) catches the front well under way
  float reach = 1.9 * sqrt(age / CYCLE);
  float fade = smoothstep(CYCLE, CYCLE - 6.0, age);
  float fromO = length(d - origin);
  float front = exp(-pow((fromO - reach) / 0.11, 2.0));
  float behind = smoothstep(reach + 0.02, reach - 0.15, fromO);

  // star systems: small points in the disc; reached ones glow silver, those at the front pulse mint
  vec2 g = d * 40.0;
  vec2 id = floor(g);
  float h = hash3(vec3(id, 3.0));
  float sys = step(0.78, h) * (disc * 6.0 * (0.4 + arms) + 0.15);
  vec2 sp = fract(g) - 0.5 - 0.25 * (vec2(hash3(vec3(id, 4.0)), hash3(vec3(id, 5.0))) - 0.5);
  float dot1 = exp(-length(sp) * 14.0) * min(sys, 1.0);
  float pulse = 0.5 + 0.5 * sin(t * 4.0 + h * 30.0);
  col += SILVER * dot1 * behind * 0.6 * fade;
  col += MINT * dot1 * front * (0.8 + 1.2 * pulse) * fade;
  col += WARM * dot1 * (1.0 - behind) * 0.25;
  // the front's own faint light over the disc, and a soft silver over what it has reached
  col += MINT * front * (disc * 0.9 + 0.04) * fade + SILVER * behind * disc * 0.12 * fade;
  // where it began: one bright mint point
  col += MINT * exp(-fromO / 0.012) * 1.2 * fade;

  col = col / (1.0 + max(col - 0.85, 0.0) * 0.85);
  gl_FragColor = vec4(col, 1.0);
}
`;

const CONFIG: OrbConfig = {
  fragment: FRAGMENT,
  framing: (width, height) => Math.min(width * 0.38, height * 0.62),
  close: 1.3,
  arriveFrom: 0.3,
  detail: { low: 0, medium: 1, high: 2 },
};

export default function VonNeumannProbesScene(props: SceneProps) {
  return <primitive object={useOrbScene(CONFIG, props)} />;
}
