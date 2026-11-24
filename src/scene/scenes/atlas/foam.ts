/**
 * The foam of the universe seen from very far off (D-119, D-130): cells of walls and threads of
 * galaxies around empty bubbles, shared by the supervoid and the observable universe.
 */
export const FOAM_CHUNK = /* glsl */ `
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
