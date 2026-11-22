/**
 * Its Moon (D-129; the Blue World's moon since D-132, with an asteroid tumbling past it, a hotspot,
 * D-133): our own illustration of a moon, grey and pitted, lit hard from one side
 * with no air to soften it. Dark maria lie across the bright, rugged highlands; craters of every
 * size crowd the surface, each with a shadowed floor, a lit far wall and a raised rim, a few young
 * ones throwing pale rays; the terminator is sharp, and the night side is all but black. One draw
 * call, no particles. Mounted by the host through the registry; never imported by a page.
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

const vec3 HIGHLAND = vec3(0.74, 0.72, 0.7);
const vec3 MARE = vec3(0.26, 0.26, 0.28);
const vec3 WARM = vec3(1.0, 0.97, 0.92);

vec3 sky(vec2 css){
  vec2 size = uResolution / uDpr;
  vec2 v = (css - size * 0.5) / size.y;
  return skyDeep(normalize(vec3(v * 1.4, -1.0)), 0.5);
}

/*
 * Craters on the sphere: cells of a 3D grid, each holding at most one crater (a random size, or
 * none). Returns the height change at p and adds the fresh craters' rays to ray.
 */
float craters(vec3 p, float scale, float keep, inout float ray){
  vec3 g = p * scale;
  vec3 i = floor(g), f = fract(g);
  float h = 0.0;
  for (int z = -1; z <= 1; z++)
  for (int y = -1; y <= 1; y++)
  for (int x = -1; x <= 1; x++) {
    vec3 o = vec3(float(x), float(y), float(z));
    vec3 cell = i + o;
    float pick = hash3(cell + 0.37);
    if (pick > keep) continue;
    vec3 c = o + vec3(hash3(cell + 1.1), hash3(cell + 2.3), hash3(cell + 3.7)) * 0.8 + 0.1 - f;
    float rad = 0.18 + 0.32 * hash3(cell + 5.9);
    float d = length(c) / rad;
    if (d > 2.6) continue;
    // a bowl inside, a raised rim, a soft apron outside
    float bowl = (d * d - 1.0) * 0.55 * smoothstep(1.05, 0.9, d);
    float rim = exp(-pow((d - 1.0) / 0.14, 2.0)) * 0.35;
    float apron = exp(-pow((d - 1.2) / 0.4, 2.0)) * 0.08;
    h += (bowl + rim + apron) * rad;
    // a young crater throws pale rays across the ground round it
    if (hash3(cell + 8.1) > 0.85) {
      float a = atan(c.y, c.x) * 7.0 + hash3(cell) * 6.0;
      ray += smoothstep(0.5, 1.0, abs(sin(a)) * abs(sin(a * 1.7))) * smoothstep(2.6, 1.0, d) * step(1.0, d) * 0.5;
    }
  }
  return h;
}

float ground(vec3 p, out float mare, out float rays){
  rays = 0.0;
  // the maria: broad, smooth, dark plains in a few great basins
  float basins = fbm3(p * 1.9 + 4.0);
  mare = smoothstep(0.54, 0.59, basins + 0.08 * (fbm3(p * 6.0) - 0.5));
  float h = (1.0 - mare) * fbm3(p * 5.0 + 2.0) * 0.06;       // rugged highlands
  h += craters(p, 3.0, 0.5, rays) * 0.12 * (1.0 - 0.5 * mare);
  h += craters(p, 8.0, 0.6, rays) * 0.05 * (1.0 - 0.6 * mare);
  if (uDetail > 0) h += craters(p, 20.0, 0.7, rays) * 0.02 * (1.0 - 0.6 * mare);
  return h;
}

