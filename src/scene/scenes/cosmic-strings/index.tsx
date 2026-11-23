/**
 * Cosmic Strings (D-162): our own illustration of a cosmic string, an idea inside the Starbase: a
 * possible defect left from the universe's first moments. It is shown mostly by what it would do:
 * a long, slowly whipping thread of trapped energy crosses a field of galaxies, and the space round
 * it is cut so that galaxies just behind it show twice, once each side. The thread itself is a
 * soft, turbulent glow of gold plasma, thick and broken by the noise so it reads as gas, never a
 * drawn line; a small loop broken off it shivers nearby. One full-screen shader, one draw call, no
 * particles. Its own colour family: gold, white and deep blue.
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

const vec3 GOLD = vec3(1.0, 0.78, 0.38);
const vec3 DEEP = vec3(0.05, 0.08, 0.25);

/* where the string crosses height y: a slow, travelling whip */
float stringX(float y, float t){
  return 0.22 * sin(y * 1.3 + t * 0.35) + 0.1 * sin(y * 3.1 - t * 0.6) + 0.04 * sin(y * 7.0 + t * 1.1) + 0.15 * y;
}

/* galaxies: a sparse field of small, tilted, glowing smudges */
vec3 galaxies(vec2 p){
  vec3 g = vec3(0.0);
  for (int k = 0; k < 2; k++) {
    float s = k == 0 ? 3.2 : 7.0;
    vec2 c = p * s + float(k) * 17.0;
    vec2 id = floor(c);
    float pick = step(k == 0 ? 0.62 : 0.7, hash3(vec3(id, 2.0)));
    vec2 o = vec2(hash3(vec3(id, 3.0)), hash3(vec3(id, 4.0))) * 0.6 + 0.2;
    vec2 d = fract(c) - o;
    float a = hash3(vec3(id, 5.0)) * 3.14;
    d = vec2(cos(a) * d.x + sin(a) * d.y, -sin(a) * d.x + cos(a) * d.y);
    d.y *= 2.4;
    float l = length(d);
    vec3 tint = mix(vec3(1.0, 0.85, 0.65), vec3(0.6, 0.75, 1.0), hash3(vec3(id, 6.0)));
    g += tint * pick * (exp(-l * 22.0) * 0.9 + exp(-l * 7.0) * 0.18) / (1.0 + float(k));
  }
  return g;
}

void main(){
  vec2 css = vec2(gl_FragCoord.x, uResolution.y - gl_FragCoord.y) / uDpr;
  vec2 q = css - uCentre;
  q.y = -q.y;
  vec2 u = q / uScale;     // the view's radii, y up
  float t = uTime;
  vec2 size = uResolution / uDpr;
  vec2 pan = vec2(uYaw, -uPitch) * 0.4;

  // which side of the string, and how far: the space either side is shifted apart, so what lies
  // just behind it is seen twice (a deficit angle, drawn simply)
  float sx = stringX(u.y, t);
  float side = sign(u.x - sx);
  float dist = abs(u.x - sx);
  vec2 p = u + pan + vec2(side * 0.07 * exp(-dist * 0.4), 0.0);
  vec3 col = skyDeep(normalize(vec3(((css - size * 0.5) / size.y + pan * 0.2 + vec2(side * 0.012, 0.0)) * 1.3, -1.0)), 0.45) * 0.7;
  col += DEEP * 0.6;
  col += galaxies(p);

  // the string: a thick, uneven glow of gold plasma, broken and streaming
  float flow = fbm3(vec3(u.y * 3.0 - t * 0.9, dist * 4.0, 1.0));
  float fine = fbm3(vec3(u.y * 9.0 + t * 1.4, dist * 10.0, 4.0));
  float w = 0.035 + 0.03 * flow;
  float core = exp(-dist * dist / (w * w)) * (0.4 + 0.9 * flow * fine);
  float glow = exp(-dist / 0.22) * (0.25 + 0.3 * flow);
  // streamers of its radiation peel off sideways and fade
  float peel = smoothstep(0.55, 0.8, fbm3(vec3(u.y * 2.0 + t * 0.2, dist * 2.5 - t * 0.5, 9.0))) * exp(-dist / 0.3);
  col += mix(GOLD, vec3(1.0), 0.45) * core * 1.1 + GOLD * glow * 0.35 + GOLD * peel * 0.25;

  // a loop broken off it, shivering as it shrinks: a soft ring of gas, uneven all round
  vec2 lc = vec2(0.85, -0.35) + 0.03 * vec2(sin(t * 0.7), cos(t * 0.9));
  vec2 ld = u - lc;
  float la = atan(ld.y, ld.x);
  float lr = 0.2 + 0.03 * sin(la * 3.0 + t * 2.0) + 0.02 * sin(la * 5.0 - t * 2.6);
  float ldist = abs(length(ld) - lr);
  vec2 lring = vec2(cos(la), sin(la));   // round the loop, with no seam where the angle wraps
  float lflow = fbm3(vec3(lring * 2.0, 6.0 + t * 0.8));
  float lbreak = smoothstep(0.3, 0.7, fbm3(vec3(lring * 1.6, 13.0 + t * 0.5)));
  col += mix(GOLD, vec3(1.0), 0.3) * exp(-ldist * ldist / 0.003) * (0.15 + 0.7 * lflow) * lbreak * 0.8 + GOLD * exp(-ldist / 0.1) * 0.12;

  col = col / (1.0 + max(col - 0.85, 0.0) * 0.85);
  gl_FragColor = vec4(col, 1.0);
}
`;

const CONFIG: OrbConfig = {
  fragment: FRAGMENT,
  framing: (width, height) => Math.min(width * 0.3, height * 0.45),
  close: 1.3,
  arriveFrom: 0.3,
  detail: { low: 0, medium: 1, high: 2 },
};

export default function CosmicStringsScene(props: SceneProps) {
  return <primitive object={useOrbScene(CONFIG, props)} />;
}
