import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['sharp'],
  },
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
    responseLimit: false,
  },
  images: {
    domains: ['localhost'],
    unoptimized: true,
  },
  // Increase timeout for API routes
  serverRuntimeConfig: {
    apiTimeout: 60000,
  },
};

export default nextConfig;
