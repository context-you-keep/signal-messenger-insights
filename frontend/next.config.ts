import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    // Mark native modules as external for server-side bundles
    '@journeyapps/sqlcipher',
    'better-sqlite3',
    'better-sqlite3-multiple-ciphers',
  ],

  // Allow cross-origin requests in development
  allowedDevOrigins: ['openwebui', 'openwebui:3001', 'http://openwebui', 'http://openwebui:3001'],

  experimental: {
    serverActions: {
      allowedOrigins: ['openwebui:3001', 'openwebui', 'http://openwebui', 'http://openwebui:3001'],
    },
  },

  // Suppress hydration warnings from browser extensions (like Dark Reader)
  reactStrictMode: true,
};

export default nextConfig;
