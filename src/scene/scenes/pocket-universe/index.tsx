/**
 * The Pocket Universe (D-192): our own illustration of the inside of a baby universe, reached by
 * diving into the Pocket Dimensions bulb. Cut off from ours, it inflates: everything rushes outward
 * from a bright gold heart where it began, emerald and teal gas drawn into threads, young galaxies
 * in gold and white streaming past, the whole of it growing without end (layers of the same
 * pattern swelling and handing over to the next, so the expansion never stops). A drag looks round.
 * One full-screen shader, one draw call, no particles. Its own colour family: emerald, gold and deep
 * teal, its doorway's.
 */

import type { SceneBudget, SceneProps } from "../../host/types";
import { ORB_COMMON, useOrbScene, type OrbConfig } from "../shared/orb";

export const budget: SceneBudget = {
  drawCalls: 1,
  particles: { low: 0, medium: 0, high: 0 }, // no particles: the cost is per pixel
};

const FRAGMENT = /* glsl */ `
${ORB_COMMON}

const vec3 EMERALD = vec3(0.2, 0.95, 0.55);
const vec3 GOLD = vec3(1.0, 0.8, 0.4);
const vec3 TEAL = vec3(0.02, 0.18, 0.2);
const vec3 WHITE = vec3(1.0, 0.97, 0.88);

vec2 hash2(vec2 p){
  return fract(sin(vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)))) * 43758.5453);
}

void main(){
  vec2 css = vec2(gl_FragCoord.x, uResolution.y - gl_FragCoord.y) / uDpr;
  vec2 q = css - uCentre;
  q.y = -q.y;
  float t = uTime;
  vec2 u = q / uScale + vec2(-uYaw, uPitch) * 0.35;   // a drag looks round
  float r = length(u);

  // the dark of a young cosmos, deep teal near its heart
  vec3 col = TEAL * (0.15 + 0.6 * exp(-r * 1.2));
  vec2 out_ = r > 1e-4 ? u / r : vec2(1.0, 0.0);      // outward, the way everything rushes

  // four layers of the same cosmos, each swelling sixteen-fold, then handing over to the next
  for (int k = 0; k < 4; k++) {
    float fk = float(k);
    float ph = t * 0.035 + fk * 0.25;
    float z = fract(ph);
    float seed = floor(ph) * 7.31 + fk * 3.7;
    float size = exp2(z * 4.0);
    float w = smoothstep(0.0, 0.3, z) * smoothstep(1.0, 0.7, z);
    vec2 p = u / size * 4.0 + seed;

    // gas drawn into thin threads: sharp ridges of fractal noise, only where a cloud is
    vec2 wp = p + 0.6 * vec2(fbm3(vec3(p * 0.5, seed)), fbm3(vec3(p * 0.5 + 5.2, seed)));
    float n = fbm3(vec3(wp * 2.2, seed + 2.0));
    float ridge = pow(1.0 - abs(2.0 * n - 1.0), 9.0);
    float cloud = smoothstep(0.42, 0.78, fbm3(vec3(wp * 0.6, seed + 9.0)));
    col += mix(EMERALD, GOLD, smoothstep(0.55, 0.9, n)) * ridge * cloud * w * 1.1;
    col += EMERALD * 0.035 * cloud * w;

    // young galaxies: small tilted ovals, gold and white, each drawn out a little the way it flies
    vec2 g = p * 2.4;
    vec2 gi = floor(g);
    vec2 go = hash2(gi + seed);
    vec2 h = hash2(gi + seed + 4.0);
    vec2 d = fract(g) - (0.15 + 0.7 * go);
    float keep = step(0.55 - 0.3 * cloud, h.x);
    float dr = dot(d, out_), dt = dot(d, vec2(-out_.y, out_.x));
    float streak = 1.0 + 5.0 * z * smoothstep(0.1, 1.2, r);
    float s0 = 0.0009 * (0.5 + h.y);
    float spark = exp(-(dr * dr / (s0 * streak) + dt * dt / s0)) * keep;
    col += mix(GOLD, WHITE, go.y) * spark * w * (0.4 + 1.1 * h.y);
  }

  // the gold heart where it began, glowing through it all
  col += GOLD * (0.55 * exp(-r / 0.09) + 0.18 * exp(-r / 0.4));
  col += WHITE * 0.7 * exp(-r / 0.025);

  col = col / (1.0 + max(col - 0.85, 0.0) * 0.85);
  gl_FragColor = vec4(col, 1.0);
}
`;

const CONFIG: OrbConfig = {
  fragment: FRAGMENT,
  framing: (width, height) => Math.max(height, width * 0.62) * 0.5,
  close: 1.4,
  arriveFrom: 0.4,
  detail: { low: 0, medium: 1, high: 2 },
};

export default function PocketUniverseScene(props: SceneProps) {
  return <primitive object={useOrbScene(CONFIG, props)} />;
}
