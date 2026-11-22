/**
 * A Dyson sphere (D-117): our own illustration of an imagined megastructure (proposed in 1960). A
 * yellow star wrapped by a swarm of collectors on independent orbits: tilted rings of panels,
 * each a band of segments catching the star's light on their inner faces and glowing with the
 * heat they shed, the star blazing through the gaps. One draw call, no particles. Mounted by the
 * host through the registry; never imported by a page.
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

const vec3 ORANGE = vec3(1.0, 0.5, 0.12);
const vec3 GOLD = vec3(1.0, 0.78, 0.36);
const vec3 PALE = vec3(1.0, 0.95, 0.8);
const vec3 STEEL = vec3(0.32, 0.34, 0.44);
const vec3 HEAT = vec3(1.0, 0.32, 0.12);
const vec3 BLUE = vec3(0.45, 0.65, 1.0);
const int RINGS = 5;

vec3 sky(vec2 css){
  vec2 size = uResolution / uDpr;
  vec2 v = (css - size * 0.5) / size.y;
  return skyDeep(normalize(vec3(v * 1.4, -1.0)), 0.8);
}

/* one ring of collectors: its tilt, its turn, its radius and the speed it orbits at */
vec4 ringOf(int i){
  float f = float(i);
  return vec4(0.25 + f * 0.63, f * 1.7 + 0.4, 1.55 + f * 0.17, 0.05 / (1.0 + f * 0.3));
}

void main(){
  vec2 css = vec2(gl_FragCoord.x, uResolution.y - gl_FragCoord.y) / uDpr;
  vec2 q = css - uCentre;
  q.y = -q.y;
  vec2 u = q / uScale;     // the star's radii, y up
  float r = length(u);
  float t = uTime;
  mat3 view = turnX(0.28 - uPitch) * turnY(uYaw);

  vec3 col = sky(css);

  // ---- the star in the middle: golden plasma, simpler than the Yellow Star's ----
  vec3 star = vec3(0.0);
  float starMask = 0.0;
  if (r < 1.0) {
    vec3 n = vec3(u, sqrt(1.0 - r * r));
    vec3 b = transpose(view) * n;
    float plasma = fbm3(b * 5.0 + fbm3(b * 2.0 + t * 0.03) * 2.0);
    float heat = 0.55 + 0.6 * plasma;
    star = mix(ORANGE, GOLD, smoothstep(0.6, 0.95, heat));
    star = mix(star, PALE, smoothstep(0.95, 1.15, heat)) * (0.8 + 0.5 * heat) * 1.3;
    starMask = smoothstep(1.0, 0.99, r);
  }
  col = mix(col, star, starMask);
  col += ORANGE * 0.55 * exp(-max(r - 1.0, 0.0) * 2.2) * step(1.0, r);

  // ---- the swarm: tilted rings of collectors, nearest drawn last ----
  // each ring is a band in its own plane; a ray into the screen at u meets that plane at depth z
  float best = -1e3;
  vec3 ringLight = vec3(0.0);
  float ringCover = 0.0;
  for (int i = 0; i < RINGS; i++) {
    vec4 R = ringOf(i);
    mat3 tilt = view * turnY(R.y) * turnX(R.x);
    vec3 nrm = tilt * vec3(0.0, 1.0, 0.0);
    if (abs(nrm.z) < 0.02) continue;
    float z = -(u.x * nrm.x + u.y * nrm.y) / nrm.z;
    vec3 p = transpose(tilt) * vec3(u, z);
    float pr = length(p.xz);
    float hw = 0.07 + 0.02 * float(i);
    float band = 1.0 - smoothstep(hw * 0.8, hw, abs(pr - R.z));
    if (band <= 0.0) continue;
    // hidden behind the star
    if (z < 0.0 && r < 1.0) continue;
    // the panels: segments along the ring with thin gaps, turning slowly
    float ang = atan(p.z, p.x) + t * R.w;
    float seg = fract(ang * (24.0 + 6.0 * float(i)) / TAU);
    float panel = smoothstep(0.0, 0.06, seg) * smoothstep(1.0, 0.9, seg);
    float stripe = 0.85 + 0.15 * step(0.5, fract((pr - R.z) / hw * 2.0 + 0.5));
    // which face we see: the inner one, lit by the star, or the outer one, dark and warm
    vec3 toStar = normalize(-vec3(u, z));
    float inner = dot(normalize(vec3(tilt * vec3(p.x, 0.0, p.z))), toStar);
    float facing = dot(nrm, vec3(0.0, 0.0, 1.0)) * sign(dot(nrm, -vec3(u, z)) + 1e-4);
    float lit = clamp(facing * 0.5 + 0.5, 0.0, 1.0);
    vec3 face = mix(STEEL * 0.5 + HEAT * 0.25, GOLD * 1.4, lit) * stripe;
    face += PALE * pow(max(inner, 0.0), 6.0) * 0.4;           // glints where a panel turns toward the star
    face += BLUE * 0.25 * step(0.97, fract(ang * 7.0 + float(i))); // running lights
    float cover = band * panel;
    if (z > best) {
      // nearer than what is drawn so far: over it
      ringLight = mix(ringLight, face, cover);
      ringCover = max(ringCover, cover);
      best = z;
    } else {
      // behind something nearer: only where that one leaves a gap
      ringLight = mix(face, ringLight, ringCover);
      ringCover = max(ringCover, cover);
    }
  }
  col = mix(col, ringLight, ringCover);
  // light pouring out through the gaps
  col += GOLD * 0.08 / (1.0 + r * r * 0.25);

  col = col / (1.0 + max(col - 0.9, 0.0) * 0.8);
  gl_FragColor = vec4(col, 1.0);
}
`;

const CONFIG: OrbConfig = {
  fragment: FRAGMENT,
  // the swarm reaches about 2.4 radii from the star: at its framing it fits the window
  framing: (width, height) => Math.min(height * 0.15, width * 0.1),
  close: 1.6,
  arriveFrom: 0.3,
  detail: { low: 0, medium: 1, high: 2 },
};

export default function DysonSphereScene(props: SceneProps) {
  return <primitive object={useOrbScene(CONFIG, props)} />;
}
