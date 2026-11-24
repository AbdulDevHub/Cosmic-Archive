import type { MetadataRoute } from "next";
import { placeIds } from "@/lib/content/places";
import { SITE_URL } from "@/lib/site";

/* The sitemap, from the routes that exist: the universe, every place and About. */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${SITE_URL}/`, changeFrequency: "monthly", priority: 1 },
    ...placeIds().map((id) => ({ url: `${SITE_URL}/${id}`, changeFrequency: "monthly" as const, priority: 0.8 })),
    { url: `${SITE_URL}/about`, changeFrequency: "yearly", priority: 0.5 },
  ];
}
