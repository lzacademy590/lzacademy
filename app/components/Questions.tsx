"use client";

import { useState } from "react";
import { Container } from "../components/Container";

const WHATSAPP_URL = "https://chat.whatsapp.com/HhAvLoPoLwf1JsX0aWtnX1";

const preguntasFrecuentes: { pregunta: string; respuesta: React.ReactNode }[] = [
  /*
    Las tres primeras se añadieron el 2026-10-17: son las dudas que frenan el
    pago (¿y si no es para mí?, ¿cuándo empiezo?, ¿y si mi grupo no abre?), y van
    arriba porque esta lista se lee justo debajo de los precios.
    ⚠️ Lo que dicen es la regla de /reembolsos §1 y la de /mi-horario: si
    cambian, cambian aquí.
  */
  {
    pregunta: "¿Y si me inscribo y no es para mí?",
    respuesta: (
      <>
        Si es tu primera inscripción tienes <strong>3 días de garantía</strong>: te devolvemos el pago
        completo si cancelas antes de empezar o en los primeros 3 días desde el inicio de tu grupo (o
        desde el pago, en los planes que empiezan el mismo día). Los detalles están en la{" "}
        <a href="/reembolsos" className="font-semibold text-falu-red-800 hover:text-falu-red-900 underline">
          política de reembolso
        </a>
        .
      </>
    ),
  },
  {
    pregunta: "¿Cuándo empiezo?",
    respuesta:
      "Depende del plan. Los planes con clases en vivo empiezan con tu grupo, en la fecha de inicio que elijas al inscribirte; ese día se abre tu curso. Essential empieza el mismo día que pagas.",
  },
  {
    pregunta: "¿Qué pasa si mi horario de grupo no llega al mínimo de alumnos?",
    respuesta:
      "No pierdes tu pago. Te pasamos al horario con lugar más cercano de tu nivel (o, si no hay, al siguiente inicio) y te avisamos por correo. Si prefieres otro horario de tu nivel o pasar al siguiente inicio, lo cambias desde el enlace del correo hasta 1 hora antes de tu primera clase, sin pagar de nuevo.",
  },
  {
    pregunta: "¿Puedo cancelar en cualquier momento?",
    respuesta:
      "Sí, sin compromisos ni contratos. Puedes cancelar cuando quieras. No hay penalizaciones ni cargos ocultos.",
  },
  {
    pregunta: "¿Cómo cancelo mi suscripción?",
    respuesta: (
      <>
        Es muy sencillo: entra a{" "}
        <a href="/mi-suscripcion" className="font-semibold text-falu-red-800 hover:text-falu-red-900 underline">
          Gestiona tu suscripción
        </a>{" "}
        e ingresa el correo con el que te inscribiste. Te enviaremos un enlace seguro a tu bandeja de
        entrada para gestionar o cancelar tu suscripción en un par de clics. Conservas tu acceso hasta
        el final del periodo que ya pagaste.
      </>
    ),
  },
  {
    pregunta: "¿Qué pasa si no soy constante con la rutina diaria?",
    respuesta:
      "El método está diseñado para que puedas retomarlo sin perder el hilo. Las 5 sesiones son flexibles: puedes hacerlas en distintos momentos del día. Si un día no puedes, simplemente continúas al día siguiente. La comunidad de WhatsApp y las clases de los viernes también te ayudan a mantenerte en ritmo.",
  },
  {
    pregunta: "¿Garantizan resultados en 90 días?",
    respuesta: (
      <>
        El Método 590 está diseñado para llevarte de cero a un nivel B1 conversacional en 90 días si sigues la rutina completa. Los resultados dependen de tu consistencia — quienes completan las 5 sesiones diarias ven progreso real desde las primeras semanas. Si tienes dudas sobre si es para ti, puedes escribirnos a{" "}
        <a href="mailto:info@lz-englishacademy.com" className="font-semibold text-falu-red-800 hover:text-falu-red-900 underline">
          info@lz-englishacademy.com
        </a>
        .
      </>
    ),
  },
  {
    pregunta: "¿Necesito experiencia previa en inglés?",
    respuesta:
      "No. El método empieza desde nivel A1 (principiante absoluto). También tenemos niveles A2, B1 y B2 para quienes ya tienen una base. Al inscribirte seleccionas tu nivel actual y el material se adapta a él.",
  },
  {
    pregunta: "¿Cuál es la diferencia entre Essential y Personalizado?",
    respuesta:
      "Con Essential accedes a la plataforma con todo el material organizado por sesiones, la comunidad de WhatsApp y las clases grupales en vivo los viernes — aprendes a tu propio ritmo. Con Personalizado tienes además clases 1:1 privadas con tu propio profesor, horario flexible y un plan de trabajo adaptado a tu nivel y objetivos desde el día 1.",
  },
  {
    pregunta: "¿Cuánto tiempo al día necesito dedicarle?",
    respuesta:
      "El método tiene 5 sesiones diarias que en total toman entre 2 y 3 horas. Pueden distribuirse durante el día — no tienen que hacerse seguidas. Con Essential tú decides cuándo; con Personalizado defines el horario con tu profesor.",
  },
  {
    pregunta: "¿Qué pasa si no puedo asistir a la clase del viernes?",
    respuesta:
      "No hay problema. Las clases de los viernes son en vivo por Zoom y tienen distintos horarios (mañana, tarde y noche). Si no puedes asistir una semana, el material sigue disponible en la plataforma y puedes retomar en la siguiente sesión.",
  },
  {
    pregunta: "¿Qué incluye la plataforma?",
    respuesta:
      "La plataforma organiza todo el material por sesión y nivel: teoría para la sesión 1, película o series con subtítulos en inglés para la sesión 2, flashcards de vocabulario en Quizlet para la sesión 3, lectura asignada para la sesión 4 y un tema de journaling + speaking challenge para la sesión 5. Todo está listo para que solo tengas que seguir la rutina.",
  },
  {
    pregunta: "¿Las 5 sesiones tienen que hacerse seguidas?",
    respuesta:
      "No. Puedes distribuirlas durante el día según tu horario — unas en la mañana, otras en la tarde y las últimas en la noche. Lo importante es completarlas todas dentro del día, en el orden indicado.",
  },
  {
    pregunta: "¿Cómo sé cuál es mi nivel de inglés?",
    respuesta: (
      <>
        Puedes hacer un test gratuito aquí:{" "}
        <a
          href="https://www.englishradar.com/english-test/"
          target="_blank"
          rel="noreferrer"
          className="font-semibold text-falu-red-800 hover:text-falu-red-900 underline"
        >
          EnglishRadar – English Test
        </a>
        . Si aún tienes dudas, elige el nivel más cercano al tuyo — podemos ajustarlo después de que empieces.
      </>
    ),
  },
];

