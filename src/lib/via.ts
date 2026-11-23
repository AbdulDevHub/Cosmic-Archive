/** Which place a visitor last dived into each place from (D-133), for the session. */

const viaKey = (scene: string) => `cosmic-archive:via:${scene}`;

export function readVia(scene: string): string | null {
  try {
    return sessionStorage.getItem(viaKey(scene));
  } catch {
    return null;
  }
}

export function setVia(scene: string, from: string | null): void {
  try {
    if (from) sessionStorage.setItem(viaKey(scene), from);
    else sessionStorage.removeItem(viaKey(scene));
  } catch {
    // no storage: Zoom Out goes the usual way
  }
}
