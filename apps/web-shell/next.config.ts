import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: { optimizeCss: true },
  optimizeFonts: false,
  env: {
    CORE_API_BASE: process.env.CORE_API_BASE,
    ECHO_WS: process.env.ECHO_WS,
    SITE_URL: process.env.SITE_URL,
    BRC_DOMAIN: process.env.BRC_DOMAIN,
  },
};

export default nextConfig;
