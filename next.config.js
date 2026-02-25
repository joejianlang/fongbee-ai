/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    tsconfigPath: './tsconfig.json',
  },
  experimental: {
    serverComponentsExternalPackages: ['pino', 'pino-pretty'],
  },
};

module.exports = nextConfig;
