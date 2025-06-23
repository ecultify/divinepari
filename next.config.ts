import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['sharp'],
  images: {
    domains: ['localhost'],
    unoptimized: true,
  },
  // Custom headers for API routes
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'x-timeout',
            value: '300000', // 5 minutes
          },
        ],
      },
    ];
  },
};

export default nextConfig;
