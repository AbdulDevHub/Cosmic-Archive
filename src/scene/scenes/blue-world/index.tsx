/**
 * Earth (D-128): our own illustration of the blue planet, close up, after the start page's planet
 * (`atlas/start.ts`) but much finer. Deep blue oceans with the Sun's glint on them, continents in
 * greens and tans under white polar ice, two layers of drifting cloud casting faint shadows, the
 * night side's cities in warm points of light, and a thin bright line of atmosphere along the
 * limb, brightest where the Sun grazes it. One draw call, no particles. Mounted by the host through
 * the registry; never imported by a page.
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
${SKY_CHUNK}

const vec3 DEEP = vec3(0.008, 0.035, 0.12);
const vec3 SEA = vec3(0.02, 0.13, 0.34);
const vec3 SHELF = vec3(0.05, 0.32, 0.5);
const vec3 FOREST = vec3(0.09, 0.24, 0.09);
const vec3 GRASS = vec3(0.3, 0.38, 0.16);
const vec3 DESERT = vec3(0.62, 0.48, 0.3);
const vec3 ICE = vec3(0.9, 0.94, 0.98);
const vec3 AIR = vec3(0.3, 0.6, 1.0);
const vec3 CITY = vec3(1.0, 0.72, 0.36);

vec3 sky(vec2 css){
  vec2 size = uResolution / uDpr;
  vec2 v = (css - size * 0.5) / size.y;
  return skyDeep(normalize(vec3(v * 1.4, -1.0)), 0.55);
}

float hash2(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

void main(){
  vec2 css = vec2(gl_FragCoord.x, uResolution.y - gl_FragCoord.y) / uDpr;
  vec2 q = css - uCentre;
  q.y = -q.y;
  vec2 u = q / uScale;     // the planet's radii, y up
  float r = length(u);
  float t = uTime;
  // tilted on its axis, turning slowly; a drag turns it further
  mat3 view = turnX(0.38 - uPitch) * turnY(uYaw + t * 0.02 + 2.2);
  vec3 L = normalize(vec3(-0.78, 0.32, 0.5));   // the Sun, to the upper left and in front

  vec3 col = sky(css);

  if (r < 1.0) {
    vec3 n = vec3(u, sqrt(1.0 - r * r));
    vec3 p = transpose(view) * n;      // a point on the globe
    float ndl = dot(n, L);
    float day = smoothstep(-0.08, 0.2, ndl);
    float mu = n.z;

    // the land: continents from warped noise, mountains and deserts inside them
    vec3 warp = vec3(fbm3(p * 1.8 + 3.0), fbm3(p * 1.8 + 9.0), fbm3(p * 1.8 + 15.0)) - 0.5;
    float h = fbm3(p * 2.4 + warp * 1.4 + 1.3);
    float coast = 0.565;
    float land = smoothstep(coast, coast + 0.012, h);
    float shelf = smoothstep(coast - 0.07, coast, h) * (1.0 - land);
    float dry = smoothstep(0.45, 0.7, fbm3(p * 3.2 + 5.0)) * (1.0 - smoothstep(0.55, 0.85, abs(p.y)));
    float detail = fbm3(p * 14.0);
    vec3 ground = mix(FOREST, GRASS, smoothstep(0.35, 0.7, detail));
    ground = mix(ground, DESERT, dry * 0.85);
    ground *= 0.8 + 0.4 * detail;
    float polar = smoothstep(0.87, 0.93, abs(p.y) + 0.04 * (detail - 0.5));
    vec3 ocean = mix(DEEP, SEA, smoothstep(0.25, 0.5, h));
    ocean = mix(ocean, SHELF, shelf * 0.7);
    vec3 surface = mix(ocean, ground, land);
    surface = mix(surface, ICE, polar);

    // clouds: a broad swirl and a finer layer, drifting faster than the ground turns
    mat3 drift = turnY(t * 0.006);
    vec3 cp = drift * p;
    vec3 cw = vec3(fbm3(cp * 2.0 + 21.0), fbm3(cp * 2.0 + 31.0), 0.0) - 0.5;
    float cloudA = smoothstep(0.5, 0.78, fbm3(cp * 3.0 + cw * 2.2 + 40.0));
    float cloudB = smoothstep(0.55, 0.85, fbm3(cp * 9.0 + cw * 3.0 + 50.0)) * 0.6;
    float cloud = clamp(cloudA + cloudB * (1.0 - cloudA), 0.0, 1.0);
    // a cloud's shadow falls a little toward the night side
    float shade = smoothstep(0.5, 0.78, fbm3((cp + L * 0.02) * 3.0 + cw * 2.2 + 40.0));

    vec3 lit = surface * (1.0 - 0.35 * shade * (1.0 - cloud));
    lit = mix(lit, vec3(0.95, 0.97, 1.0), cloud * 0.9);
    vec3 dayCol = lit * (0.04 + 1.05 * max(ndl, 0.0));
    // the Sun's glint on the open sea
    vec3 h2 = normalize(L + vec3(0.0, 0.0, 1.0));
    float glint = pow(max(dot(n, h2), 0.0), 60.0) * (1.0 - land) * (1.0 - cloud);
    dayCol += vec3(1.0, 0.92, 0.8) * glint * 1.4;
    dayCol += vec3(1.0, 0.85, 0.7) * pow(max(dot(n, h2), 0.0), 8.0) * (1.0 - land) * (1.0 - cloud) * 0.12;

    // the night side: cities in warm points, along coasts and in clusters, dimmed under cloud
    vec2 cell = vec2(atan(p.z, p.x) * 90.0, asin(clamp(p.y, -1.0, 1.0)) * 90.0);
    float spark = step(0.66, hash2(floor(cell))) * smoothstep(0.55, 0.85, fbm3(p * 7.0 + 60.0));
    float near = smoothstep(coast + 0.08, coast + 0.01, h);       // most crowd near the coasts
    float towns = spark * land * (0.35 + 0.65 * near) * (1.0 - polar);
    float glow = smoothstep(0.55, 0.8, fbm3(p * 7.0 + 60.0)) * land * (1.0 - polar) * 0.12;
    vec3 nightCol = CITY * (towns * 1.6 + glow * 1.6) * (1.0 - cloud * 0.8);
    nightCol += surface * 0.012;

    vec3 body = mix(nightCol, dayCol, day);
    // the atmosphere on the face: a thin blue haze thickening to the limb, brightest on the day side
    float limb = pow(1.0 - mu, 4.0);
    float rim = smoothstep(-0.25, 0.4, ndl);
    body = mix(body, AIR * (0.5 + 0.9 * rim), limb * 0.75 * rim);
    body += AIR * pow(1.0 - mu, 1.6) * 0.1 * rim;
    // the terminator glows faintly warm where sunset falls
    body += vec3(1.0, 0.45, 0.2) * exp(-pow(ndl / 0.12, 2.0)) * 0.03 * (1.0 - cloud * 0.5);

    col = mix(col, body, smoothstep(1.0, 0.996, r));
  }

  // ---- the thin bright line of air beyond the limb, lit where the Sun grazes it ----
  vec2 dir = r > 1e-4 ? u / r : vec2(0.0);
  float sunward = clamp(dot(dir, normalize(L.xy)) * 0.5 + 0.5, 0.0, 1.0);
  float out_ = max(r - 1.0, 0.0);
  float shell = exp(-out_ * 70.0) * step(0.996, r);
  float halo = exp(-out_ * 14.0) * step(1.0, r);
  col += AIR * (shell * 1.3 + halo * 0.4) * (0.15 + 1.1 * pow(sunward, 1.5));
  col += vec3(0.75, 0.88, 1.0) * shell * pow(sunward, 3.0) * 0.6;

  col = col / (1.0 + max(col - 0.9, 0.0) * 0.8);
  gl_FragColor = vec4(col, 1.0);
}
`;

const CONFIG: OrbConfig = {
  fragment: FRAGMENT,
  // at its framing a whole globe; all the way in it fills most of the window
  framing: (width, height) => Math.min(height * 0.25, width * 0.17),
  close: 1.45,
  arriveFrom: 0.3,
  detail: { low: 0, medium: 1, high: 2 },
};

export default function EarthScene(props: SceneProps) {
  return <primitive object={useOrbScene(CONFIG, props)} />;
}
