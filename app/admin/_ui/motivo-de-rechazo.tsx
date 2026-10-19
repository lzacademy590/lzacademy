// Por qué falló el cobro de una renovación, como lo cuenta el backend
// (`pago-fallido.service.js`, 2026-10-18). Lo usan la tarjeta "Pagos fallidos"
// del Inicio y No renovados.

import { fmtDatePT } from "../_utils/format";

export type MotivoDeRechazo = { responsable: "alumno" | "banco" | "sitio"; texto: string } | null;

export type DetalleDeFallo = {
  motivo: MotivoDeRechazo;
  intentos: number | null;
  proximo_intento: string | null;
  /** Sin dato registrado: el fallo es anterior al 2026-10-18. */
  sin_registro?: boolean;
};

// Quién tiene que mover ficha, en palabras del admin.
const QUIEN: Record<NonNullable<MotivoDeRechazo>["responsable"], { etiqueta: string; clase: string }> = {
  alumno: { etiqueta: "Del alumno", clase: "bg-amber-50 text-amber-700" },
  banco: { etiqueta: "De su banco", clase: "bg-blue-50 text-blue-700" },
  sitio: { etiqueta: "Nuestro", clase: "bg-red-50 text-red-700" },
};

/** "Fondos insuficientes · Del alumno · intento 2 · reintenta el 21 oct". */
export function MotivoDelRechazo({ d, sigueReintentando }: { d: DetalleDeFallo; sigueReintentando?: boolean }) {
  const quien = d.motivo ? QUIEN[d.motivo.responsable] : null;
  return (
    <span className="inline-flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs">
      {d.motivo ? (
        <>
          <span className="text-gray-700">{d.motivo.texto}</span>
          {quien && <span className={`px-1.5 py-0.5 rounded-md font-medium ${quien.clase}`}>{quien.etiqueta}</span>}
        </>
      ) : (
        <span className="text-gray-400">{d.sin_registro ? "Motivo sin registrar (fallo anterior al 18 oct)" : "Motivo desconocido"}</span>
      )}
      {d.intentos ? <span className="text-gray-400">· intento {d.intentos}</span> : null}
      {d.proximo_intento ? (
        <span className="text-gray-400">· reintenta el {fmtDatePT(d.proximo_intento)}</span>
      ) : sigueReintentando === false ? (
        <span className="text-gray-400">· Stripe ya no reintenta</span>
      ) : null}
    </span>
  );
}
