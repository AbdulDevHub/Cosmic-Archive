/**
 * A Solar System (D-132): our own illustration of a yellow star and the worlds it rules, seen from
 * above its plane: a hot little rock, the blue world (a hotspot), a belt of asteroids, a ringed
 * giant and an ice giant far out. Nothing is drawn but the bodies and their light: no orbit lines
 * (D-094). One full-screen shader, no particles. The star and the blue world are places of their
 * own; a click dives into either (the orb's dive, D-132).
 *
 * The bodies are placed here, in TypeScript, and handed to the shader (`uMark`), so the hotspots
 * stand exactly where the shader draws them. A drag turns the system about its star and tilts it.
 */

import type { SceneBudget, SceneProps } from "../../host/types";
import { SKY_CHUNK } from "../../shaders/sky.glsl";
import { ORB_COMMON, useOrbScene, type OrbBody, type OrbConfig } from "../shared/orb";

export const budget: SceneBudget = {
  drawCalls: 1,
  particles: { low: 0, medium: 0, high: 0 }, // no particles: the cost is per pixel
};

/** The plane is seen this far from edge on, in radians; a drag tilts it further or flatter. */
const TILT = 0.42;
const tiltOf = (pitch: number) => Math.min(0.75, Math.max(0.16, TILT + pitch * 0.8));

/** The planets: orbit radius (in the system's radius), angular speed (radians a second), where each starts. */
const ORBITS = [
  { a: 0.2, w: 0.05, from: 4.5 }, // a hot little rock
  { a: 0.36, w: 0.03, from: 3.3 }, // the blue world: at the opening, beside the star, its lit face toward us
  { a: 0.72, w: 0.012, from: -0.45 }, // the ringed giant, a little beyond the star
  { a: 0.95, w: 0.007, from: 3.6 }, // the ice giant
] as const;
const MOON = { a: 0.06, w: 0.35 };

/** A point in the system's plane, turned by the drag and seen from the tilt: x right, y up, z toward the visitor. */
function seen(x: number, z: number, yaw: number, tilt: number): OrbBody {
  const c = Math.cos(yaw);
  const s = Math.sin(yaw);
  const X = c * x - s * z;
  const Z = s * x + c * z;
  return { x: X, y: -Z * Math.sin(tilt), z: Z * Math.cos(tilt) };
}

function bodies(t: number, yaw: number, pitch: number): OrbBody[] {
  const tilt = tiltOf(pitch);
  const out: OrbBody[] = [{ name: "star", x: 0, y: 0, z: 0 }];
  for (const [i, o] of ORBITS.entries()) {
    const th = o.from + o.w * t;
    const body = seen(o.a * Math.cos(th), o.a * Math.sin(th), yaw, tilt);
    if (i === 1) body.name = "planet";
    out.push(body);
  }
  // the blue world's moon, round it in the same plane
  const th = ORBITS[1].from + ORBITS[1].w * t;
  const m = MOON.w * t;
  out.push(seen(ORBITS[1].a * Math.cos(th) + MOON.a * Math.cos(m), ORBITS[1].a * Math.sin(th) + MOON.a * Math.sin(m), yaw, tilt));
  return out;
}

