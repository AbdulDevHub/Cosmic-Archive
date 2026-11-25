/**
 * DNA (D-190): our own illustration of the molecule inside the cell's nucleus, the second step down
 * from the Starbase. A double helix runs across the frame on a slant, turning slowly: two backbones
 * of pale blue beads (its atoms) winding round each other, joined by rungs, the base pairs, each
 * pair in its own two colours (A with T, G with C); the near side bright, the far side dimmer, in a
 * dark blue haze with soft, out-of-focus strands far behind. One atom of the backbone glows gold:
 * it is a body (`atom`), whose hotspot dives into A Carbon Atom. One full-screen shader, one draw
 * call, no particles. Its own colour family: ice blue, teal, rose, gold and violet.
 */

import type { SceneBudget, SceneProps } from "../../host/types";
import { ORB_COMMON, useOrbScene, type OrbConfig } from "../shared/orb";

export const budget: SceneBudget = {
  drawCalls: 1,
  particles: { low: 0, medium: 0, high: 0 }, // no particles: the cost is per pixel
};

/** The helix's axis on screen (a unit vector), its radius, its turn per radius along it, how fast it turns. */
const AXIS = { x: 0.94, y: 0.342 };
const HELIX_R = 0.2;
const TWIST = 7.0;
const SPIN = 0.25;

