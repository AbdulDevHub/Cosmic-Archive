/**
 * The deep sky (D-101): what lies behind every scene, so no frame is empty. Coloured clouds of
 * gas (violet, azure, rose), soft drifts of dust, a dense field of stars with a few bright ones
 * carrying light spikes, and optionally the warm glow of a galaxy's crowded heart.
 *
 * It is a function of a direction, so it can sit behind a camera that turns (the atlas), be
 * bent by a black hole's gravity (the black hole and the quasar sample it with each ray's final
 * direction, so the glow behind the hole is lensed into a ring), or be laid flat behind a picture
 * that has no camera (the nebula).
 *
 * Two parts, for cost: the clouds are noise, smooth and expensive, so they are drawn once into a
 * cube texture when a scene mounts (`SKY_CLOUDS_CHUNK`, `src/scene/sky.ts`); the stars are sharp
 * and cheap, so they stay live (`SKY_CHUNK`). Each frame the sky is one cube lookup and three
 * cells of stars per pixel.
 */

const SKY_COMMON = /* glsl */ `
const vec3 SKY_SPACE = vec3(0.035, 0.039, 0.11); // --space, so the sky meets the page
const vec3 SKY_VIOLET = vec3(0.42, 0.24, 0.92);
const vec3 SKY_AZURE = vec3(0.2, 0.45, 1.0);
const vec3 SKY_ROSE = vec3(0.95, 0.28, 0.6);
const vec3 SKY_GOLD = vec3(1.0, 0.74, 0.4);

float skyHash2(vec2 p){
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
`;

/** The clouds, for the one-time render into the cube (`skyClouds`). */
export const SKY_CLOUDS_CHUNK = /* glsl */ `
${SKY_COMMON}
const float SKY_FREQ = 3.4; // the scenes see about a radian across: clouds this fine fill it

float skyHash3(vec3 p){
  p = fract(p * 0.3183099 + 0.1);
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}

float skyNoise(vec3 x){
  vec3 i = floor(x), f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(mix(skyHash3(i), skyHash3(i + vec3(1.0, 0.0, 0.0)), f.x), mix(skyHash3(i + vec3(0.0, 1.0, 0.0)), skyHash3(i + vec3(1.0, 1.0, 0.0)), f.x), f.y),
    mix(mix(skyHash3(i + vec3(0.0, 0.0, 1.0)), skyHash3(i + vec3(1.0, 0.0, 1.0)), f.x), mix(skyHash3(i + vec3(0.0, 1.0, 1.0)), skyHash3(i + vec3(1.0, 1.0, 1.0)), f.x), f.y),
    f.z);
}

float skyFbm(vec3 p){
  float sum = 0.0, weight = 0.5;
  for (int i = 0; i < 5; i++) {
    sum += weight * skyNoise(p);
    p = p * 2.03 + vec3(1.7, 9.2, 3.1);
    weight *= 0.5;
  }
  return sum / 0.96875;
}

/* the clouds' light alone, without the dark of space: added to it in the scene */
vec3 skyClouds(vec3 dir, vec3 core, float coreAmount){
  vec3 d = dir * SKY_FREQ;
  vec3 warp = vec3(skyFbm(d * 1.5 + 3.0), skyFbm(d * 1.5 + 11.0), skyFbm(d * 1.5 + 23.0)) - 0.5;
  float n = skyFbm(d * 2.3 + warp * 1.9);
  float fine = skyFbm(d * 5.2 + warp * 2.6 + 7.0);
  float hue = skyFbm(d * 0.9 + 21.0);

  // clouds of gas: violet and azure broadly, rose where they are densest
  float cloud = smoothstep(0.32, 0.78, n);
  vec3 tint = mix(SKY_VIOLET, SKY_AZURE, smoothstep(0.35, 0.68, hue));
  tint = mix(tint, SKY_ROSE, smoothstep(0.55, 0.85, fine) * smoothstep(0.5, 0.8, n));
  vec3 light = tint * cloud * (0.2 + 0.8 * fine) * 0.6;

  // the warm heart of a galaxy, behind everything else: a rose haze, gold at its centre
  float toward = max(dot(dir, core), 0.0);
  float heart = pow(toward, 40.0) * 0.28 + pow(toward, 400.0) * 0.7;
  light += mix(SKY_ROSE * 0.8, SKY_GOLD, smoothstep(0.985, 0.999, toward)) * heart * (0.5 + 0.7 * fine) * coreAmount;

  // dark drifts of dust across the clouds: soft patches, never thin lines (D-094)
  light *= 1.0 - smoothstep(0.5, 0.78, skyFbm(d * 1.8 + warp * 2.0 + 40.0)) * 0.6;
  return light;
}
`;

/** For a scene: `skyDeep(dir, rich)`, the cube's clouds plus live stars. Declares `uniform samplerCube uSky`. */
export const SKY_CHUNK = /* glsl */ `
${SKY_COMMON}
uniform samplerCube uSky;

/* the stars: three layers of cells on the sphere, the coarsest with a few spiked bright ones; a
   scene may ask for a fourth, finer layer (S3, D-113: the lensed field around a black hole) */
#ifndef SKY_LAYERS
#define SKY_LAYERS 3
#endif
vec3 skyStars(vec3 d, float rich){
  vec2 uv = vec2(atan(d.z, d.x), asin(clamp(d.y, -1.0, 1.0)));
  vec3 col = vec3(0.0);
  for (int layer = 0; layer < SKY_LAYERS; layer++) {
    float cells = layer == 0 ? 20.0 : layer == 1 ? 56.0 : layer == 2 ? 130.0 : 320.0;
    vec2 g = uv * cells;
    vec2 id = floor(g) + float(layer) * 37.0;
    vec2 f = fract(g) - 0.5;
    float h = skyHash2(id);
    float keep = layer == 3 ? mix(0.9, 0.62, min(rich, 1.0)) : layer == 2 ? mix(0.8, 0.42, rich) : layer == 1 ? 0.7 : 0.62;
    if (h > keep) {
      vec2 p = f - (vec2(skyHash2(id + 3.1), skyHash2(id + 7.7)) - 0.5) * 0.6;
      float tone = skyHash2(id + 5.5);
      vec3 tint = tone < 0.35 ? vec3(0.66, 0.78, 1.0) : tone < 0.8 ? vec3(1.0, 0.95, 0.88) : vec3(1.0, 0.76, 0.52);
      float bright = (h - keep) / (1.0 - keep);
      float size = layer == 0 ? 0.05 : layer == 1 ? 0.07 : layer == 2 ? 0.1 : 0.16;
      float light = smoothstep(size, 0.0, length(p)) * mix(0.35, 1.3, bright) * (layer == 3 ? 0.55 : 1.0);
      if (layer == 0 && bright > 0.82) {
        // a bright star: a soft halo and four thin spikes
        light += exp(-length(p) * 20.0) * 0.6;
        float spikes = exp(-abs(p.y) * 110.0) * exp(-abs(p.x) * 8.0) + exp(-abs(p.x) * 110.0) * exp(-abs(p.y) * 8.0);
        light += spikes * (bright - 0.7) * 3.0;
      }
      col += tint * light;
    }
  }
  return col;
}

/* \`rich\` scales the clouds and the number of faint stars: 1 at a galaxy, less between galaxies */
vec3 skyDeep(vec3 dir, float rich){
  return SKY_SPACE + textureCube(uSky, dir).rgb * rich + skyStars(dir, rich);
}
`;
