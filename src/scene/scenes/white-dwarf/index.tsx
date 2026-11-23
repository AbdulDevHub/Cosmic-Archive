/**
 * A white dwarf (D-150): our own illustration of all that is left of a star like the Sun: its core,
 * about the size of a planet, still white-hot and slowly cooling. A small, dense, blue-white ball,
 * smooth but for faint mottling, its glow bleeding into the dark; round it, the last aqua and
 * violet wisps of the planetary nebula it threw off, thinning away. The stars behind it are bent a
 * little by its gravity. One draw call, no particles. Its own colour family: blue-white, aqua and
 * violet. Mounted by the host through the registry; never imported by a page.
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

const vec3 WHITE = vec3(0.95, 0.97, 1.0);
const vec3 ICE = vec3(0.62, 0.78, 1.0);
const vec3 AQUA = vec3(0.3, 0.85, 0.85);
const vec3 VIOLET = vec3(0.5, 0.34, 1.0);

void main(){
  vec2 css = vec2(gl_FragCoord.x, uResolution.y - gl_FragCoord.y) / uDpr;
  vec2 q = css - uCentre;
  q.y = -q.y;
  vec2 u = q / uScale;     // the dwarf's radii, y up
  float r = length(u);
  float t = uTime;
  vec2 size = uResolution / uDpr;
  mat3 view = turnX(0.2 - uPitch) * turnY(uYaw + t * 0.03);

  // ---- the sky, bent a little round it ----
  vec2 dirn = r > 1e-4 ? u / r : vec2(0.0);
  float pull = r > 1.0 ? 0.35 / (r * r) : 0.0;
  vec2 bent = css - vec2(dirn.x, -dirn.y) * uScale * pull;
  vec2 v = (bent - size * 0.5) / size.y;
  vec3 col = skyDeep(normalize(vec3(v * 1.4, -1.0)), 0.6);

  // ---- the last wisps of the nebula it threw off ----
  float far = r / 9.0;
  float wisps = fbm3(vec3(u * 0.35, 2.0 + t * 0.004));
  float streaks = fbm3(vec3(dirn * 4.0, far * 3.0 - t * 0.005));
  float shell = smoothstep(0.25, 0.7, far) * (1.0 - smoothstep(0.8, 1.6, far));
  col += mix(VIOLET, AQUA, wisps) * shell * (0.12 + 0.6 * wisps * streaks);

  // ---- its glow ----
  col += ICE * (0.55 * exp(-max(r - 1.0, 0.0) * 1.6) + 0.12 * exp(-max(r - 1.0, 0.0) * 0.25));

  // ---- the dwarf ----
  if (r < 1.0) {
    vec3 n = vec3(u, sqrt(1.0 - r * r));
    vec3 b = transpose(view) * n;
    float mu = n.z;
    float mottle = fbm3(b * 4.0 + vec3(0.0, t * 0.02, 0.0));
    vec3 surface = mix(ICE, WHITE, 0.6 + 0.15 * (mottle - 0.5)) * (0.6 + 0.45 * pow(mu, 0.5));
    col = mix(col, surface * 1.2, smoothstep(1.0, 0.98, r));
  }

  col = col / (1.0 + max(col - 0.85, 0.0) * 0.9);
  gl_FragColor = vec4(col, 1.0);
}
`;

const CONFIG: OrbConfig = {
  fragment: FRAGMENT,
  framing: (width, height) => Math.min(height * 0.045, width * 0.03),
  close: 2.0,
  arriveFrom: 0.3,
  detail: { low: 0, medium: 1, high: 2 },
};

export default function WhiteDwarfScene(props: SceneProps) {
  return <primitive object={useOrbScene(CONFIG, props)} />;
}
