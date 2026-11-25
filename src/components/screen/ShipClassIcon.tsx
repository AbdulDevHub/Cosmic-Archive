import type { ReactNode } from "react";
import type { ShipClass } from "@/lib/ship";

/*
  The dock's ship icons (D-203): not the ships' outlines but the feel of each class, drawn here as
  line icons in a 32-unit box with one shared star-to-violet stroke. Decorative: the ship's name
  sits under each, so they are aria-hidden.
    Sovereign, the elegant flagship: a crown under a star.
    Predator, the intimidating cruiser: a slit-pupilled eye under a scowl.
    Celestial, the legendary vessel: a four-point star under a halo.
    Discovery, the experimental explorer: a compass rose.
    Colossus, the mobile expedition fortress: a battlemented shield.
*/

const GLYPHS: Record<ShipClass, ReactNode> = {
  sovereign: (
    <>
      <path d="M6 23.5 4.5 11l7 5.5L16 7.5l4.5 9 7-5.5L26 23.5z" />
      <path d="M7 27h18" />
      <path d="M16 2.2l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z" fill="currentColor" stroke="none" />
      <circle cx="16" cy="18.5" r="1.4" fill="currentColor" stroke="none" />
    </>
  ),
  predator: (
    <>
      <path d="M2.5 16c4-6 8.5-9 13.5-9s9.5 3 13.5 9c-4 6-8.5 9-13.5 9s-9.5-3-13.5-9z" />
      <path d="M16 9.5c1.9 2.2 1.9 10.8 0 13-1.9-2.2-1.9-10.8 0-13z" fill="currentColor" stroke="none" />
      <path d="M3 9.5 9 11M29 9.5 23 11" />
    </>
  ),
  celestial: (
    <>
      <ellipse cx="16" cy="6" rx="7" ry="2.2" />
      <path d="M16 10c.8 5.6 1.9 6.7 7.5 7.5-5.6.8-6.7 1.9-7.5 7.5-.8-5.6-1.9-6.7-7.5-7.5 5.6-.8 6.7-1.9 7.5-7.5z" />
      <path d="M5 13.5l.5 1.3 1.3.5-1.3.5-.5 1.3-.5-1.3-1.3-.5 1.3-.5zM27 21.5l.5 1.3 1.3.5-1.3.5-.5 1.3-.5-1.3-1.3-.5 1.3-.5z" fill="currentColor" stroke="none" />
    </>
  ),
  discovery: (
    <>
      <circle cx="16" cy="16" r="12" />
      <circle cx="16" cy="16" r="8.5" opacity="0.45" />
      <path d="M16 6.5l2.6 9.5L16 25.5 13.4 16z" />
      <path d="M16 6.5l2.6 9.5h-5.2z" fill="currentColor" stroke="none" />
      <path d="M16 2v2.2M16 27.8V30M2 16h2.2M27.8 16H30" />
    </>
  ),
  colossus: (
    <>
      <path d="M5 4.5h4v3h4.4v-3h5.2v3H23v-3h4v13c0 5.6-4.6 9.3-11 11.5-6.4-2.2-11-5.9-11-11.5z" />
      <path d="M16 13v10M11.5 17.5h9" opacity="0.6" />
    </>
  ),
};

export function ShipClassIcon({ ship, size = 32 }: { ship: ShipClass; size?: number }) {
  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {GLYPHS[ship]}
    </svg>
  );
}
