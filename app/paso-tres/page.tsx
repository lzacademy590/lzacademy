"use client";

import Image from "next/image";
import { Suspense, useState, useEffect, useMemo, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { usePlanCupos } from "@/app/hooks/usePlanCupos";
import { fraseDeClases } from "@/app/lib/dias-de-clase";
import { medirListaDePlanes, medirPaso, medirPlanElegido, medirRecomendacion, type PlanMedido } from "@/app/lib/analitica";
import { recomendarPlan } from "@/app/lib/recomendacion";
import { usePlanCohorte } from "@/app/hooks/usePlanCohorte";
import ConfianzaDeCompra from "@/app/components/ConfianzaDeCompra";
import { unidadDePrecio, notaDeCobro } from "@/app/components/PrecioDelPlan";
import ProgresoDelEmbudo from "@/app/components/ProgresoDelEmbudo";
import {
  usePlanesDelCatalogo,
  useCatalogoDePlanes,
  precioEtiqueta,
} from "@/app/hooks/usePlanesDelCatalogo";

// ─────────────────────────────────────────────────────────────────────────────
// LAS CARDS SE DIBUJAN DEL CATÁLOGO, NO DE ESTA LISTA (2026-09-06)
//
// Antes esto era `const plans = [...]`: la lista de cuatro planes, con su precio
// escrito a mano. Ahora la LISTA la manda `GET /config/plans` —que a su vez trae
// nombre, precio y viñetas del admin de la plataforma— y esto se queda con lo
// que el catálogo no puede saber: el ARTE y el copy de marketing de cada card.
//
// El objetivo: abrir un plan en el admin y que aparezca aquí sin tocar código.
//
// ⚠️ **El copy LOCAL gana sobre el del catálogo cuando existe**, y es deliberado:
// aquí Premium tiene 9 viñetas y en el admin 3. Pisarlas con las del catálogo
// sería empeorar la página que vende. El catálogo rellena lo que aquí no está —
// que es justo el caso de un plan nuevo.
//
// ⚠️ **Un plan sin entrada aquí solo se enseña si viene de la PLATAFORMA**
// (`soloEnPlataforma`). El legacy tiene un "Speaking" que nunca ha salido en esta
// página —tiene su propio embudo— y hacerlo aparecer por reordenar el catálogo
// sería una regresión silenciosa. La regla es: copy propio, o plan nuevo.
// ─────────────────────────────────────────────────────────────────────────────

interface Presentacion {
  id: string;
  nombre: string;
  subtitle?: string;
  cardBg: string;
  nameColor: string;
  checkColor: string;
  backBg: string;
  btnColor: string;
  popular: boolean;
  badge: { text: string; bg: string; color: string } | null;
  route: string;
  muñeca: string;
  features: string[];
}

/**
 * Arte y copy por plan, indexado por la CLAVE del catálogo (no por el id de la
 * card): es lo único que los dos lados comparten sin ambigüedad.
 */
const PRESENTACION: Record<string, Presentacion> = {
  Essential: {
    id: "essential",
    nombre: "Plan\nEssential",
    subtitle: "Empieza con lo esencial para avanzar rápido:",
    cardBg: "#fef0f0",
    nameColor: "#C0353E",
    checkColor: "#C0353E",
    backBg: "#C0353E",
    btnColor: "#C0353E",
    popular: false,
    badge: null,
    route: "/essential",
    muñeca: "/muñecapaso3essential.webp",
    features: [
      "Acceso completo al Método 590",
      "Acceso completo a la plataforma",
      "Comunidad en WhatsApp",
      "Material organizado por sesiones y nivel",
      "Método paso a paso",
      "Reuniones de práctica los viernes",
    ],
  },
  Premium: {
    id: "premium",
    nombre: "Plan\nPremium",
    subtitle: "Todo lo de Essential, más:",
    cardBg: "#bf3d6d",
    nameColor: "#fff",
    checkColor: "#fff",
    backBg: "#d63060",
    btnColor: "#d63060",
    popular: true,
    badge: { text: "Recomendado", bg: "#f5d9a0", color: "#7a4a00" },
    route: "/premium",
    muñeca: "/muñecapaso3premium.webp",
    features: [
      "Acceso completo al Método 590",
      // Los días NO van escritos aquí: los manda el catálogo y se pintan en su
      // propia línea (`clasesLinea`). Escritos en la viñeta se contradecían con
      // la landing de Premium, que decía "lunes a miércoles". La frecuencia y
      // los días los pinta `ClasesDelPlan` desde el catálogo, aquí abajo.
      "1 hora de clase en vivo",
      "Reuniones de práctica los viernes",
      "Explicación clara de teoría",
      "Práctica guiada en cada clase",
      "Práctica hablada diaria",
      "Seguimiento y motivación constante",
      "Guía para completar tus sesiones diarias",
      "Estructura para lograr fluidez en menos tiempo",
    ],
  },
  Personalizado: {
    id: "personalizada",
    nombre: "Plan\nPersonalizado",
    subtitle: "Todo lo de Premium, más:",
    cardBg: "#a02845",
    nameColor: "#fff",
    checkColor: "#fff",
    backBg: "#9c1a38",
    btnColor: "#9c1a38",
    popular: false,
    badge: { text: "Solo para ti", bg: "#c7f2e0", color: "#145c3c" },
    route: "/personalizado",
    muñeca: "/muñecapaso3personalizada.webp",
    features: [
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
  Fluidez: {
    id: "fluidez",
    nombre: "Programa\nde Fluidez",
    subtitle: "Todo lo de Premium, más:",
    cardBg: "#8a1f3d",
    nameColor: "#fff",
    checkColor: "#fde68a",
    backBg: "#6d1228",
    btnColor: "#6d1228",
    popular: false,
    badge: { text: "Cupos limitados", bg: "#fde68a", color: "#7a4a00" },
    route: "/fluidez",
    muñeca: "/muñecapaso3fluency.webp",
    features: [
      "1 Sesión de coaching enfocado en speaking 1:1 semanal",
      "Acceso completo al Método 590",
      "Comunidad en Whatsapp",
      "Diagnóstico de tus bloqueos al hablar",
      "Plan de acción escrito, semana a semana",
      "Feedback y corrección mientras hablas",
      "Reporte de tu progreso de fluidez",
      "Enfoque 100% en romper la barrera de hablar",
    ],
  },
};

/**
 * Con qué se pinta un plan que todavía no tiene arte propio.
 *
 * ⚠️ **Se REUTILIZA la muñeca de Premium a propósito** (decisión de negocio del
 * 2026-09-06: *"el arte no importa que se repita en estos momentos"*). Un plan
 * recién abierto en el admin tiene que poder venderse el mismo día; esperar a que
 * exista su ilustración es lo que convertiría esto en un cuello de botella.
 *
 * La paleta es la de Premium oscurecida, para que no compita con la card
 * "Recomendado" siendo idéntica a ella.
 */
const PRESENTACION_POR_DEFECTO: Omit<Presentacion, "id" | "route"> = {
  nombre: "",
  subtitle: "Incluye:",
  cardBg: "#9c2352",
  nameColor: "#fff",
  checkColor: "#fff",
  backBg: "#7d1a41",
  btnColor: "#7d1a41",
  popular: false,
  badge: null,
  muñeca: "/muñecapaso3premium.webp",
  features: [],
};
/**
 * Orden y precios de RESPALDO, para cuando el catálogo todavía no ha llegado o
 * no responde. Son los cuatro planes de siempre con su importe actual: una
 * pantalla de precios en blanco no vende nada, y estos ya estaban escritos aquí.
 *
 * ⚠️ Es lo ÚNICO que queda escrito a mano del precio, y solo se ve durante el
 * primer render. En cuanto el catálogo contesta manda él.
 */
const ORDEN_DE_RESPALDO = ["Essential", "Premium", "Personalizado", "Fluidez"];
const PRECIO_DE_RESPALDO: Record<string, number> = {
  Essential: 1000,
  Premium: 5000,
  Personalizado: 12000,
  Fluidez: 20000,
};
/**
 * Y su MODELO DE COBRO de respaldo.
 *
 * ⚠️ Hacía falta desde que la nota de cobro sale del catálogo: el respaldo
 * declaraba `recurring: false` para los cuatro, así que con el catálogo caído
 * Essential y Premium —que SÍ se renuevan— habrían anunciado "Pago único · sin
 * renovación automática". Un precio de ayer es un mal menor aceptable; decirle a
 * alguien que no se le va a cobrar otra vez cuando sí, no lo es.
 */
const RECURRENTE_DE_RESPALDO: Record<string, boolean> = {
  Essential: true,
  Premium: true,
  Personalizado: false,
  Fluidez: false,
};

/**
 * Dónde se compra un plan que este sitio no sabe vender.
 *
 * ⚠️ Es una decisión de embudo, no un detalle: manda al comprador a la
 * plataforma, que sí sabe cobrar cualquier plan de su tabla. La alternativa era
 * no enseñar el plan, y entonces abrirlo en el admin no serviría de nada.
 */
const PLATAFORMA_URL =
  process.env.NEXT_PUBLIC_PLATFORM_URL || "https://app.lainz590.com";


/**
 * A dónde manda un plan que no tiene landing escrita a mano.
 *
 * ⚠️⚠️ **Lo usan la CARTA y la RAMA elegida, y por eso vive aquí.** Estaba escrito
 * en línea dentro de la carta, así que la escalera cambiaba el precio y NO el
 * destino: elegir "5 clases por semana · $210" y pulsar Seleccionar llevaba a la
 * landing de la BASE, que anuncia $120. Medido en el navegador, no leyendo.
 *
 * La base con copy propio conserva su landing escrita a mano (`/personalizado`);
 * esto es para las ramas y para los planes abiertos en el admin.
 */
function rutaDelPlan(clave: string, soloEnPlataforma?: boolean): string {
  return soloEnPlataforma
    ? `${PLATAFORMA_URL}/pricing?plan=${encodeURIComponent(clave)}`
    : `/plan/${clave.toLowerCase()}`;
}

/**
 * La ESCALERA de una familia: sus ramas en filas, cada una con su precio.
 *
 * ⚠️ Antes esto era un precio grande con un selector de pastillas debajo, y
 * comparar $150 con $210 obligaba a tocar, leer, tocar otra vez y ACORDARSE —
 * el patrón de un selector de talla, donde el precio no cambia, aplicado justo
 * a algo en lo que lo que cambia ES el precio. (Decisión de negocio del
 * 2026-09-08; la plataforma monta la misma escalera en `/pricing`.)
 *
 * ⚠️ **Vive aquí y se monta en las DOS rejillas** —la de móvil y el reverso de
 * la carta que gira—. Es la misma lección que dejó escrita la resolución de la
 * rama: dos copias es como acaban enseñando precios distintos del mismo plan.
 *
 * ⚠️ Deja de servir a partir de unas seis ramas: la carta crece con cada una.
 * Ese día la salida no es volver a las pastillas, es mover la elección al
 * checkout, que ya pregunta nivel y fecha.
 */
function EscaleraDeRamas({
  ramas,
  elegidaKey,
  onElegir,
  colorTexto,
  colorBorde,
  fondoActivo,
  textoActivo,
}: {
  ramas: {
    key: string;
    label: string;
    priceCents: number;
    features: string[];
    sessionsPerWeek?: number | null;
  }[];
  elegidaKey: string | undefined;
  onElegir: (key: string) => void;
  colorTexto: string;
  colorBorde: string;
  fondoActivo: string;
  textoActivo: string;
}) {
  /*
    `role="radio"` ANUNCIA un contrato: las flechas mueven la selección y el
    foco la sigue. Con Tab también se opera, pero un grupo que se presenta como
    radiogroup y no responde a las flechas se lee como que la página está rota.
  */
  const teclado = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const paso =
      e.key === "ArrowRight" || e.key === "ArrowDown"
        ? 1
        : e.key === "ArrowLeft" || e.key === "ArrowUp"
          ? -1
          : 0;
    if (!paso) return;
    e.preventDefault();
    const i = ramas.findIndex((r) => r.key === elegidaKey);
    const j = (Math.max(i, 0) + paso + ramas.length) % ramas.length;
    onElegir(ramas[j].key);
    e.currentTarget.querySelectorAll<HTMLElement>('[role="radio"]')[j]?.focus();
  };

  return (
    <div
      role="radiogroup"
      aria-label="Elige cuántas clases por semana"
      onKeyDown={teclado}
      className="flex w-full flex-col gap-1.5"
    >
      {ramas.map((r, i) => {
        const activa = r.key === elegidaKey;
        /*
          ⚠️ Lo que añade sobre la fila ANTERIOR, no sobre la base: contra la
          base, todas las ramas de arriba abren con la MISMA viñeta y lo que de
          verdad las distingue queda escondido. En una escalera, cada peldaño
          dice lo que añade el peldaño.
        */
        const previas = new Set(ramas[i - 1]?.features ?? r.features);
        const suya = r.features.find((f) => !previas.has(f));
        return (
          <button
            key={r.key}
            type="button"
            role="radio"
            aria-checked={activa}
            tabIndex={activa ? 0 : -1}
            onClick={(e) => {
              // En escritorio la escalera vive DENTRO de la carta que gira: sin
              // esto, elegir una fila la voltea.
              e.stopPropagation();
              onElegir(r.key);
            }}
            className="flex min-h-11 w-full items-center gap-2 rounded-xl px-3 py-2 text-left transition"
            style={
              activa
                ? { backgroundColor: fondoActivo, color: textoActivo }
                : { border: `1.5px solid ${colorBorde}`, color: colorTexto }
            }
          >
            <span className="min-w-0 flex-1">
              <span className="block text-[13px] font-extrabold leading-tight">
                {r.sessionsPerWeek
                  ? r.sessionsPerWeek === 1
                    ? "1 clase por semana"
                    : `${r.sessionsPerWeek} clases por semana`
                  : r.label}
              </span>
              {suya && (
                <span className="mt-0.5 block text-[10.5px] font-semibold leading-tight opacity-75">
                  + {suya}
                </span>
              )}
            </span>
            <span className="shrink-0 text-[15px] font-extrabold tabular-nums">
              {precioEtiqueta(r.priceCents)}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function PasosTresContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nivel = searchParams.get("nivel") ?? "";
  const dificultades = searchParams.get("dificultades") ?? "";
  const { isPlanAvailable, cuposLabel } = usePlanCupos();
  const { requiresCohort, loading: cargandoCohorte } = usePlanCohorte();
  /*
    Las cards se DERIVAN del catálogo. Ver el bloque de `PRESENTACION` arriba:
    la lista y el precio los manda el backend (y detrás, el admin de la
    plataforma); el arte y el copy salen de aquí.
  */
  const catalogo = usePlanesDelCatalogo();

  /*
    Mientras el catálogo no ha llegado —o si no llega nunca— se pintan los planes
    con copy propio, en el orden de siempre y con su precio de respaldo. Es lo que
    evita que la pantalla de precios aparezca vacía por un fallo de red.
  */
  const plans = useMemo(() => {
    const filas =
      catalogo ??
      ORDEN_DE_RESPALDO.map((key) => ({
        key,
        label: key,
        priceCents: PRECIO_DE_RESPALDO[key],
        recurring: RECURRENTE_DE_RESPALDO[key] === true,
        soloEnPlataforma: false,
        origenPlataforma: false,
        features: [] as string[],
        // Sin catálogo no se sabe: `null` calla la línea de clases en vez de
        // anunciar que ningún plan tiene. Ver `fraseDeClases`.
        liveClasses: null as boolean | null,
        classDays: [] as number[],
        classMode: null as string | null,
        sessionsPerWeek: null as number | null,
      }));

    return filas
      /*
        Copy propio, o plan que vino de la plataforma. Ver el ⚠️ de `PRESENTACION`:
        el "Speaking" del legacy nunca ha salido en esta página y no debe empezar
        a salir por haber reordenado el catálogo.

        ⚠️⚠️ Aquí se filtraba por `soloEnPlataforma`, y eso hacía DESAPARECER la
        card justo cuando el plan empezaba a poder comprarse: desde el 2026-09-06
        el legacy ADOPTA los planes que llegan completos, y un plan adoptado ya no
        es "solo de la plataforma". La pregunta para PINTAR es de dónde VINO, no
        dónde se cobra.
      */
      .filter((f) => PRESENTACION[f.key] || f.origenPlataforma)
      /*
        ⚠️ **Las RAMAS no son cartas: van dentro de la de su base.** Un plan con
        `family` distinto de su propia clave se pinta como una opción dentro de
        la carta de su familia, no al lado. Sin esto, abrir cuatro ramas del
        Personalizado llenaría la rejilla de tarjetas casi idénticas — que es
        exactamente lo que la familia viene a evitar.

        ⚠️ Una rama HUÉRFANA —su base no está en el catálogo— sí se pinta sola:
        perder un plan comprable en silencio es peor que enseñarlo sin familia.
      */
      .filter((f) => {
        const familia = (f as { family?: string | null }).family;
        if (!familia || familia === f.key) return true;
        return !filas.some((o) => o.key === familia);
      })
      .map((f) => {
        const arte = PRESENTACION[f.key];
        const base = arte ?? {
          ...PRESENTACION_POR_DEFECTO,
          id: f.key.toLowerCase(),
          /*
            Un plan sin copy propio va a su LANDING GENÉRICA (`/plan/<clave>`),
            que la arma con el catálogo: misma maqueta que las cuatro escritas a
            mano, con el contenido del admin.

            ⚠️ Antes esto mandaba a `/pricing` de la plataforma, porque este sitio
            no sabía ni cobrarlo ni pintarlo. Las dos cosas se cerraron el
            2026-09-06; el respaldo a la plataforma sigue abajo, para el plan que
            este backend NO sabe cobrar.
          */
          route: rutaDelPlan(f.key, f.soloEnPlataforma),
        };
        /*
          Las ramas de esta familia, de más barata a más cara. La base incluida:
          es la primera opción del selector, no un caso aparte.
        */
        const ramas = filas
          .filter((o) => {
            const fam = (o as { family?: string | null }).family;
            return fam ? fam === f.key : o.key === f.key;
          })
          .sort((a, b) => a.priceCents - b.priceCents);

        return {
          ...base,
          // La clave del CATÁLOGO (la carta se identifica por `id`, que es el de
          // la presentación). La necesita el selector de ramas.
          claveDelPlan: f.key,
          ramas: ramas.length > 1 ? ramas : [],
          // El nombre sale del catálogo cuando no hay copy propio: es lo que el
          // admin tecleó, y el salto de línea de los nombres de siempre no se
          // puede inventar para un plan nuevo.
          name: arte ? arte.nombre : f.label,
          price: precioEtiqueta(f.priceCents),
          // Para la analítica: el precio de la etiqueta ya viene formateado.
          precioCents: f.priceCents,
          /*
            ⚠️ La misma regla que las landings (`unidadDePrecio`): "/ 28 días" solo
            si se REPITE. En un pago único decía "$200 USD / 28 días" con
            "Pago único" debajo — la tarifa y su desmentido en la misma carta.
          */
          priceUnit: unidadDePrecio(f.recurring === true).trim(),
          /*
            ⚠️ **La nota de cobro sale del DATO, no del copy local.** Aquí ganaba
            un `billingNote` escrito por plan aquí abajo, así que si el admin
            cambiaba un plan de suscripción a pago único, esta card seguía diciendo
            "Facturación automática cada 4 semanas". Es un dato del catálogo desde
            que el modelo de cobro se edita en el panel, y un texto que contradice
            al cobro es de lo peor que puede haber en una página de precios.

            El copy local sigue mandando en lo que ES copy —viñetas, nombre, arte—;
            esto no lo era.
          */
          // Un pago único dice que cubre 28 días: sin eso, «$200» no se compara con «$50 / 28 días».
          billingNote: notaDeCobro(f.recurring === true),
          /*
            ⚠️⚠️ **Manda el CATÁLOGO; el copy local rellena al plan que no lo trae.**
            Estaba al revés, y era una decisión mía equivocada: la razoné como "no
            empeorar la página que vende" y el efecto era que el admin editaba las
            viñetas de un plan y **el website no se enteraba**. Medido en producción,
            Essential tenía 6 viñetas aquí y 3 en la plataforma, **sin una sola en
            común**; lo mismo Premium (9 contra 3). El mismo plan descrito con
            palabras distintas en las dos pantallas que lo venden.

            El negocio pidió una sola fuente —el panel— y esto es lo que la hace
            valer. El formato ya era compatible: los dos son `string[]` y el legacy
            venía sirviendo las de la plataforma desde antes.

            ⚠️ **Dependencia de despliegue**: las viñetas ricas de `PRESENTACION` se
            copiaron a Admin › Planes ANTES de invertir esto. Si se despliega con el
            panel sin enriquecer, las cards caen a 3 viñetas — el catálogo no está
            vacío, así que el respaldo local no se activa.
          */
          features: f.features.length ? f.features : base.features,
          /*
            ⚠️ **Los días de clase van en su propia línea, no dentro de una
            viñeta**, y el motivo es que las viñetas del catálogo GANAN sobre el
            copy local: los días acabarían dependiendo de que alguien los teclee
            bien en Admin › Planes, que es justo lo que se venía haciendo mal.
            Esto sale de `Plan.diasDeClase`, así que no se puede quedar viejo.
          */
          clasesLinea: fraseDeClases(f.liveClasses ?? null, f.classDays ?? [], f.classMode ?? null, f.sessionsPerWeek ?? null),
          // Para la tabla comparativa: `false` es "sin clases en vivo", `null` es "no se sabe".
          tieneClases: f.liveClasses ?? null,
          externo: !arte,
        };
      });
  }, [catalogo]);

  /** Rama elegida dentro de cada familia. Sin elección manda la más barata. */
  const [ramaPorFamilia, setRamaPorFamilia] = useState<Record<string, string>>({});

  /**
   * La carta, ya resuelta a la rama que el comprador está mirando.
   *
   * ⚠️ El precio, la nota de cobro y las viñetas salen de la RAMA; el nombre, el
   * arte y la ruta, de la carta. La familia solo agrupa la presentación: lo que
   * se compra y se cobra sigue siendo un plan concreto.
   */
  function conLaRamaElegida<
    R extends { key: string; label: string; priceCents: number; features: string[] },
    T extends { claveDelPlan?: string; ramas?: R[] },
  >(carta: T): { ramas: R[]; elegida: R | null } {
    const ramas = carta.ramas ?? [];
    // Una sola rama es un plan suelto: la carta se pinta exactamente como siempre.
    if (ramas.length < 2) return { ramas: [], elegida: null };
    const clave = String(carta.claveDelPlan ?? "");
    return {
      ramas,
      elegida: ramas.find((r) => r.key === ramaPorFamilia[clave]) ?? ramas[0],
    };
  }

  const visiblePlans = plans
    .filter((p) => p.id !== "fluidez" || isPlanAvailable("Fluidez"))
    /*
      ⚠️ La rama se resuelve AQUÍ, una vez, y no dentro de cada rejilla: hay dos
      —móvil y escritorio— y resolverla en cada una es cómo acaban enseñando
      precios distintos del mismo plan.

      El precio y las viñetas salen de la RAMA; el nombre, el arte y la ruta, de
      la carta. La familia agrupa la presentación: lo que se compra sigue siendo
      un plan concreto.
    */
    .map((p) => {
      const { elegida } = conLaRamaElegida(p);
      if (!elegida)
        return {
          ...p,
          esFamilia: false,
          escaleraDiceFrecuencia: false,
          elegida: null as typeof elegida,
        };
      return {
        ...p,
        /*
          Se resuelve AQUÍ y viaja en la carta por lo mismo que la rama: hay dos
          rejillas —móvil y escritorio— y preguntarlo en cada una es como acaban
          pintando cosas distintas del mismo plan.
        */
        esFamilia: true,
        /*
          ¿La escalera ya dice la frecuencia? Se resuelve aquí, con la rama, y no
          en las dos rejillas: la condición de arriba es exactamente la que decide
          qué rótulo pinta cada fila, y separarlas es como acaban discrepando.
        */
        escaleraDiceFrecuencia: !!(
          elegida as { sessionsPerWeek?: number | null }
        ).sessionsPerWeek,
        price: precioEtiqueta(elegida.priceCents),
        /*
          ⚠️ El COBRO de la rama, no el de su base: si una rama se renovara y su
          base no (o al revés), la tarjeta y la barra contradirían al checkout.
        */
        priceUnit: unidadDePrecio((elegida as { recurring?: boolean }).recurring === true).trim(),
        billingNote: notaDeCobro((elegida as { recurring?: boolean }).recurring === true),
        features: elegida.features.length ? elegida.features : p.features,
        /*
          ⚠️⚠️ **Y la RUTA también sale de la rama.** Sin esto la escalera cambiaba
          el precio y no el destino: elegir "5 clases por semana · $210" y pulsar
          Seleccionar llevaba a la landing de la BASE, que anuncia $120 — o sea que
          "elegir es comprar" era falso justo en el clic que compra.

          La base conserva la suya, que es la landing escrita a mano; una rama no
          tiene copy propio y va a la genérica, que se arma con el catálogo.
        */
        route:
          elegida.key === p.claveDelPlan
            ? p.route
            : rutaDelPlan(
                elegida.key,
                (elegida as { soloEnPlataforma?: boolean }).soloEnPlataforma,
              ),
        elegida,
      };
    });

  /*
    La RECOMENDACIÓN según lo que contestó en los pasos 1 y 2 (2026-10-17). Ver
    `lib/recomendacion.ts`. Solo entre las cartas que se enseñan, y la carta
    recomendada pasa a ser la PRIMERA: en móvil es la que se ve sin hacer scroll.
  */
  const clavesVisibles = visiblePlans.map((p) => String(p.claveDelPlan)).join(",");
  const recomendacion = useMemo(
    () => recomendarPlan(nivel, dificultades, clavesVisibles.split(",")),
    [nivel, dificultades, clavesVisibles],
  );
  const esRecomendado = (plan: { claveDelPlan?: string }) =>
    !!recomendacion && recomendacion.clave === plan.claveDelPlan;
  const cartas = recomendacion
    ? [...visiblePlans].sort((a, b) => Number(esRecomendado(b)) - Number(esRecomendado(a)))
    : visiblePlans;

  const recomendacionMedida = useRef<string | null>(null);
  useEffect(() => {
    if (!recomendacion || recomendacionMedida.current === recomendacion.clave) return;
    recomendacionMedida.current = recomendacion.clave;
    medirRecomendacion(recomendacion.clave);
  }, [recomendacion]);

  /*
    El badge de cada carta. ⚠️ Con una recomendación PERSONAL, el "Recomendado"
    fijo de Premium se retira: dos cartas diciendo "recomendado" a la vez —una
    para ti y otra para todos— es no recomendar ninguna.
  */
  function badgeDe(plan: (typeof visiblePlans)[number]): { text: string; bg: string; color: string } | null {
    if (esRecomendado(plan)) return { text: "Recomendado para ti", bg: "#fde68a", color: "#7a4a00" };
    if (!plan.badge) return null;
    if (recomendacion && plan.badge.text === "Recomendado") return null;
    // Para Fluidez usa el conteo real de cupos cuando está disponible.
    const text = plan.id === "fluidez" ? cuposLabel("Fluidez") || plan.badge.text : plan.badge.text;
    return { ...plan.badge, text };
  }
  /*
    Qué plan mide la analítica para una carta: la RAMA elegida si es una
    familia (es lo que se compra), y si no, el plan de la carta.
  */
  function planMedido(plan: (typeof visiblePlans)[number]): PlanMedido {
    if (plan.elegida)
      return { clave: plan.elegida.key, nombre: plan.elegida.label, priceCents: plan.elegida.priceCents };
    return {
      clave: String(plan.claveDelPlan),
      nombre: plan.name.replace(/\s+/g, " "),
      priceCents: plan.precioCents,
    };
  }

  /*
    `view_item_list` UNA vez, y solo con el catálogo de verdad: las cartas de
    respaldo llevan precios de ayer y medirlas contaría una lista que el
    comprador quizá ni vio.
  */
  const listaMedida = useRef(false);
  useEffect(() => {
    if (listaMedida.current || !catalogo) return;
    listaMedida.current = true;
    medirListaDePlanes(visiblePlans.map(planMedido));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catalogo]);

  /*
    El paso 2 del «sitio simple» (2026-11-18): elegir aquí ES elegir, sin pasar
    por la landing del plan. La tarjeta elegida se marca, «Qué incluye» se
    despliega dentro de la misma tarjeta, y la barra fija de abajo lleva a la
    inscripción con ESE plan.

    El plan preelegido: el de `?plan=` (lo mandan las tarjetas del inicio y las
    landings viejas, que ahora redirigen aquí) o, sin él, el RECOMENDADO. Sin
    ninguno de los dos no se preelige nada: quien entra por «Planes» elige él.

    ⚠️⚠️ **Un `?plan=` que no se encuentra NUNCA cae a otro plan.** Caía a
    `cartas[0]` y, con el catálogo lento o caído, `/plan/personalized_inmersion`
    acababa en «Continuar con Plan Essential · $10» sin un solo aviso (medido por
    QA y el comprador adversario, 2026-11-18). Es el bloqueante de dinero que
    `/paso-cuatro` ya cerró el 2026-09-09, reaparecido un paso antes. Se
    distinguen tres casos: el catálogo aún carga, falló, o ese plan no está
    (retirado, agotado, inventado).
  */
  const { estado: estadoDelCatalogo, reintentar: reintentarCatalogo } = useCatalogoDePlanes();
  const planDelEnlace = (searchParams.get("plan") ?? "").trim().toLowerCase();
  const pidioPlan = planDelEnlace !== "";
  const cartaDelEnlace = cartas.find(
    (p) =>
      String(p.claveDelPlan).toLowerCase() === planDelEnlace ||
      p.ramas.some((r) => r.key.toLowerCase() === planDelEnlace),
  );
  const planDelEnlacePendiente = pidioPlan && !cartaDelEnlace;
  const fluidezAgotado = planDelEnlace === "fluidez" && !isPlanAvailable("Fluidez");
  const avisoDelEnlace: "cargando" | "fallo" | "agotado" | "no-esta" | null = !planDelEnlacePendiente
    ? null
    : fluidezAgotado
      ? "agotado"
      : estadoDelCatalogo === "cargando"
        ? "cargando"
        : estadoDelCatalogo === "fallo"
          ? "fallo"
          : "no-esta";
  const [elegida, setElegida] = useState<string | null>(null);
  const [abierta, setAbierta] = useState<string | null>(null);
  const porDefecto = pidioPlan ? cartaDelEnlace : cartas.find((p) => esRecomendado(p));
  const claveElegida = elegida ?? (porDefecto ? String(porDefecto.claveDelPlan) : null);
  const claveAbierta = abierta === null ? claveElegida : abierta;
  const cartaElegida = claveElegida ? cartas.find((p) => String(p.claveDelPlan) === claveElegida) : undefined;
  // La clave que se COBRA: la rama elegida si es una familia. Su cohorte manda en la barra.
  const claveCobrada = cartaElegida ? (cartaElegida.elegida?.key ?? String(cartaElegida.claveDelPlan)) : null;

  // Si el enlace nombraba una RAMA, se deja elegida dentro de su familia.
  useEffect(() => {
    if (!cartaDelEnlace) return;
    const rama = cartaDelEnlace.ramas.find((r) => r.key.toLowerCase() === planDelEnlace);
    if (rama) setRamaPorFamilia((prev) => ({ ...prev, [String(cartaDelEnlace.claveDelPlan)]: rama.key }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartaDelEnlace?.claveDelPlan, planDelEnlace]);

  const pasoMedido = useRef(false);
  useEffect(() => {
    if (pasoMedido.current) return;
    pasoMedido.current = true;
    medirPaso("paso_dos_visto");
  }, []);

  function handleSeleccionar(plan: (typeof visiblePlans)[number]) {
    medirPlanElegido(planMedido(plan));
    /*
      ⚠️ Un plan que este sitio no sabe cobrar sigue yendo a la plataforma
      (`rutaDelPlan` con `soloEnPlataforma`). Todo lo demás va directo a la
      inscripción con la clave que se COBRA: la rama elegida si es una familia.
    */
    if (plan.route.startsWith("http")) {
      window.location.href = plan.route;
      return;
    }
    const clave = plan.elegida?.key ?? String(plan.claveDelPlan);
    router.push(
      `/paso-cuatro?plan=${encodeURIComponent(clave)}&nivel=${encodeURIComponent(nivel)}&dificultades=${encodeURIComponent(dificultades)}`,
    );
  }

  const nombreDe = (plan: (typeof visiblePlans)[number]) => plan.name.replace(/\s+/g, " ");
  const volverAlPaso1 = `/paso-uno?nivel=${encodeURIComponent(nivel)}&dificultades=${encodeURIComponent(dificultades)}`;

  return (
    <main className="min-h-[calc(100dvh-72px)] bg-lz-lila pb-44">
      <div className="lz-wrap flex max-w-[960px] flex-col gap-6 pt-10">
        <ProgresoDelEmbudo paso={2} />
        <div className="flex flex-col gap-2.5">
          <h1 className="lz-display text-[34px] sm:text-[44px]">
            {recomendacion ? "Tu plan recomendado" : "Elige tu plan"}
          </h1>
          <p className="lz-lead">
            {recomendacion
              ? recomendacion.motivo
              : "Todos los planes incluyen el Método 590 completo; cambia cuánto acompañamiento tienes en vivo."}
          </p>
          {(nivel || dificultades) && (
            <Link href={volverAlPaso1} className="self-start text-[14px] text-lz-ink2 underline underline-offset-2">
              Cambiar mis respuestas
            </Link>
          )}
        </div>

        {avisoDelEnlace && (
          <div
            role={avisoDelEnlace === "fallo" ? "alert" : "status"}
            className={`lz-card flex flex-wrap items-center gap-3 p-4 ${avisoDelEnlace === "cargando" ? "" : "border-[#e0b860] bg-[#fff8e8]"}`}
          >
            <p className="min-w-0 flex-1 basis-[260px] text-[15px] text-lz-ink">
              {avisoDelEnlace === "cargando" && "Cargando el plan que elegiste…"}
              {avisoDelEnlace === "fallo" &&
                "No pudimos cargar el plan que elegiste. Es un problema nuestro, no de tu enlace."}
              {avisoDelEnlace === "agotado" && "Fluidez está agotado por ahora. Puedes elegir otro plan de la lista."}
              {avisoDelEnlace === "no-esta" &&
                "El plan de tu enlace ya no está disponible. Estos son los planes que puedes contratar ahora."}
            </p>
            {avisoDelEnlace === "fallo" && (
              <button type="button" onClick={reintentarCatalogo} className="lz-btn lz-btn-2 lz-btn-sm">
                Reintentar
              </button>
            )}
          </div>
        )}

        <div role="radiogroup" aria-label="Planes" className="flex flex-col gap-3">
          {cartas.map((plan) => {
            const clave = String(plan.claveDelPlan);
            const on = clave === claveElegida;
            const abiertaEsta = clave === claveAbierta;
            const badge = badgeDe(plan);
            const rec = esRecomendado(plan);
            return (
              <article
                key={plan.id}
                className={`lz-card overflow-hidden ${on ? "border-lz-grape shadow-[0_0_0_3px_var(--color-lz-lila2)]" : ""}`}
              >
                {rec && (
                  <p className="bg-lz-grape px-5 py-2 text-[13px] font-bold text-white">Recomendado para ti</p>
                )}
                <div className="flex flex-wrap items-center gap-4 p-5">
                  <Image
                    src={plan.muñeca}
                    alt={`Ilustración del plan ${nombreDe(plan)}`}
                    width={168}
                    height={168}
                    className="h-[84px] w-[84px] object-contain"
                    sizes="84px"
                  />
                  <div className="flex min-w-0 flex-[1_1_240px] flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h2 className="lz-display text-[26px]">{nombreDe(plan)}</h2>
                      {badge && !rec && <span className="lz-pill lz-pill-ambar">{badge.text}</span>}
                    </div>
                    {plan.clasesLinea && !plan.escaleraDiceFrecuencia && (
                      <p className="text-[14px] font-semibold text-lz-ink2">{plan.clasesLinea}</p>
                    )}
                    <ConfianzaDeCompra clave={clave} className="!justify-start" />
                  </div>
                  <div className="flex min-w-[140px] flex-col items-end">
                    <p>
                      <span className="lz-display text-[34px] tabular-nums text-lz-grape">{plan.price}</span>
                      <span className="text-[13px] text-lz-ink3"> {plan.priceUnit}</span>
                    </p>
                    <p className="text-[12px] font-semibold text-lz-ink2">{plan.billingNote}</p>
                  </div>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => {
                      setElegida(clave);
                      setAbierta(clave);
                    }}
                    className={`lz-btn lz-btn-sm min-w-[120px] ${on ? "lz-btn-1" : "lz-btn-2"}`}
                  >
                    {on ? "Elegido" : "Elegir"}
                  </button>
                </div>

                <div className="border-t border-lz-bd">
                  <button
                    type="button"
                    onClick={() => setAbierta(abiertaEsta ? "" : clave)}
                    aria-expanded={abiertaEsta}
                    className="flex min-h-12 w-full items-center justify-between px-5 text-[14px] font-bold text-lz-grape"
                  >
                    Qué incluye {nombreDe(plan)}
                    <span aria-hidden="true">{abiertaEsta ? "−" : "+"}</span>
                  </button>
                  {abiertaEsta && (
                    <div className="flex flex-wrap gap-7 px-5 pb-5">
                      <ul className="flex min-w-0 flex-[1_1_300px] flex-col gap-2.5">
                        {plan.features.map((feat) => (
                          <li key={feat} className="flex items-start gap-2.5 text-[15px] leading-snug">
                            <span className="lz-tic" aria-hidden="true">✓</span>
                            {feat}
                          </li>
                        ))}
                      </ul>
                      {requiresCohort(clave) && !cargandoCohorte && (
                        <Link
                          href="/horarios"
                          className="basis-full text-[14px] font-bold text-lz-grape underline underline-offset-2"
                        >
                          Ver los horarios de clase publicados
                        </Link>
                      )}
                      {plan.esFamilia && plan.ramas.length > 0 && (
                        <div className="flex min-w-0 flex-[1_1_260px] flex-col gap-2">
                          <p className="text-[14px] font-bold">¿Cuántas sesiones por semana?</p>
                          <EscaleraDeRamas
                            ramas={plan.ramas}
                            elegidaKey={plan.elegida?.key}
                            onElegir={(key) => {
                              setRamaPorFamilia((prev) => ({ ...prev, [clave]: key }));
                              setElegida(clave);
                            }}
                            colorTexto="#1e1029"
                            colorBorde="#cdb8da"
                            fondoActivo="#82159e"
                            textoActivo="#ffffff"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>

        <p className="text-center text-[14px] text-lz-ink2">
          ¿Dudas? Las respuestas a lo más preguntado están en el{" "}
          <Link href="/#preguntas" className="font-bold text-lz-grape underline">inicio</Link>.
        </p>
      </div>

      {!(cartaElegida && claveCobrada) && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-lz-bd bg-white/95 backdrop-blur">
          <div className="lz-wrap flex max-w-[960px] flex-wrap items-center gap-3 py-3">
            <p className="min-w-0 flex-1 basis-[240px] text-[15px] font-semibold text-lz-ink2">
              Elige un plan para continuar
            </p>
            <button type="button" disabled className="lz-btn lz-btn-1 min-h-[52px]">
              Continuar
            </button>
          </div>
        </div>
      )}

      {cartaElegida && claveCobrada && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-lz-bd bg-white/95 backdrop-blur">
          <div className="lz-wrap flex max-w-[960px] flex-wrap items-center gap-3 py-3">
            <div className="flex min-w-0 flex-1 basis-[240px] flex-col">
              <b className="text-[16px]">
                {nombreDe(cartaElegida)} · {cartaElegida.price}
                <span className="font-normal text-lz-ink3"> {cartaElegida.priceUnit}</span>
              </b>
              <span className="text-[13px] text-lz-ink2">
                {/* Sin catálogo no se sabe si va por grupo: no se promete nada. La
                    cohorte que manda es la de la clave que se COBRA (la rama). */}
                {cargandoCohorte || estadoDelCatalogo !== "listo"
                  ? cartaElegida.billingNote
                  : requiresCohort(claveCobrada)
                    ? "Eliges tu fecha y tu horario en el siguiente paso"
                    : "Empiezas hoy mismo"}
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleSeleccionar(cartaElegida)}
              className="lz-btn lz-btn-1 min-h-[52px]"
            >
              Continuar con {nombreDe(cartaElegida)}
            </button>
          </div>
        </div>
      )}

    </main>
  );
}

export default function PasosTresPage() {
  return (
    <Suspense fallback={null}>
      <PasosTresContent />
    </Suspense>
  );
}
