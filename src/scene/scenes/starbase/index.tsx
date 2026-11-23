/**
 * The Starbase (D-152): our own illustration of an imagined station in A Quasar Galaxy, the hub for
 * ideas that space scenes cannot show (D-136). A great wheel, like the rotating settlements NASA
 * studied in 1975: a gunmetal ring, ribbed and panelled, turning slowly about a hub on three spokes,
 * lit blue-white from one side by the galaxy's quasar, its inner face strung with warm amber windows.
 * Round its outer rim stand eleven bays, each glowing in the colour of the idea it leads to; the
 * galaxy's bright band and its quasar lie behind. Ray-marched in one full-screen shader: one draw
 * call, no particles. Its own colour family: gunmetal, amber and quasar blue.
 *
 * The bays are bodies (`bodies`): their hotspots lead into the ideas, once each idea is a place.
 */

import type { SceneBudget, SceneProps } from "../../host/types";
import { SKY_CHUNK } from "../../shaders/sky.glsl";
import { ORB_COMMON, useOrbScene, type OrbBody, type OrbConfig } from "../shared/orb";

export const budget: SceneBudget = {
  drawCalls: 1,
  particles: { low: 0, medium: 0, high: 0 }, // no particles: the cost is per pixel
};

/** The ring's radius is 1; its tube, the hub, and the bays on the rim. */
const TUBE = 0.13;
const BAY_R = 1 + TUBE + 0.02;
/** The bays, in order round the rim: the anchors of the ideas inside the Starbase. */
export const BAYS = ["warp", "matter", "dims", "pocket", "omniverse", "bubbles", "vacuum", "foam", "strings", "quarks", "stringtheory"] as const;
/** The wheel turns this fast, in radians a second: a full turn in about seventeen minutes. */
const SPIN = 0.006;
/** The camera's distance, in radii, and how far above the ring's plane it looks down. */
const DIST = 4.2;
/** The wheel stands this far (in radii) above the window's middle, so its near rim clears the words. */
const LIFT = 0.14;
const elevOf = (pitch: number) => Math.min(1.2, Math.max(0.2, 0.62 + pitch * 0.8));

function bodies(t: number, yaw: number, pitch: number): OrbBody[] {
  const e = elevOf(pitch);
  const ce = Math.cos(e);
  const se = Math.sin(e);
  return BAYS.map((name, i) => {
    const a = (i / BAYS.length) * Math.PI * 2 + t * SPIN + yaw;
    // the bay on the ring's plane (y up is the wheel's axis), then seen from above by `e`
    const wx = BAY_R * Math.cos(a);
    const wz = BAY_R * Math.sin(a);
    const y = -wz * se; // camera space (the shader's turnX(-e), inverted): the far side rises on screen
    const z = wz * ce;
    const k = DIST / (DIST - z);
    return { name, x: wx * k, y: y * k + LIFT, z };
  });
}

