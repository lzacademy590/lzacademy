import Link from "next/link";
import { Container } from "../components/Container";
import { PestanasLegales, URL_SUSCRIPCION_PLATAFORMA } from "../legal/_components/legal";

// ⚠️ Esta política es UNA para el sitio web y la plataforma (ver `app/legal/`):
// no se duplica en `/legal/plataforma`, se enlaza desde las dos vistas.
const LAST_UPDATED = "22 de septiembre de 2026";

// TODO (pendiente de decisión del dueño): definir el tratamiento de la comisión de Stripe
// en reembolsos. Stripe NO devuelve la comisión original (~2.9% + $0.30) al hacer un refund.
// Opciones: (a) reembolso total absorbiendo la comisión, o (b) descontar la comisión no
// recuperable del monto reembolsado. Mientras se decide, la política mantiene "reembolso completo".

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

export default function ReembolsosPage() {
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
              <PestanasLegales />
            </div>
            <p className="text-xs font-semibold uppercase tracking-wide text-falu-red-700">
              LZ English Academy — Método 590
            </p>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-zinc-900 sm:text-4xl">
              Política de Reembolso y Cancelación
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
                Esta Política de Reembolso y Cancelación describe en qué condiciones puedes
                solicitar la devolución de tu pago o cancelar tu suscripción a{" "}
                <strong>LZ English Academy</strong> y al <strong>Método 590</strong>. Forma
                parte integral de nuestros{" "}
                <Link
                  href="/terminos"
                  className="font-semibold text-falu-red-700 hover:text-falu-red-800"
                >
                  Términos y Condiciones
                </Link>
                .
              </p>
            </div>

            {/* RESUMEN / TL;DR */}
            <div className="mt-8 rounded-2xl border border-falu-red-200 bg-falu-red-50/60 p-5">
              <p className="text-sm font-bold uppercase tracking-wide text-falu-red-700">
                En resumen
              </p>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-[15px] leading-relaxed text-zinc-700">
                {/* ⚠️ Desde el 2026-08-28 hay planes SIN cohorte (Essential), que
                    empiezan el mismo día del pago. Decir solo "de tu cohorte" dejaba
                    su ventana de devolución sin comienzo definido, y éste es el
                    documento al que el clickwrap del checkout le ata. Criterio del
                    negocio (2026-08-29): para esos planes los 3 días corren desde la
                    FECHA DE PAGO, que es cuando empieza a usar el servicio. */}
                <li>
                  <strong>Reembolso completo</strong> si cancelas{" "}
                  <strong>antes de iniciar tus clases</strong> o dentro de los{" "}
                  <strong>primeros 3 días naturales</strong> desde el inicio de tu cohorte
                  —o desde la <strong>fecha de pago</strong>, si tu plan empieza el mismo
                  día y no va por cohorte— (solo primera inscripción).
                </li>
                <li>
                  Después de los 3 días, el periodo en curso <strong>no es reembolsable</strong>,
                  pero puedes cancelar la renovación para no pagar el siguiente.
                </li>
                <li>
                  Las <strong>renovaciones</strong> y reinscripciones <strong>no</strong> tienen
                  garantía de reembolso.
                </li>
                <li>
                  Solicítalo a{" "}
                  <a
                    href="mailto:info@lz-englishacademy.com"
                    className="font-semibold text-falu-red-700 hover:text-falu-red-800"
                  >
                    info@lz-englishacademy.com
                  </a>
                  ; se procesa por Stripe en <strong>5–10 días hábiles</strong>.
                </li>
              </ul>
            </div>

            <Section title="1. Garantía de satisfacción para estudiantes nuevos">
              <p>
                Si es tu <strong>primera inscripción</strong>, tienes derecho a un{" "}
                <strong>reembolso completo</strong> si solicitas la cancelación:
              </p>
              <ul className="list-disc space-y-2 pl-5">
                <li>antes de que inicien tus clases, o</li>
                <li>
                  dentro de los primeros <strong>3 días naturales</strong> (calendario)
                  posteriores al inicio de tu cohorte. En los planes que{" "}
                  <strong>empiezan el mismo día del pago</strong> y no van por cohorte,
                  esos 3 días se cuentan desde la <strong>fecha de pago</strong>.
                </li>
              </ul>
              <p>
                Se considera <strong>primera inscripción</strong> el primer pago realizado en tu
                historial con LZ English Academy. Las reinscripciones posteriores no califican
                para esta garantía (ver punto 3).
              </p>
              <p>
                Si dentro del periodo de garantía ya recibiste{" "}
                <strong>sesiones individuales (1:1), clases en vivo o sesiones de práctica</strong>{" "}
                incluidas en tu plan (por ejemplo, en Premium o Speaking Sessions), podremos{" "}
                <strong>descontar el valor de las sesiones ya tomadas</strong> del monto a
                reembolsar.
              </p>
            </Section>

            <Section title="2. Después de los 3 días">
              <p>
                Una vez transcurridos los primeros 3 días desde el inicio de clases,{" "}
                <strong>no se otorgan reembolsos</strong> del periodo en curso. Puedes cancelar
                la renovación para no ser cobrado en el siguiente periodo, conservando el acceso
                hasta el final del periodo ya pagado:
              </p>
              {/* ⚠️ Dos caminos: `/mi-suscripcion` no encuentra a quien compró en la
                  plataforma (ver `URL_SUSCRIPCION_PLATAFORMA`). */}
              <ul className="list-disc space-y-2 pl-5">
                <li>
                  si contrataste desde la plataforma de aprendizaje, en{" "}
                  <a
                    href={URL_SUSCRIPCION_PLATAFORMA}
                    className="font-semibold text-falu-red-700 hover:text-falu-red-800"
                  >
                    Configuración › Suscripción
                  </a>{" "}
                  (&laquo;Gestionar suscripción y pago&raquo;);
                </li>
                <li>
                  si te inscribiste en este sitio web, desde tu{" "}
                  <Link
                    href="/mi-suscripcion"
                    className="font-semibold text-falu-red-700 hover:text-falu-red-800"
                  >
                    portal de suscripción
                  </Link>
                  ;
                </li>
                <li>
                  o escribiéndonos a{" "}
                  <a
                    href="mailto:info@lz-englishacademy.com"
                    className="font-semibold text-falu-red-700 hover:text-falu-red-800"
                  >
                    info@lz-englishacademy.com
                  </a>
                  .
                </li>
              </ul>
            </Section>

            <Section title="3. Renovaciones">
              <p>
                La garantía de reembolso aplica <strong>únicamente a la primera
                inscripción</strong>. Los periodos de <strong>renovación no son
                reembolsables</strong>; solo es posible cancelar la renovación futura.
              </p>
            </Section>

            <Section title="4. Planes de pago único">
              <p>
                Personalizado y Speaking Sessions se rigen por la misma garantía para compras
                nuevas: puedes solicitar reembolso completo <strong>antes de la fecha del
                servicio agendado</strong> o dentro de los <strong>3 días naturales</strong>{" "}
                posteriores a dicha fecha; pasado ese plazo no son reembolsables. Si la sesión ya
                fue impartida, aplica el descuento por sesiones consumidas indicado en el punto 1.
              </p>
            </Section>

            <Section title="5. Cómo solicitar un reembolso">
              <p>
                Envía tu solicitud a{" "}
                <a
                  href="mailto:info@lz-englishacademy.com"
                  className="font-semibold text-falu-red-700 hover:text-falu-red-800"
                >
                  info@lz-englishacademy.com
                </a>{" "}
                indicando el correo de tu inscripción. Los reembolsos aprobados se procesan al
                método de pago original a través de Stripe y suelen tardar{" "}
                <strong>entre 5 y 10 días hábiles</strong> en reflejarse, según tu banco.
              </p>
              <p>
                <strong>
                  Antes de iniciar una disputa o contracargo con tu banco, contáctanos.
                </strong>{" "}
                Resolvemos la gran mayoría de las solicitudes directamente y de forma más rápida.
              </p>
            </Section>

            <Section title="6. Efecto del reembolso">
              <p>
                Al otorgarse un reembolso, <strong>se cancela también tu suscripción</strong> y
                se retira el acceso de tu plan, incluyendo la salida de la comunidad de WhatsApp.
                Tu cuenta de la plataforma de aprendizaje <strong>pasa al plan gratis</strong>:
                conservas tu avance y lo que escribiste, pero los días nuevos llegan sin
                material, como se explica en los{" "}
                <Link
                  href="/legal/plataforma/terminos"
                  className="font-semibold text-falu-red-700 hover:text-falu-red-800"
                >
                  Términos de Uso de la Plataforma
                </Link>
                .
              </p>
            </Section>

            <Section title="7. Excepciones">
              <p>
                No se otorgan reembolsos en casos de uso indebido del Servicio, incumplimiento de
                nuestros Términos y Condiciones, o conducta que vulnere las normas de convivencia
                de la comunidad.
              </p>
              <p>
                Tampoco hay devolución, ni total ni parcial, cuando{" "}
                <strong>la instructora decide dejar de darte clases por un comportamiento
                inadecuado</strong>: ni de las clases que no llegaste a recibir ni del resto
                del periodo pagado. Ver las{" "}
                <Link
                  href="/legal/plataforma/normas-de-comunidad"
                  className="font-semibold text-falu-red-700 hover:text-falu-red-800"
                >
                  Normas de la Comunidad y de Comportamiento
                </Link>
                .
              </p>
            </Section>

            <Section title="8. Contacto">
              <p>Para cualquier consulta sobre esta Política, escríbenos a:</p>
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
          </article>
        </Container>
      </section>
    </main>
  );
}
