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
};
