/**
 * Bakes the deep sky's clouds into a cube texture, once, when a scene mounts (D-101). The clouds
 * are many octaves of 3D noise per pixel: far too much to draw every frame on a phone, and they
 * never change, so they are drawn once onto the six faces of a cube around the camera and then
 * looked up. The stars stay live in each scene (`SKY_CHUNK`), so they stay sharp.
 */

import { BackSide, BoxGeometry, CubeCamera, LinearFilter, Mesh, Scene, ShaderMaterial, Vector3, WebGLCubeRenderTarget, type Texture, type WebGLRenderer } from "three";
import { SKY_CLOUDS_CHUNK } from "./shaders/sky.glsl";

export interface SkyCube {
  texture: Texture;
  dispose: () => void;
}

const VERTEX = /* glsl */ `
varying vec3 vDir;
void main(){ vDir = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;

const FRAGMENT = /* glsl */ `
precision highp float;
uniform vec3 uCore;
uniform float uCoreAmount;
varying vec3 vDir;
${SKY_CLOUDS_CHUNK}
void main(){ gl_FragColor = vec4(skyClouds(normalize(vDir), uCore, uCoreAmount), 1.0); }
`;

/**
 * `core` is the direction of a galaxy's warm heart and `coreAmount` its strength (0: none).
 * Each face is `size` pixels square; the clouds are smooth, so this is plenty.
 */
export function bakeSky(renderer: WebGLRenderer, core: Vector3 = new Vector3(0, 1, 0), coreAmount = 0, size = 512): SkyCube {
  const target = new WebGLCubeRenderTarget(size, { generateMipmaps: false, minFilter: LinearFilter, magFilter: LinearFilter });
  const material = new ShaderMaterial({
    vertexShader: VERTEX,
    fragmentShader: FRAGMENT,
    uniforms: { uCore: { value: core.clone().normalize() }, uCoreAmount: { value: coreAmount } },
    side: BackSide,
    depthTest: false,
    depthWrite: false,
  });
  const box = new Mesh(new BoxGeometry(10, 10, 10), material);
  const scene = new Scene();
  scene.add(box);
  new CubeCamera(0.1, 100, target).update(renderer, scene);
  box.geometry.dispose();
  material.dispose();
  return { texture: target.texture, dispose: () => target.dispose() };
}
