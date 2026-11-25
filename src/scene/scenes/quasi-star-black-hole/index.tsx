/**
 * Its Black Hole (D-196): our own illustration of the black hole at the heart of a quasi-star,
 * reached by diving into the quasi-star. No sky: all round, the star's own gas, a churning ember
 * fog, spirals inward and drains toward the hole without end. At the middle, the hole's black
 * shadow, rimmed by a thin bright ring of bent light; a blazing disc of infalling gas crosses in
 * front of it, brighter on the side swinging toward us, and the disc's far side, bent by gravity,
 * arcs up over the shadow and under it. The gas behind is bent round the hole too. One full-screen
 * shader, one draw call, no particles. Its own colour family: ember, gold and white heat.
 */

import type { SceneBudget, SceneProps } from "../../host/types";
import { ORB_COMMON, useOrbScene, type OrbConfig } from "../shared/orb";

export const budget: SceneBudget = {
  drawCalls: 1,
  particles: { low: 0, medium: 0, high: 0 }, // no particles: the cost is per pixel
};

const FRAGMENT = /* glsl */ `
${ORB_COMMON}

const vec3 DEEP = vec3(0.09, 0.012, 0.008);
const vec3 RED = vec3(0.6, 0.09, 0.03);
const vec3 ORANGE = vec3(1.0, 0.42, 0.1);
const vec3 GOLD = vec3(1.0, 0.78, 0.4);
const vec3 WHITE = vec3(1.0, 0.95, 0.86);
const float RS = 0.2;          // the shadow's radius

/* the star's gas round the hole: a fog spiralling in, drawn in log-polar terms so it drains forever */
vec3 fog(vec2 p, float t){
  float r = max(length(p), 1e-3);
  float a = atan(p.y, p.x);
  float lr = log(r);
  // spiral in: the angle turns faster close in, and the whole pattern slides inward
  float sa = a + 0.9 * lr + t * 0.12 / max(r, 0.25);
  vec3 q = vec3(cos(sa) * 1.6, sin(sa) * 1.6, lr * 2.2 + t * 0.18);
  float n = fbm3(q * 1.3);
  float m = fbm3(q * 3.1 + vec3(4.0, 1.0, t * 0.05));
  float billow = smoothstep(0.3, 0.8, n * 0.7 + m * 0.45);
  float heat = exp(-r * 1.1);                    // hotter toward the hole
  vec3 c = mix(DEEP, RED, billow);
  c = mix(c, ORANGE, smoothstep(0.55, 0.9, billow) * (0.35 + 0.6 * heat));
  c += GOLD * pow(m, 4.0) * heat * 0.8;
  return c * (0.55 + 0.9 * heat);
}

void main(){
  vec2 css = vec2(gl_FragCoord.x, uResolution.y - gl_FragCoord.y) / uDpr;
  vec2 q = css - uCentre;
  q.y = -q.y;
  float t = uTime;
  vec2 u = q / uScale;
  // a drag tips the disc and turns the view a little
  float tilt = clamp(0.055 + uPitch * 0.4, 0.03, 0.6);
  float turn = clamp(uYaw * 0.3, -0.4, 0.4);
  u = vec2(cos(turn) * u.x + sin(turn) * u.y, -sin(turn) * u.x + cos(turn) * u.y);
  float r = length(u);
  vec2 dir = r > 1e-4 ? u / r : vec2(1.0, 0.0);

  // ---- the gas behind, its light bent round the hole ----
  float bend = RS * RS * 1.6 / max(r, RS);
  vec3 col = fog(u + dir * bend, t);

  // ---- the shadow and its ring of bent light ----
  float shadow = smoothstep(RS + 0.006, RS - 0.004, r);
  col *= 1.0 - shadow;
  float ring = exp(-pow((r - RS * 1.06) / 0.008, 2.0));
  col += mix(GOLD, WHITE, 0.6) * ring * 1.4;
  col += ORANGE * exp(-max(r - RS, 0.0) * 18.0) * 0.35 * (1.0 - shadow);

  // ---- the disc's far side, bent up over the shadow and under it ----
  float far = exp(-pow((r - RS * 1.45) / 0.07, 2.0)) * (1.0 - shadow);
  float farSide = mix(0.45, 1.0, smoothstep(-0.2, 0.6, dir.y));   // brightest over the top
  float swirlF = fbm3(vec3(atan(u.y, u.x) * 3.0 - t * 1.2, r * 20.0, 2.0));
  float doppF = 1.0 + 0.5 * -dir.x;                                // the left side comes toward us
  col += mix(ORANGE, GOLD, 0.6) * far * farSide * doppF * (0.6 + 0.7 * swirlF) * 1.1;

  // ---- the disc's near side, crossing in front ----
  vec2 e = vec2(u.x, u.y / tilt);
  float re = length(e);
  float inDisc = smoothstep(RS * 1.25, RS * 1.55, re) * smoothstep(1.25, 0.6, re);
  float ae = atan(e.y, e.x);
  // the gas streams round, faster close in: bands of brighter and darker gas
  float streams = fbm3(vec3(cos(ae - t * 0.9 / max(re, 0.3)) * re * 6.0, sin(ae - t * 0.9 / max(re, 0.3)) * re * 6.0, re * 9.0));
  float dopp = 1.0 + 0.7 * (-e.x / max(re, 1e-3));                // brighter on the approaching (left) side
  float hot = exp(-(re - RS * 1.3) * 2.6);
  vec3 discCol = mix(ORANGE, mix(GOLD, WHITE, smoothstep(0.4, 1.0, hot)), hot) * (0.35 + 1.1 * streams) * dopp * hot * 1.6;
  // the near half crosses the shadow; the far half (above the middle) is hidden behind it
  float front = step(e.y, 0.0) + step(0.0, e.y) * (1.0 - shadow);
  col = mix(col, col + discCol, inDisc * front);
  // a soft haze of heat over everything near the hole
  col += ORANGE * 0.12 * exp(-r * 2.5);

  col = col / (1.0 + max(col - 0.85, 0.0) * 0.85);
  gl_FragColor = vec4(col, 1.0);
}
`;

const CONFIG: OrbConfig = {
  fragment: FRAGMENT,
  framing: (width, height) => Math.min(height * 0.62, width * 0.42),
  close: 1.5,
  arriveFrom: 0.35,
  detail: { low: 0, medium: 1, high: 2 },
};

export default function QuasiStarBlackHoleScene(props: SceneProps) {
  return <primitive object={useOrbScene(CONFIG, props)} />;
}
