import type { MetadataRoute } from "next";
import { URL_DEL_SITIO } from "@/app/lib/sitio";

const BASE = URL_DEL_SITIO;

/*
  Rediseño «sitio simple» (2026-11-18): /como-funciona, /sesiones, /ciencia,
  /historia, /fundacion y las landings de cada plan salieron del sitemap porque
  ahora redirigen (301) a Método, Nosotros o el paso 2. Un sitemap que lista
  redirecciones hace que Google gaste rastreo en URLs que ya no existen.
*/
export default function sitemap(): MetadataRoute.Sitemap {
  const hoy = new Date("2026-11-18");
  return [
    { url: BASE, lastModified: hoy, changeFrequency: "weekly", priority: 1.0 },
    { url: `${BASE}/paso-tres`, lastModified: hoy, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE}/metodo`, lastModified: hoy, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/nosotros`, lastModified: hoy, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/horarios`, lastModified: hoy, changeFrequency: "weekly", priority: 0.6 },
    { url: `${BASE}/interes`, lastModified: new Date("2026-05-06"), changeFrequency: "monthly", priority: 0.5 },
  ];
}
