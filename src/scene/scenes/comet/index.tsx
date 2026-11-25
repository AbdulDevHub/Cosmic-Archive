/**
 * A comet (D-145): our own illustration of one close to its star, which lies off the frame to the
 * lower right. A small, dark, lumpy nucleus, lit on its sunward side, where pale jets of gas and
 * dust burst from its ices; round it, a great soft glowing head (the coma); and, blown away from
 * the star up and to the left, its two tails: a straight, narrow blue one of gas, streaked and
 * flowing, and a broad, curving, pale-gold one of dust. D-196: the head sits right of the middle
 * so the tails sweep the whole frame; the dust tail curves well away from the gas tail and is
 * fanned into fine striations; the gas tail kinks and streams; the coma is compact and a little
 * green, glowing over the nucleus too. One draw call, no particles. Its own colour family: ice
 * blue, pale gold, white and a touch of green. Mounted by the host through the registry; never
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

const vec3 COMA = vec3(0.45, 1.0, 0.78);   // the head's glow: a little green, as many comets' are

void main(){
  vec2 css = vec2(gl_FragCoord.x, uResolution.y - gl_FragCoord.y) / uDpr;
  vec2 q = css - uCentre;
  q.y = -q.y;
  float t = uTime;
  vec2 size = uResolution / uDpr;
  // D-196: the head sits right of the middle and a little low, so the tails sweep the whole frame
  vec2 head = vec2(0.3, -0.12) * size.y / uScale;
  vec2 u = q / uScale - head;   // the nucleus's radii, y up, from the nucleus
  float r = length(u);
  // a drag swings the star round a little, and the tails with it
  float swing = uYaw * 0.5;
  vec2 sun = vec2(cos(swing) * SUN.x - sin(swing) * SUN.y, sin(swing) * SUN.x + cos(swing) * SUN.y);
  vec2 away = -sun;
  vec2 side = vec2(-away.y, away.x);

  vec2 v = (css - size * 0.5) / size.y;
  vec3 col = skyDeep(normalize(vec3(v * 1.4, -1.0)), 0.7) * 0.85;

  float along = dot(u, away);
  float across = dot(u, side);

  // ---- the dust tail: broad, curving well off the gas tail as the comet moves on, pale gold,
  // fanned into fine striations ----
  if (along > -1.0) {
    float bend = across - 0.28 * along - 0.006 * along * along;   // swept to one side, and curving
    float w = 0.6 + 0.2 * max(along, 0.0);
    float body = exp(-pow(bend / w, 2.0));
    float fan = atan(bend, max(along, 0.5) + 2.0);
    float striae = fbm3(vec3(fan * 34.0, along * 0.015, 1.0));
    float grain = fbm3(vec3(along * 0.05, bend * 0.3, 5.0));
    float len = smoothstep(-1.0, 3.0, along) * exp(-max(along, 0.0) / 30.0);
    col += DUST * body * len * (0.25 + 0.45 * grain + 0.45 * smoothstep(0.45, 0.75, striae)) * 0.75;
  }

  // ---- the gas tail: straight away from the star, narrow, ice blue, its streamers flowing out fast ----
  if (along > -0.5) {
    float kink = 0.25 * (fbm3(vec3(along * 0.04 - t * 0.08, 2.0, 9.0)) - 0.5) * max(along, 0.0) * 0.15;
    float ac = across - kink;
    float w = 0.25 + 0.045 * max(along, 0.0);
    float body = exp(-pow(ac / w, 2.0));
    float streaks = fbm3(vec3(ac / w * 3.0, along * 0.04 - t * 0.15, 3.0));
    float knots = fbm3(vec3(ac * 0.6, along * 0.1 - t * 0.4, 7.0));
    float len = smoothstep(-0.5, 2.0, along) * exp(-max(along, 0.0) / 55.0);
    col += ION * body * len * (0.12 + 0.75 * smoothstep(0.45, 0.8, streaks) + 0.3 * knots);
    col += mix(ION, WHITE, 0.5) * exp(-pow(ac / (w * 0.18), 2.0)) * len * 0.25;
  }

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
      col += mix(ICE, WHITE, 0.6) * jet * flick * 0.7;
    }
  }

  // ---- the nucleus: a dark, lumpy body, lit from the star ----
  float lump = 1.0 + 0.32 * (fbm3(vec3(cos(a) * 1.2, sin(a) * 1.2, t * 0.01)) - 0.5) * 2.0;
  float rn = r / lump;
  float solid = smoothstep(1.0, 0.94, rn);   // 1 on the nucleus
  if (rn < 1.0) {
    vec3 n = vec3(u / lump, sqrt(1.0 - rn * rn));
    vec3 p = turnY(t * 0.03) * n;
    float crag = fbm3(p * 4.0);
    n = normalize(n + vec3((crag - 0.5) * 0.9, (fbm3(p * 4.0 + 7.0) - 0.5) * 0.9, 0.0));
    vec3 L = normalize(vec3(sun, 0.35));
    float lit = max(dot(n, L), 0.0);
    vec3 rock = vec3(0.2, 0.19, 0.18) * (0.75 + 0.5 * crag);
    vec3 surface = rock * (0.04 + 1.6 * lit) + ICE * 0.05 * pow(1.0 - n.z, 2.0);
    surface += WHITE * 0.7 * smoothstep(0.72, 0.8, fbm3(p * 6.0 + 3.0)) * lit;
    col = mix(col, surface, smoothstep(1.0, 0.94, rn));
  }

  // ---- the coma: a compact glowing head round the nucleus, green-white, in front of it too ----
  vec2 c = u - sun * 0.5;
  float cr = length(c);
  col += mix(COMA, WHITE, 0.35) * (0.55 * exp(-cr / 1.6) + 0.22 * exp(-cr / 4.5) + 0.06 * exp(-cr / 14.0)) * (1.0 - 0.8 * solid);
  col += mix(ICE, COMA, 0.5) * 0.12 * exp(-cr / 30.0);

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