const FRAGMENT = /* glsl */ `
${ORB_COMMON}
#define SKY_LAYERS 4
${SKY_CHUNK}

const float TUBE = ${TUBE.toFixed(3)};
const float BAY_R = ${BAY_R.toFixed(3)};
const float SPIN = ${SPIN.toFixed(4)};
const float DIST = ${DIST.toFixed(2)};
const float LIFT = ${LIFT.toFixed(2)};
const vec3 METAL = vec3(0.36, 0.38, 0.43);
const vec3 AMBER = vec3(1.0, 0.62, 0.24);
const vec3 QBLUE = vec3(0.62, 0.78, 1.0);

/* the bays' colours, in the order of BAYS: each the colour of its idea */
vec3 bayColour(int i){
  if (i == 0) return vec3(0.45, 0.55, 1.0);   // warp drive
  if (i == 1) return vec3(0.6, 0.95, 0.95);   // programmable matter
  if (i == 2) return vec3(1.0, 0.4, 0.9);     // higher dimensions
  if (i == 3) return vec3(0.35, 1.0, 0.65);   // pocket dimensions
  if (i == 4) return vec3(1.0, 0.92, 0.65);   // omniverse
  if (i == 5) return vec3(1.0, 0.55, 0.7);    // bubble universes
  if (i == 6) return vec3(1.0, 0.3, 0.25);    // vacuum decay
  if (i == 7) return vec3(0.4, 0.95, 1.0);    // quantum foam
  if (i == 8) return vec3(1.0, 0.8, 0.35);    // cosmic strings
  if (i == 9) return vec3(0.6, 1.0, 0.35);    // quarks
  return vec3(0.7, 0.5, 1.0);                 // string theory
}

float spinAngle(){ return uTime * SPIN + uYaw; }

/* the station in its own frame: y the wheel's axis. Returns distance; id: 0 hull, 1 bay, 2 hub */
float station(vec3 p, out float id, out int bay){
  float a0 = spinAngle();
  // the ring, its tube a little flattened, ribbed every few degrees
  float rr = length(p.xz);
  vec2 tq = vec2(rr - 1.0, p.y * 1.15);
  float ang = atan(p.z, p.x);
  float rib = 0.008 * smoothstep(0.92, 1.0, cos((ang - a0) * 33.0));
  float d = length(tq) - TUBE - rib;
  id = 0.0;
  bay = -1;
  // the hub, and its mast along the axis
  float hub = length(p * vec3(1.0, 1.25, 1.0)) - 0.2;
  vec2 m = vec2(length(p.xz) - 0.06, abs(p.y) - 0.48);
  float mast = min(max(m.x, m.y), 0.0) + length(max(m, 0.0));
  float h = min(hub, mast);
  // three spokes, turning with the wheel
  for (int s = 0; s < 3; s++) {
    float sa = a0 + float(s) * TAU / 3.0 + 0.5;
    vec2 dir = vec2(cos(sa), sin(sa));
    float along = clamp(dot(p.xz, dir), 0.15, 1.0);
    vec3 c = vec3(dir.x * along, 0.0, dir.y * along);
    h = min(h, length(p - c) - 0.032);
  }
  if (h < d) { d = h; id = 2.0; }
  // the bays: domes on the outer rim
  float slot = (ang - a0) / TAU * 11.0;
  float k = floor(slot + 0.5);
  float ba = a0 + k * TAU / 11.0;
  vec3 bc = vec3(cos(ba), 0.0, sin(ba)) * BAY_R;
  float b = length(p - bc) - 0.05;
  if (b < d) {
    d = b;
    id = 1.0;
    bay = int(mod(k, 11.0));
  }
  return d;
}

float sdf(vec3 p){ float id; int bay; return station(p, id, bay); }

vec3 normalAt(vec3 p){
  vec2 e = vec2(0.0015, 0.0);
  return normalize(vec3(sdf(p + e.xyy) - sdf(p - e.xyy), sdf(p + e.yxy) - sdf(p - e.yxy), sdf(p + e.yyx) - sdf(p - e.yyx)));
}

/* behind it: the deep sky, the quasar galaxy's band across it, and the quasar's glare upper left */
vec3 backdrop(vec3 dir, vec2 css){
  vec3 col = skyDeep(dir, 0.55) * 0.75;
  float band = dir.y + 0.28 * dir.x - 0.05;
  float lane = exp(-band * band / 0.012);
  float grain = fbm3(dir * 9.0);
  col += mix(vec3(1.0, 0.8, 0.6), vec3(0.55, 0.65, 1.0), smoothstep(-0.6, 0.6, dir.x)) * lane * (0.12 + 0.3 * grain);
  col *= 1.0 - 0.55 * exp(-band * band / 0.0015) * smoothstep(0.45, 0.7, fbm3(dir * 22.0)); // a soft lane of dust along it
  vec3 qd = normalize(vec3(-0.75, 0.42, -0.5));
  float cq = max(dot(dir, qd), 0.0);
  col += QBLUE * (pow(cq, 900.0) * 3.0 + pow(cq, 60.0) * 0.35 + pow(cq, 8.0) * 0.06);
  return col;
}

void main(){
  vec2 css = vec2(gl_FragCoord.x, uResolution.y - gl_FragCoord.y) / uDpr;
  vec2 q = css - uCentre;
  q.y = -q.y;
  vec2 u = q / uScale;     // the ring's radii, y up
  u.y -= LIFT;
  float t = uTime;
  float e = clamp(0.62 + uPitch * 0.8, 0.2, 1.2);   // as elevOf() in TypeScript

  // a ray from the camera, then into the station's frame (seen from above by e)
  vec3 ro = vec3(0.0, 0.0, DIST);
  vec3 rd = normalize(vec3(u, -DIST));
  mat3 toStation = turnX(-e);
  vec3 o = toStation * ro;
  vec3 d = toStation * rd;
  // the direction the sky is seen in: not turned by the station
  vec2 size = uResolution / uDpr;
  vec3 skyDir = normalize(vec3((css - size * 0.5) / size.y * vec2(1.0, -1.0) * 1.3, -1.0));
  vec3 col = backdrop(skyDir, css);

  // light: the quasar, fixed in the sky, upper left and behind
  vec3 L = toStation * normalize(vec3(-0.75, 0.42, 0.5));

  // march only where the ray passes near the station
  float b = dot(o, d);
  float c = dot(o, o) - 1.45 * 1.45;
  float disc = b * b - c;
  float glow = 0.0;
  vec3 glowCol = vec3(0.0);
  if (disc > 0.0) {
    float s = max(-b - sqrt(disc), 0.0);
    float far = -b + sqrt(disc);
    int steps = 56 + 24 * uDetail;
    float id = 0.0;
    int bay = -1;
    bool hit = false;
    for (int i = 0; i < 110; i++) {
      if (i >= steps || s > far) break;
      vec3 p = o + d * s;
      float h = station(p, id, bay);
      // the bays' light gathers along rays that pass near them, as a soft haze
      if (id > 0.5 && id < 1.5) {
        float g = exp(-max(h, 0.0) * 28.0) * 0.06;
        glow += g;
        glowCol += bayColour(bay) * g;
      }
      if (h < 0.0008 * s) { hit = true; break; }
      s += h * 0.9;
    }
    if (hit) {
      vec3 p = o + d * s;
      vec3 n = normalAt(p);
      vec3 v = -d;
      float diff = max(dot(n, L), 0.0);
      float spec = pow(max(dot(reflect(-L, n), v), 0.0), 40.0);
      float rim = pow(1.0 - max(dot(n, v), 0.0), 3.0);
      if (id > 0.5 && id < 1.5) {
        // a bay: a lit dome, brightest at its middle
        vec3 bc = bayColour(bay);
        float face = max(dot(n, v), 0.0);
        col = bc * (0.55 + 1.1 * pow(face, 3.0)) + mix(bc, vec3(1.0), 0.6) * pow(face, 12.0) * 0.8 + vec3(1.0) * spec * 0.4;
      } else {
        // the hull: panelled gunmetal, darker seams
        float a0 = spinAngle();
        float ang = atan(p.z, p.x) - a0;
        float tubeAng = atan(p.y, length(p.xz) - 1.0);
        vec2 panel = vec2(ang * 60.0, tubeAng * 4.0);
        float seam = smoothstep(0.04, 0.0, min(abs(fract(panel.x) - 0.5), abs(fract(panel.y) - 0.5)) - 0.44);
        float tint = 0.8 + 0.35 * hash3(vec3(floor(panel), 2.0));
        vec3 albedo = METAL * tint * (1.0 - 0.35 * seam);
        if (id > 1.5) albedo = METAL * 0.9;
        float fill = max(dot(n, toStation * normalize(vec3(0.6, -0.5, 0.4))), 0.0); // the galaxy's warm band, from below right
        col = albedo * ((0.05 + 1.5 * diff) * QBLUE + fill * vec3(0.55, 0.38, 0.25) * 0.55) + QBLUE * spec * 0.9 + vec3(0.4, 0.35, 0.65) * rim * 0.4;
        // the inner face of the ring: rows of warm windows, a few dark
        if (id < 0.5) {
          vec2 radial = normalize(p.xz);
          float inward = -dot(n.xz, radial);
          // windows in blocks: lit decks with dark gaps, soft at their edges, so no row reads as a line
          vec2 w = vec2(ang * 70.0, tubeAng * 3.0);
          vec2 wf = fract(w) - 0.5;
          float lit = smoothstep(0.35, 0.7, hash3(vec3(floor(w), 9.0))) * (0.5 + 0.5 * noise3(vec3(ang * 9.0, tubeAng, 1.0)));
          float win = smoothstep(0.45, 0.25, abs(wf.x)) * smoothstep(0.42, 0.2, abs(wf.y));
          col += AMBER * win * lit * smoothstep(0.1, 0.6, inward) * smoothstep(0.85, 0.3, abs(p.y) / TUBE) * 0.9;
          // and a softer band of light through the ring's outer windows

        }
        // the hub's docking lights, slow and soft
        if (id > 1.5) col += AMBER * 0.6 * exp(-abs(abs(p.y) - 0.46) * 60.0) * (0.6 + 0.4 * sin(t * 1.3));
      }
    }
  }
  col += glowCol * (0.9 + 0.1 * sin(t * 0.8));

  col = col / (1.0 + max(col - 0.85, 0.0) * 0.85);
  gl_FragColor = vec4(col, 1.0);
}
`;

const CONFIG: OrbConfig = {
  fragment: FRAGMENT,
  // the wheel across most of a laptop's width; all the way in, it fills the window
  framing: (width, height) => Math.min(width * 0.27, height * 0.37),
  close: 1.2,
  arriveFrom: 0.3,
  detail: { low: 0, medium: 1, high: 2 },
  bodies,
  diveScale: 16,
};

export default function StarbaseScene(props: SceneProps) {
  return <primitive object={useOrbScene(CONFIG, props)} />;
}
