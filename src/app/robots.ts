import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/* Every page is public and in the sitemap; the music route is not a page (D-207). */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/api/" },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
