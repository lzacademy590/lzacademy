// ─────────────────────────────────────────────────────────────────────────────
// CATÁLOGO ÚNICO DE PLANES — fuente de verdad del frontend.
//
// Todo lo estructural de los planes (precio, recurrencia, agendamiento, niveles,
// colores, imagen, en qué dropdowns aparece) se define AQUÍ y el resto del código
// lo deriva. Para agregar o modificar un plan, edita este archivo.
//
// El backend tiene su propio catálogo (lzacademy-backend/src/config/plans.js) que
// es la fuente de verdad para COBRAR. Este de aquí cubre la presentación. El
// precio debe coincidir con el del backend; si quieres evitar la duplicación,
// el endpoint público GET /config/plans expone el catálogo del backend.
//
// La copy de marketing por página (features, taglines, textos de las landing de
// cada plan) sigue viviendo en cada página, porque difiere entre páginas.
// ─────────────────────────────────────────────────────────────────────────────

import { fraseDeClases } from "@/app/lib/dias-de-clase";

export type PlanKey =
  | "Essential"
  | "Premium"
  | "Personalizado"
  | "Fluidez"
  | "Speaking";
export type DiscountPlan = "all" | PlanKey;

export interface PlanChip {
  color: string;
  bg: string;
  border: string;
}

export interface PlanDef {
  key: PlanKey;
  label: string;
  priceCents: number;
  recurring: boolean; // true = suscripción cada 4 semanas; false = pago único
  requiresScheduling: boolean; // true = agenda 1ª clase tras pagar (Premium)
  hasLevels: boolean; // participa en la matriz de niveles / accesos
  checkout: boolean; // seleccionable en los dropdowns de checkout y /pago-estudiantes
  character?: string; // imagen del personaje (paso-cuatro)
  adminColor: string; // clase Tailwind de background (punto/barra en admin)
  badgeClass: string; // clases Tailwind bg+text para chips/badges en admin
  chip?: PlanChip; // colores hex (chip de plan en /success)
  levelAvailability?: Record<string, boolean>; // defaults de niveles (solo hasLevels)
  // Resumen del plan en el checkout: tagline + bullets. Se muestra en el formulario
  // de pago y se envía como descripción del producto en Stripe (ambos flujos).
  checkoutTagline?: string;
  checkoutFeatures?: string[];
}

// Defaults de disponibilidad de niveles: Essential todo; Premium sin B2.2;
// Personalizado sin B2.1 ni B2.2. (Fallback si el backend no responde.)
//
// Fusión B2 (vigente 2026-08-24): "Intermedio alto" (B2) es el nivel único y va
// habilitado en los cuatro planes. Debe coincidir con lo que el backend valida en
// createCheckoutSession — useLevelAvailability falla en abierto y se queda con
// estos defaults si el fetch de config falla, así que un desajuste aquí ofrece
// niveles que el checkout luego rechaza. Los B2.1/B2.2 heredados siguen en la
// matriz mientras existan alumnos en esos cursos (salen en la fase 4).
const ALL_LEVELS_ON = {
  Principiante: true,
  Basico: true,
  Intermedio: true,
  "Intermedio alto": true,
  "Intermedio alto-gramatica": true,
  "Intermedio alto-produccion": true,
};

