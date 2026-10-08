import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Plan Personalizado",
  description:
    "Sesiones privadas 1:1 adaptadas a tu ritmo y objetivo. Horario 100% flexible con el Método 590 y seguimiento constante para lograr fluidez en inglés.",
  alternates: { canonical: "https://lz-englishacademy.com/personalizado" },
  openGraph: {
    title: "Plan Personalizado | LZ English Academy",
    description:
      "Sesiones privadas 1:1 adaptadas a tu ritmo y objetivo. Horario 100% flexible con el Método 590 y seguimiento constante para lograr fluidez en inglés.",
    url: "https://lz-englishacademy.com/personalizado",
  },
};

export default function PersonalizadoLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
