/**
 * Its Moon (D-129; the Blue World's moon since D-132; the asteroid that tumbled past it moved out
 * beside it in D-194): our own illustration of a moon, grey and pitted, lit hard from one side
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
 * D-138: no two craters alike, so none looks stamped. Sizes follow a steep power law (a few large,
 * many small); each has its own age: fresh ones are deep with a crisp rim, old ones are worn
 * almost flat; the rim is a gentle lip, not a ring; each crater is a little out of round.
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
    float rad = 0.17 + 0.36 * pow(hash3(cell + 5.9), 2.2);
    float a = atan(c.y, c.x);
    float wobble = 1.0 + 0.07 * sin(a * 3.0 + hash3(cell + 4.4) * 6.3) + 0.04 * sin(a * 5.0 + hash3(cell + 6.6) * 6.3);
    float d = length(c) / (rad * wobble);
    if (d > 2.4) continue;
    float age = hash3(cell + 7.3);                     // 0 fresh, 1 worn
    float fresh = mix(1.0, 0.3, age * age);
    float sharp = mix(0.13, 0.32, age);                // old rims are rounded off
    // a bowl inside (flat-floored when large), a raised lip, a soft apron of ejecta outside
    float bowl = (min(d * d, 1.0) - 1.0) * 0.5 * smoothstep(1.08, 0.82, d) * mix(1.0, 0.6, smoothstep(0.25, 0.45, rad) * smoothstep(0.55, 0.2, d));
    float rq = (d - 1.0) / sharp;
    float rim = exp(-rq * rq) * 0.2;
    float aq = (d - 1.3) / 0.5;
    float apron = exp(-aq * aq) * 0.05;
    h += (bowl + rim + apron) * rad * fresh;
    // only a few fresh craters throw pale rays across the ground round them
    if (age < 0.25 && hash3(cell + 8.1) > 0.6) {
      float ra = a * 9.0 + hash3(cell) * 6.0;
      ray += smoothstep(0.55, 1.0, abs(sin(ra)) * abs(sin(ra * 1.7 + 1.3))) * smoothstep(2.4, 1.0, d) * step(1.0, d) * 0.45;
    }
  }
  return h;
}

float ground(vec3 p, out float mare, out float rays){
  rays = 0.0;
  // the maria (D-138): broad dark plains whose shores wander (a warped field) and fade over a
  // wide band, flooded smooth and set only slightly lower, so no cliff or block marks their edge
  vec3 warp = vec3(noise3(p * 2.3 + 1.0), noise3(p * 2.3 + 5.0), noise3(p * 2.3 + 9.0)) - 0.5;
  float basins = fbm3(p * 1.5 + warp * 0.9 + 4.0);
  mare = smoothstep(0.5, 0.63, basins + 0.07 * (noise3(p * 7.0) - 0.5));
  float high = 1.0 - mare;
  float h = high * fbm3(p * 5.0 + 2.0) * 0.05 - mare * 0.004;  // rugged highlands, plains a touch lower
  // the highlands are saturated with craters; the younger plains hold far fewer
  h += craters(p, 2.6, 0.32, rays) * 0.14 * (1.0 - 0.55 * mare);
  h += craters(p, 6.5, 0.62, rays) * 0.07 * (1.0 - 0.7 * mare);
  // the finest layers only on the high tier: each layer is 27 cells, three times a pixel (bump map)
  if (uDetail > 0) {
    h += craters(p, 15.0, 0.7, rays) * 0.032 * (1.0 - 0.75 * mare);
    h += craters(p, 34.0, 0.75, rays) * 0.014 * (1.0 - 0.8 * mare);
  }
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
    vec3 bump = normalize(p - (tx * (hx - h) + ty * (hy - h)) / e * 0.75);
    vec3 nb = view * bump;

    // hard light, no air: almost nothing in the shadows, a sharp terminator. Dust on an airless
    // world scatters light back (Lommel-Seeliger), so the full disc reads evenly bright, not
    // shaded like a ball; the slopes still catch it (D-138)
    float mu0 = max(dot(nb, L), 0.0);
    float mu = max(n.z, 0.05);
    float lit = smoothstep(-0.02, 0.06, dot(n, L)) * min(2.0 * mu0 / (mu0 + mu), 1.35) * mix(0.55, 1.0, mu0);
    float tone = fbm3(p * 9.0 + 3.0);
    vec3 maria = MARE * mix(vec3(0.94, 0.96, 1.06), vec3(1.08, 1.0, 0.9), tone);  // bluer and browner flows
    vec3 albedo = mix(HIGHLAND * (0.88 + 0.24 * tone), maria * (0.85 + 0.3 * tone), mare);
    albedo = mix(albedo, WARM * 0.95, clamp(rays, 0.0, 1.0) * (1.0 - mare * 0.5) * 0.4);
    vec3 body = albedo * WARM * lit * 1.05 + albedo * 0.012;
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
  // closer than the planet it circles (D-195): about three fifths of a laptop's height across
  framing: (width, height) => Math.min(height * 0.3, width * 0.2),
  close: 1.45,
  arriveFrom: 0.3,
  detail: { low: 0, medium: 0, high: 1 },
};

export default function MoonScene(props: SceneProps) {
  return <primitive object={useOrbScene(CONFIG, props)} />;
}
