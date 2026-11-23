/**
 * A Quasar Galaxy (D-133): our own illustration of a spiral galaxy whose heart is a quasar, seen
 * tilted: arms of blue-white stars and pink star-forming knots, dark lanes of dust, a warm bulge,
 * and at the very middle a point of light brighter than all of it, with two jets of matter thrown
 * out along the disc's axis. The galaxy beyond the wormhole (owner): its places are the quasar
 * itself (a close-up) and the sci-fi places, starting with the Dyson Sphere. One full-screen
 * shader, no particles; the bodies are placed here and handed to the shader (`uMark`).
 */

import type { SceneBudget, SceneProps } from "../../host/types";
import { SKY_CHUNK } from "../../shaders/sky.glsl";
import { ORB_COMMON, useOrbScene, type OrbBody, type OrbConfig } from "../shared/orb";

export const budget: SceneBudget = {
  drawCalls: 1,
  particles: { low: 0, medium: 0, high: 0 }, // no particles: the cost is per pixel
};

/** The disc is seen this far from edge on, in radians; the drag tilts it (as the solar system). */
const tiltOf = (pitch: number) => Math.min(0.95, Math.max(0.25, 0.55 + pitch * 0.8));
/** The disc turns this fast, in radians a second: slow enough to be felt, not watched. */
const SPIN = 0.006;
/** The Dyson Sphere's star, in the disc: its radius (of the galaxy's) and angle. */
const DYSON = { r: 0.42, a: 2.4 };
/** The Starbase (D-152), out in the disc on the far side from the Dyson Sphere. */
const STARBASE = { r: 0.62, a: 5.4 };
/** The megastructures (D-164 to D-173): each a body in the disc, placed clear of the others' hotspots. */
const MEGA: readonly { name: string; r: number; a: number }[] = [
  { name: "swarm", r: 0.3, a: 4.2 },
  { name: "ringworld", r: 0.78, a: 1.2 },
  { name: "oneill", r: 0.55, a: 3.3 },
  { name: "matrioshka", r: 0.85, a: 4.5 },
  { name: "generation", r: 0.9, a: 2.85 },
  { name: "engine", r: 0.72, a: 0.15 },
  { name: "probes", r: 0.5, a: 0.9 },
  { name: "elevator", r: 0.35, a: 5.6 },
  { name: "lifter", r: 0.82, a: 6.0 },
];

function bodies(t: number, yaw: number, pitch: number): OrbBody[] {
  const tilt = tiltOf(pitch);
  const a = DYSON.a + yaw + t * SPIN;
  const x = DYSON.r * Math.cos(a);
  const z = DYSON.r * Math.sin(a);
  const b = STARBASE.a + yaw + t * SPIN;
  const bx = STARBASE.r * Math.cos(b);
  const bz = STARBASE.r * Math.sin(b);
  return [
    { name: "core", x: 0, y: 0, z: 0 },
    { name: "dyson", x, y: -z * Math.sin(tilt), z: z * Math.cos(tilt) },
    { name: "starbase", x: bx, y: -bz * Math.sin(tilt), z: bz * Math.cos(tilt) },
    ...MEGA.map(({ name, r, a: at }) => {
      const m = at + yaw + t * SPIN;
      const mz = r * Math.sin(m);
      return { name, x: r * Math.cos(m), y: -mz * Math.sin(tilt), z: mz * Math.cos(tilt) };
    }),
  ];
}

