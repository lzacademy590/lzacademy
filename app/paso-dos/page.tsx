"use client";

import Image from "next/image";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ProgresoDelEmbudo from "@/app/components/ProgresoDelEmbudo";

function IconMic() {
  return (
    <svg className="w-5 h-5 lg:w-6 lg:h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z"/>
      <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
      <line x1="12" y1="19" x2="12" y2="22"/>
      <line x1="8" y1="22" x2="16" y2="22"/>
    </svg>
  );
}

function IconBook() {
  return (
    <svg className="w-5 h-5 lg:w-6 lg:h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
    </svg>
  );
}

function IconHeadphones() {
  return (
    <svg className="w-5 h-5 lg:w-6 lg:h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 18v-6a9 9 0 0 1 18 0v6"/>
      <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z"/>
      <path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/>
    </svg>
  );
}

function IconMessageCircle() {
  return (
    <svg className="w-5 h-5 lg:w-6 lg:h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  );
}

const options = [
  { id: "hablarlo",  label: "Hablarlo",              icon: <IconMic /> },
  { id: "gramatica", label: "Gramática",              icon: <IconBook /> },
  { id: "escuchar",  label: "Entender al escucharlo", icon: <IconHeadphones /> },
  { id: "confianza", label: "Confianza al hablar",    icon: <IconMessageCircle /> },
];

function PasosDosContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nivel = searchParams.get("nivel") ?? "";

  const [selected, setSelected] = useState<string[]>([]);

  function toggle(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function handleContinuar() {
    if (!selected.length) return;
    router.push(
      `/paso-tres?nivel=${encodeURIComponent(nivel)}&dificultades=${encodeURIComponent(selected.join(","))}`
    );
  }

  function handleVolver() {
    router.back();
  }

  return (
    <main
      className="relative min-h-[calc(100dvh-68px)] overflow-hidden"
      style={{ backgroundColor: "#fadadd" }}
    >
      {/* Textura de puntos */}
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

          {/* ── Columna izquierda: muñecapaso2 ── */}
          <div className="flex items-center justify-center order-2 lg:order-1">
            <Image
              src="/muñecapaso2.webp"
              alt="Personaje guía paso 2"
              width={582}
              height={568}
              className="w-[380px] h-auto -translate-x-8 lg:translate-x-0 lg:w-full lg:max-w-[580px] [filter:drop-shadow(-40px_30px_50px_rgba(0,0,0,0.45))]"
              sizes="(max-width: 1024px) 380px, 580px"
              priority
            />
          </div>

          {/* ── Columna derecha: pregunta + opciones ── */}
          <div className="flex flex-col items-center justify-center pt-4 pb-14 lg:pt-8 lg:pb-12 order-1 lg:order-2">

            {/* Título */}
            <div className="text-center mb-4 lg:mb-8">
              <ProgresoDelEmbudo paso={2} />
              <h1 className="text-2xl lg:text-4xl xl:text-5xl font-extrabold text-zinc-800 tracking-tight">
                ¿Qué se te{" "}
                <span style={{ color: "#C0353E" }}>dificulta</span>{" "}
                más?
              </h1>
              <p className="mt-1 lg:mt-3 text-[13px] lg:text-[17px] text-zinc-500 font-medium">
                Puedes seleccionar más de una opción
              </p>
            </div>

            {/* Opciones multi-select */}
            <ul className="w-full max-w-[620px] flex flex-col gap-2.5 lg:gap-4">
              {options.map((opt) => {
                const isSelected = selected.includes(opt.id);
                return (
                  <li key={opt.id}>
                    <button
                      type="button"
                      onClick={() => toggle(opt.id)}
                      className={[
                        "w-full flex items-center gap-3 lg:gap-5 rounded-2xl px-4 py-3.5 lg:px-6 lg:py-5 text-left transition-all duration-150 bg-white shadow-sm ring-1",
                        isSelected
                          ? "ring-[#C0353E] shadow-md"
                          : "ring-zinc-200 hover:ring-[#e8adb0] hover:shadow-md",
                      ].join(" ")}
                    >
                      <span className="shrink-0 flex items-center justify-center w-9 h-9 lg:w-12 lg:h-12 rounded-xl" style={{ backgroundColor: "#fadadd", color: "#C0353E" }}>
                        {opt.icon}
                      </span>

                      {/* Label */}
                      <span className="flex-1 text-[14px] lg:text-[18px] font-extrabold text-zinc-800">
                        {opt.label}
                      </span>

                      {/* Checkbox */}
                      <span
                        className={[
                          "shrink-0 w-5 h-5 lg:w-6 lg:h-6 rounded lg:rounded-md flex items-center justify-center transition-colors",
                          isSelected
                            ? "bg-[#C0353E]"
                            : "border-2 border-zinc-300 bg-white",
                        ].join(" ")}
                      >
                        {isSelected && (
                          <svg className="w-3 h-3 lg:w-3.5 lg:h-3.5" viewBox="0 0 10 10" fill="none">
                            <polyline
                              points="1.5,5 4,7.5 8.5,2"
                              stroke="#fff"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>

            {/* Botones */}
            <div className="mt-4 lg:mt-8 flex items-center gap-4">
              <button
                type="button"
                onClick={handleVolver}
                className="inline-flex items-center gap-2 rounded-2xl px-6 py-3 lg:px-8 lg:py-4 text-[14px] lg:text-[15px] font-bold text-zinc-600 bg-white shadow-sm transition hover:shadow-md active:scale-95"
                style={{ border: "1.5px solid #d4d4d4" }}
              >
                Volver
              </button>

              <button
                type="button"
                onClick={handleContinuar}
                disabled={selected.length === 0}
                className={[
                  "inline-flex items-center gap-3 rounded-2xl px-8 py-3 lg:px-12 lg:py-4 text-[15px] lg:text-[17px] font-extrabold text-white shadow-lg transition active:scale-95",
                  selected.length > 0
                    ? "hover:opacity-90"
                    : "opacity-40 cursor-not-allowed",
                ].join(" ")}
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
  );
}

export default function PasosDosPage() {
  return (
    <Suspense fallback={null}>
      <PasosDosContent />
    </Suspense>
  );
}