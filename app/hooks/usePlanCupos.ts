"use client";

import { useEffect } from "react";
import {
  useMapasDelCatalogo,
  refrescarCatalogo,
  type CuposDelPlan,
} from "@/app/hooks/usePlanesDelCatalogo";

// Cupos limitados por plan. El backend adjunta este objeto a cada plan de
// GET /config/plans SOLO si el plan tiene cupos configurados (hoy: Fluidez).
export type PlanCupos = CuposDelPlan;

// Umbral para el copy de urgencia ("Últimos N cupos" vs "Solo N cupos").
const LOW_STOCK_THRESHOLD = 3;

type CuposMap = Record<string, PlanCupos>;

// Cada cuánto re-consultar los cupos para que el conteo baje en vivo (reactivo).
//
// ⚠️⚠️ Este número gasta el presupuesto de peticiones del BACKEND, que es de 100
// cada 15 minutos POR VISITANTE (y era de 100 para todo el sitio junto hasta que
// se puso `trust proxy`, ver lzacademy-backend/src/app.js). A 30 s, un solo
// visitante quieto un cuarto de hora en /paso-tres se llevaba 30 de esas 100 él
// solo: tres personas a la vez agotaban el cubo entero y a partir de ahí el
// checkout, el panel y los webhooks de Stripe empezaban a recibir 429.
//
// A 2 minutos el contador sigue bajando en vivo —que es para lo único que
// existe— a la cuarta parte del coste.
const REFRESH_MS = 120_000;

// Hook que expone los cupos de los planes que los tienen. Fail-open: mientras
// carga o si el fetch falla, los planes se consideran disponibles para no
// ocultar cards por un error de red (el checkout valida server-side de todos modos).
//
// ⚠️ Desde el 2026-09-20 NO hace su propio `fetch`: deriva de la lectura
// compartida de `/config/plans` (ver `usePlanesDelCatalogo`). Lo que este hook
// conserva en exclusiva es el REFRESCO, porque es el único consumidor al que le
// importa que el número baje en vivo — y al forzarlo se actualizan de paso los
// precios y las viñetas de toda la página.
export function usePlanCupos() {
  const { cupos, estado } = useMapasDelCatalogo();
  const loading = estado === "cargando";

  useEffect(() => {
    // Reactivo: re-consulta cada REFRESH_MS y al volver a enfocar la pestaña,
    // para que los "N cupos disponibles" bajen a medida que se ocupan.
    //
    // ⚠️ Una pestaña OCULTA no consulta: nadie está leyendo ese contador, y una
    // pestaña olvidada en segundo plano seguía pidiendo indefinidamente — que es
    // el peor gasto posible, porque no lo ve nadie. Al volver, el listener de
    // `focus` de abajo refresca en el acto, así que no se ve desactualizado.
    const id = setInterval(() => {
      if (document.visibilityState === "hidden") return;
      refrescarCatalogo();
    }, REFRESH_MS);
    const onFocus = () => refrescarCatalogo();
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(id);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  // Cupos de un plan, o undefined si el plan no maneja cupos.
  const getCupos = (plan: string): PlanCupos | undefined => cupos[plan];

  // Un plan es visible si NO maneja cupos, o si tiene cupos activos y restantes.
  const isPlanAvailable = (plan: string): boolean => {
    const c = cupos[plan];
    if (!c) return true;
    return c.activo && c.restantes > 0;
  };

  // Etiqueta real de cupos para la card ("" si el plan no maneja cupos o está
  // agotado/desactivado). Muestra el conteo restante y da urgencia al bajar.
  const cuposLabel = (plan: string): string => {
    const c = cupos[plan];
    if (!c || !c.activo || c.restantes <= 0) return "";
    if (c.restantes === 1) return "¡Último cupo!";
    if (c.restantes <= LOW_STOCK_THRESHOLD) return `¡Últimos ${c.restantes} cupos!`;
    return `${c.restantes} cupos disponibles`;
  };

  return { cupos: cupos as CuposMap, loading, getCupos, isPlanAvailable, cuposLabel };
}
