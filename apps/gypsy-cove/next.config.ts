import type { NextConfig } from "next";

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value:
      "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self';",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains",
  },
  { key: "Referrer-Policy", value: "no-referrer" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: { optimizeCss: true },
  optimizeFonts: false,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
  env: {
    CORE_API_BASE: process.env.CORE_API_BASE,
    ECHO_WS: process.env.ECHO_WS,
    SITE_URL: process.env.SITE_URL,
    GC_DOMAIN: process.env.GC_DOMAIN,
    ALLOWLIST_MODE: process.env.ALLOWLIST_MODE,
  },
};

export default nextConfig;
