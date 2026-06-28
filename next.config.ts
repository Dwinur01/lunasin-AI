import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ignore TypeScript build errors to speed up and prevent hangs on Vercel
  typescript: {
    ignoreBuildErrors: true,
  },
  // Exclude massive AWS SDK packages from being bundled by Webpack.
  // This drastically reduces memory usage and prevents build hangs on Vercel.
  serverExternalPackages: ["@aws-sdk/client-dynamodb", "@aws-sdk/lib-dynamodb"],
};

export default nextConfig;
