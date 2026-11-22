/**
 * A yellow star, like the Sun (D-116, D-117): our own illustration, after the owner's Star.png. A
 * great golden ball of churning plasma, mottled with deeper orange and lit by blazing active
 * regions, its edge brighter; flames of gas flickering all around it, a few great arches, and a
 * wide burning glow. No sunspots (the owner found them ugly). One draw call, no particles.
 * Mounted by the host through the registry; never imported by a page.
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

const vec3 DEEP = vec3(0.85, 0.22, 0.04);
const vec3 ORANGE = vec3(1.0, 0.48, 0.1);
const vec3 GOLD = vec3(1.0, 0.76, 0.34);
const vec3 PALE = vec3(1.0, 0.94, 0.78);
const vec3 RED = vec3(1.0, 0.3, 0.16);

/* the granules: cells of rising gas, bright in the middle and dark at their edges (F2 - F1) */
float granules(vec3 p){
  vec3 i = floor(p), f = fract(p);
  float f1 = 8.0, f2 = 8.0;
  for (int z = -1; z <= 1; z++)
  for (int y = -1; y <= 1; y++)
  for (int x = -1; x <= 1; x++) {
    vec3 g = vec3(float(x), float(y), float(z));
    vec3 o = vec3(hash3(i + g), hash3(i + g + 19.1), hash3(i + g + 47.3));
    o = 0.5 + 0.45 * sin(uTime * 0.25 + TAU * o);       // the cells slowly churn
    float d = length(g + o - f);
    if (d < f1) { f2 = f1; f1 = d; } else if (d < f2) { f2 = d; }
  }
  return smoothstep(0.0, 0.45, f2 - f1);
}

vec3 sky(vec2 css){
  vec2 size = uResolution / uDpr;
  vec2 v = (css - size * 0.5) / size.y;
  return skyDeep(normalize(vec3(v * 1.4, -1.0)), 0.8);
}

/* arches of glowing gas above the edge: at angle a, height h (in radii above the surface) */
float prominence(float a, float h, float site, float width, float height){
  float d = (a - site) / width;
  if (abs(d) > 1.0) return 0.0;
  float arch = height * sqrt(1.0 - d * d);
  float wisp = fbm3(vec3(a * 18.0, h * 22.0, uTime * 0.08 + site));
  float thick = 0.012 + 0.02 * wisp;
  return exp(-pow((h - arch) / thick, 2.0)) * (0.5 + 0.9 * wisp) * smoothstep(1.0, 0.7, abs(d));
}

void main(){
  vec2 css = vec2(gl_FragCoord.x, uResolution.y - gl_FragCoord.y) / uDpr;
  vec2 q = css - uCentre;
  q.y = -q.y;
  vec2 u = q / uScale;     // star radii, y up
  float r = length(u);
  float t = uTime;

  vec3 col = sky(css);
  mat3 view = turnX(-uPitch) * turnY(uYaw + t * 0.01);  // it turns slowly; a drag turns it further

  if (r < 1.0) {
    vec3 n = vec3(u, sqrt(1.0 - r * r));
    vec3 b = transpose(view) * n;   // a point on the surface, in the star's own frame
    float mu = n.z;
    // churning plasma: warped noise that slowly flows, mottled deeper orange where it is cooler
    vec3 flow = vec3(0.0, 0.0, t * 0.03);
    float warp = fbm3(b * 2.4 + flow);
    float plasma = fbm3(b * 5.5 + warp * 2.6 + flow * 1.5);
    float fine = fbm3(b * 16.0 + warp * 3.0 - flow * 2.0);
    float g = granules(b * (uDetail >= 1 ? 62.0 : 48.0));
    // blazing active regions, near white
    float blaze = smoothstep(0.6, 0.78, fbm3(b * 1.8 + 30.0 + flow * 0.5));
    float heat = 0.5 + 0.55 * plasma + 0.18 * fine + 0.06 * g;
    vec3 surface = mix(DEEP, ORANGE, smoothstep(0.55, 0.8, heat));
    surface = mix(surface, GOLD, smoothstep(0.78, 1.0, heat));
    surface = mix(surface, PALE, smoothstep(0.98, 1.15, heat) + blaze * 0.7);
    surface *= 0.75 + 0.55 * heat + blaze * 0.6;
    // the edge glows brighter, as in the reference
    surface += GOLD * pow(1.0 - mu, 3.0) * 0.55;
    float edge = smoothstep(1.0, 0.995, r);
    col = mix(col, surface * 1.25, edge);
  }

  // above the edge: flames of gas flickering all round, a few great arches, the corona, a burning glow
  float h = r - 1.0;
  if (h > -0.01) {
    float a = atan(u.y, u.x);
    float hh = max(h, 0.0);
    float rim = exp(-hh * 40.0);
    // flames: noise around the edge, stretched outward and rising with time
    vec3 around = vec3(cos(a) * 7.0, sin(a) * 7.0, hh * 9.0 - t * 0.35);
    float lick = fbm3(around + fbm3(around * 0.5 + 9.0) * 1.6);
    float flames = smoothstep(0.48, 0.78, lick) * exp(-hh * 7.0);
    float streak = fbm3(vec3(cos(a) * 3.0, sin(a) * 3.0, hh * 1.5 - t * 0.02));
    float corona = exp(-hh * 2.6) * (0.25 + 0.55 * streak);
    float arches = prominence(a, h, 0.7, 0.12, 0.09) + prominence(a, h, -1.9, 0.15, 0.12) + prominence(a, h, 2.6, 0.08, 0.06);
    col += mix(ORANGE, PALE, 0.35) * rim * 0.9 + mix(ORANGE, GOLD, lick) * flames * 1.4 + mix(GOLD, PALE, 0.4) * corona * 0.5 + mix(RED, ORANGE, 0.5) * arches * 1.2;
  }
  // the wide glow it throws across the sky
  col += ORANGE * (0.14 / (1.0 + r * r * 0.8) + 0.6 * exp(-max(r - 1.0, 0.0) * 3.0) * step(1.0, r));

  col = col / (1.0 + max(col - 0.9, 0.0) * 0.8);
  gl_FragColor = vec4(col, 1.0);
}
`;

const CONFIG: OrbConfig = {
  fragment: FRAGMENT,
  // at its framing a whole disc in the window; all the way in it fills most of it
  framing: (width, height) => Math.min(height * 0.24, width * 0.16),
  close: 1.75,
  arriveFrom: 0.3,
  detail: { low: 0, medium: 1, high: 2 },
};

export default function StarScene(props: SceneProps) {
  return <primitive object={useOrbScene(CONFIG, props)} />;
}
