import Link from "next/link";
import { Container } from "../components/Container";
import { PestanasLegales } from "../legal/_components/legal";

const LAST_UPDATED = "22 de septiembre de 2026";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10 first:mt-0">
      <h2 className="text-xl font-extrabold tracking-tight text-zinc-900 sm:text-2xl">
        {title}
      </h2>
      <div className="mt-4 space-y-4 text-[15px] leading-relaxed text-zinc-600">
        {children}
      </div>
    </section>
  );
}

export default function PrivacidadPage() {
  return (
    <main className="bg-white text-zinc-900">
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-b from-falu-red-100 via-white to-falu-red-50" />
        <div className="pointer-events-none absolute -top-28 left-10 h-72 w-72 rounded-full bg-falu-red-300/18 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 right-10 h-72 w-72 rounded-full bg-yellow-orange-300/14 blur-3xl" />
        <Container>
          <div className="relative mx-auto max-w-3xl py-12 sm:py-16">
            <div className="mb-8">
              <PestanasLegales activa="sitio" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-wide text-falu-red-700">
              LZ English Academy — Método 590
            </p>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-zinc-900 sm:text-4xl">
              Política de Privacidad
            </h1>
            <p className="mt-4 text-sm text-zinc-500">
              Última actualización: {LAST_UPDATED}
            </p>
          </div>
        </Container>
      </section>

      {/* CONTENIDO */}
      <section className="py-12 sm:py-16">
        <Container>
          <article className="mx-auto max-w-3xl">
            <div className="space-y-4 text-[15px] leading-relaxed text-zinc-600">
              <p>
                En <strong>LZ English Academy</strong> (&ldquo;la Academia&rdquo;,
                &ldquo;nosotros&rdquo;) valoramos tu privacidad. Esta Política de Privacidad
                (&ldquo;Política&rdquo;) describe qué datos personales recolectamos a través de
                nuestro sitio web{" "}
                <span className="font-medium text-zinc-700">lz-englishacademy.com</span> y de los
                programas de aprendizaje de inglés conocidos como el <strong>Método 590</strong>{" "}
                (&ldquo;el Servicio&rdquo;), cómo los usamos, con quién los compartimos y qué
                derechos tienes sobre ellos.
              </p>
              <p>
                El Servicio es operado por <strong>LainZ590</strong>. Al
                inscribirte y utilizar el Servicio, declaras que has leído y entendido esta
                Política.
              </p>
              <p>
                Esta Política cubre el sitio web y la inscripción. Los datos que se tratan al
                estudiar en la plataforma de aprendizaje (grabaciones de voz, fotos, textos,
                comunidad, uso de inteligencia artificial) se explican en la{" "}
                <Link
                  href="/legal/plataforma/privacidad"
                  className="font-semibold text-falu-red-700 hover:text-falu-red-800"
                >
                  Política de Privacidad de la Plataforma
                </Link>
                .
              </p>
            </div>

            <Section title="1. Qué datos recolectamos">
              <p>
                Recolectamos únicamente los datos necesarios para prestar el Servicio y atender tu
                inscripción:
              </p>
              <ul className="list-disc space-y-2 pl-5">
                <li>
                  <strong>Datos de identificación y contacto:</strong> nombre y correo
                  electrónico.
                </li>
                <li>
                  <strong>Datos del perfil de aprendizaje:</strong> país y nivel de inglés.
                </li>
                <li>
                  <strong>Datos necesarios para procesar el pago:</strong> los pagos son
                  procesados por <strong>Stripe</strong>. La Academia{" "}
                  <strong>no almacena los datos completos de tu tarjeta</strong>; únicamente
                  recibimos información mínima de confirmación de la transacción (por ejemplo, el
                  estado del pago). En los planes de suscripción, tu método de pago se conserva de
                  forma segura en <strong>Stripe</strong> (no en nuestros servidores) para permitir
                  los cobros recurrentes; nosotros solo guardamos identificadores de la transacción
                  y de la suscripción.
                </li>
              </ul>
            </Section>

            <Section title="2. Para qué usamos tus datos">
              <p>Tratamos tus datos personales con las siguientes finalidades:</p>
              <ul className="list-disc space-y-2 pl-5">
                <li>Prestar el servicio educativo y darte acceso al material del Método 590.</li>
                <li>Gestionar tu inscripción, tu cohorte y el procesamiento de los pagos.</li>
                <li>
                  Comunicarnos contigo por correo electrónico y a través de la comunidad de
                  WhatsApp (avisos, fechas de inicio, soporte y novedades del programa).
                </li>
                <li>Mejorar y mantener la calidad del Servicio.</li>
              </ul>
            </Section>

            <Section title="3. Con quién compartimos tus datos">
              <p>
                No <strong>vendemos</strong> tus datos personales a terceros. Para operar el
                Servicio, compartimos los datos estrictamente necesarios con los siguientes
                encargados de tratamiento, cada uno bajo su propia política de privacidad:
              </p>
              <ul className="list-disc space-y-2 pl-5">
                <li>
                  <strong>Stripe</strong> — procesamiento de pagos.
                </li>
                <li>
                  <strong>Supabase</strong> — alojamiento de la base de datos.
                </li>
                <li>
                  <strong>Resend</strong> — envío de correos transaccionales.
                </li>
                <li>
                  <strong>WhatsApp</strong> — comunidad y comunicación con los estudiantes.
                </li>
              </ul>
              <p>
                También podríamos divulgar datos cuando lo exija la ley o una autoridad competente.
              </p>
            </Section>

            <Section title="4. Conservación de datos">
              <p>
                Conservamos tus datos personales únicamente durante el tiempo necesario para
                cumplir con las finalidades descritas en esta Política y con las obligaciones
                legales, contables y fiscales aplicables. Cuando los datos dejen de ser necesarios,
                los eliminamos o anonimizamos de forma segura.
              </p>
            </Section>

            <Section title="5. Tus derechos">
              <p>
                Puedes ejercer en cualquier momento tus derechos de{" "}
                <strong>acceso, rectificación y eliminación</strong> de tus datos personales, así
                como solicitar información sobre el tratamiento que hacemos de ellos. Para
                ejercerlos, escríbenos a{" "}
                <a
                  href="mailto:info@lz-englishacademy.com"
                  className="font-semibold text-falu-red-700 hover:text-falu-red-800"
                >
                  info@lz-englishacademy.com
                </a>
                . Atenderemos tu solicitud en un plazo razonable.
              </p>
            </Section>

            <Section title="6. Cookies y tecnologías similares">
              <p>
                Hacemos un <strong>uso mínimo</strong> de cookies y tecnologías similares,
                limitado a las necesarias para el funcionamiento básico del sitio y, en su caso,
                para entender de forma agregada cómo se usa para mejorar el Servicio. Puedes
                configurar tu navegador para bloquear o eliminar cookies; ten en cuenta que
                deshabilitarlas podría afectar el funcionamiento de algunas partes del sitio.
              </p>
            </Section>

            <Section title="7. Cambios a esta Política">
              <p>
                La Academia puede actualizar esta Política en cualquier momento. Los cambios se
                publicarán en esta página con su fecha de actualización. El uso continuado del
                Servicio tras una modificación implica la aceptación de la Política vigente.
              </p>
            </Section>

            <Section title="8. Ley aplicable">
              <p>
                Esta Política se rige por las leyes del{" "}
                <strong>Estado de California, Estados Unidos</strong>, salvo disposición legal en contrario.
              </p>
            </Section>

            <Section title="9. Contacto">
              <p>
                Para cualquier consulta sobre esta Política o sobre el tratamiento de tus datos,
                escríbenos a:
              </p>
              <p>
                <a
                  href="mailto:info@lz-englishacademy.com"
                  className="font-semibold text-falu-red-700 hover:text-falu-red-800"
                >
                  info@lz-englishacademy.com
                </a>
                <br />
                LZ English Academy — Método 590
                <br />
                <span className="text-zinc-500">lz-englishacademy.com</span>
              </p>
            </Section>

            <Section title="Relacionado">
              <p>
                Consulta también nuestros{" "}
                <Link
                  href="/terminos"
                  className="font-semibold text-falu-red-700 hover:text-falu-red-800"
                >
                  Términos y Condiciones
                </Link>{" "}
                y nuestra{" "}
                <Link
                  href="/reembolsos"
                  className="font-semibold text-falu-red-700 hover:text-falu-red-800"
                >
                  Política de Reembolso y Cancelación
                </Link>
                .
              </p>
            </Section>
          </article>
        </Container>
      </section>
    </main>
  );
}
