import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  transpilePackages: ['three'],
  turbopack: {
    root: path.resolve(__dirname),
  },
  async redirects() {
    return [
      {
        source: '/wanted',
        destination: '/bounties?view=wanted',
        permanent: true,
      },
      {
        source: '/game',
        destination: '/academy?tab=arena',
        permanent: true,
      },
      {
        source: '/arcade',
        destination: '/vegas?tab=arcade',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
