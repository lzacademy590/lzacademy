import type { Metadata } from "next";
import {
  Correo,
  DocumentoLegal,
  Enlace,
  Section,
  VERSIONES_PLATAFORMA,
} from "../../_components/legal";

export const metadata: Metadata = {
  title: "Normas de la Comunidad y de Comportamiento",
  description:
    "Cómo convivir en la plataforma del Método 590: preguntas bajo los videos, mensajes, perfil, clases en vivo y el trato con tu instructora.",
  alternates: { canonical: "https://lz-englishacademy.com/legal/plataforma/normas-de-comunidad" },
};

/*
  ⚠️ Desde el 2026-10-08 hay botón "Reportar" en los mensajes de GRUPO y en los
  PRIVADOS entre alumnos (`message-reports/`), y la instructora LEE los grupos de
  sus estudiantes (`GET /groups/moderation`). Las preguntas bajo los videos
  (`forum/`) siguen sin botón: por eso allí el reporte sigue yendo por correo.
  Si se construye ese botón, la sección 4 lo nombra y sube la versión.
*/

export default function NormasDeComunidadPage() {
  return (
    <DocumentoLegal
      titulo="Normas de la Comunidad y de Comportamiento"
      version={VERSIONES_PLATAFORMA.normas}
    >
      <div className="space-y-4 text-[15px] leading-relaxed text-zinc-600">
        <p>
          En la Plataforma aprendes junto a otras personas: preguntas bajo cada video,
          ves las respuestas de tus compañeros, te escribes con ellos y coincides en las
          clases en vivo. Estas normas existen para que sea un lugar donde equivocarse
          en inglés no dé miedo. Forman parte de los{" "}
          <Enlace href="/legal/plataforma/terminos">Términos de Uso de la
          Plataforma</Enlace>.
        </p>
      </div>

      <Section title="1. Dónde se aplican">
        <p>
          En las preguntas y respuestas bajo los videos, los mensajes entre usuarios
          (privados y en grupos), tu foto y descripción de perfil, las reseñas y las
          clases en vivo por Zoom.
        </p>
      </Section>

      <Section title="2. Lo que esperamos">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Respeto.</strong> Todos están aprendiendo. Corrige con amabilidad o
            no corrijas.
          </li>
          <li>
            <strong>Preguntas útiles.</strong> Pregunta sobre la lección donde estás, de
            forma que la respuesta le sirva también a quien venga después.
          </li>
          <li>
            <strong>Tu propia voz.</strong> Publica contenido tuyo, o que tengas derecho
            a compartir.
          </li>
          <li>
            <strong>Privacidad ajena.</strong> Lo que otra persona te cuenta, graba o
            enseña en la Plataforma se queda en la Plataforma.
          </li>
        </ul>
      </Section>

      <Section title="3. Lo que no está permitido">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            Insultos, acoso, amenazas, discriminación o burlas por el nivel de inglés,
            el acento, el origen o cualquier otra característica de una persona.
          </li>
          <li>Contenido sexual, violento, ilegal o que incite al odio.</li>
          <li>
            Publicidad, spam, enlaces a otros cursos o servicios, esquemas de venta o
            pedir dinero.
          </li>
          <li>
            Publicar datos personales de otras personas (teléfonos, correos,
            direcciones) o capturas, fotos o grabaciones de compañeros o de las clases
            sin su consentimiento.
          </li>
          <li>
            Compartir el material del curso fuera de la Plataforma, o las respuestas de
            quizzes y evaluaciones.
          </li>
          <li>Hacerse pasar por otra persona o por el equipo de la Academia.</li>
          <li>
            Una foto de perfil o una descripción que incumpla cualquiera de estos puntos.
          </li>
        </ul>
      </Section>

      <Section title="4. Cómo reportar">
        <p>
          4.1. <strong>En los mensajes</strong> (privados o de un grupo), usa el botón{" "}
          <strong>Reportar</strong> que aparece junto a cada mensaje de otra persona:
          elige el motivo y, si quieres, añade un comentario. Le llega a la instructora
          de quien reporta y de quien escribió, que lo revisa; si el mensaje es de
          alguien del equipo de la Academia, o no hay instructora a quien avisar, lo
          revisa el equipo de la Academia. La persona reportada no sabe quién la
          reportó.
        </p>
        <p>
          4.2. <strong>En el resto de la Plataforma</strong> (por ejemplo, las preguntas
          bajo los videos o una foto de perfil), escríbenos a <Correo /> indicando dónde
          está (el día, la lección o el nombre de la persona) y, si puedes, una captura.
        </p>
        <p>Revisamos cada reporte.</p>
        <p>
          4.3. <strong>Bloquear.</strong> Puedes bloquear a otro estudiante desde un
          mensaje privado o desde la lista de miembros de un grupo. Mientras dure el
          bloqueo, ninguno de los dos puede escribir al otro en privado ni coincidir
          en un grupo nuevo. No se le avisa. En los grupos que ya compartíais, sus
          mensajes se siguen viendo, pero no te llegan avisos suyos. Puedes
          desbloquearle cuando quieras.
        </p>
      </Section>

      <Section title="5. Qué hacemos">
        <p>
          Tu instructora puede leer los grupos de mensajes en los que esté alguno de sus
          estudiantes, aunque ella no sea miembro, y también el grupo en el que uno de
          sus estudiantes reportó un mensaje, durante los días siguientes al reporte.
          Los mensajes privados entre
          estudiantes no los lee, salvo los que alguien le reporta.
        </p>
        <p>
          La instructora y el equipo de la Academia pueden ocultar o borrar
          publicaciones y mensajes que incumplan estas normas, y sacar a alguien de un
          grupo. Quien es sacado de un grupo no puede volver a él durante 7 días, y si
          lo sacó la instructora o el equipo, durante ese tiempo tampoco puede
          coincidir en ningún grupo con los estudiantes que estaban en él (o que
          acababan de salir) ni con quien le reportó. Quien sale de un grupo puede
          volver a ser añadido pasadas 24 horas. Según la gravedad y si se repite, podemos
          además advertirte, limitar tu acceso a la comunidad, suspender tu cuenta o
          cerrarla. En los casos graves, sin reembolso, según la{" "}
          <Enlace href="/reembolsos">Política de Reembolso</Enlace>.
        </p>
        <p>
          Si crees que nos equivocamos al moderar algo tuyo, escríbenos a <Correo /> y lo
          revisaremos.
        </p>
      </Section>

      {/*
        ⚠️⚠️ Decisión del negocio (2026-09-22): ante un comportamiento inadecuado, la
        INSTRUCTORA puede elegir dejar de darle clases al alumno, y NO hay devolución.
        Es la razón de ser de esta sección: la instructora no está obligada a seguir
        enseñando a quien la trata mal, y eso no puede convertirse en un reembolso.
        La enlazan: Términos de la plataforma §7.5 y §12.1, Términos del sitio §8 y
        Reembolsos §7. Si cambia la regla, cambian los cinco.
      */}
      <Section title="6. Comportamiento con tu instructora y en las clases">
        <p>
          6.1. Tu instructora está para acompañarte, y merece el mismo respeto que tú.
          Esto aplica en las clases en vivo (grupales e individuales), en los mensajes y
          en cualquier otro contacto con ella o con el equipo de la Academia.
        </p>
        <p>6.2. Se considera comportamiento inadecuado, entre otros:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            faltas de respeto, insultos, gritos, humillaciones o amenazas;
          </li>
          <li>
            comentarios, mensajes, imágenes o gestos de carácter sexual, o cualquier
            forma de acoso;
          </li>
          <li>
            insistir en contactarla fuera de los canales de la Academia, o por motivos
            ajenos a las clases;
          </li>
          <li>discriminación por cualquier motivo;</li>
          <li>
            grabar, fotografiar o difundir la clase, a la instructora o a tus compañeros
            sin su consentimiento;
          </li>
          <li>
            interrumpir la clase de forma reiterada o impedir que los demás aprendan;
          </li>
          <li>
            conectarte bajo los efectos del alcohol u otras sustancias, o compartir el
            enlace de la clase con personas que no están inscritas.
          </li>
        </ul>
        <p>
          6.3. <strong>Qué puede pasar.</strong> Ante un comportamiento inadecuado, la
          instructora puede terminar la clase en ese momento y{" "}
          <strong>puede decidir dejar de darte clases</strong>. Si la falta es grave, no
          hace falta un aviso previo. La Academia puede ofrecerte continuar con otra
          instructora, pero no está obligada a hacerlo.
        </p>
        <p>
          6.4. <strong>Sin devolución.</strong> Si la instructora deja de darte clases por
          tu comportamiento,{" "}
          <strong>no hay devolución del dinero</strong>, ni total ni parcial: tampoco de
          las clases que no llegaste a recibir ni del resto del periodo pagado. Una clase
          terminada antes de tiempo por este motivo cuenta como impartida.
        </p>
        <p>
          6.5. Salvo que tu cuenta también se suspenda según los{" "}
          <Enlace href="/legal/plataforma/terminos">Términos de Uso</Enlace>, conservas el
          resto de tu plan (tus sesiones diarias y el material de la Plataforma) hasta el
          final del periodo pagado.
        </p>
        <p>
          6.6. Si eres menor de edad, informaremos de lo ocurrido a tu madre, padre o
          tutor. Puedes escribirnos a <Correo /> para contarnos tu versión; la
          revisaremos, pero la instructora no está obligada a retomar las clases.
        </p>
      </Section>
    </DocumentoLegal>
  );
}
