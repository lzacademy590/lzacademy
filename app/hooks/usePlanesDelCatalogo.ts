"use client";

import { useCallback, useEffect, useState } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// EL CATÁLOGO MANDA QUÉ CARDS EXISTEN (2026-09-06)
//
// Sustituye a `usePlanPrecios`, que solo traía el importe. Ahora trae la LISTA:
// `GET /config/plans` del backend, que a su vez lee nombre, precio y viñetas del
// admin de la plataforma (`precios-plataforma.service.js`). El objetivo es que
// abrir un plan en el admin lo haga aparecer en el website sin tocar código.
//
// ⚠️ **Fail-open, y aquí eso significa "no enseñar nada nuevo"**: si el catálogo
// no responde se devuelve `null` y la página se queda con los planes que tiene
// copy propio. Una pantalla de precios en blanco no vende; una con los cuatro de
// siempre, sí.
//
// ⚠️ Deuda conocida: son TRES hooks pidiendo `/config/plans` (`usePlanCupos`,
// `usePlanCohorte` y éste). Unificarlos en uno que devuelva el catálogo y derive
// los tres es la limpieza natural; no se hizo para no tocar dos que funcionan.
//
// ⚠️ **Y por eso el CHECKOUT no añadió un cuarto** (2026-09-06): este hook ya
// traía la lista entera, así que solo hubo que hacerle cargar los campos de
// cobro (`studentCheckout`, `requiresCohort`…) y derivar el resto con
// `planesDeCheckout()`, una función PURA de `lib/plans.ts`. Si necesitas otro
// dato del catálogo, amplía este hook — no escribas otro `fetch`.
// ─────────────────────────────────────────────────────────────────────────────

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL!;

export interface PlanDelCatalogo {
  key: string;
  label: string;
  /**
   * Familia de la que este plan es rama, o `null` si es suelto. Las ramas se
   * pintan como UNA carta con selector; la base es la que cumple `key === family`.
   */
  family: string | null;
  priceCents: number;
  recurring: boolean;
  /** Lo tiene la plataforma y este backend no sabe cobrarlo: se compra allí. */
  /** Se anuncia aquí pero se compra en la plataforma (el legacy no sabe cobrarlo). */
  soloEnPlataforma: boolean;
  /**
   * Vino del catálogo de la plataforma, lo cobre este backend o no.
   *
   * ⚠️ Es la marca con la que se decide si la card se PINTA. `soloEnPlataforma`
   * decide otra cosa —a dónde va el botón— y usarla para pintar hace desaparecer
   * el plan justo el día que pasa a poder venderse aquí.
   */
  origenPlataforma: boolean;
  /** Viñetas del admin. Respaldo: el copy local de la card manda si existe. */
  features: string[];
  /**
   * Se puede comprar en el CHECKOUT de este website.
   *
   * ⚠️ No es lo mismo que "existe": "Speaking" está en el catálogo con
   * `studentCheckout: false` porque tiene su propio embudo, y un plan de la
   * plataforma que el legacy no sabe cobrar también lo trae en `false`.
   */
  studentCheckout: boolean;
  /** Hay que elegir fecha de inicio (cohorte) para comprarlo. */
  requiresCohort: boolean;
  /** Se agenda la primera clase tras pagar (hoy solo Premium). */
  requiresScheduling: boolean;
  /** Participa en la matriz de niveles y en los links de acceso. */
  hasLevels: boolean;
  /**
   * ¿Lleva clases en vivo? **`null` = la plataforma no lo dijo**, y no es lo
   * mismo que `false`. Una versión antigua no puede acabar anunciando que
   * Premium no tiene clases: con `null` la card no pinta nada y se queda como
   * estaba. Es la misma distinción que ya se guarda para la recurrencia.
   */
  liveClasses: boolean | null;
  /**
   * Días, en **convención Zoom** (1=Dom … 7=Sáb, ver `lib/dias-de-clase`).
   * Vacío con `liveClasses: true` es "tiene clases sin día fijo" (planes 1 a 1).
   */
  classDays: number[];
  /** `'GRUPAL'` o `'UNO_A_UNO'`. `null` = la plataforma no lo dijo. */
  classMode: string | null;
  /** Solo lo declaran los 1:1: en un grupal los días ya son la frecuencia. */
  sessionsPerWeek: number | null;
}

/**
 * Centavos → "$10" o "$10.50".
 *
 * Sin decimales cuando son redondos: los planes de hoy lo son, y un "$10.00" en
 * una card de precio se lee como una cifra de factura, no como una oferta.
 */
export function precioEtiqueta(centavos: number): string {
  const dolares = centavos / 100;
  return `$${Number.isInteger(dolares) ? dolares : dolares.toFixed(2)}`;
}

