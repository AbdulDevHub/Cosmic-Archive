/**
 * The dark matter web (D-147, redrawn in D-192): our own illustration of matter that gives off no
 * light. The screen is nearly black. Far behind, a faint field of distant galaxies; in front, gold
 * galaxies gather in a few clusters and along the strands between them. The dark matter itself is
 * never lit: it shows only by what its gravity does, bending the far galaxies' light into thin arcs
 * round each unseen clump, and as a ghost of deep indigo that slowly swells and fades round the
 * clumps and strands, the only hint of how much is there. A drag looks round. One draw call, no
 * particles. Its own colour family: near black, deep indigo and gold. Mounted by the host through
 * the registry; never imported by a page.
 */

import type { SceneBudget, SceneProps } from "../../host/types";
import { ORB_COMMON, useOrbScene, type OrbConfig } from "../shared/orb";

export const budget: SceneBudget = {
  drawCalls: 1,
  particles: { low: 0, medium: 0, high: 0 }, // no particles: the cost is per pixel
};

const FRAGMENT = /* glsl */ `
${ORB_COMMON}

const vec3 INDIGO = vec3(0.3, 0.24, 0.85);
const vec3 GOLD = vec3(1.0, 0.82, 0.55);
const vec3 PALE = vec3(0.75, 0.82, 1.0);
const vec3 WHITE = vec3(1.0, 0.98, 0.95);

vec2 hash2(vec2 p){
  return fract(sin(vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)))) * 43758.5453);
}

/* the unseen clumps: where they sit (x, y) and how much each weighs (z) */
vec3 clump(int i){
  if (i == 0) return vec3(0.18, 0.08, 0.06);
  if (i == 1) return vec3(0.72, 0.36, 0.022);
  if (i == 2) return vec3(-0.42, 0.36, 0.024);
  if (i == 3) return vec3(0.6, -0.32, 0.03);
  return vec3(-0.02, -0.36, 0.016);
}

float segment(vec2 p, vec2 a, vec2 b){
  vec2 pa = p - a, ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h);
}

/* the strands between the clumps, and out past the frame */
float strands(vec2 p){
  float d = 9.0;
  d = min(d, segment(p, clump(0).xy, clump(1).xy));
  d = min(d, segment(p, clump(0).xy, clump(2).xy));
  d = min(d, segment(p, clump(0).xy, clump(3).xy));
  d = min(d, segment(p, clump(0).xy, clump(4).xy));
  d = min(d, segment(p, clump(1).xy, clump(3).xy));
  d = min(d, segment(p, clump(2).xy, clump(4).xy));
  d = min(d, segment(p, clump(1).xy, vec2(1.2, 1.3)));
  d = min(d, segment(p, clump(2).xy, vec2(-1.8, 1.0)));
  d = min(d, segment(p, clump(3).xy, vec2(1.9, -0.7)));
  d = min(d, segment(p, clump(4).xy, vec2(-1.7, -0.8)));
  d = min(d, segment(p, clump(3).xy, vec2(0.5, -1.4)));
  return d;
}

/* the far galaxies: small faint smudges, each its own shape and tilt */
vec3 farField(vec2 s, float freq, float seed){
  vec2 g = s * freq;
  vec2 i = floor(g);
  vec2 h = hash2(i + seed);
  vec2 o = 0.3 + 0.4 * hash2(i + seed + 2.0);
  vec2 d = fract(g) - o;
  float a = h.y * TAU;
  d = vec2(cos(a) * d.x + sin(a) * d.y, -sin(a) * d.x + cos(a) * d.y);
  float shape = exp(-(d.x * d.x / 0.012 + d.y * d.y / 0.003));
  float present = step(0.55, h.x);
  return mix(PALE, WHITE, h.y) * shape * present * (0.16 + 0.4 * h.x);
}

void main(){
  vec2 css = vec2(gl_FragCoord.x, uResolution.y - gl_FragCoord.y) / uDpr;
  vec2 q = css - uCentre;
  q.y = -q.y;
  float t = uTime;
  vec2 u = q / uScale + vec2(-uYaw, uPitch) * 0.45 + vec2(t * 0.004, 0.0);

  // ---- the far galaxies, their light bent round each unseen clump ----
  vec2 src = u;
  for (int i = 0; i < 5; i++) {
    vec3 c = clump(i);
    vec2 d = u - c.xy;
    float r2 = dot(d, d);
    src -= c.z * d / (r2 + 0.002);
  }
  vec3 col = farField(src, 11.0, 1.0) + farField(src, 19.0, 5.0) * 0.7;
  // a few faint stars of our own galaxy, unbent, so the dark is not empty
  vec2 sg = u * 40.0;
  vec2 sh = hash2(floor(sg) + 11.0);
  col += WHITE * step(0.985, sh.x) * exp(-length(fract(sg) - 0.5) * 14.0) * 0.5;

  // ---- the dark matter: never lit, only a ghost of deep indigo that swells and fades ----
  float breath = smoothstep(1.0, 6.0, t) * (0.55 + 0.45 * sin(t * 0.35 - 1.2));
  vec2 wu = u + 0.08 * vec2(fbm3(vec3(u * 1.5, 1.0)), fbm3(vec3(u * 1.5, 4.0))) - 0.04;
  float sd = strands(wu);
  float width = 0.05 + 0.05 * fbm3(vec3(u * 2.0, 7.0));
  float broken = smoothstep(0.3, 0.65, fbm3(vec3(u * 1.2, 9.0)));
  float strand = exp(-sd / width) * (0.4 + 0.6 * broken);
  float halo = 0.0;
  for (int i = 0; i < 5; i++) {
    vec3 c = clump(i);
    halo += exp(-length(wu - c.xy) / (1.6 * sqrt(c.z))) * (0.5 + 10.0 * c.z);
  }
  float lump = fbm3(vec3(u * 3.0, t * 0.02));
  col += INDIGO * (strand * 0.12 + halo * 0.16) * (0.5 + 0.8 * lump) * breath;

  // ---- the galaxies we can see: gold, gathered in the clumps and strung along the strands ----
  // where the galaxies live: close in round each clump, and thinly along the strands
  float home = 0.0;
  for (int i = 0; i < 5; i++) home += exp(-length(u - clump(i).xy) / (0.7 * sqrt(clump(i).z)));
  home = clamp(home + exp(-sd / 0.03) * 0.5 * broken, 0.0, 1.0);
  for (int k = 0; k < 2; k++) {
    float fk = float(k);
    vec2 g = u * (30.0 + fk * 22.0);
    vec2 gi = floor(g);
    vec2 go = hash2(gi + 3.1 + fk * 9.0);
    vec2 d = fract(g) - (0.2 + 0.6 * go);
    float keep = step(1.0 - home * 0.55, hash2(gi + 7.7 + fk).x);
    col += mix(GOLD, WHITE, go.y * 0.5) * exp(-dot(d, d) * (220.0 + fk * 260.0)) * keep * (1.4 - fk * 0.5);
  }
  // each clump's brightest galaxy, a soft gold oval at its heart
  for (int i = 0; i < 5; i++) {
    vec3 c = clump(i);
    vec2 d = u - c.xy;
    col += GOLD * exp(-(d.x * d.x / 0.0006 + d.y * d.y / 0.0003)) * (0.5 + 12.0 * c.z);
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
