/**
 * A magnetar (D-143): our own illustration of a young neutron star with the strongest magnetic
 * field known. A small, ice-white ball whose crust is cracked with gold; round it, plasma caught
 * in its field glows magenta in two great lobes of loops, flickering and slowly twisting as the
 * star turns. Every so often an outburst: the star and its loops flare white and a soft flash
 * floods the sky, then fades. The stars behind it are bent by its gravity. One draw call, no
 * particles. Its own colour family: magenta, ice and gold. Mounted by the host through the
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

const vec3 ICE = vec3(0.86, 0.93, 1.0);
const vec3 WHITE = vec3(1.0, 0.98, 0.97);
const vec3 MAGENTA = vec3(1.0, 0.2, 0.78);
const vec3 ORCHID = vec3(0.72, 0.3, 1.0);
const vec3 GOLD = vec3(1.0, 0.74, 0.32);
const vec3 SLATE = vec3(0.34, 0.4, 0.62);
const float BURST_EVERY = 16.0;   // seconds between outbursts

/* how bright an outburst is now: a sharp rise, a long fade */
float burst(float t){
  float f = fract((t + 4.4) / BURST_EVERY) * BURST_EVERY;
  return smoothstep(0.0, 0.25, f) * exp(-f * 0.9);
}

void main(){
  vec2 css = vec2(gl_FragCoord.x, uResolution.y - gl_FragCoord.y) / uDpr;
  vec2 q = css - uCentre;
  q.y = -q.y;
  vec2 u = q / uScale;     // the star's radii, y up
  float r = length(u);
  float t = uTime;
  vec2 size = uResolution / uDpr;
  float spin = uYaw + t * 0.12;
  mat3 view = turnX(0.3 - uPitch) * turnY(spin);
  float b = burst(t);

  // ---- the sky, bent round it ----
  vec2 dirn = r > 1e-4 ? u / r : vec2(0.0);
  float pull = r > 1.0 ? 0.9 / (r * r) : 0.0;
  vec2 bent = css - vec2(dirn.x, -dirn.y) * uScale * pull;
  vec2 v = (bent - size * 0.5) / size.y;
  vec3 col = skyDeep(normalize(vec3(v * 1.4, -1.0)), 0.7);

  // ---- the field's plasma: dipole loops, r = L sin^2(theta) about the tilted magnetic axis ----
  float tilt = 0.45 + 0.25 * sin(spin);              // the axis leans as the star turns
  vec2 axis = vec2(sin(tilt), cos(tilt));
  float along = dot(u, axis);
  float across = u.x * axis.y - u.y * axis.x;
  float s2 = (across * across) / max(r * r, 1e-4); // sin^2 of the angle from the axis
  float L = r / max(s2, 1e-3);                       // which loop this point lies on
  float side = sign(across);
  float lobe = 0.0;
  if (r > 0.95 && L < 7.0) {
    // a few bright bundles of loops, each flickering along its length
    float shell = fbm3(vec3(L * 1.6, side * 3.0, t * 0.15));
    float bundles = pow(smoothstep(0.45, 0.85, shell), 1.5);
    float flow = fbm3(vec3(L * 3.0, along * 2.5 - t * 0.4, side * 5.0));
    float fade = exp(-(L - 1.0) * 0.55) * smoothstep(0.95, 1.25, r);
    lobe = (0.3 + bundles * (0.6 + 0.8 * flow)) * fade;
  }
  vec3 plasma = mix(ORCHID, MAGENTA, smoothstep(2.5, 1.2, L));
  col += mix(plasma, WHITE, b * 0.6) * lobe * (1.5 + 2.0 * b);
  // a faint haze of plasma near the star in every direction
  col += MAGENTA * 0.22 * exp(-max(r - 1.0, 0.0) * 2.2) * (1.0 + 2.0 * b);
  // its own glow (under the star's edge too, so the limb meets it with no seam)
  col += ICE * 0.5 * exp(-max(r - 1.0, 0.0) * 5.0);

  // ---- the star: ice-white, its crust cracked with gold ----
  if (r < 1.0) {
    vec3 n = vec3(u, sqrt(1.0 - r * r));
    vec3 p = transpose(view) * n;
    float mu = n.z;
    float c = 1.0 - abs(2.0 * fbm3(p * 5.0) - 1.0);
    float cracks = pow(c, 26.0);
    float mottle = fbm3(p * 3.0 + vec3(0.0, t * 0.05, 0.0));
    vec3 crust = mix(SLATE, ICE, smoothstep(0.3, 0.75, mottle));
    vec3 surface = crust * (0.4 + 0.6 * mu);
    surface += mix(GOLD, WHITE, 0.25) * cracks * (1.6 + 3.0 * b);
    // the magnetic poles burn hottest
    surface += WHITE * 0.8 * pow(max(abs(dot(n, normalize(vec3(axis, 0.25)))), 0.0), 18.0);
    surface = mix(surface, WHITE * 1.6, b * 0.6);
    col = mix(col, surface, smoothstep(1.0, 0.985, r));
  }

  // ---- an outburst's flash flooding the sky ----
  col += mix(MAGENTA, WHITE, 0.4) * b * 0.55 / (1.0 + r * r * 0.08);

  col = col / (1.0 + max(col - 0.85, 0.0) * 0.9);
  gl_FragColor = vec4(col, 1.0);
}
`;

const CONFIG: OrbConfig = {
  fragment: FRAGMENT,
  framing: (width, height) => Math.min(height * 0.07, width * 0.045),
  close: 1.7,
  arriveFrom: 0.3,
  detail: { low: 0, medium: 1, high: 2 },
};

export default function MagnetarScene(props: SceneProps) {
  return <primitive object={useOrbScene(CONFIG, props)} />;
}
