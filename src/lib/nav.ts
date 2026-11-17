/**
 * The site's main routes, only those that exist (PROJECT_BLUEPRINT.md 7). Planned order
 * (DESIGN_SPEC.md 7.1): Explore, Journeys, Archive, About. Add each one in the session that builds
 * its route (Journeys: O5). Shared by the header (a client component) and the footer (a server one).
 */
export const NAV = [
  { href: "/explore", label: "Explore" },
  { href: "/archive", label: "Archive" },
  { href: "/about", label: "About" },
] as const;
