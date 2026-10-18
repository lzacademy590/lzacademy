"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import ProgresoDelEmbudo from "@/app/components/ProgresoDelEmbudo";

const levels = [
  { code: "A1",   name: "Principiante",                    desc: "Solo entiendo y uso frases muy básicas" },
  { code: "A2",   name: "Básico",                          desc: "Puedo comunicarme en situaciones simples" },
  { code: "B1",   name: "Intermedio",                      desc: "Me desenvuelvo en conversaciones cotidianas" },
  { code: "B2",   name: "Intermedio alto",                 desc: "Expreso ideas con claridad y bastante fluidez" },
  { code: "?",    name: "No estoy seguro/a",               desc: "Necesito descubrirlo primero" },
];

export default function PasoUnoPage() {
  const [selected, setSelected] = useState<string | null>(null);
  const [showTestModal, setShowTestModal] = useState(false);
  const router = useRouter();

  function handleContinue() {
    if (!selected) return;
    if (selected === "?") {
      setShowTestModal(true);
      return;
    }
    router.push(`/paso-dos?nivel=${encodeURIComponent(selected)}`);
  }

  function handleContinuarSinTest() {
    setShowTestModal(false);
    router.push(`/paso-dos?nivel=${encodeURIComponent("?")}`);
  }

  return (
    <>
    <main
      className="relative min-h-[calc(100dvh-68px)]"
      style={{ backgroundColor: "#fadadd" }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, #9c181d 1px, transparent 0)",
          backgroundSize: "18px 18px",
        }}
      />

      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 relative">
        <div className="grid grid-cols-1 lg:grid-cols-2 items-center gap-0 min-h-[calc(100dvh-68px)]">

          {/* Columna izquierda: imagen */}
          <div className="flex items-center justify-center order-2 lg:order-1">
            <Image
              src="/muñecapaso1.webp"
              alt="Personaje guía"
              width={582}
              height={568}
              className="w-[560px] h-auto lg:w-full lg:max-w-[880px] [filter:drop-shadow(-40px_30px_50px_rgba(0,0,0,0.45))]"
              sizes="(max-width: 1024px) 560px, 880px"
              priority
            />
          </div>

          {/* Columna derecha: pregunta + opciones */}
          <div className="flex flex-col items-center justify-center py-4 lg:py-0 order-1 lg:order-2">

            <div className="text-center mb-4 lg:mb-8">
              <ProgresoDelEmbudo paso={1} />
              <h1 className="text-2xl lg:text-4xl xl:text-5xl font-extrabold text-zinc-800 tracking-tight">
                ¿Cuál es tu{" "}
                <span style={{ color: "#C0353E" }}>nivel de Inglés</span>?
              </h1>
              <p className="mt-1 lg:mt-3 text-[13px] lg:text-[17px] text-zinc-500 font-medium">
                Selecciona el nivel con el que más te identificas
              </p>
            </div>

            <ul className="w-full max-w-[620px] flex flex-col gap-2.5 lg:gap-4">
              {levels.map((lvl) => {
                const isSelected = selected === lvl.code;
                return (
                  <li key={lvl.code}>
                    <button
                      type="button"
                      onClick={() => setSelected(lvl.code)}
                      className={[
                        "w-full flex items-center gap-3 lg:gap-5 rounded-2xl px-4 py-3.5 lg:px-6 lg:py-5 text-left transition-all duration-150 bg-white shadow-sm ring-1",
                        isSelected
                          ? "ring-[#C0353E] shadow-md"
                          : "ring-zinc-200 hover:ring-[#e8adb0] hover:shadow-md",
                      ].join(" ")}
                    >
                      <span className={[
                        "shrink-0 inline-flex items-center justify-center w-11 h-11 lg:w-14 lg:h-14 rounded-xl text-[12px] lg:text-[14px] font-extrabold transition-colors",
                        isSelected ? "bg-[#C0353E] text-white" : "bg-[#fadadd] text-[#C0353E]",
                      ].join(" ")}>
                        {lvl.code}
                      </span>

                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] lg:text-[18px] font-extrabold text-zinc-800 leading-tight">{lvl.name}</p>
                        <p className="text-[12px] lg:text-[14px] text-zinc-400 mt-0.5 font-medium">{lvl.desc}</p>
                      </div>

                      <span className={["shrink-0 text-lg lg:text-2xl font-bold transition-colors", isSelected ? "text-[#C0353E]" : "text-zinc-300"].join(" ")}>
                        ›
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>

            <div className={[
              "mt-4 lg:mt-8 transition-all duration-300",
              selected ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3 pointer-events-none",
            ].join(" ")}>
              <button
                type="button"
                onClick={handleContinue}
                className="inline-flex items-center gap-3 rounded-2xl px-8 py-3 lg:px-12 lg:py-4 text-[15px] lg:text-[17px] font-extrabold text-white shadow-lg transition hover:opacity-90 active:scale-95"
                style={{ backgroundColor: "#bd181e" }}
              >
                Continuar
                <span className="text-xl lg:text-2xl leading-none">›</span>
              </button>
            </div>

          </div>
        </div>
      </div>
    </main>
    {/* Modal: recomendar test de nivel */}
    {showTestModal && (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
        onClick={() => setShowTestModal(false)}
      >
        <div
          className="bg-white rounded-3xl shadow-2xl w-full max-w-[380px] px-8 py-8 text-center"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Ícono */}
          <div className="flex items-center justify-center w-14 h-14 rounded-full mx-auto mb-4" style={{ backgroundColor: "#fadadd" }}>
            <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="#C0353E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4M12 16h.01" />
            </svg>
          </div>

          <h2 className="text-xl font-extrabold mb-2" style={{ color: "#C0353E" }}>
            ¡Te recomendamos el test!
          </h2>
          <p className="text-sm text-zinc-500 font-medium leading-relaxed mb-7">
            Para asignarte el plan ideal, es importante conocer tu nivel aproximado. Te recomendamos hacer este test rápido antes de continuar.
          </p>

          <a
            href="https://www.englishradar.com/english-test/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full rounded-2xl px-6 py-4 text-white font-extrabold text-[15px] mb-3 transition hover:opacity-90 active:scale-95"
            style={{ backgroundColor: "#bd181e" }}
          >
            Hacer el test ahora
            <span className="text-lg">›</span>
          </a>

          <button
            type="button"
            onClick={handleContinuarSinTest}
            className="w-full rounded-2xl px-6 py-3 text-[14px] font-semibold text-zinc-500 transition hover:text-zinc-700"
          >
            Continuar sin hacer el test
          </button>
        </div>
      </div>
    )}
    </>
  );
}