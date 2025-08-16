import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: { optimizeCss: true },
  optimizeFonts: false,
  env: {
    CORE_API_BASE: process.env.CORE_API_BASE,
    ECHO_WS: process.env.ECHO_WS,
    SITE_URL: process.env.SITE_URL,
    GC_DOMAIN: process.env.GC_DOMAIN,
    ALLOWLIST_MODE: process.env.ALLOWLIST_MODE,
  },
};

export default nextConfig;
