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
uniform float uNorm;       // 1 / the sum of the octaves' weights, so every tier is as bright

const float TAU = 6.28318530718;
const float CAVITY = 4.6;            // the cavity's mean radius, units
const vec2 BODY = vec2(1.6, -4.6);   // the middle of the cloud
const vec2 BODY_R = vec2(16.0, 10.0);

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


vec3 sky(vec2 css){
  vec3 col = SPACE;
  for (int layer = 0; layer < 2; layer++) {
    float cell = layer == 0 ? 46.0 : 21.0;
    vec2 g = css / cell + float(layer) * 7.3;
    vec2 id = floor(g);
    vec2 f = fract(g) - 0.5;
    float h = hash21(id);
    if (h > (layer == 0 ? 0.55 : 0.82)) {
      vec2 at = (vec2(hash21(id + 3.1), hash21(id + 7.7)) - 0.5) * 0.7;
      float size = mix(0.6, 1.5, hash21(id + 1.3)) / cell;
      vec3 tint = mix(vec3(0.72, 0.8, 1.0), vec3(1.0, 0.9, 0.76), hash21(id + 5.5));
      col += tint * smoothstep(size * 1.6, 0.0, length(f - at)) * mix(0.25, 0.9, hash21(id + 9.1));
    }
  }
  return col;
}

void main(){
  vec2 css = vec2(gl_FragCoord.x, uResolution.y - gl_FragCoord.y) / uDpr;
  vec2 q = css - uCentre;
  q.y = -q.y;
  vec2 p = q / uScale;
  float t = uTime * 0.01;

  // ---- the gas ----
  vec2 warp = vec2(broad(p * 0.17 + vec2(3.1, t)), broad(p * 0.17 + vec2(-t, 7.7))) - 0.5;
  float n = fbm(p * 0.24 + warp * 2.6 + vec2(t * 0.6, 0.0));
  float m = broad(p * 0.11 + warp * 0.9 + 21.0); // the cloud's broad lie, for its outline

  // the cloud's outline: most of it below and to the right of the cluster, thin above, so the
  // cavity is a blister open toward the top
  float body = length((p - BODY) / BODY_R) + (m - 0.5) * 0.6;
  float cloud = 1.0 - smoothstep(0.45, 1.05, body + (n - 0.5) * 0.3);

  // the cavity: thin glow inside, the cloud's lit wall at its edge, broken where the gas is thin
  float wall = length(p) - (CAVITY + (n - 0.5) * 3.2 + warp.x * 2.0);
  float inside = 1.0 - smoothstep(-0.4, 0.3, wall);
  float rim = exp(-max(wall, 0.0) * 0.9) * smoothstep(-1.2, 0.0, wall) * cloud * smoothstep(0.32, 0.62, n);

  // a dark bank of dust along the bottom, and columns rising out of it into the cavity, each
  // with a lumpy head; the warp bends them so no two are alike
  vec2 r = p + warp * vec2(2.4, 1.2);
  float sd = column(r, vec2(2.8, -12.5), vec2(0.4, -3.9), 1.8, 0.5);
  sd = min(sd, column(r, vec2(0.9, -6.2), vec2(-0.5, -4.6), 0.55, 0.25)); // a knot leaning off its head
  sd = min(sd, column(r, vec2(-5.6, -12.0), vec2(-3.2, -6.6), 1.4, 0.35));
  sd = min(sd, column(r, vec2(7.0, -12.0), vec2(5.0, -7.6), 1.1, 0.3));
  sd = min(sd, (r.y + 10.4) + (m - 0.5) * 3.0);
  // eaten away at the edges: fine noise, stronger toward the heads
  float bite = fbm(p * 0.95 + warp * 3.0 + 40.0) - 0.5;
  sd += (n - 0.5) * 0.8 + bite * mix(0.6, 1.3, smoothstep(-9.0, -4.0, p.y));
  float dust = 1.0 - smoothstep(-0.25, 0.35, sd);
  // the columns' edges are lit where they face the cluster: brightest at the heads
  float lit = exp(-abs(sd) * 4.5) * smoothstep(-10.5, -4.0, p.y) * (0.6 + n);

  // dark lanes of dust threaded through the outer cloud
  float ridge = 1.0 - abs(2.0 * broad(p * 0.3 + warp * 2.2 + 5.0) - 1.0);
  float lane = pow(ridge, 7.0) * cloud * smoothstep(0.5, 3.0, wall);

  float gas = cloud * (0.14 + 0.9 * n * n) * mix(1.0, 0.6, smoothstep(0.0, 10.0, wall));
  vec3 light = mix(DEEP, ROSE, smoothstep(0.2, 0.75, n)) * gas * 1.15;
  light += TEAL * inside * (0.04 + 0.24 * smoothstep(-CAVITY, 0.0, wall)) * (0.3 + 1.0 * n) * (0.3 + cloud);
  light += mix(TEAL, ROSE, smoothstep(0.0, 1.5, wall)) * rim * 0.22;
  light += mix(ROSE, GOLD, 0.35 + 0.5 * n) * rim * (0.2 + 0.5 * n);
  light *= 1.0 - lane * 0.7;

  vec3 col = sky(css) * (1.0 - cloud * 0.6) + light;
  col = mix(col, SPACE * 0.55 + DEEP * 0.06, dust * 0.95);
  col += mix(GOLD, ROSE, 0.25) * lit * 0.8;

  // ---- the young cluster ----
  for (int i = 0; i < STARS; i++) {
    vec4 s = CLUSTER[i];
    float d = length(q - s.xy * uScale);
    float size = s.z * 1.35;
    float core = smoothstep(size * 1.4, 0.0, d);
    float halo = size * size * 2.0 / (d * d + size * size * 2.5);
    col += mix(HOT, GOLD, s.w) * (core * 1.8 + halo * 0.6);
  }
  col += mix(TEAL, HOT, 0.4) * 0.08 * exp(-length(p) * 0.5);

  // a soft roll-off instead of a hard clip at white
  col = col / (1.0 + max(col - 0.8, 0.0) * 0.9);

  gl_FragColor = vec4(col, 1.0);
}
`;
