import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  /* config options here */
  // Image configuration for Netlify
  images: {
    unoptimized: true, // Disable image optimization for static export compatibility
  },
  // Ensure webpack resolves modules correctly
  webpack: (config, { isServer }) => {
    // Add path aliases explicitly
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, './src'),
    };

    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false
    };

    return config;
  },
};

export default nextConfig;
