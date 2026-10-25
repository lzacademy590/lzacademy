import type { Metadata } from "next";
import { URL_DEL_SITIO } from "@/app/lib/sitio";

export const metadata: Metadata = {
  title: "Plan Premium",
  description:
    "El Plan Premium incluye clases en vivo con instructora, seguimiento personalizado y práctica hablada para alcanzar fluidez real en inglés con el Método 590.",
  alternates: { canonical: `${URL_DEL_SITIO}/premium` },
  openGraph: {
    title: "Plan Premium | LZ English Academy",
    description:
      "El Plan Premium incluye clases en vivo con instructora, seguimiento personalizado y práctica hablada para alcanzar fluidez real en inglés con el Método 590.",
    url: `${URL_DEL_SITIO}/premium`,
  },
};

export default function PremiumLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
