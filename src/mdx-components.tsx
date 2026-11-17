import type { MDXComponents } from "mdx/types";

/*
  Required by @next/mdx with the App Router. Empty on purpose: the subject page passes each
  body its own components (Claim, Evidence, Diagram, Unknowns), because a claim needs that
  page's list of sources.
*/
const components: MDXComponents = {};

export function useMDXComponents(): MDXComponents {
  return components;
}
