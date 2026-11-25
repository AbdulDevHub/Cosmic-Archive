/**
 * Its Nucleus (D-190): our own illustration of the carbon atom's nucleus, the fourth step down from
 * the Starbase: six protons and six neutrons packed close (at the twelve corners of an icosahedron,
 * the tightest even packing of twelve round a middle), each jostling, the whole knot turning slowly
 * with the drag; between them a warm haze, the strong force that holds them together. Protons are
 * rose-red, neutrons slate blue. Whichever proton is nearest the front glows a little brighter: it
 * is a body (`quarks`), whose hotspot dives into Quarks. One full-screen shader, one draw call, no particles.
 * Its own colour family: rose-red, slate blue and a warm amber haze.
 */

import type { SceneBudget, SceneProps } from "../../host/types";
import { ORB_COMMON, useOrbScene, type OrbConfig } from "../shared/orb";

export const budget: SceneBudget = {
  drawCalls: 1,
  particles: { low: 0, medium: 0, high: 0 }, // no particles: the cost is per pixel
};

const PHI = (1 + Math.sqrt(5)) / 2;
/** The twelve corners of an icosahedron, unit length; even ones are protons, odd ones neutrons. */
const CORNERS: readonly (readonly [number, number, number])[] = [
  [0, 1, PHI], [0, -1, PHI], [0, 1, -PHI], [0, -1, -PHI],
  [1, PHI, 0], [-1, PHI, 0], [1, -PHI, 0], [-1, -PHI, 0],
  [PHI, 0, 1], [-PHI, 0, 1], [PHI, 0, -1], [-PHI, 0, -1],
].map(([x, y, z]) => {
  const l = Math.hypot(x, y, z);
  return [x / l, y / l, z / l] as const;
});
const SPREAD = 0.3;
const NUCLEON = 0.17;
const glslVec = (v: readonly number[]) => `vec3(${v.map((n) => n.toFixed(4)).join(", ")})`;

/** Where nucleon i is at time t, before the turn: its corner, jostled. */
function jostled(i: number, t: number): [number, number, number] {
  const [x, y, z] = CORNERS[i];
  return [x * SPREAD + 0.025 * Math.sin(t * 1.3 + i * 2.1), y * SPREAD + 0.025 * Math.sin(t * 1.1 + i * 3.7), z * SPREAD + 0.025 * Math.sin(t * 1.7 + i * 1.3)];
}

/** The same turn as the shader's turnX(b) * turnY(a). */
function turn([x, y, z]: [number, number, number], a: number, b: number): [number, number, number] {
  const ca = Math.cos(a), sa = Math.sin(a);
  const x1 = ca * x + sa * z;
  const z1 = -sa * x + ca * z;
  const cb = Math.cos(b), sb = Math.sin(b);
  return [x1, cb * y - sb * z1, sb * y + cb * z1];
}
const turnA = (t: number, yaw: number) => t * 0.12 + yaw;
const turnB = (pitch: number) => 0.35 + pitch * 0.6;

