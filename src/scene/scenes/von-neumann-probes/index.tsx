/**
 * Von Neumann Probes (D-167, redrawn D-189): our own illustration of self-copying probes, a
 * megastructure idea in A Quasar Galaxy. A dim orange star and its belt of rocks, seen at a slant.
 * One probe, a sharp mint spark, flies in and settles on a rock; the rock glows as it is taken apart
 * and shrinks away, and two new probes leave it, each for another rock. Each of those is eaten and
 * gives two more: 1, 2, 4, 8, 16 probes, the belt stripped faster and faster, until the last
 * sixteen fly off out of the frame toward other stars. Then the belt is whole again and it starts
 * over. The probes are a binary tree: rock i's two children go to rocks 2i+1 and 2i+2. One
 * full-screen shader, one draw call, no particles. Its own colour family: mint green, silver and
 * indigo, round a dim orange star.
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

const vec3 MINT = vec3(0.4, 1.0, 0.75);
const vec3 SILVER = vec3(0.82, 0.86, 0.95);
const vec3 SUN = vec3(1.0, 0.55, 0.28);
const float ROCKS = 31.0;   // five generations: 1 + 2 + 4 + 8 + 16
const float FLY = 3.0;      // seconds a probe takes between rocks
const float EAT = 2.2;      // seconds a rock takes to be taken apart
const float CYCLE = 34.0;
const float PI = 3.14159265;

float tiltNow(){ return clamp(0.42 + uPitch * 0.6, 0.18, 0.9); }

/* rock i in the belt: x, y on screen (radii, y up), and its size */
vec3 rockAt(float i){
  float h1 = hash3(vec3(i, 1.0, 7.0));
  float h2 = hash3(vec3(i, 2.0, 3.0));
  float a = i * 2.39996 + 0.6 + uYaw + uTime * 0.008;
  float r = 0.34 + 0.6 * h1;
  vec2 p = vec2(cos(a), sin(a)) * r;
  return vec3(p.x, p.y * tiltNow() + (h2 - 0.5) * 0.05, 0.011 + 0.017 * hash3(vec3(i, 5.0, 1.0)));
}

/* the generation a rock is eaten in: 0 for the first, 4 for the last sixteen */
float levelOf(float i){ return floor(log2(i + 1.0) + 1e-4); }

float segment(vec2 p, vec2 a, vec2 b){
  vec2 ab = b - a;
  float h = clamp(dot(p - a, ab) / max(dot(ab, ab), 1e-6), 0.0, 1.0);
  return length(p - a - ab * h);
}

/* a probe's path from a to b over e in 0..1, bowed a little to one side */
vec2 pathAt(vec2 a, vec2 b, float e, float side){
  vec2 ab = b - a;
  vec2 n = normalize(vec2(-ab.y, ab.x) + 1e-5);
  return mix(a, b, e) + n * sin(e * PI) * 0.05 * side * min(length(ab), 1.0);
}

