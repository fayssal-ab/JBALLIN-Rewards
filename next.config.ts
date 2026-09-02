import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // CLAUDE.md is our own hand-maintained spec; don't let `next dev` append
  // its generic agent-rules block to it.
  agentRules: false,
  images: {
    remotePatterns: [
      { hostname: "i.ytimg.com" },
      // TypeShit — the real merch brand (see CLAUDE.md), Printful-fulfilled
      // via Shopify. Product images are served off the custom domain's own
      // /cdn/shop/ path rather than cdn.shopify.com, but allow that too in
      // case a future item links a product image straight from Shopify's
      // own CDN.
      { hostname: "typeshit.net" },
      { hostname: "cdn.shopify.com" },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
