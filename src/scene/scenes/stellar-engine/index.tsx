/**
 * Stellar Engine (D-171): our own illustration of a stellar engine, a megastructure in A Quasar
 * Galaxy: a giant jet engine beside a star that pushes the star along, like a tugboat with a barge.
 * A yellow star sits in the middle; beside it, a great dark disc of machinery, held off from the star
 * by its own push, gathers the star's wind and fires it back as a long, thick, violet-white jet of
 * plasma streaming off to the left, while a gentler jet pushes back against the star so the two
 * stay together. The whole pair moves slowly to the right. One full-screen shader, one draw call,
 * no particles. Its own colour family: sun yellow, plasma violet and white.
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

const vec3 SUN = vec3(1.0, 0.82, 0.35);
const vec3 PLASMA = vec3(0.62, 0.45, 1.0);
const vec3 WHITE = vec3(0.95, 0.95, 1.0);

void main(){
  vec2 css = vec2(gl_FragCoord.x, uResolution.y - gl_FragCoord.y) / uDpr;
  vec2 q = css - uCentre;
  q.y = -q.y;
  vec2 u = q / uScale;     // the star's radii, y up
  float t = uTime;
  vec2 size = uResolution / uDpr;
  // the sky drifts slowly left: the pair is moving right
  vec2 sv = (css - size * 0.5) / size.y + vec2(t * 0.003, 0.0);
  vec3 col = skyDeep(normalize(vec3(sv * 1.3, -1.0)), 0.5) * 0.7;

  float lean = uYaw * 0.3;
  vec2 v = vec2(cos(lean) * u.x + sin(lean) * u.y, -sin(lean) * u.x + cos(lean) * u.y);

  // the star, at the right of the middle
  vec2 sc = vec2(0.5, 0.0);
  float SR = 0.36;
  float r = length(v - sc);
  vec3 star = vec3(0.0);
  if (r < SR) {
    float z = sqrt(1.0 - (r / SR) * (r / SR));
    float gran = fbm3(vec3((v - sc) * 14.0, t * 0.15));
    star = mix(vec3(1.0, 0.5, 0.12), SUN, 0.5 + 0.5 * gran) * (0.55 + 0.75 * pow(z, 0.45)) + vec3(1.0, 0.95, 0.8) * pow(z, 3.0) * 0.35;
  }
  col = mix(col, star, smoothstep(SR, SR - 0.006, r));
  col += SUN * (exp(-max(r - SR, 0.0) / 0.05) * 0.3 + exp(-max(r - SR, 0.0) / 0.35) * 0.14);

  // the engine: a dark disc seen edge-on-ish, to the left of the star, its rim lit by the star
  vec2 ec = vec2(-0.35, 0.0);
  vec2 ed = (v - ec) * vec2(1.0 / 0.09, 1.0 / 0.42);
  float el = length(ed);
  float edge = smoothstep(1.0, 0.95, el);
  vec3 engine = vec3(0.05, 0.05, 0.08) + SUN * 0.5 * smoothstep(0.5, 1.0, ed.x) * edge;
  float panels = fbm3(vec3((v - ec) * vec2(30.0, 9.0), 3.0));
  engine += vec3(0.18, 0.17, 0.22) * panels * edge + PLASMA * 0.25 * exp(-abs(ed.y) * 3.0) * smoothstep(0.3, -0.6, ed.x) * edge;

  // its jets: a long thick one streaming left, and a short soft one back toward the star
  float jl = -(v.x - ec.x) - 0.05;                       // along the main jet
  float jw = 0.05 + 0.08 * smoothstep(0.0, 2.5, jl);
  float flow = fbm3(vec3(jl * 3.0 - t * 2.5, v.y * 12.0, 1.0));
  float main_ = exp(-v.y * v.y / (jw * jw)) * step(0.0, jl) * exp(-jl * 0.4) * (0.6 + 0.8 * flow);
  col += mix(WHITE, PLASMA, smoothstep(0.0, 1.2, jl)) * main_ * 1.2;
  float bl = (v.x - ec.x) - 0.06;                        // the jet back toward the star
  float back = exp(-v.y * v.y / 0.003) * smoothstep(0.0, 0.04, bl) * smoothstep(0.42, 0.12, bl) * (0.5 + 0.6 * flow);
  col += mix(PLASMA, WHITE, 0.4) * back * 0.6;
  // the star's wind, drawn into the engine from the star's near side

  col = mix(col, engine, edge);

  col = col / (1.0 + max(col - 0.85, 0.0) * 0.85);
  gl_FragColor = vec4(col, 1.0);
}
`;

const CONFIG: OrbConfig = {
  fragment: FRAGMENT,
  framing: (width, height) => Math.min(width * 0.36, height * 0.56),
  close: 1.3,
  arriveFrom: 0.3,
  detail: { low: 0, medium: 1, high: 2 },
};

export default function StellarEngineScene(props: SceneProps) {
  return <primitive object={useOrbScene(CONFIG, props)} />;
}
