/**
 * The nebula, drawn on one full-screen triangle (ARCHITECTURE.md 5), in the plane of the screen.
 *
 * Our own stylised star-forming cloud, not a picture of a real one: a cavity of thin, hot glow
 * blown open around a young cluster, a bright rim where the cloud's edge faces the cluster,
 * dark columns of dust standing up into the cavity with lit tips, and billowing gas fading out
 * into space. The gas is warped fractal noise; the columns are rounded segments, roughened by
 * the same warp. The colours are the place's palette (DESIGN_SPEC.md 3), not real filters.
 *
 * Nothing is drawn over it: no contours, no rings (D-094).
 *
 * Units: one unit is `uScale` CSS pixels; the cluster sits at the origin, y up.
 */

import { SKY_CHUNK } from "../../shaders/sky.glsl";

export const QUAD_VERTEX = /* glsl */ `
void main(){ gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

export const MAX_OCTAVES = 6;

/** The cluster's stars, in units from the cluster's centre: x, y, size in CSS pixels, warmth. */
export const CLUSTER: readonly (readonly [number, number, number, number])[] = [
  [0.0, 0.2, 2.6, 0.0],
  [0.55, -0.35, 2.1, 0.1],
  [-0.6, 0.55, 2.0, 0.0],
  [0.35, 0.95, 1.7, 0.3],
  [-0.25, -0.7, 1.6, 0.1],
  [1.1, 0.45, 1.5, 0.6],
  [-1.15, -0.15, 1.5, 0.2],
  [0.9, -1.05, 1.3, 0.8],
  [-0.9, 1.3, 1.2, 0.4],
  [1.6, -0.2, 1.1, 0.0],
  [-1.7, 0.75, 1.1, 0.7],
  [0.15, 1.75, 1.0, 0.2],
  [-0.4, -1.55, 1.0, 0.5],
  [2.1, 1.1, 0.9, 0.9],
];

const vec4s = CLUSTER.map(([x, y, s, w]) => `vec4(${x.toFixed(2)}, ${y.toFixed(2)}, ${s.toFixed(2)}, ${w.toFixed(2)})`).join(",\n  ");

export const NEBULA_FRAGMENT = /* glsl */ `
precision highp float;

uniform vec2 uResolution;  // drawing buffer, device pixels
uniform float uDpr;        // device pixels per CSS pixel
uniform vec2 uCentre;      // the cluster on screen, CSS pixels from the top left
uniform float uScale;      // CSS pixels per unit
uniform float uTime;
uniform int uOctaves;
uniform float uNorm;
uniform vec2 uSkyShift;   // the sky's share of a drag, CSS pixels: it moves less than the cloud       // 1 / the sum of the octaves' weights, so every tier is as bright

const float TAU = 6.28318530718;
const float CAVITY = 4.6;            // the cavity's mean radius, units
const vec2 BODY = vec2(1.6, -4.6);   // the middle of the cloud
const vec2 BODY_R = vec2(22.0, 13.0); // wide: the cloud fills the frame (D-101)

const vec3 ROSE = vec3(0.98, 0.34, 0.62);
const vec3 DEEP = vec3(0.42, 0.12, 0.34);
const vec3 TEAL = vec3(0.3, 0.86, 0.82);
const vec3 GOLD = vec3(1.0, 0.78, 0.42);
const vec3 WHITE = vec3(1.0, 0.96, 0.88);
const vec3 HOT = vec3(0.78, 0.88, 1.0);
const vec3 SPACE = vec3(0.035, 0.039, 0.11);   // --space, so the sky meets the page

const int STARS = ${CLUSTER.length};
const vec4 CLUSTER[STARS] = vec4[](
  ${vec4s}
);

float hash21(vec2 p){
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash21(i), b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0)), d = hash21(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

const mat2 TURN = mat2(1.6, 1.2, -1.2, 1.6); // a turn and a doubling, so octaves do not line up

float fbm(vec2 p){
  float sum = 0.0, weight = 0.5;
  for (int i = 0; i < ${MAX_OCTAVES}; i++) {
    if (i >= uOctaves) break;
    sum += weight * noise(p);
    p = TURN * p + 17.1;
    weight *= 0.5;
  }
  return sum * uNorm;
}

/* three octaves only: the warp and the contours want broad shapes, and the same ones on every tier */
float broad(vec2 p){
  return (noise(p) * 0.5 + noise(TURN * p + 17.1) * 0.25 + noise(TURN * TURN * p + 31.7) * 0.125) / 0.875;
}

/* distance to a column of dust: a segment from its foot to its tip, thinning toward the tip */
float column(vec2 p, vec2 foot, vec2 tip, float wide, float narrow){
  vec2 pa = p - foot, ba = tip - foot;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h) - mix(wide, narrow, h);
}


${SKY_CHUNK}

/* the deep sky behind the cloud: the screen read as a small patch of the sphere (D-101) */
vec3 sky(vec2 css){
  vec2 size = uResolution / uDpr;
  vec2 v = (css + uSkyShift - size * 0.5) / size.y;
  return skyDeep(normalize(vec3(v * 1.4, -1.0)), 1.15);
}

