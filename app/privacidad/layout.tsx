import type { Metadata } from "next";
import { URL_DEL_SITIO } from "@/app/lib/sitio";

export const metadata: Metadata = {
  // Sin sufijo: lo pone el `template` del layout raíz (ver `terminos/layout.tsx`).
  title: "Política de Privacidad",
  description:
    "Política de Privacidad de LZ English Academy y del Método 590: qué datos recolectamos, para qué los usamos, con quién los compartimos, conservación, tus derechos, cookies y contacto.",
  alternates: { canonical: `${URL_DEL_SITIO}/privacidad` },
  openGraph: {
    title: "Política de Privacidad | LZ English Academy",
    description:
      "Política de Privacidad de LZ English Academy y del Método 590.",
    url: `${URL_DEL_SITIO}/privacidad`,
  },
};

export default function PrivacidadLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
