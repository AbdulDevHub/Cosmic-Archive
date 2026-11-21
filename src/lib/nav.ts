/**
 * The site's main routes, only those that exist (PROJECT_BLUEPRINT.md 7). Planned order
 * (DESIGN_SPEC.md 7.1): Explore, Journeys, Archive, About. Journeys opens the one journey there is
 * (O5); an index of journeys waits until there is a second. Shared by the header (a client component) and the footer (a server one).
 */
export const NAV = [
  { href: "/explore", label: "Explore" },
  { href: "/journeys/a-stars-life", label: "Journeys" },
  { href: "/archive", label: "Archive" },
  { href: "/about", label: "About" },
] as const;
