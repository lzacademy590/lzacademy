import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Plan Premium | LZ English Academy",
  description:
    "El Plan Premium incluye clases en vivo con instructora, seguimiento personalizado y práctica hablada para alcanzar fluidez real en inglés con el Método 590.",
  alternates: { canonical: "https://lz-englishacademy.com/premium" },
  openGraph: {
    title: "Plan Premium | LZ English Academy",
    description:
      "El Plan Premium incluye clases en vivo con instructora, seguimiento personalizado y práctica hablada para alcanzar fluidez real en inglés con el Método 590.",
    url: "https://lz-englishacademy.com/premium",
  },
};

export default function PremiumLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
