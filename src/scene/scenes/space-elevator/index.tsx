/**
 * Space Elevator (D-170): our own illustration of a space elevator, a megastructure in A Quasar
 * Galaxy: a ribbon from a planet's surface up into orbit, out to a counterweight. The curve of a
 * blue world fills the bottom of the frame at sunrise; from a bright anchor on it, a broad ribbon
 * rises straight up and out of sight, a soft silver band catching the dawn, with climbers like
 * small warm beads riding up it; high above, the counterweight station glints. The ribbon is the
 * structure itself, drawn broad and lit, with a halo of its own light. One full-screen shader, one
 * draw call, no particles. Its own colour family: earth blue, ribbon silver and sunrise orange.
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

const vec3 EARTH = vec3(0.12, 0.32, 0.7);
const vec3 SILVER = vec3(0.85, 0.88, 0.95);
const vec3 DAWN = vec3(1.0, 0.58, 0.25);

void main(){
  vec2 css = vec2(gl_FragCoord.x, uResolution.y - gl_FragCoord.y) / uDpr;
  vec2 q = css - uCentre;
  q.y = -q.y;
  vec2 u = q / uScale;
  float t = uTime;
  vec2 size = uResolution / uDpr;
  vec3 col = skyDeep(normalize(vec3((css - size * 0.5) / size.y * 1.3, -1.0)), 0.45) * 0.7;

  // the planet: a huge circle below, its rim lit by the sunrise on the right
  vec2 pc = vec2(0.0 + uYaw * 0.2, -4.05);
  float PR = 3.6;
  vec2 pd = u - pc;
  float pr = length(pd);
  float hz = pr - PR;
  if (hz < 0.0) {
    float z = sqrt(max(1.0 - (pr / PR) * (pr / PR), 0.0));
    vec3 n = normalize(vec3(pd / PR, z));
    vec3 L = normalize(vec3(0.85, 0.25, 0.3));
    float diff = max(dot(n, L), 0.0);
    // oceans, land and cloud, turning slowly
    vec3 sp = turnY(t * 0.01) * n;
    float land = smoothstep(0.52, 0.56, fbm3(sp * 6.0));
    float cloud = smoothstep(0.5, 0.75, fbm3(sp * 9.0 + vec3(t * 0.01)));
    vec3 surf = mix(EARTH, vec3(0.3, 0.45, 0.25), land);
    surf = mix(surf, vec3(0.95), cloud * 0.8);
    col = surf * (0.04 + 1.1 * diff) + DAWN * pow(1.0 - z, 3.0) * 0.3 * smoothstep(-0.3, 0.6, n.x);
    // night side lights, faint
    col += DAWN * 0.25 * land * step(0.6, hash3(floor(sp * 120.0))) * smoothstep(0.1, 0.0, diff);
  }
  // the air: a thin glowing band at the rim, warm toward the sunrise
  col += mix(vec3(0.35, 0.6, 1.0), DAWN, smoothstep(-0.5, 1.0, pd.x / PR)) * exp(-abs(hz) / 0.03) * 0.55;
  col += vec3(0.35, 0.6, 1.0) * exp(-max(hz, 0.0) / 0.15) * 0.12 * step(0.0, hz);

  // the ribbon: from the anchor on the rim, straight up, broad and lit, fading as it goes
  float rx = u.x - uYaw * 0.2 - 0.12;
  float y0 = pc.y + PR;              // the anchor's height
  float up = u.y - y0;
  float w = 0.018 + 0.004 * up;
  float band = smoothstep(w, w * 0.4, abs(rx)) * step(0.0, up);
  float shade = 0.55 + 0.45 * smoothstep(-w, w, rx);   // its sunward edge brighter
  float fade = exp(-up * 0.35);
  col = mix(col, SILVER * shade * (0.5 + 0.4 * fade) + DAWN * 0.25 * (1.0 - smoothstep(0.0, 1.5, up)), band * 0.9);
  col += SILVER * exp(-abs(rx) / 0.05) * 0.06 * step(0.0, up) * fade;
  // the anchor: a bright platform where it meets the world
  col += DAWN * exp(-length(vec2(rx, up)) / 0.04) * 0.9;

  // climbers: warm beads riding up, each at its own pace
  for (int k = 0; k < 4; k++) {
    float fk = float(k);
    float h = mod(t * (0.05 + 0.015 * fk) + fk * 0.71, 3.2);
    float dc = length(vec2(rx, up - h));
    col += mix(DAWN, vec3(1.0), 0.4) * (exp(-dc / 0.014) * 1.1 + exp(-dc / 0.06) * 0.15) * exp(-h * 0.25);
  }
  // the counterweight, far up: a glint
  float dw = length(vec2(rx, up - 3.35));
  col += SILVER * (exp(-dw / 0.02) * 1.2 + exp(-dw / 0.1) * 0.12);

  col = col / (1.0 + max(col - 0.85, 0.0) * 0.85);
  gl_FragColor = vec4(col, 1.0);
}
`;

const CONFIG: OrbConfig = {
  fragment: FRAGMENT,
  framing: (width, height) => Math.min(width * 0.32, height * 0.48),
  close: 1.25,
  arriveFrom: 0.3,
  detail: { low: 0, medium: 1, high: 2 },
};

export default function SpaceElevatorScene(props: SceneProps) {
  return <primitive object={useOrbScene(CONFIG, props)} />;
}
