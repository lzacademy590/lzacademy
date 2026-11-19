"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import VideoIntro from "../components/inicio/VideoIntro";
import PlanesDelInicio from "../components/inicio/PlanesDelInicio";
import TestimoniosDelInicio from "../components/inicio/TestimoniosDelInicio";
import { usePlanesDelCatalogo, precioEtiqueta } from "../hooks/usePlanesDelCatalogo";
import { useStartDates } from "../hooks/useStartDates";
import { fechaLarga } from "../lib/horario-local";
import { medirCtaInicio } from "../lib/analitica";

/*
  El inicio del «sitio simple» (rediseño 2026-11-18, propuesta A).

  ⚠️ Toda la información para decidir está AQUÍ, en una página: qué es, cómo es
  tu semana, los planes con su precio, testimonios, quién está detrás y las
  dudas. Método y Nosotros son lectura opcional («leer más»), nunca un paso
  obligado hacia la compra.

  ⚠️ **Un solo botón principal con una sola etiqueta** (HU-LZ-EMB, criterio 3):
  «Descubre tu plan en 1 minuto» → /paso-uno, arriba y al final. Lo demás son
  enlaces de texto.
*/

const CALENDLY_INFO_URL =
  process.env.NEXT_PUBLIC_CALENDLY_INFO_URL || "https://calendly.com/lzacademy590/info-session-introduction";

/** Las claves que vende el embudo (el "Speaking" del legacy tiene su propio embudo). */
const CLAVES_DEL_EMBUDO = ["Essential", "Premium", "Personalizado", "Fluidez"];

/**
 * "Desde $10 USD cada 28 días": el plan MÁS BARATO del catálogo, con Essential de
 * respaldo mientras carga. Escrito a mano se quedaría mintiendo el primer día que
 * el admin cambie el precio.
 */
function PrecioDeEntrada() {
  const catalogo = usePlanesDelCatalogo();
  const precios = (catalogo ?? [])
    .filter((p) => CLAVES_DEL_EMBUDO.includes(p.key) || p.origenPlataforma)
    .map((p) => p.priceCents)
    .filter((c) => c > 0);
  const desde = precios.length ? Math.min(...precios) : 1000;
  return (
    <a href="#planes" className="text-[15px] text-lz-ink2 no-underline">
      Desde <b className="tabular-nums text-lz-ink">{precioEtiqueta(desde)} USD</b> cada 28 días ·{" "}
      <span className="font-bold text-lz-grape underline">ver planes y precios</span>
    </a>
  );
}

/**
 * "Próximo grupo: 30 de noviembre". Solo si hay una fecha publicada por empezar:
 * sin dato no se pinta nada (HU-LZ-EMB, criterio 4).
 */
function ProximoGrupo() {
  const { dates, loading } = useStartDates();
  if (loading) return null;
  const hoy = new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Los_Angeles" }).format(new Date());
  const proxima = dates.find((d) => d.value >= hoy);
  if (!proxima) return null;
  return <span className="lz-pill lz-pill-lila self-start">Próximo grupo: {fechaLarga(proxima.value)}</span>;
}

const SESIONES = [
  ["Teoría", "Los patrones del día."],
  ["Escuchar", "Una película o un podcast."],
  ["Vocabulario", "Palabras en contexto."],
  ["Lectura", "En voz alta."],
  ["Práctica", "Un diario corto y un reto de speaking."],
];

const PREGUNTAS: { q: string; a: React.ReactNode }[] = [
  {
    q: "¿Y si me inscribo y no es para mí?",
    a: (
      <>
        Si es tu primera inscripción tienes 3 días de garantía: te devolvemos el pago completo. Los detalles están en la{" "}
        <Link href="/reembolsos" className="font-bold text-lz-grape underline">política de reembolso</Link>.
      </>
    ),
  },
  {
    q: "¿Cuándo empiezo?",
    a: "Los planes con clases en vivo empiezan con tu grupo, en la fecha que elijas al inscribirte. Essential empieza el mismo día que pagas.",
  },
  {
    q: "¿Necesito saber inglés?",
    a: "No. Empezamos desde A1 y también hay A2, B1 y B2. Si no sabes tu nivel, lo averiguamos en el primer paso con un test de 5 preguntas.",
  },
  {
    q: "¿Qué pasa si mi grupo no llega al mínimo de alumnos?",
    a: "No pierdes tu pago: te pasamos al horario con lugar más cercano de tu nivel y te avisamos por correo.",
  },
  {
    q: "¿Puedo cancelar cuando quiera?",
    a: (
      <>
        Sí, sin contratos ni penalizaciones. Entra a{" "}
        <Link href="/mi-suscripcion" className="font-bold text-lz-grape underline">Gestionar suscripción</Link>, escribe
        el correo con el que te inscribiste y te enviamos un enlace para cancelar. Conservas tu acceso hasta el final del
        periodo que ya pagaste.
      </>
    ),
  },
  {
    q: "Ya soy alumno, ¿dónde renuevo o veo mi horario?",
    a: (
      <>
        Para renovar, entra a{" "}
        <Link href="/pago-estudiantes" className="font-bold text-lz-grape underline">Renovar mi plan</Link>. Tu horario y
        el enlace para cambiarlo te llegan por correo al inscribirte; si no lo encuentras, escríbenos por WhatsApp.
      </>
    ),
  },
];

