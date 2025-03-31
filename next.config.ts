import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  outputFileTracingRoot: process.cwd(),
  outputFileTracingIncludes: {
    '/api/**/*': ['fonts/**/*'],
    '/app/**/*': ['fonts/**/*']
  },

  // Configure domain handling for deployment
  images: {
    domains: ['localhost', 'yourdomain.com', 'app.yourdomain.com'],
  },

  // Allow subdomains to access the same server instance
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