void main(){
  vec2 css = vec2(gl_FragCoord.x, uResolution.y - gl_FragCoord.y) / uDpr;
  vec2 q = css - uCentre;
  q.y = -q.y;
  vec2 u = q / uScale;     // the Moon's radii, y up
  float r = length(u);
  float t = uTime;
  mat3 view = turnX(0.12 - uPitch) * turnY(uYaw + t * 0.008 + 0.4);
  vec3 L = normalize(vec3(-0.78, 0.22, 0.6));   // the Sun, hard from the left

  vec3 col = sky(css);

  // ---- an asteroid tumbling past (D-133): a lumpy dark rock, lit from the same side ----
  vec2 au = (u - uMark[0].xy) / 0.085;
  float aa = atan(au.y, au.x);
  float ar = length(au);
  float lump = 1.0 + 0.22 * (noise3(vec3(cos(aa), sin(aa), t * 0.05) * 1.6) - 0.5) + 0.08 * (noise3(vec3(cos(aa), sin(aa), 3.0) * 5.0) - 0.5);
  if (ar < lump) {
    vec2 an = au / lump;
    vec3 n3 = vec3(an, sqrt(max(1.0 - dot(an, an), 0.0)));
    vec3 ap = turnY(t * 0.3) * turnX(t * 0.17) * n3;
    n3 = normalize(n3 + 0.35 * (vec3(noise3(ap * 5.0), noise3(ap * 5.0 + 7.0), noise3(ap * 5.0 + 13.0)) - 0.5));
    float pit = smoothstep(0.62, 0.8, noise3(ap * 8.0));
    vec3 rock = vec3(0.42, 0.38, 0.34) * (0.75 + 0.4 * noise3(ap * 14.0)) * (1.0 - 0.4 * pit);
    vec3 shade = rock * (0.02 + 1.2 * max(dot(n3, L), 0.0));
    col = mix(col, shade, smoothstep(lump, lump - 0.06, ar));
  }

  if (r < 1.0) {
    vec3 n = vec3(u, sqrt(1.0 - r * r));
    mat3 back = transpose(view);
    vec3 p = back * n;
    float mare, rays;
    float h = ground(p, mare, rays);
    // the slope from the height's change across the surface: a bump map along two tangents
    float e = 0.004;
    vec3 tx = normalize(cross(vec3(0.0, 1.0, 0.0), p) + vec3(1e-4));
    vec3 ty = cross(p, tx);
    float m2, r2;
    float hx = ground(normalize(p + tx * e), m2, r2);
    float hy = ground(normalize(p + ty * e), m2, r2);
    vec3 bump = normalize(p - (tx * (hx - h) + ty * (hy - h)) / e * 0.9);
    vec3 nb = view * bump;

    float ndl = dot(nb, L);
    float lambert = max(ndl, 0.0);
    // hard light, no air: almost nothing in the shadows, a sharp terminator
    float lit = smoothstep(-0.02, 0.06, dot(n, L)) * lambert;
    vec3 albedo = mix(HIGHLAND, MARE, mare) * (0.85 + 0.3 * fbm3(p * 12.0));
    albedo = mix(albedo, WARM * 0.95, clamp(rays, 0.0, 1.0) * (1.0 - mare * 0.5) * 0.45);
    vec3 body = albedo * WARM * lit * 1.45 + albedo * 0.012;
    // earthshine: the faintest blue on the night side
    body += vec3(0.2, 0.3, 0.5) * albedo * 0.025 * smoothstep(0.1, -0.3, dot(n, L));
    col = mix(col, body, smoothstep(1.0, 0.995, r));
  }

  // no atmosphere: only the faintest glow where the lit limb meets space
  vec2 dir = r > 1e-4 ? u / r : vec2(0.0);
  float sunward = clamp(dot(dir, normalize(L.xy)), 0.0, 1.0);
  col += WARM * exp(-max(r - 1.0, 0.0) * 40.0) * step(1.0, r) * sunward * 0.12;

  col = col / (1.0 + max(col - 0.9, 0.0) * 0.8);
  gl_FragColor = vec4(col, 1.0);
}
`;

const CONFIG: OrbConfig = {
  fragment: FRAGMENT,
  framing: (width, height) => Math.min(height * 0.25, width * 0.17),
  close: 1.45,
  arriveFrom: 0.3,
  detail: { low: 0, medium: 0, high: 1 },
  // an asteroid tumbling past, upper left (D-133): a hotspot that dives into the Asteroid's page
  bodies: (t) => [{ name: "asteroid", x: -1.6 + 0.06 * Math.sin(t * 0.02), y: 0.72 + 0.04 * Math.cos(t * 0.025), z: 0.3 }],
  diveScale: 9,
};

export default function MoonScene(props: SceneProps) {
  return <primitive object={useOrbScene(CONFIG, props)} />;
}
