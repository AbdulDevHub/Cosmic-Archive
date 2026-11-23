/**
 * Matrioshka Brain (D-172): our own illustration of nested shells round a star, built to compute,
 * a megastructure idea in A Quasar Galaxy. Three shells, one inside the next like nesting dolls,
 * each a soft translucent sphere of countless tiny glowing nodes, cut open on the near side so the
 * inner ones show: the innermost hot gold round the hidden star, the next orange, the outermost a
 * dim infrared red, each running on the waste heat of the one inside; faint flickers of work run
 * across them. One full-screen shader, one draw call, no particles. Its own colour family:
 * infrared red, orange and gold.
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

vec3 shellColour(int k){
  if (k == 0) return vec3(1.0, 0.8, 0.4);
  if (k == 1) return vec3(1.0, 0.45, 0.15);
  return vec3(0.75, 0.1, 0.12);
}

void main(){
  vec2 css = vec2(gl_FragCoord.x, uResolution.y - gl_FragCoord.y) / uDpr;
  vec2 q = css - uCentre;
  q.y = -q.y;
  vec2 u = q / uScale;     // the outer shell's radii, y up
  float t = uTime;
  vec2 size = uResolution / uDpr;
  vec3 col = skyDeep(normalize(vec3((css - size * 0.5) / size.y * 1.3, -1.0)), 0.4) * 0.6;
  float r = length(u);

  mat3 turn = turnX(0.3 - uPitch) * turnY(uYaw + t * 0.02);
  // the cut: each shell is open on a wedge facing us, wider for the outer ones
  vec3 light = vec3(0.0);
  for (int k = 2; k >= 0; k--) {
    float R = k == 0 ? 0.36 : (k == 1 ? 0.64 : 1.0);
    float l = r / R;
    if (l > 1.0) {
      // its outer glow, the heat it sheds
      light += shellColour(k) * exp(-(l - 1.0) * 10.0) * 0.1;
      continue;
    }
    float z = sqrt(1.0 - l * l);
    // the front and back of the shell at this pixel, in the shell's own turning frame
    vec3 front = turn * vec3(u / R, z);
    vec3 back = turn * vec3(u / R, -z);
    // the open wedge: the front is cut away where it faces us within this angle of the middle
    float open = smoothstep(0.55 + 0.1 * float(k), 0.5 + 0.1 * float(k), atan(length(u / R), z) / 1.5708 - 0.0) ;
    float cut = smoothstep(0.35, 0.45, abs(atan(front.x, front.z)) / 3.1416);
    float frontSeen = cut;
    vec3 c = shellColour(k);
    // nodes: fine points of light over the surface, a few busy ones flickering
    for (int side = 0; side < 2; side++) {
      vec3 p = side == 0 ? back : front;
      float seen = side == 0 ? 0.55 : frontSeen;
      vec3 g = p * (28.0 - 6.0 * float(k));
      vec3 id = floor(g);
      float h = hash3(id + float(k) * 7.0);
      float node = exp(-length(fract(g) - 0.5) * 7.0) * step(0.25, h);
      float busy = step(0.92, h) * (0.5 + 0.5 * sin(t * (2.0 + h * 5.0) + h * 40.0));
      float skin = 0.12 + 0.2 * fbm3(p * 4.0 + float(k));
      float rim = pow(1.0 - z, 2.0);
      light += c * seen * (skin * 0.35 + node * (0.7 + busy * 1.4) + rim * 0.1) * (side == 0 ? 0.55 : 1.0);
    }
    // where the front is cut away, the edge of the cut glows a little: hot, soft
    light += c * (1.0 - frontSeen) * frontSeen * 0.0;
  }
  // the star itself, hidden, its light only seen through the open wedges
  light += vec3(1.0, 0.92, 0.7) * exp(-r / 0.06) * 0.8;
  col += light;

  col = col / (1.0 + max(col - 0.85, 0.0) * 0.85);
  gl_FragColor = vec4(col, 1.0);
}
`;

const CONFIG: OrbConfig = {
  fragment: FRAGMENT,
  framing: (width, height) => Math.min(width * 0.26, height * 0.4),
  close: 1.3,
  arriveFrom: 0.3,
  detail: { low: 0, medium: 1, high: 2 },
};

export default function MatrioshkaBrainScene(props: SceneProps) {
  return <primitive object={useOrbScene(CONFIG, props)} />;
}
