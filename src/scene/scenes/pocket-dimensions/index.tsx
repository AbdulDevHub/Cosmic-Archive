/**
 * Pocket Dimensions (D-160): our own illustration of a baby universe, an idea inside the Starbase:
 * a small pocket of space budding off from ours. A bright bulb hangs in the dark, a little cosmos
 * of its own swirling inside it in emerald and gold, its own stars and gas turning; it is joined
 * to our space below by a narrowing throat of streaming light that pinches as it thins. The stars
 * behind are bent round the bulb. One full-screen shader, one draw call, no particles. Its own
 * colour family: emerald, gold and deep teal. The bulb is a way in: a dive into it arrives in The
 * Pocket Universe (D-192).
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

const vec3 EMERALD = vec3(0.2, 0.95, 0.55);
const vec3 GOLD = vec3(1.0, 0.8, 0.4);
const vec3 TEAL = vec3(0.02, 0.18, 0.2);

void main(){
  vec2 css = vec2(gl_FragCoord.x, uResolution.y - gl_FragCoord.y) / uDpr;
  vec2 q = css - uCentre;
  q.y = -q.y;
  vec2 u = q / uScale;     // the bulb's radii, y up
  float t = uTime;
  vec2 size = uResolution / uDpr;
  vec2 b = vec2(0.0, 0.12);          // the bulb, a little above the middle
  float rb = length(u - b);
  vec2 dirb = rb > 1e-4 ? (u - b) / rb : vec2(0.0);

  // our sky, bent round the bulb
  vec2 v = (css - size * 0.5) / size.y;
  float bend = 0.06 / max(rb * rb, 0.3);
  vec3 col = skyDeep(normalize(vec3((v - dirb * bend * (uScale / size.y)) * 1.3 + vec2(uYaw, uPitch) * 0.15, -1.0)), 0.5) * 0.75;
  col += TEAL * 0.5 * exp(-rb * 1.5);

  // ---- the throat: a funnel of streaming light from the bulb down into our space, pinching thin ----
  float along = clamp((b.y - 0.46 - u.y) / 1.25, 0.0, 1.0);  // 0 at the bulb's foot, 1 far below
  float sway = 0.08 * sin(u.y * 2.2 + t * 0.4);
  float waist = mix(0.16, 0.03, smoothstep(0.0, 0.45, along)) + 0.45 * smoothstep(0.55, 1.0, along);
  float dx = u.x - sway;
  float inThroat = smoothstep(b.y - 0.3, b.y - 0.55, u.y) * smoothstep(-1.9, -1.4, u.y);
  float wall = exp(-pow((abs(dx) - waist * 0.75) / (0.03 + waist * 0.25), 2.0)) * inThroat;
  float stream = fbm3(vec3(dx * 6.0, u.y * 3.0 + t * 0.8, 2.0));
  vec3 throat = mix(EMERALD, GOLD, smoothstep(0.6, 0.0, along)) * wall * (0.25 + 0.9 * stream) * smoothstep(1.0, 0.6, along);
  throat += EMERALD * exp(-dx * dx / (waist * waist + 0.002)) * 0.15 * inThroat * smoothstep(1.0, 0.2, along);
  col += throat;

  // ---- the bulb: a small cosmos of its own, seen through a curved skin ----
  float R = 0.46;
  float l = rb / R;
  if (l < 1.0) {
    float z = sqrt(1.0 - l * l);
    vec2 d = (u - b) / R;
    // its insides turn: a swirl of gas and stars, a bright young heart
    float ang = atan(d.y, d.x) + t * 0.08;
    float rr = length(d);
    vec2 sw = vec2(cos(ang - rr * 3.0), sin(ang - rr * 3.0)) * rr;
    float gas = fbm3(vec3(sw * 3.0, t * 0.05));
    float arms = pow(0.5 + 0.5 * cos(2.0 * (ang - log(max(rr, 0.05)) * 2.2)), 3.0);
    vec3 inner = mix(TEAL, EMERALD, gas) * (0.35 + 0.9 * arms * gas) + GOLD * exp(-rr / 0.12) * 1.1;
    vec2 sc = sw * 60.0;
    inner += vec3(1.0, 0.97, 0.85) * step(0.93, hash3(vec3(floor(sc), 3.0))) * exp(-length(fract(sc) - 0.5) * 8.0) * 0.9;
    float fres = pow(1.0 - z, 2.5);
    inner = inner * (0.85 + 0.15 * z) + mix(EMERALD, GOLD, 0.5) * fres * 0.9;
    float edge = smoothstep(1.0, 0.94, l);
    col = mix(col, inner, edge);
  }
  // its skin, lit, and its glow in our space
  col += mix(EMERALD, GOLD, 0.4) * exp(-abs(rb - R) / 0.02) * 0.35;
  col += EMERALD * 0.18 * exp(-max(rb - R, 0.0) * 6.0) * step(R, rb);

  col = col / (1.0 + max(col - 0.85, 0.0) * 0.85);
  gl_FragColor = vec4(col, 1.0);
}
`;

const CONFIG: OrbConfig = {
  fragment: FRAGMENT,
  framing: (width, height) => Math.min(width * 0.3, height * 0.42),
  close: 1.3,
  arriveFrom: 0.3,
  detail: { low: 0, medium: 1, high: 2 },
  // the bulb is a way in (D-192): The Pocket Universe is inside it
  bodies: () => [{ name: "babyverse", x: 0, y: 0.12, z: 0.46 }],
  diveScale: 6,
};

export default function PocketDimensionsScene(props: SceneProps) {
  return <primitive object={useOrbScene(CONFIG, props)} />;
}
