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
/** Cupos de un plan, tal y como los adjunta `GET /config/plans`. */
export interface CuposDelPlan {
  activo: boolean;
  max: number;
  usados: number;
  restantes: number;
}

/** Lo que hay leído del catálogo en este momento, para TODA la página. */
interface Instantanea {
  /** Las filas ya normalizadas. `null` = todavía no hay catálogo bueno. */
  planes: PlanDelCatalogo[] | null;
  /**
   * Cupos por plan, construidos del cuerpo CRUDO.
   *
   * ⚠️ NO se derivan de `planes`: el normalizador DESCARTA la fila de un plan
   * sin precio con forma de precio, y eso le quitaría el cupo a un plan que sí
   * lo tiene — dejándolo como "disponible" cuando está agotado. Cada derivación
   * conserva la regla que ya tenía; lo único que se comparte es la PETICIÓN.
   */
  cupos: Record<string, CuposDelPlan>;
  /** `requiresCohort` por plan, también del cuerpo crudo (ver `usePlanCohorte`). */
  cohorte: Record<string, boolean>;
  estado: EstadoDelCatalogo;
  /** Cuándo se leyó con éxito por última vez (para el TTL). */
  leidoEn: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// EL CATÁLOGO SE PIDE UNA VEZ POR PÁGINA, NO UNA POR COMPONENTE (2026-09-20)
//
// ⚠️⚠️ Cada llamada a este hook tenía su propio `useEffect` con su propio
// `fetch`, y hay DOCE puntos que lo llaman. Medido contra un build de
// PRODUCCIÓN —no `next dev`, que duplica los efectos y habría inflado el dato—:
//
//     /premium           5 peticiones a /config/plans
//     /fluidez           4
//     /paso-cuatro       3  (+ start-dates, level-availability y 2 premium-slots)
//     /pago-estudiantes  2
//
// Cinco respuestas IDÉNTICAS al mismo instante. Y no era solo presupuesto del
// limitador: `getCuposAvailability()` del backend hace una consulta por plan
// con tope, en SERIE, así que cada duplicado repetía toda esa tanda contra
// Supabase.
//
// ⚠️ **Cachear en el SERVIDOR no habría servido para el 429**: el limitador
// corre ANTES del handler, así que una respuesta cacheada gasta exactamente lo
// mismo que una calculada. La única petición que no cuenta es la que no se
// hace.
//
// `usePlanCupos` y `usePlanCohorte` derivan ahora de esta misma lectura. Era la
// deuda anotada arriba desde el 2026-09-06.
// ─────────────────────────────────────────────────────────────────────────────

/** Ventana en la que una lectura buena se reutiliza sin volver a pedir. */
const TTL_MS = 30_000;

/**
 * Techo de espera de la petición compartida.
 *
 * ⚠️ Antes `useCatalogoDePlanes` no tenía NINGUNO: un fetch que no falla sino
 * que se queda colgado dejaba a `/plan/<clave>` en "Cargando el plan…" para
 * siempre. El único que abortaba era `usePlanCohorte`, a los 4 s, y conserva su
 * propio techo — ver allí por qué el suyo tiene que ser más corto que éste.
 */
const TIMEOUT_MS = 8_000;

const VACIA: Instantanea = { planes: null, cupos: {}, cohorte: {}, estado: 'cargando', leidoEn: 0 };

let actual: Instantanea = VACIA;
let enVuelo: Promise<void> | null = null;
const suscriptores = new Set<() => void>();

function publicar(siguiente: Instantanea) {
  actual = siguiente;
  suscriptores.forEach((avisar) => avisar());
}

function normalizarFilas(data: unknown[]): PlanDelCatalogo[] {
  const filas: PlanDelCatalogo[] = [];
  for (const fila of data) {
    const p = fila as Record<string, unknown> | null;
    if (!p || typeof p !== "object" || typeof p.key !== "string") continue;
    // Un importe sin forma de precio descarta la fila entera: una card sin
    // precio no se puede comprar, y enseñarla es peor que no enseñarla.
    if (!Number.isInteger(p.priceCents) || (p.priceCents as number) <= 0) continue;
    filas.push({
      key: p.key,
      label: typeof p.label === "string" ? p.label : p.key,
      family: typeof p.family === "string" && p.family ? p.family : null,
      priceCents: p.priceCents as number,
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
      sessionsPerWeek: Number.isInteger(p.sessionsPerWeek) ? (p.sessionsPerWeek as number) : null,
      liveClasses: typeof p.liveClasses === "boolean" ? p.liveClasses : null,
      classDays: Array.isArray(p.classDays)
        ? p.classDays.filter((d: unknown): d is number => Number.isInteger(d))
        : [],
      hasLevels: p.hasLevels !== false,
    });
  }
  return filas;
}

/**
 * Pide el catálogo, o se cuelga de la petición que ya está en vuelo.
 *
 * @param forzar salta el TTL. Lo usan el refresco de cupos y el botón de
 *   reintentar; una carga de página normal NO fuerza, que es lo que colapsa las
 *   cinco peticiones en una.
 */
function pedirCatalogo(forzar = false): Promise<void> {
  // Single-flight: dos componentes montándose a la vez comparten la petición.
  if (enVuelo) return enVuelo;
  const fresco = actual.planes !== null && Date.now() - actual.leidoEn < TTL_MS;
  if (fresco && !forzar) return Promise.resolve();

  /*
    ⚠️ Solo se anuncia "cargando" cuando NO hay nada que enseñar. Un refresco de
    fondo (el de cupos, cada 2 min) que pusiera el estado en 'cargando' haría
    que `/plan/<clave>` parpadeara a "Cargando el plan…" cada dos minutos con el
    plan ya en pantalla.
  */
  if (actual.planes === null && actual.estado !== 'cargando') {
    publicar({ ...actual, estado: 'cargando' });
  }

  const abort = new AbortController();
  const reloj = setTimeout(() => abort.abort(), TIMEOUT_MS);

  enVuelo = fetch(`${BACKEND_URL}/config/plans`, { cache: "no-store", signal: abort.signal })
    .then((r) => r.json())
    .then((data) => {
      // Una respuesta que no es lista no es un catálogo vacío: es una que no
      // se entiende, y eso es un FALLO, no "no hay planes".
      if (!Array.isArray(data)) throw new Error("catálogo con forma inesperada");
      const cupos: Record<string, CuposDelPlan> = {};
      const cohorte: Record<string, boolean> = {};
      for (const fila of data) {
        const p = fila as Record<string, unknown> | null;
        if (!p || typeof p !== "object" || typeof p.key !== "string") continue;
        if (p.cupos && typeof p.cupos === "object") cupos[p.key] = p.cupos as CuposDelPlan;
        // Solo un `false` explícito quita la cohorte. Un backend viejo que
        // todavía no manda el campo deja a todos los planes con cohorte.
        cohorte[p.key] = p.requiresCohort !== false;
      }
      publicar({ planes: normalizarFilas(data), cupos, cohorte, estado: 'listo', leidoEn: Date.now() });
    })
    .catch(() => {
      /*
        Sigue siendo fail-open para quien tenga copy propio (`/paso-tres` pinta
        sus cuatro cards de respaldo), pero AHORA SE DICE. Tragárselo en
        silencio es lo que dejaba a `/plan/<clave>` cargando para siempre.

        ⚠️ Un refresco que falla NO borra lo que ya había: la card se quedaría
        en blanco por un parpadeo de red, teniendo el catálogo de hace dos
        minutos, que es perfectamente bueno para enseñarlo.
      */
      if (actual.planes !== null) return;
      publicar({ ...actual, estado: 'fallo' });
    })
    .finally(() => {
      clearTimeout(reloj);
      enVuelo = null;
    });

  return enVuelo;
}

/** Fuerza una relectura del catálogo compartido (salta el TTL). */
export function refrescarCatalogo(): void {
  void pedirCatalogo(true);
}

/** Se suscribe a la lectura compartida y la dispara si hace falta. */
function useInstantanea(): Instantanea {
  const [snapshot, setSnapshot] = useState<Instantanea>(actual);

  useEffect(() => {
    const alCambiar = () => setSnapshot(actual);
    suscriptores.add(alCambiar);
    void pedirCatalogo();
    // Por si otro componente ya lo trajo entre el render y este efecto.
    alCambiar();
    return () => {
      suscriptores.delete(alCambiar);
    };
  }, []);

  return snapshot;
}

export function useCatalogoDePlanes(): {
  planes: PlanDelCatalogo[] | null;
  estado: EstadoDelCatalogo;
  reintentar: () => void;
} {
  const { planes, estado } = useInstantanea();
  const reintentar = useCallback(() => {
    void pedirCatalogo(true);
  }, []);
  return { planes, estado, reintentar };
}

/**
 * Los dos mapas CRUDOS de la misma lectura, para `usePlanCupos` y
 * `usePlanCohorte`. No es API pública de pantalla: si necesitas planes, usa
 * `usePlanesDelCatalogo`.
 */
export function useMapasDelCatalogo(): {
  cupos: Record<string, CuposDelPlan>;
  cohorte: Record<string, boolean>;
  estado: EstadoDelCatalogo;
} {
  const { cupos, cohorte, estado } = useInstantanea();
  return { cupos, cohorte, estado };
}

/** La lista a secas. Ver `useCatalogoDePlanes` para el porqué de las dos. */
export function usePlanesDelCatalogo(): PlanDelCatalogo[] | null {
  return useCatalogoDePlanes().planes;
}
