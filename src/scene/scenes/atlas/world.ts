/**
 * The atlas's three.js objects, built from `model.ts` (ARCHITECTURE.md 4): Level 1, the galaxy,
 * Level 2, the cosmic web, and Level 3, the supervoid around it (D-119), cross-faded by the one
 * zoom scalar.
 *
 * Layers in draw order: wash and stars; body, haze, halo, companion, and the web; the disc (and
 * the bulge on `low`); dust; core. All additive except dust, so only dust depends on order. A
 * layer whose strength is zero is not drawn at all. Nothing is drawn over the cosmos: no rings,
 * ticks, axis, vessel or trail (D-094).
 *
 * Each frame also tells the DOM where its named places are on screen (`ANCHORS`), so hotspots can
 * be real links laid over the canvas, and a dive can carry the camera into one of them (D-096).
 *
 * Production replacement for the prototype's shortcut (DESIGN_SPEC.md section 10): large glow
 * sprites are instanced quads, not gl.POINTS.
 */

import {
  AddEquation,
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  CustomBlending,
  Euler,
  Group,
  InstancedBufferAttribute,
  InstancedBufferGeometry,
  Matrix3,
  Matrix4,
  Mesh,
  OneFactor,
  OneMinusSrcAlphaFactor,
  OneMinusSrcColorFactor,
  Points,
  ShaderMaterial,
  Vector2,
  Vector3,
  Vector4,
  ZeroFactor,
  type Material,
  type Object3D,
  type PerspectiveCamera,
  type Texture,
} from "three";
import type { SceneFrame, SceneInput } from "../../host/store";
import type { ParticleTier } from "../../quality/tiers";
import { POINT_FRAGMENT, POINT_VERTEX, SPRITE_FRAGMENT, SPRITE_VERTEX } from "../../shaders/points.glsl";
import { SKY_CHUNK } from "../../shaders/sky.glsl";
import { isPhone, KEYS_DESK, KEYS_PHONE, LAST_STOP, placeCamera } from "./camera";
import { StartProps } from "./start";
import { armAngle, buildAtlas, COUNTS, joinClouds, mix, OUTER, SPIN, sstep, TAU, type Cloud, type Vec3 } from "./model";

// base strengths, faded out together at the far zoom
const A = { haze: 0.05, body: 0.02, dust: 0.1, core: 0.2, halo: 0.8 };
// S2 (D-111): the disc's new layers, at the `high` counts
const S2 = { filaments: 0.45, clusterStars: 0.85, clusterGlow: 0.09, clouds: 0.04, fineDust: 0.16, heart: 0.035, webStrands: 0.42, webGlow: 0.26 };
/** D-112: how fast the black hole's disc and its feeding streams turn (radians per second), and their strength. */
const NUCLEUS_SPIN = 0.22;
const NUCLEUS = { glow: 1.6 };

/** View depth under which a disc particle fades as the camera passes it (a dive); the fade ends just past the camera's near plane (0.05). */
const NEAR = 0.12;

/**
 * The places a hotspot can stand. `content/places.ts` names one per place; the scene
 * owns where each one is, because that depends on the galaxy as generated and on the composition.
 */
const NEBULA_R = 0.74;
const NEBULA_TH = armAngle(1, NEBULA_R);
// D-116: a neutron star between the arms, and a star like the Sun out in a minor arm
const PULSAR_R = 0.46;
const PULSAR_TH = armAngle(0, PULSAR_R) + 1.3;
const SUN_R = 0.62;
const SUN_TH = armAngle(2, SUN_R);
// D-117: a strange star near the heart, between the arms; a Dyson sphere out on an arm's edge
const STRANGE_R = 0.3;
const STRANGE_TH = armAngle(1, STRANGE_R) + 1.4;
// D-125: a wormhole and a gravastar, hypothetical, off the arms
const WORM_R = 0.8;
const WORM_TH = armAngle(0, WORM_R) + 0.9 + Math.PI;
const GRAV_R = 0.4;
const GRAV_TH = armAngle(2, GRAV_R) + 0.9;
// D-127: a quasi-star, far out at the disc's edge (the early universe, in spirit)
const QUASI_R = 1.02;
const QUASI_TH = armAngle(1, QUASI_R) + 0.6;
type Anchor = { local: Vec3; spin: boolean } | { web: "quasar" | "home" };
const ANCHORS: Record<string, Anchor> = {
  /** The heart of the galaxy. */
  core: { local: [0, 0, 0], spin: false },
  /** A place in one of the main arms; it turns with the disc. */
  arm: { local: [NEBULA_R * Math.cos(NEBULA_TH), 0, NEBULA_R * Math.sin(NEBULA_TH)], spin: true },
  /** A neutron star in the disc, between the arms (D-116). */
  pulsar: { local: [PULSAR_R * Math.cos(PULSAR_TH), 0, PULSAR_R * Math.sin(PULSAR_TH)], spin: true },
  /** A star like the Sun, out in a minor arm (D-116). */
  sun: { local: [SUN_R * Math.cos(SUN_TH), 0, SUN_R * Math.sin(SUN_TH)], spin: true },
  /** A strange star near the heart (D-117). */
  strange: { local: [STRANGE_R * Math.cos(STRANGE_TH), 0, STRANGE_R * Math.sin(STRANGE_TH)], spin: true },
  /** A hypothetical wormhole in the disc (D-125). */
  wormhole: { local: [WORM_R * Math.cos(WORM_TH), 0, WORM_R * Math.sin(WORM_TH)], spin: true },
  /** A hypothetical gravastar in the disc (D-126). */
  gravastar: { local: [GRAV_R * Math.cos(GRAV_TH), 0, GRAV_R * Math.sin(GRAV_TH)], spin: true },
  /** A hypothetical quasi-star out at the edge of the disc (D-127). */
  quasi: { local: [QUASI_R * Math.cos(QUASI_TH), 0, QUASI_R * Math.sin(QUASI_TH)], spin: true },
  /** A far galaxy of the web, placed where the zoomed-out composition wants it. */
  quasar: { web: "quasar" },
  /** The galaxy the visitor came from. */
  home: { web: "home" },
  /** The web the visitor came from, seen from the supervoid: a patch of one wall (D-119). */
  patch: { web: "home" },
  /** The supervoid, seen from the observable universe: our web at its middle (D-130). */
  voidspot: { web: "home" },
};

