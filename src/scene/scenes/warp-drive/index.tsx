/**
 * Warp Drive (D-153, redrawn in D-191): our own illustration of an Alcubierre drive, an idea inside
 * the Starbase, as a machine. A long, slender gunmetal hull, nose to the right, runs through two
 * great rings, as warp craft are often drawn. The rings are the drive: each
 * a band of dark plating on four struts, its inner face a channel of electric-blue light with pulses
 * of energy running round it, and a soft glow of field about them. The craft sits in its bubble of
 * calm space: outside, the sky streams past, bunched and shifted blue ahead, drawn out into red
 * streaks behind; only a faint lens marks where the bubble's wall bends the starlight. Ray-marched
 * in one full-screen shader: one draw call, no particles. Its own colour family: indigo, electric
 * blue and ember red, with a gunmetal hull.
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
const vec3 METAL = vec3(0.5, 0.53, 0.6);
const vec3 AMBER = vec3(1.0, 0.68, 0.32);

const float RING_R = 0.72;           // the rings' radius
const float RING_A = -0.3;           // where they stand along the hull
const float RING_B = 0.24;
const float BUBBLE = 1.32;           // the bubble's radius on screen

/* the sky in a flat 2D frame: x along the flight, y across it */
vec3 skyAt(vec2 p){
  return skyDeep(normalize(vec3(p * 0.9, -1.0)), 0.6);
}

/* the hull's radius along its length: a needle nose, a broad middle, a stepped stern */
float hullR(float x){
  float nose = smoothstep(1.16, 0.55, x);
  float mid = 0.035 * smoothstep(0.34, 0.24, abs(x + 0.03));       // the broad middle, between the rings
  float stern = 0.03 * smoothstep(-0.74, -0.86, x);                // the engine block at the stern
  float cap = sqrt(clamp((x + 1.03) / 0.05, 0.0, 1.0));             // rounded off at the very end
  return (0.07 * nose + mid + stern) * cap;
}

float hull(vec3 p){
  float x = clamp(p.x, -1.02, 1.16);
  float d = length(p.yz) - hullR(x);
  d = max(d, abs(p.x - 0.07) - 1.09);
  return d * 0.8;
}

/* one ring: a flat band, wider along the hull than it is thick */
float ringAt(vec3 p, float xr){
  vec2 q = vec2(length(p.yz) - RING_R, p.x - xr);
  vec2 b = abs(q) - vec2(0.022, 0.055);
  return min(max(b.x, b.y), 0.0) + length(max(b, 0.0)) - 0.008;
}

float rings(vec3 p){ return min(ringAt(p, RING_A), ringAt(p, RING_B)); }

/* four struts from the hull out to each ring, set at 45 degrees */
float struts(vec3 p){
  float a = atan(p.z, p.y) + TAU / 8.0;
  float sector = TAU / 4.0;
  a = mod(a + sector * 0.5, sector) - sector * 0.5;
  float rho = length(p.yz);
  vec2 s = vec2(rho * cos(a), rho * sin(a));
  float along = abs(s.x - (RING_R + 0.08) * 0.5) - (RING_R - 0.08) * 0.5;
  float da = max(along, length(vec2(s.y, p.x - RING_A)) - 0.011);
  float db = max(along, length(vec2(s.y, p.x - RING_B)) - 0.011);
  return min(da, db);
}

/* id: 0 hull, 1 ring, 2 strut */
float craft(vec3 p, out float id){
  float h = hull(p);
  float r = rings(p);
  float s = struts(p);
  float d = h;
  id = 0.0;
  if (r < d) { d = r; id = 1.0; }
  if (s < d) { d = s; id = 2.0; }
  return d;
}

float sdf(vec3 p){ float id; return craft(p, id); }

vec3 normalAt(vec3 p){
  vec2 e = vec2(0.0012, 0.0);
  return normalize(vec3(sdf(p + e.xyy) - sdf(p - e.xyy), sdf(p + e.yxy) - sdf(p - e.yxy), sdf(p + e.yyx) - sdf(p - e.yyx)));
}

