/**
 * A ringed giant (D-146): our own illustration of the solar system's ringed planet, close up. A
 * banded globe of butterscotch and cream clouds, turning slowly, lit from its star at the upper
 * left; round it, broad rings seen at a slant: a faint inner ring, a dense bright one, a dark gap,
 * and an outer ring with a thin gap of its own, all finely grooved and grainy. The rings cast a
 * thin band of shadow across the globe, and the globe casts its shadow across the rings behind it.
 * The ring plane is worked out per pixel (a plane and a sphere), so the near rings cross in front
 * of the globe and the far ones pass behind it. One draw call, no particles. Its own colour family:
 * butterscotch, cream and slate blue. Mounted by the host through the registry; never imported by
 * a page.
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

const vec3 BUTTER = vec3(0.86, 0.64, 0.36);
const vec3 CREAM = vec3(0.97, 0.9, 0.74);
const vec3 TAN = vec3(0.66, 0.46, 0.3);
const vec3 SLATE = vec3(0.3, 0.36, 0.55);
const float ROLL = 0.32;           // the whole system leans this much on screen
const vec3 LIGHT = vec3(-0.78, 0.34, 0.52);

/* how much of the sky a ring blocks at radius p (in the planet's radii), 0 to 1 */
float rings(float p){
  float c = smoothstep(1.24, 1.3, p) * (1.0 - smoothstep(1.5, 1.53, p)) * 0.22;
  float b = smoothstep(1.52, 1.56, p) * (1.0 - smoothstep(1.93, 1.95, p)) * 0.92;
  float a = smoothstep(2.0, 2.03, p) * (1.0 - smoothstep(2.26, 2.29, p)) * 0.68;
  float encke = 1.0 - 0.85 * exp(-pow((p - 2.2) / 0.006, 2.0));
  float grooves = 0.78 + 0.22 * sin(p * 210.0) * sin(p * 37.0 + 1.3);
  float grain = 0.85 + 0.3 * hash3(vec3(floor(p * 900.0), 1.0, 2.0));
  return clamp((c + b + a * encke) * grooves * grain, 0.0, 1.0);
}

/* the rings' own colour at radius p */
vec3 ringTint(float p){
  vec3 tint = mix(TAN * 0.8, CREAM, smoothstep(1.5, 1.8, p));
  tint = mix(tint, BUTTER, smoothstep(2.0, 2.25, p) * 0.5);
  return tint * (0.9 + 0.2 * sin(p * 55.0));
}

void main(){
  vec2 css = vec2(gl_FragCoord.x, uResolution.y - gl_FragCoord.y) / uDpr;
  vec2 q = css - uCentre;
  q.y = -q.y;
  vec2 u0 = q / uScale;     // the planet's radii, y up
  float t = uTime;
  vec2 size = uResolution / uDpr;
  // undo the system's lean, so the maths below can keep the ring plane level
  float cr = cos(ROLL), sr = sin(ROLL);
  vec2 u = vec2(cr * u0.x + sr * u0.y, -sr * u0.x + cr * u0.y);

  vec2 v = (css - size * 0.5) / size.y;
  vec3 col = skyDeep(normalize(vec3(v * 1.4, -1.0)), 0.65);

  // the ring plane's normal, toward the viewer a little: a drag tilts it
  float tilt = clamp(0.36 + uPitch * 0.5, 0.12, 0.9);
  vec3 N = vec3(0.0, cos(tilt), sin(tilt));
  vec3 L = normalize(LIGHT);
  float r = length(u);

  // ---- where this pixel's sight line meets the ring plane and the globe ----
  float zr = -u.y * N.y / N.z;
  vec3 R = vec3(u, zr);
  float p = length(R);
  float ring = rings(p);
  bool onGlobe = r < 1.0;
  float zg = onGlobe ? sqrt(1.0 - r * r) : -99.0;

  // the rings: lit by the star, dark where the globe hides it
  vec3 ringCol = vec3(0.0);
  if (ring > 0.0) {
    float b = dot(R, L);
    float c = dot(R, R) - 1.0;
    float shade = (b < 0.0 && b * b - c > 0.0) ? 0.06 : 1.0;
    ringCol = ringTint(p) * (0.25 + 0.8 * abs(dot(L, N))) * shade;
    ringCol += SLATE * 0.04 * (1.0 - shade);
  }

  // behind the globe: rings first, then the globe over them
  if (ring > 0.0 && zr < zg) col = mix(col, ringCol, ring);

  if (onGlobe) {
    vec3 P = vec3(u, zg);
    // the globe's own frame: latitude along the ring plane's normal, longitude round it
    float lat = dot(P, N);
    vec3 e1 = vec3(1.0, 0.0, 0.0);
    vec3 e2 = normalize(cross(N, e1));
    float lon = atan(dot(P, e2), dot(P, e1)) + t * 0.04 + uYaw;
    vec3 sp = vec3(lat * 6.0, cos(lon) * 1.5, sin(lon) * 1.5);
    float swirl = fbm3(sp * vec3(1.0, 1.2, 1.2) + vec3(0.0, t * 0.01, 0.0));
    float bandsAt = lat * 11.0 + 0.9 * swirl;
    vec3 cloud = mix(BUTTER, CREAM, 0.5 + 0.5 * sin(bandsAt * 1.7));
    cloud = mix(cloud, TAN, smoothstep(0.55, 0.9, sin(bandsAt * 0.9 + 2.0)) * 0.45);
    cloud *= 0.92 + 0.08 * sin(bandsAt * 6.3) + 0.05 * sin(bandsAt * 13.0 + swirl * 4.0);
    // a pale storm in the south
    float storm = exp(-pow((lat + 0.45) / 0.05, 2.0) - pow(sin((lon - 1.0) * 0.5) / 0.12, 2.0));
    cloud = mix(cloud, CREAM * 1.05, storm * 0.6);
    // the poles go blue-grey
    cloud = mix(cloud, SLATE * 1.3, smoothstep(0.75, 0.95, abs(lat)) * 0.6);

    float lit = max(dot(P, L), 0.0);
    vec3 shade = cloud * (0.02 + 1.15 * pow(lit, 0.85));
    // the rings' shadow across it: follow the light back to the ring plane
    float ln = dot(L, N);
    if (abs(ln) > 1e-3) {
      float s = -dot(P, N) / ln;
      if (s > 0.0) shade *= 1.0 - 0.8 * rings(length(P + s * L));
    }
    // a thin haze at the lit limb
    shade += vec3(0.9, 0.75, 0.55) * pow(1.0 - zg, 3.0) * smoothstep(-0.1, 0.4, dot(P, L)) * 0.25;
    col = mix(col, shade, smoothstep(1.0, 0.993, r));
  }

  // in front of the globe: the near rings cross over it
  if (ring > 0.0 && zr >= zg) col = mix(col, ringCol, ring);

  col = col / (1.0 + max(col - 0.85, 0.0) * 0.9);
  gl_FragColor = vec4(col, 1.0);
}
`;

const CONFIG: OrbConfig = {
  fragment: FRAGMENT,
  framing: (width, height) => Math.min(height * 0.17, width * 0.12),
  close: 1.5,
  arriveFrom: 0.3,
  detail: { low: 0, medium: 1, high: 2 },
};

export default function RingedGiantScene(props: SceneProps) {
  return <primitive object={useOrbScene(CONFIG, props)} />;
}
