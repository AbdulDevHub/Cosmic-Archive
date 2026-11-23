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
    // a sphere: boiling granules, bright spots and dark lanes, darker and redder toward the limb
    float z = sqrt(1.0 - (r / SR) * (r / SR));
    vec2 sp = (v - sc) / SR;
    vec3 sph = vec3(sp, z);
    float gran = fbm3(sph * 9.0 + vec3(0.0, 0.0, t * 0.12));
    float cells = fbm3(sph * 26.0 + vec3(t * 0.05, 0.0, 4.0));
    float heat = clamp(0.35 + 0.9 * (gran - 0.5) + 0.5 * (cells - 0.5), 0.0, 1.0);
    vec3 surf = mix(vec3(0.85, 0.32, 0.06), mix(SUN, vec3(1.0, 0.97, 0.85), smoothstep(0.55, 0.9, heat)), smoothstep(0.1, 0.6, heat));
    float limb = pow(z, 0.55);
    star = surf * (0.25 + 0.95 * limb) + vec3(1.0, 0.96, 0.85) * pow(z, 4.0) * 0.25;
    star = mix(vec3(0.7, 0.22, 0.04) * 0.8, star, smoothstep(0.0, 0.35, z));    // the red rim
  }
  col = mix(col, star, smoothstep(SR, SR - 0.004, r));
  // the corona: soft streamers and a wide glow
  float ra = atan(v.y - sc.y, v.x - sc.x);
  float streamer = 0.6 + 0.8 * fbm3(vec3(ra * 3.0, r * 2.0 - t * 0.05, 7.0));
  col += vec3(1.0, 0.72, 0.35) * (exp(-max(r - SR, 0.0) / 0.035) * 0.45 + exp(-max(r - SR, 0.0) / 0.22) * 0.16 * streamer + exp(-max(r - SR, 0.0) / 0.8) * 0.05);

  // the star's wind, drawn off its near side in thin streams into the engine's mouth
  {
    float along = smoothstep(sc.x - SR + 0.02, -0.3, v.x) * smoothstep(-0.36, -0.26, v.x);
    float strands = fbm3(vec3(v.x * 6.0 + t * 1.2, v.y * 26.0, 2.0));
    float funnel = exp(-v.y * v.y / (0.02 + 0.08 * smoothstep(-0.3, sc.x - SR, v.x)));
    col += vec3(1.0, 0.7, 0.35) * along * funnel * smoothstep(0.45, 0.8, strands) * 0.35;
  }

  // the engine: a vast disc of machinery seen almost edge-on, to the left of the star. Its face
  // toward the star glows with the gathered wind; its back is dark, ringed with structure.
  vec2 ec = vec2(-0.35, 0.0);
  vec2 ed = (v - ec) * vec2(1.0 / 0.085, 1.0 / 0.42);
  float el = length(ed);
  float edge = smoothstep(1.0, 0.96, el);
  float rimN = sqrt(max(1.0 - el * el, 0.0));                 // as if a lens: thickest at its middle
  float rings = smoothstep(0.4, 0.47, abs(fract(abs(ed.y) * 7.0) - 0.5));
  float panels = fbm3(vec3(floor(ed.y * 28.0), floor(ed.x * 3.0), 3.0));
  vec3 engine = vec3(0.045, 0.045, 0.07) * (0.6 + 0.8 * panels) * (0.5 + 0.5 * rimN) + vec3(0.1, 0.1, 0.14) * rings * 0.4;
  // lit by the star on its right-hand face, with a hot rim where it bends away
  float lit = smoothstep(-0.2, 0.9, ed.x);
  engine += SUN * lit * (0.18 + 0.25 * panels) + vec3(1.0, 0.8, 0.5) * smoothstep(0.8, 1.0, el) * smoothstep(0.0, 0.6, ed.x) * 0.9;
  // its intake ring and nozzle glow, at its middle
  engine += vec3(1.0, 0.8, 0.5) * exp(-abs(ed.y) * 9.0) * lit * 0.7;
  engine += mix(WHITE, PLASMA, 0.4) * exp(-abs(ed.y) * 6.0) * smoothstep(0.3, -0.9, ed.x) * 0.55;
  // a thin rim of starlight all the way round
  engine += vec3(0.6, 0.55, 0.7) * smoothstep(0.88, 1.0, el) * 0.25;

  // its jets: a long thick one streaming left, and a short soft one back toward the star
  float jl = -(v.x - ec.x) - 0.05;                       // along the main jet
  float jw = 0.05 + 0.08 * smoothstep(0.0, 2.5, jl);
  float flow = fbm3(vec3(jl * 3.0 - t * 2.5, v.y * 12.0, 1.0));
  float main_ = exp(-v.y * v.y / (jw * jw)) * step(0.0, jl) * exp(-jl * 0.4) * (0.6 + 0.8 * flow);
  col += mix(WHITE, PLASMA, smoothstep(0.0, 1.2, jl)) * main_ * 1.2;
  float bl = (v.x - ec.x) - 0.06;                        // the jet back toward the star
  float back = exp(-v.y * v.y / 0.003) * smoothstep(0.0, 0.04, bl) * smoothstep(0.42, 0.12, bl) * (0.5 + 0.6 * flow);
  col += mix(PLASMA, WHITE, 0.4) * back * 0.6;

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
