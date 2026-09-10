import type { Metadata } from "next";
// La home antigua (HomeClient + Plan.tsx) se BORRÓ el 2026-09-08: llevaba
// comentada aquí desde hacía tiempo y su copy se había quedado atrás —decía
// "lunes a miércoles" y "3 sesiones privadas 1:1 por semana" cuando la regla es
// lunes a jueves y UNA sesión—, así que engañaba a quien buscara dónde
// arreglar ese texto. Está en el historial de git si hiciera falta.
import InicioPage from "./inicio/iniciopage";

export const metadata: Metadata = {
  title: "LZ English Academy | Aprende inglés rápido y con propósito",
  description:
    "Aprende inglés en 90 días con LZ English Academy usando el Método 590. Sesiones diarias, speaking real y planes Essential y Premium adaptados a tu nivel.",
  alternates: {
    canonical: "https://lz-englishacademy.com/",
  },
  openGraph: {
    title: "LZ English Academy | Aprende inglés rápido y con propósito",
    description:
      "Transforma tu inglés en 90 días con el Método 590: sesiones guiadas, speaking real y planes adaptados a tu nivel.",
    url: "https://lz-englishacademy.com/",
    images: [{ url: "https://lz-englishacademy.com/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    title: "LZ English Academy | Aprende inglés rápido y con propósito",
    description:
      "Transforma tu inglés en 90 días con el Método 590: sesiones guiadas, speaking real y planes adaptados a tu nivel.",
    images: ["https://lz-englishacademy.com/og-image.png"],
  },
};

export default function Page() {
  // (aquí iba <HomeClient />, ver la nota de arriba)
  return <InicioPage />;
}
