import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // D-119: the Supervoid is a zoom out of the web now, not a place; its old address opens the atlas there
  async redirects() {
    return [{ source: "/supervoid", destination: "/#supervoid", permanent: false }];
  },
};

export default nextConfig;
