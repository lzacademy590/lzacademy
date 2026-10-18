"use client";

// Aviso flotante de "guardado" / "no se pudo guardar". Lo monta el layout del panel
// una sola vez; cualquier pantalla lo usa con `const toast = useToast()`.
// Antes había dos toasts propios (Accesos, Descuentos) y el resto avisaba con un
// banner, con un "Guardado ✓" en la cabecera o con nada.

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

type Tipo = "exito" | "error" | "info";
type Mensaje = { id: number; tipo: Tipo; texto: string };

type Api = {
  exito: (texto: string) => void;
  error: (texto: string) => void;
  info: (texto: string) => void;
};

const Contexto = createContext<Api | null>(null);

export function ProveedorDeToast({ children }: { children: React.ReactNode }) {
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const siguiente = useRef(1);

  const quitar = useCallback((id: number) => setMensajes((m) => m.filter((x) => x.id !== id)), []);

  const mostrar = useCallback(
    (tipo: Tipo, texto: string) => {
      const id = siguiente.current++;
      setMensajes((m) => [...m.slice(-2), { id, tipo, texto }]);
      // Un error se queda más: es lo que hay que leer.
      setTimeout(() => quitar(id), tipo === "error" ? 7000 : 3500);
    },
    [quitar],
  );

  const api = useMemo<Api>(() => ({
    exito: (t) => mostrar("exito", t),
    error: (t) => mostrar("error", t),
    info: (t) => mostrar("info", t),
  }), [mostrar]);

  return (
    <Contexto.Provider value={api}>
      {children}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 lg:left-auto lg:right-4 lg:translate-x-0 z-[60] flex flex-col gap-2 w-[calc(100%-2rem)] max-w-sm" aria-live="polite">
        {mensajes.map((m) => (
          <div
            key={m.id}
            role={m.tipo === "error" ? "alert" : "status"}
            className={`flex items-start gap-3 rounded-xl shadow-lg border px-4 py-3 text-sm bg-white ${
              m.tipo === "exito" ? "border-emerald-200" : m.tipo === "error" ? "border-red-200" : "border-gray-200"
            }`}
          >
            <span
              className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-white text-[11px] font-bold ${
                m.tipo === "exito" ? "bg-emerald-500" : m.tipo === "error" ? "bg-red-500" : "bg-gray-400"
              }`}
              aria-hidden
            >
              {m.tipo === "exito" ? "✓" : m.tipo === "error" ? "!" : "i"}
            </span>
            <p className="flex-1 text-gray-700">{m.texto}</p>
            <button onClick={() => quitar(m.id)} className="text-gray-300 hover:text-gray-500 cursor-pointer" aria-label="Cerrar aviso">
              ×
            </button>
          </div>
        ))}
      </div>
    </Contexto.Provider>
  );
}

export function useToast(): Api {
  const api = useContext(Contexto);
  if (!api) throw new Error("useToast fuera de ProveedorDeToast");
  return api;
}
