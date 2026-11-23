/**
 * Vacuum Decay (D-158): our own illustration of a bubble of "true vacuum", an idea inside the
 * Starbase, and one physicists think extremely unlikely. In an ordinary starry sky, a sphere has
 * opened where the laws of physics are different: inside, a deep crimson dark crossed by strange,
 * slow, crystalline light that follows rules of its own; its wall is a white-hot, boiling shell of
 * energy rushing outward, its turbulence streaming away from the middle; just ahead of the wall the
 * stars are dragged toward it and blaze up before they are taken in. One full-screen shader, one
 * draw call, no particles. Its own colour family: crimson, black and white-hot gold.
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

const vec3 CRIMSON = vec3(0.75, 0.04, 0.1);
const vec3 GOLD = vec3(1.0, 0.75, 0.38);
const vec3 HOT = vec3(1.0, 0.95, 0.85);

void main(){
  vec2 css = vec2(gl_FragCoord.x, uResolution.y - gl_FragCoord.y) / uDpr;
  vec2 q = css - uCentre;
  q.y = -q.y;
  vec2 u = q / uScale;     // the bubble's radii, y up
  float t = uTime;
  float r = length(u);
  vec2 dir = r > 1e-4 ? u / r : vec2(1.0, 0.0);
  vec2 size = uResolution / uDpr;
  vec2 v = (css - size * 0.5) / size.y;

  // the wall breathes a little as it races outward (the growth itself is too fast to show)
  float R = 1.0 + 0.015 * sin(t * 0.7);
  float ang = atan(u.y, u.x);
  float edge = R + 0.04 * (fbm3(vec3(dir * 3.0, t * 0.3)) - 0.5);

  // ---- outside: the ordinary sky, dragged in toward the wall just ahead of it ----
  float near = exp(-max(r - edge, 0.0) * 4.0);
  vec2 pulled = v - dir * near * 0.08 * (uScale / size.y);
  vec3 sky = skyDeep(normalize(vec3(pulled * 1.3 + vec2(uYaw, uPitch) * 0.2, -1.0)), 0.55) * 0.8;
  sky *= 1.0 + near * 1.6;                    // stars blaze up before they are taken
  sky += GOLD * near * 0.05;
  vec3 col = sky;

  // ---- inside: other laws: a crimson dark crossed by slow, strange crystal light ----
  if (r < edge) {
    vec2 w = u * 3.2;
    // a lattice that is not ours: three sets of folds at odd angles, slowly turning
    float f = 0.0;
    for (int k = 0; k < 3; k++) {
      float a = float(k) * 2.2 + t * 0.03 * (float(k) - 1.0);
      vec2 d = vec2(cos(a), sin(a));
      f += pow(abs(sin(dot(w, d) * 2.4 + fbm3(vec3(w * 0.6, float(k) + t * 0.05)) * 3.0)), 9.0);
    }
    float glow = fbm3(vec3(u * 2.0, t * 0.04));
    vec3 inside = CRIMSON * (0.03 + 0.22 * glow * glow) + mix(CRIMSON, GOLD, 0.55) * f * 0.3 * smoothstep(edge, edge * 0.4, r);
    inside *= 0.6 + 0.4 * smoothstep(0.0, edge, r);   // darker toward the middle
    col = mix(sky * 0.05, inside, 1.0);
  }

  // ---- the wall: a white-hot shell, boiling, its turbulence streaming outward ----
  float shell = exp(-pow((r - edge) / 0.045, 2.0));
  float boil = fbm3(vec3(dir * 6.0, r * 8.0 - t * 2.4));
  float fine = fbm3(vec3(dir * 18.0 + 3.0, r * 20.0 - t * 4.0));
  col += mix(GOLD, HOT, boil) * shell * (0.9 + 1.3 * boil * fine);
  // its glow spills both ways, and wisps trail inward behind it
  col += GOLD * exp(-abs(r - edge) / 0.18) * 0.22 * (0.6 + 0.6 * boil);
  float wisp = smoothstep(0.55, 0.8, fbm3(vec3(dir * 9.0, r * 5.0 - t * 1.2))) * exp(-max(edge - r, 0.0) / 0.12) * step(r, edge);
  col += mix(CRIMSON, GOLD, 0.5) * wisp * 0.5;

  col = col / (1.0 + max(col - 0.85, 0.0) * 0.85);
  gl_FragColor = vec4(col, 1.0);
}
`;

const CONFIG: OrbConfig = {
  fragment: FRAGMENT,
  framing: (width, height) => Math.min(width * 0.19, height * 0.27),
  close: 1.3,
  arriveFrom: 0.3,
  detail: { low: 0, medium: 1, high: 2 },
};

export default function VacuumDecayScene(props: SceneProps) {
  return <primitive object={useOrbScene(CONFIG, props)} />;
}
