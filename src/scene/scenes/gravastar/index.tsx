/**
 * A gravastar (D-126): our own illustration of a hypothetical object, a bubble of vacuum held
 * inside a thin, shining shell of matter, standing where a black hole's horizon would be. The
 * shell is a fine, churning skin of hot white and violet light, brightest where we look along it;
 * through it we see the bubble's dark inside, faint wisps drifting outward; the sky round it is
 * bent, as a black hole's would be. One draw call, no particles. Mounted by the host through the
 * registry; never imported by a page.
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

const vec3 WHITE = vec3(0.97, 0.96, 1.0);
const vec3 VIOLET = vec3(0.55, 0.32, 1.0);
const vec3 AZURE = vec3(0.3, 0.55, 1.0);
const vec3 ROSE = vec3(1.0, 0.36, 0.66);
const vec3 GOLD = vec3(1.0, 0.76, 0.42);

void main(){
  vec2 css = vec2(gl_FragCoord.x, uResolution.y - gl_FragCoord.y) / uDpr;
  vec2 q = css - uCentre;
  q.y = -q.y;
  vec2 u = q / uScale;     // the shell's radii, y up
  float r = length(u);
  float t = uTime;
  vec2 size = uResolution / uDpr;
  mat3 view = turnX(0.25 - uPitch) * turnY(uYaw + t * 0.04);

  // ---- the sky, bent round it like a black hole's ----
  vec2 dirn = r > 1e-4 ? u / r : vec2(0.0);
  float pull = r > 1.0 ? 1.3 / (r * r) : 0.0;
  vec2 bent = css - vec2(dirn.x, -dirn.y) * uScale * pull;
  vec2 v = (bent - size * 0.5) / size.y;
  vec3 col = skyDeep(normalize(vec3(v * 1.4, -1.0)), 0.75);

  if (r < 1.0) {
    vec3 n = vec3(u, sqrt(1.0 - r * r));
    vec3 b = transpose(view) * n;
    float mu = n.z;                      // 1 in the middle, 0 at the limb

    // the inside: a bubble of near-nothing; dark violet wisps drift outward, never settling
    float drift = t * 0.06;
    float wisps = fbm3(b * 2.4 * (1.0 + 0.0) - b * drift * 2.0);
    float fine = fbm3(b * 6.0 + vec3(0.0, drift, 0.0));
    vec3 inside = mix(vec3(0.004, 0.004, 0.02), VIOLET * 0.16, smoothstep(0.45, 0.8, wisps) * 0.7);
    inside += AZURE * 0.05 * smoothstep(0.6, 0.9, fine);
    // a faint glow far in, as through a deep well
    inside += VIOLET * 0.06 * exp(-pow(r / 0.5, 2.0));

    // the shell: a thin skin lying over the whole ball; seen edge-on at the limb it is thick
    float thick = pow(1.0 - mu, 2.2);
    float churn = fbm3(b * 9.0 + vec3(t * 0.12, -t * 0.08, 0.0));
    float cells = fbm3(b * 4.0 - vec3(0.0, t * 0.05, 0.0));
    vec3 skin = mix(VIOLET, WHITE, smoothstep(0.35, 0.8, churn));
    skin = mix(skin, ROSE, smoothstep(0.55, 0.9, cells) * 0.4);
    float shellAmt = 0.025 + 1.1 * thick + 0.07 * smoothstep(0.6, 0.95, churn);
    vec3 shell = skin * shellAmt * (0.6 + 0.6 * churn);
    shell += WHITE * pow(thick, 4.0) * 1.8;

    vec3 body = inside + shell;
    col = mix(col, body, smoothstep(1.0, 0.99, r));
  }

  // ---- the shell's bright edge, and the light it throws ----
  float a = atan(u.y, u.x);
  float flare = 0.75 + 0.5 * fbm3(vec3(cos(a) * 3.0, sin(a) * 3.0, t * 0.3));
  float edge = exp(-pow((r - 1.0) / 0.028, 2.0));
  col += mix(WHITE, VIOLET, 0.25) * edge * 1.5 * flare;
  float halo = exp(-max(r - 1.0, 0.0) * 3.5) * step(1.0, r);
  col += mix(VIOLET, AZURE, 0.4) * halo * 0.5 * flare;
  col += GOLD * 0.14 * exp(-max(r - 1.0, 0.0) * 9.0) * step(1.0, r);   // a thin gold line of heated matter
  col += VIOLET * 0.1 / (1.0 + r * r * 0.6);

  col = col / (1.0 + max(col - 0.85, 0.0) * 0.9);
  gl_FragColor = vec4(col, 1.0);
}
`;

const CONFIG: OrbConfig = {
  fragment: FRAGMENT,
  framing: (width, height) => Math.min(height * 0.2, width * 0.13),
  close: 1.7,
  arriveFrom: 0.3,
  detail: { low: 0, medium: 1, high: 2 },
};

export default function GravastarScene(props: SceneProps) {
  return <primitive object={useOrbScene(CONFIG, props)} />;
}
