/**
 * O'Neill Cylinder (D-169): our own illustration of Gerard O'Neill's space settlement, a
 * megastructure in A Quasar Galaxy: a pair of long cylinders side by side, turning opposite ways.
 * Each is pale steel, its length striped with three bands of green and blue land and three bands
 * of glowing window; the sun is off to the left, and the cylinders' ends catch it. (The long
 * mirrors of O'Neill's design are left out: drawn as thin panels they read as lines.) Ray-marched in one full-screen shader:
 * one draw call, no particles. Its own colour family: pale steel, glass blue and land green.
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

const vec3 STEEL = vec3(0.78, 0.8, 0.84);
const vec3 GLASS = vec3(0.45, 0.7, 1.0);
const vec3 LAND = vec3(0.25, 0.55, 0.3);
const float LEN = 1.1;
const float RAD = 0.2;

/* one cylinder along x at offset c; returns its distance */
float cylinder(vec3 p, float z0){
  vec3 q = p - vec3(0.0, 0.0, z0);
  vec2 d = vec2(length(q.yz) - RAD, abs(q.x) - LEN);
  return min(max(d.x, d.y), 0.0) + length(max(d, 0.0)) - 0.01;
}

float sdf(vec3 p, out float id){
  float a = cylinder(p, -0.32);
  float b = cylinder(p, 0.32);
  id = a < b ? 0.0 : 1.0;
  return min(a, b);
}
float sdf0(vec3 p){ float id; return sdf(p, id); }

vec3 normalAt(vec3 p){
  vec2 e = vec2(0.0012, 0.0);
  return normalize(vec3(sdf0(p + e.xyy) - sdf0(p - e.xyy), sdf0(p + e.yxy) - sdf0(p - e.yxy), sdf0(p + e.yyx) - sdf0(p - e.yyx)));
}

void main(){
  vec2 css = vec2(gl_FragCoord.x, uResolution.y - gl_FragCoord.y) / uDpr;
  vec2 q = css - uCentre;
  q.y = -q.y;
  vec2 u = q / uScale;
  float t = uTime;
  vec2 size = uResolution / uDpr;
  vec3 col = skyDeep(normalize(vec3((css - size * 0.5) / size.y * 1.3, -1.0)), 0.5) * 0.7;
  // the sun, far off to the left
  vec2 sunAt = vec2(-1.6, 0.55);
  col += vec3(1.0, 0.92, 0.75) * (exp(-length(u - sunAt) / 0.03) * 1.5 + exp(-length(u - sunAt) / 0.3) * 0.15);

  mat3 view = turnX(0.38 - uPitch) * turnY(-0.5 + uYaw);
  vec3 ro = view * vec3(0.0, 0.0, 4.0);
  vec3 rd = view * normalize(vec3(u, -4.0));
  vec3 L = view * normalize(vec3(-0.55, 0.45, 0.7));   // the sun, over the viewer's left shoulder

  float b = dot(ro, rd), c = dot(ro, ro) - 1.5 * 1.5, disc = b * b - c;
  if (disc > 0.0) {
    float s = max(-b - sqrt(disc), 0.0), far = -b + sqrt(disc);
    float id = 0.0;
    bool hit = false;
    for (int i = 0; i < 120; i++) {
      if (i >= 64 + 25 * uDetail || s > far) break;
      float h = sdf(ro + rd * s, id);
      if (h < 0.0006 * s) { hit = true; break; }
      s += h * 0.85;
    }
    if (hit) {
      vec3 p = ro + rd * s;
      vec3 n = normalAt(p);
      vec3 v = -rd;
      float diff = max(dot(n, L), 0.0);
      float spec = pow(max(dot(reflect(-L, n), v), 0.0), 40.0);
      float fres = pow(1.0 - max(dot(n, v), 0.0), 4.0);
      if (id > 1.5) {
        // a mirror: the sky and the sun's glare in it
        vec3 env = skyDeep(reflect(-v, n), 0.6);
        col = env * 0.8 + vec3(1.0, 0.95, 0.85) * spec * 1.4 + GLASS * fres * 0.3 + STEEL * 0.05;
      } else {
        float z0 = id < 0.5 ? -0.32 : 0.32;
        float spin = id < 0.5 ? t * 0.04 : -t * 0.04;
        vec3 lp = p - vec3(0.0, 0.0, z0);
        float a = atan(lp.z, lp.y) - spin;
        float stripe = fract(a / TAU * 6.0);                   // six bands: land, window, land...
        bool window = stripe > 0.5;
        float onSide = smoothstep(LEN - 0.02, LEN - 0.04, abs(lp.x));
        vec3 base = STEEL * (0.1 + 0.9 * diff) + vec3(1.0) * spec * 0.5;
        if (onSide > 0.0) {
          // the land: green fields and blue lakes; the windows: glass glowing with the light inside
          float fields = fbm3(vec3(lp.x * 9.0, a * 4.0, z0));
          vec3 land = mix(LAND * 1.3, GLASS * 0.8, smoothstep(0.55, 0.65, fields)) * (0.15 + 0.95 * diff) * (0.8 + 0.4 * fbm3(vec3(lp.x * 30.0, a * 12.0, 4.0)));
          vec3 glass = GLASS * (0.3 + 0.55 * diff + 0.45 * fres) + vec3(1.0) * spec;
          float rib = smoothstep(0.02, 0.0, abs(fract(lp.x * 7.0) - 0.5) - 0.47);
          vec3 side = window ? glass : land;
          // the seams between bands: a lighter steel frame, wide and soft
          float seam = smoothstep(0.03, 0.0, min(stripe, abs(stripe - 0.5)));
          side = mix(side, STEEL * (0.2 + 0.8 * diff), seam * 0.8);
          base = mix(base, side, onSide);
        }
        col = base;
      }
    }
  }

  col = col / (1.0 + max(col - 0.85, 0.0) * 0.85);
  gl_FragColor = vec4(col, 1.0);
}
`;

const CONFIG: OrbConfig = {
  fragment: FRAGMENT,
  framing: (width, height) => Math.min(width * 0.24, height * 0.38),
  close: 1.3,
  arriveFrom: 0.3,
  detail: { low: 0, medium: 1, high: 2 },
};

export default function OneillCylinderScene(props: SceneProps) {
  return <primitive object={useOrbScene(CONFIG, props)} />;
}
