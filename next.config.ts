import { join } from "node:path";
import createMDX from "@next/mdx";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

// Subject pages are MDX in content/subjects (ARCHITECTURE.md 6). Turbopack takes plugins by name
// or by path, not as functions.
// - remark-frontmatter keeps the YAML block out of the rendered page; src/lib/content/subjects.ts
//   reads and validates it.
// - our own plugin puts back the paragraph MDX removes around a run of <Claim> elements.
const withMDX = createMDX({
  options: {
    remarkPlugins: ["remark-frontmatter", join(process.cwd(), "scripts", "remark-claim-paragraphs.mjs")],
  },
});

export default withMDX(nextConfig);
