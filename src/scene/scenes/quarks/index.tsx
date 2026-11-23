/**
 * Quarks (D-157): our own illustration of the inside of a proton, an idea inside the Starbase.
 * Three quarks, glowing in the three "colours" of the strong force, red, green and blue, circle
 * slowly; between them, thick, turbulent tubes of gluon light meet in the middle, where the three
 * colours mix to white, as they must (quarks only form colourless objects). Round them a sea of
 * tiny short-lived sparks flickers in and out, and the proton's own soft glow fades into the dark.
 * The colours are a name, not real colour, as physics uses them. One full-screen shader, one draw
 * call, no particles. Its own colour family: the three colour charges, red, green and blue, on plum.
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

const vec3 PLUM = vec3(0.22, 0.06, 0.2);

vec3 quarkColour(int i){
  if (i == 0) return vec3(1.0, 0.28, 0.22);
  if (i == 1) return vec3(0.3, 1.0, 0.4);
  return vec3(0.3, 0.5, 1.0);
}

/* distance from p to the segment a-b, and how far along it (0 to 1) */
vec2 segment(vec2 p, vec2 a, vec2 b){
  vec2 ab = b - a;
  float h = clamp(dot(p - a, ab) / dot(ab, ab), 0.0, 1.0);
  return vec2(length(p - a - ab * h), h);
}

void main(){
  vec2 css = vec2(gl_FragCoord.x, uResolution.y - gl_FragCoord.y) / uDpr;
  vec2 q = css - uCentre;
  q.y = -q.y;
  vec2 u = q / uScale;     // the proton's radii, y up
  float t = uTime;
  float r = length(u);
  vec2 size = uResolution / uDpr;
  vec3 col = skyDeep(normalize(vec3((css - size * 0.5) / size.y * 1.3, -1.0)), 0.4) * 0.55;

  // the proton: a soft plum glow, its edge never sharp
  float body = smoothstep(1.15, 0.2, r);
  col = mix(col, col * 0.5 + PLUM * 0.9, body * 0.85);
  col += PLUM * 0.6 * exp(-r * 1.6);

  // the junction where the three tubes meet wanders a little; the quarks circle round it
  vec2 j = 0.06 * vec2(sin(t * 0.37), cos(t * 0.29));
  float spin = t * 0.12 + uYaw;
  vec3 tubes = vec3(0.0);
  vec3 quarks = vec3(0.0);
  for (int i = 0; i < 3; i++) {
    float a = spin + float(i) * TAU / 3.0 + 0.25 * sin(t * 0.5 + float(i) * 2.0);
    float rad = 0.52 + 0.08 * sin(t * 0.43 + float(i) * 1.7) + uPitch * 0.1;
    vec2 qp = vec2(cos(a), sin(a)) * rad;
    vec3 c = quarkColour(i);
    // the gluon tube to the junction: thick, turbulent, its light flowing along it
    vec2 sg = segment(u, qp, j);
    float wob = fbm3(vec3(u * 6.0, t * 0.6 + float(i) * 3.0));
    float w = 0.085 + 0.05 * wob;
    float flow = 0.8 + 0.2 * sin(sg.y * 12.0 - t * 3.0 + wob * 4.0);
    float tube = exp(-sg.x * sg.x / (w * w)) * flow * (0.55 + 0.45 * wob);
    // its colour runs from the quark's own toward white at the junction, where the colours cancel
    tubes += mix(c, vec3(1.0), smoothstep(0.3, 1.0, sg.y) * 0.7) * tube * 1.15;
    tubes += c * exp(-sg.x / 0.2) * 0.08;
    // the quark: a small, hot core in its colour, with a halo
    float d = length(u - qp);
    float pulse = 0.85 + 0.15 * sin(t * 2.1 + float(i) * 2.4);
    quarks += (mix(c, vec3(1.0), 0.55) * exp(-d / 0.035) * 1.6 + c * exp(-d / 0.12) * 0.7 + c * exp(-d / 0.35) * 0.12) * pulse;
  }
  col += tubes + quarks;
  // the junction: all three colours together, a soft white
  float dj = length(u - j);
  col += vec3(1.0, 0.97, 0.95) * (exp(-dj / 0.05) * 0.7 + exp(-dj / 0.18) * 0.18);

  // the sea: tiny sparks that flicker in and out, each lasting a moment
  vec2 g = u * 22.0;
  vec2 id = floor(g);
  float h = hash3(vec3(id, 4.0));
  float life = fract(t * (0.6 + h) + h * 7.0);
  float spark = step(0.86, h) * smoothstep(0.0, 0.15, life) * smoothstep(0.6, 0.15, life);
  vec2 sp = fract(g) - 0.5 - 0.25 * (vec2(hash3(vec3(id, 5.0)), hash3(vec3(id, 6.0))) - 0.5);
  float tiny = exp(-length(sp) * 12.0) * spark * body;
  int which = int(mod(floor(h * 30.0), 3.0));
  col += mix(quarkColour(which), vec3(1.0), 0.4) * tiny * 0.8;

  col = col / (1.0 + max(col - 0.85, 0.0) * 0.85);
  gl_FragColor = vec4(col, 1.0);
}
`;

const CONFIG: OrbConfig = {
  fragment: FRAGMENT,
  framing: (width, height) => Math.min(width * 0.27, height * 0.4),
  close: 1.3,
  arriveFrom: 0.3,
  detail: { low: 0, medium: 1, high: 2 },
};

export default function QuarksScene(props: SceneProps) {
  return <primitive object={useOrbScene(CONFIG, props)} />;
}
