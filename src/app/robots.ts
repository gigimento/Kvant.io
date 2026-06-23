import type { MetadataRoute } from "next"

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://agencytools.vercel.app"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/dashboard/" },
    sitemap: `${BASE_URL}/sitemap.xml`,
  }
}
