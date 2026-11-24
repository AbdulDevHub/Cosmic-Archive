import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // D-119: the Supervoid is a zoom out of the web now, not a place; its old address opens the atlas there
  async redirects() {
    return [{ source: "/supervoid", destination: "/#supervoid", permanent: false }];
  },
  // D-183: the owner's music is read from the private submodule at request time, so ship it with its route
  outputFileTracingIncludes: {
    "/api/music/*": ["./private-assets/cosmic-atlas/music/**/*"],
  },
};

export default nextConfig;