export const PLAN_LIST: PlanDef[] = [
  {
    key: "Essential",
    label: "Essential",
    priceCents: 1000,
    recurring: true,
    requiresScheduling: false,
    hasLevels: true,
    checkout: true,
    character: "/muñeca-essential.webp",
    adminColor: "bg-blue-500",
    badgeClass: "bg-sky-100 text-sky-700",
    chip: { color: "#0369a1", bg: "#f0f9ff", border: "#bae6fd" },
    levelAvailability: { ...ALL_LEVELS_ON },
    checkoutTagline: "Aprende a tu ritmo con el Método 590 completo.",
    checkoutFeatures: [
      "Acceso completo al Método 590",
      "Plataforma con material organizado por sesión y nivel",
      "Comunidad en WhatsApp",
      "Clases de práctica en vivo los viernes",
    ],
  },
  {
    key: "Premium",
    label: "Premium",
    priceCents: 5000,
    recurring: true,
    requiresScheduling: true,
    hasLevels: true,
    checkout: true,
    character: "/muñeca-premium.webp",
    adminColor: "bg-violet-500",
    badgeClass: "bg-violet-100 text-violet-700",
    chip: { color: "#7c3aed", bg: "#faf5ff", border: "#ddd6fe" },
    levelAvailability: {
      ...ALL_LEVELS_ON,
      "Intermedio alto-produccion": false,
    },
    checkoutTagline: "Todo lo de Essential, con clases en vivo.",
    checkoutFeatures: [
      "Todo lo del Plan Essential",
      // ⚠️ Sin FRECUENCIA ni DÍAS: los pone `conLaFraseDeClases` desde el
      // catálogo. Escritos aquí decían "diaria" mientras la regla son lunes a
      // jueves, y esta cadena acaba dentro del recibo de Stripe.
      "1 hora de clase en vivo",
      "Reuniones de práctica los viernes",
      "Práctica hablada diaria y acompañamiento constante",
    ],
  },
  {
    key: "Personalizado",
    label: "Personalizado",
    priceCents: 12000,
    recurring: false,
    requiresScheduling: false,
    hasLevels: true,
    checkout: true,
    character: "/muñeca-personalizada.webp",
    adminColor: "bg-emerald-500",
    badgeClass: "bg-falu-red-100 text-falu-red-700",
    chip: { color: "#9c181d", bg: "#fef2f2", border: "#ffc9cb" },
    levelAvailability: {
      ...ALL_LEVELS_ON,
      "Intermedio alto-gramatica": false,
      "Intermedio alto-produccion": false,
    },
    checkoutTagline: "Acompañamiento 1:1 totalmente a tu medida.",
    checkoutFeatures: [
      "Todo lo del Plan Premium",
      // ⚠️ Sin el NÚMERO: lo pone `conLaFraseDeClases`. Decía 3 y el catálogo
      // dice 1 — y este texto llega al recibo de Stripe.
      "Sesiones privadas 1:1 adaptadas a ti",
      "1 sesión de práctica grupal cada viernes",
      "Acceso completo al Método 590",
      "Horario flexible para tus sesiones privadas",
      "Plan de trabajo personalizado desde el día 1",
      "Corrección y feedback en tiempo real",
      "Seguimiento y motivación constante",
      "Avanza a tu ritmo con guía personalizada",
    ],
  },
  {
    key: "Fluidez",
    label: "Programa de Fluidez",
    priceCents: 20000,
    recurring: false,
    requiresScheduling: false,
    hasLevels: true,
    checkout: true,
    character: "/muñeca-fluency.webp",
    adminColor: "bg-amber-500",
    badgeClass: "bg-amber-100 text-amber-700",
    chip: { color: "#b45309", bg: "#fffbeb", border: "#fde68a" },
    // Nivel A2+: disponible desde Básico (A2); NO en Principiante (A1).
    levelAvailability: { ...ALL_LEVELS_ON, Principiante: false },
    checkoutTagline: "Rompé la barrera de hablar con coaching de speaking 1:1.",
    checkoutFeatures: [
      "1 Sesión de coaching enfocado en speaking 1:1 semanal",
      "Acceso completo al Método 590",
      "Comunidad en Whatsapp",
      "Diagnóstico de tus bloqueos al hablar",
      "Plan de acción escrito, semana a semana",
      "Feedback y corrección mientras hablás",
      "Reporte de tu progreso de fluidez",
      "Enfoque 100% en romper la barrera de hablar",
    ],
  },
  {
    key: "Speaking",
    label: "Speaking",
    priceCents: 3000,
    recurring: false,
    requiresScheduling: false,
    hasLevels: false,
    checkout: false,
    adminColor: "bg-yellow-orange-500",
    badgeClass: "bg-yellow-orange-100 text-yellow-orange-700",
  },
];

export const PLAN_MAP: Record<string, PlanDef> = Object.fromEntries(
  PLAN_LIST.map((p) => [p.key, p]),
);

