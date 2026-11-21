/**
 * Everything luminous is one soft disc: a colour, a size and a seed per particle.
 * Ported from the POINT_VS / POINT_FS of prototype/look.html.
 *
 * Two forms share the maths:
 * - points: gl.POINTS, for the many small particles (disc, halo, stars);
 * - sprites: instanced quads, for the large glow (body, haze, dust, core, wash). Unlike
 *   points they survive their centre leaving the screen and are not size-capped by the GPU
 *   (DESIGN_SPEC.md section 10).
 *
 * The disc turns as a rigid pattern: uSpin radians per second about the galaxy's own y axis.
 * Additive by default; dust uses blend (zero, one-minus-source-colour) to darken what is behind.
 */

const COMMON_UNIFORMS = /* glsl */ `
uniform float uTime, uPx, uSpin, uTwinkle, uMaxPx, uAtten, uNear;
varying vec3 vColor; varying float vA; varying float vK;
`;

/** Rotate about y, then size and twinkle exactly as the prototype did. */
const SIZE_AND_TWINKLE = /* glsl */ `
  float ang = uTime * uSpin, c = cos(ang), s = sin(ang);
  p.xz = vec2(c * p.x + s * p.z, -s * p.x + c * p.z);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  float px = mix(size * uPx, size * uPx / max(-mv.z, 0.001), uAtten);
  float tw = 1.0 - uTwinkle * (0.5 + 0.5 * sin(uTime * (1.0 + seed * 2.0) + seed * 60.0));
  vA = tw * min(1.0, px * px);
  vK = 1.0;
  // S2 (D-111): a layer with uNear set lets the camera fly through it: what it is about to touch fades
  if (uNear > 0.0) vA *= smoothstep(uNear * 0.45, uNear, -mv.z); // from just past the camera's near plane (0.05)
  vColor = color3;
`;

export const POINT_VERTEX = /* glsl */ `
attribute vec3 aColor; attribute float aSize; attribute float aSeed;
${COMMON_UNIFORMS}
void main(){
  vec3 p = position; float size = aSize, seed = aSeed; vec3 color3 = aColor;
  ${SIZE_AND_TWINKLE}
  gl_Position = projectionMatrix * mv;
  // flying through the disc, a near star stays a small sharp light instead of swelling into a disc
  float cap = uMaxPx;
  if (uNear > 0.0) {
    cap = uMaxPx * 0.6;
    vK = 1.0 + clamp((px / cap - 1.0) * 0.5, 0.0, 1.5);
  }
  gl_PointSize = clamp(px, 1.0, cap);
}`;

export const POINT_FRAGMENT = /* glsl */ `
precision highp float;
uniform float uAlpha, uSoft;
varying vec3 vColor; varying float vA; varying float vK;
void main(){
  float d = length(gl_PointCoord - 0.5) * 2.0;
  float a = pow(max(0.0, 1.0 - d), uSoft * vK);
  // a sharpened near star keeps its light in a smaller, brighter point
  gl_FragColor = vec4(vColor * a * vA * uAlpha * (1.0 + (vK - 1.0) * 1.3), 1.0);
}`;

/** `position.xy` is the quad corner in [-1, 1]; the particle lives in instance attributes. */
export const SPRITE_VERTEX = /* glsl */ `
attribute vec3 iPos; attribute vec3 iColor; attribute float iSize; attribute float iSeed;
uniform vec2 uViewport;
varying vec2 vCorner;
${COMMON_UNIFORMS}
void main(){
  vec3 p = iPos; float size = iSize, seed = iSeed; vec3 color3 = iColor;
  ${SIZE_AND_TWINKLE}
  vec4 clip = projectionMatrix * mv;
  if (clip.w <= 0.0) { gl_Position = vec4(0.0, 0.0, 2.0, 1.0); return; } // behind the camera
  // a glow the camera is inside of (it has grown past its cap) fades instead of washing the screen
  if (uNear > 0.0) vA *= 1.0 - smoothstep(uMaxPx * 0.55, uMaxPx * 1.4, px);
  float diameter = clamp(px, 1.0, uMaxPx);
  clip.xy += position.xy * (diameter / uViewport) * clip.w;
  gl_Position = clip;
  vCorner = position.xy;
}`;

export const SPRITE_FRAGMENT = /* glsl */ `
precision highp float;
uniform float uAlpha, uSoft;
varying vec3 vColor; varying float vA; varying vec2 vCorner;
void main(){
  float a = pow(max(0.0, 1.0 - length(vCorner)), uSoft);
  gl_FragColor = vec4(vColor * a * vA * uAlpha, 1.0);
}`;
