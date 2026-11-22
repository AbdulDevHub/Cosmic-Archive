/**
 * Scene registry: id to a dynamic import. Adding a scene is one line here and one folder
 * in `scenes/`. Each module default-exports its component and exports its `budget`.
 */

import type { ComponentType } from "react";
import type { SceneId } from "./store";
import type { SceneBudget, SceneProps } from "./types";

export interface SceneModule {
  default: ComponentType<SceneProps>;
  budget: SceneBudget;
}

export const SCENES: Record<SceneId, () => Promise<SceneModule>> = {
  atlas: () => import("../scenes/atlas"),
  "black-hole": () => import("../scenes/black-hole"),
  nebula: () => import("../scenes/nebula"),
  quasar: () => import("../scenes/quasar"),
  "neutron-star": () => import("../scenes/neutron-star"),
  star: () => import("../scenes/star"),
  "strange-star": () => import("../scenes/strange-star"),
  "dyson-sphere": () => import("../scenes/dyson-sphere"),
  "wormhole": () => import("../scenes/wormhole"),
  "gravastar": () => import("../scenes/gravastar"),
  "quasi-star": () => import("../scenes/quasi-star"),
  "earth": () => import("../scenes/earth"),
};