// ── Listas derivadas ─────────────────────────────────────────────────────────
export const ALL_PLAN_KEYS = PLAN_LIST.map((p) => p.key);
export const CHECKOUT_PLAN_KEYS = PLAN_LIST.filter((p) => p.checkout).map(
  (p) => p.key,
);
export const LEVELED_PLAN_KEYS = PLAN_LIST.filter((p) => p.hasLevels).map(
  (p) => p.key,
);
export const SUBSCRIPTION_PLANS = PLAN_LIST.filter((p) => p.recurring).map(
  (p) => p.key,
);
// Planes que aceptan códigos de descuento: pago único y disponibles en checkout
// (debe coincidir con el backend → discount.service.js / DISCOUNTS_FOR_SUBSCRIPTIONS).
export const DISCOUNTABLE_PLANS = PLAN_LIST.filter(
  (p) => !p.recurring && p.checkout,
).map((p) => p.key);
// Opciones de plan para un código de descuento en el admin ("all" + planes de checkout).
export const DISCOUNT_PLAN_OPTIONS: DiscountPlan[] = [
  "all",
  ...CHECKOUT_PLAN_KEYS,
];

// Matriz de niveles por plan (defaults) para useLevelAvailability.
export const DEFAULT_LEVEL_AVAILABILITY: Record<
  string,
  Record<string, boolean>
> = Object.fromEntries(
  LEVELED_PLAN_KEYS.map((k) => [
    k,
    { ...(PLAN_MAP[k].levelAvailability as Record<string, boolean>) },
  ]),
);

// ── Helpers ──────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// EL CHECKOUT LO MANDA EL CATÁLOGO, EL ARTE SE QUEDA AQUÍ (2026-09-06)
//
// `PLAN_LIST` sigue siendo la fuente de PRESENTACIÓN —color, chip, muñeca,
// tagline, viñetas—, pero ya no decide QUÉ PLANES existen ni cuánto cuestan. Eso
// lo dice `GET /config/plans`, que a su vez lo lee del admin de la plataforma.
//
// El motivo es que un plan abierto en el admin ya se puede COBRAR desde este
// backend (ver el CLAUDE.md, «El legacy ADOPTA los planes de la plataforma») y
// aun así no aparecía en el formulario de `/pago-estudiantes`: su selector se
// construía con `CHECKOUT_PLAN_KEYS`, una lista estática. La API lo aceptaba y la
// pantalla no lo ofrecía.
//
// ⚠️ **El arte NO se inventa.** Un plan sin ficha local sale con
// `PRESENTACION_NEUTRA` (gris) y con las viñetas que el admin escribió. Se ve más
// sobrio que los cuatro de siempre, y es lo correcto: mejor un plan vendible sin
// ilustración que un plan invisible.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Lo que un checkout necesita saber de un plan para poder venderlo.
 *
 * ⚠️ **La COHORTE no está aquí a propósito.** Esa pregunta ya la contesta
 * `usePlanCohorte`, que lee el mismo `/config/plans` y ya funciona con un plan
 * nuevo. Repetirla aquí serían dos nombres para el mismo hecho — la enfermedad
 * que este repo lleva media docena de secciones documentando.
 */
export interface PlanDeCheckout {
  key: string;
  label: string;
  /**
   * El nombre que se PINTA en el selector del checkout.
   *
   * ⚠️⚠️ **No es `label` sin más, y la diferencia es una pantalla de pago.** El
   * selector llevaba toda la vida enseñando la CLAVE, y para "Fluidez" la clave y
   * la etiqueta no coinciden: pasar a `label` habría renombrado ese plan a
   * "Programa de Fluidez" a la vista del comprador, sin que nadie lo pidiera. Se
   * detectó en el navegador, no compilando.
   *
   * Así que para un plan con ficha local se conserva lo de siempre (la clave) y
   * para uno nuevo se usa la etiqueta del admin — porque su clave es un
   * identificador en mayúsculas ("INTENSIVO") y no un nombre.
   */
  nombreEnCheckout: string;
  priceCents: number;
  recurring: boolean;
  /** Acepta códigos de descuento. */
  discountable: boolean;
  tagline: string;
  features: string[];
  /** No tiene ficha local: se pinta con el arte neutro. */
  sinFichaLocal: boolean;
}

/** Arte de respaldo para un plan que el catálogo trae y este front no conoce. */
const PRESENTACION_NEUTRA = {
  adminColor: "bg-gray-400",
  badgeClass: "bg-gray-100 text-gray-700",
};

export function planColorDe(key: string): string {
  return PLAN_MAP[key]?.adminColor ?? PRESENTACION_NEUTRA.adminColor;
}
export function planBadgeClassDe(key: string): string {
  return PLAN_MAP[key]?.badgeClass ?? PRESENTACION_NEUTRA.badgeClass;
}