/* the pulses of energy running round a ring, 0 to 1 */
float pulses(vec3 p, float xr, float t){
  float a = atan(p.z, p.y);
  float dir = xr > 0.0 ? 1.0 : -1.0;                // the two rings run opposite ways
  float w = 0.5 + 0.5 * sin(a * 3.0 - dir * t * 2.6 + xr * 4.0);
  return 0.35 + 0.65 * pow(w, 6.0);
}

void main(){
  vec2 css = vec2(gl_FragCoord.x, uResolution.y - gl_FragCoord.y) / uDpr;
  vec2 q = css - uCentre;
  q.y = -q.y;
  vec2 u = q / uScale;     // the craft's lengths, y up
  float t = uTime;

  mat3 view = turnX(0.24 - uPitch) * turnY(-0.72 + uYaw);
  vec3 ro = view * vec3(0.0, 0.0, 4.2);
  vec3 rd = view * normalize(vec3(u, -4.2));
  vec3 L = view * normalize(vec3(-0.45, 0.6, 0.65));       // the galaxy's quasar, up and to the left

  // ---- the sky, bent by the bubble round the craft ----
  // the flight's direction on screen: the hull's axis seen through the view
  vec3 fx = vec3(1.0, 0.0, 0.0) * view;
  vec2 fwd = normalize(fx.xy);
  vec2 b = vec2(dot(u, fwd), dot(u, vec2(-fwd.y, fwd.x))) / BUBBLE;   // x along the flight, in bubble radii
  float r = length(b);
  float ahead = b.x / max(r, 1e-3);                 // 1 straight ahead, -1 straight behind
  float inside = 1.0 - smoothstep(0.9, 1.06, r);
  float outside = 1.0 - inside;
  float bend = exp(-max(r - 1.0, 0.0) * 1.6) * outside;
  vec2 p = b;
  p += (b / max(r, 1e-3)) * bend * mix(0.55, -0.25, 0.5 + 0.5 * ahead);
  float stretch = 1.0 + 5.0 * bend * smoothstep(0.1, -0.8, ahead);
  p.x = p.x / stretch;
  p.x += t * 0.22;                                  // outside, the sky streams past
  vec3 col = skyAt(p) * (0.75 + 0.6 * bend * smoothstep(-0.2, 0.8, ahead));
  vec3 tint = mix(vec3(1.0), ahead > 0.0 ? BLUE * 1.5 : EMBER * 1.6, clamp(abs(ahead) * bend * 1.4, 0.0, 0.85));
  col *= tint;
  // inside: calm, flat space, nearly still
  col = mix(col, skyAt(b * 0.92 + vec2(t * 0.012, 0.0)) * vec3(0.9, 0.93, 1.05), inside);
  // the wall: only a faint lens, brighter ahead where space is squeezed
  float lens = exp(-pow((r - 1.0) / 0.035, 2.0));
  col += mix(INDIGO, BLUE, smoothstep(-0.6, 0.9, ahead)) * lens * (0.1 + 0.16 * smoothstep(0.2, 1.0, ahead));

  // ---- the craft ----
  float glow = 0.0;
  float bq = dot(ro, rd);
  float cc = dot(ro, ro) - 1.4 * 1.4;
  float disc = bq * bq - cc;
  if (disc > 0.0) {
    float s = max(-bq - sqrt(disc), 0.0);
    float far = -bq + sqrt(disc);
    float id = 0.0;
    bool hit = false;
    for (int i = 0; i < 120; i++) {
      if (i >= 70 + 25 * uDetail || s > far) break;
      vec3 pp = ro + rd * s;
      float h = craft(pp, id);
      // the field about the rings: light gathered along the ray as it passes near them
      float dr = rings(pp);
      glow += exp(-max(dr, 0.0) * 22.0) * min(h, 0.06);
      if (h < 0.0006 * s) { hit = true; break; }
      s += h * 0.8;
    }
    // the field's colour: electric blue, whiter close in
    col += BLUE * glow * 1.6 + vec3(0.7, 0.85, 1.0) * glow * glow * 6.0;

    if (hit) {
      vec3 pp = ro + rd * s;
      vec3 n = normalAt(pp);
      vec3 v = -rd;
      float diff = max(dot(n, L), 0.0);
      float spec = pow(max(dot(reflect(-L, n), v), 0.0), 40.0);
      float rim = pow(1.0 - max(dot(n, v), 0.0), 3.0);
      // plating: panels of slightly different tone, cut by dark seams
      vec3 cell = pp * vec3(16.0, 22.0, 22.0);
      float plate = hash3(floor(cell));
      vec3 fc = abs(fract(cell) - 0.5);
      float seam = smoothstep(0.47, 0.5, max(fc.x, max(fc.y, fc.z)));
      vec3 metal = METAL * (0.75 + 0.18 * plate) * (1.0 - 0.2 * seam);
      // the rings light the hull from both sides; the night side keeps a deep indigo fill
      float near = exp(-min(abs(pp.x - RING_A), abs(pp.x - RING_B)) * 7.0);
      vec3 base = metal * (0.08 + 0.85 * diff) + INDIGO * 0.18 * (1.0 - diff) + vec3(0.9, 0.95, 1.0) * spec * 0.6
        + BLUE * rim * 0.25 + BLUE * metal * near * 0.5;

      if (id < 0.5) {
        // the hull: a row of amber windows along the broad middle, and running lights
        float mid = smoothstep(0.31, 0.26, abs(pp.x + 0.03));
        float a = atan(pp.z, pp.y);
        vec2 w = vec2(pp.x * 26.0, a * 4.0);
        vec2 wf = fract(w) - 0.5;
        float lit = step(0.45, hash3(vec3(floor(w), 3.0)));
        float win = smoothstep(0.3, 0.2, abs(wf.x)) * smoothstep(0.12, 0.06, abs(wf.y));
        base += AMBER * win * lit * mid * 0.9;
        // a blue beacon at the nose, a red one at the stern, blinking slowly
        float blink = step(0.85, fract(t * 0.5));
        base += BLUE * 3.0 * exp(-length(pp - vec3(1.13, 0.0, 0.0)) * 60.0);
        base += EMBER * 2.5 * blink * exp(-length(pp - vec3(-1.02, 0.0, 0.0)) * 50.0);
      }
      if (id > 0.5 && id < 1.5) {
        // a ring: dark plating outside, and on its inner face a channel of light with pulses running round
        float xr = abs(pp.x - RING_A) < abs(pp.x - RING_B) ? RING_A : RING_B;
        float rho = length(pp.yz);
        float innerFace = smoothstep(RING_R - 0.012, RING_R - 0.028, rho);
        float channel = smoothstep(0.03, 0.012, abs(pp.x - xr));
        float pulse = pulses(pp, xr, t);
        // segments of the band, like coils
        float a = atan(pp.z, pp.y);
        float coil = smoothstep(0.08, 0.2, abs(fract(a * 48.0 / TAU) - 0.5));
        base *= 0.55;
        base += BLUE * channel * innerFace * pulse * 2.2 * (0.7 + 0.3 * coil);
        base += vec3(0.85, 0.93, 1.0) * channel * innerFace * pow(pulse, 3.0) * 1.2;
        // the rim of each band carries a thinner line of light
        float edge = smoothstep(0.006, 0.0, abs(abs(pp.x - xr) - 0.05)) * (1.0 - innerFace);
        base += BLUE * edge * pulse * 0.8;
      }
      col = base + BLUE * glow * 0.6;
    }
  }

  col = col / (1.0 + max(col - 0.85, 0.0) * 0.85);
  gl_FragColor = vec4(col, 1.0);
}
`;

const CONFIG: OrbConfig = {
  fragment: FRAGMENT,
  // the craft about half a laptop's width; all the way in it nearly fills it
  framing: (width, height) => Math.min(width * 0.2, height * 0.3),
  close: 1.25,
  arriveFrom: 0.3,
  detail: { low: 0, medium: 1, high: 2 },
};

export default function WarpDriveScene(props: SceneProps) {
  return <primitive object={useOrbScene(CONFIG, props)} />;
}