/** Where the quasar's hotspot should fall in the zoomed-out view, in NDC (the prototype's). */
const QUASAR_WANT = { wide: [0.4, -0.38], narrow: [0.02, 0.55] } as const; // narrow: room for "A Quasar Galaxy" (D-133)
/**
 * Where the supervoid's great bubble sits, from our web, in units of half the window's height
 * (y up). The web is on the bubble's wall (D-119); the camera's lens shift puts it right of centre
 * on a wide screen and above it on a phone, so the bubble fills the middle.
 */
/** The supervoid's stop, whose camera distance scales its foam (D-119). */
const VOID_STOP = 3;
/** How many times larger than whole the universe's sphere is as the zoom leaves the supervoid (D-130). */
const UNIVERSE_FROM = 28;

export function makeFrame(): SceneFrame {
  const points: SceneFrame["points"] = {};
  for (const name of Object.keys(ANCHORS)) points[name] = { x: 0, y: 0, on: false };
  return { zoom: 0, width: 1, height: 1, narrow: false, points, radius: 1 };
}

interface LayerOptions {
  spin?: number;
  twinkle?: number;
  maxPx?: number;
  atten?: number;
  alpha?: number;
  soft?: number;
  order?: number;
  dust?: boolean;
  near?: number;
}

/** One cloud of soft discs, drawn as points or as instanced quads. */
class Layer {
  readonly object: Points | Mesh;
  readonly material: ShaderMaterial;
  private readonly maxPx: number;
  private readonly atten: number;

  constructor(
    private readonly cloud: Cloud,
    readonly sprite: boolean,
    o: LayerOptions,
  ) {
    this.maxPx = o.maxPx ?? 64;
    this.atten = o.atten ?? 1;
    this.material = new ShaderMaterial({
      vertexShader: sprite ? SPRITE_VERTEX : POINT_VERTEX,
      fragmentShader: sprite ? SPRITE_FRAGMENT : POINT_FRAGMENT,
      uniforms: {
        uTime: { value: 0 },
        uPx: { value: 1 },
        uSpin: { value: o.spin ?? 0 },
        uTwinkle: { value: o.twinkle ?? 0 },
        uMaxPx: { value: this.maxPx },
        uAtten: { value: this.atten },
        uAlpha: { value: o.alpha ?? 1 },
        uSoft: { value: o.soft ?? 1.6 },
        uNear: { value: o.near ?? 0 },
        uViewport: { value: new Vector2(1, 1) },
      },
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: AdditiveBlending,
    });
    if (o.dust) {
      // dust darkens what is behind it: result = behind * (1 - colour)
      this.material.blending = CustomBlending;
      this.material.blendEquation = AddEquation;
      this.material.blendSrc = ZeroFactor;
      this.material.blendDst = OneMinusSrcColorFactor;
      // leave the canvas alpha alone: without this the lanes punch transparent holes in the stills
      this.material.blendSrcAlpha = ZeroFactor;
      this.material.blendDstAlpha = OneFactor;
    }

    const n = cloud.n;
    if (sprite) {
      const g = new InstancedBufferGeometry();
      g.setAttribute("position", new BufferAttribute(new Float32Array([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0]), 3));
      g.setIndex([0, 1, 2, 0, 2, 3]);
      g.setAttribute("iPos", new InstancedBufferAttribute(cloud.pos.subarray(0, n * 3), 3));
      g.setAttribute("iColor", new InstancedBufferAttribute(cloud.col.subarray(0, n * 3), 3));
      g.setAttribute("iSize", new InstancedBufferAttribute(cloud.size.subarray(0, n), 1));
      g.setAttribute("iSeed", new InstancedBufferAttribute(cloud.seed.subarray(0, n), 1));
      g.instanceCount = n;
      this.object = new Mesh(g, this.material);
    } else {
      const g = new BufferGeometry();
      g.setAttribute("position", new BufferAttribute(cloud.pos.subarray(0, n * 3), 3));
      g.setAttribute("aColor", new BufferAttribute(cloud.col.subarray(0, n * 3), 3));
      g.setAttribute("aSize", new BufferAttribute(cloud.size.subarray(0, n), 1));
      g.setAttribute("aSeed", new BufferAttribute(cloud.seed.subarray(0, n), 1));
      this.object = new Points(g, this.material);
    }
    this.object.frustumCulled = false;
    this.object.renderOrder = o.order ?? 1;
  }

  /** Strength of the whole layer. At zero it is not drawn: no draw call, no vertex work. */
  set alpha(value: number) {
    this.material.uniforms.uAlpha.value = value;
    this.object.visible = value > 0.0005;
  }

  set time(value: number) {
    this.material.uniforms.uTime.value = value;
  }

  /** Draw only part of the instances: the governor's last step halves the glow. */
  set fraction(value: number) {
    if (this.sprite) (this.object.geometry as InstancedBufferGeometry).instanceCount = Math.max(1, Math.round(this.cloud.n * value));
  }

  resize(px: number, dpr: number, bufferWidth: number, bufferHeight: number): void {
    const u = this.material.uniforms;
    u.uPx.value = this.atten ? px : dpr;
    u.uMaxPx.value = this.maxPx * dpr;
    (u.uViewport.value as Vector2).set(bufferWidth, bufferHeight);
  }
}

/**
 * The deep sky behind the galaxy and the web (D-101): one full-screen triangle drawn first, each
 * pixel looking out along its own direction from the camera, so the clouds and stars turn with the
 * view. Full around the galaxy; it thins toward the web, where the space between galaxies is dark.
 */
const BACKDROP_VERTEX = /* glsl */ `
varying vec2 vNdc;
void main(){ vNdc = position.xy; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

const BACKDROP_FRAGMENT = /* glsl */ `
precision highp float;
uniform mat4 uInvProj;
uniform mat3 uCamRot;
uniform float uRich;
varying vec2 vNdc;
${SKY_CHUNK}
void main(){
  vec4 v = uInvProj * vec4(vNdc, 1.0, 1.0);
  vec3 dir = normalize(uCamRot * normalize(v.xyz / v.w));
  gl_FragColor = vec4(skyDeep(dir, uRich), 1.0);
}
`;

function backdrop(sky: Texture): Mesh<BufferGeometry, ShaderMaterial> {
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3));
  const material = new ShaderMaterial({
    vertexShader: BACKDROP_VERTEX,
    fragmentShader: BACKDROP_FRAGMENT,
    uniforms: { uInvProj: { value: new Matrix4() }, uCamRot: { value: new Matrix3() }, uRich: { value: 1 }, uSky: { value: sky } },
    depthTest: false,
    depthWrite: false,
  });
  const mesh = new Mesh(geometry, material);
  mesh.frustumCulled = false;
  mesh.renderOrder = -1;
  return mesh;
}

/**
 * The foam of the universe seen from very far off (D-119, D-130): cells of walls and threads of
 * galaxies around empty bubbles, shared by the supervoid and the observable universe.
 */
const FOAM_CHUNK = /* glsl */ `
const vec3 VIOLET = vec3(0.5, 0.32, 1.0);
const vec3 AZURE = vec3(0.3, 0.6, 1.0);
const vec3 ROSE = vec3(1.0, 0.4, 0.72);
const vec3 GOLD = vec3(1.0, 0.82, 0.55);

