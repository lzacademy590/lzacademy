"use client";

import { usePlanesDelCatalogo } from "@/app/hooks/usePlanesDelCatalogo";

/**
 * Las viñetas de un plan: las que teclea el admin, con el copy local de respaldo.
 *
 * ⚠️⚠️ **Existe porque las LANDINGS se habían quedado fuera de la
 * sincronización.** Las cards de `/paso-tres` aplican esta misma regla desde el
 * 2026-09-06 (`f.features.length ? f.features : base.features`) y las cuatro
 * landings seguían pintando su array escrito a mano. Visto en PRODUCCIÓN el
 * 2026-09-08 con el Programa de Fluidez: el panel y la card enseñaban las nueve
 * viñetas del admin —"2 sesiones privadas de coaching 1:1 por semana",
 * "Diagnóstico profundo de tus bloqueos al hablar"…— y `/fluidez`, a un clic,
 * enseñaba otras: **"1 Sesión de coaching enfocado en speaking 1:1 semanal"**.
 * O sea, el número de sesiones cambiaba entre la tarjeta y la página que
 * describe lo que compras.
 *
 * ⚠️ **Gana el CATÁLOGO, no el copy local**, igual que en las cards. Es la
 * decisión que hace que editar un plan en Admin › Planes sirva de algo: con el
 * copy local ganando, cambiar una viñeta en el panel no movería la landing y
 * volveríamos a tener dos versiones del mismo plan.
 *
 * ⚠️ Y el respaldo NO es adorno: mientras el catálogo carga —o si no responde—
 * se pinta el copy local. Una landing sin viñetas no vende; una con las de ayer,
 * sí.
 */
export function useFeaturesDelPlan(clave: string, locales: string[]): string[] {
  const catalogo = usePlanesDelCatalogo();
  const fila = catalogo?.find((p) => p.key === clave);
  return fila?.features?.length ? fila.features : locales;
}
