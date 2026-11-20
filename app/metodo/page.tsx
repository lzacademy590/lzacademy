import type { Metadata } from "next";
import Link from "next/link";
import { URL_DEL_SITIO } from "@/app/lib/sitio";

/*
 * El Método 590 en UNA página. Une lo que antes vivía en cuatro:
 * /metodo, /como-funciona (#semana), /sesiones (#sesiones) y /ciencia (#ciencia).
 * Las URL viejas redirigen a estas anclas: no renombrar los `id`.
 *
 * ⚠️ No se pone una cifra de horas al día en ninguna parte (decisión del
 * negocio): el tiempo lo decide el alumno. Y los días y la frecuencia de cada
 * plan NO se escriben aquí: son dato del catálogo y ya los dicen las cards y
 * las landings de cada plan.
 */

const DESCRIPCION =
  "El Método 590: cinco sesiones diarias en el orden en que aprendiste tu primer idioma, práctica en vivo cada semana y a tu ritmo. Así funciona y por qué funciona.";

export const metadata: Metadata = {
  title: "El Método 590",
  description: DESCRIPCION,
  alternates: { canonical: `${URL_DEL_SITIO}/metodo` },
  openGraph: {
    title: "El Método 590 | Lainz 590",
    description: DESCRIPCION,
    url: `${URL_DEL_SITIO}/metodo`,
    images: [{ url: `${URL_DEL_SITIO}/og-image.png`, width: 1200, height: 630 }],
  },
};

const SESIONES = [
  {
    titulo: "Teoría",
    clave: "Estructura",
    texto:
      "Los patrones del día explicados con claridad. La teoría no es el destino: es el mapa para orientarte en el resto de las sesiones.",
    plataforma: "el material de la sesión 1.",
  },
  {
    titulo: "Escuchar",
    clave: "Input",
    texto:
      "Una película o un podcast con subtítulos en inglés, para conectar el sonido con la forma escrita. No se trata de entenderlo todo, sino de entrenar el oído.",
    plataforma: "la película o el podcast del día.",
  },
  {
    titulo: "Vocabulario",
    clave: "Repetición",
    texto:
      "Palabras nuevas en frases reales, repetidas con intención para que tu cerebro las recuerde con sentido.",
    plataforma: "tu set de vocabulario.",
  },
  {
    titulo: "Lectura",
    clave: "Consolidación",
    texto:
      "Lees en voz alta y sin traducir. Así consolidas lo aprendido y la comprensión se vuelve automática.",
    plataforma: "la lectura del día.",
  },
  {
    titulo: "Práctica",
    clave: "Producción",
    texto:
      "Escribes un diario corto en inglés (lo que llamamos journaling) y haces un reto de speaking. Aquí el idioma se vuelve tuyo.",
    plataforma: "el tema del diario y el reto de speaking por WhatsApp.",
  },
];

const SEMANA = [
  {
    cuando: "Lunes a jueves",
    titulo: "Las 5 sesiones, a la hora que puedas",
    texto:
      "Haces el método en la plataforma según el día asignado. Te da el material de cada sesión, y el reto de speaking te llega por WhatsApp.",
  },
  {
    cuando: "Viernes",
    titulo: "Reunión de práctica en Zoom",
    texto:
      "Primero, 30 minutos de repaso para aclarar dudas. Después practicas en parejas con las estructuras y el vocabulario de la semana: de 3 a 5 minutos con cada compañero, hasta 5 rotaciones.",
  },
  {
    cuando: "Según tu plan",
    titulo: "Clases en vivo o sesiones 1 a 1",
    texto:
      "Según el plan que elijas, sumas clases en vivo en grupo o sesiones privadas 1 a 1 cada semana. Cada plan te dice sus días al elegirlo.",
  },
];

const CIENCIA = [
  {
    titulo: "Ritmo, repetición y consistencia",
    texto:
      "El cerebro no aprende acumulando información sin orden. Cuando aprender se vuelve rutina, el idioma deja de ser esfuerzo y empieza a automatizarse.",
  },
  {
    titulo: "Como tu primer idioma",
    texto:
      "Lo adquiriste escuchando, imitando y hablando, no memorizando reglas. El método sigue ese mismo orden: el idioma se vive antes de analizarse.",
  },
  {
    titulo: "Un mapa para el cerebro adulto",
    texto:
      "Los adultos necesitamos estructura: patrones claros y una dirección. Por eso la teoría va primero y prepara el terreno para todo lo demás.",
  },
];

const EN_ESTA_PAGINA = [
  { href: "#sesiones", label: "Las 5 sesiones" },
  { href: "#semana", label: "Tu semana" },
  { href: "#tiempo", label: "Cuánto tiempo" },
  { href: "#ciencia", label: "Por qué funciona" },
];