void main(){
  vec2 css = vec2(gl_FragCoord.x, uResolution.y - gl_FragCoord.y) / uDpr;
  vec2 q = css - uCentre;
  q.y = -q.y;
  vec2 p = q / uScale;
  float t = uTime * 0.012;
  float rad = length(p);

  // ---- the gas: two levels of warp, so it billows and swirls ----
  vec2 w1 = vec2(broad(p * 0.07 + vec2(1.3, t)), broad(p * 0.07 + vec2(-t, 4.1))) - 0.5;
  vec2 w2 = vec2(broad(p * 0.15 + w1 * 2.2 + 7.0), broad(p * 0.15 + w1 * 2.2 + 13.0)) - 0.5;
  vec2 r = p * 0.1 + w2 * 1.1 + w1 * 1.0;
  float dens = fbm(r);
  float detail = fbm(r * 2.6 + 5.0);
  // the cloud's form: it fills the frame, thinning far from its glowing heart
  float body = smoothstep(30.0, 5.0, rad + (dens - 0.5) * 16.0);
  float gas = smoothstep(0.36, 0.86, dens * 0.78 + detail * 0.36) * body;

  // ---- light from the heart: the cloud's edges that face it glow (density falls toward it) ----
  vec2 toHeart = -p / max(rad, 0.001);
  float ahead = fbm(r + toHeart * 0.07);
  float rim = clamp((dens - ahead) * 7.0, 0.0, 1.0) * gas;
  float near = exp(-rad * 0.16);

  // ---- colour: deep blue and violet far off, magenta between, orange and gold near the heart ----
  float hue = broad(p * 0.045 + w1 * 0.9 + 30.0);
  vec3 cool = mix(vec3(0.1, 0.2, 0.85), vec3(0.5, 0.18, 0.92), smoothstep(0.3, 0.7, hue));
  vec3 warm = mix(vec3(0.98, 0.22, 0.55), vec3(1.0, 0.52, 0.16), smoothstep(0.35, 0.75, hue));
  float heat = clamp(near * 1.9 + rim * 0.6 + (hue - 0.5) * 0.9, 0.0, 1.0);
  vec3 tint = mix(cool, warm, smoothstep(0.12, 0.7, heat));
  vec3 light = tint * gas * (0.32 + 1.1 * near) * (0.55 + 0.9 * detail);
  light += mix(warm, vec3(1.0, 0.86, 0.62), 0.45) * rim * (0.35 + 1.8 * near);
  // fine bright filaments threading the gas
  float thread = pow(1.0 - abs(2.0 * fbm(r * 3.4 + w2 * 2.0 + 17.0) - 1.0), 9.0) * gas;
  light += mix(tint, vec3(1.0), 0.35) * thread * (0.25 + 0.7 * near);
  // the heart itself: hot white-gold, wrapped in a pink and blue haze
  light += vec3(1.0, 0.84, 0.64) * exp(-rad * 0.5) * 0.65;
  light += mix(vec3(0.45, 0.6, 1.0), vec3(1.0, 0.6, 0.85), 0.5) * exp(-rad * 0.2) * 0.2;

  vec3 col = sky(css) * (1.0 - gas * 0.75) + light;

  // ---- dust: soft dark drifts in front, never near the heart, never thin lines ----
  float dust = smoothstep(0.56, 0.82, broad(p * 0.12 + w2 * 2.6 + 50.0)) * smoothstep(3.0, 10.0, rad);
  col *= 1.0 - dust * 0.72;

  // ---- the stars the cloud is making: the bright cluster at the heart, and others scattered in it ----
  for (int i = 0; i < STARS; i++) {
    vec4 s = CLUSTER[i];
    vec2 o = q - s.xy * uScale * 1.6;
    float d = length(o);
    float size = s.z * 1.35;
    float core = smoothstep(size * 1.4, 0.0, d);
    float halo = size * size * 2.0 / (d * d + size * size * 2.5);
    float spikes = s.z > 1.9 ? (exp(-abs(o.y) * 1.2) * exp(-abs(o.x) / (size * 11.0)) + exp(-abs(o.x) * 1.2) * exp(-abs(o.y) / (size * 11.0))) * 0.55 : 0.0;
    col += mix(HOT, GOLD, s.w) * (core * 1.8 + halo * 0.6 + spikes);
  }
  vec2 cell = floor(p * 0.55);
  vec2 f = fract(p * 0.55) - 0.5;
  float h = hash21(cell + 71.0);
  if (h > 0.9 && gas > 0.15) {
    vec2 at = (vec2(hash21(cell + 3.0), hash21(cell + 9.0)) - 0.5) * 0.6;
    float d = length(f - at) * uScale / 0.55;
    float size = mix(0.8, 2.0, hash21(cell + 5.0));
    col += mix(HOT, vec3(1.0, 0.7, 0.85), hash21(cell + 2.0)) * (smoothstep(size * 1.5, 0.0, d) * 1.3 + size * size / (d * d + size * size * 3.0) * 0.5);
  }

  // a soft roll-off instead of a hard clip at white
  col = col / (1.0 + max(col - 0.8, 0.0) * 0.9);

  gl_FragColor = vec4(col, 1.0);
}
`;