float hash3(vec3 p){
  p = fract(p * 0.3183099 + 0.1);
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}
float noise3(vec3 x){
  vec3 i = floor(x), f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(mix(hash3(i), hash3(i + vec3(1.0, 0.0, 0.0)), f.x), mix(hash3(i + vec3(0.0, 1.0, 0.0)), hash3(i + vec3(1.0, 1.0, 0.0)), f.x), f.y),
    mix(mix(hash3(i + vec3(0.0, 0.0, 1.0)), hash3(i + vec3(1.0, 0.0, 1.0)), f.x), mix(hash3(i + vec3(0.0, 1.0, 1.0)), hash3(i + vec3(1.0, 1.0, 1.0)), f.x), f.y),
    f.z);
}

/* the cells, seen flat: distance to the nearest cell edge (F2 - F1) and the cell's id */
vec2 cellEdge(vec2 p){
  vec2 i = floor(p), f = fract(p);
  float f1 = 9.0, f2 = 9.0, id = 0.0;
  for (int y = -1; y <= 1; y++)
  for (int x = -1; x <= 1; x++) {
    vec2 g = vec2(float(x), float(y));
    vec2 o = vec2(hash3(vec3(i + g, 1.0)), hash3(vec3(i + g, 7.0)));
    float d = length(g + o - f);
    if (d < f1) { f2 = f1; f1 = d; id = hash3(vec3(i + g, 3.0)); } else if (d < f2) { f2 = d; }
  }
  return vec2(f2 - f1, id);
}

/* one layer of the foam: threads of galaxies along the cell edges, knots where they meet */
vec3 webLayer(vec2 p, float scale, float width, float bright){
  vec2 c = cellEdge(p * scale);
  float grain = noise3(vec3(p * scale * 11.0, c.y * 7.0));
  float clumps = noise3(vec3(p * scale * 2.5, c.y * 3.0 + 4.0));
  float core = exp(-c.x * c.x / (width * width)) * pow(grain, 2.5) * (0.4 + 1.2 * clumps);
  float haze = exp(-c.x * c.x / (width * width * 9.0)) * (0.25 + 0.5 * clumps);
  float knot = smoothstep(0.78, 1.0, grain) * exp(-c.x * c.x / (width * width * 0.5));
  vec3 tint = mix(VIOLET, AZURE, c.y);
  tint = mix(tint, ROSE, smoothstep(0.8, 0.95, c.y));
  return (tint * core * 1.3 + tint * haze * 0.25 + mix(GOLD, vec3(1.0), 0.4) * knot * 1.8) * bright;
}

`;

/**
 * Level 4, the observable universe (D-130): out past the supervoid the foam of walls and voids
 * shrinks into one vast sphere, the whole of what can be seen, with us at its middle (our web is
 * pinned there). The foam crowds toward the sphere's edge, where a line of sight crosses more of
 * it, and the edge itself glows faintly warm. Outside it, nothing: the sky is blotted out. Our own
 * illustration: one full-screen triangle, never a drawn line (D-094).
 */
const UNIVERSE_FRAGMENT = /* glsl */ `
precision highp float;
uniform vec2 uHome;    // our web on screen, device pixels from the bottom left: the sphere's middle
uniform float uUnit;   // device pixels per unit (half the window's height)
uniform float uRadius; // the sphere's radius in units: vast as the zoom leaves the supervoid, whole at the stop
uniform float uFrom;   // its radius as the zoom leaves the supervoid, where its foam matches the supervoid's
uniform mat3 uSpin;    // the drag turns the ball like a globe (owner, D-131)
uniform vec4 uVoid;    // the supervoid on the ball: its direction (xyz) and radius (w)
uniform float uTime;
uniform float uAlpha;
uniform int uDetail;
${FOAM_CHUNK}

/* 0 inside a void of radius rad about dir, 1 out in the web */
float voidMask(vec3 p, vec3 dir, float rad){
  return smoothstep(rad * 0.7, rad * 1.12, length(p - dir));
}
/* the foam wrapped round the ball without stretching: three flat layers, each laid along the axis
   it faces, blended by how squarely the surface faces each one */
vec3 ballLayer(vec3 p, float off, float scale, float width, float bright){
  vec3 k = pow(abs(p), vec3(4.0));
  k /= k.x + k.y + k.z + 1e-4;
  vec3 c = vec3(0.0);
  if (k.z > 0.02) c += webLayer(p.xy * 1.3 + off, scale, width, bright) * k.z;
  if (k.x > 0.02) c += webLayer(p.yz * 1.3 + off + 2.7, scale, width, bright) * k.x;
  if (k.y > 0.02) c += webLayer(p.zx * 1.3 + off + 5.9, scale, width, bright) * k.y;
  return c;
}
/* the walls crowding a void's edge */
float voidWall(vec3 p, vec3 dir, float rad){
  float d = (length(p - dir) - rad * 1.05) / (rad * 0.22);
  return exp(-d * d);
}

