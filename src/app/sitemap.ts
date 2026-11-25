import type { MetadataRoute } from "next";
import { placeIds } from "@/lib/content/places";
import { SITE_URL } from "@/lib/site";

/* The sitemap, from the routes that exist: the universe, every place and About. Each carries the build's date (D-207), so a new deploy tells search engines to look again. */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return [
    { url: `${SITE_URL}/`, lastModified, changeFrequency: "monthly", priority: 1 },
    ...placeIds().map((id) => ({ url: `${SITE_URL}/${id}`, lastModified, changeFrequency: "monthly" as const, priority: 0.8 })),
    { url: `${SITE_URL}/about`, lastModified, changeFrequency: "yearly", priority: 0.5 },
  ];
}
