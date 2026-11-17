import type { ComponentType } from "react";
import { BlackHoleAnatomy } from "./black-hole-anatomy";

/**
 * Our own drawings, by the name a subject's `<Diagram name>` uses. The name is the file's name:
 * the content check reads this folder to know which names exist.
 */
export const DIAGRAMS: Record<string, ComponentType> = {
  "black-hole-anatomy": BlackHoleAnatomy,
};
