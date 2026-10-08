import type { Metadata } from "next";
import {
  IndiceLegal,
  TarjetaDocumento,
  URL_SUSCRIPCION_PLATAFORMA,
} from "../_components/legal";

export const metadata: Metadata = {
  title: "Centro legal — Plataforma",
  description:
    "Términos, privacidad y normas de la comunidad de la plataforma de aprendizaje del Método 590.",
  alternates: { canonical: "https://lz-englishacademy.com/legal/plataforma" },
};

export default function LegalPlataformaPage() {
  return (
    <IndiceLegal
      activa="plataforma"
      titulo="Términos y políticas"
      intro={
        <p>
          Estos documentos rigen el uso de la <strong>plataforma de aprendizaje</strong>{" "}
          del Método 590: tu cuenta, tus sesiones diarias, lo que grabas y escribes, la
          comunidad, las clases en vivo y el tratamiento de tus datos. Se aplican junto
          con los del sitio web, y la política de reembolso es la misma para los dos.
        </p>
      }
    >
      <TarjetaDocumento
        href="/legal/plataforma/terminos"
        titulo="Términos de Uso de la Plataforma"
        resumen="Tu cuenta, cómo avanza tu curso, plan gratis, semana de prueba, clases en vivo, monedas y tu contenido."
      />
      <TarjetaDocumento
        href="/legal/plataforma/privacidad"
        titulo="Política de Privacidad de la Plataforma"
        resumen="Qué datos se guardan al estudiar (voz, fotos, textos), quién los procesa, uso de IA y tus derechos."
      />
      <TarjetaDocumento
        href="/legal/plataforma/normas-de-comunidad"
        titulo="Normas de la Comunidad y de Comportamiento"
        resumen="Cómo convivir en las dudas, los mensajes y tu perfil, cómo tratar a tu instructora en las clases, y qué pasa si no se cumplen."
      />
      <TarjetaDocumento
        href="/reembolsos"
        titulo="Política de Reembolso y Cancelación"
        resumen="Garantía de 3 días para estudiantes nuevos, renovaciones y cómo pedir un reembolso."
        comun
      />
      <TarjetaDocumento
        href={URL_SUSCRIPCION_PLATAFORMA}
        titulo="Gestionar mi suscripción"
        resumen="En la plataforma, Configuración › Suscripción: cancela la renovación o actualiza tu método de pago."
      />
    </IndiceLegal>
  );
}