/**
 * En qué punto está la lectura del catálogo.
 *
 * ⚠️⚠️ **`null` significaba DOS cosas y por eso hubo tres fallos a la vez.**
 * `usePlanesDelCatalogo` devolvía `null` mientras cargaba **y** si la petición
 * fallaba, así que ninguna pantalla podía distinguirlos y cada una se inventaba
 * su respaldo. Medido en el recorrido del 2026-09-09:
 *
 *  · `/plan/<clave>` se quedaba en **"Cargando el plan…" para siempre** — una
 *    sola petición, sin reintento, con el mismo texto a los 35 segundos.
 *  · `/paso-cuatro` caía a **Essential en silencio** y llegaba a cobrar $10 por
 *    una rama de $210.
 *  · `/paso-tres` apagaba la escalera entera y enseñaba un precio viejo.
 *
 * "No ha llegado todavía" y "no va a llegar" piden respuestas opuestas: una es
 * esperar y la otra ofrecer una salida. Es la misma regla que este repo ya tiene
 * escrita para el alumno — **un fallo de carga no se pinta como "no hay nada"**.
 */
export type EstadoDelCatalogo = 'cargando' | 'listo' | 'fallo';

/**
 * El catálogo CON su estado, para quien necesite distinguirlos.
 *
 * ⚠️ `usePlanesDelCatalogo` se conserva como envoltorio y NO cambia de firma: lo
 * consumen doce sitios y casi todos solo quieren la lista. Cambiar la firma para
 * los dos que necesitan el estado habría sido tocar diez pantallas que no tienen
 * nada que arreglar.
 */
export function useCatalogoDePlanes(): {
  planes: PlanDelCatalogo[] | null;
  estado: EstadoDelCatalogo;
  reintentar: () => void;
} {
  const [planes, setPlanes] = useState<PlanDelCatalogo[] | null>(null);
  const [estado, setEstado] = useState<EstadoDelCatalogo>('cargando');
  const [intento, setIntento] = useState(0);
  const reintentar = useCallback(() => {
    setEstado('cargando');
    setIntento((n) => n + 1);
  }, []);

  useEffect(() => {
    let cancelado = false;
    fetch(`${BACKEND_URL}/config/plans`, { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (cancelado) return;
        // Una respuesta que no es lista no es un catálogo vacío: es una que no
        // se entiende, y eso es un FALLO, no "no hay planes".
        if (!Array.isArray(data)) {
          setEstado('fallo');
          return;
        }
        const filas: PlanDelCatalogo[] = [];
        for (const p of data) {
          if (!p || typeof p !== "object" || typeof p.key !== "string") continue;
          // Un importe sin forma de precio descarta la fila entera: una card sin
          // precio no se puede comprar, y enseñarla es peor que no enseñarla.
          if (!Number.isInteger(p.priceCents) || p.priceCents <= 0) continue;
          filas.push({
            key: p.key,
            label: typeof p.label === "string" ? p.label : p.key,
            family: typeof p.family === "string" && p.family ? p.family : null,
            priceCents: p.priceCents,
            recurring: p.recurring === true,
            soloEnPlataforma: p.soloEnPlataforma === true,
            origenPlataforma: p.origenPlataforma === true,
            features: Array.isArray(p.features)
              ? p.features.filter((f: unknown): f is string => typeof f === "string")
              : [],
            studentCheckout: p.studentCheckout === true,
            /*
              ⚠️ La cohorte y los niveles caen a TRUE cuando el catálogo no los
              declara, al revés que el resto. Es deliberado y es el mismo criterio
              que `usePlanCohorte`: pedir una fecha de más solo añade un paso;
              no pedirla deja entrar a un plan con clase en vivo sin grupo. Ante
              la duda, el paso de más.
            */
            requiresCohort: p.requiresCohort !== false,
            requiresScheduling: p.requiresScheduling === true,
            classMode: typeof p.classMode === "string" ? p.classMode : null,
            sessionsPerWeek: Number.isInteger(p.sessionsPerWeek) ? p.sessionsPerWeek : null,
            liveClasses: typeof p.liveClasses === "boolean" ? p.liveClasses : null,
            classDays: Array.isArray(p.classDays)
              ? p.classDays.filter((d: unknown): d is number => Number.isInteger(d))
              : [],
            hasLevels: p.hasLevels !== false,
          });
        }
        setPlanes(filas);
        setEstado('listo');
      })
      .catch(() => {
        /*
          Sigue siendo fail-open para quien tenga copy propio (`/paso-tres` pinta
          sus cuatro cards de respaldo), pero AHORA SE DICE. Tragárselo en
          silencio es lo que dejaba a `/plan/<clave>` cargando para siempre.
        */
        if (cancelado) return;
        setEstado('fallo');
      });
    return () => {
      cancelado = true;
    };
  }, [intento]);

  return { planes, estado, reintentar };
}

/** La lista a secas. Ver `useCatalogoDePlanes` para el porqué de las dos. */
export function usePlanesDelCatalogo(): PlanDelCatalogo[] | null {
  return useCatalogoDePlanes().planes;
}
