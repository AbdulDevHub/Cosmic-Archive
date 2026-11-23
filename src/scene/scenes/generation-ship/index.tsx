/**
 * Generation Ship (D-166): our own illustration of a world ship, a megastructure in A Quasar Galaxy:
 * a vast vessel built to carry people to another star over centuries. Seen from ahead and to one
 * side as it passes: a long bone-white spine, a great drum of living space turning slowly round it,
 * its decks of amber windows brightest on its night side, a broad shield dish at its bow, and at
 * the stern the long violet plume of a slow burn. A far star ahead lights it from the front. The stars drift past very slowly; the trip is the point. Ray-marched
 * in one full-screen shader: one draw call, no particles. Its own colour family: bone white, amber
 * and deep blue.
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

const vec3 BONE = vec3(0.86, 0.84, 0.78);
const vec3 AMBER = vec3(1.0, 0.66, 0.28);
const vec3 DEEP = vec3(0.05, 0.08, 0.22);
const vec3 BURN = vec3(0.62, 0.45, 1.0);

float capsuleX(vec3 p, float x0, float x1, float r){ p.x -= clamp(p.x, x0, x1); return length(p) - r; }

/* the ship along x, bow toward +x. id: 0 spine, 1 drum, 2 shield */
float ship(vec3 p, out float id){
  float spine = capsuleX(p, -1.2, 1.05, 0.05);
  // the drum: a wide cylinder with rounded ends, its surface ribbed into decks
  vec2 dq = vec2(length(p.yz) - 0.3, abs(p.x + 0.05) - 0.42);
  float drum = min(max(dq.x, dq.y), 0.0) + length(max(dq, 0.0)) - 0.03;
  // the shield: a shallow dish at the bow
  vec3 sp = p - vec3(1.12, 0.0, 0.0);
  float dish = max(abs(length(sp - vec3(-0.9, 0.0, 0.0)) - 0.95) - 0.02, -sp.x + 0.0);
  dish = max(dish, length(sp.yz) - 0.36);
  // tanks and trusses toward the stern
  float tank = length(vec3(p.x + 0.85, abs(p.y) - 0.085, p.z) * vec3(0.35, 1.0, 1.0)) - 0.045;
  tank = min(tank, length(vec3(p.x + 0.85, p.y, abs(p.z) - 0.085) * vec3(0.35, 1.0, 1.0)) - 0.045);
  float d = min(spine, tank);
  id = 0.0;
  if (drum < d) { d = drum; id = 1.0; }
  if (dish < d) { d = dish; id = 2.0; }
  return d;
}

float sdf(vec3 p){ float id; return ship(p, id); }

vec3 normalAt(vec3 p){
  vec2 e = vec2(0.0012, 0.0);
  return normalize(vec3(sdf(p + e.xyy) - sdf(p - e.xyy), sdf(p + e.yxy) - sdf(p - e.yxy), sdf(p + e.yyx) - sdf(p - e.yyx)));
}

