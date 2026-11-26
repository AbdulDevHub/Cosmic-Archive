/**
 * Where the visitor opened About from (D-185), for its Back button: the menu notes the address,
 * and on the atlas the stop it was at (as the hash that opens there), so Back returns to that very
 * view; the atlas when nothing was noted (About opened directly).
 */

const KEY = "cosmic-atlas:about-from";

/** The atlas's stops by the hash that opens each (AtlasView's `OPENS_AT`), from the zoom's level. */
const STOP_HASH = (zoom: number) =>
  zoom > 5.5 ? "#omniverse" : zoom > 4.5 ? "#multiverse" : zoom > 3.5 ? "#universe" : zoom > 2.5 ? "#supervoid" : zoom > 1.5 ? "#web" : "#atlas";

/** `zoom`: the atlas's zoom now, when About is opened from the atlas. */
export function noteAboutFrom(zoom: number): void {
  try {
    if (location.pathname === "/about") return;
    // from the start page (the atlas's `data-start`), Back returns to the start page itself
    const atStart = document.querySelector("[data-start]") !== null;
    sessionStorage.setItem(KEY, location.pathname !== "/" ? location.pathname : atStart ? "/" : `/${STOP_HASH(zoom)}`);
  } catch {
    // no storage: Back goes to the atlas
  }
}

export function aboutFrom(): string {
  try {
    return sessionStorage.getItem(KEY) ?? "/#atlas";
  } catch {
    return "/#atlas";
  }
}