export default function PreguntasFrecuentes() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (i: number) => setOpenIndex(openIndex === i ? null : i);

  return (
    <section className="py-14 sm:py-20 bg-white" id="faq">
      <Container>

        {/* Encabezado */}
        <div className="text-center mb-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-falu-red-600 mb-2">
            FAQ
          </p>
          <h2 className="text-3xl font-extrabold text-zinc-900 sm:text-4xl">
            Preguntas frecuentes
          </h2>
          <p className="mt-3 text-sm text-zinc-500 max-w-md mx-auto">
            Todo lo que necesitas saber antes de empezar. ¿No encuentras tu respuesta?
            {" "}
            {/* Antes iba a "/#faq", o sea a la portada, que no tiene FAQ. */}
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="font-semibold text-falu-red-800 hover:text-falu-red-900">
              Escríbenos por WhatsApp →
            </a>
          </p>
        </div>

        {/* Accordion en dos columnas en desktop */}
        <div className="mx-auto max-w-4xl">
          <div className="grid grid-cols-1 divide-y divide-zinc-100 rounded-2xl border border-zinc-200 bg-white overflow-hidden">
            {preguntasFrecuentes.map((item, i) => {
              const isOpen = openIndex === i;
              const isLast = i === preguntasFrecuentes.length - 1;

              return (
                <div key={i} className={`group ${isLast ? "" : ""}`}>
                  <button
                    type="button"
                    onClick={() => toggle(i)}
                    className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left hover:bg-zinc-50 transition-colors"
                    aria-expanded={isOpen}
                  >
                    <span className={`text-sm font-semibold transition-colors ${isOpen ? "text-falu-red-800" : "text-zinc-800"}`}>
                      {item.pregunta}
                    </span>

                    {/* Ícono animado */}
                    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors ${isOpen ? "bg-falu-red-700 text-white" : "bg-zinc-100 text-zinc-500 group-hover:bg-zinc-200"}`}>
                      <svg
                        className={`h-3.5 w-3.5 transition-transform duration-200 ${isOpen ? "rotate-45" : ""}`}
                        viewBox="0 0 14 14"
                        fill="none"
                        aria-hidden="true"
                      >
                        <path
                          d="M7 1v12M1 7h12"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                        />
                      </svg>
                    </span>
                  </button>

                  {/* Respuesta con transición */}
                  <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? "max-h-96" : "max-h-0"}`}
                  >
                    <div className="px-6 pb-5 border-t border-zinc-100">
                      <p className="pt-4 text-sm text-zinc-600 leading-relaxed">
                        {item.respuesta}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* CTA inferior */}
          <div className="mt-8 text-center">
            <p className="text-sm text-zinc-500">
              ¿Tienes otra pregunta?{" "}
              <a
                href="mailto:info@lz-englishacademy.com"
                className="font-semibold text-falu-red-800 hover:text-falu-red-900 transition-colors"
              >
                Escríbenos directamente →
              </a>
            </p>
          </div>
        </div>

      </Container>
    </section>
  );
}