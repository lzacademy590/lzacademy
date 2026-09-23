import type { Metadata } from "next";

export const metadata: Metadata = {
  // Sin el sufijo: lo pone el `template` del layout raíz ("%s | LZ English
  // Academy"). Escrito aquí salía repetido en la pestaña. El de `openGraph` sí
  // lo lleva, porque a ése no se le aplica el template.
  title: "Términos y Condiciones",
  description:
    "Términos y Condiciones de uso de LZ English Academy y del Método 590: planes y cobros, acceso y cohortes, cancelación, propiedad intelectual, conducta, responsabilidad, ley aplicable y contacto.",
  alternates: { canonical: "https://lz-englishacademy.com/terminos" },
  openGraph: {
    title: "Términos y Condiciones | LZ English Academy",
    description:
      "Términos y Condiciones de uso de LZ English Academy y del Método 590.",
    url: "https://lz-englishacademy.com/terminos",
  },
};

export default function TerminosLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