void main(){
  vec2 css = vec2(gl_FragCoord.x, uResolution.y - gl_FragCoord.y) / uDpr;
  vec2 q = css - uCentre;
  q.y = -q.y;
  vec2 u = q / uScale;     // the ship's lengths, y up
  float t = uTime;
  vec2 size = uResolution / uDpr;
  // the stars drift slowly past, the other way
  vec2 sv = (css - size * 0.5) / size.y + vec2(t * 0.002, 0.0);
  vec3 col = skyDeep(normalize(vec3(sv * 1.3, -1.0)), 0.5) * 0.7 + DEEP * 0.35;

  mat3 view = turnX(0.28 - uPitch) * turnY(-0.62 + uYaw);
  vec3 ro = view * vec3(0.0, 0.0, 4.2);
  vec3 rd = view * normalize(vec3(u, -4.2));
  vec3 L = view * normalize(vec3(0.65, 0.5, 0.4));        // a far star, ahead and above: a day side and a night side

  // the burn: a long soft plume behind the stern, along -x. Find where the view ray passes
  // closest to the ship's axis, and how far behind the stern that is.
  float bx = rd.x, dx = dot(rd, ro), denom = max(1.0 - bx * bx, 1e-4);
  float sr = (bx * ro.x - dx) / denom;                    // along the ray
  float tl = (ro.x - bx * dx) / denom;                    // along the axis
  vec3 closeP = ro + rd * sr;
  float off = length(closeP - vec3(tl, 0.0, 0.0));
  float along = clamp((-tl - 1.22) / 2.2, 0.0, 1.0);
  float behindStern = smoothstep(-1.18, -1.28, tl);
  float flick = 0.85 + 0.15 * fbm3(vec3(tl * 4.0 + t * 2.0, 0.0, 5.0));
  col += BURN * exp(-off * off / (0.0015 + 0.02 * along)) * pow(1.0 - along, 1.5) * behindStern * 1.1 * flick;
  col += vec3(0.9, 0.85, 1.0) * exp(-off * off / 0.0006) * pow(1.0 - along, 4.0) * behindStern * 0.9;

  float b = dot(ro, rd);
  float cc = dot(ro, ro) - 1.6 * 1.6;
  float disc = b * b - cc;
  if (disc > 0.0) {
    float s = max(-b - sqrt(disc), 0.0);
    float far = -b + sqrt(disc);
    float id = 0.0;
    bool hit = false;
    for (int i = 0; i < 110; i++) {
      if (i >= 60 + 25 * uDetail || s > far) break;
      float h = ship(ro + rd * s, id);
      if (h < 0.0007 * s) { hit = true; break; }
      s += h * 0.8;
    }
    if (hit) {
      vec3 p = ro + rd * s;
      vec3 n = normalAt(p);
      vec3 v = -rd;
      float diff = max(dot(n, L), 0.0);
      float spec = pow(max(dot(reflect(-L, n), v), 0.0), 30.0);
      float rim = pow(1.0 - max(dot(n, v), 0.0), 3.0);
      // hull plating: panels of slightly different tone, with a deep blue fill on the night side
      float plate = hash3(floor(p * vec3(40.0, 60.0, 60.0)));
      vec3 hull = BONE * (0.8 + 0.08 * plate);
      vec3 base = hull * (0.1 + 0.88 * diff) + DEEP * 0.7 * (1.0 - diff) + vec3(1.0) * spec * 0.45 + vec3(0.45, 0.55, 0.9) * rim * 0.3;
      if (id < 0.5 && length(p.yz) < 0.065) {
        // the spine: a truss, banded into segments (the tanks stay plain)
        base *= 0.86 + 0.14 * step(0.3, fract(p.x * 9.0));
      }
      if (id > 0.5 && id < 1.5) {
        // the drum turns: deck after deck of windows round it, brightest on its night side
        float a = atan(p.z, p.y) + t * 0.05;
        vec2 w = vec2(a * 30.0, (p.x + 0.05) * 34.0);
        vec2 wf = fract(w) - 0.5;
        float lit = step(0.25, hash3(vec3(floor(w), 2.0)));
        float warm = hash3(vec3(floor(w), 7.0));
        float win = smoothstep(0.4, 0.2, abs(wf.x)) * smoothstep(0.32, 0.12, abs(wf.y));
        float side = smoothstep(0.02, 0.2, length(p.yz) - 0.28);
        float deck = step(0.5, fract((p.x + 0.05) * 4.0));   // bands of decks and dark structure
        base *= 0.85 + 0.15 * deck;
        vec3 glow = mix(AMBER, vec3(1.0, 0.88, 0.65), warm);
        base += glow * win * lit * side * deck * (0.6 + 1.2 * (1.0 - diff));
      }
      if (id > 1.5) {
        // the shield: a pale dish, scuffed by centuries of dust, its face catching the far star
        float scuff = fbm3(p * 30.0);
        base = BONE * (0.12 + 0.85 * diff) * (0.8 + 0.3 * scuff) + DEEP * 0.7 * (1.0 - diff) + vec3(0.8, 0.85, 1.0) * spec * 0.7 + vec3(0.45, 0.55, 0.9) * rim * 0.35;
      }
      col = base;
    }
  }

  col = col / (1.0 + max(col - 0.85, 0.0) * 0.85);
  gl_FragColor = vec4(col, 1.0);
}
`;

const CONFIG: OrbConfig = {
  fragment: FRAGMENT,
  framing: (width, height) => Math.min(width * 0.32, height * 0.5),
  close: 1.3,
  arriveFrom: 0.3,
  detail: { low: 0, medium: 1, high: 2 },
};

export default function GenerationShipScene(props: SceneProps) {
  return <primitive object={useOrbScene(CONFIG, props)} />;
}
