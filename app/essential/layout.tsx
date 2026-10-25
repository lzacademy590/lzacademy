import type { Metadata } from "next";
import { URL_DEL_SITIO } from "@/app/lib/sitio";

export const metadata: Metadata = {
  title: "Plan Essential",
  description:
    "Accede al Método 590 con el Plan Essential desde $10/mes. Plataforma completa, comunidad en WhatsApp, material organizado y reuniones de práctica los viernes.",
  alternates: { canonical: `${URL_DEL_SITIO}/essential` },
  openGraph: {
    title: "Plan Essential | LZ English Academy",
    description:
      "Accede al Método 590 con el Plan Essential desde $10/mes. Plataforma completa, comunidad en WhatsApp, material organizado y reuniones de práctica los viernes.",
    url: `${URL_DEL_SITIO}/essential`,
  },
};

export default function EssentialLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
