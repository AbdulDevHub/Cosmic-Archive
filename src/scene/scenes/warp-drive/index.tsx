/**
 * Warp Drive (D-153): our own illustration of the Alcubierre warp drive, an idea inside the
 * Starbase. No ship is drawn (DESIGN_SPEC 2): only the bubble of calm, flat space it would ride in,
 * moving to the right. Ahead of it space is squeezed: the stars bunch up against the bubble's
 * front and shift blue; behind it space is stretched: the stars are drawn out thin and shift red.
 * Outside, the sky streams past; inside, it is nearly still. Where the two meet, a turbulent
 * sheath of glowing gas, a bright bow ahead and long wisps trailing behind, reads as the wall of
 * the bubble. One full-screen shader, one draw call, no particles. Its own colour family: indigo,
 * electric blue and ember red.
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

const vec3 INDIGO = vec3(0.24, 0.2, 0.7);
const vec3 BLUE = vec3(0.35, 0.65, 1.0);
const vec3 EMBER = vec3(1.0, 0.36, 0.16);

float swirlIn(vec2 u, float t){ return fbm3(vec3(u * 2.0, t * 0.05 + 11.0)); }

/* the sky in a flat 2D frame: x along the flight, y across it */
vec3 skyAt(vec2 p){
  return skyDeep(normalize(vec3(p * 0.9, -1.0)), 0.6);
}

void main(){
  vec2 css = vec2(gl_FragCoord.x, uResolution.y - gl_FragCoord.y) / uDpr;
  vec2 q = css - uCentre;
  q.y = -q.y;
  vec2 u = q / uScale;     // the bubble's radii, y up; it flies toward +x
  float t = uTime;
  // the drag turns the flight a little on screen
  float turn = clamp(uYaw * 0.35, -0.5, 0.5);
  float ct = cos(turn), sn = sin(turn);
  u = vec2(ct * u.x + sn * u.y, -sn * u.x + ct * u.y);
  float r = length(u);
  float ahead = u.x / max(r, 1e-3);           // 1 straight ahead, -1 straight behind

  // the shape of the bubble: 1 inside, 0 far outside, with a soft wall at r = 1
  float inside = 1.0 - smoothstep(0.82, 1.12, r);
  float wall = exp(-pow((r - 1.0) / 0.16, 2.0));

  // ---- space bent by the bubble: squeezed ahead, stretched behind ----
  // outside, the sky streams past to the left; inside, it hardly moves
  float stream = t * 0.22 * (1.0 - inside * 0.94);
  vec2 p = u;
  float outside = 1.0 - inside;
  // ahead, the sky is pulled toward the wall (bunched); behind, pushed away from it (drawn out)
  float bend = exp(-max(r - 1.0, 0.0) * 1.6) * outside;
  p += (u / max(r, 1e-3)) * bend * mix(0.55, -0.25, 0.5 + 0.5 * ahead);
  // behind, stretched along the flight: the stars draw out into soft streaks
  float stretch = 1.0 + 5.0 * bend * smoothstep(0.1, -0.8, ahead);
  p.x = p.x / stretch;
  p.x += stream;
  vec3 col = skyAt(p) * (0.75 + 0.6 * bend * smoothstep(-0.2, 0.8, ahead));
  // and shifted: blue ahead, red behind, strongest near the wall
  float shift = bend * 1.4;
  vec3 tint = mix(vec3(1.0), ahead > 0.0 ? BLUE * 1.5 : EMBER * 1.6, clamp(abs(ahead) * shift, 0.0, 0.85));
  col *= tint;
  // inside: calm, flat space, a little dimmer and cooler, the sky barely bent
  col = mix(col, skyAt(u * 0.92 + vec2(t * 0.013, 0.0)) * vec3(1.0, 1.02, 1.1), inside);
  // its inner face: a faint, uneven sheen, so it reads as clear and curved
  col += mix(INDIGO, BLUE, 0.4) * 0.12 * inside * pow(smoothstep(0.35, 1.0, r), 3.0) * (0.6 + 0.8 * swirlIn(u, t));

  // ---- the wall: a turbulent sheath of glowing gas, bright bow ahead, wisps behind ----
  float swirl = fbm3(vec3(u * 3.2 + vec2(-t * 0.5, 0.0), t * 0.15));
  float fine = fbm3(vec3(u * 9.0 + vec2(-t * 1.1, 0.0), 3.0 + t * 0.2));
  float sheath = wall * (0.35 + 1.1 * swirl * fine) * mix(0.35, 1.3, smoothstep(-0.4, 0.95, ahead));
  // the bow: pushed out a little ahead, as gas piles up there
  float bow = exp(-pow((r - 1.08 - 0.06 * swirl) / 0.07, 2.0)) * smoothstep(0.35, 0.95, ahead) * (0.6 + 0.8 * fine);
  // the wake: wisps trailing behind, broken up by the noise so they read as gas
  float wakeY = abs(u.y) - 0.92;
  float wake = exp(-wakeY * wakeY / 0.05) * smoothstep(-0.2, -1.8, u.x) * exp(u.x * 0.45) * smoothstep(0.35, 0.75, fbm3(vec3(u.x * 1.4 + t * 0.9, u.y * 5.0, 7.0)));
  vec3 gas = mix(INDIGO, BLUE, smoothstep(-0.3, 0.9, ahead)) * sheath;
  gas += mix(BLUE, vec3(0.85, 0.92, 1.0), 0.5) * bow * 1.1;
  gas += mix(EMBER, INDIGO, 0.35) * wake * 0.55;
  col += gas;
  // a faint lens of light across the bubble's face, as if its wall caught the starlight
  col += BLUE * 0.06 * inside * smoothstep(0.5, 1.0, r);

  col = col / (1.0 + max(col - 0.85, 0.0) * 0.85);
  gl_FragColor = vec4(col, 1.0);
}
`;

const CONFIG: OrbConfig = {
  fragment: FRAGMENT,
  // the bubble across about half a laptop's height; all the way in it nearly fills it
  framing: (width, height) => Math.min(width * 0.23, height * 0.29),
  close: 1.25,
  arriveFrom: 0.3,
  detail: { low: 0, medium: 1, high: 2 },
};

export default function WarpDriveScene(props: SceneProps) {
  return <primitive object={useOrbScene(CONFIG, props)} />;
}
