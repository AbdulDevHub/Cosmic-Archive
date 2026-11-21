import type { MetadataRoute } from "next";
import { placeIds } from "@/lib/content/places";
import { SITE_URL } from "@/lib/site";

/* The sitemap, from the routes that exist: the universe, every place, and About. */
export default function sitemap(): MetadataRoute.Sitemap {
  return ["/", ...placeIds().map((id) => `/${id}`), "/about"].map((path) => ({ url: `${SITE_URL}${path}` }));
}
