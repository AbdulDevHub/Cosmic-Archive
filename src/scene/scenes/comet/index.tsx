/**
 * A comet (D-145): our own illustration of one close to its star, which lies off the frame to the
 * lower right. A small, dark, lumpy nucleus, lit on its sunward side, where pale jets of gas and
 * dust burst from its ices; round it, a great soft glowing head (the coma); and, blown away from
 * the star up and to the left, its two tails: a straight, narrow blue one of gas, streaked and
 * flowing, and a broad, curving, pale-gold one of dust. One draw call, no particles. Its own
 * colour family: ice blue, pale gold and white. Mounted by the host through the registry; never
 * imported by a page.
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

const vec3 ICE = vec3(0.62, 0.82, 1.0);
const vec3 ION = vec3(0.3, 0.58, 1.0);
const vec3 DUST = vec3(1.0, 0.88, 0.68);
const vec3 WHITE = vec3(1.0, 0.99, 0.97);
const vec2 SUN = vec2(0.91, -0.41);   // toward the star, on screen (y up): off the frame, lower right

void main(){
  vec2 css = vec2(gl_FragCoord.x, uResolution.y - gl_FragCoord.y) / uDpr;
  vec2 q = css - uCentre;
  q.y = -q.y;
  vec2 u = q / uScale;     // the nucleus's radii, y up
  float r = length(u);
  float t = uTime;
  vec2 size = uResolution / uDpr;
  // a drag swings the star round a little, and the tails with it
  float swing = uYaw * 0.5;
  vec2 sun = vec2(cos(swing) * SUN.x - sin(swing) * SUN.y, sin(swing) * SUN.x + cos(swing) * SUN.y);
  vec2 away = -sun;
  vec2 side = vec2(-away.y, away.x);

  vec2 v = (css - size * 0.5) / size.y;
  vec3 col = skyDeep(normalize(vec3(v * 1.4, -1.0)), 0.7);

  float along = dot(u, away);
  float across = dot(u, side);

  // ---- the dust tail: broad, curving as the comet moves on, pale gold ----
  if (along > -1.0) {
    float bend = across + 0.012 * along * along;
    float w = 0.9 + 0.32 * max(along, 0.0);
    float body = exp(-pow(bend / w, 2.0));
    float grain = fbm3(vec3(along * 0.06, bend * 0.25, 1.0));
    float len = smoothstep(-1.0, 3.0, along) * exp(-max(along, 0.0) / 34.0);
    col += DUST * body * len * (0.55 + 0.5 * grain);
  }

  // ---- the gas tail: straight away from the star, narrow, streaked and flowing ----
  if (along > -0.5) {
    float w = 0.35 + 0.07 * max(along, 0.0);
    float body = exp(-pow(across / w, 2.0));
    float streaks = fbm3(vec3(across / w * 2.2, along * 0.05 - t * 0.12, 3.0));
    float knots = fbm3(vec3(across * 0.6, along * 0.12 - t * 0.35, 7.0));
    float len = smoothstep(-0.5, 2.0, along) * exp(-max(along, 0.0) / 48.0);
    col += ION * body * len * (0.18 + 0.55 * smoothstep(0.4, 0.8, streaks) + 0.25 * knots);
  }

  // ---- the coma: a great soft head, a little brighter toward the star ----
  vec2 c = u - sun * 0.6;
  float cr = length(c);
  col += mix(ICE, WHITE, 0.4) * (0.8 * exp(-cr / 2.2) + 0.25 * exp(-cr / 7.0));

  // ---- jets: pale plumes from the sunlit side, flickering ----
  float a = atan(u.y, u.x);
  for (int k = 0; k < 3; k++) {
    float fk = float(k);
    float ja = atan(sun.y, sun.x) + (fk - 1.0) * 0.6 + 0.15 * sin(t * 0.3 + fk * 2.0);
    vec2 jd = vec2(cos(ja), sin(ja));
    float jl = dot(u, jd);
    float jp = dot(u, vec2(-jd.y, jd.x));
    if (jl > 0.6) {
      float spread = 0.12 + 0.28 * (jl - 0.6);
      float jet = exp(-pow(jp / spread, 2.0)) * exp(-(jl - 0.6) / 1.6);
      float flick = 0.7 + 0.3 * fbm3(vec3(jl * 0.8 - t * 0.6, fk * 5.0, 2.0));
      col += mix(ICE, WHITE, 0.6) * jet * flick * 0.8;
    }
  }

  // ---- the nucleus: a dark, lumpy body, lit from the star ----
  float lump = 1.0 + 0.32 * (fbm3(vec3(cos(a) * 1.2, sin(a) * 1.2, t * 0.01)) - 0.5) * 2.0;
  float rn = r / lump;
  if (rn < 1.0) {
    vec3 n = vec3(u / lump, sqrt(1.0 - rn * rn));
    vec3 p = turnY(t * 0.03) * n;
    float crag = fbm3(p * 4.0);
    n = normalize(n + vec3((crag - 0.5) * 0.9, (fbm3(p * 4.0 + 7.0) - 0.5) * 0.9, 0.0));
    vec3 L = normalize(vec3(sun, 0.35));
    float lit = max(dot(n, L), 0.0);
    vec3 rock = vec3(0.2, 0.19, 0.18) * (0.75 + 0.5 * crag);
    vec3 surface = rock * (0.04 + 1.6 * lit) + ICE * 0.05 * pow(1.0 - n.z, 2.0);
    // bright ice where it is freshly exposed
    surface += WHITE * 0.7 * smoothstep(0.72, 0.8, fbm3(p * 6.0 + 3.0)) * lit;
    col = mix(col, surface, smoothstep(1.0, 0.94, rn));
  }

  col = col / (1.0 + max(col - 0.85, 0.0) * 0.9);
  gl_FragColor = vec4(col, 1.0);
}
`;

const CONFIG: OrbConfig = {
  fragment: FRAGMENT,
  framing: (width, height) => Math.min(height * 0.035, width * 0.022),
  close: 1.8,
  arriveFrom: 0.3,
  detail: { low: 0, medium: 1, high: 2 },
};

export default function CometScene(props: SceneProps) {
  return <primitive object={useOrbScene(CONFIG, props)} />;
}
