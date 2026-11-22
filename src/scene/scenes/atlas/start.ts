/**
 * The start page's foreground (D-107): a planet with a glowing atmosphere curving across the
 * lower left, two small moons, drifting asteroids, and a sleek ship with blue engine trails,
 * set before the galaxy as in the owner's `Home.png`. All of it our own, built here in code.
 *
 * It lives in the camera's own space: each frame the group takes the camera's place and turn, and
 * every object stands at a point of the screen (normalised device coordinates) at a depth, so the
 * composition holds at every window size and under the lens shift. `intro` runs from 1 (the start
 * page) to 0 (the galaxy): as it falls the ship speeds away toward the galaxy, the planet slides
 * down and past, and the asteroids stream by; at 0 nothing here is drawn at all.
 *
 * Every material is unlit (ARCHITECTURE.md 3.8): light is a direction in camera space, from the
 * galaxy, worked out in the shaders.
 */

import {
  AdditiveBlending,
  BackSide,
  BufferAttribute,
  BufferGeometry,
  DynamicDrawUsage,
  Group,
  IcosahedronGeometry,
  InstancedMesh,
  Matrix4,
  Mesh,
  Quaternion,
  ShaderMaterial,
  SphereGeometry,
  Vector3,
  type Material,
  type Object3D,
  type PerspectiveCamera,
  type ShaderMaterialParameters,
} from "three";
import { mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";
import { getShip, type ShipClass } from "@/lib/ship";
import { mix, sstep } from "./model";
import { buildShip, type Vec3 as ShipPoint } from "./ships";

// ---------- shaders ----------

const BODY_VERTEX = /* glsl */ `
attribute float aPart;
attribute float aLit;
varying vec3 vN;
varying vec3 vV;
varying vec3 vO;
varying vec3 vNo;
varying float vPart;
varying float vLit;
void main(){
  vec4 local = vec4(position, 1.0);
  vec3 n = normal;
#ifdef USE_INSTANCING
  local = instanceMatrix * local;
  n = mat3(instanceMatrix) * n;
#endif
  vO = position;
  vNo = normal;
  vPart = aPart;
  vLit = aLit;
  vec4 mv = modelViewMatrix * local;
  vN = normalize(normalMatrix * n);
  vV = -mv.xyz;
  gl_Position = projectionMatrix * mv;
}
`;

const NOISE = /* glsl */ `
float h3(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float n3(vec3 x){
  vec3 i = floor(x), f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(h3(i), h3(i + vec3(1,0,0)), f.x), mix(h3(i + vec3(0,1,0)), h3(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(h3(i + vec3(0,0,1)), h3(i + vec3(1,0,1)), f.x), mix(h3(i + vec3(0,1,1)), h3(i + vec3(1,1,1)), f.x), f.y), f.z);
}
float fbm3(vec3 p){ float s = 0.0, w = 0.5; for (int i = 0; i < 5; i++){ s += w * n3(p); p = p * 2.07 + 1.7; w *= 0.5; } return s / 0.96875; }
`;

/* kind 0 the planet, 1 a moon, 2 a rock, 3 the ship (aPart and aLit: see ships.ts) */
const BODY_FRAGMENT = /* glsl */ `
uniform int uKind;
uniform vec3 uLight;
uniform float uTime;
uniform float uAlpha;
varying vec3 vN;
varying vec3 vV;
varying vec3 vO;
varying vec3 vNo;
varying float vPart;
varying float vLit;
${NOISE}
void main(){
  vec3 n = normalize(vN), v = normalize(vV), L = normalize(uLight);
  float ndl = dot(n, L);
  float diff = max(ndl, 0.0);
  float wrap = clamp(ndl * 0.5 + 0.5, 0.0, 1.0);
  float fres = pow(1.0 - max(dot(n, v), 0.0), 3.0);
  float spec = pow(max(dot(reflect(-L, n), v), 0.0), 36.0);
  // the galaxy's coloured light fills the shadows a little: violet from below, azure from the side
  vec3 fill = mix(vec3(0.22, 0.12, 0.42), vec3(0.12, 0.22, 0.48), n.x * 0.5 + 0.5) * 0.18;
  vec3 col;
  if (uKind == 0) {
    vec3 p = normalize(vO);
    float h = fbm3(p * 3.6 + 1.3);
    float land = smoothstep(0.53, 0.57, h);
    vec3 ocean = mix(vec3(0.015, 0.05, 0.16), vec3(0.04, 0.16, 0.36), smoothstep(0.3, 0.53, h));
    vec3 ground = mix(vec3(0.3, 0.22, 0.15), vec3(0.58, 0.44, 0.3), fbm3(p * 7.0));
    ground = mix(ground, vec3(0.86, 0.9, 0.95), smoothstep(0.78, 0.92, abs(p.y)));
    vec3 surface = mix(ocean, ground, land);
    float cloud = smoothstep(0.58, 0.85, fbm3(p * 5.5 + vec3(uTime * 0.008, 0.0, 0.0)));
    surface = mix(surface, vec3(0.88, 0.92, 1.0), cloud * 0.55);
    col = surface * (0.03 + 0.75 * diff) + fill * 0.35;
    col += vec3(0.8, 0.9, 1.0) * spec * (1.0 - land) * (1.0 - cloud) * 0.5;
    // city lights on the night side
    float night = smoothstep(0.1, -0.15, ndl) * land * (1.0 - cloud);
    float town = step(0.86, h3(floor(p * 140.0))) * smoothstep(0.55, 0.75, fbm3(p * 9.0));
    col += vec3(1.0, 0.72, 0.38) * night * town * 0.9;
    // the atmosphere: blue at the limb, bright where the light grazes it
    // the atmosphere: a thin bright band at the very limb, not a wash over the whole face
    float limb = pow(1.0 - max(dot(n, v), 0.0), 7.0);
    col += vec3(0.25, 0.55, 1.0) * (limb * (0.6 + 2.6 * wrap) + fres * 0.12 * wrap);
  } else if (uKind == 1) {
    vec3 p = normalize(vO);
    float rock = fbm3(p * 4.0);
    float crater = smoothstep(0.62, 0.7, fbm3(p * 9.0 + 4.0));
    vec3 grey = mix(vec3(0.32, 0.31, 0.34), vec3(0.6, 0.58, 0.6), rock) * (1.0 - crater * 0.35);
    col = grey * (0.04 + 1.0 * diff) + fill + vec3(0.5, 0.6, 1.0) * fres * wrap * 0.35;
  } else if (uKind == 2) {
    float grain = fbm3(vO * 5.0);
    vec3 stone = mix(vec3(0.18, 0.14, 0.12), vec3(0.42, 0.33, 0.27), grain);
    col = stone * (0.05 + 1.1 * diff) + fill * 0.8 + vec3(1.0, 0.7, 0.45) * pow(1.0 - max(dot(n, v), 0.0), 4.0) * wrap * 0.35;
  } else {
    // the fleet (D-120): ids in ships.ts
    float id = floor(vPart + 0.5);
    if (id == 5.0 || id == 6.0 || id == 13.0) {
      // lights: blue running strips, red wingtip lights, the soft blue glow of a deflector or a nacelle cap
      col = id == 5.0 ? vec3(0.45, 0.8, 1.0) * 2.3 : id == 6.0 ? vec3(1.0, 0.25, 0.2) * 2.0 : vec3(0.35, 0.7, 1.0) * (1.6 + fres * 1.4);
    } else if (id == 1.0) {
      // glass: dark, catching the light and the sky
      col = vec3(0.04, 0.08, 0.16) + vec3(0.5, 0.85, 1.0) * (spec * 1.6 + fres * 0.6);
    } else if (id == 2.0) {
      // engine housings: dark, the faces turned back glowing blue
      float rim = smoothstep(0.2, 0.85, -normalize(vNo).x);
      col = vec3(0.16, 0.17, 0.22) * (0.15 + diff) + fill + vec3(0.3, 0.7, 1.0) * rim * 2.2;
    } else {
      // hull: silver, gold, gunmetal, pearl, blue paint, white paint, steel, deep navy or graphite
      vec3 base = id == 0.0 ? vec3(0.76, 0.79, 0.86)
        : id == 3.0 ? vec3(0.98, 0.74, 0.34)
        : id == 4.0 ? vec3(0.27, 0.29, 0.34)
        : id == 7.0 ? vec3(0.86, 0.84, 0.8)
        : id == 8.0 ? vec3(0.22, 0.42, 0.86)
        : id == 9.0 ? vec3(0.9, 0.92, 0.95)
        : id == 10.0 ? vec3(0.58, 0.62, 0.7)
        : id == 11.0 ? vec3(0.13, 0.17, 0.3)
        : vec3(0.15, 0.16, 0.19);
      // how mirror-like: gold and the metals reflect, paint and pearl are softer
      float metalness = id == 3.0 ? 0.9 : id == 0.0 || id == 10.0 ? 0.55 : id == 4.0 || id == 12.0 || id == 11.0 ? 0.45 : 0.2;
      float shine = id == 3.0 ? 1.6 : id == 7.0 || id == 9.0 ? 0.8 : 0.9;
      // plating: panel seams, and each panel a shade of its own
      vec3 cell = floor(vO * vec3(16.0, 22.0, 13.0));
      float seams = step(0.06, fract(vO.x * 16.0)) * step(0.07, fract(vO.z * 13.0 + 0.3));
      // pearl is poured, not plated: no seams, only the faintest shading
      float panel = id == 7.0 ? 0.97 + 0.03 * h3(cell) : (0.9 + 0.1 * h3(cell)) * mix(0.88, 1.0, seams);
      vec3 albedo = base * panel;
      // what the hull mirrors: the violet and azure of the sky, and the galaxy's warm light
      vec3 r = reflect(-v, n);
      vec3 env = mix(vec3(0.05, 0.03, 0.12), vec3(0.2, 0.3, 0.6), r.y * 0.5 + 0.5) + vec3(1.0, 0.82, 0.62) * pow(max(dot(r, L), 0.0), 10.0) * 0.8;
      col = albedo * (0.1 + 0.9 * diff) * (1.0 - metalness * 0.45) + fill * 1.2 + albedo * env * metalness * 1.4;
      col += mix(vec3(0.9), base, id == 3.0 ? 0.8 : 0.4) * spec * shine + vec3(0.45, 0.7, 1.0) * fres * 0.45;
      // pearl: a soft rose-to-azure sheen toward the edges
      if (id == 7.0) col += mix(vec3(1.0, 0.7, 0.85), vec3(0.6, 0.8, 1.0), fres) * fres * 0.35;
      // windows: rows of small lights on the windowed hull's sides, warm on pale hulls, blue on dark ones
      if (vLit > 0.5 && abs(normalize(vNo).y) < 0.55) {
        vec2 w = vec2(vO.x * 85.0, vO.y * 80.0);
        float lit = step(0.5, fract(w.x)) * step(0.55, fract(w.y)) * step(0.45, h3(vec3(floor(w), floor(vO.z * 4.0))));
        vec3 glow = dot(base, vec3(0.33)) > 0.4 ? vec3(1.0, 0.86, 0.62) : vec3(0.55, 0.8, 1.0);
        col += glow * lit * 1.5;
      }
    }
  }
  gl_FragColor = vec4(col, uAlpha);
}
`;

/* the air around the planet, seen past its edge: a soft blue halo on the lit side */
const HALO_FRAGMENT = /* glsl */ `
uniform vec3 uLight;
uniform float uAlpha;
varying vec3 vN;
varying vec3 vV;
void main(){
  vec3 n = normalize(vN), v = normalize(vV);
  float edge = pow(clamp(1.0 + dot(n, v) * 1.25, 0.0, 1.0), 2.5);
  float lit = clamp(dot(n, normalize(uLight)) * 0.6 + 0.6, 0.0, 1.0);
  gl_FragColor = vec4(vec3(0.3, 0.6, 1.0) * edge * (0.25 + lit) * uAlpha, 1.0);
}
`;

/* the engines' light: a hot glow at each nozzle and a long trail behind it (uv.x along, uv.y across) */
const ENGINE_VERTEX = /* glsl */ `
attribute vec2 aUv;
attribute float aKind;
varying vec2 vUv;
varying float vKind;
void main(){ vUv = aUv; vKind = aKind; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;

const ENGINE_FRAGMENT = /* glsl */ `
uniform float uTime;
uniform float uPower;
uniform float uAlpha;
varying vec2 vUv;
varying float vKind;
void main(){
  vec3 light;
  if (vKind < 0.5) {
    float across = exp(-pow((vUv.y - 0.5) * 4.2, 2.0));
    float core = exp(-pow((vUv.y - 0.5) * 11.0, 2.0));
    float along = pow(1.0 - vUv.x, 1.6);
    float flicker = 0.88 + 0.12 * sin(uTime * 23.0 + vUv.x * 30.0);
    light = (vec3(0.2, 0.5, 1.0) * across + vec3(0.85, 0.95, 1.0) * core * (1.0 - vUv.x)) * along * flicker;
  } else {
    float r = length(vUv - 0.5) * 2.0;
    light = vec3(0.6, 0.85, 1.0) * exp(-r * r * 6.0) * 1.4 + vec3(1.0) * exp(-r * r * 40.0);
  }
  gl_FragColor = vec4(light * uPower * uAlpha, 1.0);
}
`;

// ---------- geometry ----------

function rand(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Engine glows and trails drawn at most: the fleet's largest has four (D-118). */
const ENGINES = 4;

/** How far the ship rolls about its heading: enough to show its top, wings spread (D-109). */
const SHIP_BANK = 1.0;

/** A rock: an icosahedron pushed in and out by a few waves, so it is lumpy and faceted. */
function rockGeometry(): BufferGeometry {
  let g: BufferGeometry = new IcosahedronGeometry(1, 3);
  g.deleteAttribute("normal");
  g.deleteAttribute("uv");
  g = mergeVertices(g);
  const p = g.getAttribute("position");
  const v = new Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const k = 1 + 0.24 * Math.sin(v.x * 3.1 + v.y * 1.7) * Math.cos(v.z * 2.3 - v.x) + 0.1 * Math.sin(v.y * 7.0 + v.z * 5.0) + 0.05 * Math.sin(v.x * 13.0 - v.z * 11.0);
    v.multiplyScalar(k);
    p.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  g.setAttribute("aPart", new BufferAttribute(new Float32Array(p.count), 1));
  return g;
}

function sphere(segments: number): BufferGeometry {
  const g = new SphereGeometry(1, segments, Math.round(segments * 0.66));
  g.setAttribute("aPart", new BufferAttribute(new Float32Array(g.getAttribute("position").count), 1));
  return g;
}

// ---------- the props ----------

interface Rock {
  x: number;
  y: number;
  depth: number;
  size: number;
  axis: Vector3;
  spin: number;
  phase: number;
}

const LIGHT = new Vector3(0.62, 0.55, 0.25).normalize(); // from the galaxy, upper right, in camera space
const ROCKS = 26;

export class StartProps {
  readonly root = new Group();
  private readonly materials: ShaderMaterial[] = [];
  private readonly planet: Mesh;
  private readonly halo: Mesh;
  private readonly moons: InstancedMesh;
  private readonly rocks: InstancedMesh;
  private readonly ship: Mesh;
  /** The class on show and its engine nozzles (D-118): the visitor may switch it on the start page. */
  private shipClass: ShipClass;
  private nozzles: ShipPoint[];
  private glow: number;
  private shipSize: number;
  private readonly engines: Mesh<BufferGeometry, ShaderMaterial>;
  private readonly rockList: Rock[] = [];
  private readonly m = new Matrix4();
  private readonly q = new Quaternion();
  private readonly v = new Vector3();
  private readonly w = new Vector3();
  private readonly s = new Vector3();

  constructor(private readonly narrow: boolean) {
    const body = (kind: number, extra: ShaderMaterialParameters = {}) => {
      const material = new ShaderMaterial({
        vertexShader: BODY_VERTEX,
        fragmentShader: BODY_FRAGMENT,
        uniforms: { uKind: { value: kind }, uLight: { value: LIGHT }, uTime: { value: 0 }, uAlpha: { value: 1 } },
        transparent: true,
        depthTest: true,
        depthWrite: true,
        ...extra,
      });
      this.materials.push(material);
      return material;
    };

    this.planet = new Mesh(sphere(96), body(0));
    const haloMaterial = new ShaderMaterial({
      vertexShader: BODY_VERTEX,
      fragmentShader: HALO_FRAGMENT,
      uniforms: { uLight: { value: LIGHT }, uAlpha: { value: 1 } },
      side: BackSide,
      blending: AdditiveBlending,
      transparent: true,
      depthWrite: false,
    });
    this.materials.push(haloMaterial);
    this.halo = new Mesh(sphere(64), haloMaterial);

    this.moons = new InstancedMesh(sphere(40), body(1), 2);
    this.rocks = new InstancedMesh(rockGeometry(), body(2), ROCKS);
    this.rocks.instanceMatrix.setUsage(DynamicDrawUsage);
    this.shipClass = getShip();
    const model = buildShip(this.shipClass);
    this.nozzles = model.nozzles;
    this.glow = model.glow;
    this.shipSize = model.size;
    this.ship = new Mesh(model.geometry, body(3));

    const engineMaterial = new ShaderMaterial({
      vertexShader: ENGINE_VERTEX,
      fragmentShader: ENGINE_FRAGMENT,
      uniforms: { uTime: { value: 0 }, uPower: { value: 1 }, uAlpha: { value: 1 } },
      blending: AdditiveBlending,
      transparent: true,
      depthTest: false,
      depthWrite: false,
    });
    this.materials.push(engineMaterial);
    const engineGeometry = new BufferGeometry();
    // eight quads: up to four trails, then their four nozzle glows; positions are written each frame
    engineGeometry.setAttribute("position", new BufferAttribute(new Float32Array(ENGINES * 2 * 6 * 3), 3).setUsage(DynamicDrawUsage));
    const uv: number[] = [];
    const kind: number[] = [];
    for (let quad = 0; quad < ENGINES * 2; quad++) {
      uv.push(0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1);
      for (let i = 0; i < 6; i++) kind.push(quad < ENGINES ? 0 : 1);
    }
    engineGeometry.setAttribute("aUv", new BufferAttribute(new Float32Array(uv), 2));
    engineGeometry.setAttribute("aKind", new BufferAttribute(new Float32Array(kind), 1));
    this.engines = new Mesh(engineGeometry, engineMaterial);

    for (const object of [this.planet, this.halo, this.moons, this.rocks, this.ship, this.engines] as Object3D[]) {
      object.frustumCulled = false;
      this.root.add(object);
    }
    // drawn after the galaxy and the sky, over them: the planet, its air, the moons, the rocks, the ship, its light
    this.planet.renderOrder = 20;
    this.halo.renderOrder = 21;
    this.moons.renderOrder = 20;
    this.rocks.renderOrder = 22;
    this.ship.renderOrder = 23;
    this.engines.renderOrder = 24;

    const r = rand(7);
    for (let i = 0; i < ROCKS; i++) {
      // most in the lower left over the planet's edge and the lower right; a few higher, far off
      const zone = r();
      const x = zone < 0.35 ? mix(-1.15, -0.75, r()) : zone < 0.8 ? mix(0.45, 1.15, r()) : mix(-0.6, 0.3, r());
      const y = zone < 0.35 ? mix(-1.05, -0.7, r()) : zone < 0.8 ? mix(-1.05, -0.25, r()) : mix(0.45, 0.72, r());
      const depth = mix(4, 18, r() * r());
      this.rockList.push({
        x,
        y,
        depth,
        size: mix(0.018, 0.075, r() ** 2.5) * depth * 0.32,
        axis: new Vector3(r() - 0.5, r() - 0.5, r() - 0.5).normalize(),
        spin: mix(0.05, 0.35, r()),
        phase: r() * 6.28,
      });
    }
  }

  /** A point in camera space that the camera, as it is now, draws at screen point (nx, ny), `depth` ahead. */
  private at(camera: PerspectiveCamera, nx: number, ny: number, depth: number, out: Vector3): Vector3 {
    const e = camera.projectionMatrix.elements;
    return out.set(((nx + e[8]) * depth) / e[0], ((ny + e[9]) * depth) / e[5], -depth);
  }

  /** A length in camera space that is `ny` of the screen's half-height at `depth`. */
  private size(camera: PerspectiveCamera, ny: number, depth: number): number {
    return (ny * depth) / camera.projectionMatrix.elements[5];
  }

  frame(camera: PerspectiveCamera, t: number, intro: number): void {
    const visible = intro > 0.001;
    this.root.visible = visible;
    if (!visible) return;
    // the visitor chose another class of ship on the start page (D-118): build it
    const wanted = getShip();
    if (wanted !== this.shipClass) {
      const model = buildShip(wanted);
      this.ship.geometry.dispose();
      this.ship.geometry = model.geometry;
      this.nozzles = model.nozzles;
      this.glow = model.glow;
      this.shipSize = model.size;
      this.shipClass = wanted;
    }
    this.root.position.copy(camera.position);
    this.root.quaternion.copy(camera.quaternion);
    this.root.updateMatrixWorld(true);

    const go = 1 - intro; // how far into the flight
    const fade = sstep(0.0, 0.35, intro);
    for (const material of this.materials) {
      material.uniforms.uAlpha.value = fade;
      if (material.uniforms.uTime) material.uniforms.uTime.value = t;
    }
    const narrow = this.narrow;

    // the planet: a great arc across the lower left; in flight it falls away below and grows
    const pd = 30;
    const pr = (narrow ? 1.6 : 3.05) * (1 + go * 0.8);
    this.at(camera, narrow ? -0.35 : -1.3, (narrow ? -2.42 : -3.3) - go * 2.2, pd, this.planet.position);
    this.planet.scale.setScalar(this.size(camera, pr, pd));
    this.planet.rotation.set(0.35, t * 0.004, 0.2);
    this.halo.position.copy(this.planet.position);
    this.halo.scale.setScalar(this.planet.scale.x * 1.045);

    // the moons: one small beyond the planet's limb, one further off to the right
    const moon = (i: number, nx: number, ny: number, depth: number, radius: number) => {
      this.at(camera, nx - go * 0.6 * Math.sign(nx || 1), ny - go * 0.8, depth, this.v);
      this.s.setScalar(this.size(camera, radius, depth));
      this.q.setFromAxisAngle(this.w.set(0, 1, 0), t * 0.02 + i);
      this.moons.setMatrixAt(i, this.m.compose(this.v, this.q, this.s));
    };
    moon(0, narrow ? -0.6 : -0.62, narrow ? 0.62 : 0.66, 40, narrow ? 0.05 : 0.045);
    moon(1, narrow ? 0.62 : 0.5, narrow ? -0.42 : -0.38, 26, narrow ? 0.09 : 0.11);
    this.moons.instanceMatrix.needsUpdate = true;

    // the rocks drift and tumble; in flight they stream outward past the camera
    for (let i = 0; i < this.rockList.length; i++) {
      const rock = this.rockList[i];
      const out = 1 + go * go * 2.5;
      const depth = rock.depth * (1 - go * 0.85);
      const drift = Math.sin(t * 0.05 + rock.phase) * 0.02;
      this.at(camera, rock.x * out + drift, rock.y * out, depth, this.v);
      this.q.setFromAxisAngle(rock.axis, t * rock.spin + rock.phase);
      this.s.setScalar(rock.size * (1 - go * 0.6));
      this.rocks.setMatrixAt(i, this.m.compose(this.v, this.q, this.s));
    }
    this.rocks.instanceMatrix.needsUpdate = true;

    // the ship: crossing toward the galaxy; in flight it speeds away into the distance
    const sd = 7 + go * go * 260;
    const sx = mix(narrow ? 0.28 : 0.02, 0.1, sstep(0, 1, go));
    const sy = mix(narrow ? 0.02 : -0.3, 0.04, sstep(0, 1, go));
    const bob = Math.sin(t * 0.6) * 0.008;
    this.at(camera, sx, sy + bob, sd, this.ship.position);
    this.at(camera, sx + 0.9, sy + 0.32, sd + 30, this.v); // where it is heading
    this.w.subVectors(this.v, this.ship.position).normalize();
    this.ship.quaternion.setFromUnitVectors(this.s.set(1, 0, 0), this.w);
    this.q.setFromAxisAngle(this.w, SHIP_BANK + Math.sin(t * 0.4) * 0.05); // rolled so its top faces the viewer
    this.ship.quaternion.premultiply(this.q);
    this.ship.scale.setScalar((narrow ? 0.62 : 0.92) * this.shipSize);
    this.ship.updateMatrixWorld();

    // its engines: a glow at each nozzle and a trail behind, longer and brighter in flight
    const material = this.engines.material;
    material.uniforms.uPower.value = 1 + go * 1.5;
    const positions = this.engines.geometry.getAttribute("position") as BufferAttribute;
    const back = this.w.clone().negate();
    const trail = (0.9 + go * 2.5) * this.ship.scale.x;
    const quad = (index: number, from: Vector3, to: Vector3, w0: number, w1: number) => {
      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const len = Math.hypot(dx, dy) || 1;
      const px = -dy / len;
      const py = dx / len;
      const a = [from.x + px * w0, from.y + py * w0, from.z];
      const b = [to.x + px * w1, to.y + py * w1, to.z];
      const c = [to.x - px * w1, to.y - py * w1, to.z];
      const d = [from.x - px * w0, from.y - py * w0, from.z];
      // uv (0,0) (1,0) (1,1) / (0,0) (1,1) (0,1): x along, y across
      const corners = [d, c, b, d, b, a];
      corners.forEach((corner, i) => positions.setXYZ(index * 6 + i, corner[0], corner[1], corner[2]));
    };
    for (let i = 0; i < ENGINES; i++) {
      const at = this.nozzles[i];
      if (!at) {
        // a ship with fewer engines: this pair of quads folds to nothing
        const none = new Vector3(0, 0, -1e3);
        quad(i, none, none, 0, 0);
        quad(i + ENGINES, none, none, 0, 0);
        continue;
      }
      const nozzle = new Vector3(at[0], at[1], at[2]).applyMatrix4(this.ship.matrix);
      const end = nozzle.clone().addScaledVector(back, trail);
      const w = 0.035 * this.glow * this.ship.scale.x * (1 + go);
      quad(i, nozzle, end, w * 1.4, w * 0.3);
      const g = 0.09 * this.glow * this.ship.scale.x * (1 + go * 0.5);
      quad(i + ENGINES, nozzle.clone().add(new Vector3(-g, 0, 0)), nozzle.clone().add(new Vector3(g, 0, 0)), g, g);
    }
    positions.needsUpdate = true;
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