export default function MetodoPage() {
  return (
    <main className="bg-white text-lz-ink">
      {/* HERO */}
      <section className="bg-linear-to-b from-white to-lz-lila py-12 sm:py-16">
        <div className="lz-wrap">
          <div className="mx-auto flex max-w-[900px] flex-col gap-5">
            <p className="lz-eyebrow">El Método 590</p>
            <h1 className="lz-display text-[38px] sm:text-[52px] lg:text-[60px]">
              El inglés como una rutina diaria, durante 90 días
            </h1>
            <p className="lz-lead">
              Cinco sesiones cortas cada día, en el orden en que aprendiste tu primer idioma:
              entender, escuchar, repetir, leer y producir. La plataforma te guía en cada una.
            </p>
            <nav aria-label="En esta página" className="flex flex-wrap gap-2">
              {EN_ESTA_PAGINA.map((a) => (
                <a key={a.href} href={a.href} className="lz-pill lz-pill-lila no-underline hover:bg-lz-bd">
                  {a.label}
                </a>
              ))}
            </nav>
          </div>
        </div>
      </section>

      {/* LAS 5 SESIONES */}
      <section id="sesiones" className="scroll-mt-24 py-16 sm:py-22">
        <div className="lz-wrap flex flex-col gap-7">
          <div className="flex flex-col gap-2.5">
            <p className="lz-eyebrow">Las 5 sesiones</p>
            <h2 className="lz-display text-[32px] sm:text-[44px]">Qué haces cada día</h2>
          </div>
          <ol className="m-0 flex list-none flex-col gap-3 p-0">
            {SESIONES.map((s, i) => (
              <li
                key={s.titulo}
                className="lz-card grid grid-cols-1 gap-3 px-5 py-5 sm:px-6 md:grid-cols-[64px_minmax(0,1fr)_260px] md:items-start md:gap-6"
              >
                <span className="font-display text-[36px] leading-none font-extrabold text-lz-grape sm:text-[40px]">
                  0{i + 1}
                </span>
                <div className="flex min-w-0 flex-col gap-1.5">
                  <h3 className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                    <span className="text-[20px] font-bold text-lz-ink">{s.titulo}</span>
                    <span className="text-[13px] font-bold tracking-[0.06em] text-lz-ink3 uppercase">
                      {s.clave}
                    </span>
                  </h3>
                  <p className="lz-p">{s.texto}</p>
                </div>
                <p className="text-[14px] leading-relaxed text-lz-ink2">
                  <b className="text-lz-ink">En la plataforma:</b> {s.plataforma}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* TU SEMANA */}
      <section id="semana" className="scroll-mt-24 bg-lz-lila py-16 sm:py-22">
        <div className="lz-wrap flex flex-col gap-7">
          <div className="flex flex-col gap-2.5">
            <p className="lz-eyebrow">Tu semana</p>
            <h2 className="lz-display text-[32px] sm:text-[44px]">
              Cuatro días de rutina y uno de práctica en vivo
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {SEMANA.map((d) => (
              <article key={d.cuando} className="lz-card flex flex-col gap-2.5 p-6">
                <span className="lz-pill lz-pill-lila self-start">{d.cuando}</span>
                <h3 className="text-[19px] font-bold text-lz-ink">{d.titulo}</h3>
                <p className="lz-p text-[15px]">{d.texto}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* CUÁNTO TIEMPO */}
      <section id="tiempo" className="scroll-mt-24 py-16 sm:py-22">
        <div className="lz-wrap">
          <div className="lz-card flex flex-col gap-6 border-lz-lila2 p-6 sm:p-10 md:flex-row md:items-center md:gap-8">
            <div className="flex flex-none flex-col gap-1">
              <span className="font-display text-[44px] leading-none font-extrabold text-lz-grape sm:text-[60px]">
                A tu ritmo
              </span>
              <span className="text-[15px] font-bold text-lz-ink2">
                tú decides cuánto tiempo al día
              </span>
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-2.5">
              <h2 className="lz-display text-[28px] sm:text-[34px]">Cuánto tiempo necesitas</h2>
              <p className="lz-p">
                El que tengas. Las sesiones no tienen que ser seguidas: puedes hacer una en la
                mañana, otra al almuerzo y las demás en la noche. Si un día no puedes, continúas al
                siguiente sin perder el hilo.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* POR QUÉ FUNCIONA */}
      <section id="ciencia" className="scroll-mt-24 bg-lz-violet py-16 text-white sm:py-22">
        <div className="lz-wrap flex flex-col gap-7">
          <div className="flex flex-col gap-2.5">
            <p className="lz-eyebrow text-lz-fucsia-claro">Por qué funciona</p>
            <h2 className="lz-display text-[32px] text-white sm:text-[44px]">
              Tres ideas detrás del método
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {CIENCIA.map((c) => (
              <article
                key={c.titulo}
                className="flex flex-col gap-2.5 rounded-[20px] border border-white/15 bg-white/[0.07] p-6"
              >
                <h3 className="text-[19px] font-bold text-white">{c.titulo}</h3>
                <p className="lz-p text-[15px] text-lz-sobre-oscuro">{c.texto}</p>
              </article>
            ))}
          </div>
          <p className="lz-lead text-lz-sobre-oscuro">
            El resultado no es solo aprendizaje: es la internalización del idioma.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-18">
        <div className="lz-wrap flex flex-col items-center gap-4 text-center">
          <h2 className="lz-display max-w-[720px] text-[30px] sm:text-[42px]">
            ¿Te imaginas tu día con el método?
          </h2>
          <p className="lz-lead">Cuéntanos tu nivel y lo que te cuesta, y te decimos qué plan te conviene.</p>
          <Link href="/paso-uno" className="lz-btn lz-btn-1 lz-btn-lg">
            Descubre tu plan en 1 minuto
          </Link>
        </div>
      </section>
    </main>
  );
}
