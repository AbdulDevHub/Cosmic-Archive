/**
 * A Human Cell (D-190): our own illustration of one of your cells, the first step of the journey
 * down from the Starbase to strings. A translucent, softly wobbling cell seen in cross-section,
 * floating in a dark, watery blue: a rose membrane, glowing at its rim; inside, slow currents of
 * cytoplasm; a large violet nucleus with a bright envelope, grainy chromatin and a darker
 * nucleolus, wrapped in folds of endoplasmic reticulum; amber, bean-shaped mitochondria with
 * their inner folds; and small vesicles drifting. The nucleus is a body (`dna`): its hotspot dives
 * into DNA. One full-screen shader, one draw call, no particles. Its own colour family: rose,
 * violet, amber and a watery teal.
 */

import type { SceneBudget, SceneProps } from "../../host/types";
import { ORB_COMMON, useOrbScene, type OrbConfig } from "../shared/orb";

export const budget: SceneBudget = {
  drawCalls: 1,
  particles: { low: 0, medium: 0, high: 0 }, // no particles: the cost is per pixel
};

/** The nucleus's middle, in the cell's radii (y up): the DNA hotspot stands on it. */
const NUC = { x: 0.1, y: 0.06 };

const FRAGMENT = /* glsl */ `
${ORB_COMMON}

const vec3 ROSE = vec3(1.0, 0.48, 0.62);
const vec3 VIOLET = vec3(0.56, 0.38, 1.0);
const vec3 AMBER = vec3(1.0, 0.64, 0.28);
const vec3 TEAL = vec3(0.25, 0.75, 0.8);
const vec2 NUC = vec2(${NUC.x.toFixed(3)}, ${NUC.y.toFixed(3)});

float segD(vec2 p, vec2 a, vec2 b){
  vec2 ab = b - a;
  float h = clamp(dot(p - a, ab) / dot(ab, ab), 0.0, 1.0);
  return length(p - a - ab * h);
}

void main(){
  vec2 css = vec2(gl_FragCoord.x, uResolution.y - gl_FragCoord.y) / uDpr;
  vec2 q = css - uCentre;
  q.y = -q.y;
  vec2 u = q / uScale;     // the cell's radii, y up
  float t = uTime;
  // the drag turns the cell a little in its plane
  float rot = uYaw * 0.6 + t * 0.01;
  u = mat2(cos(rot), -sin(rot), sin(rot), cos(rot)) * u;

  // the watery dark it floats in, with faint drifting motes
  vec2 size = uResolution / uDpr;
  vec2 sc = (css - size * 0.5) / size.y;
  vec3 col = mix(vec3(0.01, 0.03, 0.05), vec3(0.02, 0.06, 0.09), fbm3(vec3(sc * 2.0, t * 0.02)));
  float mote = step(0.985, hash3(vec3(floor(sc * 90.0), 1.0))) * exp(-length(fract(sc * 90.0) - 0.5) * 9.0);
  col += TEAL * mote * 0.25;

  // the membrane: a soft, slowly wobbling outline
  float ang = atan(u.y, u.x);
  float edge = 0.94 + 0.045 * sin(ang * 3.0 + t * 0.3) + 0.03 * sin(ang * 5.0 - t * 0.21) + 0.02 * (noise3(vec3(ang * 2.0, t * 0.1, 0.0)) - 0.5);
  float r = length(u);
  float inside = smoothstep(edge + 0.01, edge - 0.01, r);
  float rim = exp(-pow((r - edge) / 0.018, 2.0));
  // the cytoplasm: slow currents, faintly teal
  float cur = fbm3(vec3(u * 3.0 + vec2(t * 0.03, -t * 0.02), t * 0.05));
  vec3 cyto = mix(vec3(0.04, 0.09, 0.12), vec3(0.08, 0.16, 0.2), cur) + ROSE * 0.04;
  col = mix(col, cyto, inside * 0.92);
  col += ROSE * rim * 0.85 + ROSE * exp(-abs(r - edge) / 0.06) * 0.12;

  // the endoplasmic reticulum: folded sheets wrapped round the nucleus
  vec2 n = u - NUC;
  float rn = length(n);
  float an = atan(n.y, n.x);
  float nucR = 0.3 + 0.015 * sin(an * 4.0 + t * 0.25);
  for (int k = 0; k < 3; k++) {
    float ring = nucR + 0.07 + 0.055 * float(k) + 0.02 * sin(an * (5.0 + float(k)) + t * 0.2 + float(k));
    float gap = smoothstep(0.35, 0.55, noise3(vec3(an * 1.5 + float(k) * 4.0, float(k), 2.0)));
    col += mix(ROSE, VIOLET, 0.5) * exp(-pow((rn - ring) / 0.007, 2.0)) * gap * 0.45 * inside;
  }

  // mitochondria: amber capsules with their inner folds
  for (int i = 0; i < 7; i++) {
    float fi = float(i);
    float a = fi * 0.9 + 2.4 + 0.05 * sin(t * 0.2 + fi);
    float rr = 0.63 + 0.12 * hash3(vec3(fi, 2.0, 5.0));
    vec2 c = vec2(cos(a), sin(a)) * rr;
    float o = hash3(vec3(fi, 7.0, 1.0)) * 3.14 + t * 0.03;
    vec2 dir = vec2(cos(o), sin(o));
    float len = 0.07 + 0.04 * hash3(vec3(fi, 3.0, 3.0));
    float d = segD(u, c - dir * len, c + dir * len);
    float w = 0.045;
    float body = smoothstep(w, w - 0.006, d);
    vec2 local = vec2(dot(u - c, dir), dot(u - c, vec2(-dir.y, dir.x)));
    float folds = 0.5 + 0.5 * sin(local.x * 120.0 + sin(local.y * 60.0) * 1.5);
    vec3 mito = AMBER * (0.25 + 0.45 * folds * smoothstep(w, 0.0, d)) + AMBER * exp(-pow((d - w) / 0.006, 2.0)) * 0.6;
    col = mix(col, mito, body * inside);
  }

  // vesicles: small bubbles drifting in the cytoplasm
  vec2 vg = (u + vec2(t * 0.01, 0.0)) * 14.0;
  vec2 vid = floor(vg);
  float vh = hash3(vec3(vid, 4.0));
  vec2 vp = fract(vg) - 0.5 - 0.25 * (vec2(hash3(vec3(vid, 5.0)), hash3(vec3(vid, 6.0))) - 0.5);
  float vr = 0.12 + 0.1 * hash3(vec3(vid, 7.0));
  float ves = step(0.8, vh) * exp(-pow((length(vp) - vr) / 0.03, 2.0)) * step(0.42, rn);
  col += mix(TEAL, ROSE, hash3(vec3(vid, 8.0))) * ves * 0.35 * inside;

  // the nucleus: grainy chromatin, a darker nucleolus, a bright envelope
  float inNuc = smoothstep(nucR + 0.008, nucR - 0.008, rn);
  float chrom = fbm3(vec3(n * 14.0, t * 0.05));
  vec3 nuc = VIOLET * (0.12 + 0.35 * pow(chrom, 1.5));
  float nucleolus = smoothstep(0.1, 0.07, length(n - vec2(0.06, -0.05)));
  nuc = mix(nuc, VIOLET * 0.08 + ROSE * 0.05, nucleolus);
  // and the DNA within, glowing a little brighter at the middle, where the dive goes
  nuc += mix(VIOLET, vec3(1.0), 0.4) * exp(-rn / 0.05) * 0.45;
  col = mix(col, nuc, inNuc);
  col += mix(VIOLET, vec3(1.0), 0.3) * exp(-pow((rn - nucR) / 0.01, 2.0)) * 0.7;
  // pores in the envelope
  float pore = step(0.7, 0.5 + 0.5 * sin(an * 26.0)) * exp(-pow((rn - nucR) / 0.012, 2.0));
  col += ROSE * pore * 0.3;

  col = col / (1.0 + max(col - 0.85, 0.0) * 0.85);
  gl_FragColor = vec4(col, 1.0);
}
`;

const CONFIG: OrbConfig = {
  fragment: FRAGMENT,
  framing: (width, height) => Math.min(width * 0.22, height * 0.3),
  close: 1.3,
  arriveFrom: 0.3,
  detail: { low: 0, medium: 1, high: 2 },
  // the nucleus, turned with the cell as the drag turns it (as the shader does)
  bodies: (t, yaw) => {
    const rot = yaw * 0.6 + t * 0.01;
    // GLSL's mat2 is column-major: the shader turns screen points into the cell by -rot, so a
    // point of the cell shows on screen turned by +rot
    const c = Math.cos(rot);
    const s = Math.sin(rot);
    return [{ name: "dna", x: c * NUC.x - s * NUC.y, y: s * NUC.x + c * NUC.y, z: 0.2 }];
  },
};

export default function HumanCellScene(props: SceneProps) {
  return <primitive object={useOrbScene(CONFIG, props)} />;
}
