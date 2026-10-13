"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { GA_ID } from "@/app/lib/analitica";

/*
  Carga GA4 con el ID de `NEXT_PUBLIC_GA_ID`. Ver `lib/analitica.ts`.

  ⚠️ No se carga si se ENTRA por /admin: las visitas del equipo al panel
  inflarían el tráfico del sitio. (Si alguien navega del sitio al panel sin
  recargar, GA ya está cargado y seguirá contando: es raro y se acepta.)
*/
export default function GoogleAnalytics() {
  const pathname = usePathname();
  if (!GA_ID || pathname?.startsWith("/admin")) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}');
        `}
      </Script>
    </>
  );
}
