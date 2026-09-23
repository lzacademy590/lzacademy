import type { Metadata } from "next";
import { IndiceLegal, TarjetaDocumento } from "./_components/legal";

export const metadata: Metadata = {
  title: "Centro legal — Sitio web",
  description:
    "Términos, privacidad y reembolsos del sitio web de LZ English Academy, donde te informas e inscribes.",
  alternates: { canonical: "https://lz-englishacademy.com/legal" },
};

export default function LegalSitioPage() {
  return (
    <IndiceLegal
      activa="sitio"
      titulo="Términos y políticas"
      intro={
        <p>
          Tenemos dos juegos de documentos. Los del <strong>sitio web</strong> cubren
          lo que haces aquí: informarte, inscribirte y pagar. Los de la{" "}
          <strong>plataforma de aprendizaje</strong> cubren lo que haces al estudiar:
          tus sesiones, tus grabaciones, la comunidad y tus datos dentro de la
          plataforma. La política de reembolso es la misma para los dos.
        </p>
      }
    >
      <TarjetaDocumento
        href="/terminos"
        titulo="Términos y Condiciones del sitio web"
        resumen="Inscripción, planes, cobros, cohortes, renovación y cancelación."
      />
      <TarjetaDocumento
        href="/privacidad"
        titulo="Política de Privacidad del sitio web"
        resumen="Qué datos pedimos al inscribirte y pagar, y con quién los compartimos."
      />
      <TarjetaDocumento
        href="/reembolsos"
        titulo="Política de Reembolso y Cancelación"
        resumen="Garantía de 3 días para estudiantes nuevos, renovaciones y cómo pedir un reembolso."
        comun
      />
      <TarjetaDocumento
        href="/mi-suscripcion"
        titulo="Gestionar mi suscripción"
        resumen="Si te inscribiste en este sitio web: cancela la renovación o actualiza tu método de pago. Si contrataste desde la plataforma, se gestiona allí, en Configuración › Suscripción."
      />
    </IndiceLegal>
  );
}
