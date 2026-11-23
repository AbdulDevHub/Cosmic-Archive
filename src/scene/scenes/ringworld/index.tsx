/**
 * Ringworld (D-173): our own illustration of the ring world of Larry Niven's 1970 novel, a
 * megastructure in A Quasar Galaxy: a ring round a star at about Earth's distance from the Sun,
 * its inner face one endless landscape. Seen from above and outside the ring's plane: the star small
 * and white at the middle; the ring a broad band in perspective, its far side showing its sunlit
 * inner face of blue seas, green and tan land and drifting cloud between tall rim walls, its near
 * side showing only its ribbed outer hull, edged with the light of the walls. Twenty shadow squares
 * circle the star inside it, casting the soft night patches on the land. One full-screen shader,
 * one draw call, no particles. Its own colour family: ocean blue, leaf green and sun white.
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

const vec3 OCEAN = vec3(0.1, 0.32, 0.65);
const vec3 LEAF = vec3(0.25, 0.55, 0.25);
const vec3 SUNW = vec3(1.0, 0.97, 0.9);
const float HALF = 0.09;   // half the ring's width, in its radii

void main(){
  vec2 css = vec2(gl_FragCoord.x, uResolution.y - gl_FragCoord.y) / uDpr;
  vec2 q = css - uCentre;
  q.y = -q.y;
  vec2 u = q / uScale;     // the ring's radii, y up
  float t = uTime;
  vec2 size = uResolution / uDpr;
  vec3 col = skyDeep(normalize(vec3((css - size * 0.5) / size.y * 1.3, -1.0)), 0.45) * 0.7;

  // the star
  float rs = length(u);
  col += SUNW * (exp(-rs / 0.025) * 2.0 + exp(-rs / 0.12) * 0.35 + exp(-rs / 0.5) * 0.06);

  // the ring: a short cylinder of radius 1, half-width HALF, seen from above by e; a ray hits it
  // where it crosses the cylinder (the inner face far away, the underside near)
  float e = clamp(0.55 + uPitch * 0.6, 0.2, 0.95);
  vec3 ro = vec3(0.0, 0.0, 5.0);
  vec3 rd = normalize(vec3(u, -5.0));
  mat3 toRing = turnX(-e) ;
  vec3 o = toRing * ro;
  vec3 d = toRing * rd;
  float spin = t * 0.01 + uYaw;
  // cylinder about y: x^2 + z^2 = 1
  float a = d.x * d.x + d.z * d.z;
  float b = 2.0 * (o.x * d.x + o.z * d.z);
  float c = o.x * o.x + o.z * o.z - 1.0;
  float disc = b * b - 4.0 * a * c;
  if (disc > 0.0) {
    float sq = sqrt(disc);
    float s1 = (-b - sq) / (2.0 * a);
    float s2 = (-b + sq) / (2.0 * a);
    vec3 p1 = o + d * s1;   // the near crossing: the ring's underside, seen from outside
    vec3 p2 = o + d * s2;   // the far crossing: its inner face, lit by the star
    bool near = abs(p1.y) < HALF;
    bool far = abs(p2.y) < HALF;
    if (far && !near) {
      vec3 p = p2;
      float ang = atan(p.z, p.x) + spin;
      float across = p.y / HALF;             // -1 to 1 across the width
      // the landscape: seas, land and cloud, with tall rim walls at the edges
      vec3 lp = vec3(cos(ang), p.y, sin(ang)) * 9.0;    // the same scale along and across, so the land is not streaked
      float landN = fbm3(lp);
      float land = smoothstep(0.5, 0.56, landN);
      vec3 ground = mix(OCEAN, mix(LEAF, vec3(0.62, 0.55, 0.38), smoothstep(0.62, 0.72, landN)), land);
      float cloud = smoothstep(0.55, 0.78, fbm3(lp * 2.2 + vec3(t * 0.05, 3.0, 0.0)));
      ground = mix(ground, vec3(0.95), cloud * 0.75);
      float wall = smoothstep(0.82, 0.97, abs(across));
      ground = mix(ground, vec3(0.55, 0.52, 0.5), wall);
      // lit by the star; the air thickens to a blue haze where the face is seen side-on
      vec3 nIn = -normalize(vec3(p.x, 0.0, p.z));
      float graze = 1.0 - abs(dot(nIn, -d));
      ground *= 0.9;
      ground = mix(ground, vec3(0.5, 0.7, 1.0), 0.12 + 0.55 * pow(graze, 2.5));
      // the shadow squares' night falls across it in long, soft patches (twenty of them)
      float night = smoothstep(0.45, 0.05, abs(fract(ang * 20.0 / TAU + t * 0.003) - 0.5));
      ground *= 1.0 - 0.4 * night;
      // the tops of the rim walls catch the starlight: two fine bright edges
      ground += SUNW * 0.5 * smoothstep(0.985, 1.0, abs(across));
      col = ground;
    } else if (near) {
      // the outer hull: dark steel in long ribbed panels, rim-lit at its edges, the walls' tops bright
      float across = p1.y / HALF;
      float ang = atan(p1.z, p1.x) + spin;
      float rib = smoothstep(0.4, 0.48, abs(fract(ang * 180.0 / TAU) - 0.5));
      float panel = fbm3(vec3(floor(ang * 360.0 / TAU), floor(across * 3.0), 2.0));
      float side = 1.0 - abs(p1.x);           // facing the viewer most at the middle
      col = vec3(0.05, 0.055, 0.075) * (0.7 + 0.6 * panel) * (0.6 + 0.4 * side) + vec3(0.12, 0.13, 0.17) * rib * 0.35;
      col += vec3(0.35, 0.45, 0.7) * 0.18 * pow(1.0 - side, 3.0);                      // starlight scattered round its ends
      col += SUNW * (0.08 * smoothstep(0.8, 1.0, abs(across)) + 0.4 * smoothstep(0.975, 1.0, abs(across)));
    }
  }

  // the shadow squares: twenty dark plates on a smaller ring round the star, against its glow
  {
    float k = 0.42;                                    // their orbit, in the ring's radii
    // where the ray meets the ring's plane (y = 0 in ring space)
    if (abs(d.y) > 1e-4) {
      float sp = -o.y / d.y;
      vec3 pp = o + d * sp;
      float rr = length(pp.xz);
      float ang = atan(pp.z, pp.x) - t * 0.02;
      float cell = fract(ang * 20.0 / TAU);
      float plate = smoothstep(0.012, 0.0, abs(rr - k) - 0.022) * smoothstep(0.02, 0.0, abs(cell - 0.5) - 0.2);
      // hidden behind the ring's near hull
      bool behind = disc > 0.0 && abs((o + d * ((-b - sqrt(max(disc, 0.0))) / (2.0 * a))).y) < HALF;
      if (sp > 0.0 && !behind) col = mix(col, vec3(0.015, 0.015, 0.025) + SUNW * 0.05, plate * 0.92);
    }
  }

  col = col / (1.0 + max(col - 0.85, 0.0) * 0.85);
  gl_FragColor = vec4(col, 1.0);
}
`;

const CONFIG: OrbConfig = {
  fragment: FRAGMENT,
  framing: (width, height) => Math.min(width * 0.25, height * 0.4),
  close: 1.3,
  arriveFrom: 0.3,
  detail: { low: 0, medium: 1, high: 2 },
};

export default function RingworldScene(props: SceneProps) {
  return <primitive object={useOrbScene(CONFIG, props)} />;
}
