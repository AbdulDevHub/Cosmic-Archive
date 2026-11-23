/**
 * Programmable Matter (D-154): our own illustration of matter made of millions of tiny units that
 * arrange themselves into forms on command (Carnegie Mellon's "catoms"), an idea inside the
 * Starbase. A body of small silver cells, light glowing cyan in the seams between them, slowly
 * reshapes itself: a sphere, then a ring, then a rounded block, and back, each change a few
 * seconds long; loose cells drift just off its surface on their way to new places. Ray-marched in
 * one full-screen shader: one draw call, no particles. Its own colour family: silver, cyan and
 * coral.
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

const vec3 SILVER = vec3(0.78, 0.82, 0.88);
const vec3 CYAN = vec3(0.3, 0.95, 1.0);
const vec3 CORAL = vec3(1.0, 0.5, 0.42);
const float CELL = 0.085;   // one unit's size, in radii
const float CYCLE = 14.0;   // seconds per form

float sphereF(vec3 p){ return length(p) - 0.85; }
float ringF(vec3 p){ vec2 q = vec2(length(p.xz) - 0.68, p.y); return length(q) - 0.3; }
float blockF(vec3 p){ vec3 q = abs(p) - vec3(0.55); return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0) - 0.12; }

/* the form at this moment: each held for most of its cycle, then flowing into the next */
float form(vec3 p){
  float k = uTime / CYCLE;
  float i = mod(floor(k), 3.0);
  float f = smoothstep(0.7, 1.0, fract(k));
  float a = i < 0.5 ? sphereF(p) : (i < 1.5 ? ringF(p) : blockF(p));
  float b = i < 0.5 ? ringF(p) : (i < 1.5 ? blockF(p) : sphereF(p));
  return mix(a, b, f);
}

/* the body, its surface made of small rounded cells; and loose cells just off it */
float body(vec3 p, out float loose){
  float d = form(p);
  // cells: a rounded bump per lattice site, so the surface is tiled with units
  vec3 c = p / CELL;
  vec3 g = fract(c) - 0.5;
  float bump = 0.5 - length(g);
  float surface = d - CELL * 0.22 * sqrt(max(bump * 2.0, 0.0));
  // loose units: a sparse lattice of small balls just outside the surface, drifting on
  vec3 lp = p / (CELL * 1.6) + vec3(0.0, uTime * 0.12, 0.0);
  vec3 id = floor(lp);
  float pick = step(0.975, hash3(id + 3.0));
  float ball = (length(fract(lp) - 0.5) - 0.16) * CELL * 1.6;
  float band = abs(d - 0.1) - 0.07;
  float free = pick > 0.5 ? max(ball, band) : max(CELL, band);
  loose = free < surface ? 1.0 : 0.0;
  return min(surface, free);
}

float sdf(vec3 p){ float l; return body(p, l); }

vec3 normalAt(vec3 p){
  vec2 e = vec2(0.0012, 0.0);
  return normalize(vec3(sdf(p + e.xyy) - sdf(p - e.xyy), sdf(p + e.yxy) - sdf(p - e.yxy), sdf(p + e.yyx) - sdf(p - e.yyx)));
}

void main(){
  vec2 css = vec2(gl_FragCoord.x, uResolution.y - gl_FragCoord.y) / uDpr;
  vec2 q = css - uCentre;
  q.y = -q.y;
  vec2 u = q / uScale;     // the body's radii, y up
  float t = uTime;
  vec2 size = uResolution / uDpr;
  vec3 skyDir = normalize(vec3((css - size * 0.5) / size.y * vec2(1.0, -1.0) * 1.3, -1.0));
  vec3 col = skyDeep(skyDir, 0.45) * 0.7;
  // a soft cyan and coral wash behind it, the light the body throws
  float r = length(u);
  col += CYAN * 0.05 * exp(-r * 1.2) + CORAL * 0.03 * exp(-length(u - vec2(0.9, -0.6)) * 1.5);

  // the camera: turned slowly and by the drag
  mat3 view = turnX(0.35 - uPitch) * turnY(uYaw + t * 0.05);
  vec3 ro = view * vec3(0.0, 0.0, 4.0);
  vec3 rd = view * normalize(vec3(u, -4.0));
  vec3 L = normalize(vec3(-0.5, 0.7, 0.6));

  float b = dot(ro, rd);
  float c = dot(ro, ro) - 1.35 * 1.35;
  float disc = b * b - c;
  if (disc > 0.0) {
    float s = max(-b - sqrt(disc), 0.0);
    float far = -b + sqrt(disc);
    int steps = 60 + 25 * uDetail;
    bool hit = false;
    float loose = 0.0;
    for (int i = 0; i < 120; i++) {
      if (i >= steps || s > far) break;
      float h = body(ro + rd * s, loose);
      if (h < 0.0006 * s) { hit = true; break; }
      s += h * 0.85;
    }
    if (hit) {
      vec3 p = ro + rd * s;
      vec3 n = normalAt(p);
      vec3 v = -rd;
      float diff = max(dot(n, L), 0.0);
      float spec = pow(max(dot(reflect(-L, n), v), 0.0), 60.0);
      float fres = pow(1.0 - max(dot(n, v), 0.0), 4.0);
      vec3 env = skyDeep(reflect(-v, n), 0.5);
      // the seams: where one unit meets the next, cyan light shows through
      // light glows up between the beads: brightest in the hollows where they meet, soft, never a line
      vec3 g = fract(p / CELL) - 0.5;
      float bead = sqrt(max((0.5 - length(g)) * 2.0, 0.0));   // 1 on a bead's top, 0 in the hollows
      float seam = pow(1.0 - bead, 6.0);
      float unit = hash3(floor(p / CELL));
      float pulse = 0.5 + 0.5 * sin(t * 1.6 + unit * TAU);
      vec3 metal = SILVER * (0.2 + 0.9 * diff) * (0.85 + 0.3 * unit) + env * 0.5 + vec3(1.0) * spec * 0.8;
      col = metal * (1.0 - 0.45 * seam) + CYAN * seam * (0.18 + 0.3 * pulse) + CYAN * fres * 0.3;
      // a few units lit coral, as if being told where to go next
      col += CORAL * step(0.975, unit) * bead * bead * (0.3 + 0.5 * pulse);
      if (loose > 0.5) col = mix(col, CYAN * 0.9 + vec3(0.4) * spec, 0.55);
    }
  }

  col = col / (1.0 + max(col - 0.85, 0.0) * 0.85);
  gl_FragColor = vec4(col, 1.0);
}
`;

const CONFIG: OrbConfig = {
  fragment: FRAGMENT,
  framing: (width, height) => Math.min(width * 0.24, height * 0.34),
  close: 1.3,
  arriveFrom: 0.3,
  detail: { low: 0, medium: 1, high: 2 },
};

export default function ProgrammableMatterScene(props: SceneProps) {
  return <primitive object={useOrbScene(CONFIG, props)} />;
}
