"use client";

import { useEffect, useState } from "react";

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

export function usePlanesDelCatalogo(): PlanDelCatalogo[] | null {
  const [planes, setPlanes] = useState<PlanDelCatalogo[] | null>(null);

  useEffect(() => {
    let cancelado = false;
    fetch(`${BACKEND_URL}/config/plans`, { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (cancelado || !Array.isArray(data)) return;
        const filas: PlanDelCatalogo[] = [];
        for (const p of data) {
          if (!p || typeof p !== "object" || typeof p.key !== "string") continue;
          // Un importe sin forma de precio descarta la fila entera: una card sin
          // precio no se puede comprar, y enseñarla es peor que no enseñarla.
          if (!Number.isInteger(p.priceCents) || p.priceCents <= 0) continue;
          filas.push({
            key: p.key,
            label: typeof p.label === "string" ? p.label : p.key,
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
            hasLevels: p.hasLevels !== false,
          });
        }
        setPlanes(filas);
      })
      .catch(() => {
        /* fail-open: la página se queda con los planes que tienen copy propio */
      });
    return () => {
      cancelado = true;
    };
  }, []);

  return planes;
}
