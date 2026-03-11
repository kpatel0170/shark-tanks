import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["socket.io", "@react-three/fiber"],
  webpack: (config: any) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      three: require.resolve("three"),
    };
    return config;
  },
  turbopack: {},
};

export default nextConfig;