void main(){
  vec2 w = (gl_FragCoord.xy - uHome) / uUnit;
  vec2 s = w / uRadius;     // the sphere's radii, from its middle
  float r = length(s);
  float t = uTime;
  float edge = r + 0.012 * (noise3(vec3(s * 6.0, 3.0)) - 0.5);
  float inside = 1.0 - smoothstep(0.985, 1.0, edge);

  // a point on the ball's near face, turned with the drag
  vec3 p = uSpin * vec3(s, sqrt(max(1.0 - r * r, 0.0)));

  // the foam, handed on as the sphere shrinks: at first the supervoid's own cells (it carries on),
  // then finer, then (owner, D-131) a dense glowing web, fine enough that its cells read as
  // texture, not as a ball of empty bubbles
  float far1 = smoothstep(4.0, 8.0, uRadius);      // the supervoid's cells
  float far2 = smoothstep(1.4, 3.0, uRadius);      // the middle size
  float whole = 1.0 - smoothstep(1.5, 4.0, uRadius);
  vec3 foam = vec3(0.0);
  if (far1 > 0.0) {
    vec2 c = s * uFrom;
    foam += (webLayer(c + 7.3, 3.4, 0.04, 0.75) + webLayer(c + 3.1, 6.0, 0.035, 0.5)) * far1;
  }
  if (far1 < 1.0) {
    vec3 mid = far2 > 0.0 ? ballLayer(p, 5.0, 26.0, 0.04, 0.8) : vec3(0.0);
    vec3 fine = vec3(0.0);
    if (far2 < 1.0) {
      fine = ballLayer(p, 7.3, 22.0, 0.075, 0.95);
      if (uDetail > 0) fine += ballLayer(p * 1.7, 3.1 + t * 0.0008, 22.0, 0.07, 0.4);
      // the light of countless galaxies between the threads
      float n1 = noise3(p * 6.5 + 1.0);
      float n2 = noise3(p * 18.0 + 4.0 + t * 0.01);
      fine += mix(mix(VIOLET, AZURE, n1), ROSE, smoothstep(0.7, 0.95, n2) * 0.4) * (0.07 + 0.16 * n1 * n2);
    }
    foam += mix(fine, mid, far2) * (1.0 - far1);
  }
  float depth = 1.0 / sqrt(max(1.0 - min(r * r, 1.0), 0.04));
  foam *= mix(1.0, 0.6 + 0.4 * depth, whole);

  // the supervoid (the one the visitor came from) and only a few small voids besides
  float hole = voidMask(p, uVoid.xyz, uVoid.w);
  float wall = voidWall(p, uVoid.xyz, uVoid.w);
  hole *= mix(1.0, voidMask(p, normalize(vec3(0.55, 0.4, 0.73)), 0.075), whole);
  hole *= mix(1.0, voidMask(p, normalize(vec3(-0.35, -0.6, 0.72)), 0.06), whole);
  hole *= mix(1.0, voidMask(p, normalize(vec3(0.2, -0.75, -0.63)), 0.07), whole);
  foam = foam * (0.04 + 0.96 * hole) * (1.0 + 0.9 * wall * whole);

  vec3 col = foam * inside;
  // a faint haze of light filling the ball
  col += mix(VIOLET, AZURE, 0.45) * 0.06 * inside * whole * (0.25 + 0.75 * hole);

  // its edge: the farthest light there is, a faint warm glow
  float rim = exp(-pow((edge - 1.0) / 0.03, 2.0));
  float glow = exp(-max(edge - 1.0, 0.0) * 9.0) * step(1.0, edge);
  float flick = 0.8 + 0.4 * noise3(vec3(s * 5.0, t * 0.05));
  col += mix(ROSE, GOLD, 0.55) * (rim * 0.6 + glow * 0.16) * flick * whole;
  col += mix(ROSE, VIOLET, 0.4) * 0.12 * exp(-pow((edge - 0.96) / 0.06, 2.0)) * whole;

  col = col / (1.0 + max(col - 0.85, 0.0) * 0.9);
  // premultiplied: the ball covers what is behind it; outside it the sky fades to nothing
  float cover = mix(0.92, 0.8 * whole, 1.0 - inside) * uAlpha;
  gl_FragColor = vec4(col * uAlpha, cover);
}
`;

/**
 * Level 3, the supervoid (D-119; the look is D-117's place, now a zoom out of the web): the cosmic
 * web seen so far off that it is a foam of walls and threads of galaxies around great empty
 * bubbles, one bubble filling the frame with a few lonely galaxies in it. Our own illustration:
 * one full-screen triangle added over the sky, three layers of cells (2D Voronoi edges) far to
 * near; never a drawn line (D-094): the threads are beads and clumps of galaxies.
 *
 * It is pinned to our web: the pattern grows and shrinks about the web's place on screen with the
 * camera's distance, so zooming out the walls close in around the web, a patch of the bubble's wall.
 */
const VOID_FRAGMENT = /* glsl */ `
precision highp float;
uniform vec2 uHome;    // our web on screen, device pixels from the bottom left
uniform float uUnit;   // device pixels per unit (half the window's height)
uniform float uGrow;   // how much nearer than the supervoid stop the camera is
uniform float uSwell;  // how far the voids have grown since the visitor arrived: -0.35 to 1 (D-124)
uniform vec2 uPan;     // the drag's turn and tilt
uniform float uTime;
uniform float uAlpha;
uniform int uDetail;

${FOAM_CHUNK}
// three supervoids round our web (owner, D-132), each the same distance from it, so the walls left
// between them meet exactly at our web
const vec2 C0 = vec2(-0.985, 0.174);
const vec2 C1 = vec2(0.643, 0.766);
const vec2 C2 = vec2(0.342, -0.94);
const float WALL = 0.05; // half the width of the wall left between two grown voids, in units

