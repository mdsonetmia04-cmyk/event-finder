import type { MetadataRoute } from "next";
import { EVENTS } from "@/lib/data";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://stockseason-intelligence.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = SITE_URL.replace(/\/$/, "");
  const now = new Date().toISOString();
  const staticRoutes = ["", "/calendar", "/opportunities", "/markets", "/planner", "/sources", "/contact"];
  const routes: MetadataRoute.Sitemap = staticRoutes.map((r) => ({
    url: `${base}${r}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: r === "" ? 1 : 0.8,
  }));
  for (const e of EVENTS) {
    routes.push({
      url: `${base}/events/${e.id}`,
      lastModified: e.lastVerified,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    });
  }
  return routes;
}
