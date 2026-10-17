/*
  Google Analytics 4 — el ID y los eventos del embudo de compra.

  El ID sale de `NEXT_PUBLIC_GA_ID`, con la propiedad del negocio como
  respaldo SOLO en producción (ver `GA_ID_PRODUCCION`). Sustituye al ID que
  estaba escrito a mano en el layout (`G-KQMHGX2CRD`), retirado el 2026-10-12
  porque nadie tenía ya acceso a esa propiedad.

  ⚠️ Se inlinea EN EL BUILD, como todas las `NEXT_PUBLIC_*`: cambiarla en
  Vercel no surte efecto hasta el despliegue siguiente.

  Los eventos usan los nombres RECOMENDADOS de GA4 para comercio electrónico
  (`view_item_list` → `select_item` → `begin_checkout` → `purchase`), que es lo
  que hace que GA arme solo el informe de embudo y el de ingresos por plan.
  El "item" es el plan: su clave del catálogo como `item_id`.

  ⚠️ Nada de aquí puede romper una compra: si GA no cargó (bloqueador de
  anuncios, sin ID, red), cada llamada es un no-op silencioso.
*/

/*
  La propiedad del negocio, creada el 2026-10-12. Va escrita como respaldo de
  PRODUCCIÓN para que el despliegue mida aunque nadie añada la variable en
  Vercel (el ID de GA no es secreto: viaja en el HTML de cada página).

  ⚠️ En DESARROLLO no hay respaldo: `next dev` solo mide si `.env.local` trae
  `NEXT_PUBLIC_GA_ID`. Sin eso, cada prueba en local contaría visitas y compras
  falsas en los informes del negocio.
*/
const GA_ID_PRODUCCION = "G-EP0TXPKE28";

export const GA_ID =
  process.env.NEXT_PUBLIC_GA_ID?.trim() ||
  (process.env.NODE_ENV === "production" ? GA_ID_PRODUCCION : "");

const MONEDA = "USD";

type Gtag = (...args: unknown[]) => void;

function gtag(...args: unknown[]) {
  if (!GA_ID || typeof window === "undefined") return;
  try {
    const fn = (window as unknown as { gtag?: Gtag }).gtag;
    fn?.(...args);
  } catch {
    // Medir nunca puede tumbar la página.
  }
}

export interface PlanMedido {
  /** Clave del catálogo ("Premium", "PERSONALIZED_PLUS"…). */
  clave: string;
  /** Lo que el comprador lee; si falta, la clave. */
  nombre?: string;
  /** En CENTAVOS, como todo el catálogo. */
  priceCents?: number | null;
}

function item(p: PlanMedido, posicion?: number) {
  return {
    item_id: p.clave,
    item_name: p.nombre || p.clave,
    item_category: "plan",
    ...(typeof p.priceCents === "number" ? { price: p.priceCents / 100 } : {}),
    ...(posicion !== undefined ? { index: posicion } : {}),
    quantity: 1,
  };
}

/** /paso-tres enseñó sus cards. */
export function medirListaDePlanes(planes: PlanMedido[]) {
  if (!planes.length) return;
  gtag("event", "view_item_list", {
    item_list_id: "planes",
    item_list_name: "Planes",
    items: planes.map((p, i) => item(p, i)),
  });
}

/** Clic en "Seleccionar" de una card. */
export function medirPlanElegido(plan: PlanMedido) {
  gtag("event", "select_item", {
    item_list_id: "planes",
    item_list_name: "Planes",
    items: [item(plan)],
  });
}

/**
 * El comprador envió el formulario y se va a pedir la sesión de Stripe.
 * `flujo` distingue el checkout público de la recompra del alumno.
 */
export function medirInicioDePago(
  plan: PlanMedido,
  flujo: "publico" | "alumno",
  extra?: { coupon?: string },
) {
  gtag("event", "begin_checkout", {
    currency: MONEDA,
    ...(typeof plan.priceCents === "number" ? { value: plan.priceCents / 100 } : {}),
    flujo,
    ...(extra?.coupon ? { coupon: extra.coupon } : {}),
    items: [item(plan)],
  });
}

/**
 * Compra confirmada en /success.
 *
 * ⚠️ Se manda UNA vez por sesión de Stripe. GA4 ya deduplica por
 * `transaction_id`, pero solo dentro de la misma sesión de GA; recargar
 * /success al día siguiente contaría la venta dos veces. Por eso se recuerda
 * en `localStorage` también.
 *
 * `amountCents` es lo COBRADO (con descuento), no el precio de lista.
 */
export function medirCompra(sessionId: string, plan: PlanMedido, amountCents: number | null) {
  if (!GA_ID || !sessionId) return;
  const marca = `ga_compra_${sessionId}`;
  try {
    if (localStorage.getItem(marca)) return;
  } catch {
    // Sin almacenamiento: GA deduplica por transaction_id igualmente.
  }
  const value = typeof amountCents === "number" ? amountCents / 100 : undefined;
  gtag("event", "purchase", {
    transaction_id: sessionId,
    currency: MONEDA,
    ...(value !== undefined ? { value } : {}),
    items: [{ ...item(plan), ...(value !== undefined ? { price: value } : {}) }],
  });
  try {
    localStorage.setItem(marca, "1");
  } catch {
    // ídem
  }
}
