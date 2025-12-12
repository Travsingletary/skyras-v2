/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Removed 'output: standalone' for Vercel compatibility
  // Removed custom generateBuildId - let Vercel handle it
};

module.exports = nextConfig;
