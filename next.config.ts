import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Updated for Next.js 15+ compatibility
  serverExternalPackages: ['sharp'],
  
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.netlify.app',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/**',
      }
    ],
    unoptimized: true,
  },
  
  // Production optimizations
  compress: true,
  poweredByHeader: false,
  
  // Netlify-specific settings
  trailingSlash: false,
  
  // Environment variables for client-side
  env: {
    CUSTOM_KEY: 'value',
  },
};

export default nextConfig;
