import type { MetadataRoute } from "next";
import { URL_DEL_SITIO } from "@/app/lib/sitio";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/api/"],
      },
    ],
    sitemap: `${URL_DEL_SITIO}/sitemap.xml`,
  };
}
