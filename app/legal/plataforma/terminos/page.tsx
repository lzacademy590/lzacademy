import type { Metadata } from "next";
import {
  Correo,
  DocumentoLegal,
  Enlace,
  Section,
  URL_SUSCRIPCION_PLATAFORMA,
  VERSIONES_PLATAFORMA,
} from "../../_components/legal";

export const metadata: Metadata = {
  title: "Términos de Uso de la Plataforma",
  description:
    "Términos de uso de la plataforma de aprendizaje del Método 590: cuenta, avance del curso, plan gratis, prueba, clases en vivo, monedas, contenido del usuario y responsabilidad.",
  alternates: { canonical: "https://lz-englishacademy.com/legal/plataforma/terminos" },
};

/*
  ⚠️ Cada cláusula de aquí describe un comportamiento REAL del código de la
  plataforma (repo `platform_backend`/`platform_frontend`). El inventario que las
  justifica está en `LainZ590/docs/legal/inventario-terminos-plataforma.md`.
  Si la plataforma cambia una regla (el candado del plan gratis, la pausa del
  día, la prueba, las monedas), este texto cambia con ella y sube su versión en
  `VERSIONES_PLATAFORMA`.
  ⚠️ No se nombran los planes: en la plataforma el catálogo es DATO y una lista
  escrita aquí queda vieja el día que se abre un plan.
*/

