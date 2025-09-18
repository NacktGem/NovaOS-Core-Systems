import type { NextConfig } from "next";

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value:
      "default-src 'self'; script-src 'self' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self';",
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
  output: "standalone",
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
    NEXT_PUBLIC_CORE_API_URL: process.env.CORE_API_BASE,
    NEXT_PUBLIC_ECHO_WS_URL: process.env.ECHO_WS,
    ECHO_WS: process.env.ECHO_WS,
    SITE_URL: process.env.SITE_URL,
    BRC_DOMAIN: process.env.BRC_DOMAIN,
    NOVAOS_BASE_URL: process.env.NOVAOS_BASE_URL,
  },
};

export default nextConfig;
