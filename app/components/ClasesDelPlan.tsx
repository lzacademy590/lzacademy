"use client";

import { usePlanesDelCatalogo } from "@/app/hooks/usePlanesDelCatalogo";
import { fraseDeClases } from "@/app/lib/dias-de-clase";

// ─────────────────────────────────────────────────────────────────────────────
// LOS DÍAS DE CLASE DE LAS LANDINGS SALEN DEL CATÁLOGO (2026-09-07)
//
// Hermano de `PrecioDelPlan`, y por el mismo motivo: los días estaban escritos a
// mano en cuatro archivos de este website y **se contradecían entre sí dentro del
// mismo embudo** — la card de `/paso-tres` prometía "lunes a jueves" y la landing
// a la que lleva, "lunes a miércoles". Hoy los define el admin de la plataforma
// (Admin › Planes) y viajan por el catálogo.
//
// ⚠️ **Si el catálogo no lo dice, no se pinta nada.** No hay literal de respaldo,
// al revés que en el precio: una landing sin precio no vende, pero una landing
// que anuncia el día EQUIVOCADO de una clase en vivo hace que el alumno no
// aparezca. Callar es la degradación correcta aquí.
// ─────────────────────────────────────────────────────────────────────────────

export default function ClasesDelPlan({
  clave,
  className = "",
}: {
  /** Clave del plan en el catálogo: "Premium", "Personalizado"… */
  clave: string;
  className?: string;
}) {
  const catalogo = usePlanesDelCatalogo();
  const fila = catalogo?.find((p) => p.key === clave);
  const frase = fila ? fraseDeClases(fila.liveClasses, fila.classDays, fila.classMode, fila.sessionsPerWeek) : null;
  if (!frase) return null;
  return <p className={className}>{frase}</p>;
}
