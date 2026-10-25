import type { Metadata } from "next";
import { URL_DEL_SITIO } from "@/app/lib/sitio";

export const metadata: Metadata = {
  title: "Plan Personalizado",
  description:
    "Sesiones privadas 1:1 adaptadas a tu ritmo y objetivo. Horario 100% flexible con el Método 590 y seguimiento constante para lograr fluidez en inglés.",
  alternates: { canonical: `${URL_DEL_SITIO}/personalizado` },
  openGraph: {
    title: "Plan Personalizado | LZ English Academy",
    description:
      "Sesiones privadas 1:1 adaptadas a tu ritmo y objetivo. Horario 100% flexible con el Método 590 y seguimiento constante para lograr fluidez en inglés.",
    url: `${URL_DEL_SITIO}/personalizado`,
  },
};

export default function PersonalizadoLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
