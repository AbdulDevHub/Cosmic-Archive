/**
 * A wormhole (D-125, redrawn as a tunnel in D-138): our own illustration of a hypothetical
 * Einstein-Rosen bridge. Seen from its mouth the throat is a funnel: light streams down its walls
 * and twists toward a bright way out where another galaxy's sky shows. No drawn rings: only the
 * sky round the mouth, bent by its gravity, glows softly where it grazes. One draw call, no particles. Mounted by the host
 * through the registry; never imported by a page.
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

const vec3 GOLD = vec3(1.0, 0.76, 0.4);
const vec3 EMBER = vec3(1.0, 0.45, 0.18);
const vec3 TEAL = vec3(0.3, 0.9, 0.85);
const vec3 AZURE = vec3(0.35, 0.6, 1.0);
const vec3 WHITE = vec3(1.0, 0.97, 0.92);

void main(){
  vec2 css = vec2(gl_FragCoord.x, uResolution.y - gl_FragCoord.y) / uDpr;
  vec2 q = css - uCentre;
  q.y = -q.y;
  vec2 u = q / uScale;     // the throat's radii, y up
  float r = length(u);
  float t = uTime;
  vec2 size = uResolution / uDpr;

  // ---- the sky outside, bent: the throat pulls the light round it, strongest at the rim ----
  vec2 dirn = r > 1e-4 ? u / r : vec2(0.0);
  float pull = r > 1.0 ? 1.7 / (r * r) + 0.45 / (r * r * r * r) : 0.0;
  vec2 bent = css - vec2(dirn.x, -dirn.y) * uScale * pull * min(r - 0.85, 1.0);
  vec2 v = (bent - size * 0.5) / size.y;
  vec3 col = skyDeep(normalize(vec3(v * 1.4, -1.0)), 0.8);

  // ---- the tunnel (D-138): seen from its mouth, the throat is a funnel. Its walls recede toward a
  // bright way out at the far end, where the other galaxy's light shows; streaks of light stream
  // down the walls and twist as they go, so it reads as a passage, not a disc ----
  float a = atan(u.y, u.x);
  if (r < 1.02) {
    float k = r / 1.02;
    // depth down the tunnel: 1 at the mouth, ever deeper toward the middle (perspective)
    float depth = 1.0 / (k + 0.06) - 0.94;
    float steer = uYaw * 0.6;
    float twist = a + depth * 0.32 + t * 0.06 + steer;
    // the walls: light stretched along the tunnel, flowing inward
    vec3 sp = vec3(cos(twist) * 2.6, sin(twist) * 2.6, depth * 0.45 - t * 0.35);
    float streak = fbm3(sp);
    float fine = noise3(vec3(cos(twist) * 9.0, sin(twist) * 9.0, depth * 0.9 - t * 0.6));
    float wall = smoothstep(0.33, 0.8, streak) * (0.6 + 0.8 * fine);
    // the walls catch the far sky's colours: cool at the mouth, warming toward the way out
    float deep = smoothstep(0.0, 9.0, depth);
    vec3 wallHue = mix(mix(AZURE, TEAL, 0.5 + 0.5 * sin(twist * 2.0)), mix(GOLD, WHITE, 0.3), deep);
    vec3 inside = vec3(0.01, 0.02, 0.05) + wallHue * (wall * (0.7 + 1.3 * deep) * 1.3 + 0.08 * (1.0 - deep));
    // rings of the wall passing by, faint, so the eye reads depth
    inside *= 0.62 + 0.38 * smoothstep(-0.2, 1.0, sin(depth * 2.4 - t * 1.4));
    // the way out: the other galaxy's sky, warm and bright, at the far end
    vec2 d = k > 1e-4 ? u / r : vec2(0.0);
    vec3 far = normalize(vec3(d * k * 6.0, -1.0));
    far = turnY(t * 0.03 + steer) * turnX(0.4 - uPitch * 0.8) * far;
    vec3 other = skyDeep(far, 1.1);
    other = mix(other * vec3(1.0, 0.85, 0.65), GOLD * dot(other, vec3(0.3, 0.5, 0.2)) * 3.0, 0.5) + max(other - 0.4, 0.0);
    other += mix(GOLD, WHITE, 0.5) * 0.9 * exp(-k * k * 260.0);
    float exitMask = smoothstep(0.17, 0.08, k);
    inside = mix(inside, other * 1.3, exitMask);
    inside += mix(GOLD, WHITE, 0.4) * 0.5 * exp(-k * k * 40.0);       // its light down the tunnel
    // the mouth: the walls fall dark just inside the edge, where they turn away from the eye
    inside *= mix(0.55, 1.0, smoothstep(1.0, 0.85, k));
    col = mix(col, inside, smoothstep(1.02, 0.99, r));
  }

  // ---- round the mouth: no drawn rings, only the sky bent into a soft glow where it grazes the
  // throat, brighter on one side as it turns ----
  float side = 0.75 + 0.25 * sin(a - t * 0.1);
  float graze = exp(-pow((r - 1.02) / 0.06, 2.0)) + 0.35 * exp(-max(r - 1.0, 0.0) * 5.0) * step(1.0, r);
  col += mix(AZURE, WHITE, 0.55) * graze * 0.55 * side;
  col += EMBER * 0.06 / (1.0 + r * r * 0.7);

  col = col / (1.0 + max(col - 0.85, 0.0) * 0.9);
  gl_FragColor = vec4(col, 1.0);
}
`;

const CONFIG: OrbConfig = {
  fragment: FRAGMENT,
  framing: (width, height) => Math.min(height * 0.2, width * 0.13),
  // its throat (D-133): a hotspot that dives through it into the quasar galaxy
  bodies: () => [{ name: "throat", x: 0, y: 0, z: 0 }],
  diveScale: 10,
  close: 1.7,
  arriveFrom: 0.3,
  detail: { low: 0, medium: 1, high: 2 },
};

export default function WormholeScene(props: SceneProps) {
  return <primitive object={useOrbScene(CONFIG, props)} />;
}
