import type { Metadata } from "next";
import {
  Correo,
  DocumentoLegal,
  Enlace,
  Section,
  VERSIONES_PLATAFORMA,
} from "../../_components/legal";

export const metadata: Metadata = {
  title: "Política de Privacidad de la Plataforma",
  description:
    "Qué datos trata la plataforma de aprendizaje del Método 590 (voz, fotos, textos, uso), con quién los compartimos, uso de inteligencia artificial y tus derechos.",
  alternates: { canonical: "https://lz-englishacademy.com/legal/plataforma/privacidad" },
};

/*
  ⚠️ Esta política describe el código REAL de la plataforma (inventario en
  `LainZ590/docs/legal/inventario-terminos-plataforma.md`, § 4).
  ⚠️⚠️ La sección 5 (grabaciones y fotos con ENLACE PÚBLICO) es una decisión del
  negocio del 2026-09-22: se DECLARA tal cual en vez de cerrarlo. Si algún día
  se sirven con enlace firmado, esta sección se reescribe y sube la versión.
  ⚠️ Al añadir un proveedor que reciba datos de alumnos (lo mismo que obliga a
  añadir su chequeo en Admin › Integraciones), se añade a la sección 4.
*/

export default function PrivacidadPlataformaPage() {
  return (
    <DocumentoLegal
      titulo="Política de Privacidad de la Plataforma"
      version={VERSIONES_PLATAFORMA.privacidad}
    >
      <div className="space-y-4 text-[15px] leading-relaxed text-zinc-600">
        <p>
          Esta Política explica qué datos personales trata <strong>LZ English
          Academy</strong> (&ldquo;la Academia&rdquo;, &ldquo;nosotros&rdquo;), operada
          por <strong>LainZ590</strong> (San Francisco, California, EE. UU.), cuando usas
          la plataforma de aprendizaje del <strong>Método 590</strong> (&ldquo;la
          Plataforma&rdquo;): para qué los usamos, con quién los compartimos, cuánto
          tiempo los guardamos y qué derechos tienes.
        </p>
        <p>
          Lo que haces en el sitio web (informarte, inscribirte y pagar) se rige por la{" "}
          <Enlace href="/privacidad">Política de Privacidad del sitio web</Enlace>.
        </p>
      </div>

      <Section title="1. Qué datos tratamos">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Cuenta y contacto:</strong> nombre, correo electrónico, teléfono (si
            lo das), contraseña (guardada cifrada, nunca en texto legible).
          </li>
          <li>
            <strong>Perfil:</strong> nivel de inglés, fecha de nacimiento, zona horaria,
            ritmo de estudio, foto de perfil, descripción personal y preferencias de
            notificaciones.
          </li>
          <li>
            <strong>Aprendizaje:</strong> los días y sesiones que completas, tus
            respuestas a quizzes y evaluaciones, tu racha, tu progreso, tus certificados
            y el tiempo en que haces cada cosa.
          </li>
          <li>
            <strong>Grabaciones de voz:</strong> lo que grabas en las actividades de
            speaking, y su transcripción.
          </li>
          <li>
            <strong>Fotos:</strong> la foto de tu cuaderno que subes con el journal. Ten
            en cuenta que puede incluir tu nombre o tu letra.
          </li>
          <li>
            <strong>Textos que escribes:</strong> journal, respuestas de recuerdo activo,
            preguntas y respuestas bajo los videos, mensajes con otros usuarios y
            reseñas.
          </li>
          <li>
            <strong>Juegos:</strong> partidas, monedas y artículos de la tienda.
          </li>
          <li>
            <strong>Pagos:</strong> identificadores de cliente, pago y suscripción de
            Stripe, plan y fechas. <strong>No guardamos los datos de tu tarjeta</strong>:
            los guarda Stripe.
          </li>
          <li>
            <strong>Datos técnicos:</strong> dirección IP, navegador y dispositivo al
            iniciar sesión y en acciones sensibles (para seguridad y auditoría), y, si
            activas las notificaciones, el identificador de tu dispositivo para
            enviártelas.
          </li>
          <li>
            <strong>Uso:</strong> páginas visitadas y acciones dentro de la Plataforma,
            medidas con Google Analytics (sección 7).
          </li>
        </ul>
      </Section>

      <Section title="2. Para qué los usamos">
        <ul className="list-disc space-y-2 pl-5">
          <li>Darte acceso a tu curso, calcular tu día, tu ritmo, tu racha y tu avance.</li>
          <li>
            Que tus instructoras vean tu trabajo y tu progreso, y te acompañen.
          </li>
          <li>
            Darte retroalimentación sobre tu voz y tu escritura, en parte con
            inteligencia artificial (sección 3).
          </li>
          <li>Organizar tus clases en vivo y avisarte antes de que empiecen.</li>
          <li>
            Mostrar tu perfil y tus publicaciones a otros estudiantes en la comunidad.
          </li>
          <li>Emitir y permitir verificar tus certificados.</li>
          <li>
            Enviarte correos del servicio (acceso, pagos, seguridad) y, si no los
            desactivas, avisos y recordatorios.
          </li>
          <li>
            Proteger las cuentas y la Plataforma: detectar accesos indebidos, fraude o
            uso compartido.
          </li>
          <li>
            Medir y mejorar el método y la Plataforma, con datos agregados siempre que
            sea posible.
          </li>
          <li>Cumplir obligaciones legales, contables y fiscales.</li>
        </ul>
        <p>
          <strong>No vendemos tus datos personales</strong> ni los usamos para mostrarte
          publicidad de terceros.
        </p>
      </Section>

      <Section title="3. Inteligencia artificial">
        <p>Algunas funciones envían datos a proveedores de inteligencia artificial:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Google (Gemini):</strong> tus grabaciones de speaking y tus textos del
            journal, para transcribirlos y darte retroalimentación.
          </li>
          <li>
            <strong>Anthropic (Claude):</strong> la foto de tu cuaderno, para comprobar
            que es una foto de tu trabajo.
          </li>
          <li>
            <strong>ElevenLabs:</strong> el texto de las lecciones, para generar su audio.
            No recibe datos tuyos.
          </li>
        </ul>
        <p>
          Estos proveedores tratan los datos por encargo nuestro, para prestarnos ese
          servicio. La retroalimentación que generan es orientativa.
        </p>
      </Section>

      <Section title="4. Con quién compartimos tus datos">
        <p>
          Compartimos los datos estrictamente necesarios con proveedores que operan la
          Plataforma por encargo nuestro, cada uno con su propia política de privacidad:
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li><strong>Stripe</strong> — pagos y suscripciones.</li>
          <li><strong>Neon</strong> — base de datos.</li>
          <li><strong>Render</strong> y <strong>Vercel</strong> — servidores de la Plataforma.</li>
          <li>
            <strong>Cloudflare</strong> — almacenamiento de archivos (grabaciones, fotos,
            documentos) y de videos.
          </li>
          <li><strong>Resend</strong> — envío de correos.</li>
          <li><strong>Zoom</strong> — clases en vivo.</li>
          <li>
            <strong>Google</strong> — inteligencia artificial (sección 3) y Google
            Analytics (sección 7).
          </li>
          <li><strong>Anthropic</strong> y <strong>ElevenLabs</strong> — inteligencia artificial (sección 3).</li>
          <li>
            Los servicios de notificaciones de tu navegador o sistema (Google, Apple,
            Mozilla u otros), solo si activas las notificaciones.
          </li>
        </ul>
        <p>Dentro de la Academia y la Plataforma, además:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Tus instructoras y el equipo de la Academia</strong> ven tu perfil,
            tu progreso y tu trabajo (textos, grabaciones y fotos). Podemos revisar
            mensajes y publicaciones cuando sea necesario para moderar, atender un reporte
            o cumplir la ley.
          </li>
          <li>
            <strong>Otros estudiantes</strong> ven tu nombre, foto, descripción, nivel,
            marco de perfil y lo que publicas en la comunidad. Las preguntas de las
            cuentas gratis solo las ve su autor y el equipo de la Academia.
          </li>
          <li>
            <strong>Cualquier persona con el código de un certificado</strong> puede ver
            tu nombre, el nivel y la fecha al verificarlo.
          </li>
        </ul>
        <p>
          También podemos divulgar datos si lo exige la ley o una autoridad competente, o
          en caso de reorganización o venta del negocio, con las mismas protecciones.
        </p>
      </Section>

      <Section title="5. Cómo se guardan tus grabaciones y fotos">
        <p>
          Tus grabaciones de voz y las fotos de tu cuaderno se guardan en el
          almacenamiento en la nube de Cloudflare y se abren mediante un{" "}
          <strong>enlace único y difícil de adivinar</strong>. Ese enlace{" "}
          <strong>no pide iniciar sesión</strong>: cualquier persona que lo obtenga
          podría abrir el archivo. Solo lo mostramos dentro de la Plataforma a ti, a tus
          instructoras y al equipo de la Academia, pero no compartas esos enlaces fuera
          de ella.
        </p>
        <p>
          Si no quieres que una grabación o una foto siga guardada, puedes pedirnos que
          la borremos (sección 9).
        </p>
      </Section>

      <Section title="6. Seguridad">
        <p>
          Usamos conexiones cifradas, contraseñas cifradas, sesiones con caducidad y
          detección de accesos sospechosos. Ningún sistema es infalible: si detectamos un
          incidente que afecte a tus datos, te lo comunicaremos según exija la ley.
        </p>
      </Section>

      <Section title="7. Cookies, almacenamiento local y analítica">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Necesarias:</strong> una cookie de sesión para mantenerte conectado y
            el almacenamiento local del navegador para recordar tu sesión y tus
            preferencias. Sin ellas la Plataforma no funciona.
          </li>
          <li>
            <strong>Aplicación instalable:</strong> si instalas la Plataforma en tu
            dispositivo, se guardan archivos de la interfaz para que abra más rápido.
            Nunca se guarda ahí el material del curso ni tus datos.
          </li>
          <li>
            <strong>Analítica:</strong> usamos Google Analytics para entender de forma
            agregada cómo se usa la Plataforma. Puedes impedirlo con el complemento de
            inhabilitación de Google Analytics o con un bloqueador en tu navegador; la
            Plataforma sigue funcionando igual.
          </li>
        </ul>
        <p>
          <strong>Señales &ldquo;Do Not Track&rdquo;:</strong> la Plataforma no cambia su
          comportamiento al recibir esa señal del navegador, porque no existe un estándar
          común para ella. Puedes limitar la analítica como se indica arriba.
        </p>
      </Section>

      <Section title="8. Correos y notificaciones">
        <p>
          Los correos del servicio (acceso, contraseña, pagos, seguridad) no se pueden
          desactivar, porque responden a algo que tú hiciste o que afecta a tu cuenta.
          Los avisos y recordatorios llevan un enlace para darte de baja con un clic, y
          puedes elegir qué recibes desde Notificaciones en la Plataforma. Las
          notificaciones push son opcionales y se activan por dispositivo.
        </p>
      </Section>

      <Section title="9. Cuánto tiempo los guardamos y tus derechos">
        <p>
          9.1. Guardamos tus datos mientras tengas cuenta. Si tu plan de pago termina,
          tu cuenta pasa al plan gratis y conservamos tu avance y tu trabajo para que
          puedas continuar.
        </p>
        <p>
          9.2. Puedes pedirnos en cualquier momento <strong>acceder</strong> a tus datos,{" "}
          <strong>corregirlos</strong>, <strong>recibir una copia</strong> o{" "}
          <strong>eliminarlos</strong>, y también que borremos una grabación o foto
          concreta. Escríbenos a <Correo /> desde el correo de tu cuenta. Responderemos en
          un plazo máximo de <strong>30 días</strong>.
        </p>
        <p>
          9.3. Al eliminar tu cuenta, desactivamos el acceso y eliminamos o
          anonimizamos tus datos personales y tu contenido. Conservamos solo lo que la
          ley nos obliga a guardar (por ejemplo, registros de pagos y facturación) y
          durante el plazo que esta exija. Los certificados emitidos dejarán de poder
          verificarse con tu nombre.
        </p>
        <p>
          9.4. Tu nombre, foto, nivel, zona horaria, descripción y preferencias de
          notificación los puedes cambiar tú mismo desde tu perfil y los ajustes.
        </p>
      </Section>

      <Section title="10. Residentes de California">
        <p>
          Si resides en California, tienes derecho a saber qué categorías de datos
          personales recogemos y con quién los compartimos (secciones 1 y 4). No vendemos
          datos personales ni los compartimos a cambio de nada de valor. Puedes pedirnos
          la información a la que te da derecho la ley de California escribiendo a{" "}
          <Correo />.
        </p>
      </Section>

      <Section title="11. Edad mínima">
        <p>
          La Plataforma es para personas de <strong>14 años o más</strong>. No
          recogemos a sabiendas datos de menores de 14 años: si sabemos que una cuenta
          pertenece a uno, la cerraremos y eliminaremos sus datos. Los alumnos de 14 a
          17 años usan la Plataforma con el permiso de su madre, padre o tutor legal, que
          puede ejercer en su nombre los derechos de la sección 9. Si crees que un menor
          de 14 años nos dio sus datos, escríbenos a <Correo />.
        </p>
      </Section>

      <Section title="12. Transferencia internacional">
        <p>
          La Academia y sus proveedores tratan los datos principalmente en los{" "}
          <strong>Estados Unidos</strong>. Si usas la Plataforma desde otro país, tus
          datos se transfieren y tratan allí, donde las leyes de protección de datos
          pueden ser distintas a las de tu país.
        </p>
      </Section>

      <Section title="13. Cambios a esta Política">
        <p>
          Podemos actualizar esta Política. Publicaremos la nueva versión en esta página
          con su fecha y, si el cambio es importante, te avisaremos dentro de la
          Plataforma o por correo.
        </p>
      </Section>

      <Section title="14. Ley aplicable y contacto">
        <p>
          Esta Política se rige por las leyes del <strong>Estado de California, Estados
          Unidos</strong>, salvo disposición legal en contrario. Para cualquier consulta
          sobre tus datos, escríbenos a <Correo />.
          <br />
          LZ English Academy — Método 590 · LainZ590, San Francisco, California, EE. UU.
        </p>
      </Section>
    </DocumentoLegal>
  );
}
