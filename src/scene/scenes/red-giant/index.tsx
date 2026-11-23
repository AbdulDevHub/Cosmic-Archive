/**
 * A red giant (D-149): our own illustration of a star near its end, swollen far past its old size,
 * the second stage of A Star's Life after the Yellow Star. A vast, cool ball of garnet and orange,
 * its face boiling in a few huge cells (a giant has room for only a handful), darkening hard toward
 * a soft, uneven edge; round it, a smoky haze of the gas it is losing, drifting slowly outward in
 * clumps. One draw call, no particles. Its own colour family: garnet, orange and smoke. Mounted by
 * the host through the registry; never imported by a page.
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

const vec3 GARNET = vec3(0.62, 0.1, 0.06);
const vec3 ORANGE = vec3(1.0, 0.45, 0.16);
const vec3 AMBER = vec3(1.0, 0.7, 0.36);
const vec3 SMOKE = vec3(0.42, 0.2, 0.16);

vec3 hash33(vec3 p){
  p = vec3(dot(p, vec3(127.1, 311.7, 74.7)), dot(p, vec3(269.5, 183.3, 246.1)), dot(p, vec3(113.5, 271.9, 124.6)));
  return fract(sin(p) * 43758.5453);
}

/* the giant's boiling cells, in 3D on its turning surface (no poles to pinch): bright middles, dark lanes */
float cellsAt(vec3 b, float t){
  vec3 p = b * 1.35;
  vec3 i = floor(p), f = fract(p);
  float d1 = 9.0, d2 = 9.0;
  for (int z = -1; z <= 1; z++)
  for (int y = -1; y <= 1; y++)
  for (int x = -1; x <= 1; x++) {
    vec3 g = vec3(float(x), float(y), float(z));
    vec3 o = 0.5 + 0.4 * sin(t * 0.05 + 6.28 * hash33(i + g));
    float l = length(g + o - f);
    if (l < d1) { d2 = d1; d1 = l; } else if (l < d2) d2 = l;
  }
  return smoothstep(0.0, 0.8, d2 - d1);
}

void main(){
  vec2 css = vec2(gl_FragCoord.x, uResolution.y - gl_FragCoord.y) / uDpr;
  vec2 q = css - uCentre;
  q.y = -q.y;
  vec2 u = q / uScale;     // the star's radii, y up
  float r = length(u);
  float t = uTime;
  vec2 size = uResolution / uDpr;
  mat3 view = turnX(0.15 - uPitch) * turnY(uYaw + t * 0.006);

  vec2 v = (css - size * 0.5) / size.y;
  vec3 col = skyDeep(normalize(vec3(v * 1.4, -1.0)), 0.6);

  // its edge is soft and uneven: a giant's outer layers are thin and lumpy
  float a = atan(u.y, u.x);
  float edge = 1.0 + 0.018 * (fbm3(vec3(cos(a) * 2.0, sin(a) * 2.0, t * 0.02)) - 0.5) * 2.0;
  float re = r / edge;

  // ---- the haze of gas it is losing, clumpy, drifting outward ----
  float beyond = max(re - 1.0, 0.0);
  vec2 dir = r > 1e-4 ? u / r : vec2(0.0);
  float clumps = fbm3(vec3(dir * 2.2, beyond * 2.5 - t * 0.03));
  float haze = exp(-beyond * 2.4) * (0.35 + 0.9 * clumps);
  col += mix(SMOKE, ORANGE, exp(-beyond * 4.0) * 0.6) * haze * 0.55 * step(1.0, re);
  col += ORANGE * 0.5 * exp(-beyond * 9.0);

  // ---- the star ----
  if (re < 1.0) {
    vec3 n = vec3(u / edge, sqrt(max(1.0 - re * re, 0.0)));
    vec3 b = transpose(view) * n;
    float mu = n.z;
    float cell = cellsAt(b + 0.12 * (vec3(fbm3(b * 3.0), fbm3(b * 3.0 + 4.0), fbm3(b * 3.0 + 8.0)) - 0.5), t);
    float fine = fbm3(b * 9.0 + vec3(0.0, t * 0.01, 0.0));
    float spots = fbm3(b * 2.0 + vec3(t * 0.004, 0.0, 3.0));
    float heat = (0.35 + 0.65 * cell) * (0.6 + 0.6 * fine) * (0.7 + 0.5 * spots);
    vec3 surface = mix(GARNET, ORANGE, smoothstep(0.15, 0.85, heat));
    surface = mix(surface, AMBER, smoothstep(0.75, 1.0, heat) * 0.6);
    // a giant's face darkens hard toward its edge
    surface *= 0.1 + 1.0 * pow(mu, 0.85);
    surface += GARNET * 0.25 * pow(1.0 - mu, 3.0);
    col = mix(col, surface * 1.15, smoothstep(1.0, 0.985, re));
  }

  col = col / (1.0 + max(col - 0.85, 0.0) * 0.9);
  gl_FragColor = vec4(col, 1.0);
}
`;

const CONFIG: OrbConfig = {
  fragment: FRAGMENT,
  framing: (width, height) => Math.min(height * 0.24, width * 0.16),
  close: 1.3,
  arriveFrom: 0.2,
  detail: { low: 0, medium: 1, high: 2 },
};

export default function RedGiantScene(props: SceneProps) {
  return <primitive object={useOrbScene(CONFIG, props)} />;
}
