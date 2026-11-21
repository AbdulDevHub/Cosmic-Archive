import type { MetadataRoute } from "next";
import { allJourneys } from "@/lib/content/journeys";
import { allSubjects } from "@/lib/content/subjects";
import { SITE_URL } from "@/lib/site";

/* The sitemap, from the routes that exist: the fixed pages, then every subject and journey. */
export default function sitemap(): MetadataRoute.Sitemap {
  const fixed = ["/", "/explore", "/archive", "/about"].map((path) => ({ url: `${SITE_URL}${path}` }));
  const subjects = allSubjects().map((subject) => ({ url: `${SITE_URL}/subjects/${subject.id}`, lastModified: subject.lastReviewed }));
  const journeys = allJourneys().map((journey) => ({ url: `${SITE_URL}/journeys/${journey.id}`, lastModified: journey.lastReviewed }));
  return [...fixed, ...subjects, ...journeys];
}
