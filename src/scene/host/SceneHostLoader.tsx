"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";
import { detectQuality } from "../quality/tiers";
import { sceneParams } from "./params";
import { setQuality, useSceneState } from "./store";

/** The host chunk holds three and React Three Fiber; it is requested only once a slot asks. */
const SceneHost = dynamic(() => import("./SceneHost"), { ssr: false });

/**
 * Mounted once in the root layout. Imports no three. Pages without a <SceneSlot> never
 * trigger the import, so they never download 3D code (ARCHITECTURE.md 1, D-015).
 */
export function SceneHostLoader() {
  const asked = useSceneState((s) => s.asked);
  const quality = useSceneState((s) => s.quality);

  useEffect(() => {
    const params = sceneParams();
    if (!asked || quality !== null) return;
    setQuality(detectQuality(params.tier), params.tier === null);
  }, [asked, quality]);

  return asked && quality !== null && quality !== "static" ? <SceneHost /> : null;
}