function Preguntas() {
  const [abierta, setAbierta] = useState<number>(0);
  return (
    <div className="flex flex-col gap-2.5">
      {PREGUNTAS.map((p, i) => {
        const on = abierta === i;
        return (
          <div key={p.q} className="lz-card rounded-2xl">
            <button
              type="button"
              onClick={() => setAbierta(on ? -1 : i)}
              aria-expanded={on}
              className="flex min-h-[62px] w-full items-center justify-between gap-4 px-5 text-left text-[17px] font-bold text-lz-ink"
            >
              {p.q}
              <span aria-hidden="true" className="text-[22px] text-lz-grape">{on ? "−" : "+"}</span>
            </button>
            {on && <p className="lz-p px-5 pb-5">{p.a}</p>}
          </div>
        );
      })}
    </div>
  );
}

function BotonPrincipal({ ubicacion, acento = false }: { ubicacion: string; acento?: boolean }) {
  return (
    <Link
      href="/paso-uno"
      onClick={() => medirCtaInicio(ubicacion)}
      className={`lz-btn lz-btn-lg ${acento ? "lz-btn-acento" : "lz-btn-1"}`}
    >
      Descubre tu plan en 1 minuto
    </Link>
  );
}

export default function InicioPage() {
  return (
    <>
      {/* ── Hero: qué es + el video de Loren ── */}
      <section className="bg-gradient-to-b from-white to-lz-lila py-12 lg:py-16">
        <div className="lz-wrap flex flex-wrap items-center gap-10 lg:gap-14">
          <div className="flex min-w-0 flex-1 basis-[480px] flex-col gap-5">
            <ProximoGrupo />
            <h1 className="lz-display text-[40px] sm:text-[52px] lg:text-[62px]">
              Lleva tu inglés al siguiente nivel en <span className="text-lz-fucsia">90 días</span>
            </h1>
            <p className="lz-lead max-w-[520px]">
              Una rutina diaria de 5 sesiones, práctica en vivo y una comunidad que te acompaña. Para
              principiantes y para quienes ya tienen base.
            </p>
            <div className="flex flex-col items-start gap-3">
              <BotonPrincipal ubicacion="hero" />
              <PrecioDeEntrada />
            </div>
            <ul className="flex flex-wrap gap-x-5 gap-y-2 text-[14px] font-semibold text-lz-ink2">
              <li>A tu ritmo: tú decides cuánto tiempo al día</li>
              <li>
                <Link href="/reembolsos" className="underline decoration-dotted underline-offset-2">
                  Garantía de 3 días en tu 1.ª inscripción
                </Link>
              </li>
              <li>Pago seguro con Stripe</li>
            </ul>
          </div>
          <VideoIntro />
        </div>
      </section>

      {/* ── Cómo funciona, en un solo bloque ── */}
      <section id="como" className="py-16 lg:py-24">
        <div className="lz-wrap flex flex-col gap-8">
          <div className="flex max-w-[680px] flex-col gap-2.5">
            <p className="lz-eyebrow">Cómo funciona</p>
            <h2 className="lz-display text-[34px] sm:text-[44px]">Tu semana con el Método 590</h2>
            <p className="lz-p">
              Todo lo que necesitas saber antes de elegir. El detalle de cada sesión y la ciencia detrás están en{" "}
              <Link href="/metodo" className="font-bold text-lz-grape underline">Método</Link>.
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
            <article className="lz-card flex min-w-0 flex-[2_1_560px] flex-col gap-3.5 p-6">
              <span className="lz-pill lz-pill-lila self-start">Lunes a jueves · en la plataforma</span>
              <h3 className="text-[20px] font-bold">5 sesiones al día, a la hora que puedas</h3>
              <ol className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
                {SESIONES.map(([t, d], i) => (
                  <li key={t} className="flex flex-col gap-1 rounded-2xl bg-lz-lila p-3.5">
                    <span className="lz-display text-[24px] tabular-nums text-lz-grape">0{i + 1}</span>
                    <b className="text-[15px]">{t}</b>
                    <span className="text-[13px] leading-snug text-lz-ink2">{d}</span>
                  </li>
                ))}
              </ol>
            </article>
            <div className="flex min-w-0 flex-[1_1_300px] flex-col gap-4">
              <article className="lz-card flex flex-col gap-2 p-6">
                <span className="lz-pill lz-pill-lila self-start">Viernes · en vivo</span>
                <h3 className="text-[18px] font-bold">Práctica en Zoom con tu grupo</h3>
                <p className="lz-p text-[14px]">30 minutos de repaso y después hablas en parejas, rotando de compañero.</p>
              </article>
              <article className="lz-card flex flex-col gap-2 p-6">
                <span className="lz-pill lz-pill-lila self-start">A tu ritmo</span>
                <h3 className="text-[18px] font-bold">Tú decides cuánto tiempo al día</h3>
                <p className="lz-p text-[14px]">
                  Haces las sesiones cuando puedas, repartidas como quieras. Si un día no puedes, sigues al siguiente.
                </p>
              </article>
            </div>
          </div>
        </div>
      </section>

      {/* ── Planes y precios ── */}
      <section id="planes" className="scroll-mt-24 bg-lz-lila py-16 lg:py-24">
        <div className="lz-wrap flex flex-col gap-8">
          <div className="flex flex-col gap-2.5">
            <p className="lz-eyebrow">Planes y precios</p>
            <h2 className="lz-display text-[34px] sm:text-[44px]">Todos incluyen el Método 590 completo</h2>
            <p className="lz-p">Cambia cuánto acompañamiento tienes en vivo. Puedes cambiar de plan al renovar.</p>
          </div>
          <PlanesDelInicio />
          <p className="lz-p text-center">
            ¿No sabes cuál?{" "}
            <Link href="/paso-uno" onClick={() => medirCtaInicio("planes")} className="font-bold text-lz-grape underline">
              Responde 2 preguntas y te lo recomendamos
            </Link>
            .
          </p>
        </div>
      </section>

      {/* ── Testimonios ── */}
      <section className="py-16 lg:py-24">
        <div className="lz-wrap flex flex-col gap-8">
          <div className="flex flex-col gap-2.5">
            <p className="lz-eyebrow">Alumnos reales</p>
            <h2 className="lz-display text-[34px] sm:text-[44px]">Resultados que se sienten</h2>
          </div>
          <TestimoniosDelInicio />
        </div>
      </section>

      {/* ── Quién está detrás ── */}
      <section className="bg-lz-lila py-16 lg:py-20">
        <div className="lz-wrap flex flex-wrap items-center gap-8 lg:gap-10">
          <Image
            src="/creadora.jpeg"
            alt="Loren Laínez, creadora del Método 590"
            width={440}
            height={440}
            className="h-[180px] w-[180px] shrink-0 rounded-full object-cover sm:h-[220px] sm:w-[220px]"
            sizes="220px"
          />
          <div className="flex min-w-0 flex-1 basis-[420px] flex-col gap-3.5">
            <p className="lz-eyebrow">Quién está detrás</p>
            <h2 className="lz-display text-[28px] sm:text-[36px]">
              Loren pasó de no saber el verbo “to be” a una entrevista en inglés en 3 meses
            </h2>
            <p className="lz-p">
              Le dijeron que era imposible en menos de 6 meses. Diseñó una rutina de 5 sesiones diarias, pasó la
              entrevista y esa rutina es hoy el Método 590. Una parte de cada inscripción va a la Fundación LZ, que
              ayuda a niños de Honduras a seguir en la escuela.
            </p>
            <Link href="/nosotros" className="lz-btn lz-btn-3 self-start">Leer la historia completa →</Link>
          </div>
        </div>
      </section>

      {/* ── Preguntas frecuentes ── */}
      <section id="preguntas" className="scroll-mt-24 py-16 lg:py-24">
        <div className="lz-wrap flex flex-wrap items-start gap-10">
          <div className="flex min-w-0 flex-1 basis-[280px] flex-col gap-3">
            <p className="lz-eyebrow">Preguntas frecuentes</p>
            <h2 className="lz-display text-[32px] sm:text-[40px]">Lo que más nos preguntan</h2>
          </div>
          <div className="min-w-0 flex-[2_1_520px]">
            <Preguntas />
          </div>
        </div>
      </section>

      {/* ── Cierre ── */}
      <section className="bg-lz-violet py-16 text-white lg:py-20">
        <div className="lz-wrap flex flex-col items-center gap-4 text-center">
          <h2 className="lz-display max-w-[760px] text-[32px] text-white sm:text-[44px]">
            Responde 2 preguntas y te decimos qué plan te conviene
          </h2>
          <BotonPrincipal ubicacion="cierre" acento />
          <a
            href={CALENDLY_INFO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[15px] text-lz-sobre-oscuro underline underline-offset-2 hover:text-white"
          >
            ¿Prefieres hablar con alguien? Reserva una sesión informativa
          </a>
          {/*
            ⚠️ /interes queda como la salida de quien aún no está listo, en vez de
            competir con el botón principal desde el menú (HU-LZ-EMB, criterio 5).
            Pedir solo el correo aquí mismo necesita un endpoint nuevo en el backend.
          */}
          <Link
            href="/interes"
            className="mt-4 border-t border-white/15 pt-6 text-[15px] text-lz-sobre-oscuro underline underline-offset-2 hover:text-white"
          >
            ¿Aún no estás listo? Déjanos tus datos y te enviamos toda la información por correo
          </Link>
        </div>
      </section>
    </>
  );
}