const FRAGMENT = /* glsl */ `
${ORB_COMMON}

const vec3 ICE = vec3(0.7, 0.85, 1.0);
const vec3 GOLD = vec3(1.0, 0.8, 0.4);
const vec2 AXIS = vec2(${AXIS.x.toFixed(3)}, ${AXIS.y.toFixed(3)});
const float RH = ${HELIX_R.toFixed(3)};
const float TW = ${TWIST.toFixed(3)};
const float STEP = 0.09;      // between base pairs, along the axis: about ten to a turn
const float OFF = 2.4;        // the second strand's phase behind the first (the grooves)

/* the base pair's two colours: A with T (teal and rose), G with C (gold and violet) */
void pairColours(float k, out vec3 a, out vec3 b){
  float h = hash3(vec3(k, 1.0, 3.0));
  vec3 c1 = h < 0.5 ? vec3(0.3, 0.9, 0.85) : vec3(1.0, 0.78, 0.35);
  vec3 c2 = h < 0.5 ? vec3(1.0, 0.45, 0.62) : vec3(0.62, 0.45, 1.0);
  bool flip = hash3(vec3(k, 2.0, 9.0)) < 0.5;
  a = flip ? c2 : c1;
  b = flip ? c1 : c2;
}

vec3 bead(vec2 d, float rad, vec3 tone, float near){
  float l = length(d);
  float body = smoothstep(rad, rad * 0.8, l);
  vec3 nrm = normalize(vec3(d / rad, sqrt(max(1.0 - dot(d, d) / (rad * rad), 0.0))));
  float lit = 0.35 + 0.65 * max(dot(nrm, normalize(vec3(-0.4, 0.6, 0.7))), 0.0);
  return tone * lit * body * mix(0.35, 1.0, near) + tone * exp(-l / (rad * 1.4)) * 0.18 * near;
}

void main(){
  vec2 css = vec2(gl_FragCoord.x, uResolution.y - gl_FragCoord.y) / uDpr;
  vec2 q = css - uCentre;
  q.y = -q.y;
  vec2 u = q / uScale;     // y up
  float t = uTime;
  vec2 size = uResolution / uDpr;
  vec2 sc = (css - size * 0.5) / size.y;

  // the dark blue haze, and soft, out-of-focus strands far behind
  vec3 col = mix(vec3(0.01, 0.015, 0.04), vec3(0.03, 0.04, 0.1), fbm3(vec3(sc * 1.5, t * 0.02)));
  for (int k = 0; k < 2; k++) {
    float fk = float(k);
    vec2 a2 = normalize(vec2(0.5 - fk, 1.0));
    float s2 = dot(sc, a2);
    float p2 = dot(sc, vec2(-a2.y, a2.x)) - (fk - 0.5) * 1.1;
    float wav = 0.05 * cos(s2 * 14.0 + t * 0.3 + fk);
    col += mix(ICE, vec3(0.62, 0.45, 1.0), fk) * exp(-abs(p2 - wav) / 0.05) * 0.05;
  }

  vec2 P = vec2(-AXIS.y, AXIS.x);
  float s = dot(u, AXIS);
  float p = dot(u, P);
  float spin = t * ${SPIN.toFixed(3)} + uYaw;
  float k0 = floor(s / STEP);
  vec3 back = vec3(0.0);
  vec3 front = vec3(0.0);
  for (int j = -1; j <= 2; j++) {
    float k = k0 + float(j);
    float sk = k * STEP;
    float ph = sk * TW + spin;
    float p1 = RH * cos(ph), z1 = sin(ph);
    float p2 = RH * cos(ph + OFF), z2 = sin(ph + OFF);
    vec2 here = vec2(s - sk, 0.0);
    // the rung: two halves, each its base's colour, from strand to strand
    vec3 ca, cb;
    pairColours(k, ca, cb);
    float lo = min(p1, p2), hi = max(p1, p2);
    float along = clamp((p - p1) / (p2 - p1 + 1e-5), 0.0, 1.0);
    float rd = abs(s - sk);
    float inRung = step(lo, p) * step(p, hi);
    float zr = mix(z1, z2, along);
    vec3 rung = mix(ca, cb, step(0.5, along)) * exp(-rd * rd / 0.00012) * inRung * mix(0.25, 0.75, zr * 0.5 + 0.5);
    rung += vec3(1.0) * exp(-rd * rd / 0.00012) * exp(-pow((along - 0.5) / 0.03, 2.0)) * inRung * 0.3;
    // the two backbones' atoms, the near one over the far one
    vec3 b1 = bead(vec2(s - sk, p - p1), 0.034, ICE, z1 * 0.5 + 0.5);
    vec3 b2 = bead(vec2(s - sk, p - p2), 0.034, ICE * vec3(0.85, 0.95, 1.0), z2 * 0.5 + 0.5);
    // the one atom that leads in: strand one's atom at the middle, gold and glowing
    if (abs(k) < 0.5) {
      b1 = bead(vec2(s - sk, p - p1), 0.04, GOLD, 1.0);
      b1 += GOLD * exp(-length(vec2(s - sk, p - p1)) / 0.05) * (0.35 + 0.15 * sin(t * 2.0));
    }
    back += (z1 < z2 ? b1 : b2) + rung * step(zr, 0.0);
    front += (z1 < z2 ? b2 : b1) + rung * step(0.0, zr);
  }
  col += back * 0.8;
  col = col * (1.0 - clamp(length(front) * 1.5, 0.0, 0.85)) + front;

  col = col / (1.0 + max(col - 0.85, 0.0) * 0.85);
  gl_FragColor = vec4(col, 1.0);
}
`;

const CONFIG: OrbConfig = {
  fragment: FRAGMENT,
  framing: (width, height) => Math.min(width * 0.28, height * 0.55),
  close: 1.3,
  arriveFrom: 0.3,
  detail: { low: 0, medium: 1, high: 2 },
  // strand one's atom at the helix's middle (k = 0), where the shader draws it gold
  bodies: (t, yaw) => {
    const p1 = HELIX_R * Math.cos(t * SPIN + yaw);
    const z1 = Math.sin(t * SPIN + yaw);
    return [{ name: "atom", x: -AXIS.y * p1, y: AXIS.x * p1, z: z1 * 0.2 }];
  },
};

export default function DnaScene(props: SceneProps) {
  return <primitive object={useOrbScene(CONFIG, props)} />;
}
