import type { MetadataRoute } from "next";

import { SITE } from "@/lib/site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE.url,
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
