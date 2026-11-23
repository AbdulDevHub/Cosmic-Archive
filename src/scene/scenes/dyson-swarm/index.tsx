/**
 * Dyson Swarm (D-165): our own illustration of Dyson's own idea, a megastructure in A Quasar Galaxy:
 * not a solid shell but a swarm of collectors, each on its own orbit round a star. A hot amber star
 * at the middle, its light partly drunk; round it, tens of thousands of small panels on many tilted
 * orbits, dark where they stand against the star, catching its light as copper glints where they
 * turn toward us; the panels thin out with distance, and the star's glow leaks between them. One
 * full-screen shader, one draw call, no particles. Its own colour family: copper, amber and black.
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

const vec3 AMBER = vec3(1.0, 0.68, 0.3);
const vec3 COPPER = vec3(0.95, 0.55, 0.35);
const vec3 WHITE = vec3(1.0, 0.95, 0.85);

void main(){
  vec2 css = vec2(gl_FragCoord.x, uResolution.y - gl_FragCoord.y) / uDpr;
  vec2 q = css - uCentre;
  q.y = -q.y;
  vec2 u = q / uScale;     // the swarm's radii, y up
  float t = uTime;
  float r = length(u);
  vec2 size = uResolution / uDpr;
  vec3 col = skyDeep(normalize(vec3((css - size * 0.5) / size.y * 1.3, -1.0)), 0.4) * 0.6;

  // the star: small and fierce, its glow reaching out between the panels
  float star = exp(-r / 0.035) * 2.4 + exp(-r / 0.12) * 0.6 + exp(-r / 0.45) * 0.18;
  vec3 light = mix(AMBER, WHITE, exp(-r / 0.05)) * star;

  // the swarm: several bands of orbits, each tilted its own way; in each, panels sit in cells of
  // their own longitude, a few to a cell, drifting round at their own speeds
  float block = 0.0;
  vec3 glints = vec3(0.0);
  for (int k = 0; k < 6; k++) {
    if (k > 3 + uDetail) break;
    float fk = float(k);
    float tilt = 0.2 + 0.22 * fk;
    float turn = fk * 1.3 + uYaw;
    float c = cos(turn), s = sin(turn);
    vec2 v = vec2(c * u.x + s * u.y, -s * u.x + c * u.y);
    v.y /= cos(tilt) * 0.55 + 0.25;                       // the band's orbits, seen leaning
    float rr = length(v);
    float band = exp(-pow((rr - (0.32 + 0.11 * fk)) / (0.07 + 0.015 * fk), 2.0));
    float ang = atan(v.y, v.x);
    vec2 cell = vec2((ang + t * (0.05 - 0.006 * fk)) * (38.0 + 8.0 * fk), rr * 70.0);
    vec2 id = floor(cell);
    vec2 f = fract(cell) - 0.5;
    float h = hash3(vec3(id, fk));
    float panel = step(0.55, h) * smoothstep(0.32, 0.18, abs(f.x)) * smoothstep(0.42, 0.3, abs(f.y));
    float facing = pow(0.5 + 0.5 * sin(h * 40.0 + t * (0.4 + h)), 8.0);   // a panel turning toward us flashes
    block += panel * band;
    glints += mix(COPPER, WHITE, facing) * panel * band * (0.12 + 0.9 * facing) * smoothstep(0.0, 0.25, rr);
  }
  // panels in front of the star darken it; their faces glint copper
  col += light * exp(-block * 1.6);
  col += glints * 0.7;
  // a warm haze where the whole swarm stands, the light it scatters
  col += AMBER * 0.04 * smoothstep(1.2, 0.2, r);

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

export default function DysonSwarmScene(props: SceneProps) {
  return <primitive object={useOrbScene(CONFIG, props)} />;
}
