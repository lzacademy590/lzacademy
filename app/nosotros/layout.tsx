import type { Metadata } from "next";
import { URL_DEL_SITIO } from "@/app/lib/sitio";

const DESCRIPCION =
  "Conoce a Loren Laínez, creadora del Método 590, que pasó una entrevista en inglés en 3 meses, y a la Fundación LZ, que ayuda a niños en Honduras a seguir en la escuela.";

export const metadata: Metadata = {
  title: "Nosotros",
  description: DESCRIPCION,
  alternates: { canonical: `${URL_DEL_SITIO}/nosotros` },
  openGraph: {
    title: "Nosotros | LZ English Academy",
    description: DESCRIPCION,
    url: `${URL_DEL_SITIO}/nosotros`,
    images: [{ url: `${URL_DEL_SITIO}/og-image.png`, width: 1200, height: 630 }],
  },
};

export default function NosotrosLayout({ children }: { children: React.ReactNode }) {
  return children;
}
