/**
 * A quasi-star (D-127): our own illustration of a hypothetical star of the early universe, a
 * vast, swollen envelope of gas held up by the light of a black hole feeding at its heart. Huge
 * red and orange cells churn across its face; between them, deep cracks show the white-gold heat
 * pouring up from the middle, brightest toward the centre where the hole lies hidden; its ragged
 * edge smokes off into a wide, dark-red haze. One draw call, no particles. Mounted by the host
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
${SKY_CHUNK}

const vec3 DEEP = vec3(0.32, 0.04, 0.03);
const vec3 RED = vec3(0.78, 0.13, 0.05);
const vec3 ORANGE = vec3(1.0, 0.42, 0.1);
const vec3 GOLD = vec3(1.0, 0.75, 0.38);
const vec3 WHITE = vec3(1.0, 0.95, 0.85);

vec3 sky(vec2 css){
  vec2 size = uResolution / uDpr;
  vec2 v = (css - size * 0.5) / size.y;
  return skyDeep(normalize(vec3(v * 1.4, -1.0)), 0.7);
}

void main(){
  vec2 css = vec2(gl_FragCoord.x, uResolution.y - gl_FragCoord.y) / uDpr;
  vec2 q = css - uCentre;
  q.y = -q.y;
  vec2 u = q / uScale;     // the envelope's radii, y up
  float r = length(u);
  float t = uTime;
  mat3 view = turnX(0.2 - uPitch) * turnY(uYaw + t * 0.012);

  vec3 col = sky(css);

  // its edge is ragged: the envelope is loosely bound, puffing in and out
  float a = atan(u.y, u.x);
  float ragged = 1.0 + 0.035 * (fbm3(vec3(cos(a) * 3.0, sin(a) * 3.0, t * 0.08)) - 0.5) * 2.0;
  float R = ragged;

  if (r < R) {
    float rr = r / R;
    vec3 n = vec3(u / R, sqrt(1.0 - rr * rr));
    vec3 b = transpose(view) * n;
    float mu = n.z;

    // vast convection cells, churning slowly; a second, finer layer rolling over them
    vec3 flow = vec3(fbm3(b * 1.6 + t * 0.02), fbm3(b * 1.6 + 7.0 - t * 0.02), fbm3(b * 1.6 + 13.0)) - 0.5;
    float cells = fbm3(b * 2.6 + flow * 1.8);
    float fine = fbm3(b * 8.0 + flow * 3.0 + vec3(0.0, t * 0.05, 0.0));
    // cracks: thin bright seams where the cells part and the heat below shows through
    float seam = 1.0 - smoothstep(0.0, 0.05, abs(cells - 0.45));
    float crack = seam * smoothstep(0.35, 0.7, fine);
    float depth = pow(mu, 0.8);
    vec3 surf = mix(DEEP, RED, smoothstep(0.3, 0.65, cells));
    surf = mix(surf, ORANGE, smoothstep(0.6, 0.9, cells + fine * 0.2) * 0.55);
    // the light breaking through: white-gold toward the heart, orange near the edge
    vec3 heat = mix(ORANGE, mix(GOLD, WHITE, smoothstep(0.7, 1.0, depth)), depth);
    surf += heat * crack * (0.5 + 1.6 * depth);
    // the heart: the hole's light pressing up through the middle, a broad glow
    surf += mix(ORANGE, GOLD, depth) * 0.6 * pow(depth, 5.0);
    // limb darkening toward a deep red edge that glows rather than goes black
    surf *= 0.45 + 0.65 * pow(mu, 0.5);
    surf = mix(RED * 0.7, surf, smoothstep(0.0, 0.25, mu));
    col = mix(col, surf, smoothstep(R + 0.004, R - 0.025, r));
  }

  // ---- its haze: the envelope smoking off into space ----
  float out_ = max(r - R, 0.0);
  float smoke = fbm3(vec3(u * 2.2, t * 0.04));
  col += mix(RED, ORANGE, 0.35) * exp(-out_ * 5.0) * smoothstep(R - 0.035, R, r) * (0.55 + 0.6 * smoke);
  col += DEEP * 1.6 * exp(-out_ * 1.4) * (0.4 + 0.8 * smoke) * smoothstep(R - 0.035, R, r);
  col += ORANGE * 0.06 / (1.0 + r * r * 0.4);

  col = col / (1.0 + max(col - 0.85, 0.0) * 0.85);
  gl_FragColor = vec4(col, 1.0);
}
`;

const CONFIG: OrbConfig = {
  fragment: FRAGMENT,
  // at its framing a whole swollen disc; all the way in it fills the window
  framing: (width, height) => Math.min(height * 0.24, width * 0.16),
  close: 1.3,
  arriveFrom: 0.3,
  detail: { low: 0, medium: 1, high: 2 },
};

export default function QuasiStarScene(props: SceneProps) {
  return <primitive object={useOrbScene(CONFIG, props)} />;
}
