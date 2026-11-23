/**
 * Bubble Universes (D-159): our own illustration of eternal inflation, an idea inside the
 * Starbase: a background of space still inflating, a warm rose and gold haze streaming outward,
 * in which bubbles open where inflation has stopped, each a universe of its own. They hang at many
 * sizes and drift slowly apart; each holds its own faint sky of stars and gas in its own tint,
 * under a thin iridescent skin; now and then a new one opens, small and bright. The largest, in
 * the middle, stands for ours. One full-screen shader, one draw call, no particles. Its own
 * colour family: rose, gold and violet.
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

const vec3 ROSE = vec3(1.0, 0.45, 0.6);
const vec3 GOLD = vec3(1.0, 0.78, 0.45);
const vec3 VIOLET = vec3(0.55, 0.38, 1.0);
const int BUBBLES = 11;

/* each bubble: its centre and radius (in the view's radii), its tint, and how open it is */
void bubble(int i, float t, out vec2 c, out float rad, out vec3 tint, out float open){
  float fi = float(i);
  if (i == 0) {
    c = vec2(0.0); rad = 0.55; tint = VIOLET; open = 1.0;   // ours
    return;
  }
  float h1 = hash3(vec3(fi, 1.0, 2.0)), h2 = hash3(vec3(fi, 3.0, 4.0)), h3 = hash3(vec3(fi, 5.0, 6.0));
  float a = fi * 2.399 + 0.4;
  float d = 0.85 + 1.0 * sqrt(h1);
  // they drift apart as the space between them inflates, each opening and later fading, on its own clock
  float cycle = 46.0 + 30.0 * h2;
  float age = fract(t / cycle + h3);
  c = vec2(cos(a), sin(a) * 0.68) * d * (1.0 + 0.25 * age);
  rad = (0.08 + 0.2 * h2) * (0.35 + 0.65 * smoothstep(0.0, 0.25, age));
  tint = mix(mix(ROSE, GOLD, h1), VIOLET, h3 * 0.6);
  open = smoothstep(0.0, 0.08, age) * smoothstep(1.0, 0.85, age);
}

void main(){
  vec2 css = vec2(gl_FragCoord.x, uResolution.y - gl_FragCoord.y) / uDpr;
  vec2 q = css - uCentre;
  q.y = -q.y;
  vec2 u = q / uScale;     // the view's radii, y up
  float t = uTime;
  vec2 pan = vec2(uYaw, -uPitch) * 0.5;
  u += pan;
  float r = length(u);

  // ---- the inflating background: a warm haze streaming outward, never still ----
  float flow = log(max(r, 0.05)) - t * 0.05;
  float ang = atan(u.y, u.x);
  float haze = fbm3(vec3(cos(ang) * 1.5, sin(ang) * 1.5, flow * 2.0));
  float haze2 = fbm3(vec3(u * 1.4, t * 0.03));
  vec3 col = mix(vec3(0.08, 0.025, 0.09), mix(ROSE, GOLD, haze2) * 0.45, smoothstep(0.25, 0.85, haze * 0.6 + haze2 * 0.5));
  col += VIOLET * 0.05 * haze2;

  // ---- the bubbles ----
  for (int i = 0; i < BUBBLES; i++) {
    if (i > 6 + 2 * uDetail) break;
    vec2 c; float rad; vec3 tint; float open;
    bubble(i, t, c, rad, tint, open);
    vec2 d = (u - c) / rad;
    float l = length(d);
    if (l > 1.25) continue;
    // inside: its own small sky, seen through a curved skin
    float z = sqrt(max(1.0 - l * l, 0.0));
    vec3 n = vec3(d, z);
    vec3 dir = normalize(vec3(d * 0.8, -1.0) + vec3(float(i) * 0.37, float(i) * 0.11, 0.0));
    // ours keeps a sky like our own; the others take their own colour, light and stars alike
    vec3 sk = skyDeep(dir, 0.7);
    vec3 inner = i == 0 ? sk * 1.1 : tint * dot(sk, vec3(0.45)) * 2.4 + tint * 0.12;
    inner += tint * 0.2 * pow(fbm3(vec3(d * 2.0, float(i) + t * 0.02)), 2.0);
    float inside = smoothstep(1.0, 0.985, l);
    // its skin: thin, iridescent, brightest where we see it edge on
    float fres = pow(1.0 - z, 3.0) * inside;
    vec3 sheen = 0.5 + 0.5 * cos(TAU * (vec3(0.0, 0.33, 0.67) + l * 1.6 + float(i) * 0.2 + t * 0.03));
    vec3 skin = mix(tint, sheen, 0.45) * fres * 0.9;
    // a soft highlight, as on any bubble
    float hl = exp(-length(d - vec2(-0.38, 0.42)) * 7.0) * inside * 0.35;
    vec3 b = inner + skin + vec3(1.0) * hl;
    // a halo where it meets the inflating space
    float halo = exp(-max(l - 1.0, 0.0) * 12.0) * (1.0 - inside) * 0.25;
    col = mix(col, b, inside * open) + tint * halo * open;
  }

  col = col / (1.0 + max(col - 0.85, 0.0) * 0.85);
  gl_FragColor = vec4(col, 1.0);
}
`;

const CONFIG: OrbConfig = {
  fragment: FRAGMENT,
  framing: (width, height) => Math.min(width * 0.3, height * 0.45),
  close: 1.3,
  arriveFrom: 0.3,
  detail: { low: 0, medium: 1, high: 2 },
};

export default function BubbleUniversesScene(props: SceneProps) {
  return <primitive object={useOrbScene(CONFIG, props)} />;
}
