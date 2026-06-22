import { withSentryConfig } from "@sentry/nextjs"
import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  turbopack: {
    root: process.cwd(),
  },
}

export default withSentryConfig(nextConfig, {
  org: "gigimento",
  project: "kvantio",
  silent: !process.env.CI,
  widenClientFileUpload: true,
  sourcemaps: { disable: true },
  tunnelRoute: "/monitoring",
})
