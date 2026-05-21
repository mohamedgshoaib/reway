import type { MetadataRoute } from "next"

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = "https://reway.page"
  const lastModified = new Date()
  return [
    {
      url: `${siteUrl}/`,
      lastModified,
    },
    {
      url: `${siteUrl}/login`,
      lastModified,
    },
    {
      url: `${siteUrl}/about`,
      lastModified,
    },
    {
      url: `${siteUrl}/privacy`,
      lastModified,
    },
    {
      url: `${siteUrl}/terms`,
      lastModified,
    },
  ]
}
