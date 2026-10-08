import type { Metadata } from "next";

export const metadata: Metadata = {
  // Sin sufijo: lo pone el `template` del layout raíz (ver `terminos/layout.tsx`).
  title: "Política de Reembolso",
  description:
    "Política de Reembolso y Cancelación de LZ English Academy: garantía de 3 días para estudiantes nuevos, renovaciones no reembolsables, cómo solicitar un reembolso y su efecto.",
  alternates: { canonical: "https://lz-englishacademy.com/reembolsos" },
  openGraph: {
    title: "Política de Reembolso | LZ English Academy",
    description:
      "Política de Reembolso y Cancelación de LZ English Academy y del Método 590.",
    url: "https://lz-englishacademy.com/reembolsos",
  },
};

export default function ReembolsosLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
