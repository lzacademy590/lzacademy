"use client";

import Image from "next/image";
import { Suspense, useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PreguntasFrecuentes from "@/app/components/Questions";
import { TestimonialsSection } from "@/app/components/Testimonials";
import { usePlanCupos } from "@/app/hooks/usePlanCupos";
import {
  usePlanesDelCatalogo,
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
      "1 hora de clase diaria (lunes a jueves)",
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
      "3 sesiones privadas 1:1 por semana adaptadas a ti",
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
      "Feedback y corrección mientras hablás",
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


function PasosTresContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nivel = searchParams.get("nivel") ?? "";
  const dificultades = searchParams.get("dificultades") ?? "";
  const [flipped, setFlipped] = useState<Record<string, boolean>>({});
  const [reducedMotion, setReducedMotion] = useState(false);
  const { isPlanAvailable, cuposLabel } = usePlanCupos();
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
          route: f.soloEnPlataforma
            ? `${PLATAFORMA_URL}/pricing?plan=${encodeURIComponent(f.key)}`
            : `/plan/${f.key.toLowerCase()}`,
        };
        return {
          ...base,
          // El nombre sale del catálogo cuando no hay copy propio: es lo que el
          // admin tecleó, y el salto de línea de los nombres de siempre no se
          // puede inventar para un plan nuevo.
          name: arte ? arte.nombre : f.label,
          price: precioEtiqueta(f.priceCents),
          priceUnit: "USD / 28 días",
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
          billingNote: f.recurring
            ? "Facturación automática cada 4 semanas"
            : "Pago único · sin renovación automática",
          // El copy local gana; el del admin rellena al plan que no lo tiene.
          features: base.features.length ? base.features : f.features,
          externo: !arte,
        };
      });
  }, [catalogo]);

  const visiblePlans = plans.filter((p) => p.id !== "fluidez" || isPlanAvailable("Fluidez"));

  // Texto del badge: para Fluidez usa el conteo real de cupos cuando está disponible.
  function badgeText(plan: (typeof plans)[number]): string | undefined {
    if (plan.id === "fluidez") return cuposLabel("Fluidez") || plan.badge?.text;
    return plan.badge?.text;
  }
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  function toggleFlip(id: string) {
    setFlipped((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function handleSeleccionar(route: string) {
    router.push(
      `${route}?nivel=${encodeURIComponent(nivel)}&dificultades=${encodeURIComponent(dificultades)}`
    );
  }

  function handleVolver() {
    router.back();
  }

  return (
    <main
      className="relative min-h-[calc(100dvh-68px)] overflow-hidden flex flex-col"
      style={{ backgroundColor: "#9c1a38" }}
    >
      {/* Textura de puntos */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)",
          backgroundSize: "18px 18px",
        }}
      />

      {/* Título */}
      <div className="relative z-10 w-full flex flex-col items-center pt-8 pb-6 px-4">

        <div className="w-full flex justify-end mb-2">
          <button
            type="button"
            onClick={handleVolver}
            className="inline-flex items-center rounded-2xl px-6 py-2.5 text-[14px] font-bold text-zinc-700 bg-white shadow-sm transition hover:shadow-md active:scale-95"
            style={{ border: "1.5px solid #d4d4d4" }}
          >
            Volver
          </button>
        </div>
        <p className="text-xs font-bold uppercase tracking-widest mb-3 text-white/60">
          Paso 3 de 4
        </p>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight text-center">
          Elige tu experiencia
        </h1>
        <p className="mt-3 text-[15px] text-white/75 font-medium max-w-2xl text-center">
          Cada plan incluye el Método 590. Elige la intensidad de acompañamiento que necesitas.
        </p>
      </div>

      {/* Cards + Muñecas */}
      <div className="relative z-10 flex-1 flex flex-col">

        {/* ── Cards mobile (sin 3D) ── */}
        <div className="sm:hidden w-full max-w-6xl mx-auto px-4 flex flex-col gap-6">
          {visiblePlans.map((plan) => (
            <div key={plan.id} className="relative">
              {plan.badge && (
                <span
                  className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 text-[11px] font-extrabold uppercase tracking-widest px-5 py-1.5 rounded-full"
                  style={{ backgroundColor: plan.badge.bg, color: plan.badge.color }}
                >
                  {badgeText(plan)}
                </span>
              )}
              <div
                className="rounded-3xl px-5 py-5 shadow-lg overflow-hidden"
                style={{ backgroundColor: plan.cardBg }}
              >
                {/* Nombre + precio en la misma fila */}
                <div className="flex items-start justify-between mb-3">
                  <p className="text-xl font-extrabold whitespace-pre-line" style={{ color: plan.nameColor }}>
                    {plan.name}
                  </p>
                  <div className="text-right shrink-0 ml-4">
                    <p className="text-3xl font-extrabold leading-none" style={{ color: plan.nameColor }}>
                      {plan.price}
                    </p>
                    <p className="text-[11px] font-bold opacity-70 mt-0.5" style={{ color: plan.nameColor }}>
                      {plan.priceUnit}
                    </p>
                    {plan.billingNote && (
                      <p className="text-[10px] font-medium opacity-55 mt-0.5 max-w-[120px] ml-auto leading-tight" style={{ color: plan.nameColor }}>
                        {plan.billingNote}
                      </p>
                    )}
                  </div>
                </div>

                {plan.subtitle && (
                  <p className="text-[11px] font-semibold mb-2 opacity-70" style={{ color: plan.nameColor }}>
                    {plan.subtitle}
                  </p>
                )}

                <ul className="flex flex-col gap-2 mb-4">
                  {plan.features.map((feat) => (
                    <li key={feat} className="flex items-start gap-2">
                      <span
                        className="shrink-0 mt-0.5 flex items-center justify-center w-4 h-4 rounded-full"
                        style={{ border: `2px solid ${plan.checkColor}` }}
                      >
                        <svg className="w-2 h-2" viewBox="0 0 10 10" fill="none">
                          <polyline points="1.5,5 4,7.5 8.5,2" stroke={plan.checkColor} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                      <span className="text-[13px] font-semibold leading-snug" style={{ color: plan.nameColor }}>
                        {feat}
                      </span>
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  onClick={() => handleSeleccionar(plan.route)}
                  className="w-full rounded-full py-3 text-[14px] font-extrabold bg-white transition hover:opacity-90 active:scale-95"
                  style={{ color: plan.btnColor }}
                >
                  Seleccionar
                </button>
                <div className="relative h-[180px] mt-3 -mx-5 -mb-5">
                  <Image
                    src={plan.muñeca}
                    alt=""
                    fill
                    className="object-contain object-bottom [filter:drop-shadow(-20px_15px_25px_rgba(0,0,0,0.35))]"
                    sizes="90vw"
                    priority
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Cards desktop (con flip 3D) ── */}
        <div className="hidden sm:grid w-full max-w-4xl mx-auto px-4 grid-cols-1 sm:grid-cols-2 gap-3">
          {visiblePlans.map((plan) => (
            <div key={plan.id} className="flex flex-col items-center">
              <div
                className="w-full relative"
                style={{ perspective: "1000px", WebkitPerspective: "1000px", height: "440px" }}
              >
                {plan.badge && (
                  <span
                    className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 text-[11px] font-extrabold uppercase tracking-widest px-5 py-1.5 rounded-full"
                    style={{ backgroundColor: plan.badge.bg, color: plan.badge.color }}
                  >
                    {badgeText(plan)}
                  </span>
                )}
                <div
                  role="button"
                  tabIndex={0}
                  aria-label={`Ver precio del ${plan.name.replace("\n", " ")}`}
                  onClick={() => toggleFlip(plan.id)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") toggleFlip(plan.id); }}
                  style={{
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    transformStyle: "preserve-3d",
                    WebkitTransformStyle: "preserve-3d",
                    transition: reducedMotion ? "none" : "transform 0.4s cubic-bezier(.4,0,.2,1)",
                    transform: flipped[plan.id] ? "rotateY(180deg)" : "rotateY(0deg)",
                    cursor: "pointer",
                    willChange: "transform",
                  }}
                >
                  {/* FRENTE */}
                  <div
                    className="rounded-3xl px-6 py-5 flex flex-col shadow-lg"
                    style={{
                      position: "absolute",
                      inset: 0,
                      backgroundColor: plan.cardBg,
                      backfaceVisibility: "hidden",
                      WebkitBackfaceVisibility: "hidden",
                      transform: "translateZ(1px)",
                    }}
                  >
                    <p className="text-2xl font-extrabold whitespace-pre-line mb-1" style={{ color: plan.nameColor }}>
                      {plan.name}
                    </p>
                    {plan.subtitle && (
                      <p className="text-[12px] font-semibold mb-2 opacity-70" style={{ color: plan.nameColor }}>
                        {plan.subtitle}
                      </p>
                    )}
                    <ul className="flex flex-col gap-2 flex-1">
                      {plan.features.map((feat) => (
                        <li key={feat} className="flex items-start gap-2">
                          <span
                            className="shrink-0 mt-0.5 flex items-center justify-center w-4 h-4 rounded-full"
                            style={{ border: `2px solid ${plan.checkColor}` }}
                          >
                            <svg className="w-2 h-2" viewBox="0 0 10 10" fill="none">
                              <polyline points="1.5,5 4,7.5 8.5,2" stroke={plan.checkColor} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </span>
                          <span className="text-[13px] font-semibold leading-snug" style={{ color: plan.nameColor }}>
                            {feat}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <p className="text-[13px] font-bold text-center mt-2 opacity-60" style={{ color: plan.nameColor }}>
                      Clic para ver el precio →
                    </p>
                    {/* Muñeca chica de acento en la esquina — no estorba el texto */}
                    <div className="pointer-events-none select-none absolute bottom-2 right-2 h-[150px] w-[115px]">
                      <Image
                        src={plan.muñeca}
                        alt=""
                        fill
                        className="object-contain object-bottom [filter:drop-shadow(-10px_8px_14px_rgba(0,0,0,0.28))]"
                        sizes="130px"
                      />
                    </div>
                  </div>

                  {/* REVERSO */}
                  <div
                    className="rounded-3xl px-6 py-5 flex flex-col items-center justify-center shadow-lg"
                    style={{
                      position: "absolute",
                      inset: 0,
                      backgroundColor: plan.backBg,
                      backfaceVisibility: "hidden",
                      WebkitBackfaceVisibility: "hidden",
                      transform: "rotateY(180deg) translateZ(1px)",
                    }}
                  >
                    <p className="text-[12px] font-extrabold uppercase tracking-widest mb-2 opacity-70" style={{ color: "#fff" }}>
                      {plan.name.replace("\n", " ")}
                    </p>
                    <p className="font-extrabold leading-none" style={{ color: "#fff", fontSize: "76px" }}>
                      {plan.price}
                    </p>
                    <p className="text-[13px] font-bold mt-1 opacity-80" style={{ color: "#fff" }}>
                      {plan.priceUnit}
                    </p>
                    {plan.billingNote && (
                      <p className="text-[11px] font-medium mt-1.5 opacity-60 text-center max-w-[180px]" style={{ color: "#fff" }}>
                        {plan.billingNote}
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleSeleccionar(plan.route); }}
                      className="mt-6 inline-flex items-center rounded-full px-7 py-2.5 text-[13px] font-extrabold bg-white transition hover:opacity-90 active:scale-95"
                      style={{ color: plan.btnColor }}
                    >
                      Seleccionar
                    </button>
                    <p className="text-[12px] font-bold mt-3 opacity-50 cursor-pointer" style={{ color: "#fff" }}>
                      ← Ver detalles
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Testimonios */}
      <div className="bg-white">
        <TestimonialsSection />
      </div>

      {/* FAQ */}
      <div className="bg-white">
        <PreguntasFrecuentes />
      </div>

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