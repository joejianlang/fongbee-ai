import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typescript: {
    tsconfigPath: './tsconfig.json',
  },
  experimental: {
    serverComponentsExternalPackages: ['pino', 'pino-pretty'],
  },
};

export default nextConfig;
