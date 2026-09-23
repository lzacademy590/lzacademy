"use client";

import { useEffect, useState } from "react";
import { useMapasDelCatalogo } from "@/app/hooks/usePlanesDelCatalogo";

// ¿El plan se compra para una fecha de inicio (cohorte) o empieza el mismo día?
//
// La regla NO se declara aquí: se lee de GET /config/plans, que la deriva del
// catálogo único del backend (`src/config/plans.js` → requiresCohort). Si se
// hardcodeara la lista en el frontend habría tres copias de la misma regla
// (backend, frontend y plataforma) y la de en medio se quedaría atrás.
//
// Fail-CERRADO, al revés que useStartDates y usePlanCupos: mientras carga o si
// el fetch falla, se asume que el plan SÍ necesita cohorte. Es la dirección
// segura del error — de más, se le pide una fecha a alguien que no la necesita
// (molesto, reversible); de menos, un Premium compraría sin fecha y sin clase
// agendada, que es un alumno roto y un reembolso.
//
// ⚠️ Desde el 2026-09-20 NO hace su propio `fetch`: deriva de la lectura
// compartida de `/config/plans` (ver `usePlanesDelCatalogo`). Era una de las
// tres peticiones idénticas que salían por carga.

// Si el catálogo no contesta en este tiempo, se sigue sin él (default seguro).
const FETCH_TIMEOUT_MS = 4000;

export function usePlanCohorte() {
  const { cohorte, estado } = useMapasDelCatalogo();

  /*
    Techo de espera PROPIO, y tiene que seguir siendo más corto que el de la
    lectura compartida (8 s).

    El CTA de pago se deshabilita mientras `loading` sea true, así que un fetch
    que NO falla sino que se QUEDA COLGADO dejaría el botón muerto para todos
    los planes: una caída del checkout entero por un endpoint secundario. Al
    vencer el techo se sigue con el default seguro (todos con cohorte), que es
    el comportamiento de siempre.

    ⚠️ La diferencia con antes: aquí ya NO se aborta la petición, solo se deja
    de esperarla. Si el catálogo llega tarde, el mapa se rellena y el formulario
    se corrige solo — antes esa respuesta se descartaba y un Essential se quedaba
    pidiendo una fecha que el servidor luego descarta.
  */
  const [venciendoElTecho, setVenciendoElTecho] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVenciendoElTecho(true), FETCH_TIMEOUT_MS);
    return () => clearTimeout(t);
  }, []);

  const loading = estado === "cargando" && !venciendoElTecho;

  const requiresCohort = (plan: string): boolean => cohorte[plan] ?? true;

  return { requiresCohort, loading };
}
