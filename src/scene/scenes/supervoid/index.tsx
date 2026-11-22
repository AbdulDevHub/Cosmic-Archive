/**
 * A supervoid (D-117): our own illustration of one of the cosmic web's great empty bubbles. An
 * enormous dark void fills the middle, a few lonely galaxies in it; around it the web crowds into
 * a glowing wall of threads and knots of galaxies. Three layers of the web (cell edges, 2D
 * Voronoi), far to near, each moving more in a drag, for depth. One draw call, no particles.
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

const vec3 VIOLET = vec3(0.5, 0.32, 1.0);
const vec3 AZURE = vec3(0.3, 0.6, 1.0);
const vec3 ROSE = vec3(1.0, 0.4, 0.72);
const vec3 GOLD = vec3(1.0, 0.82, 0.55);

/* the web's cells, seen flat: distance to the nearest cell edge (F2 - F1) and the cell's id */
vec2 cellEdge(vec2 p){
  vec2 i = floor(p), f = fract(p);
  float f1 = 9.0, f2 = 9.0, id = 0.0;
  for (int y = -1; y <= 1; y++)
  for (int x = -1; x <= 1; x++) {
    vec2 g = vec2(float(x), float(y));
    vec2 o = vec2(hash3(vec3(i + g, 1.0)), hash3(vec3(i + g, 7.0)));
    float d = length(g + o - f);
    if (d < f1) { f2 = f1; f1 = d; id = hash3(vec3(i + g, 3.0)); } else if (d < f2) { f2 = d; }
  }
  return vec2(f2 - f1, id);
}

/* one layer of the web: threads of galaxies along the cell edges, knots where they meet */
vec3 webLayer(vec2 p, float scale, float width, float bright){
  vec2 c = cellEdge(p * scale);
  // never a drawn line (D-094): the threads are beads and clumps of galaxies with a haze of gas
  float grain = noise3(vec3(p * scale * 11.0, c.y * 7.0));
  float clumps = noise3(vec3(p * scale * 2.5, c.y * 3.0 + 4.0));
  float core = exp(-c.x * c.x / (width * width)) * pow(grain, 2.5) * (0.4 + 1.2 * clumps);
  float haze = exp(-c.x * c.x / (width * width * 9.0)) * (0.25 + 0.5 * clumps);
  float knot = smoothstep(0.78, 1.0, grain) * exp(-c.x * c.x / (width * width * 0.5));
  vec3 tint = mix(VIOLET, AZURE, c.y);
  tint = mix(tint, ROSE, smoothstep(0.8, 0.95, c.y));
  return (tint * core * 1.3 + tint * haze * 0.25 + mix(GOLD, vec3(1.0), 0.4) * knot * 1.8) * bright;
}

void main(){
  vec2 css = vec2(gl_FragCoord.x, uResolution.y - gl_FragCoord.y) / uDpr;
  vec2 q = css - uCentre;
  q.y = -q.y;
  vec2 u = q / uScale;          // half the window's height is 1
  float t = uTime;
  vec2 pan = vec2(uYaw, -uPitch) * 0.6 + vec2(t * 0.004, 0.0);
  float r = length(u);

  // the void: an enormous bubble in the middle, empty; its edge, where the walls of galaxies crowd,
  // is the brightest part of the picture
  float inside = 1.0 - smoothstep(0.55, 0.95, r + 0.12 * (noise3(vec3(u * 2.5, 1.0)) - 0.5));
  float rim = exp(-pow((r - 0.85) / 0.22, 2.0));

  vec3 col = skyDeep(normalize(vec3(u * 0.7, -1.0)), 0.2) * 0.5;
  // three layers, far to near: finer and fainter far off, bolder near, each moving more in a drag
  col += webLayer(u + pan * 0.4, 5.5, 0.035, 0.28) * (1.0 - inside * 0.9);
  col += webLayer(u + pan * 0.7 + 3.1, 3.2, 0.04, 0.5) * (1.0 - inside * 0.97) * (0.6 + 0.8 * rim);
  col += webLayer(u + pan + 7.3, 1.7, 0.045, 0.8) * (1.0 - inside) * (0.5 + 1.0 * rim);
  // a soft glow of gas along the bubble's wall
  col += mix(VIOLET, AZURE, 0.4) * rim * 0.12;
  // a few lonely galaxies inside the void
  vec2 lp = (u + pan * 0.5) * 14.0;
  vec2 lid = floor(lp);
  float lone = step(0.985, hash3(vec3(lid, 9.0))) * exp(-length(fract(lp) - 0.5) * 16.0) * inside;
  col += GOLD * lone * 1.6;

  col = col / (1.0 + max(col - 0.85, 0.0) * 0.9);
  gl_FragColor = vec4(col, 1.0);
}
`;

const CONFIG: OrbConfig = {
  fragment: FRAGMENT,
  // here "radius" is half the window's height: the field of view; moving in narrows it a little
  framing: (_width, height) => height * 0.5,
  close: 1.25,
  arriveFrom: 0.6,
  detail: { low: 0, medium: 1, high: 2 },
};

export default function SupervoidScene(props: SceneProps) {
  return <primitive object={useOrbScene(CONFIG, props)} />;
}
