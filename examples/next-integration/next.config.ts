import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      "rdf-canonize-native": false,
    };
    config.resolve.alias = {
      ...config.resolve.alias,
      "rdf-canonize-native": false,
    };
    return config;
  },
};

export default nextConfig;