const FRAGMENT = /* glsl */ `
${ORB_COMMON}
${SKY_CHUNK}

const float SPIN = ${SPIN.toFixed(4)};
const vec3 YOUNG = vec3(0.55, 0.7, 1.0);
const vec3 OLD = vec3(1.0, 0.78, 0.5);
const vec3 PINK = vec3(1.0, 0.38, 0.62);
const vec3 JET = vec3(0.55, 0.75, 1.0);

vec3 sky(vec2 css){
  vec2 size = uResolution / uDpr;
  vec2 v = (css - size * 0.5) / size.y;
  return skyDeep(normalize(vec3(v * 1.4, -1.0)), 0.45);
}

void main(){
  vec2 css = vec2(gl_FragCoord.x, uResolution.y - gl_FragCoord.y) / uDpr;
  vec2 q = css - uCentre;
  q.y = -q.y;
  vec2 u = q / uScale;     // the galaxy's radii, y up
  float t = uTime;
  float tilt = clamp(0.55 + uPitch * 0.8, 0.25, 0.95);   // as tiltOf() in TypeScript
  float st = sin(tilt);

  vec3 col = sky(css) * 0.8;

  // ---- the disc: back onto its plane, turned by the drag and its own slow spin ----
  vec2 pl = vec2(u.x, -u.y / st);
  float ang = -(uYaw + t * SPIN);
  float c = cos(ang), s = sin(ang);
  vec2 d = vec2(c * pl.x - s * pl.y, s * pl.x + c * pl.y);
  float r = length(d);
  float th = atan(d.y, d.x);
  // two arms winding out on a logarithmic spiral, ragged with noise
  float wind = th - log(max(r, 0.02)) * 2.6;
  float arms = pow(0.5 + 0.5 * cos(2.0 * wind + 1.2 * (fbm3(vec3(d * 3.0, 1.0)) - 0.5)), 2.5);
  float disc = exp(-r / 0.4) * smoothstep(1.05, 0.7, r);
  float clumps = fbm3(vec3(d * 9.0, 2.0));
  float stars = disc * (0.2 + 1.6 * arms * smoothstep(0.04, 0.25, r)) * (0.55 + 0.9 * clumps);
  vec3 glow = mix(OLD, YOUNG, smoothstep(0.08, 0.45, r)) * stars * 1.25;
  // pink knots where stars are being born, strung along the arms: small and round, one per cell
  vec2 kc = d * 34.0;
  vec2 kid = floor(kc);
  float kpick = step(0.8, hash3(vec3(kid, 5.0)));
  vec2 kof = vec2(hash3(vec3(kid, 6.0)), hash3(vec3(kid, 8.0))) * 0.6 + 0.2;
  float knots = kpick * exp(-length(fract(kc) - kof) * 9.0) * arms * smoothstep(0.12, 0.3, r) * smoothstep(0.95, 0.6, r);
  glow += PINK * knots * 2.2;
  // dark lanes of dust on the inner edge of each arm
  float lane = pow(0.5 + 0.5 * cos(2.0 * wind - 0.9), 6.0) * smoothstep(0.06, 0.2, r) * smoothstep(0.9, 0.4, r);
  glow *= 1.0 - 0.75 * lane * (0.5 + 0.5 * fbm3(vec3(d * 12.0, 3.0)));
  // single bright stars, sparse
  vec2 cell = d * 90.0;
  float spark = step(0.985, hash3(vec3(floor(cell), 7.0))) * exp(-length(fract(cell) - 0.5) * 9.0) * smoothstep(1.0, 0.3, r);
  glow += mix(YOUNG, vec3(1.0), 0.5) * spark * 1.2;
  col += glow;

  // ---- the bulge: an old, warm swell of stars round the heart ----
  float rb = length(u * vec2(1.0, 1.0 / mix(0.65, 1.0, st)));
  col += OLD * (0.9 * exp(-rb / 0.07) + 0.25 * exp(-rb / 0.2));

  // ---- the jets: matter thrown out along the disc's axis, up and down the screen ----
  float axis = cos(tilt);
  float along = abs(u.y) / max(axis, 0.2);
  float width = 0.012 + 0.05 * along;
  float jet = exp(-pow(u.x / width, 2.0)) * exp(-along / 0.55) * smoothstep(0.0, 0.05, along);
  float knotsJ = 0.6 + 0.6 * pow(0.5 + 0.5 * sin(along * 26.0 - t * 1.2), 4.0);
  float lobe = exp(-pow((along - 0.85) / 0.22, 2.0)) * exp(-pow(u.x / 0.16, 2.0)) * 0.35;
  col += JET * (jet * knotsJ * 1.1 + lobe * (0.6 + 0.6 * noise3(vec3(u * 8.0, t * 0.05))));

  // ---- the quasar: one point outshining everything, with long spikes of glare ----
  float rc = length(u);
  float flick = 0.9 + 0.1 * sin(t * 1.7) * sin(t * 0.63);
  col += vec3(1.0, 0.97, 0.92) * (exp(-rc / 0.012) * 3.0 + exp(-rc / 0.05) * 0.8 + exp(-rc / 0.18) * 0.18) * flick;
  float spikes = exp(-abs(u.y) * 400.0) * exp(-abs(u.x) * 7.0) + exp(-abs(u.x) * 400.0) * exp(-abs(u.y) * 7.0);
  col += vec3(0.9, 0.95, 1.0) * spikes * 0.5 * flick;

  // the Starbase (D-152): a small warm light of its own in the disc
  float rs = length(u - uMark[2].xy);
  col += vec3(1.0, 0.7, 0.35) * (exp(-rs / 0.006) * 1.4 + exp(-rs / 0.025) * 0.25);

  col = col / (1.0 + max(col - 0.85, 0.0) * 0.85);
  gl_FragColor = vec4(col, 1.0);
}
`;

const CONFIG: OrbConfig = {
  fragment: FRAGMENT,
  // the whole galaxy across a laptop's height; all the way in its heart fills the window
  framing: (width, height) => Math.min(width * 0.38, height * 0.62),
  close: 1.3,
  arriveFrom: 0.3,
  detail: { low: 0, medium: 1, high: 2 },
  bodies,
  diveScale: 14,
};

export default function QuasarGalaxyScene(props: SceneProps) {
  return <primitive object={useOrbScene(CONFIG, props)} />;
}
