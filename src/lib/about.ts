/**
 * Where the visitor opened About from (D-185), for its Back button: the menu notes the address,
 * About's Back returns there, and the atlas when there is none (About opened directly).
 */

const KEY = "cosmic-atlas:about-from";

export function noteAboutFrom(): void {
  try {
    const here = location.pathname + location.hash;
    if (location.pathname !== "/about") sessionStorage.setItem(KEY, here === "/" ? "/#atlas" : here);
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
