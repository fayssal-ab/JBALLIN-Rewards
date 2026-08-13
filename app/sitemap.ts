import type { MetadataRoute } from "next";

const SITE_URL = "https://jbalin.netlify.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    "",
    "/leaderboard",
    "/milestones",
    "/bonus-hunt",
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
