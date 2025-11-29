/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  output: 'standalone',
  experimental: {
    isrMemoryCacheSize: 0,
  },
  generateBuildId: async () => {
    return 'build'
  },
};

module.exports = nextConfig;
