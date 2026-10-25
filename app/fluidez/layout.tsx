import type { Metadata } from "next";
import { URL_DEL_SITIO } from "@/app/lib/sitio";

export const metadata: Metadata = {
  title: "Programa de Fluidez",
  description:
    "Coaching de speaking 1:1 semanal para romper la barrera de hablar. Para nivel A2+ que ya entiende inglés pero se traba al hablar: diagnóstico, plan de acción escrito y todo lo de Premium con el Método 590. Cupos limitados.",
  alternates: { canonical: `${URL_DEL_SITIO}/fluidez` },
  openGraph: {
    title: "Programa de Fluidez | LZ English Academy",
    description:
      "Coaching de speaking 1:1 semanal para romper la barrera de hablar. Nivel A2+. Cupos limitados.",
    url: `${URL_DEL_SITIO}/fluidez`,
  },
};

export default function FluidezLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
