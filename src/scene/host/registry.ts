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
  "supernova-remnant": () => import("../scenes/supernova-remnant"),
  "magnetar": () => import("../scenes/magnetar"),
  "black-hole-merger": () => import("../scenes/black-hole-merger"),
  "comet": () => import("../scenes/comet"),
  "ringed-giant": () => import("../scenes/ringed-giant"),
  "dark-matter": () => import("../scenes/dark-matter"),
  "quasi-star": () => import("../scenes/quasi-star"),
  "solar-system": () => import("../scenes/solar-system"),
  "blue-world": () => import("../scenes/blue-world"),
  asteroid: () => import("../scenes/asteroid"),
  "quasar-galaxy": () => import("../scenes/quasar-galaxy"),
  "moon": () => import("../scenes/moon"),
};