void main(){
  // from our web, in units, scaled about it by the camera's distance
  vec2 w = (gl_FragCoord.xy - uHome) / uUnit / uGrow;
  float t = uTime;
  // each void grows in place, from a dark hole in the foam until it presses on its neighbours
  float grow = clamp((uSwell + 0.35) / 1.35, 0.0, 1.0);
  float R = mix(0.42, 1.55, grow);
  float jit = 0.16 * (noise3(vec3(w * 1.6, 1.0)) - 0.5) + 0.06 * (noise3(vec3(w * 5.0, 2.0)) - 0.5);
  float d0 = length(w - C0);
  float d1 = length(w - C1);
  float d2 = length(w - C2);
  float r1 = min(d0, min(d1, d2));
  float r2 = max(min(d0, d1), min(max(d0, d1), d2));
  // the wall between the two nearest voids: what survives once they meet is the cosmic web
  float gap = (r2 - r1) * 0.5;
  float sd = max(r1 + jit - R, WALL - gap + 0.3 * jit);
  float inside = 1.0 - smoothstep(-0.12, 0.02, sd);
  // the bigger the voids, the harder their walls are crowded and the brighter they burn
  float rim = exp(-pow((sd - 0.06) / 0.12, 2.0)) * mix(0.8, 1.5, grow);

  // outside: a dense web of finer cells, galaxies crowding thickest along the walls; the far
  // layers drift and turn in a drag, the near one holds our web where the walls meet
  vec2 pan = vec2(uPan.x, -uPan.y);
  float out1 = 1.0 - inside;
  vec3 col = vec3(0.0);
  if (uDetail > 0) col += webLayer(w + pan * 0.35 + vec2(t * 0.003, 0.0), 10.0, 0.03, 0.3) * out1;
  col += webLayer(w + pan * 0.15 + 3.1, 6.0, 0.035, 0.5) * out1 * (0.55 + 1.1 * rim);
  col += webLayer(w + 7.3, 3.4, 0.04, 0.75) * out1 * (0.45 + 1.4 * rim);
  // a soft glow of gas along the walls
  col += mix(VIOLET, AZURE, 0.4) * rim * 0.16;
  // a rare, faint, lonely galaxy deep in the dark
  vec2 lp = (w + pan * 0.2) * 9.0;
  vec2 lid = floor(lp);
  float lone = step(0.993, hash3(vec3(lid, 9.0))) * exp(-length(fract(lp) - 0.5) * 18.0) * inside;
  col += GOLD * lone * 0.7;

  col = col / (1.0 + max(col - 0.85, 0.0) * 0.9);
  // premultiplied: inside, the voids cover what is behind them (the sky's clouds) with near black
  float cover = inside * 0.94 * uAlpha;
  gl_FragColor = vec4(col * uAlpha, cover);
}
`;

function supervoid(): Mesh<BufferGeometry, ShaderMaterial> {
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3));
  const material = new ShaderMaterial({
    vertexShader: BACKDROP_VERTEX,
    fragmentShader: VOID_FRAGMENT,
    uniforms: {
      uHome: { value: new Vector2() },
      uUnit: { value: 1 },
      uGrow: { value: 1 },
      uSwell: { value: 0 },
      uPan: { value: new Vector2() },
      uTime: { value: 0 },
      uAlpha: { value: 0 },
      uDetail: { value: 1 },
    },
    transparent: true,
    depthTest: false,
    depthWrite: false,
    // premultiplied: result = colour + behind * (1 - cover), so the void can darken the sky (D-121)
    blending: CustomBlending,
    blendEquation: AddEquation,
    blendSrc: OneFactor,
    blendDst: OneMinusSrcAlphaFactor,
    // leave the canvas alpha alone, as the dust does
    blendSrcAlpha: ZeroFactor,
    blendDstAlpha: OneFactor,
  });
  const mesh = new Mesh(geometry, material);
  mesh.frustumCulled = false;
  mesh.renderOrder = 0;
  mesh.visible = false;
  return mesh;
}

function universe(): Mesh<BufferGeometry, ShaderMaterial> {
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3));
  const material = new ShaderMaterial({
    vertexShader: BACKDROP_VERTEX,
    fragmentShader: UNIVERSE_FRAGMENT,
    uniforms: {
      uHome: { value: new Vector2() },
      uUnit: { value: 1 },
      uRadius: { value: 1 },
      uFrom: { value: 1 },
      uSpin: { value: new Matrix3() },
      uVoid: { value: new Vector4(0, 0, 1, 0.2) },
      uTime: { value: 0 },
      uAlpha: { value: 0 },
      uDetail: { value: 1 },
    },
    transparent: true,
    depthTest: false,
    depthWrite: false,
    // premultiplied: result = colour + behind * (1 - cover), so the void can darken the sky (D-121)
    blending: CustomBlending,
    blendEquation: AddEquation,
    blendSrc: OneFactor,
    blendDst: OneMinusSrcAlphaFactor,
    // leave the canvas alpha alone, as the dust does
    blendSrcAlpha: ZeroFactor,
    blendDstAlpha: OneFactor,
  });
  const mesh = new Mesh(geometry, material);
  mesh.frustumCulled = false;
  mesh.renderOrder = 1;
  mesh.visible = false;
  return mesh;
}

function single(color: readonly [number, number, number], size: number): Cloud {
  return { pos: new Float32Array(3), col: new Float32Array(color), size: new Float32Array([size]), seed: new Float32Array(1), n: 1 };
}

export class AtlasWorld {
  readonly root = new Group();
  private readonly galaxy = new Group();
  private readonly layers: Layer[];
  private readonly glowLayers: Layer[];
  private readonly wash: Layer;
  private readonly stars: Layer;
  private readonly body: Layer;
  private readonly haze: Layer;
  private readonly halo: Layer;
  private readonly companionStars: Layer;
  private readonly companionGlow: Layer;
  private readonly dust: Layer;
  private readonly core: Layer;
  private readonly discLayers: Layer[];
  /** S2's additions to the galaxy, each with its base strength; they fade out with the rest. */
  private readonly s2: [Layer, number][];
  private readonly webStrands: Layer;
  private readonly nucleus: Layer;
  /** The disc's own strength; close in it is dimmed a little so the arms do not burn to white. */
  private readonly discAlpha: number;
  private readonly web: Layer;
  private readonly webGlow: Layer;
  private readonly homeDot: Layer;
  private readonly quasarDot: Layer;
  private readonly webNodes: Vec3[];
  private readonly sky: Mesh<BufferGeometry, ShaderMaterial>;
  /** Level 3, the supervoid (D-119). */
  private readonly voidLayer = supervoid();
  /** Level 4, the observable universe (D-130). */
  private readonly universeLayer = universe();
  /** Scene time the visitor came out to the supervoid, or null while they are not there. */
  private voidSince: number | null = null;
  /** The universe's turn with the drag (D-131) and where its supervoid falls on screen (x, y, facing). */
  private readonly spinEuler = new Euler();
  private readonly spinM4 = new Matrix4();
  private readonly spin = new Matrix3();
  private readonly voidDir = new Vector3();
  private readonly voidSpot = new Vector3(0, 0, -1);
  private bufferWidth = 1;
  private bufferHeight = 1;
  /** The start page's planet, moons, asteroids and ship (D-107); drawn only while `intro` is above 0. */
  private readonly start: StartProps;
  private readonly quasar = new Vector3();
  private readonly focus = new Vector3();
  private readonly scratch = new Vector3();
  /** Strengths of the glow layers for this tier; see the constructor. */
  private readonly glow: { body: number; haze: number; dust: number };
  private glowGain = 1;

  constructor(tier: ParticleTier, narrow: boolean, sky: Texture) {
    this.sky = backdrop(sky);
    this.start = new StartProps(narrow);
    const data = buildAtlas(tier, narrow);
    const counts = COUNTS[tier];
    // On a wide screen the galaxy fills the frame, so a lower tier must not look thinner: fewer
    // sprites each carry more, and the total light stays what the owner approved at the `high`
    // counts. The phone composition keeps the prototype's own phone strengths.
    const top = COUNTS.high;
    const carry = (key: "body" | "haze" | "dust") => (narrow ? 1 : top[key] / counts[key]);
    // dust only part of the way: at full strength the few lanes left read as blots
    this.glow = { body: A.body * carry("body"), haze: A.haze * carry("haze"), dust: A.dust * Math.sqrt(carry("dust")) };
    const discAlpha = narrow ? counts.discAlpha : counts.discAlphaWide;
    this.discAlpha = discAlpha;

    this.wash = new Layer(data.wash, true, { atten: 0, alpha: 0.07, maxPx: 1024, soft: 2.2, order: 0 });
    this.stars = new Layer(data.stars, false, { atten: 0, twinkle: 0.35, maxPx: 8, alpha: 1.0, soft: 1.3, order: 0 });
    this.body = new Layer(data.body, true, { spin: SPIN, alpha: this.glow.body, soft: 2.0, maxPx: 1024, order: 1 });
    this.haze = new Layer(data.haze, true, { spin: SPIN, alpha: this.glow.haze, soft: 2.0, maxPx: 1024, order: 1 });
    this.halo = new Layer(data.halo, false, { spin: SPIN, twinkle: 0.2, alpha: A.halo, maxPx: 12, order: 1 });
    this.companionStars = new Layer(data.companionStars, false, { twinkle: 0.2, alpha: A.halo, maxPx: 1024, order: 1 });
    this.companionGlow = new Layer(data.companionGlow, true, { twinkle: 0.2, alpha: A.halo, maxPx: 1024, order: 1 });
    // fewer points carry more light each
    const disc = new Layer(data.disc, false, { spin: SPIN, twinkle: 0.15, alpha: discAlpha, maxPx: 40, order: 2, near: NEAR });
    // the fine dust (S2) rides in the dust layer: one draw call, not two
    this.dust = new Layer(joinClouds(data.dust, data.fineDust, S2.fineDust / A.dust), true, { spin: SPIN, alpha: this.glow.dust, soft: 1.7, maxPx: 1024, dust: true, order: 3, near: NEAR * 2 });
    // the heart's wide warm glow (S2) rides in the core's layer: one draw call, not two
    this.core = new Layer(joinClouds(data.core, data.heart, S2.heart / A.core), true, { alpha: A.core, soft: 3.2, maxPx: 2048, order: 4 });

    // Level 2. Nothing of it is drawn until the zoom reaches it. Our galaxy and the quasar are
    // two of its lights, a little brighter than the rest: no marker is drawn on them (D-094).
    this.webNodes = data.webNodes;
    this.webGlow = new Layer(data.webGlow, true, { alpha: 0, maxPx: 1024, soft: 2.0, order: 1 });
    this.web = new Layer(data.web, false, { alpha: 0, twinkle: 0.1, maxPx: 12, soft: 1.4, order: 1 });
    this.homeDot = new Layer(single([1.0, 0.9, 0.74], 7), false, { atten: 0, alpha: 0, maxPx: 10, soft: 2.2, order: 1 });
    this.quasarDot = new Layer(single([0.85, 0.94, 1.0], 9), false, { atten: 0, alpha: 0, maxPx: 12, soft: 2.0, order: 1 });

    // S2: filaments, young clumps and their glow, clouds, fine dust, a warm heart. Lower tiers
    // on a wide screen carry more light per particle, as the glow layers above do.
    const more = (key: "filaments" | "clusters" | "clouds" | "fineDust") => (narrow ? 1 : Math.sqrt(top[key] / counts[key]));
    const filaments = new Layer(data.filaments, false, { spin: SPIN, twinkle: 0.1, alpha: 0, maxPx: 40, order: 2, near: NEAR });
    const clusterStars = new Layer(data.clusterStars, false, { spin: SPIN, twinkle: 0.2, alpha: 0, maxPx: 40, order: 2, near: NEAR });
    const clusterGlow = new Layer(data.clusterGlow, true, { spin: SPIN, alpha: 0, soft: 2.0, maxPx: 1024, order: 2, near: NEAR * 2 });
    const clouds = new Layer(data.clouds, true, { spin: SPIN, alpha: 0, soft: 2.2, maxPx: 1024, order: 1, near: NEAR * 3 });

    this.s2 = [
      [filaments, S2.filaments * more("filaments")],
      [clusterStars, S2.clusterStars * more("clusters")],
      [clusterGlow, S2.clusterGlow * more("clusters")],
      [clouds, S2.clouds * more("clouds")],
    ];
    // the heart (D-113): light pouring in, a hot disc and streams spiralling into the black hole; no dark spot, as in real galaxy images
    this.nucleus = new Layer(data.nucleus, false, { spin: NUCLEUS_SPIN, twinkle: 0.12, alpha: NUCLEUS.glow, maxPx: 40, order: 7, near: NEAR });
    this.webStrands = new Layer(data.webStrands, true, { alpha: 0, maxPx: 1024, soft: 2.2, order: 1 });

    this.layers = [this.wash, this.stars, this.body, this.haze, this.halo, this.companionStars, this.companionGlow, disc, this.dust, this.core];
    for (const [layer] of this.s2) this.layers.push(layer);
    this.layers.push(this.nucleus);
    this.layers.push(this.webStrands);
    this.layers.push(this.webGlow, this.web, this.homeDot, this.quasarDot);
    // the governor's last step thins every large glow layer, S2's included (D-111)
    this.glowLayers = [this.body, this.haze, this.dust, clouds, clusterGlow, this.webStrands];
    this.discLayers = [disc, filaments, clusterStars, clusterGlow, clouds, this.nucleus];
    if (data.bulge.n > 0) {
      const bulge = new Layer(data.bulge, false, { spin: SPIN, twinkle: 0.1, alpha: 1, maxPx: 40, order: 2 });
      this.layers.push(bulge);
      this.discLayers.push(bulge);
      this.galaxy.add(bulge.object);
    }
    this.root.add(this.start.root);
    // the supervoid's foam: its far layer is dropped on the lowest tier (its cost is per pixel)
    this.voidLayer.material.uniforms.uDetail.value = tier === "low" ? 0 : 1;
    this.universeLayer.material.uniforms.uDetail.value = tier === "low" ? 0 : 1;
    this.root.add(this.sky, this.voidLayer, this.universeLayer, this.webGlow.object, this.webStrands.object, this.web.object, this.homeDot.object, this.quasarDot.object);

    this.galaxy.rotation.z = -0.2;
    this.root.add(this.wash.object, this.stars.object, this.galaxy);
    this.galaxy.add(this.body.object, this.haze.object, this.halo.object, this.companionStars.object, this.companionGlow.object);
    this.galaxy.add(disc.object, this.dust.object, this.core.object);
    for (const [layer] of this.s2) this.galaxy.add(layer.object);
    this.galaxy.add(this.nucleus.object);
    this.root.updateMatrixWorld(true);
  }

  /** Draw only part of the glow sprites (the governor's last step); the rest carry the light of those dropped. */
  setGlow(fraction: number): void {
    for (const layer of this.glowLayers) layer.fraction = fraction;
    this.glowGain = 1 / fraction;
  }

  /** Sizes, and the quasar's place in the zoomed-out composition. */
  resize(camera: PerspectiveCamera, width: number, height: number, dpr: number): void {
    const bw = width * dpr;
    const bh = height * dpr;
    const px = (6 * dpr * height) / 1000;
    this.bufferWidth = bw;
    this.bufferHeight = bh;
    for (const layer of this.layers) layer.resize(px, dpr, bw, bh);
    this.layoutQuasar(camera, width, height);
  }

  /**
   * The quasar is a galaxy of the web: the knot nearest to where the zoomed-out composition
   * wants its hotspot. If no knot is near, it sits in the plane of the web at that spot.
   */
  private layoutQuasar(camera: PerspectiveCamera, width: number, height: number): void {
    placeCamera(camera, 2, width, height);
    const [wantX, wantY] = isPhone(width, height) ? QUASAR_WANT.narrow : QUASAR_WANT.wide;
    const v = this.scratch;
    let best = 0.3; // NDC: farther than this is not "near"
    let found = false;
    for (let i = 1; i < this.webNodes.length; i++) {
      const [x, y, z] = this.webNodes[i];
      v.set(x, y, z).project(camera);
      if (v.z >= 1) continue;
      const d = Math.hypot(v.x - wantX, (v.y - wantY) * (height / width));
      if (d < best) {
        best = d;
        found = true;
        this.quasar.set(x, y, z);
      }
    }
    if (!found) {
      const e = camera.projectionMatrix.elements;
      const dir = v.set((wantX + e[8]) / e[0], (wantY + e[9]) / e[5], -1).transformDirection(camera.matrixWorld);
      this.quasar.copy(camera.position).addScaledVector(dir, -camera.position.y / dir.y);
    }
    this.quasarDot.object.position.copy(this.quasar);
  }

  /** Where a named place is in the world at scene time `t`. */
  private anchorAt(name: string, t: number, out: Vector3): Vector3 {
    const anchor = ANCHORS[name];
    if (!anchor) return out.set(0, 0, 0);
    if ("web" in anchor) return anchor.web === "quasar" ? out.copy(this.quasar) : out.set(0, 0, 0);
    const [x, y, z] = anchor.local;
    const ang = t * SPIN;
    const c = Math.cos(ang);
    const s = Math.sin(ang);
    if (anchor.spin) out.set(c * x + s * z, y, -s * x + c * z);
    else out.set(x, y, z);
    return this.galaxy.localToWorld(out);
  }

  /** One frame at scene time `t` and the camera at `view`; the fade ranges are the prototype's `frame()`. */
  frame(camera: PerspectiveCamera, t: number, view: SceneInput, width: number, height: number, out: SceneFrame): void {
    const zoom = view.zoom;
    const focus = view.focus && view.dive > 0 ? this.anchorAt(view.focus, t, this.focus) : null;
    placeCamera(camera, zoom, width, height, view.yaw, view.pitch, focus, view.dive, view.intro);
    this.start.frame(camera, t, view.intro);

    const far = sstep(1.2, 1.7, zoom);
    const near = 1 - sstep(1.3, 1.7, zoom);
    const sky = this.sky.material.uniforms;
    (sky.uInvProj.value as Matrix4).copy(camera.projectionMatrixInverse);
    (sky.uCamRot.value as Matrix3).setFromMatrix4(camera.matrixWorld);
    sky.uRich.value = mix(1, 0.45, far);
    for (const layer of this.layers) layer.time = t;
    this.stars.alpha = mix(1, 0.12, far);
    this.wash.alpha = 0.05 * (1 - far);
    const glow = near * this.glowGain;
    this.haze.alpha = this.glow.haze * glow;
    this.body.alpha = this.glow.body * glow;
    this.dust.alpha = this.glow.dust * glow;
    this.core.alpha = A.core * near;
    this.halo.alpha = A.halo * near;
    this.companionStars.alpha = A.halo * near;
    this.companionGlow.alpha = A.halo * near;
    // close in the arms overlap into white: the disc's light is turned down toward stop 0
    const closeIn = mix(0.7, 1, sstep(0, 1, zoom));
    this.discLayers[0].alpha = this.discAlpha * closeIn;
    this.nucleus.alpha = NUCLEUS.glow * near;
    for (const [layer, base] of this.s2) {
      const thinned = this.glowLayers.includes(layer) ? this.glowGain : 1;
      layer.alpha = base * near * thinned * (layer.material.blending === AdditiveBlending ? closeIn : 1);
    }
    // From the web the whole disc is under a pixel and the home light stands for it.
    for (const layer of this.discLayers) layer.object.visible = zoom < 1.97 && layer.material.uniforms.uAlpha.value > 0.0005;

    // out to the supervoid (D-119) the web shrinks into a patch of one wall: its galaxies hand over
    // to the foam of walls around great bubbles, which comes up around it (else they spill into the bubble)
    const shown = sstep(1.6, 1.95, zoom);
    const stays = 1 - sstep(2.25, 2.85, zoom);
    this.web.alpha = sstep(1.35, 1.9, zoom) * stays;
    this.webGlow.alpha = S2.webGlow * shown * stays;
    this.webStrands.alpha = S2.webStrands * shown * stays * this.glowGain;
    this.homeDot.alpha = shown * stays;
    this.quasarDot.alpha = shown * stays;
    this.frameVoid(camera, t, view, width, height, sstep(2.05, 2.75, zoom) * (1 - sstep(3.15, 3.7, zoom)));
    this.frameUniverse(camera, t, view, width, height, sstep(3.0, 3.35, zoom));

    this.report(camera, t, zoom, width, height, out);
  }

  /** The supervoid's foam, pinned to our web's place on screen and scaled by the camera's distance. */
  private frameVoid(camera: PerspectiveCamera, t: number, view: SceneInput, width: number, height: number, alpha: number): void {
    // D-124: the void grows on its own while the visitor is out there, quickly at first so it is
    // seen, then ever more slowly, a darkness creeping; it starts again on the next visit out
    if (view.zoom < 2.3) this.voidSince = null;
    else this.voidSince ??= t;
    const out = this.voidSince === null ? 0 : t - this.voidSince;
    const mesh = this.voidLayer;
    mesh.visible = alpha > 0.0005;
    if (!mesh.visible) return;
    const u = mesh.material.uniforms;
    const v = this.scratch.set(0, 0, 0).project(camera);
    (u.uHome.value as Vector2).set((v.x * 0.5 + 0.5) * this.bufferWidth, (v.y * 0.5 + 0.5) * this.bufferHeight);
    u.uUnit.value = this.bufferHeight / 2;
    const last = (isPhone(width, height) ? KEYS_PHONE : KEYS_DESK)[VOID_STOP].d;
    u.uGrow.value = last / Math.max(1, camera.position.length());
    (u.uPan.value as Vector2).set(view.yaw * 0.6, view.pitch * 0.6);
    u.uSwell.value = mix(-0.35, 1, 1 - Math.exp(-out / 9));
    u.uTime.value = t;
    u.uAlpha.value = alpha;
  }

  /**
   * The observable universe (D-130), pinned to our web at its middle. Its radius follows the zoom,
   * not the camera's distance (the camera stays inside its far plane): vast as the zoom leaves the
   * supervoid, so the foam carries on, then shrinking to the whole sphere at the stop.
   */
  private frameUniverse(camera: PerspectiveCamera, t: number, view: SceneInput, width: number, height: number, alpha: number): void {
    const mesh = this.universeLayer;
    mesh.visible = alpha > 0.0005;
    if (!mesh.visible) return;
    const u = mesh.material.uniforms;
    const v = this.scratch.set(0, 0, 0).project(camera);
    (u.uHome.value as Vector2).set((v.x * 0.5 + 0.5) * this.bufferWidth, (v.y * 0.5 + 0.5) * this.bufferHeight);
    u.uUnit.value = this.bufferHeight / 2;
    // whole, it fits the window's height on a laptop and its width on a phone
    const whole = isPhone(width, height) ? (width / height) * 0.88 : 0.68;
    const out = sstep(3, LAST_STOP, view.zoom);
    u.uRadius.value = whole * Math.exp(mix(Math.log(UNIVERSE_FROM), 0, out));
    u.uFrom.value = whole * UNIVERSE_FROM;
    // the drag turns the ball like a globe (owner, D-131): its features follow the drag
    this.spinEuler.set(-view.pitch * 0.5, -view.yaw * 0.5, 0, "XYZ");
    this.spin.setFromMatrix4(this.spinM4.makeRotationFromEuler(this.spinEuler));
    (u.uSpin.value as Matrix3).copy(this.spin).transpose();
    // the supervoid: as the zoom leaves the supervoids it is the left one at its true size (D-132),
    // then it settles to a modest dark patch beside our web once the ball is whole (D-131: one main
    // void; the owner asked for it smaller, D-132)
    const ball = u.uRadius.value as number;
    const grown = 1 - sstep(1.5, 4.0, ball);
    const scale = whole * UNIVERSE_FROM;
    const rad = mix(1.55 / scale, 0.11, grown);
    const off = mix(1.0 / scale, 0.115, grown);
    this.voidDir.set(-0.985 * off, 0.174 * off, Math.sqrt(Math.max(0, 1 - off * off))).normalize();
    (u.uVoid.value as Vector4).set(this.voidDir.x, this.voidDir.y, this.voidDir.z, rad);
    u.uTime.value = t;
    u.uAlpha.value = alpha;
    // where the supervoid's hotspot falls on screen, in CSS pixels (report() reads it)
    const seen = this.scratch.copy(this.voidDir).applyMatrix3(this.spin);
    const home = u.uHome.value as Vector2;
    const unit = (u.uUnit.value as number) * ball;
    this.voidSpot.set((home.x + seen.x * unit) * (width / this.bufferWidth), height - (home.y + seen.y * unit) * (height / this.bufferHeight), seen.z);
  }

  /** Projects the anchors for the DOM (hotspots). */
  private report(camera: PerspectiveCamera, t: number, zoom: number, width: number, height: number, out: SceneFrame): void {
    out.zoom = zoom;
    out.width = width;
    out.height = height;
    out.narrow = isPhone(width, height);
    const v = this.scratch;
    for (const name of Object.keys(ANCHORS)) {
      this.anchorAt(name, t, v).project(camera);
      const point = out.points[name];
      point.on = v.z < 1;
      point.x = (v.x * 0.5 + 0.5) * width;
      point.y = (-v.y * 0.5 + 0.5) * height;
    }
    // the supervoid's hotspot rides on the turning ball (D-131), hidden while it faces away
    if (this.universeLayer.visible) {
      const spot = out.points.voidspot;
      spot.x = this.voidSpot.x;
      spot.y = this.voidSpot.y;
      spot.on = spot.on && this.voidSpot.z > 0.2;
    }
    // half the width of the disc on screen
    let min = Infinity;
    let max = -Infinity;
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * TAU;
      this.galaxy.localToWorld(v.set(OUTER * Math.cos(a), 0, OUTER * Math.sin(a))).project(camera);
      min = Math.min(min, v.x);
      max = Math.max(max, v.x);
    }
    out.radius = ((max - min) / 4) * width;
  }

  dispose(): void {
    this.root.traverse((object: Object3D) => {
      const mesh = object as Partial<Mesh>;
      mesh.geometry?.dispose();
      const material = mesh.material as Material | Material[] | undefined;
      if (Array.isArray(material)) material.forEach((m) => m.dispose());
      else material?.dispose();
    });
  }
}