/**
 * Los planes que se pueden comprar en el checkout de este website.
 *
 * ⚠️ **`catalogo === null` NO significa "no hay planes": significa "todavía no
 * sé"**, y ahí se devuelve la lista LOCAL de siempre. Es el mismo fail-open del
 * resto del sitio: mientras el catálogo viaja —o si nunca llega— el formulario
 * sigue vendiendo los cuatro de toda la vida en vez de quedarse en blanco.
 *
 * ⚠️ **`discountable` se DERIVA de `recurring`, no se copia de una lista.** El
 * backend rechaza descuentos en planes de suscripción
 * (`discount.service.js` → `DISCOUNTS_FOR_SUBSCRIPTIONS = false`), así que
 * ofrecer la caja de código a un plan recurrente es prometer algo que el servidor
 * va a rechazar. Con `DISCOUNTABLE_PLANS` —una lista estática— un plan nuevo no
 * podía usar descuentos aunque fuera de pago único.
 */
/**
 * Las viñetas del checkout, con la de CLASES derivada del catálogo.
 *
 * ⚠️⚠️ La frase de clases NO puede vivir en `checkoutFeatures`. Escrita a mano
 * decía *"1 hora de clase diaria"* para Premium —que son lunes a jueves— y
 * *"3 sesiones privadas 1:1 por semana"* para Personalizado —que es 1—, y esas
 * dos cadenas viajaban hasta **la descripción del producto DENTRO de Stripe**:
 * el comprador leía en su propio recibo un número que el producto no cumple.
 *
 * Derivándola, cambiar los días o la frecuencia en Admin › Planes mueve la card,
 * la landing, la pantalla de pago y el recibo a la vez. Que es de lo que va esto.
 */
function conLaFraseDeClases(
  features: string[],
  fila: { liveClasses?: boolean | null; classDays?: number[] | null; classMode?: string | null; sessionsPerWeek?: number | null } | undefined,
): string[] {
  const frase = fila
    ? fraseDeClases(fila.liveClasses ?? null, fila.classDays ?? [], fila.classMode, fila.sessionsPerWeek)
    : null;
  // Va PRIMERA: es lo que decide la compra de un plan con clases en vivo.
  return frase ? [frase, ...features] : features;
}

export function planesDeCheckout(
  catalogo: Array<{
    key: string;
    label: string;
    priceCents: number;
    recurring: boolean;
    studentCheckout: boolean;
    features: string[];
    liveClasses?: boolean | null;
    classDays?: number[] | null;
    classMode?: string | null;
    sessionsPerWeek?: number | null;
  }> | null,
): PlanDeCheckout[] {
  if (!catalogo) {
    return PLAN_LIST.filter((p) => p.checkout).map((p) => ({
      key: p.key,
      label: p.label,
      nombreEnCheckout: p.key,
      priceCents: p.priceCents,
      recurring: p.recurring,
      discountable: !p.recurring,
      tagline: p.checkoutTagline ?? "",
      features: p.checkoutFeatures ?? [],
      sinFichaLocal: false,
    }));
  }

  return catalogo
    .filter((p) => p.studentCheckout)
    .map((p) => {
      const local = PLAN_MAP[p.key];
      return {
        key: p.key,
        label: local?.label ?? p.label,
        nombreEnCheckout: local ? local.key : p.label,
        // El PRECIO sale siempre del catálogo, también para los planes que sí
        // tienen ficha local: es el que el backend va a cobrar.
        priceCents: p.priceCents,
        recurring: p.recurring,
        discountable: !p.recurring,
        tagline: local?.checkoutTagline ?? "",
        // El copy local gana; las viñetas del admin rellenan al plan que no lo
        // tiene, igual que en las cards de /paso-tres.
        features: conLaFraseDeClases(
          local?.checkoutFeatures?.length ? local.checkoutFeatures : p.features,
          p,
        ),
        sinFichaLocal: !local,
      };
    });
}

/** "Incluye: a · b · c" — la descripción del producto que se manda a Stripe. */
export function descripcionDeCheckout(plan: PlanDeCheckout | undefined): string {
  const f = plan?.features ?? [];
  return f.length ? `Incluye: ${f.join(" · ")}` : "";
}

