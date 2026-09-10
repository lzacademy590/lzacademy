"use client";

import {
  usePlanesDelCatalogo,
  precioEtiqueta,
} from "@/app/hooks/usePlanesDelCatalogo";

// ─────────────────────────────────────────────────────────────────────────────
// EL PRECIO DE LAS LANDINGS SALE DEL CATÁLOGO (2026-09-06)
//
// ⚠️⚠️ **Antes era un literal.** `<span>$50</span>` escrito a mano en cada una de
// las cuatro landings, mientras la carta de `/paso-tres` y el formulario de
// `/paso-cuatro` —las pantallas de ANTES y de DESPUÉS— ya leían el catálogo.
// O sea que el día que el admin subiera Essential de $10 a $13, la carta diría
// $13, el paso 4 diría $13, Stripe cobraría $13, y la landing que está EN MEDIO
// seguiría diciendo $10. Peor: su propio `PlanSwitcher` sí lee el catálogo, así
// que la misma página podía enseñar el precio nuevo y el viejo a la vez.
//
// Es exactamente el fallo que la cadena "el precio se teclea en un sitio y llega
// a los tres" existe para evitar, y se disparaba solo, sin aviso, el primer día
// que alguien tocara un precio.
//
// ⚠️ **Y el PERIODO también.** Las cuatro decían "USD/mes" sobre un cobro de 28
// días —13,04 veces al año, no 12— y dos añadían **"Pago único mensual"**, que no
// significa nada: o es único o es mensual. Tres redacciones distintas para la
// única pregunta que un adulto se hace antes de meter la tarjeta.
//
// ⚠️ **El respaldo NO es opcional.** Si el catálogo no responde se pinta el
// literal que estaba escrito, con su recurrencia declarada: una landing sin
// precio no vende, y el checkout cobra el bueno igual. Mismo criterio que
// `PRECIO_DE_RESPALDO`/`RECURRENTE_DE_RESPALDO` en `paso-tres`.
// ─────────────────────────────────────────────────────────────────────────────

/** Cuántos días cubre un cobro. Espejo de `DIAS_DEL_PERIODO` de la plataforma. */
export const DIAS_DEL_PERIODO = 28;

/**
 * Cómo se rotula el cobro de un plan, según si SE REPITE.
 *
 * ⚠️⚠️ **Vive aquí y se exporta porque estaba escrito en DOS sitios y uno de los
 * dos se quedó viejo.** Este componente ya corregía que la unidad no llevara el
 * periodo en un pago único; la landing dinámica de `/plan/<clave>` tenía su
 * propia copia y seguía pintando *"$210 USD / 28 días"* con *"Pago único · sin
 * renovación automática"* justo debajo — la tarifa y su desmentido a dos
 * centímetros, en el único dato con el que un adulto decide si mete la tarjeta.
 *
 * Es la misma pregunta contestada en dos sitios, que es como diverge todo en
 * este repo. Si mañana el periodo deja de ser fijo, se cambia una vez.
 */
export function unidadDePrecio(recurrente: boolean): string {
  // Nunca "/mes": cuando se repite, el ciclo es de 4 semanas (13,04 al año).
  return recurrente ? ` USD / ${DIAS_DEL_PERIODO} días` : " USD";
}

export function notaDeCobro(recurrente: boolean): string {
  return recurrente
    ? `Facturación automática cada ${DIAS_DEL_PERIODO} días`
    : `Pago único · cubre ${DIAS_DEL_PERIODO} días de acceso`;
}

export default function PrecioDelPlan({
  clave,
  centavosDeRespaldo,
  recurrenteDeRespaldo,
  color,
  notaExtra,
  claseImporte = "text-4xl lg:text-5xl font-extrabold leading-none",
  claseUnidad = "text-xs lg:text-sm font-bold",
  claseNota = "text-[11px] lg:text-[12px] text-zinc-400 font-medium mb-2",
}: {
  /** Clave del plan en el catálogo: "Essential", "Premium", "Personalizado"… */
  clave: string;
  centavosDeRespaldo: number;
  recurrenteDeRespaldo: boolean;
  /** Color del importe, que cada landing tiene el suyo. */
  color: string;
  /** Coletilla propia de la landing (p. ej. "cupos limitados"). */
  notaExtra?: string;
  claseImporte?: string;
  claseUnidad?: string;
  claseNota?: string;
}) {
  const catalogo = usePlanesDelCatalogo();
  const fila = catalogo?.find((p) => p.key === clave);

  const centavos = fila?.priceCents ?? centavosDeRespaldo;
  const recurrente = fila ? fila.recurring : recurrenteDeRespaldo;

  /*
    ⚠️⚠️ **La unidad se pintaba SIEMPRE con el periodo, también en un plan que NO
    renueva**, así que Personalizado salía como *"$120 USD / 28 días"* con *"Pago
    único · sin renovación automática"* justo debajo: la tarifa y su desmentido a
    dos centímetros, en el único dato con el que un adulto decide si mete la
    tarjeta. Se lee como un cobro cada 28 días con una coletilla que lo contradice.

    El dato ya estaba tres líneas más arriba y la unidad no lo miraba. Ahora el
    periodo va DONDE significa algo: en la unidad si se repite, y dentro de la nota
    —"cubre 28 días"— si es un pago único.
  */
  const unidad = unidadDePrecio(recurrente);
  const nota = notaDeCobro(recurrente);

  return (
    <>
      <div className="flex items-baseline gap-1 mb-3" style={{ color }}>
        <span className={claseImporte}>{precioEtiqueta(centavos)}</span>
        {/* Nunca "/mes": cuando se repite, el ciclo es de 4 semanas (13,04 al año). */}
        <span className={claseUnidad}>{unidad}</span>
      </div>
      <p className={claseNota}>
        {nota}
        {notaExtra ? ` · ${notaExtra}` : ""}
      </p>
    </>
  );
}
