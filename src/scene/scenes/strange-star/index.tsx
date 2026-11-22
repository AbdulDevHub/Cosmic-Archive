/**
 * A strange star (D-117): our own illustration of a candidate that may be made of quarks, not
 * neutrons. Smaller and stranger than the neutron star: a hard, pale ball whose surface shimmers
 * with shifting iridescent colour, wrapped in a thin, crackling shell of light, with a faint
 * swirl of gas falling onto it. One draw call, no particles. Mounted by the host through the
 * registry; never imported by a page.
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

const vec3 WHITE = vec3(0.96, 0.97, 1.0);
const vec3 CYAN = vec3(0.35, 0.95, 0.9);
const vec3 VIOLET = vec3(0.62, 0.35, 1.0);
const vec3 ROSE = vec3(1.0, 0.36, 0.72);
const vec3 GREEN = vec3(0.45, 1.0, 0.6);

vec3 sky(vec2 css, vec2 u, float r){
  vec2 size = uResolution / uDpr;
  // like a neutron star, it bends the light passing close to it
  vec2 bent = css + (r > 1.0 ? normalize(u) * vec2(1.0, -1.0) * uScale * 1.9 / r : vec2(0.0));
  vec2 v = (bent - size * 0.5) / size.y;
  return skyDeep(normalize(vec3(v * 1.4, -1.0)), 0.7);
}

/* the strange shimmer: colour that slides round the hue wheel as the pattern shifts */
vec3 iridescent(float x){
  return 0.5 + 0.5 * cos(TAU * (x + vec3(0.0, 0.33, 0.67)));
}

void main(){
  vec2 css = vec2(gl_FragCoord.x, uResolution.y - gl_FragCoord.y) / uDpr;
  vec2 q = css - uCentre;
  q.y = -q.y;
  vec2 u = q / uScale;
  float r = length(u);
  float t = uTime;
  mat3 view = turnX(0.3 - uPitch) * turnY(uYaw + t * 0.35);

  vec3 col = sky(css, u, r);

  // ---- a faint swirl of gas falling in, in the plane of its spin ----
  vec3 axis = view * vec3(0.0, 1.0, 0.0);
  float z = abs(axis.z) > 0.03 ? -(u.x * axis.x + u.y * axis.y) / axis.z : 1e3;
  vec3 onPlane = transpose(view) * vec3(u, z);
  float pr = length(onPlane.xz);
  float ang = atan(onPlane.z, onPlane.x);
  float swirl = fbm3(vec3(cos(ang - 2.2 * log(pr + 0.2)) * 2.0, sin(ang - 2.2 * log(pr + 0.2)) * 2.0, t * 0.1));
  float disc = smoothstep(1.2, 1.7, pr) * exp(-pr * 0.32) * (0.3 + 0.9 * swirl);
  float discHidden = (z < 0.0 && r < 1.0) ? 0.0 : 1.0;
  col += mix(VIOLET, ROSE, swirl) * disc * 0.55 * discHidden * step(z, 1e2);

  // ---- the star: pale and hard, its surface shimmering in shifting colours ----
  float body = 0.0;
  if (r < 1.0) {
    vec3 n = vec3(u, sqrt(1.0 - r * r));
    vec3 b = transpose(view) * n;
    float mu = n.z;
    float cells = fbm3(b * 7.0 + vec3(0.0, 0.0, t * 0.2));
    float sheen = fbm3(b * 3.0 - vec3(t * 0.08));
    vec3 shimmer = iridescent(cells * 1.6 + sheen * 0.8 + t * 0.05);
    vec3 surface = mix(WHITE, shimmer, 0.55) * (0.6 + 0.6 * cells);
    surface += WHITE * pow(mu, 6.0) * 0.6;                 // a hard white glint in the middle
    surface += mix(CYAN, VIOLET, sheen) * pow(1.0 - mu, 2.5) * 0.9;  // its edge glows cold
    body = smoothstep(1.0, 0.985, r);
    col = mix(col, surface * 1.2, body);
  }

  // ---- a thin shell of light round it, crackling ----
  float a = atan(u.y, u.x);
  float crackle = fbm3(vec3(cos(a) * 9.0, sin(a) * 9.0, t * 0.9));
  float shell = exp(-pow((r - 1.04) / (0.025 + 0.03 * crackle), 2.0));
  col += mix(CYAN, GREEN, crackle) * shell * (0.9 + 1.4 * crackle);
  // arcs of light leaping off the shell now and then
  float leap = smoothstep(0.7, 0.85, fbm3(vec3(cos(a) * 4.0, sin(a) * 4.0, t * 0.6 + 20.0)));
  col += mix(CYAN, WHITE, 0.4) * leap * exp(-max(r - 1.0, 0.0) * 6.0) * step(1.0, r) * 1.1;
  // the glare
  col += mix(VIOLET, CYAN, 0.5) * (0.5 * exp(-max(r - 1.0, 0.0) * 2.8) * step(1.0, r) + 0.12 / (1.0 + r * r * 0.5));

  col = col / (1.0 + max(col - 0.85, 0.0) * 0.9);
  gl_FragColor = vec4(col, 1.0);
}
`;

const CONFIG: OrbConfig = {
  fragment: FRAGMENT,
  framing: (width, height) => Math.min(height * 0.06, width * 0.04),
  close: 3.0,
  arriveFrom: 0.3,
  detail: { low: 0, medium: 1, high: 2 },
};

export default function StrangeStarScene(props: SceneProps) {
  return <primitive object={useOrbScene(CONFIG, props)} />;
}
