"use client";

// Diálogo de confirmación del panel, en lugar de `window.confirm`:
//
//   const confirmar = useConfirmar();
//   if (!(await confirmar({ titulo: "¿Cancelar a Ana?", confirmar: "Sí, cancelar", peligro: true }))) return;
//
// Lo monta el layout una vez. Esc y clic fuera cuentan como "no".

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { Boton } from "./boton";

type Opciones = {
  titulo: string;
  mensaje?: React.ReactNode;
  confirmar?: string;
  cancelar?: string;
  peligro?: boolean;
};

type Pendiente = Opciones & { resolver: (si: boolean) => void };

const Contexto = createContext<((o: Opciones) => Promise<boolean>) | null>(null);

export function ProveedorDeConfirmacion({ children }: { children: React.ReactNode }) {
  const [pendiente, setPendiente] = useState<Pendiente | null>(null);
  const botonSi = useRef<HTMLButtonElement>(null);

  const confirmar = useCallback(
    (o: Opciones) => new Promise<boolean>((resolver) => setPendiente({ ...o, resolver })),
    [],
  );

  const cerrar = useCallback(
    (si: boolean) => {
      pendiente?.resolver(si);
      setPendiente(null);
    },
    [pendiente],
  );

  useEffect(() => {
    if (!pendiente) return;
    botonSi.current?.focus();
    const tecla = (e: KeyboardEvent) => { if (e.key === "Escape") cerrar(false); };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [pendiente, cerrar]);

  return (
    <Contexto.Provider value={confirmar}>
      {children}
      {pendiente && (
        <div className="fixed inset-0 z-[70] bg-black/40 flex items-center justify-center p-4" onClick={() => cerrar(false)}>
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirmar-titulo"
            className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="confirmar-titulo" className="text-base font-semibold text-gray-800">{pendiente.titulo}</h2>
            {pendiente.mensaje && <div className="text-sm text-gray-500 mt-2 leading-relaxed">{pendiente.mensaje}</div>}
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-6">
              <Boton variante="secundario" onClick={() => cerrar(false)}>{pendiente.cancelar ?? "Cancelar"}</Boton>
              <Boton ref={botonSi} variante={pendiente.peligro ? "peligro" : "primario"} onClick={() => cerrar(true)}>
                {pendiente.confirmar ?? "Confirmar"}
              </Boton>
            </div>
          </div>
        </div>
      )}
    </Contexto.Provider>
  );
}

export function useConfirmar() {
  const c = useContext(Contexto);
  if (!c) throw new Error("useConfirmar fuera de ProveedorDeConfirmacion");
  return c;
}
