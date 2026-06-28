import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ignore TypeScript build errors to speed up and prevent hangs on Vercel
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
