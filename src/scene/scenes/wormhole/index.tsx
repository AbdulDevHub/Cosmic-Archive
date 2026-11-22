/**
 * A wormhole (D-125): our own illustration of a hypothetical Einstein-Rosen bridge. A throat in
 * the middle of the sky shows another sky through it, a warmer one, drawn into the throat as if
 * seen down a tunnel; the light of the sky around it is bent into a bright ring of lensed light
 * on the rim, with a fainter second ring outside. One draw call, no particles. Mounted by the host
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

  // ---- the other sky, through the throat: compressed toward the middle, turning slowly ----
  if (r < 1.02) {
    float k = r / 1.02;
    // a tunnel: the far sky's angle grows with the radius, bunching its stars toward the rim
    float ang = pow(k, 0.62) * 2.3;
    float spin = t * 0.05 + uYaw * 0.8;
    vec2 d = k > 1e-4 ? u / (r) : vec2(0.0, 0.0);
    vec3 far = vec3(sin(ang) * d.x, sin(ang) * d.y, -cos(ang));
    far = turnY(spin) * turnX(0.4 - uPitch * 0.8) * far;
    vec3 other = skyDeep(far, 1.1);
    // another sky: its clouds turned to teal and amber, its stars left bright
    float lum = dot(other, vec3(0.3, 0.5, 0.2));
    vec3 hue = mix(TEAL * 0.9, GOLD, smoothstep(0.08, 0.5, other.r + other.b * 0.3));
    other = mix(other * vec3(0.4, 0.9, 0.85), hue * lum * 3.4, 0.75) + max(other - 0.4, 0.0) * 1.2;
    // a soft light far down the tunnel, in the middle
    other += mix(GOLD, WHITE, 0.4) * 0.22 * exp(-k * k * 14.0);
    other *= 0.55 + 0.45 * smoothstep(1.0, 0.45, k);
    col = mix(col, other, smoothstep(1.02, 0.985, r));
  }

  // ---- the rim: a bright ring of lensed light, with a thin fainter one outside it ----
  float swell = 0.8 + 0.2 * fbm3(vec3(atan(u.y, u.x) * 2.0, t * 0.15, 3.0));
  float ring = exp(-pow((r - 1.015) / 0.035, 2.0));
  float halo = exp(-max(r - 1.0, 0.0) * 4.0) * step(1.0, r);
  float second = exp(-pow((r - 1.26) / 0.025, 2.0)) * 0.4;
  float third = exp(-pow((r - 1.42) / 0.02, 2.0)) * 0.15;
  vec3 rimHue = mix(WHITE, GOLD, smoothstep(0.0, 0.6, 0.5 + 0.5 * sin(atan(u.y, u.x) - t * 0.1)));
  col += rimHue * ring * 2.4 * swell;
  col += mix(GOLD, EMBER, 0.5) * halo * 0.55 * swell;
  col += mix(AZURE, TEAL, 0.5) * (second + third) * swell;
  // a cool light on the inside of the rim, where the far sky pours through
  col += TEAL * 0.35 * exp(-pow((r - 0.92) / 0.08, 2.0)) * step(r, 1.0);
  // a wider warm glow
  col += EMBER * 0.12 / (1.0 + r * r * 0.7);

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
