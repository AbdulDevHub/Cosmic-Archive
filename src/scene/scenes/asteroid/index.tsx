/**
 * An Asteroid (D-133): our own illustration of a rock the size of a city, close up, tumbling slowly:
 * lumpy, cratered, dark and dusty, lit hard from one side, with the Blue World small and far behind
 * it, to show what such a rock could hit. The rock is ray-marched: a sphere pushed in and out by
 * noise, with craters pressed into it. One draw call, no particles. Mounted by the host through
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
${SKY_CHUNK}

const vec3 LIGHT = vec3(1.0, 0.95, 0.88);

vec3 sky(vec2 css){
  vec2 size = uResolution / uDpr;
  vec2 v = (css - size * 0.5) / size.y;
  return skyDeep(normalize(vec3(v * 1.4, -1.0)), 0.5);
}

/* bowls pressed into the rock: one crater at most per cell of a 3D grid. Centres keep to the
   middle of their cell and radii stay under 0.3, so the two cells nearest on each axis are all
   that can reach a point: no crater is cut off at a cell's edge */
float pits(vec3 p, float scale){
  vec3 g = p * scale - 0.5;
  vec3 i = floor(g), f = fract(g) + 0.5;
  float h = 0.0;
  for (int z = 0; z <= 1; z++)
  for (int y = 0; y <= 1; y++)
  for (int x = 0; x <= 1; x++) {
    vec3 cell = i + vec3(float(x), float(y), float(z));
    if (hash3(cell + 0.37) > 0.55) continue;
    vec3 c = vec3(float(x), float(y), float(z)) + vec3(hash3(cell + 1.1), hash3(cell + 2.3), hash3(cell + 3.7)) * 0.2 + 0.4 - f;
    float rad = 0.16 + 0.12 * hash3(cell + 5.9);
    float d = length(c) / rad;
    h += (smoothstep(1.0, 0.0, d) * -0.6 + exp(-pow((d - 1.0) / 0.2, 2.0)) * 0.15 * smoothstep(1.7, 1.3, d)) * rad;
  }
  return h / scale;
}

mat3 spin;

/* the rock: how far a point is outside it (less than the true distance, so the march creeps) */
float rock(vec3 q){
  vec3 p = spin * q;
  // a potato: squashed and stretched, then lumped
  vec3 s = p * vec3(0.78, 1.08, 0.95);
  float d = length(s) - 0.82;
  d -= 0.22 * (noise3(p * 1.3 + 2.0) - 0.5);
  d -= 0.09 * (noise3(p * 3.1 + 5.0) - 0.5);
  d -= pits(p, 2.2) * 1.2;
  if (uDetail > 0) d -= pits(p + 3.3, 5.0) * 0.8;
  return d;
}

void main(){
  vec2 css = vec2(gl_FragCoord.x, uResolution.y - gl_FragCoord.y) / uDpr;
  vec2 q = css - uCentre;
  q.y = -q.y;
  vec2 u = q / uScale;     // the rock's radii, y up
  float t = uTime;
  vec3 L = normalize(vec3(-0.75, 0.4, 0.55));   // its star, hard from the upper left

  vec3 col = sky(css);

  // ---- the Blue World, small and far behind it, lower right ----
  vec2 bw = (u - vec2(1.75, -0.62)) / 0.16;
  float br = length(bw);
  if (br < 1.0) {
    vec3 bn = vec3(bw, sqrt(1.0 - br * br));
    vec3 bp = turnY(t * 0.02) * bn;
    float land = smoothstep(0.55, 0.58, fbm3(bp * 2.2 + 3.0));
    float cloud = smoothstep(0.55, 0.75, noise3(bp * 5.0));
    vec3 surf = mix(vec3(0.03, 0.15, 0.42), vec3(0.18, 0.32, 0.14), land);
    surf = mix(surf, vec3(0.95), cloud * 0.8);
    vec3 planet = surf * (0.02 + 1.1 * max(dot(bn, L), 0.0));
    planet += vec3(0.3, 0.6, 1.0) * pow(1.0 - bn.z, 3.0) * smoothstep(-0.2, 0.4, dot(bn, L)) * 0.6;
    col = mix(col, planet, smoothstep(1.0, 0.96, br));
  }
  col += vec3(0.3, 0.6, 1.0) * exp(-max(br - 1.0, 0.0) * 25.0) * step(1.0, br) * 0.25;

  // ---- the rock, marched from in front ----
  if (length(u) < 1.4) {
    spin = turnX(0.4 - uPitch + t * 0.021) * turnY(uYaw + t * 0.034);
    vec3 ro = vec3(u, 1.6);
    vec3 rd = vec3(0.0, 0.0, -1.0);
    float z = 0.0;
    float hit = 0.0;
    for (int i = 0; i < 48; i++) {
      float d = rock(ro + rd * z);
      if (d < 0.002) { hit = 1.0; break; }
      z += d * 0.7;
      if (z > 3.4) break;
    }
    if (hit > 0.5) {
      vec3 p = ro + rd * z;
      vec2 e = vec2(0.004, 0.0);
      vec3 n = normalize(vec3(rock(p + e.xyy) - rock(p - e.xyy), rock(p + e.yxy) - rock(p - e.yxy), rock(p + e.yyx) - rock(p - e.yyx)));
      vec3 sp = spin * p;
      // dark carbon rock and grey dust, the dust settled in the hollows
      float dust = smoothstep(0.4, 0.7, noise3(sp * 4.0));
      vec3 albedo = mix(vec3(0.24, 0.22, 0.2), vec3(0.42, 0.39, 0.35), dust) * (0.75 + 0.45 * noise3(sp * 20.0));
      float lit = max(dot(n, L), 0.0);
      // no air: hard light, black shadows, a whisper of light bounced from the far planet
      vec3 body = albedo * LIGHT * pow(lit, 0.9) * 1.6 + albedo * vec3(0.1, 0.2, 0.4) * 0.05 * max(dot(n, normalize(vec3(0.8, -0.4, 0.3))), 0.0);
      col = body;
    }
  }

  col = col / (1.0 + max(col - 0.9, 0.0) * 0.8);
  gl_FragColor = vec4(col, 1.0);
}
`;

const CONFIG: OrbConfig = {
  fragment: FRAGMENT,
  // at its framing the whole rock, with the planet behind it; all the way in it fills the window
  framing: (width, height) => Math.min(height * 0.3, width * 0.2),
  close: 1.4,
  arriveFrom: 0.3,
  detail: { low: 0, medium: 1, high: 1 },
};

export default function AsteroidScene(props: SceneProps) {
  return <primitive object={useOrbScene(CONFIG, props)} />;
}
