/**
 * Omniverse (D-161): our own illustration of the widest idea of all, an idea inside the Starbase:
 * Tegmark's hierarchy of multiverses, each level allowing more variety than the last, up to
 * universes built on other equations of physics. Drawn as abstract light: great soft spheres of
 * pearl and gold, each holding smaller spheres in other hues, each holding smaller ones again,
 * three levels deep, every family a different colour so no two are alike; they turn slowly about
 * one another in a pearly haze. One full-screen shader, one draw call, no particles. Its own
 * colour family: pearl, gold and the full spectrum.
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

const vec3 PEARL = vec3(0.95, 0.93, 1.0);
const vec3 GOLD = vec3(1.0, 0.8, 0.45);

vec3 hue(float h){ return 0.55 + 0.45 * cos(TAU * (h + vec3(0.0, 0.33, 0.67))); }

/* one sphere's light: a soft body, brighter at its rim, with a faint inner sky */
vec3 orb(vec2 d, float rad, vec3 tint, float seed){
  float l = length(d) / rad;
  if (l > 1.6) return vec3(0.0);
  float z = sqrt(max(1.0 - l * l, 0.0));
  float inside = smoothstep(1.0, 0.95, l);
  // a soft, filled glow, densest in the middle, its edge melting away: light, not an outline
  float glow = exp(-l * l * 2.2);
  float body = fbm3(vec3(d / rad * 1.5, seed));
  float fres = pow(1.0 - z, 3.0) * inside;
  return tint * (glow * (0.18 + 0.3 * body) + fres * 0.12);
}

void main(){
  vec2 css = vec2(gl_FragCoord.x, uResolution.y - gl_FragCoord.y) / uDpr;
  vec2 q = css - uCentre;
  q.y = -q.y;
  vec2 u = q / uScale;     // the view's radii, y up
  float t = uTime;
  vec2 size = uResolution / uDpr;
  vec3 col = skyDeep(normalize(vec3((css - size * 0.5) / size.y * 1.3, -1.0)), 0.4) * 0.5;
  float r = length(u);
  col += mix(PEARL, GOLD, 0.4) * 0.07 * exp(-r * 0.9) + PEARL * 0.04 * fbm3(vec3(u * 1.2, t * 0.02));

  float spin = t * 0.03 + uYaw * 0.5;
  // level one: the whole, a vast pearl sphere
  col += orb(u, 1.0, PEARL, 1.0) * 0.6;
  // level two: five spheres inside it, each its own hue, turning about the middle
  for (int i = 0; i < 5; i++) {
    float fi = float(i);
    float a = spin + fi * TAU / 5.0 + 0.3 * sin(fi * 2.1);
    float d2 = 0.5 + 0.08 * sin(fi * 1.7);
    vec2 c2 = vec2(cos(a), sin(a) * 0.85) * d2;
    float r2 = 0.27 + 0.05 * hash3(vec3(fi, 2.0, 1.0));
    vec3 h2 = mix(hue(fi / 5.0 + 0.1), GOLD, 0.25);
    col += orb(u - c2, r2, h2, 3.0 + fi);
    // level three: smaller ones inside each, in still other hues, turning the other way
    if (uDetail > 0 || i < 3) {
      for (int k = 0; k < 4; k++) {
        float fk = float(k);
        float b = -spin * 2.3 + fk * TAU / 4.0 + fi;
        vec2 c3 = c2 + vec2(cos(b), sin(b)) * r2 * 0.52;
        float r3 = r2 * (0.24 + 0.06 * hash3(vec3(fi, fk, 7.0)));
        vec3 h3 = hue(fi / 5.0 + fk * 0.21 + 0.45);
        col += orb(u - c3, r3, h3, 11.0 + fi * 4.0 + fk) * 1.6;
        // and a bright point at each heart, a universe's own light
        col += h3 * exp(-length(u - c3) / (r3 * 0.12)) * 0.35;
      }
    }
  }
  // the very middle: where all of it meets, a soft white
  col += PEARL * exp(-r / 0.05) * 0.5;

  col = col / (1.0 + max(col - 0.85, 0.0) * 0.85);
  gl_FragColor = vec4(col, 1.0);
}
`;

const CONFIG: OrbConfig = {
  fragment: FRAGMENT,
  framing: (width, height) => Math.min(width * 0.28, height * 0.42),
  close: 1.3,
  arriveFrom: 0.3,
  detail: { low: 0, medium: 1, high: 2 },
};

export default function OmniverseScene(props: SceneProps) {
  return <primitive object={useOrbScene(CONFIG, props)} />;
}
