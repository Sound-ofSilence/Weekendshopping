import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_ORIGIN || 'http://localhost:4000'}/:path*`,
      },
    ];
  },
};

export default nextConfig;