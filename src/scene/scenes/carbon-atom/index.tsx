/**
 * A Carbon Atom (D-190): our own illustration of one atom of the DNA's backbone, the third step down
 * from the Starbase. No orbits: its electrons are clouds of probability, glowing where an electron
 * is likely to be, shimmering. A tiny, bright nucleus at the middle; round it the small, round 1s
 * cloud; a larger round 2s cloud with a dark gap (its node) inside it; and carbon's two occupied 2p
 * orbitals, each a pair of lobes either side of the nucleus, the two lobes in two colours (their
 * opposite phases), turning slowly with the drag. The nucleus is a body (`nucleus`), whose hotspot
 * dives into Its Nucleus. One full-screen shader, one draw call, no particles. Its own colour
 * family: gold-white, azure, violet and teal.
 */

import type { SceneBudget, SceneProps } from "../../host/types";
import { ORB_COMMON, useOrbScene, type OrbConfig } from "../shared/orb";

export const budget: SceneBudget = {
  drawCalls: 1,
  particles: { low: 0, medium: 0, high: 0 }, // no particles: the cost is per pixel
};

const FRAGMENT = /* glsl */ `
${ORB_COMMON}

const vec3 CORE = vec3(1.0, 0.9, 0.7);
const vec3 AZURE = vec3(0.35, 0.6, 1.0);
const vec3 VIOLET = vec3(0.62, 0.4, 1.0);
const vec3 TEAL = vec3(0.3, 0.95, 0.85);

/* a 2p orbital seen from here: its two lobes along axis a (in view space), as a projected density,
   and which lobe (its phase) the point is in */
float pLobe(vec2 u, vec3 a, out float side){
  vec2 a2 = a.xy;
  float along = dot(u, a2);
  side = sign(along);
  float r = length(u);
  // when the axis faces us the lobes overlap into a soft ring; side on, they part into two
  float face = dot(a2, a2);
  float d = (along * along + (1.0 - face) * 0.3 * r * r) * exp(-r / 0.075);
  return d / 0.0016;
}

void main(){
  vec2 css = vec2(gl_FragCoord.x, uResolution.y - gl_FragCoord.y) / uDpr;
  vec2 q = css - uCentre;
  q.y = -q.y;
  vec2 u = q / uScale;     // y up
  float t = uTime;
  vec2 size = uResolution / uDpr;
  vec2 sc = (css - size * 0.5) / size.y;

  // the near-empty dark, with other atoms far off, out of focus
  vec3 col = mix(vec3(0.008, 0.006, 0.02), vec3(0.02, 0.015, 0.05), fbm3(vec3(sc * 1.4, t * 0.015)));
  vec2 bg = sc * 3.0;
  vec2 bid = floor(bg);
  vec2 bp = fract(bg) - 0.5 - 0.3 * (vec2(hash3(vec3(bid, 1.0)), hash3(vec3(bid, 2.0))) - 0.5);
  col += mix(AZURE, VIOLET, hash3(vec3(bid, 3.0))) * step(0.6, hash3(vec3(bid, 4.0))) * exp(-length(bp) / 0.08) * 0.05;

  float r = length(u);
  // the electrons' shimmer: where one might be found, not where it is
  float grain = 0.75 + 0.25 * noise3(vec3(u * 70.0, t * 0.9)) + 0.25 * noise3(vec3(u * 190.0, t * 1.7 + 3.0));
  float slow = 0.85 + 0.15 * sin(t * 0.7);

  // 1s: small and round, close in
  float s1 = exp(-r / 0.035);
  // 2s: round and wider, with its node, a dark gap, inside
  float x = r / 0.07;
  float s2 = pow(2.0 - x, 2.0) * exp(-x) / 4.0;
  // carbon's two occupied 2p orbitals, turning with the drag
  mat3 m = turnX(0.5 + uPitch * 0.6) * turnY(t * 0.07 + uYaw);
  float sideA, sideB;
  float pa = pLobe(u, m * vec3(1.0, 0.0, 0.0), sideA);
  float pb = pLobe(u, m * vec3(0.0, 1.0, 0.0), sideB);

  vec3 cloud = CORE * s1 * 0.9;
  cloud += AZURE * s2 * 0.4;
  cloud += mix(VIOLET, TEAL, step(0.0, sideA)) * pa * 0.42;
  cloud += mix(vec3(1.0, 0.5, 0.7), AZURE, step(0.0, sideB)) * pb * 0.42;
  col += cloud * grain * slow;

  // the nucleus: tiny, hot, far smaller than the clouds round it
  col += CORE * exp(-r / 0.006) * 1.8 + CORE * exp(-r / 0.02) * 0.25;

  col = col / (1.0 + max(col - 0.85, 0.0) * 0.85);
  gl_FragColor = vec4(col, 1.0);
}
`;

const CONFIG: OrbConfig = {
  fragment: FRAGMENT,
  framing: (width, height) => Math.min(width * 0.3, height * 0.46),
  close: 1.3,
  arriveFrom: 0.3,
  detail: { low: 0, medium: 1, high: 2 },
  bodies: () => [{ name: "nucleus", x: 0, y: 0, z: 0.2 }],
};

export default function CarbonAtomScene(props: SceneProps) {
  return <primitive object={useOrbScene(CONFIG, props)} />;
}
