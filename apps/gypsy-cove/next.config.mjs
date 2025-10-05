/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizeCss: true,
    esmExternals: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  swcMinify: false, // Disable SWC minification to avoid download issues
  transpilePackages: ['@shared'], // Support shared workspace packages
};

export default nextConfig;