export default function TerminosPlataformaPage() {
  return (
    <DocumentoLegal titulo="Términos de Uso de la Plataforma" version={VERSIONES_PLATAFORMA.terminos}>
      <div className="space-y-4 text-[15px] leading-relaxed text-zinc-600">
        <p>
          Estos Términos de Uso (&ldquo;Términos de la Plataforma&rdquo;) regulan el acceso
          y el uso de la plataforma de aprendizaje de <strong>LZ English Academy</strong>{" "}
          (&ldquo;la Academia&rdquo;, &ldquo;nosotros&rdquo;), donde se cursa el{" "}
          <strong>Método 590</strong>: el portal del estudiante, sus sesiones, la
          comunidad, las clases en vivo y las funciones relacionadas (&ldquo;la
          Plataforma&rdquo;).
        </p>
        <p>
          La Plataforma es operada por <strong>LainZ590</strong>, con sede en{" "}
          <strong>San Francisco, California, Estados Unidos</strong>.
        </p>
        <p>
          Estos Términos se aplican <strong>además</strong> de los{" "}
          <Enlace href="/terminos">Términos y Condiciones del sitio web</Enlace>, que
          regulan la inscripción, los precios y los cobros, y de la{" "}
          <Enlace href="/reembolsos">Política de Reembolso y Cancelación</Enlace>. Si
          algo de este documento contradice a los del sitio web en lo que se refiere al
          uso de la Plataforma, prevalece este documento. Al crear tu cuenta, al pagar o
          al usar la Plataforma, aceptas estos Términos.
        </p>
      </div>

      <Section title="1. Definiciones">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Plan:</strong> la modalidad que tienes contratada o asignada. Los
            planes disponibles, su precio y lo que incluyen se muestran en la Plataforma y
            en el sitio web al momento de contratar.
          </li>
          <li>
            <strong>Plan gratis:</strong> la cuenta sin pago descrita en la sección 5.
          </li>
          <li>
            <strong>Día de curso:</strong> la unidad de avance del Método 590. Cada día
            tiene hasta cinco sesiones (teoría, escucha, memorización, lectura y práctica).
          </li>
          <li>
            <strong>Contenido del usuario:</strong> todo lo que tú creas o subes: textos,
            grabaciones de voz, fotos, preguntas, respuestas, mensajes, foto de perfil y
            descripción.
          </li>
          <li>
            <strong>Monedas:</strong> la unidad virtual que se gana con los juegos de la
            Plataforma (sección 9).
          </li>
        </ul>
      </Section>

      <Section title="2. Edad mínima">
        {/* ⚠️ Decisión del negocio (2026-09-22): 14 años. Entre 14 y 17 el alumno es
            MENOR: un contrato firmado solo por él es anulable en EE. UU., de ahí el
            consentimiento del adulto. Por debajo de 13 aplicaría COPPA; con 14 no. */}
        <p>
          2.1. Debes tener <strong>14 años o más</strong> para crear una cuenta y usar la
          Plataforma. Al registrarte declaras que cumples este requisito.
        </p>
        <p>
          2.2. <strong>Si tienes entre 14 y 17 años</strong>, necesitas el permiso de tu
          madre, padre o tutor legal para usar la Plataforma. Al registrarte declaras que
          lo tienes, y quien realiza el pago de un plan debe ser ese adulto, que acepta
          estos Términos en tu nombre y es responsable de su cumplimiento.
        </p>
        <p>
          2.3. Si sabemos o tenemos motivos razonables para creer que una cuenta pertenece
          a una persona menor de 14 años, o a un menor sin ese permiso, podemos
          suspenderla o cerrarla y eliminar sus datos personales.
        </p>
      </Section>

      <Section title="3. Tu cuenta">
        <p>
          3.1. Debes darnos información veraz y mantenerla actualizada. Tu nombre aparece
          en tu perfil, en la comunidad y en los certificados que emitimos.
        </p>
        <p>
          3.2. Tu cuenta es <strong>personal e intransferible</strong>. No puedes
          compartir tus credenciales ni permitir que otra persona curse por ti. Eres
          responsable de toda actividad que se haga desde tu cuenta.
        </p>
        <p>
          3.3. Por seguridad, podemos bloquear temporalmente el acceso tras varios intentos
          fallidos de inicio de sesión, pedirte que cambies tu contraseña o cerrar las
          sesiones abiertas.
        </p>
        <p>
          3.4. Si tu cuenta la creamos nosotros tras tu compra, recibirás tus datos de
          acceso por correo y deberás elegir una contraseña nueva la primera vez que
          entres.
        </p>
      </Section>

      <Section title="4. Cómo avanza tu curso">
        <p>
          4.1. <strong>Tu avance depende de que entres.</strong> Un día de curso nuevo se
          abre cuando completas el anterior. Si no entras a la Plataforma, tu curso{" "}
          <strong>se pausa</strong>: no avanza ni retrocede. El periodo que pagaste sigue
          corriendo mientras tanto, y los días no cursados{" "}
          <strong>no extienden tu periodo ni generan reembolso</strong>.
        </p>
        <p>
          4.2. <strong>Un día a la vez.</strong> No es posible adelantar días de curso,
          tampoco cambiando la fecha o la zona horaria del dispositivo. Un cambio de zona
          horaria en tu cuenta se aplica a partir del día siguiente.
        </p>
        <p>
          4.3. <strong>Días de descanso y de repaso.</strong> Según tu ritmo, la
          Plataforma puede asignarte días de descanso (con menos sesiones) o de repaso en
          lugar de contenido nuevo. Forman parte del método.
        </p>
        <p>
          4.4. <strong>Ritmo.</strong> Eliges tu ritmo de estudio al empezar y puedes
          cambiarlo en los ajustes. Algunos ritmos reparten el día de curso en dos partes.
          La Plataforma puede sugerirte un cambio de ritmo; aceptarlo es opcional.
        </p>
        <p>
          4.5. <strong>Fecha de inicio.</strong> Si tu plan empieza con una cohorte, tu
          curso se abre en la fecha de inicio elegida al comprar. Antes de esa fecha verás
          que tu curso aún no ha comenzado.
        </p>
        <p>
          4.6. <strong>Repaso.</strong> Puedes volver a abrir los días que ya completaste
          mientras tu cuenta exista, en las condiciones de tu plan (sección 5).
        </p>
        <p>
          4.7. <strong>Niveles y certificados.</strong> Al aprobar la evaluación de nivel,
          pasas al siguiente y podemos emitirte un certificado. Cada certificado lleva un
          código de verificación: cualquier persona que tenga ese código puede comprobar
          en línea su validez y ver tu nombre, el nivel y la fecha.
        </p>
      </Section>

      <Section title="5. Plan gratis">
        <p>
          5.1. Puedes crear una cuenta gratis. Con ella recorres y completas cada día de
          curso y escribes tus respuestas, pero los días <strong>no incluyen el
          material</strong> (video, audio, lectura completa, quizzes, voz de IA,
          grabación y foto): solo una vista previa.
        </p>
        <p>
          5.2. El plan gratis incluye <strong>un día de muestra</strong> completo, con
          todo su material, para que conozcas el método.
        </p>
        <p>
          5.3. El plan gratis <strong>no incluye</strong>: clases en vivo, racha,
          certificados, mensajes, juegos y tienda, vocabulario, ni corrección de tu
          trabajo. Lo que escribes se guarda, pero no lo revisa ninguna instructora ni la
          IA. Tus preguntas en la comunidad solo las ven tú y el equipo de la Academia.
        </p>
        <p>
          5.4. Si contratas un plan de pago, <strong>continúas donde ibas</strong>, y los
          días que ya hiciste pasan a abrirse con su material.
        </p>
        <p>
          5.5. Podemos modificar lo que incluye el plan gratis, o dejar de ofrecerlo a
          cuentas nuevas, en cualquier momento.
        </p>
      </Section>

      <Section title="6. Fin del plan de pago, semana de prueba y reembolsos">
        <p>
          6.1. <strong>Si tu plan de pago termina</strong> (cancelaste, no renovaste o no
          se pudo cobrar), tu cuenta pasa al plan gratis: conservas tu avance, tu
          historial y lo que escribiste, pero los días nuevos llegan sin material. La
          racha deja de contar.
        </p>
        <p>
          6.2. <strong>Si recibes un reembolso</strong>, tu cuenta también pasa al plan
          gratis, en las mismas condiciones.
        </p>
        <p>
          6.3. <strong>Semana de prueba.</strong> Si te damos una semana de prueba, tienes
          acceso completo hasta la fecha de fin indicada. Al terminar, tu curso{" "}
          <strong>se congela</strong>: no recibes días nuevos, pero puedes repasar los que
          hiciste. La prueba no se convierte sola en un pago: si pagas, tu curso sigue
          desde donde lo dejaste.
        </p>
        <p>
          6.4. Los cobros, la renovación automática, la cancelación y los reembolsos se
          rigen por los <Enlace href="/terminos">Términos del sitio web</Enlace> y la{" "}
          <Enlace href="/reembolsos">Política de Reembolso y Cancelación</Enlace>. Para
          cancelar la renovación, entra a la Plataforma, ve a{" "}
          <Enlace href={URL_SUSCRIPCION_PLATAFORMA}>Configuración › Suscripción</Enlace> y pulsa
          &laquo;Gestionar suscripción y pago&raquo;, o escríbenos a <Correo />. Si te
          inscribiste en el sitio web, también puedes usar{" "}
          <Enlace href="/mi-suscripcion">Gestionar mi suscripción</Enlace>.
        </p>
      </Section>

      <Section title="7. Clases en vivo">
        <p>
          7.1. Solo los planes que las incluyen dan acceso a clases en vivo, que se
          imparten por <strong>Zoom</strong>. Los días y la modalidad (grupal o
          individual) son los del plan contratado. Los horarios se publican en la
          Plataforma, en la hora que ahí se indique.
        </p>
        <p>
          7.2. Para asistir necesitas una cuenta de Zoom o su aplicación, y aceptas sus
          términos. <strong>Las clases no se graban.</strong>
        </p>
        <p>
          7.3. Una clase a la que no asistes no se recupera ni se reembolsa. Si la
          Academia cancela una clase, te avisaremos y te ofreceremos una alternativa
          razonable.
        </p>
        <p>
          7.4. No se permite grabar, fotografiar ni difundir las clases o a sus
          participantes sin su consentimiento.
        </p>
        <p>
          7.5. <strong>Comportamiento en las clases.</strong> Si te comportas de forma
          inadecuada con tu instructora o en la clase, la instructora puede terminar la
          clase y <strong>decidir dejar de darte clases</strong>, sin devolución del
          dinero. El detalle está en la sección 6 de las{" "}
          <Enlace href="/legal/plataforma/normas-de-comunidad">Normas de la Comunidad y
          de Comportamiento</Enlace>.
        </p>
      </Section>

      <Section title="8. Tu contenido">
        <p>
          8.1. El contenido que creas o subes <strong>sigue siendo tuyo</strong>. Para
          poder prestarte el servicio, nos das una licencia no exclusiva, gratuita y
          mundial para guardarlo, reproducirlo, mostrarlo y procesarlo dentro de la
          Plataforma mientras tengas cuenta. Esto incluye:
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>mostrarlo a tus instructoras y al equipo de la Academia;</li>
          <li>
            mostrar a otros estudiantes lo que publicas en la comunidad (preguntas,
            respuestas, perfil);
          </li>
          <li>
            procesarlo con los servicios de inteligencia artificial descritos en la{" "}
            <Enlace href="/legal/plataforma/privacidad">Política de Privacidad de la
            Plataforma</Enlace>;
          </li>
          <li>
            usarlo de forma anónima y agregada para mejorar el método y la Plataforma.
          </li>
        </ul>
        <p>
          8.2. <strong>Reseñas y testimonios.</strong> Si nos dejas una reseña, podemos
          publicarla en el sitio web y en nuestros materiales, con tu nombre, tu país y tu nivel,
          solo cuando la hayas enviado como testimonio o nos lo hayas autorizado.
        </p>
        <p>
          8.3. Garantizas que tienes derecho a subir lo que subes y que no infringe los
          derechos de nadie. Debes cumplir las{" "}
          <Enlace href="/legal/plataforma/normas-de-comunidad">Normas de la
          Comunidad</Enlace>. Podemos ocultar o eliminar contenido que las incumpla.
        </p>
        <p>
          8.4. <strong>Derechos de autor.</strong> Si crees que un contenido de la
          Plataforma infringe tus derechos de autor, escríbenos a <Correo /> e indica: la
          obra afectada, dónde aparece el contenido, tus datos de contacto, una
          declaración de buena fe y tu firma. Retiraremos lo que corresponda y podemos
          cerrar las cuentas que infrinjan de forma reiterada.
        </p>
      </Section>

      <Section title="9. Monedas, juegos y tienda">
        <p>
          9.1. Las monedas se ganan jugando en la Plataforma, con un tope diario. Sirven
          únicamente para obtener artículos de la tienda de la Plataforma (marcos, fondos
          y otros elementos de perfil).
        </p>
        <p>
          9.2. Las monedas <strong>no tienen valor monetario</strong>: no se compran con
          dinero, no se canjean por dinero ni por servicios, no se transfieren a otra
          cuenta y no se reembolsan. Tampoco son propiedad tuya: son una licencia de uso
          limitada dentro de la Plataforma.
        </p>
        <p>
          9.3. Podemos cambiar cuántas monedas da cada juego, el tope diario, los precios
          de la tienda y los artículos disponibles, o pausar los juegos, sin compensación.
          Si un artículo deja de venderse, quien ya lo tenía lo conserva.
        </p>
        <p>
          9.4. Podemos anular monedas o artículos obtenidos mediante trampas, errores de
          la Plataforma o automatización. Al cerrarse una cuenta, sus monedas y artículos
          se pierden.
        </p>
      </Section>

      <Section title="10. Inteligencia artificial">
        <p>
          Algunas funciones usan inteligencia artificial: la transcripción y la
          retroalimentación de tus grabaciones y textos, la validación de la foto de tu
          cuaderno y la voz sintética de las lecciones. Sus resultados son{" "}
          <strong>orientativos</strong> y pueden contener errores: no son una nota oficial
          ni sustituyen la evaluación de nivel. Estas funciones pueden no estar
          disponibles en todos los planes o en todo momento.
        </p>
      </Section>

      <Section title="11. Uso permitido">
        <p>Te comprometes a no:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            descargar, copiar, grabar, capturar, revender o difundir el material del
            Método 590 (videos, audios, lecturas, quizzes, tarjetas);
          </li>
          <li>
            intentar acceder a contenido, días o funciones que tu plan no incluye, o
            eludir cualquier límite técnico de la Plataforma;
          </li>
          <li>
            usar programas automatizados, extraer datos de forma masiva o interferir con
            el funcionamiento de la Plataforma;
          </li>
          <li>hacerse pasar por otra persona o compartir tu cuenta;</li>
          <li>
            incumplir las{" "}
            <Enlace href="/legal/plataforma/normas-de-comunidad">Normas de la
            Comunidad</Enlace>.
          </li>
        </ul>
      </Section>

      <Section title="12. Suspensión y cierre">
        <p>
          12.1. Podemos suspender o cerrar tu cuenta si incumples estos Términos, si hay
          indicios de fraude o de uso compartido, o si lo exige la ley. En los casos
          graves lo haremos sin reembolso, según la{" "}
          <Enlace href="/reembolsos">Política de Reembolso</Enlace>. Que la instructora
          deje de darte clases por tu comportamiento (sección 7.5) tampoco da derecho a
          devolución.
        </p>
        <p>
          12.2. Puedes pedirnos cerrar tu cuenta en cualquier momento escribiendo a{" "}
          <Correo />. Cerrarla no cancela por sí sola un cobro ya realizado; la
          renovación se cancela como se indica en la sección 6.4. Lo que ocurre con tus
          datos se explica en la{" "}
          <Enlace href="/legal/plataforma/privacidad">Política de Privacidad de la
          Plataforma</Enlace>.
        </p>
      </Section>

      <Section title="13. Disponibilidad y cambios en la Plataforma">
        <p>
          Trabajamos para que la Plataforma esté disponible, pero puede haber
          interrupciones por mantenimiento, fallos o causas ajenas a nosotros. Podemos
          modificar, añadir o retirar funciones, contenidos y lecciones para mejorar el
          método. Si un cambio reduce de forma sustancial lo que incluye un plan de pago
          vigente, te avisaremos con antelación razonable.
        </p>
      </Section>

      <Section title="14. Propiedad intelectual">
        <p>
          El Método 590, sus materiales, videos, audios, textos, ilustraciones, diseño,
          software y marcas son propiedad de la Academia o de sus licenciantes. Tu plan te
          otorga una licencia <strong>personal, limitada, no exclusiva, intransferible y
          revocable</strong> para usarlos con fines educativos propios dentro de la
          Plataforma, mientras tengas acceso.
        </p>
      </Section>

      <Section title="15. Exclusión de garantías y limitación de responsabilidad">
        <p>
          15.1. La Plataforma se ofrece <strong>&ldquo;tal cual&rdquo; y &ldquo;según
          disponibilidad&rdquo;</strong>. No garantizamos resultados de aprendizaje
          concretos, que dependen de tu dedicación, ni que la Plataforma funcione sin
          interrupciones ni errores.
        </p>
        <p>
          15.2. En la medida permitida por la ley, la Academia no responde por daños
          indirectos, incidentales, especiales o consecuentes, ni por pérdida de datos o
          de oportunidades. La responsabilidad total de la Academia se limita al importe
          que pagaste en los 28 días anteriores al hecho que la origina.
        </p>
        <p>
          15.3. Aceptas mantener indemne a la Academia frente a reclamaciones de terceros
          derivadas de tu contenido o de tu incumplimiento de estos Términos.
        </p>
      </Section>

      <Section title="16. Cambios a estos Términos">
        <p>
          Podemos actualizar estos Términos. Publicaremos la nueva versión en esta página
          con su fecha. Si el cambio es importante, te avisaremos dentro de la Plataforma
          o por correo y podremos pedirte que lo aceptes para seguir usándola. Si no estás
          de acuerdo, puedes dejar de usar la Plataforma y cancelar tu plan.
        </p>
      </Section>

      <Section title="17. Ley aplicable y disputas">
        <p>
          Estos Términos se rigen por las leyes del <strong>Estado de California,
          Estados Unidos</strong>, sin atender a sus normas de conflicto de leyes.
          Cualquier controversia se someterá a los tribunales competentes de San
          Francisco, California, salvo que la ley aplicable disponga otra cosa. Antes de
          iniciar un reclamo, escríbenos: resolvemos la mayoría de los casos directamente.
        </p>
      </Section>

      <Section title="18. Disposiciones generales">
        <p>
          Si alguna cláusula resulta inválida, el resto sigue vigente. Que no ejerzamos un
          derecho no significa que renunciemos a él. No puedes ceder estos Términos sin
          nuestro consentimiento; nosotros podemos cederlos en caso de reorganización o
          venta del negocio.
        </p>
      </Section>

      <Section title="19. Contacto">
        <p>
          Para cualquier consulta sobre estos Términos, escríbenos a <Correo />.
          <br />
          LZ English Academy — Método 590 · LainZ590, San Francisco, California, EE. UU.
        </p>
      </Section>
    </DocumentoLegal>
  );
}
