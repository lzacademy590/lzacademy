"use client";

import Image from "next/image";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ContactModal from "@/app/components/ContactModal";
import PlanSwitcher from "@/app/components/PlanSwitcher";
import PrecioDelPlan from "@/app/components/PrecioDelPlan";

const features = [
      "1 Sesión de coaching enfocado en speaking 1:1 semanal",
      "Acceso completo al Método 590",
      "Comunidad en Whatsapp",
      "Diagnóstico de tus bloqueos al hablar",
      "Plan de acción escrito, semana a semana",
      "Feedback y corrección mientras hablás",
      "Reporte de tu progreso de fluidez",
      "Enfoque 100% en romper la barrera de hablar",
];

// Acento propio de Fluidez (tier tope).
const ACCENT = "#8a1f3d";

function FluidezPlanContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nivel = searchParams.get("nivel") ?? "";
  const dificultades = searchParams.get("dificultades") ?? "";
  const [modalOpen, setModalOpen] = useState(false);

  function handleComenzar() {
    router.push(`/paso-cuatro?nivel=${encodeURIComponent(nivel)}&plan=fluidez&dificultades=${encodeURIComponent(dificultades)}`);
  }

  return (
    <>
      <ContactModal open={modalOpen} onClose={() => setModalOpen(false)} />
      <main
        className="relative min-h-[calc(100dvh-68px)]"
        style={{ backgroundColor: "#9c2846" }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, #4a0a16 1px, transparent 0)",
            backgroundSize: "18px 18px",
          }}
        />

        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 items-center gap-0 min-h-[calc(100dvh-68px)]">

            {/* ── Columna izquierda: muñeca ── */}
            <div className="flex items-center justify-center order-2 lg:order-1">
              <Image
                src="/muñeca-fluency.webp"
                alt="Programa de Fluidez"
                width={582}
                height={568}
                className="w-[460px] h-auto lg:w-[560px] [filter:drop-shadow(-40px_30px_50px_rgba(0,0,0,0.45))]"
                sizes="(max-width: 1024px) 460px, 560px"
                priority
              />
            </div>

            {/* ── Columna derecha: contenido del plan ── */}
            <div className="flex flex-col items-center justify-center pt-6 pb-14 lg:pt-8 lg:pb-12 order-1 lg:order-2">

              <div className="text-center mb-6 lg:mb-8 w-full">
                <h1
                  className="text-3xl lg:text-4xl xl:text-5xl font-extrabold tracking-tight text-white"
                  style={{ textShadow: "0 2px 12px rgba(74,10,22,0.18)" }}
                >
                  Tu plan seleccionado
                </h1>
              </div>

              <div
                className="w-full max-w-[680px] lg:max-w-[780px] bg-white rounded-3xl shadow-sm"
                style={{ border: "2px solid rgba(255,255,255,0.7)" }}
              >
                <div className="flex flex-col sm:flex-row gap-0">

                  <div className="flex flex-col justify-center px-6 py-8 sm:w-[220px] lg:w-[250px] shrink-0">
                    <p className="text-2xl lg:text-3xl font-extrabold text-zinc-800 mb-1">Fluidez</p>
                    <PrecioDelPlan
                      clave="Fluidez"
                      centavosDeRespaldo={20000}
                      recurrenteDeRespaldo={false}
                      color={ACCENT}
                      notaExtra="cupos limitados"
                      claseNota="text-[11px] lg:text-[12px] font-semibold text-zinc-400 mb-3"
                    />
                    <p className="text-[12px] lg:text-[13px] text-zinc-500 font-medium leading-relaxed">
                      Para quienes ya entienden inglés (A2+) pero se traban al hablar. Rompé la barrera con coaching de speaking 1:1.
                    </p>
                  </div>

                  <div className="hidden sm:block w-px my-8 shrink-0" style={{ backgroundColor: "#f0c8cc" }} />
                  <div className="block sm:hidden h-px mx-8" style={{ backgroundColor: "#f0c8cc" }} />

                  <div className="flex flex-col justify-center px-8 py-8 flex-1">
                    <p className="text-[12px] lg:text-[13px] font-bold text-zinc-500 mb-1">Todo lo de Premium, más:</p>
                    <p className="text-[11px] lg:text-[13px] font-extrabold uppercase tracking-widest mb-4" style={{ color: ACCENT }}>
                      Incluye:
                    </p>
                    <ul className="flex flex-col gap-3 lg:gap-4">
                      {features.map((feat) => (
                        <li key={feat} className="flex items-center gap-3">
                          <span className="shrink-0 flex items-center justify-center w-5 h-5 lg:w-6 lg:h-6 rounded-full" style={{ border: `2px solid ${ACCENT}` }}>
                            <svg className="w-2.5 h-2.5 lg:w-3 lg:h-3" viewBox="0 0 10 10" fill="none">
                              <polyline points="1.5,5 4,7.5 8.5,2" stroke={ACCENT} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </span>
                          <span className="text-[13px] lg:text-[15px] font-bold text-zinc-700">{feat}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-5 text-[11.5px] lg:text-[13px] leading-relaxed italic" style={{ color: ACCENT }}>
                      Agendas tu diagnóstico y definimos juntos tu plan de acción. Acceso de 28 días desde la fecha de inicio seleccionada en el formulario.
                    </p>
                  </div>

                </div>
              </div>

              <div className="mt-6 lg:mt-8 flex flex-wrap items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={() => setModalOpen(true)}
                  className="inline-flex items-center gap-3 rounded-2xl px-7 py-4 text-[14px] lg:text-[15px] font-extrabold text-zinc-800 bg-white shadow-sm transition hover:shadow-md active:scale-95"
                  style={{ border: "2px solid #fff" }}
                >
                  Más Información
                </button>
                <PlanSwitcher currentPlan="fluidez" nivel={nivel} />
                <button
                  type="button"
                  onClick={handleComenzar}
                  className="inline-flex items-center gap-3 rounded-2xl px-10 py-4 lg:px-12 lg:py-4 text-[15px] lg:text-[17px] font-extrabold text-white shadow-lg transition hover:opacity-90 active:scale-95"
                  style={{ backgroundColor: "#bd181e" }}
                >
                  Comenzar
                  <svg className="w-4 h-4 lg:w-5 lg:h-5 shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 3l5 5-5 5" /></svg>
                </button>
              </div>

            </div>
          </div>
        </div>
      </main>
    </>
  );
}

export default function FluidezPlanPage() {
  return (
    <Suspense fallback={null}>
      <FluidezPlanContent />
    </Suspense>
  );
}