const FRAGMENT = /* glsl */ `
${ORB_COMMON}
${SKY_CHUNK}


const vec3 STAR = vec3(1.0, 0.86, 0.6);
const vec3 HOT = vec3(1.0, 0.62, 0.28);
// the radius of each body (uMark[i]), in the system's radius: drawn larger than life, so each reads
const float R_STAR = 0.07;
const float R_ROCK = 0.016;
const float R_BLUE = 0.03;
const float R_GIANT = 0.07;
const float R_ICE = 0.042;
const float R_MOON = 0.008;

vec3 sky(vec2 css){
  vec2 size = uResolution / uDpr;
  vec2 v = (css - size * 0.5) / size.y;
  return skyDeep(normalize(vec3(v * 1.4, -1.0)), 0.5);
}

/* a lit sphere: the surface normal at u on a body at c of radius r, and how much of it there is */
float disc(vec2 u, vec3 c, float r, out vec3 n){
  vec2 d = (u - c.xy) / r;
  float q = dot(d, d);
  n = vec3(d, sqrt(max(1.0 - q, 0.0)));
  return smoothstep(1.0, 0.94, q);
}

void main(){
  vec2 css = vec2(gl_FragCoord.x, uResolution.y - gl_FragCoord.y) / uDpr;
  vec2 q = css - uCentre;
  q.y = -q.y;
  vec2 u = q / uScale;     // the system's radii, y up
  float t = uTime;
  // the plane's tilt: as tiltOf() in TypeScript, from the drag's tilt
  float uTilt = clamp(0.42 + uPitch * 0.8, 0.16, 0.75);
  float st = sin(uTilt);

  vec3 col = sky(css);

  // ---- the asteroid belt: grains in the plane between the blue world and the giant ----
  // back onto the plane: the point of the plane that lies under this pixel
  vec2 pl = vec2(u.x, -u.y / st);
  float c = cos(-uYaw), s = sin(-uYaw);
  vec2 flat_ = vec2(c * pl.x - s * pl.y, s * pl.x + c * pl.y);
  float pr = length(flat_);
  float belt = smoothstep(0.47, 0.52, pr) * (1.0 - smoothstep(0.58, 0.63, pr));
  if (belt > 0.0) {
    float ang = atan(flat_.y, flat_.x) - t * 0.02;
    vec2 cell = vec2(ang * 260.0, pr * 520.0);
    vec2 id = floor(cell);
    float h = hash3(vec3(id, 5.0));
    float grain = step(0.86, h) * exp(-length(fract(cell) - 0.5) * 6.0);
    float clump = 0.5 + 0.8 * noise3(vec3(ang * 6.0, pr * 20.0, 1.0));
    col += vec3(0.85, 0.75, 0.62) * grain * belt * clump * 0.9;
    col += vec3(0.5, 0.42, 0.36) * belt * 0.03 * clump;
  }

  // ---- the star's light, filling the space round it ----
  float rs = length(u);
  col += STAR * 0.5 * exp(-rs / 0.05) + HOT * 0.22 * exp(-rs / 0.16) + vec3(0.9, 0.55, 0.4) * 0.05 * exp(-rs / 0.5);
  // long faint spikes of glare
  float spike = exp(-abs(u.y) * 300.0) * exp(-abs(u.x) * 3.0) + exp(-abs(u.x) * 300.0) * exp(-abs(u.y) * 6.0);
  col += STAR * spike * 0.25;

  // ---- the bodies, nearest wins ----
  float best = -9.0;
  vec3 body = vec3(0.0);
  float cover = 0.0;
  vec3 n;

  // the star itself
  float a = disc(u, uMark[0], R_STAR, n);
  if (a > 0.0) {
    float limb = pow(n.z, 0.45);
    float gran = noise3(vec3(n.xy * 30.0, t * 0.15)) * 0.25 + noise3(vec3(n.xy * 9.0, t * 0.05 + 4.0)) * 0.2;
    body = mix(HOT * 0.75, vec3(1.0, 0.9, 0.72), limb) * (0.72 + gran);
    best = 0.0;
    cover = a;
  }

  for (int i = 1; i < 6; i++) {
    vec3 m = uMark[i];
    float r = i == 1 ? R_ROCK : i == 2 ? R_BLUE : i == 3 ? R_GIANT : i == 4 ? R_ICE : R_MOON;

    // the giant's rings lie in the plane, so they are seen through the same tilt: the far half
    // behind the planet, the near half across it
    float ring = 0.0;
    float ringZ = -9.0;
    float near = 0.0;
    vec3 ringCol = vec3(0.0);
    if (i == 3) {
      vec2 d = u - m.xy;
      vec2 rp = vec2(d.x, -d.y / st) / r;
      float rr = length(rp);
      float gap = smoothstep(1.84, 1.88, rr) * (1.0 - smoothstep(1.93, 1.97, rr));
      ring = smoothstep(1.45, 1.55, rr) * (1.0 - smoothstep(2.25, 2.35, rr)) * (0.6 + 0.4 * sin(rr * 40.0)) * (1.0 - 0.8 * gap);
      ringZ = m.z + rp.y * r * cos(uTilt);
      near = step(0.0, rp.y);
      vec3 Lr = normalize(-m);
      ringCol = vec3(0.85, 0.76, 0.6) * (0.35 + 0.65 * max(Lr.z * 0.5 + 0.5, 0.0));
      if (ring > 0.0 && near < 0.5 && ringZ > best) {
        body = mix(body, ringCol, ring * 0.8);
        cover = max(cover, ring * 0.8);
      }
    }

    a = disc(u, m, r, n);
    if (a > 0.0 && m.z > best) {
      vec3 L = normalize(-m);              // toward the star
      float ndl = dot(n, L);
      float lit = max(ndl, 0.0);
      vec3 sp = turnY(t * 0.05 + float(i)) * n;  // a point on its turning globe
      vec3 surf;
      if (i == 1) {
        surf = mix(vec3(0.45, 0.36, 0.3), vec3(0.75, 0.55, 0.4), noise3(sp * 6.0));
      } else if (i == 2) {
        float land = smoothstep(0.55, 0.58, fbm3(sp * 2.2 + 3.0));
        float cloud = smoothstep(0.55, 0.75, noise3(sp * 5.0 + vec3(t * 0.02, 0.0, 0.0)));
        surf = mix(vec3(0.03, 0.15, 0.42), vec3(0.18, 0.32, 0.14), land);
        surf = mix(surf, vec3(0.95), cloud * 0.8);
        surf = mix(surf, vec3(0.9, 0.95, 1.0), smoothstep(0.82, 0.9, abs(sp.y)));
      } else if (i == 3) {
        float lat = sp.y * 9.0 + 0.6 * noise3(sp * 4.0);
        surf = mix(vec3(0.78, 0.62, 0.42), vec3(0.95, 0.86, 0.7), 0.5 + 0.5 * sin(lat * 2.2));
        surf = mix(surf, vec3(0.6, 0.38, 0.26), smoothstep(0.6, 0.9, noise3(vec3(sp.y * 20.0, sp.x * 3.0, 2.0))) * 0.4);
      } else if (i == 4) {
        surf = mix(vec3(0.35, 0.7, 0.82), vec3(0.55, 0.85, 0.92), 0.5 + 0.5 * sin(sp.y * 8.0 + noise3(sp * 3.0)));
      } else {
        surf = vec3(0.6, 0.58, 0.55) * (0.8 + 0.3 * noise3(sp * 8.0));
      }
      vec3 shade = surf * (0.02 + 1.1 * lit);
      // a thin air on the blue world and the ice giant, lit where the star grazes it
      if (i == 2 || i == 4) shade += vec3(0.3, 0.6, 1.0) * pow(1.0 - n.z, 3.0) * smoothstep(-0.2, 0.4, ndl) * 0.6;
      body = mix(body, shade, cover > 0.0 ? a : 1.0);
      cover = max(cover, a);
      best = m.z;
    }

    if (i == 3 && ring > 0.0 && near > 0.5 && ringZ > best - 0.5 * r) {
      body = mix(body, ringCol, ring * 0.85);
      cover = max(cover, ring * 0.85);
    }
  }
  col = mix(col, body, cover);

  col = col / (1.0 + max(col - 0.9, 0.0) * 0.8);
  gl_FragColor = vec4(col, 1.0);
}
`;

const CONFIG: OrbConfig = {
  fragment: FRAGMENT,
  // the whole system across most of a laptop's width; all the way in, the inner planets fill it
  framing: (width, height) => Math.min(width * 0.4, height * 0.95),
  close: 1.35,
  arriveFrom: 0.3,
  detail: { low: 0, medium: 1, high: 2 },
  bodies,
  diveScale: 16,
};

export default function SolarSystemScene(props: SceneProps) {
  return <primitive object={useOrbScene(CONFIG, props)} />;
}
