/**
 * Higher Dimensions (D-155): our own illustration of a fourth dimension of space, an idea inside the
 * Starbase. A tesseract, the four-dimensional cube, turns slowly through a dimension we cannot
 * see, and what shows is its slice through our three: a crystal solid that keeps changing shape,
 * a cube swelling into a many-faced gem and folding back. It is ray-marched as a true slice of the
 * 4D shape (never a wireframe): glassy violet faces, tinted by how far they reach into the hidden
 * dimension, a pearly sheen at grazing angles, and a soft magenta glow inside. Round it, faint
 * echoes of the same slice a little further along the hidden axis, like ghosts. One draw call, no
 * particles. Its own colour family: violet, magenta and pearl.
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

const vec3 VIOLET = vec3(0.5, 0.32, 1.0);
const vec3 MAGENTA = vec3(1.0, 0.3, 0.8);
const vec3 PEARL = vec3(0.95, 0.92, 1.0);

/* the turn through the hidden dimension: x and y each lean into w, at their own slow speeds */
mat4 fourTurn(float t){
  float a = t * 0.21 + 1.41, b = t * 0.13 - 0.95;
  float ca = cos(a), sa = sin(a), cb = cos(b), sb = sin(b);
  mat4 xw = mat4(ca, 0.0, 0.0, sa,  0.0, 1.0, 0.0, 0.0,  0.0, 0.0, 1.0, 0.0,  -sa, 0.0, 0.0, ca);
  mat4 yw = mat4(1.0, 0.0, 0.0, 0.0,  0.0, cb, 0.0, sb,  0.0, 0.0, 1.0, 0.0,  0.0, -sb, 0.0, cb);
  return xw * yw;
}

float box4(vec4 p, float b){
  vec4 q = abs(p) - vec4(b);
  return length(max(q, 0.0)) + min(max(max(q.x, q.y), max(q.z, q.w)), 0.0) - 0.04;
}

mat4 TURN;
float W0 = 0.0;

float sdf(vec3 p){ return box4(TURN * vec4(p, W0), 0.52); }

vec3 normalAt(vec3 p){
  vec2 e = vec2(0.0015, 0.0);
  return normalize(vec3(sdf(p + e.xyy) - sdf(p - e.xyy), sdf(p + e.yxy) - sdf(p - e.yxy), sdf(p + e.yyx) - sdf(p - e.yyx)));
}

/* marches one slice; returns the distance along the ray, or -1 */
float march(vec3 ro, vec3 rd, int steps){
  float b = dot(ro, rd);
  float c = dot(ro, ro) - 1.3 * 1.3;
  float disc = b * b - c;
  if (disc < 0.0) return -1.0;
  float s = max(-b - sqrt(disc), 0.0);
  float far = -b + sqrt(disc);
  for (int i = 0; i < 100; i++) {
    if (i >= steps || s > far) break;
    float h = sdf(ro + rd * s);
    if (h < 0.0008) return s;
    s += h * 0.9;
  }
  return -1.0;
}

void main(){
  vec2 css = vec2(gl_FragCoord.x, uResolution.y - gl_FragCoord.y) / uDpr;
  vec2 q = css - uCentre;
  q.y = -q.y;
  vec2 u = q / uScale;     // the slice's radii, y up
  float t = uTime;
  vec2 size = uResolution / uDpr;
  vec3 skyDir = normalize(vec3((css - size * 0.5) / size.y * vec2(1.0, -1.0) * 1.3, -1.0));
  vec3 col = skyDeep(skyDir, 0.5) * 0.65;
  float r = length(u);
  col += VIOLET * 0.07 * exp(-r * 1.1) + MAGENTA * 0.035 * exp(-r * 2.2);

  mat3 view = turnX(0.42 - uPitch) * turnY(uYaw + 0.6 + t * 0.04);
  vec3 ro = view * vec3(0.0, 0.0, 4.0);
  vec3 rd = view * normalize(vec3(u, -4.0));
  vec3 L = normalize(vec3(-0.6, 0.7, 0.5));
  TURN = fourTurn(t);
  int steps = 48 + 20 * uDetail;

  // the echoes: the same shape a little further along the hidden axis, faint and behind
  for (int k = 1; k <= 2; k++) {
    W0 = 0.22 * float(k);
    vec3 eo = ro * (1.0 + 0.12 * float(k));
    float s = march(eo, rd, steps / 2);
    if (s > 0.0) {
      vec3 n = normalAt(eo + rd * s);
      float fres = pow(1.0 - abs(dot(n, rd)), 2.0);
      col += mix(VIOLET, MAGENTA, float(k) * 0.4) * (0.05 + 0.18 * fres) / float(k);
    }
  }

  W0 = 0.0;
  float s = march(ro, rd, steps);
  if (s > 0.0) {
    vec3 p = ro + rd * s;
    vec3 n = normalAt(p);
    vec3 v = -rd;
    vec4 p4 = TURN * vec4(p, 0.0);
    float deep = clamp(p4.w / 0.52 * 0.5 + 0.5, 0.0, 1.0);   // how far this point reaches into w
    float diff = max(dot(n, L), 0.0);
    float spec = pow(max(dot(reflect(-L, n), v), 0.0), 50.0);
    float fres = pow(1.0 - max(dot(n, v), 0.0), 3.0);
    vec3 face = mix(VIOLET, MAGENTA, deep);
    // glass: a little lit face, the sky seen through it, a pearly sheen, and light from inside
    vec3 env = skyDeep(reflect(-v, n), 0.5);
    vec3 glass = face * (0.18 + 0.55 * diff) + env * 0.35 + PEARL * (spec * 0.9 + fres * 0.55);
    // where two of its 4D faces meet, a soft brighter fold (the edges of the slice, never thin)
    vec4 a4 = abs(p4) - 0.52;
    float second = max(min(a4.x, a4.y), min(a4.z, a4.w));
    float fold = exp(-abs(second) * 28.0);
    glass += mix(MAGENTA, PEARL, 0.4) * fold * 0.35;
    // the inner glow: thicker where the ray runs further through it
    float back = march(p + rd * 0.02 + rd * 1.2, -rd, steps / 2);
    float thick = back > 0.0 ? clamp(1.2 - back, 0.0, 1.2) : 0.3;
    glass += MAGENTA * thick * 0.22 * (0.8 + 0.2 * sin(t * 0.7));
    col = mix(col, glass, 0.92);
  }

  col = col / (1.0 + max(col - 0.85, 0.0) * 0.85);
  gl_FragColor = vec4(col, 1.0);
}
`;

const CONFIG: OrbConfig = {
  fragment: FRAGMENT,
  framing: (width, height) => Math.min(width * 0.2, height * 0.28),
  close: 1.3,
  arriveFrom: 0.3,
  detail: { low: 0, medium: 1, high: 2 },
};

export default function HigherDimensionsScene(props: SceneProps) {
  return <primitive object={useOrbScene(CONFIG, props)} />;
}
