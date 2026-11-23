/**
 * A planetary nebula (D-150): our own illustration of a dying star's outer layers, blown away into
 * an expanding cloud, the third new stage of A Star's Life. Seen nearly face on: a hollow, glowing
 * shell, brightest round its rim where we look along it (a thick ring of violet and coral, streaked
 * outward), filled with a soft aqua glow; along the inside of the ring, small knots of gas trail
 * thin tails away from the centre; round it all, a faint, wide, rose halo of older layers. At the
 * heart, the star's leftover core, a tiny blue-white point (the white dwarf, a place of its own).
 * The cloud spreads very slowly. One draw call, no particles. Its own colour family: aqua, violet
 * and coral. Mounted by the host through the registry; never imported by a page.
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

const vec3 AQUA = vec3(0.3, 0.9, 0.85);
const vec3 VIOLET = vec3(0.55, 0.36, 1.0);
const vec3 CORAL = vec3(1.0, 0.42, 0.38);
const vec3 ROSE = vec3(0.85, 0.3, 0.5);
const vec3 WHITE = vec3(0.92, 0.96, 1.0);
const float LEAN = 0.5;          // the ring's long axis leans this much on screen
const float SQUASH = 0.82;       // seen a little off face on

/* how far a sight line at radius rr runs through a shell from radius i to o, 1 where it grazes i */
float shellPath(float rr, float o, float i){
  return (sqrt(max(o * o - rr * rr, 0.0)) - sqrt(max(i * i - rr * rr, 0.0))) / sqrt(o * o - i * i);
}

void main(){
  vec2 css = vec2(gl_FragCoord.x, uResolution.y - gl_FragCoord.y) / uDpr;
  vec2 q = css - uCentre;
  q.y = -q.y;
  vec2 u0 = q / uScale;    // the shell's radii, y up
  float t = uTime;
  vec2 size = uResolution / uDpr;
  // the drag turns it a little, and tips it
  float cl = cos(LEAN + uYaw * 0.4), sl = sin(LEAN + uYaw * 0.4);
  vec2 u = vec2(cl * u0.x + sl * u0.y, -sl * u0.x + cl * u0.y);
  u.y /= clamp(SQUASH + uPitch * 0.25, 0.45, 1.0);
  float grow = 1.0 + 0.004 * t;                    // it spreads, very slowly
  u /= grow;
  float r = length(u);
  float a = atan(u.y, u.x);
  vec2 dir = r > 1e-4 ? u / r : vec2(0.0);

  vec2 v = (css - size * 0.5) / size.y;
  vec3 col = skyDeep(normalize(vec3(v * 1.4, -1.0)), 0.7);

  // its edges wander, so no part of it is a clean circle
  float wander = fbm3(vec3(dir * 1.8, 1.0)) - 0.5;
  float rw = r * (1.0 + 0.12 * wander);

  // ---- the faint outer halo of older layers ----
  float halo = shellPath(rw, 1.75, 1.25) * (0.5 + 0.8 * fbm3(vec3(u * 2.0, 3.0)));
  col += ROSE * 0.12 * halo;

  // ---- the main shell: thickest light round its rim, streaked outward ----
  float rim = 0.0;
  for (int k = 0; k < 3; k++) {
    float o = 0.92 + 0.05 * float(k);
    rim += shellPath(rw, o, o - 0.34) / 3.0;
  }
  float rays = fbm3(vec3(dir * 7.0, rw * 1.5));
  float clumps = fbm3(vec3(u * 4.5, 5.0));
  vec3 ringCol = mix(VIOLET, CORAL, smoothstep(0.7, 0.98, rw + 0.15 * (clumps - 0.5)));
  col += ringCol * pow(rim, 1.6) * (0.3 + 0.9 * rays) * (0.55 + 0.7 * clumps) * 1.15;

  // ---- the hollow inside, filled with a soft aqua glow ----
  float inside = smoothstep(0.75, 0.2, rw);
  float mist = fbm3(vec3(u * 3.0, 7.0 + t * 0.01));
  col += AQUA * inside * (0.18 + 0.45 * mist);
  col += mix(AQUA, WHITE, 0.4) * 0.12 * exp(-r * 3.0);

  // ---- knots along the inside of the ring, their tails pointing away from the centre ----
  vec2 kp = vec2(a * 11.0, rw * 9.0);
  vec2 ki = floor(kp);
  float kh = hash3(vec3(ki, 4.0));
  vec2 jit = vec2(hash3(vec3(ki, 7.0)), hash3(vec3(ki, 9.0))) * 0.6 - 0.3;
  vec2 kf = fract(kp) - vec2(0.5, 0.35) - jit;
  float band = smoothstep(0.5, 0.6, rw) * (1.0 - smoothstep(0.72, 0.8, rw));
  float head = exp(-dot(kf * vec2(2.2, 1.0), kf * vec2(2.2, 1.0)) * 120.0);
  float tail = exp(-kf.x * kf.x * 300.0) * smoothstep(-0.05, 0.05, kf.y) * exp(-kf.y * 5.0);
  float knot = step(0.72, kh) * band;
  col += CORAL * knot * (head * 0.9 + tail * 0.25);

  // ---- the star's leftover core ----
  float d = length(q);
  col += WHITE * (exp(-d * d / 6.0) * 1.4 + exp(-d / 9.0) * 0.25);

  col = col / (1.0 + max(col - 0.85, 0.0) * 0.9);
  gl_FragColor = vec4(col, 1.0);
}
`;

const CONFIG: OrbConfig = {
  fragment: FRAGMENT,
  framing: (width, height) => Math.min(height * 0.3, width * 0.2),
  close: 1.5,
  arriveFrom: 0.25,
  detail: { low: 0, medium: 1, high: 2 },
  // D-150: the core at the heart leads to the white dwarf
  bodies: () => [{ name: "dwarf", x: 0, y: 0, z: 0 }],
};

export default function PlanetaryNebulaScene(props: SceneProps) {
  return <primitive object={useOrbScene(CONFIG, props)} />;
}
