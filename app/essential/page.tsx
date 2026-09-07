"use client";

import Image from "next/image";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ContactModal from "@/app/components/ContactModal";
import PlanSwitcher from "@/app/components/PlanSwitcher";
import PrecioDelPlan from "@/app/components/PrecioDelPlan";
const features = [
  "Acceso completo al Método 590",
  "Acceso completo a la plataforma",
  "Comunidad en WhatsApp",
  "Material organizado por sesiones y nivel",
  "Método paso a paso",
  "Reuniones de práctica los viernes",
];

function EssentialPlanContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nivel = searchParams.get("nivel") ?? "";
  const dificultades = searchParams.get("dificultades") ?? "";
  const [modalOpen, setModalOpen] = useState(false);

  function handleComenzar() {
    router.push(`/paso-cuatro?nivel=${encodeURIComponent(nivel)}&plan=essential&dificultades=${encodeURIComponent(dificultades)}`);
  }

  return (
    <>
      <ContactModal open={modalOpen} onClose={() => setModalOpen(false)} />
      <main
        className="relative min-h-[calc(100dvh-68px)]"
        style={{ backgroundColor: "#fadadd" }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, #9c181d 1px, transparent 0)",
            backgroundSize: "18px 18px",
          }}
        />

        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 items-center gap-0 min-h-[calc(100dvh-68px)]">

            {/* ── Columna izquierda: muñeca-essential ── */}
            <div className="flex items-center justify-center order-2 lg:order-1">
              <Image
                src="/muñeca-essential.webp"
                alt="Muñeca Essential"
                width={582}
                height={568}
                className="w-[380px] h-auto lg:w-[460px] [filter:drop-shadow(-40px_30px_50px_rgba(0,0,0,0.45))]"
                sizes="(max-width: 1024px) 380px, 460px"
                priority
              />
            </div>

            {/* ── Columna derecha: contenido del plan ── */}
            <div className="flex flex-col items-center justify-center py-6 lg:py-0 order-1 lg:order-2">

              <div className="text-center mb-6 lg:mb-8 w-full">
                <h1
                  className="text-3xl lg:text-4xl xl:text-5xl font-extrabold tracking-tight"
                  style={{ color: "#C0353E" }}
                >
                  Tu plan seleccionado
                </h1>
              </div>

              <div
                className="w-full max-w-[680px] lg:max-w-[780px] bg-white rounded-3xl shadow-sm"
                style={{ border: "2px solid #e8adb0" }}
              >
                <div className="flex flex-col sm:flex-row gap-0">

                  <div className="flex flex-col justify-center px-6 py-8 sm:w-[200px] lg:w-[210px] shrink-0">
                    <p className="text-2xl lg:text-3xl font-extrabold text-zinc-800 mb-1">Essential</p>
                    <PrecioDelPlan
                      clave="Essential"
                      centavosDeRespaldo={1000}
                      recurrenteDeRespaldo={true}
                      color="#C0353E"
                      claseNota="text-[11px] lg:text-[12px] text-zinc-400 font-medium mb-2"
                    />
                    <p className="text-[12px] lg:text-[13px] text-zinc-500 font-medium leading-relaxed">
                      Para quienes quieren aprender con estructura clara y a su propio ritmo.
                    </p>
                  </div>

                  <div className="hidden sm:block w-px my-8 shrink-0" style={{ backgroundColor: "#f0c8cc" }} />
                  <div className="block sm:hidden h-px mx-8" style={{ backgroundColor: "#f0c8cc" }} />

                  <div className="flex flex-col justify-center px-8 py-8 flex-1">
                    <p className="text-[11px] lg:text-[13px] font-extrabold uppercase tracking-widest mb-4" style={{ color: "#C0353E" }}>
                      Incluye:
                    </p>
                    <ul className="flex flex-col gap-3 lg:gap-4">
                      {features.map((feat) => (
                        <li key={feat} className="flex items-center gap-3">
                          <span className="shrink-0 flex items-center justify-center w-5 h-5 lg:w-6 lg:h-6 rounded-full" style={{ border: "2px solid #C0353E" }}>
                            <svg className="w-2.5 h-2.5 lg:w-3 lg:h-3" viewBox="0 0 10 10" fill="none">
                              <polyline points="1.5,5 4,7.5 8.5,2" stroke="#C0353E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </span>
                          <span className="text-[13px] lg:text-[15px] font-bold text-zinc-700">{feat}</span>
                        </li>
                      ))}
                    </ul>
                    {/* Essential no va por cohorte (2026-08-28) y NO tiene clases en
                        vivo — ver `requiresCohort: false` y el comentario del plan en
                        lzacademy-backend/src/config/plans.js.

                        Esta frase decía "las clases en vivo inician en la fecha
                        seleccionada en el formulario", y era falsa por partida doble:
                        ese campo ya no se le muestra a un Essential, y las clases en
                        vivo son de Premium. Es la pantalla inmediatamente anterior al
                        checkout del plan que más se vende.

                        En premium/page.tsx y personalizado/page.tsx la frase se
                        conserva porque ahí SÍ es cierta: esos planes tienen las dos
                        cosas. */}
                    <p className="mt-5 text-[11.5px] lg:text-[13px] leading-relaxed italic" style={{ color: "#C0353E" }}>
                      Accede hoy a la plataforma: empiezas el mismo día que pagas, sin esperar a ninguna fecha de inicio.
                    </p>
                  </div>

                </div>
              </div>

              <div className="mt-6 lg:mt-8 flex flex-wrap items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={() => setModalOpen(true)}
                  className="inline-flex items-center gap-3 rounded-2xl px-7 py-4 text-[14px] lg:text-[15px] font-extrabold text-zinc-800 bg-white shadow-sm transition hover:shadow-md active:scale-95"
                  style={{ border: "2px solid #222" }}
                >
                  Más Información
                </button>
                <PlanSwitcher currentPlan="essential" nivel={nivel} />
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

export default function EssentialPlanPage() {
  return (
    <Suspense fallback={null}>
      <EssentialPlanContent />
    </Suspense>
  );
}