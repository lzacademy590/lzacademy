"use client";

import Image from "next/image";
import { useFeaturesDelPlan } from "@/app/hooks/useFeaturesDelPlan";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ContactModal from "@/app/components/ContactModal";
import PlanSwitcher from "@/app/components/PlanSwitcher";
import PrecioDelPlan from "@/app/components/PrecioDelPlan";
import ClasesDelPlan from "@/app/components/ClasesDelPlan";

/*
  ⚠️ Esto ya NO es lo que se pinta: es el RESPALDO. Las viñetas las manda
  Admin › Planes (ver `useFeaturesDelPlan`), igual que en las cards de
  /paso-tres. Escritas aquí, esta página contradecía a la tarjeta que trae
  hasta ella — visto en producción con Fluidez.
*/
const featuresDeRespaldo = [
  // ⚠️ Decía "3 sesiones privadas 1:1 por semana" y el catálogo dice **1** — a un
  // clic de la card, que sí lo deriva. La FRECUENCIA la pinta ahora
  // `ClasesDelPlan` desde Admin › Planes, aquí abajo: escrita a mano vuelve a
  // separarse del producto en cuanto el negocio la cambie.
  "Sesiones privadas 1:1 adaptadas a ti",
  "1 sesión de práctica grupal cada viernes",
  "Acceso completo al Método 590",
  "Horario flexible para tus sesiones privadas",
  "Plan de trabajo personalizado desde el día 1",
  "Corrección y feedback en tiempo real",
  "Seguimiento y motivación constante",
  "Avanza a tu ritmo con guía personalizada",
];

function PersonalizadoPlanContent() {
  // Las viñetas las manda Admin › Planes; el array de arriba es el respaldo.
  const features = useFeaturesDelPlan("Personalizado", featuresDeRespaldo);
  const router = useRouter();
  const searchParams = useSearchParams();
  const nivel = searchParams.get("nivel") ?? "";
  const dificultades = searchParams.get("dificultades") ?? "";
  const [modalOpen, setModalOpen] = useState(false);

  function handleComenzar() {
    router.push(`/paso-cuatro?nivel=${encodeURIComponent(nivel)}&plan=personalizado&dificultades=${encodeURIComponent(dificultades)}`);
  }



  return (
    <>
    <ContactModal open={modalOpen} onClose={() => setModalOpen(false)} />
    <main
      className="relative min-h-[calc(100dvh-68px)]"
      style={{ backgroundColor: "#f06080" }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, #7a0a1a 1px, transparent 0)",
          backgroundSize: "18px 18px",
        }}
      />

      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 relative">
        <div className="grid grid-cols-1 lg:grid-cols-2 items-center gap-0 min-h-[calc(100dvh-68px)]">

          {/* ── Columna izquierda: muñeca-personalizada ── */}
          <div className="flex items-center justify-center order-2 lg:order-1">
            <Image
              src="/muñeca-personalizada.webp"
              alt="Muñeca Personalizada"
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
                style={{ textShadow: "0 2px 12px rgba(120,10,30,0.18)" }}
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
                  <p className="text-2xl lg:text-3xl font-extrabold text-zinc-800 mb-1">Personalizado</p>
                  <PrecioDelPlan
                    clave="Personalizado"
                    centavosDeRespaldo={12000}
                    recurrenteDeRespaldo={false}
                    color="#C0353E"
                    claseNota="text-[11px] lg:text-[12px] font-semibold text-zinc-400 mb-3"
                  />
                  <p className="text-[12px] lg:text-[13px] text-zinc-500 font-medium leading-relaxed">
                    Para quienes quieren avanzar rápido con clases 1:1 adaptadas a su horario y proceso.
                  </p>
                </div>

                <div className="hidden sm:block w-px my-8 shrink-0" style={{ backgroundColor: "#f0c8cc" }} />
                <div className="block sm:hidden h-px mx-8" style={{ backgroundColor: "#f0c8cc" }} />

                <div className="flex flex-col justify-center px-8 py-8 flex-1">
                  <p className="text-[12px] lg:text-[13px] font-bold text-zinc-500 mb-1">Todo lo de Premium, más:</p>
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
                  {/* La FRECUENCIA la manda Admin › Planes, igual que en la card
                      de /paso-tres que trae aquí. Si el catálogo no la dice, no se
                      pinta: prometer un número que el producto no cumple es lo que
                      había —decía 3 y son 1—. */}
                  <ClasesDelPlan
                    clave="Personalizado"
                    className="mt-5 text-[11.5px] lg:text-[13px] font-bold not-italic text-zinc-700"
                  />
                  <p className="mt-2 text-[11.5px] lg:text-[13px] leading-relaxed italic" style={{ color: "#C0353E" }}>
                    Agendas tu primera sesión y definimos juntos el plan. Accede hoy a la plataforma. Las clases en vivo inician en la fecha seleccionada en el formulario.
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
              <PlanSwitcher currentPlan="personalizada" nivel={nivel} />
              <button
                type="button"
                onClick={handleComenzar}
                className="inline-flex items-center gap-3 rounded-2xl px-10 py-4 lg:px-12 lg:py-4 text-[15px] lg:text-[17px] font-extrabold text-white shadow-lg transition hover:opacity-90 active:scale-95"
                style={{ backgroundColor: "#bd181e" }}
              >
                Comenzar
                <svg className="w-4 h-4 lg:w-5 lg:h-5 shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 3l5 5-5 5"/></svg>
              </button>
            </div>

          </div>
        </div>
      </div>
    </main>
    </>
  );
}

export default function PersonalizadoPlanPage() {
  return (
    <Suspense fallback={null}>
      <PersonalizadoPlanContent />
    </Suspense>
  );
}