const FRAGMENT = /* glsl */ `
${ORB_COMMON}

const vec3 PROTON = vec3(1.0, 0.36, 0.38);
const vec3 NEUTRON = vec3(0.5, 0.6, 0.78);
const vec3 HAZE = vec3(1.0, 0.7, 0.4);
const float SPREAD = ${SPREAD.toFixed(3)};
const float RAD = ${NUCLEON.toFixed(3)};

vec3 corner(int i){
  ${CORNERS.map((c, i) => `if (i == ${i}) return ${glslVec(c)};`).join("\n  ")}
  return vec3(0.0);
}

vec3 nucleonAt(int i, float t){
  vec3 c = corner(i);
  float f = float(i);
  vec3 p = c * SPREAD + 0.025 * vec3(sin(t * 1.3 + f * 2.1), sin(t * 1.1 + f * 3.7), sin(t * 1.7 + f * 1.3));
  return turnX(0.35 + uPitch * 0.6) * turnY(t * 0.12 + uYaw) * p;
}

void main(){
  vec2 css = vec2(gl_FragCoord.x, uResolution.y - gl_FragCoord.y) / uDpr;
  vec2 q = css - uCentre;
  q.y = -q.y;
  vec2 u = q / uScale;     // y up
  float t = uTime;
  vec2 size = uResolution / uDpr;
  vec2 sc = (css - size * 0.5) / size.y;
  vec3 col = mix(vec3(0.012, 0.006, 0.01), vec3(0.04, 0.015, 0.02), fbm3(vec3(sc * 1.6, t * 0.02)));

  // the proton nearest the front: it leads in to Quarks (as the bodies below)
  int lead = 0;
  float leadZ = -10.0;
  for (int i = 0; i < 12; i += 2) {
    float z = nucleonAt(i, t).z;
    if (z > leadZ) { leadZ = z; lead = i; }
  }

  // the nearest nucleon this pixel sees, and the strong force's haze round them all
  int hit = -1;
  float best = -10.0;
  vec3 hc = vec3(0.0);
  float haze = 0.0;
  for (int i = 0; i < 12; i++) {
    vec3 c = nucleonAt(i, t);
    vec2 d = u - c.xy;
    float d2 = dot(d, d);
    haze += exp(-sqrt(d2) / 0.16);
    if (d2 < RAD * RAD) {
      float z = c.z + sqrt(RAD * RAD - d2);
      if (z > best) { best = z; hit = i; hc = c; }
    }
  }
  float flick = 0.8 + 0.2 * noise3(vec3(u * 9.0, t * 1.5));
  col += HAZE * haze * 0.045 * flick;

  if (hit >= 0) {
    vec2 d = u - hc.xy;
    vec3 n = normalize(vec3(d, sqrt(max(RAD * RAD - dot(d, d), 0.0))));
    float lit = 0.3 + 0.7 * max(dot(n, normalize(vec3(-0.45, 0.55, 0.7))), 0.0);
    bool proton = hit == 0 || hit == 2 || hit == 4 || hit == 6 || hit == 8 || hit == 10;
    vec3 tone = proton ? PROTON : NEUTRON;
    // a grain over each, the restless quarks and gluons inside
    float grain = 0.9 + 0.12 * noise3(n * 16.0 + vec3(float(hit), 0.0, t * 0.8)) + 0.08 * noise3(n * 40.0 + vec3(0.0, float(hit), t * 1.6));
    vec3 ball = tone * lit * grain;
    ball += mix(tone, vec3(1.0), 0.4) * pow(max(dot(reflect(-normalize(vec3(-0.45, 0.55, 0.7)), n), vec3(0.0, 0.0, 1.0)), 0.0), 18.0) * 0.35; // a sheen
    ball += mix(tone, HAZE, 0.5) * pow(1.0 - n.z, 2.0) * 0.55;      // a warm rim, lit by the force round it
    ball *= mix(0.55, 1.0, smoothstep(-SPREAD - RAD, SPREAD + RAD, hc.z)); // the far ones dimmer
    if (hit == lead) ball += PROTON * (0.18 + 0.1 * sin(t * 2.0));  // the proton that leads in
    float edge = smoothstep(0.0, 1.5 / uScale, RAD - length(d));
    col = mix(col, ball, edge);
  }

  col = col / (1.0 + max(col - 0.85, 0.0) * 0.85);
  gl_FragColor = vec4(col, 1.0);
}
`;

const CONFIG: OrbConfig = {
  fragment: FRAGMENT,
  framing: (width, height) => Math.min(width * 0.36, height * 0.62),
  close: 1.3,
  arriveFrom: 0.3,
  detail: { low: 0, medium: 1, high: 2 },
  // the proton nearest the front, jostled and turned as the shader moves it (so it is never hidden)
  bodies: (t, yaw, pitch) => {
    let best: [number, number, number] = [0, 0, -10];
    for (let i = 0; i < 12; i += 2) {
      const p = turn(jostled(i, t), turnA(t, yaw), turnB(pitch));
      if (p[2] > best[2]) best = p;
    }
    return [{ name: "quarks", x: best[0], y: best[1], z: best[2] }];
  },
};

export default function CarbonNucleusScene(props: SceneProps) {
  return <primitive object={useOrbScene(CONFIG, props)} />;
}
