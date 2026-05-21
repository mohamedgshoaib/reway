import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  typedRoutes: true,
  turbopack: {
    root: process.cwd(),
  },
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "www.google.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/metrics/lib.js",
        destination: "https://cloud.umami.is/script.js",
      },
      {
        source: "/metrics/api/send",
        destination: "https://cloud.umami.is/api/send",
      },
    ]
  },
}

export default nextConfig