void main(){
  vec2 css = vec2(gl_FragCoord.x, uResolution.y - gl_FragCoord.y) / uDpr;
  vec2 q = css - uCentre;
  q.y = -q.y;
  vec2 u = q / uScale;     // the belt's radii, y up
  float t = uTime;
  vec2 size = uResolution / uDpr;
  vec3 col = skyDeep(normalize(vec3((css - size * 0.5) / size.y * 1.3, -1.0)), 0.4) * 0.5;

  // the star the belt circles
  float rs = length(u);
  col += SUN * exp(-rs / 0.03) * 1.5 + SUN * exp(-rs / 0.18) * 0.16;

  float tc = mod(t + 6.0, CYCLE);   // the poster frame (t = 12) catches eight probes in flight
  float fade = smoothstep(0.0, 1.5, tc) * smoothstep(CYCLE, CYCLE - 2.5, tc);

  // the belt's dust and gravel, the raw material: it thins as the rocks are eaten
  float tilt = tiltNow();
  vec2 disc = vec2(u.x, u.y / tilt);
  float rr = length(disc);
  float band = smoothstep(0.26, 0.4, rr) * smoothstep(1.02, 0.88, rr);
  float spun = atan(disc.y, disc.x) - uYaw - t * 0.008;
  vec2 polar = vec2(cos(spun), sin(spun)) * rr;
  float eaten = clamp((tc - FLY) / (5.0 * (FLY + EAT)), 0.0, 1.0);
  float grit = noise3(vec3(polar * 9.0, 2.0)) * noise3(vec3(polar * 31.0, 5.0));
  col += vec3(0.5, 0.44, 0.38) * band * (0.05 + 0.22 * grit) * (1.0 - 0.8 * eaten);

  // the rocks: whole until their probe arrives, then taken apart, shrinking away in a mint glow
  for (int k = 0; k < 31; k++) {
    float i = float(k);
    vec3 rock = rockAt(i);
    float start = levelOf(i) * (FLY + EAT) + FLY;
    float s = clamp((tc - start) / EAT, 0.0, 1.0);
    vec2 d = u - rock.xy;
    float dist = length(d);
    if (dist > 0.12) continue;
    float br = rock.z * (1.0 - s * s);
    if (br > 0.002) {
      // a lumpy rock, not a ball, with a crisp edge
      float lump = br * (0.78 + 0.4 * noise3(vec3(normalize(d + 1e-5) * 1.6, i * 1.7)));
      float inside = smoothstep(lump, lump - 1.2 / uScale, dist);
      vec3 nrm = normalize(vec3(d / br, 0.7));
      float shade = 0.35 + 0.65 * max(dot(nrm, normalize(vec3(-rock.xy, 0.8))), 0.0);
      vec3 stone = mix(vec3(0.3, 0.26, 0.24), vec3(0.58, 0.5, 0.44), noise3(vec3(d / br * 2.2, i)));
      col = mix(col, stone * shade * 0.85 + MINT * s * 0.4, inside);
    }
    // the probe at work: a mint light flickering over the rock, and specks of it carried off
    float busy = step(start, tc) * step(tc, start + EAT);
    col += MINT * exp(-dist / 0.008) * busy * (0.7 + 0.5 * sin(t * 11.0 + i * 3.0)) * fade;
    col += MINT * exp(-dist / 0.035) * busy * 0.1 * fade;
    // and once it is gone, a faint haze of dust
    col += SILVER * exp(-dist / 0.035) * 0.05 * step(start + EAT, tc);
  }

  // the first probe, flying in from the dark
  vec2 home = rockAt(0.0).xy;
  float f0 = clamp(tc / FLY, 0.0, 1.0);
  if (f0 > 0.0 && f0 < 1.0) {
    float e = f0 * f0 * (3.0 - 2.0 * f0);
    vec2 from = vec2(-1.6, 1.1);
    vec2 p = pathAt(from, home, e, 1.0);
    vec2 back = pathAt(from, home, max(e - 0.07, 0.0), 1.0);
    col += MINT * (exp(-length(u - p) / 0.005) * 1.6 + exp(-segment(u, back, p) / 0.003) * 0.5) * fade;
  }

  // the copies: two leave each rock as it is finished, for rocks 2i+1 and 2i+2 (the last sixteen's
  // children leave the belt, outward, toward other stars)
  for (int k = 0; k < 31; k++) {
    float i = float(k);
    float launch = levelOf(i) * (FLY + EAT) + FLY + EAT;
    float f = (tc - launch) / FLY;
    if (f < 0.0 || f > 1.0) continue;
    float e = f * f * (3.0 - 2.0 * f);
    vec2 from = rockAt(i).xy;
    for (int c = 1; c <= 2; c++) {
      float j = 2.0 * i + float(c);
      float side = c == 1 ? 1.0 : -1.0;
      vec2 to = j < ROCKS ? rockAt(j).xy : from + normalize(from + vec2(0.0, 0.001)) * 1.4 + vec2(side * 0.3, 0.0);
      vec2 p = pathAt(from, to, e, side);
      vec2 back = pathAt(from, to, max(e - 0.1, 0.0), side);
      float glow = exp(-length(u - p) / 0.005) * 1.6 + exp(-segment(u, back, p) / 0.003) * 0.5;
      col += MINT * glow * fade;
    }
  }

  col = col / (1.0 + max(col - 0.85, 0.0) * 0.85);
  gl_FragColor = vec4(col, 1.0);
}
`;

const CONFIG: OrbConfig = {
  fragment: FRAGMENT,
  framing: (width, height) => Math.min(width * 0.38, height * 0.62),
  close: 1.3,
  arriveFrom: 0.3,
  detail: { low: 0, medium: 1, high: 2 },
};

export default function VonNeumannProbesScene(props: SceneProps) {
  return <primitive object={useOrbScene(CONFIG, props)} />;
}
