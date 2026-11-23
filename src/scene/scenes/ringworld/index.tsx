/**
 * Ringworld (D-173): our own illustration of the ring world of Larry Niven's 1970 novel, a
 * megastructure in A Quasar Galaxy: a ring round a star at about Earth's distance from the Sun,
 * its inner face one endless landscape. Seen from above and outside the ring's plane: the star small
 * and white at the middle; the ring a broad band in perspective, its far side showing its sunlit
 * inner face of blue seas, green and tan land and drifting cloud between tall rim walls, its near
 * side showing only its dark underside, edged with the light of the walls. One full-screen shader,
 * one draw call, no particles. Its own colour family: ocean blue, leaf green and sun white.
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

const vec3 OCEAN = vec3(0.1, 0.32, 0.65);
const vec3 LEAF = vec3(0.25, 0.55, 0.25);
const vec3 SUNW = vec3(1.0, 0.97, 0.9);
const float HALF = 0.09;   // half the ring's width, in its radii

void main(){
  vec2 css = vec2(gl_FragCoord.x, uResolution.y - gl_FragCoord.y) / uDpr;
  vec2 q = css - uCentre;
  q.y = -q.y;
  vec2 u = q / uScale;     // the ring's radii, y up
  float t = uTime;
  vec2 size = uResolution / uDpr;
  vec3 col = skyDeep(normalize(vec3((css - size * 0.5) / size.y * 1.3, -1.0)), 0.45) * 0.7;

  // the star
  float rs = length(u);
  col += SUNW * (exp(-rs / 0.025) * 2.0 + exp(-rs / 0.12) * 0.35 + exp(-rs / 0.5) * 0.06);

  // the ring: a short cylinder of radius 1, half-width HALF, seen from above by e; a ray hits it
  // where it crosses the cylinder (the inner face far away, the underside near)
  float e = clamp(0.55 + uPitch * 0.6, 0.2, 0.95);
  vec3 ro = vec3(0.0, 0.0, 5.0);
  vec3 rd = normalize(vec3(u, -5.0));
  mat3 toRing = turnX(-e) ;
  vec3 o = toRing * ro;
  vec3 d = toRing * rd;
  float spin = t * 0.01 + uYaw;
  // cylinder about y: x^2 + z^2 = 1
  float a = d.x * d.x + d.z * d.z;
  float b = 2.0 * (o.x * d.x + o.z * d.z);
  float c = o.x * o.x + o.z * o.z - 1.0;
  float disc = b * b - 4.0 * a * c;
  if (disc > 0.0) {
    float sq = sqrt(disc);
    float s1 = (-b - sq) / (2.0 * a);
    float s2 = (-b + sq) / (2.0 * a);
    vec3 p1 = o + d * s1;   // the near crossing: the ring's underside, seen from outside
    vec3 p2 = o + d * s2;   // the far crossing: its inner face, lit by the star
    bool near = abs(p1.y) < HALF;
    bool far = abs(p2.y) < HALF;
    if (far && !near) {
      vec3 p = p2;
      float ang = atan(p.z, p.x) + spin;
      float across = p.y / HALF;             // -1 to 1 across the width
      // the landscape: seas, land and cloud, with tall rim walls at the edges
      vec3 lp = vec3(cos(ang), p.y, sin(ang)) * 9.0;    // the same scale along and across, so the land is not streaked
      float landN = fbm3(lp);
      float land = smoothstep(0.5, 0.56, landN);
      vec3 ground = mix(OCEAN, mix(LEAF, vec3(0.62, 0.55, 0.38), smoothstep(0.62, 0.72, landN)), land);
      float cloud = smoothstep(0.55, 0.78, fbm3(lp * 2.2 + vec3(t * 0.05, 3.0, 0.0)));
      ground = mix(ground, vec3(0.95), cloud * 0.75);
      float wall = smoothstep(0.82, 0.97, abs(across));
      ground = mix(ground, vec3(0.55, 0.52, 0.5), wall);
      // lit by the star: brightest straight below it; a thin haze of air over it
      ground *= 0.9;
      ground += vec3(0.4, 0.6, 1.0) * 0.12;
      // the shadow squares' night falls across it in long, soft patches
      float night = smoothstep(0.2, 0.0, abs(fract(ang * 20.0 / TAU + t * 0.003) - 0.5) - 0.32);
      ground *= 1.0 - 0.75 * night;
      col = ground;
    } else if (near) {
      // the underside: dark, its edges lit where the walls catch the starlight
      float across = p1.y / HALF;
      col = vec3(0.03, 0.035, 0.05) + SUNW * 0.12 * smoothstep(0.85, 1.0, abs(across)) + vec3(0.2, 0.25, 0.4) * 0.05;
    }
  }

  col = col / (1.0 + max(col - 0.85, 0.0) * 0.85);
  gl_FragColor = vec4(col, 1.0);
}
`;

const CONFIG: OrbConfig = {
  fragment: FRAGMENT,
  framing: (width, height) => Math.min(width * 0.25, height * 0.4),
  close: 1.3,
  arriveFrom: 0.3,
  detail: { low: 0, medium: 1, high: 2 },
};

export default function RingworldScene(props: SceneProps) {
  return <primitive object={useOrbScene(CONFIG, props)} />;
}
