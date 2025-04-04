import type {NextConfig} from "next";

const nextConfig: NextConfig = {
  /* config options here */
  outputFileTracingRoot: process.cwd(),
  outputFileTracingIncludes: {
    '/api/**/*': ['fonts/**/*'],
    '/app/**/*': ['fonts/**/*']
  }
};

export default nextConfig;
