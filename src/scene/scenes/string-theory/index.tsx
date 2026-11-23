/**
 * String Theory (D-163): our own illustration of string theory, an idea inside the Starbase:
 * reality made of tiny vibrating strings, in ten dimensions of spacetime. Three closed strings
 * float in the dark, each a soft, thick loop of glowing plasma vibrating in its own pattern (two,
 * three and five waves round it), so each shows in its own colour, as each pattern would be a
 * different particle; behind them, the extra dimensions are hinted as a fine, folded, softly
 * shimmering crumple of light filling space, too small to see clearly. One full-screen shader, one
 * draw call, no particles. Its own colour family: violet, teal and silver.
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

const vec3 VIOLET = vec3(0.6, 0.38, 1.0);
const vec3 TEAL = vec3(0.25, 0.9, 0.85);
const vec3 SILVER = vec3(0.85, 0.88, 0.95);

/* one closed string: centre, size, mode (waves round it), turn; returns its light */
vec3 loop(vec2 u, vec2 c, float R, float mode, float spin, vec3 tint, float t, float seed){
  vec2 d = u - c;
  // seen a little tilted, so it reads as a loop in space
  d.y /= 0.62;
  float a = atan(d.y, d.x);
  float wave = 0.16 * sin(mode * (a - spin)) * sin(t * (1.1 + mode * 0.2) + seed);
  float rr = R * (1.0 + wave);
  float dist = abs(length(d) - rr) * 0.75;
  vec2 ring = vec2(cos(a), sin(a));   // round the loop, with no seam where the angle wraps
  float flow = fbm3(vec3(ring * 1.6 + vec2(t * 0.6, 0.0), seed + t * 0.2));
  float w = R * (0.075 + 0.05 * flow);
  // brighter where it bends most: the antinodes of its wave
  float lit = 0.6 + 0.6 * abs(sin(mode * (a - spin)));
  float clump = fbm3(vec3(ring * 3.2 + vec2(0.0, -t * 0.9), seed + 2.0 + t * 0.3));
  return tint * (exp(-dist * dist / (w * w)) * lit * (0.25 + 1.1 * flow * clump) * 1.1 + exp(-dist / (R * 0.35)) * 0.14);
}

void main(){
  vec2 css = vec2(gl_FragCoord.x, uResolution.y - gl_FragCoord.y) / uDpr;
  vec2 q = css - uCentre;
  q.y = -q.y;
  vec2 u = q / uScale;     // the view's radii, y up
  float t = uTime;
  vec2 size = uResolution / uDpr;
  vec3 col = skyDeep(normalize(vec3((css - size * 0.5) / size.y * 1.3, -1.0)), 0.4) * 0.55;
  vec2 pan = vec2(uYaw, -uPitch) * 0.3;
  u += pan;

  // the extra dimensions: a fine, folded crumple of light everywhere, too small to make out
  float fold = fbm3(vec3(u * 5.0, t * 0.12));
  float crumple = 1.0 - abs(2.0 * fold - 1.0);              // bright where the fine noise folds over
  float shimmer = pow(crumple, 12.0) * smoothstep(0.4, 0.7, fbm3(vec3(u * 2.0, t * 0.08 + 3.0)));
  col += mix(VIOLET, TEAL, fbm3(vec3(u * 1.5, 2.0))) * shimmer * 0.22;

  // three strings, each vibrating in its own way
  col += loop(u, vec2(-0.05, 0.08), 0.55, 2.0, t * 0.2, VIOLET, t, 1.0);
  col += loop(u, vec2(0.95, 0.48), 0.24, 3.0, -t * 0.3, TEAL, t, 4.0);
  col += loop(u, vec2(-0.95, -0.52), 0.2, 5.0, t * 0.25, SILVER, t, 7.0);
  // a soft haze of their light
  col += VIOLET * 0.05 * exp(-length(u) * 1.2);

  col = col / (1.0 + max(col - 0.85, 0.0) * 0.85);
  gl_FragColor = vec4(col, 1.0);
}
`;

const CONFIG: OrbConfig = {
  fragment: FRAGMENT,
  framing: (width, height) => Math.min(width * 0.28, height * 0.42),
  close: 1.3,
  arriveFrom: 0.3,
  detail: { low: 0, medium: 1, high: 2 },
};

export default function StringTheoryScene(props: SceneProps) {
  return <primitive object={useOrbScene(CONFIG, props)} />;
}
