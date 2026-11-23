/**
 * Star Lifter (D-168): our own illustration of star lifting, a megastructure idea in A Quasar
 * Galaxy: taking mass off an ageing star so it burns more gently and lives longer. A great ruby
 * and orange star fills the lower frame, its surface boiling; from its poles two broad, twisting
 * plumes of its own gas are drawn up and out, glowing as they rise and thin, toward small dark
 * cobalt-lit collectors waiting in the dark above. One full-screen shader, one draw call, no
 * particles. Its own colour family: ruby, orange and cobalt.
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

const vec3 RUBY = vec3(0.85, 0.12, 0.1);
const vec3 ORANGE = vec3(1.0, 0.55, 0.18);
const vec3 COBALT = vec3(0.25, 0.45, 1.0);

void main(){
  vec2 css = vec2(gl_FragCoord.x, uResolution.y - gl_FragCoord.y) / uDpr;
  vec2 q = css - uCentre;
  q.y = -q.y;
  vec2 u = q / uScale;     // the star's radii, y up
  float t = uTime;
  vec2 size = uResolution / uDpr;
  vec3 col = skyDeep(normalize(vec3((css - size * 0.5) / size.y * 1.3, -1.0)), 0.45) * 0.6;
  float r = length(u);

  // the axis the gas is drawn along leans a little; the drag turns it
  float lean = 0.35 + uYaw * 0.3;
  vec2 ax = vec2(sin(lean), cos(lean));
  vec2 pr = vec2(dot(u, vec2(ax.y, -ax.x)), dot(u, ax));   // across, along the axis

  // ---- the plumes: from each pole, twisting gas rising and thinning ----
  for (int k = 0; k < 2; k++) {
    float sgn = k == 0 ? 1.0 : -1.0;
    float along = pr.y * sgn - 0.9;                        // 0 at the pole, out along the axis
    if (along < -0.2) continue;
    float twist = 0.12 * sin(along * 3.0 - t * 0.5 + float(k) * 2.0) * smoothstep(0.0, 0.8, along);
    float width = 0.1 + 0.22 * smoothstep(0.0, 2.2, along);
    float across = pr.x - twist;
    float body = exp(-across * across / (width * width));
    float gas = fbm3(vec3(across * 6.0, along * 2.5 - t * 0.6, float(k) * 4.0));
    float fil = fbm3(vec3(across * 14.0 + gas * 2.0, along * 4.0 - t * 0.9, float(k) * 7.0 + 2.0));
    float fade = smoothstep(-0.2, 0.15, along) * exp(-along * 0.55);
    vec3 tint = mix(ORANGE, RUBY, smoothstep(0.0, 1.8, along));
    col += tint * body * (0.35 + 1.3 * gas * fil) * fade * 1.4;
    // its collector: a small dark body with a cobalt light, where the plume thins
    vec2 cpos = ax * sgn * 2.05 + vec2(ax.y, -ax.x) * 0.05 * sin(t * 0.3 + float(k));
    float dc = length(u - cpos);
    col = mix(col, vec3(0.02, 0.03, 0.06), smoothstep(0.05, 0.035, dc));
    col += COBALT * (exp(-dc / 0.03) * 0.5 + exp(-dc / 0.12) * 0.15) * step(0.035, dc);
  }

  // ---- the star: boiling ruby and orange, darker at its edge ----
  if (r < 1.0) {
    float z = sqrt(1.0 - r * r);
    vec3 n = vec3(u, z);
    vec3 sp = turnY(t * 0.02) * n;
    float cells = fbm3(sp * 5.0 + vec3(0.0, 0.0, t * 0.08));
    float fine = fbm3(sp * 16.0 + vec3(t * 0.1));
    vec3 surf = mix(RUBY, ORANGE, smoothstep(0.3, 0.75, cells * 0.7 + fine * 0.4));
    surf *= 0.55 + 0.6 * pow(z, 0.5);
    // the poles brighten where the gas is being drawn off
    float pole = pow(abs(dot(normalize(n), vec3(ax, 0.0))), 6.0);
    surf += ORANGE * pole * 0.6;
    col = mix(col, surf * 1.15, smoothstep(1.0, 0.99, r));
  }
  col += mix(ORANGE, RUBY, 0.5) * 0.35 * exp(-max(r - 1.0, 0.0) * 5.0) * step(1.0, r);

  col = col / (1.0 + max(col - 0.85, 0.0) * 0.85);
  gl_FragColor = vec4(col, 1.0);
}
`;

const CONFIG: OrbConfig = {
  fragment: FRAGMENT,
  framing: (width, height) => Math.min(width * 0.11, height * 0.15),
  close: 1.3,
  arriveFrom: 0.3,
  detail: { low: 0, medium: 1, high: 2 },
};

export default function StarLifterScene(props: SceneProps) {
  return <primitive object={useOrbScene(CONFIG, props)} />;
}
