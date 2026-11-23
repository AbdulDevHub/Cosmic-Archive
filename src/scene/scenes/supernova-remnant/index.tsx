/**
 * A supernova remnant (D-142): our own illustration of the shell a star's explosion leaves. A
 * ragged sphere of hot gas seen from outside, so it is brightest at its rim, where we look along
 * the shell; through it, threads of crimson, amber and teal gas tangle on its near and far sides
 * and creep slowly outward. Inside, a cool cyan haze; at its heart, the tiny white point of what
 * the star left behind. One draw call, no particles. Its own colour family: crimson, amber, teal.
 * Mounted by the host through the registry; never imported by a page.
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

const vec3 WHITE = vec3(0.98, 0.96, 0.94);
const vec3 CRIMSON = vec3(1.0, 0.2, 0.2);
const vec3 AMBER = vec3(1.0, 0.62, 0.3);
const vec3 TEAL = vec3(0.22, 0.85, 0.86);
const vec3 CYAN = vec3(0.35, 0.7, 1.0);

/* ridged fractal noise, 0 to 1: thin bright threads where the noise crosses its middle */
float ridge(vec3 p){
  float sum = 0.0, weight = 0.5, total = 0.0;
  for (int i = 0; i < 5; i++) {
    if (i > uDetail + 2) break;
    float n = 1.0 - abs(2.0 * noise3(p) - 1.0);
    sum += weight * n * n;
    total += weight;
    p = p * 2.07 + vec3(3.1, 1.7, 5.3);
    weight *= 0.5;
  }
  return sum / total;
}

/* how far a sight line at radius rr runs through a shell from radius i to o, 1 where it grazes i */
float shellPath(float rr, float o, float i){
  return (sqrt(max(o * o - rr * rr, 0.0)) - sqrt(max(i * i - rr * rr, 0.0))) / sqrt(o * o - i * i);
}

/* the shell's gas at a point on it: thin threads, their colour, how bright */
vec3 gas(vec3 b, float t){
  vec3 outward = normalize(b);
  vec3 p = b * 3.1 - outward * t * 0.035;           // the threads creep outward
  float threads = pow(ridge(p), 3.2);
  float knots = fbm3(b * 1.7 + vec3(4.0, 0.0, 1.0));
  float oxygen = fbm3(b * 2.3 + vec3(0.0, 7.0, 2.0));
  vec3 tint = mix(CRIMSON, AMBER, smoothstep(0.4, 0.7, knots));
  tint = mix(tint, TEAL, smoothstep(0.55, 0.75, oxygen) * 0.8);
  return tint * (0.12 + 1.9 * threads) * (0.45 + 0.9 * knots);
}

void main(){
  vec2 css = vec2(gl_FragCoord.x, uResolution.y - gl_FragCoord.y) / uDpr;
  vec2 q = css - uCentre;
  q.y = -q.y;
  vec2 u = q / uScale;     // the shell's radii, y up
  float r = length(u);
  float t = uTime;
  vec2 size = uResolution / uDpr;
  mat3 view = turnX(0.2 - uPitch) * turnY(uYaw + t * 0.015);

  vec2 v = (css - size * 0.5) / size.y;
  vec3 col = skyDeep(normalize(vec3(v * 1.4, -1.0)), 0.75);

  // a ragged edge: the blast ran further in some directions than others
  float a = atan(u.y, u.x);
  // far outside, the edge no longer matters: skip its noise
  float rag = r < 1.5 ? fbm3(vec3(cos(a) * 1.6, sin(a) * 1.6, 0.4)) - 0.5 : 0.0;
  float R = 1.0 + 0.16 * rag;
  float rr = r / R;
  vec2 dir = r > 1e-4 ? u / r : vec2(0.0);

  const float TH = 0.24;                           // the shell's thickness, in radii
  float inR = 1.0 - TH;
  // its edges wander, so neither the inside nor the outside of the shell is a clean circle
  float wander = r < 1.4 ? fbm3(vec3(u * 3.5, 2.0)) - 0.5 : 0.0;
  float rw = rr * (1.0 + 0.07 * wander);
  // the path a sight line takes through the shell, averaged over a few nested shells so no
  // edge is crisp; about 1 where it grazes the inside
  float column = 0.0;
  for (int k = 0; k < 4; k++) {
    float o = 0.9 + 0.06 * float(k);
    column += shellPath(rw, o, o - TH) * 0.25;
  }
  float outer = sqrt(max(1.0 - rr * rr, 0.0));
  float inner = sqrt(max(inR * inR - rr * rr, 0.0));

  if (rr < 1.1) {
    float z = mix(inner, outer, 0.5);
    vec3 front = transpose(view) * vec3(dir * rr, z);
    vec3 back = transpose(view) * vec3(dir * rr, -z);
    vec3 shell = gas(front, t) + gas(back, t) * 0.55;
    col += shell * column * 0.75;
    // a faint glow of the hot shell itself
    col += mix(CRIMSON, AMBER, 0.4) * 0.05 * column;

    // inside: a cool haze, lit by what the star left behind
    vec3 c = transpose(view) * vec3(u / R, 0.0);
    float haze = fbm3(c * 2.6 + vec3(0.0, t * 0.02, 0.0));
    float inside = smoothstep(inR, inR * 0.4, rr);
    col += CYAN * 0.16 * inside * smoothstep(0.3, 0.8, haze) * (1.0 - rr * 0.6);
  }

  // the outer shock: a faint, broken blue-white glow just past the gas
  float shock = exp(-pow((rr - 1.03) / 0.035, 2.0));
  float patches = rr > 1.25 ? 0.0 : smoothstep(0.45, 0.75, fbm3(vec3(cos(a) * 5.0, sin(a) * 5.0, t * 0.02)));
  col += mix(CYAN, WHITE, 0.5) * shock * patches * 0.22;
  col += mix(CRIMSON, AMBER, 0.5) * 0.05 * exp(-max(rr - 1.0, 0.0) * 4.0) * step(1.0, rr);

  // the star's remains: a tiny white point with a soft cyan breath round it
  float d = length(q);
  float beat = 0.85 + 0.15 * sin(t * 2.4);
  col += WHITE * exp(-d * d / 5.0) * 1.3;
  col += CYAN * 0.22 * exp(-d / max(uScale * 0.05, 1.0)) * beat;

  col = col / (1.0 + max(col - 0.85, 0.0) * 0.9);
  gl_FragColor = vec4(col, 1.0);
}
`;

const CONFIG: OrbConfig = {
  fragment: FRAGMENT,
  framing: (width, height) => Math.min(height * 0.25, width * 0.17),
  close: 1.7,
  arriveFrom: 0.25,
  // D-143: the star's remains at the heart lead to the magnetar
  bodies: () => [{ name: "heart", x: 0, y: 0, z: 0 }],
  detail: { low: 0, medium: 1, high: 2 },
};

export default function SupernovaRemnantScene(props: SceneProps) {
  return <primitive object={useOrbScene(CONFIG, props)} />;
}
