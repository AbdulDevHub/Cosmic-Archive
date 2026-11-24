/**
 * Out past the observable universe (D-184, replacing D-174's Seven Heavens).
 *
 * The Multiverse (stop 5): our universe, shrunk to a small ball at the far left, and to its right a
 * line of other universes, each larger than the last, the last running off the edge. Each one is a
 * universe as the observable universe is drawn: a ball of cosmic web, threads and knots of galaxies,
 * under a glassy lilac rim. Each has its own colours and its own size of cell, for in this idea each
 * may have its own physical constants. Ours is the universe layer itself (world.ts moves it into the
 * line); this layer draws the others, growing one after another as the zoom arrives.
 *
 * The Omniverse (stop 6), after the owner's reference: the line shrinks to a small row of lights and
 * round it float many more such bubbles, large and near or small, far and soft, in a violet haze.
 *
 * Our own illustration, as everywhere: full-screen triangles, never a drawn line (D-094).
 */

import { BufferAttribute, BufferGeometry, CustomBlending, AddEquation, Mesh, OneFactor, OneMinusSrcAlphaFactor, ShaderMaterial, Vector2, Vector4, ZeroFactor } from "three";
import { FOAM_CHUNK } from "./foam";

/** How many universes stand in the line, ours first. */
export const ROW = 6;
/** Their radii, smallest (ours) to largest, before the line is fitted to the window. */
const RADII = [0.07, 0.11, 0.17, 0.26, 0.4, 0.62];
const GAP = 0.07;
/** At the Omniverse the line shrinks to this fraction of itself, about this point (units). */
const SHRINK = 0.16;
const CLUSTER = { wide: [0.22, -0.6], narrow: [0.0, 0.05] } as const;
/** How many bubbles float in the Omniverse. */
const FIELD = 28;

const sstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** The line of universes: centres (units from the window's middle, y up) and radii. */
export interface Row {
  x: number[];
  y: number[];
  r: number[];
  /** Where the line gathers at the Omniverse, for its hotspot. */
  cluster: [number, number];
}

/**
 * The line for this window and zoom: laid along the window's width (on a phone, down its height),
 * fitted so ours sits near the left edge and the last runs a little off the right; the others grow
 * in one after another on the way out to stop 5, and the whole line shrinks to a small row of lights
 * on the way out to stop 6.
 */
export function rowLayout(width: number, height: number, narrow: boolean, zoom: number): Row {
  const aspect = width / height;
  const span = RADII[0] + RADII[ROW - 1] + 2 * RADII.slice(1, ROW - 1).reduce((a, b) => a + b, 0) + GAP * (ROW - 1);
  const x: number[] = [];
  const y: number[] = [];
  const r: number[] = [];
  if (!narrow) {
    const x0 = -aspect + 0.35;
    const fit = (aspect - 0.15 - x0) / span;
    let at = x0;
    for (let i = 0; i < ROW; i++) {
      if (i > 0) at += (RADII[i - 1] + GAP + RADII[i]) * fit;
      x.push(at);
      y.push(-0.08);
      r.push(RADII[i] * fit);
    }
  } else {
    const y0 = 0.62;
    const fit = Math.min((y0 + 0.85) / span, (aspect * 0.95) / RADII[ROW - 1]);
    let at = y0;
    for (let i = 0; i < ROW; i++) {
      if (i > 0) at -= (RADII[i - 1] + GAP + RADII[i]) * fit;
      x.push(0);
      y.push(at);
      r.push(RADII[i] * fit);
    }
  }
  // the others grow in, one after another, as the zoom arrives at the multiverse
  for (let i = 1; i < ROW; i++) r[i] *= sstep(4.38 + 0.07 * i, 4.68 + 0.07 * i, zoom);
  // out to the omniverse the whole line shrinks about its middle, and gathers at the cluster's place
  const cluster = (narrow ? CLUSTER.narrow : CLUSTER.wide) as [number, number];
  const out = sstep(5, 6, zoom);
  if (out > 0) {
    const k = Math.exp(Math.log(SHRINK) * out);
    const cx = narrow ? 0 : (x[0] - r[0] + x[ROW - 1] + r[ROW - 1]) / 2;
    const cy = narrow ? (y[0] + y[ROW - 1]) / 2 : y[0];
    for (let i = 0; i < ROW; i++) {
      x[i] = cx + (x[i] - cx) * k + (cluster[0] - cx) * out;
      y[i] = cy + (y[i] - cy) * k + (cluster[1] - cy) * out;
      r[i] *= k;
    }
  }
  return { x, y, r, cluster };
}

/** A small seeded random, so the omniverse's bubbles stand in the same places every visit. */
function seeded(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * The omniverse's bubbles for this window's shape (units from the middle, y up; radius; depth 0 far
 * to 1 near), sorted far to near. A few large and near, more middling, many small and far; none
 * on the line's cluster, and the big ones clear of the words on the left and of each other.
 */
export function fieldLayout(width: number, height: number, narrow: boolean): Vector4[] {
  const aspect = width / height;
  const rand = seeded(20261124);
  const cluster = narrow ? CLUSTER.narrow : CLUSTER.wide;
  const big = narrow ? 0.5 : 1;
  const out: Vector4[] = [];
  let tries = 0;
  while (out.length < FIELD && tries++ < 4000) {
    const n = out.length;
    const r = (n < 4 ? 0.3 + rand() * 0.28 : n < 11 ? 0.11 + rand() * 0.12 : 0.025 + rand() * 0.06) * big;
    const x = (rand() * 2 - 1) * (aspect + r * 0.6);
    const y = (rand() * 2 - 1) * (1 + r * 0.6);
    if (Math.hypot(x - cluster[0], y - cluster[1]) < r + 0.32) continue;
    // the big ones keep clear of the left third, where the words stand (the stop's name, and the
    // About page over this scene), and of the header's dock (top middle)
    if (r > 0.1 && !narrow && x - r < -aspect + 1.5) continue;
    if (r > 0.1 && !narrow && Math.abs(x) < 0.75 && y + r > 0.78) continue;
    if (r > 0.1 && out.some((b) => b.z > 0.1 && Math.hypot(b.x - x, b.y - y) < (b.z + r) * 0.9)) continue;
    out.push(new Vector4(x, y, r, 0));
  }
  const most = Math.max(...out.map((b) => b.z));
  for (const b of out) b.w = Math.sqrt(b.z / most);
  return out.sort((a, b) => a.w - b.w);
}

const VERTEX = /* glsl */ `
void main(){ gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

/** One universe as a glassy ball of cosmic web, `d` from its middle in its radii (premultiplied). */
const BUBBLE_CHUNK = /* glsl */ `
vec4 universeBall(vec2 d, float seed, int detail, float t, vec3 tint, float soft){
  float r = length(d);
  float inside = 1.0 - smoothstep(1.0 - soft, 1.0, r);
  float z = sqrt(max(1.0 - r * r, 0.0));
  // the cells crowd toward the rim, as on a ball; each universe its own size of cell
  vec2 q = d / (0.45 + 0.55 * z) + vec2(t * 0.004 + seed * 13.1, seed * 7.7);
  float cells = 3.4 + fract(seed * 3.7) * 1.6;
  vec3 web = webLayer(q, cells, 0.045, 1.0);
  if (detail > 0) web += webLayer(q * 2.1 + 3.3, cells, 0.05, 0.5);
  // the threads glow warm, gold to ember, where galaxies crowd along the walls (the owner's reference)
  float lum = dot(web, vec3(0.3, 0.5, 0.2));
  vec3 threads = mix(web, vec3(1.0, 0.62, 0.32) * lum * 1.5, 0.55);
  // the gas and the light of countless galaxies filling it: violet to rose
  float n = noise3(vec3(q * 2.5, seed * 9.0));
  float n2 = noise3(vec3(q * 7.0 + 2.0, seed * 5.0));
  vec3 fill = mix(vec3(0.32, 0.16, 0.62), vec3(0.75, 0.32, 0.62), n) * (0.14 + 0.14 * n2);
  vec3 foam = (threads + fill) * tint;
  // and its brightest stars
  vec2 g = q * 26.0;
  float sp = step(0.965, hash3(vec3(floor(g), seed * 31.0))) * exp(-length(fract(g) - 0.5) * 9.0);
  foam += vec3(1.0, 0.95, 0.9) * sp * 0.8;
  // glass: a pale lilac rim and a soft highlight at the upper left
  float fres = pow(1.0 - z, 2.2);
  vec3 col = foam * (0.6 + 0.4 * z) + mix(vec3(0.82, 0.74, 1.0), tint, 0.25) * fres * 0.75;
  vec2 h = d - vec2(-0.42, 0.45);
  col += vec3(1.0, 0.96, 1.0) * exp(-dot(h, h) * 12.0) * 0.18;
  col *= inside;
  // a faint glow just outside it
  col += mix(vec3(0.7, 0.55, 1.0), tint, 0.4) * exp(-max(r - 1.0, 0.0) * 14.0) * step(1.0, r) * 0.1;
  // see-through, like glass: a little of what is behind shows
  return vec4(col, inside * 0.82);
}
`;

const MULTIVERSE_FRAGMENT = /* glsl */ `
precision highp float;
uniform vec4 uB[${ROW}];  // each universe: middle (device pixels from the bottom left), radius (device pixels), seed
uniform float uTime;
uniform float uAlpha;
uniform int uDetail;
${FOAM_CHUNK}
${BUBBLE_CHUNK}

/* each other universe its own colours: its own physics */
vec3 tintOf(int i){
  if (i == 1) return vec3(1.2, 0.85, 0.75);
  if (i == 2) return vec3(0.7, 1.15, 1.1);
  if (i == 3) return vec3(1.2, 0.72, 1.05);
  if (i == 4) return vec3(1.25, 0.95, 0.6);
  return vec3(0.85, 0.92, 1.25);
}

void main(){
  // ours (0) is the universe layer. The line never overlaps, so one ball at most covers a pixel:
  // find it first, then draw it once (one copy of the ball's code, so the shader compiles quickly)
  int hit = -1;
  vec4 hb = vec4(0.0);
  float best = 1.7; // inside a ball (under 1) always beats the glow just outside its neighbour
  for (int i = 1; i < ${ROW}; i++) {
    vec4 b = uB[i];
    if (b.z < 0.5) continue;
    vec2 d = (gl_FragCoord.xy - b.xy) / b.z;
    float q = dot(d, d);
    if (q < best) { hit = i; hb = b; best = q; }
  }
  if (hit < 0) {
    gl_FragColor = vec4(0.0);
    return;
  }
  vec4 col = universeBall((gl_FragCoord.xy - hb.xy) / hb.z, hb.w, uDetail, uTime, tintOf(hit), 0.02 + 1.5 / hb.z);
  gl_FragColor = col * uAlpha;
}
`;

const OMNIVERSE_FRAGMENT = /* glsl */ `
precision highp float;
uniform vec4 uB[${FIELD}]; // each bubble: middle (device pixels), radius (device pixels), depth 0 far to 1 near; far to near
uniform vec2 uSize;        // the drawing buffer, device pixels
uniform float uTime;
uniform float uAlpha;
uniform int uDetail;
${FOAM_CHUNK}
${BUBBLE_CHUNK}

vec3 tintAt(float k){
  vec3 a = vec3(1.0, 0.95, 1.05), b = vec3(1.15, 0.82, 1.1), c = vec3(0.85, 0.95, 1.2), d = vec3(1.2, 0.9, 0.75);
  float x = fract(k * 7.31) * 3.0;
  return x < 1.0 ? mix(a, b, x) : x < 2.0 ? mix(b, c, x - 1.0) : mix(c, d, x - 2.0);
}

void main(){
  vec2 uv = (gl_FragCoord.xy - uSize * 0.5) / (uSize.y * 0.5);
  float t = uTime;
  // the haze between them: deep indigo, crossed by a broad band of violet light rising to the right
  float n = noise3(vec3(uv * 1.3, t * 0.02));
  float band = exp(-pow(uv.y - 0.42 * uv.x + 0.05, 2.0) / 0.16) * (0.55 + 0.45 * n);
  float band2 = exp(-pow(uv.y - 0.42 * uv.x - 0.75, 2.0) / 0.05) * (0.4 + 0.6 * noise3(vec3(uv * 2.2 + 4.0, t * 0.03)));
  vec3 col = vec3(0.035, 0.015, 0.09) + vec3(0.42, 0.18, 0.95) * band * 0.42 + vec3(0.6, 0.35, 1.0) * band2 * 0.22;
  col += vec3(0.25, 0.1, 0.5) * 0.12 * exp(-dot(uv, uv) * 0.5);

  // the bubbles, far to near: far ones small and soft, as if out of focus, drawn as they come; of
  // the near ones only the nearest covering this pixel is drawn, once, after the loop (one copy of
  // the ball's code, so the shader compiles quickly)
  int hit = -1;
  vec4 hb = vec4(0.0);
  bool body = false;
  for (int i = 0; i < ${FIELD}; i++) {
    vec4 b = uB[i];
    if (b.z < 0.5) continue;
    vec2 d = (gl_FragCoord.xy - b.xy) / b.z;
    float q = dot(d, d);
    if (q > 1.5) continue;
    float near = b.w;
    if (near > 0.55) {
      // the nearest ball whose body covers the pixel wins; a glow just outside one only where no body does
      if (q < 1.0) {
        hit = i;
        hb = b;
        body = true;
      } else if (!body) {
        hit = i;
        hb = b;
      }
      continue;
    }
    // far: no threads to see, only a hazy glow of web and a pale rim
    float soft = mix(0.35, 0.02, near) + 1.5 / b.z;
    float r = length(d);
    float inside = 1.0 - smoothstep(1.0 - soft, 1.0 + soft * 0.3, r);
    float z = sqrt(max(1.0 - r * r, 0.0));
    float m = noise3(vec3(d * 3.0, float(i)));
    vec3 c = mix(vec3(0.5, 0.3, 0.9), vec3(1.0, 0.6, 0.45), m * 0.5) * (0.3 + 0.3 * m) + vec3(0.8, 0.7, 1.0) * pow(1.0 - z, 2.0) * 0.5;
    col = col * (1.0 - inside * 0.8) + c * inside * mix(0.45, 1.0, near);
  }
  if (hit >= 0) {
    float k = float(hit) * 0.137;
    vec4 ball = universeBall((gl_FragCoord.xy - hb.xy) / hb.z, k, uDetail, t, tintAt(k), 0.02 + 1.5 / hb.z);
    col = col * (1.0 - ball.a) + ball.rgb;
  }
  col = col / (1.0 + max(col - 0.9, 0.0) * 0.9);
  gl_FragColor = vec4(col * uAlpha, uAlpha);
}
`;

function fullScreen(fragment: string, uniforms: ShaderMaterial["uniforms"], order: number): Mesh<BufferGeometry, ShaderMaterial> {
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3));
  const material = new ShaderMaterial({
    vertexShader: VERTEX,
    fragmentShader: fragment,
    uniforms,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    // premultiplied: each ball covers what is behind it
    blending: CustomBlending,
    blendEquation: AddEquation,
    blendSrc: OneFactor,
    blendDst: OneMinusSrcAlphaFactor,
    blendSrcAlpha: ZeroFactor,
    blendDstAlpha: OneFactor,
  });
  const mesh = new Mesh(geometry, material);
  mesh.frustumCulled = false;
  mesh.renderOrder = order;
  mesh.visible = false;
  return mesh;
}

/** The other universes of the line (stop 5); drawn over the universe layer's darkness. */
export function multiverse(): Mesh<BufferGeometry, ShaderMaterial> {
  const seeds = [0, 0.21, 0.47, 0.63, 0.82, 0.95];
  return fullScreen(
    MULTIVERSE_FRAGMENT,
    {
      uB: { value: seeds.map((s) => new Vector4(0, 0, 0, s)) },
      uTime: { value: 0 },
      uAlpha: { value: 0 },
      uDetail: { value: 1 },
    },
    2,
  );
}

/** The omniverse's haze and bubbles (stop 6), behind the line. */
export function omniverse(): Mesh<BufferGeometry, ShaderMaterial> {
  return fullScreen(
    OMNIVERSE_FRAGMENT,
    {
      uB: { value: Array.from({ length: FIELD }, () => new Vector4()) },
      uSize: { value: new Vector2(1, 1) },
      uTime: { value: 0 },
      uAlpha: { value: 0 },
      uDetail: { value: 1 },
    },
    0.5,
  );
}
