/**
 * A black hole merger (D-144): our own illustration of two black holes spiralling together. Two
 * shadows, one larger, circle each other ever faster and closer; the stars and clouds behind them
 * are bent round each one, and space itself ripples outward in a slow two-armed spiral that grows
 * as they close. They merge in a flash; one larger hole rings down and settles; then the scene
 * fades and the dance begins again. Nothing is drawn but the bent sky, the shadows and a faint
 * rose and silver glow. One draw call, no particles. Its own colour family: silver, rose and deep
 * indigo. Mounted by the host through the registry; never imported by a page.
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

const vec3 SILVER = vec3(0.78, 0.84, 1.0);
const vec3 ROSE = vec3(1.0, 0.45, 0.62);
const vec3 INDIGO = vec3(0.32, 0.3, 0.9);
const vec3 WHITE = vec3(1.0, 0.98, 0.96);

const float CYCLE = 28.0;        // seconds from one dance to the next
const float MERGE = 0.8;         // the share of the cycle spent spiralling in
const float SEP0 = 1.6;          // how far apart they start, in radii
const float TURNS = 42.0;        // radians of orbit, all told
const float M1 = 0.6, M2 = 0.4;  // their shares of the mass
const float TILT = 0.5;          // the orbit seen from above at a slant: its depth squashed this much

/* a hole's pull on the sky behind it, and its shadow */
vec2 bendBy(vec2 u, vec2 c, float rs){
  vec2 d = u - c;
  float l = max(length(d), 1e-3);
  return d / l * (1.3 * rs * rs / l);
}

void main(){
  vec2 css = vec2(gl_FragCoord.x, uResolution.y - gl_FragCoord.y) / uDpr;
  vec2 q = css - uCentre;
  q.y = -q.y;
  vec2 u = q / uScale;     // radii, y up
  float r = length(u);
  float t = uTime;
  vec2 size = uResolution / uDpr;

  // ---- where the dance is ----
  float f = fract((t + 4.8) / CYCLE);
  float tau = max(1.0 - f / MERGE, 0.0);              // 1 at the start, 0 at the merger
  float sep = SEP0 * pow(tau, 0.25);
  float phase = TURNS * (1.0 - pow(tau, 0.625)) + uYaw;
  bool merged = f >= MERGE;
  float after = merged ? (f - MERGE) * CYCLE : 0.0;   // seconds since the merger
  // they fade in at the start of a cycle and out at its end
  float seen = smoothstep(0.0, 0.05, f) * smoothstep(1.0, 0.93, f);

  float squash = TILT + 0.4 * clamp(uPitch, -1.0, 1.0);
  vec2 orbit = vec2(cos(phase), sin(phase) * squash);
  vec2 c1 = -orbit * sep * M2;
  vec2 c2 = orbit * sep * M1;
  float rs1 = 0.3, rs2 = 0.22, rsM = 0.38;

  // ---- space ripples: a two-armed spiral, its phase lagging with distance, growing as they close ----
  float a = atan(u.y, u.x / max(squash, 0.2));
  float amp = merged ? 0.05 * exp(-after * 0.5) : 0.022 / (sep * 0.6 + 0.15);
  float wavePhase = merged ? phase + after * 9.0 : phase;
  float wave = sin(2.0 * (a - wavePhase) + r * 5.5);
  float reach = exp(-max(r - 0.6, 0.0) * 0.35) * smoothstep(0.2, 0.9, r);
  vec2 dirn = r > 1e-4 ? u / r : vec2(0.0);
  vec2 shift = dirn * amp * wave * reach * seen;

  // ---- the sky, bent round each hole and rippled ----
  vec2 bend = merged ? bendBy(u, vec2(0.0), rsM) : bendBy(u, c1, rs1) + bendBy(u, c2, rs2);
  bend = bend * seen + shift;
  vec2 bent = css - vec2(bend.x, -bend.y) * uScale;
  vec2 v = (bent - size * 0.5) / size.y;
  vec3 col = skyDeep(normalize(vec3(v * 1.4, -1.0)), 0.8);
  // the crests catch a faint indigo light
  col += mix(INDIGO, SILVER, 0.35) * 0.24 * max(wave, 0.0) * reach * clamp(amp / 0.03, 0.0, 1.5) * seen;

  // ---- the merger's flash, behind the shadow ----
  float flash = merged ? exp(-after * 1.1) : 0.0;
  col += mix(WHITE, ROSE, 0.3) * flash * 1.1 * exp(-r * 1.4);
  col += SILVER * flash * 0.25;

  // ---- each hole: light piled up round its edge, a faint warm glow, and its shadow ----
  if (merged) {
    float d = length(u);
    float ring = exp(-pow((d - rsM * 1.5) / (rsM * 0.35), 2.0));
    col *= 1.0 + 1.2 * ring * seen;
    col += mix(ROSE, SILVER, 0.5) * 0.12 * rsM / max(d, rsM) * seen;
    // the merged hole shivers as it settles
    float shiver = 1.0 + 0.05 * exp(-after * 0.8) * sin(2.0 * a + after * 14.0);
    col *= mix(1.0, smoothstep(rsM * shiver * 0.97, rsM * shiver * 1.03, d), seen);
  } else {
    float d1 = length(u - c1), d2 = length(u - c2);
    col *= 1.0 + 1.1 * seen * (exp(-pow((d1 - rs1 * 1.5) / (rs1 * 0.35), 2.0)) + exp(-pow((d2 - rs2 * 1.5) / (rs2 * 0.35), 2.0)));
    col += ROSE * 0.1 * (rs1 / max(d1, rs1) + rs2 / max(d2, rs2)) * seen;
    col += SILVER * 0.05 * exp(-length(u) * 1.2) * (1.0 - tau) * seen;
    col *= mix(1.0, smoothstep(rs1 * 0.97, rs1 * 1.03, d1) * smoothstep(rs2 * 0.97, rs2 * 1.03, d2), seen);
  }

  col = col / (1.0 + max(col - 0.85, 0.0) * 0.9);
  gl_FragColor = vec4(col, 1.0);
}
`;

const CONFIG: OrbConfig = {
  fragment: FRAGMENT,
  framing: (width, height) => Math.min(height * 0.17, width * 0.115),
  close: 1.6,
  arriveFrom: 0.3,
  detail: { low: 0, medium: 1, high: 2 },
};

export default function BlackHoleMergerScene(props: SceneProps) {
  return <primitive object={useOrbScene(CONFIG, props)} />;
}
