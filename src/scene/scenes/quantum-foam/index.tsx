/**
 * Quantum Foam (D-156): our own illustration of space-time at its tiniest scales, an idea inside
 * the Starbase: not smooth, but a froth of small regions that never sit still. Seen as if through
 * a lens that keeps zooming in, the dark grows a foam of soft aqua bubbles, each swelling, glowing
 * at its skin and popping in a flash of white while new ones bubble up between; finer foam shows
 * inside the larger, layer under layer, so there is no smallest piece. The middle, where the view
 * is sharpest, boils hardest; the edges fade back into the smooth dark sky we see at our scale.
 * One full-screen shader, one draw call, no particles. Its own colour family: aqua, white and
 * deep teal.
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

const vec3 AQUA = vec3(0.3, 0.95, 0.9);
const vec3 TEAL = vec3(0.03, 0.22, 0.26);
const vec3 WHITE = vec3(0.92, 1.0, 1.0);

vec2 hash2(vec2 p){ return vec2(hash3(vec3(p, 1.7)), hash3(vec3(p, 8.3))); }

/*
  One layer of foam: a cell pattern whose cells each live on their own clock, swelling from nothing
  and popping. Returns the light of their skins (x), their insides (y) and the pops (z).
*/
vec3 foam(vec2 p, float t, float seed){
  vec2 cell = floor(p);
  vec2 f = fract(p);
  float d1 = 9.0, d2 = 9.0;
  float life = 0.0, pop = 0.0;
  for (int j = -1; j <= 1; j++)
    for (int i = -1; i <= 1; i++) {
      vec2 g = vec2(float(i), float(j));
      vec2 id = cell + g;
      vec2 h = hash2(id + seed);
      // each bubble's own cycle: born, swelling, popped
      float period = 2.2 + 2.6 * h.y;
      float age = fract(t / period + h.x);
      vec2 o = 0.5 + 0.4 * sin(TAU * (h + 0.07 * t));
      float d = length(g + o - f);
      if (d < d1) {
        d2 = d1;
        d1 = d;
        life = age;
        pop = smoothstep(0.86, 0.93, age) * smoothstep(1.0, 0.93, age) * smoothstep(0.3, 0.0, d);
      } else if (d < d2) d2 = d;
    }
  float skin = exp(-(d2 - d1) * 6.0) * 0.8;        // where two bubbles press together
  // a bubble swells from nothing: its glow grows out from the middle over its life
  float inside = smoothstep(0.15 + 0.75 * smoothstep(0.0, 0.85, life), 0.0, d1) * (1.0 - life * 0.5);
  return vec3(skin * (1.0 - 0.8 * pop), inside, pop);
}

void main(){
  vec2 css = vec2(gl_FragCoord.x, uResolution.y - gl_FragCoord.y) / uDpr;
  vec2 q = css - uCentre;
  q.y = -q.y;
  vec2 u = q / uScale;     // the view's radii, y up
  float t = uTime;
  float r = length(u);
  vec2 size = uResolution / uDpr;
  vec3 col = skyDeep(normalize(vec3((css - size * 0.5) / size.y * 1.3, -1.0)), 0.4) * 0.6;

  // the lens: strongest in the middle, fading to our smooth sky at the edges
  float lens = smoothstep(1.3, 0.15, r);
  // the drag pans across the foam; it zooms in forever, a layer giving way to the next
  vec2 pan = vec2(uYaw, uPitch) * 0.8;
  float zoomT = t * 0.06;
  vec3 light = vec3(0.0);
  for (int k = 0; k < 3; k++) {
    if (k > uDetail) break;
    float layer = float(k) + fract(zoomT);
    float scale = 2.2 * pow(2.6, layer);
    float fade = smoothstep(0.0, 0.8, layer) * smoothstep(3.0, 1.9, layer);
    vec2 p = (u + pan) * scale + vec2(float(k) * 13.1, float(k) * 7.7);
    // the foam wobbles: space itself is not still at this scale
    p += 0.35 * vec2(noise3(vec3(p * 0.3, t * 0.4)), noise3(vec3(p * 0.3 + 9.0, t * 0.4))) - 0.17;
    vec3 f = foam(p, t * (1.0 + 0.3 * float(k)), floor(zoomT) * 3.1 + float(k) * 11.0);
    light += (AQUA * f.x * 0.42 + TEAL * f.y * 0.8 + WHITE * f.z * 1.1) * fade / (1.0 + 0.8 * float(k));
  }
  col = mix(col, col * 0.4 + light, lens);
  // a cool haze of the foam's light over the middle
  col += AQUA * 0.05 * lens;

  col = col / (1.0 + max(col - 0.85, 0.0) * 0.85);
  gl_FragColor = vec4(col, 1.0);
}
`;

const CONFIG: OrbConfig = {
  fragment: FRAGMENT,
  framing: (width, height) => Math.min(width * 0.32, height * 0.48),
  close: 1.4,
  arriveFrom: 0.3,
  detail: { low: 0, medium: 1, high: 2 },
};

export default function QuantumFoamScene(props: SceneProps) {
  return <primitive object={useOrbScene(CONFIG, props)} />;
}
