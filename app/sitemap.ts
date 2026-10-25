import type { MetadataRoute } from "next";
import { URL_DEL_SITIO } from "@/app/lib/sitio";

const BASE = URL_DEL_SITIO;

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: BASE, lastModified: new Date("2026-05-06"), changeFrequency: "weekly", priority: 1.0 },
    { url: `${BASE}/interes`, lastModified: new Date("2026-05-06"), changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE}/metodo`, lastModified: new Date("2026-05-06"), changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE}/essential`, lastModified: new Date("2026-05-06"), changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/premium`, lastModified: new Date("2026-05-06"), changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/personalizado`, lastModified: new Date("2026-05-06"), changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/fluidez`, lastModified: new Date("2026-07-06"), changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/historia`, lastModified: new Date("2026-05-06"), changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/ciencia`, lastModified: new Date("2026-05-06"), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/como-funciona`, lastModified: new Date("2026-05-06"), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/sesiones`, lastModified: new Date("2026-05-06"), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/fundacion`, lastModified: new Date("2026-05-06"), changeFrequency: "monthly", priority: 0.6 },
  ];
}
