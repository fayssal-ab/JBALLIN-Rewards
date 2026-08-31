import type { MetadataRoute } from "next";

const SITE_URL = "https://jballin.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    "",
    "/leaderboard",
    "/prediction",
    "/store",
    "/referral",
    "/instructions",
  ];

  return routes.map((route) => ({
    url: `${SITE_URL}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "/leaderboard" ? "hourly" : "weekly",
    priority: route === "" ? 1 : 0.8,
  }));
}
