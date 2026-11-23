/**
 * The dark matter web (D-147): our own illustration of what the cosmic web would look like if its
 * dark matter shone. At first only the galaxies show, small gold sparks strung through the dark;
 * then the unseen matter they sit in glows up round them: long ghostly filaments of teal and
 * indigo, swelling into round halos where they meet, the galaxies gathered thickest there. Three
 * depths of web drift past at different speeds, so it reads as deep; a drag looks round it. The
 * filaments are the edges of a cell pattern (as the web is, in the simulations), worked out per
 * pixel. One draw call, no particles. Its own colour family: ghost teal, indigo and gold. Mounted
 * by the host through the registry; never imported by a page.
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
#define SKY_LAYERS 3
${SKY_CHUNK}

const vec3 TEAL = vec3(0.3, 0.9, 0.86);
const vec3 INDIGO = vec3(0.36, 0.3, 0.95);
const vec3 GOLD = vec3(1.0, 0.82, 0.55);
const vec3 WHITE = vec3(1.0, 0.98, 0.95);

vec2 hash2(vec2 p){
  return fract(sin(vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)))) * 43758.5453);
}

/* the three nearest cell centres' distances: on an edge the first two match; at a corner, all three */
vec3 cells(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec3 d = vec3(9.0);
  for (int y = -1; y <= 1; y++)
  for (int x = -1; x <= 1; x++) {
    vec2 g = vec2(float(x), float(y));
    vec2 o = hash2(i + g);
    float l = length(g + o - f);
    if (l < d.x) { d.z = d.y; d.y = d.x; d.x = l; }
    else if (l < d.y) { d.z = d.y; d.y = l; }
    else if (l < d.z) d.z = l;
  }
  return d;
}

void main(){
  vec2 css = vec2(gl_FragCoord.x, uResolution.y - gl_FragCoord.y) / uDpr;
  vec2 q = css - uCentre;
  q.y = -q.y;
  vec2 u = q / uScale;
  float t = uTime;
  vec2 size = uResolution / uDpr;

  vec2 v = (css - size * 0.5) / size.y;
  vec3 col = skyDeep(normalize(vec3(v * 1.4, -1.0)), 0.35) * 0.6;

  // the dark matter shows itself a few seconds after arrival
  float reveal = smoothstep(1.0, 5.0, t);
  vec2 look = vec2(uYaw, -uPitch) * 0.6;

  for (int k = 0; k < 3; k++) {
    float fk = float(k);
    float depth = 1.0 / (1.0 + fk * 0.9);           // 1 near, smaller far
    float scale = 1.05 + fk * 1.25;
    vec2 p = u * scale + look * depth * 2.0 + vec2(t * 0.012 * depth, t * 0.004) + fk * 17.3;
    // a gentle warp, so the filaments bend as the web's do
    p += 0.35 * vec2(fbm3(vec3(p * 0.35, fk)), fbm3(vec3(p * 0.35 + 9.0, fk))) - 0.17;
    vec3 c = cells(p);

    float edge = c.y - c.x;
    float corner = c.z - c.x;
    float width = 0.06 + 0.1 * fbm3(vec3(p * 0.8, 3.0 + fk));
    // many strands fade away, so the web is broken and uneven, as in the simulations
    float strand = smoothstep(0.38, 0.72, fbm3(vec3(p * 0.45, 11.0 + fk)));
    float filament = exp(-edge / width) * strand;
    float halo = exp(-corner / 0.22) * exp(-c.x * 1.1) * (0.4 + 0.6 * strand);
    float core = exp(-corner / 0.05) * exp(-c.x * 2.5) * strand;
    float fade = 0.35 + 0.65 * depth;

    vec3 tint = mix(INDIGO, TEAL, smoothstep(0.35, 0.7, fbm3(vec3(p * 0.4, 7.0 + fk))));
    vec3 dm = tint * (filament * 0.42 + halo * 1.1) + mix(TEAL, WHITE, 0.5) * core * 0.5;
    col += dm * fade * reveal * (0.55 + 0.25 * depth);

    // the galaxies: sparks gathered along the filaments and thickest in the halos
    vec2 g = p * 9.0;
    vec2 gi = floor(g);
    vec2 go = hash2(gi + 3.1 * fk);
    float spark = exp(-dot(fract(g) - go, fract(g) - go) * 900.0 * depth);
    float home = smoothstep(0.2, 0.9, filament + halo * 2.0);
    float keep = step(0.55, go.x * home + home * 0.2);
    col += mix(GOLD, WHITE, go.y * 0.5) * spark * keep * fade * 1.6;
  }

  col = col / (1.0 + max(col - 0.85, 0.0) * 0.9);
  gl_FragColor = vec4(col, 1.0);
}
`;

const CONFIG: OrbConfig = {
  fragment: FRAGMENT,
  framing: (width, height) => Math.max(height, width * 0.62) * 0.5,
  close: 1.6,
  arriveFrom: 0.5,
  detail: { low: 0, medium: 1, high: 2 },
};

export default function DarkMatterScene(props: SceneProps) {
  return <primitive object={useOrbScene(CONFIG, props)} />;
}
