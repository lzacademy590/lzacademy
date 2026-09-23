import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Plan Essential",
  description:
    "Accede al Método 590 con el Plan Essential desde $10/mes. Plataforma completa, comunidad en WhatsApp, material organizado y reuniones de práctica los viernes.",
  alternates: { canonical: "https://lz-englishacademy.com/essential" },
  openGraph: {
    title: "Plan Essential | LZ English Academy",
    description:
      "Accede al Método 590 con el Plan Essential desde $10/mes. Plataforma completa, comunidad en WhatsApp, material organizado y reuniones de práctica los viernes.",
    url: "https://lz-englishacademy.com/essential",
  },
};

export default function EssentialLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
