"use client";

import type { KeyboardEvent } from "react";
import { SHIPS, setShip, useShip } from "@/lib/ship";
import { ShipSilhouette } from "../LoaderShip";
import styles from "./ShipDock.module.css";

/*
  The ship dock (D-201): the start page's flared glass dock from start-page-mockup.png, back at the
  bottom where the mockup has it (it hung in the header since D-116). It holds the fleet (D-118): one
  button per ship, its silhouette over its name; the chosen one glows and flies in the scene. The
  choice is remembered (`setShip`). On a phone it folds away, as the header's menu does.
*/

/** The outline, in its own 600 by 98 box, wide at the bottom (the CSS clips the blur to the same path). */
const DOCK_PATH = "M88 1H512C538 1 548 7 558 20L590 64C603 88 592 97 568 97H32C8 97 -3 88 10 64L42 20C52 7 62 1 88 1Z";

export function ShipDock() {
  const chosen = useShip();
  // a radio group: one tab stop, the arrows move the choice (and focus) along the fleet
  const step = (event: KeyboardEvent<HTMLDivElement>) => {
    const by = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
    if (!by) return;
    event.preventDefault();
    const at = SHIPS.findIndex((ship) => ship.id === chosen);
    const next = (at + by + SHIPS.length) % SHIPS.length;
    setShip(SHIPS[next].id);
    (event.currentTarget.children[next] as HTMLElement | undefined)?.focus();
  };
  return (
    <nav className={styles.dock} aria-label="Ships" data-menu>
      <svg className={styles.shape} viewBox="0 0 600 98" preserveAspectRatio="none" aria-hidden="true" focusable="false">
        <defs>
          <linearGradient id="ship-dock-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#4a4372" stopOpacity="0.5" />
            <stop offset="1" stopColor="#1c1a3a" stopOpacity="0.62" />
          </linearGradient>
          <linearGradient id="ship-dock-edge" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#b9b2ff" stopOpacity="0.45" />
            <stop offset="0.5" stopColor="#e4e0ff" stopOpacity="0.55" />
            <stop offset="1" stopColor="#9fb8ff" stopOpacity="0.45" />
          </linearGradient>
        </defs>
        <path d={DOCK_PATH} fill="url(#ship-dock-fill)" stroke="url(#ship-dock-edge)" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
      </svg>
      <div className={styles.items} role="radiogroup" aria-label="Choose your ship" onKeyDown={step}>
        {SHIPS.map((ship) => (
          <button
            key={ship.id}
            type="button"
            role="radio"
            aria-checked={chosen === ship.id}
            tabIndex={chosen === ship.id ? 0 : -1}
            className={styles.item}
            onClick={() => setShip(ship.id)}
            data-tip={ship.role}
          >
            <ShipSilhouette ship={ship.id} width={74} />
            <span>{ship.name}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