export function getPlan(key: string): PlanDef | undefined {
  return PLAN_MAP[key];
}
export function planPriceDisplay(key: string): string {
  const p = PLAN_MAP[key];
  return p ? `$${Math.round(p.priceCents / 100)}` : "";
}
export function isSubscriptionPlan(key: string): boolean {
  return !!PLAN_MAP[key]?.recurring;
}
// true = el plan agenda su primera clase tras pagar (p. ej. Premium).
/**
 * @deprecated Lo sustituye `pideHorario(catalogo, key)`, que lee el CATÁLOGO.
 * Esta versión mira `PLAN_MAP`, la lista estática de cuatro, así que un plan
 * abierto en el admin nunca podría pedir horario — y pedirlo es justo lo que
 * hace que su alumno acabe con una clase asignada.
 */
export function requiresScheduling(key: string): boolean {
  return !!PLAN_MAP[key]?.requiresScheduling;
}

/**
 * ¿Este plan pide el horario de la primera clase al comprarlo?
 *
 * Lo dice el catálogo, que a su vez lo lee de Admin › Planes de la plataforma.
 * **Respaldo en la lista local** mientras el catálogo carga o si no responde:
 * misma doctrina que `planesDeCheckout()` y que `PRECIO_DE_RESPALDO`.
 */
/**
 * ¿Este plan se RENUEVA?
 *
 * ⚠️ Lo dice el catálogo, con la lista local de respaldo — mismo patrón que
 * `pideHorario`. `isSubscriptionPlan` mira `PLAN_MAP`, los cuatro de siempre, así
 * que un plan abierto en Admin › Planes salía SIEMPRE como pago único: el
 * checkout le decía *"Cancela cuando quieras desde tu portal"* y `/success`, unos
 * minutos después, **"sin renovación automática"**. Dos pantallas de la misma
 * compra contradiciéndose sobre si le van a volver a cobrar.
 */
export function esPlanQueRenueva(
  catalogo: Array<{ key: string; recurring: boolean }> | null,
  key: string,
): boolean {
  const fila = catalogo?.find((p) => p.key === key);
  return fila ? fila.recurring : !!PLAN_MAP[key]?.recurring;
}

export function pideHorario(
  catalogo: Array<{ key: string; requiresScheduling: boolean }> | null,
  key: string,
): boolean {
  const fila = catalogo?.find((p) => p.key === key);
  return fila ? fila.requiresScheduling : !!PLAN_MAP[key]?.requiresScheduling;
}
/**
 * @deprecated Lo sustituye `planesDeCheckout()`, que deriva esto de `recurring`
 * en vez de leer una lista estática — así un plan abierto en el admin también
 * puede llevar descuento. Se conserva sin usar, como el resto de lo superado en
 * este repo, por si alguna pantalla vieja lo necesita.
 */
export function isDiscountablePlan(key: string): boolean {
  return DISCOUNTABLE_PLANS.includes(key as PlanKey);
}
// Color (clase Tailwind bg) por plan, con fallback gris seguro.
export function planColor(key: string): string {
  return PLAN_MAP[key]?.adminColor ?? "bg-gray-400";
}
// Clases de chip/badge (bg+text) por plan, con fallback gris seguro.
export function planBadgeClass(key: string): string {
  return PLAN_MAP[key]?.badgeClass ?? "bg-gray-100 text-gray-700";
}
export function planLabel(key: string): string {
  return PLAN_MAP[key]?.label ?? key;
}
// Tagline y bullets del plan para el resumen del checkout.
//
// @deprecated Los usa `planesDeCheckout()` a través de `PLAN_MAP`; las pantallas
// leen ya el plan resuelto, que rellena con las viñetas del admin cuando no hay
// copy local. Se conservan sin montar.
export function checkoutTagline(key: string): string {
  return PLAN_MAP[key]?.checkoutTagline ?? "";
}
export function checkoutFeatures(key: string): string[] {
  return PLAN_MAP[key]?.checkoutFeatures ?? [];
}
// Descripción del producto que se envía a Stripe ("Incluye: a · b · c").
export function checkoutDescription(key: string): string {
  const feats = checkoutFeatures(key);
  return feats.length ? `Incluye: ${feats.join(" · ")}` : "";
}
