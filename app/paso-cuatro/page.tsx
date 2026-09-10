"use client";

import { Suspense, useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import PaymentForm from "@/app/components/Form";
import { useCatalogoDePlanes } from "@/app/hooks/usePlanesDelCatalogo";
import { CHECKOUT_PLAN_KEYS, PLAN_MAP } from "@/app/lib/plans";

/*
  ⚠️ Era una unión de cuatro literales. Desde el 2026-09-06 el catálogo puede
  traer planes que este front no conoce —los que se abren en el admin de la
  plataforma— así que la clave es una cadena. Lo que NO se ensancha es el arte:
  ver `MUÑECA_POR_DEFECTO`.
*/
type PlanType = string;

// URL param (en minúsculas) → key del plan.
//
// ⚠️ Se construye con la lista LOCAL a propósito, aunque el checkout ya sea
// dinámico: esto resuelve un enlace del embudo (`/paso-cuatro?plan=premium`) y
// esos enlaces son los de las landings, que solo existen para los planes con
// ficha. Un plan que no case cae a Essential —el comportamiento de siempre— y el
// alumno puede cambiarlo en el propio selector, que sí trae el catálogo entero.
const planMap: Record<string, PlanType> = Object.fromEntries(
  CHECKOUT_PLAN_KEYS.map((k) => [k.toLowerCase(), k])
);

// Fusión B2: "B2" es el código que emite /paso-uno desde el 2026-08-24.
//
// NO BORRAR las claves "B2.1" y "B2.2": /paso-uno ya no las genera, pero siguen
// circulando en enlaces vivos (anuncios, mensajes de WhatsApp, marcadores, embudos
// a medio terminar). Si desaparecen, nivelMap devuelve undefined, el `?? ""` de
// abajo lo convierte en cadena vacía y el alumno llega al checkout SIN NIVEL y sin
// ver ningún error — y como el backend solo bloquea lo explícitamente deshabilitado,
// un nivel vacío pasa la validación y se cobra. Apuntan al nivel único porque al
// B2 partido ya no se entra.
const nivelMap: Record<string, string> = {
  "A1":   "Principiante",
  "A2":   "Basico",
  "B1":   "Intermedio",
  "B2":   "Intermedio alto",
  "B2.1": "Intermedio alto",
  "B2.2": "Intermedio alto",
  "?":    "",
};

/*
  Imagen del personaje por plan.

  ⚠️⚠️ **`next/image` LANZA si `src` es undefined**, así que este mapa no puede
  devolver un hueco. Antes leía `PLAN_MAP[k].character` sin `?.` y solo se
  sostenía porque la lista era estática; desde que el selector del formulario trae
  el catálogo entero, elegir un plan sin ficha llamaría a `setActivePlan` con una
  clave que este mapa no tiene y **la página entera reventaría** — no el formulario:
  la página.

  El respaldo reutiliza la muñeca de Premium, la misma decisión que se tomó para
  las cards de `/paso-tres`: un plan nuevo tiene que poder venderse el mismo día,
  y esperar a su ilustración es lo que convertiría esto en un cuello de botella.
*/
const MUÑECA_POR_DEFECTO = "/muñeca-premium.webp";
const planCharacter: Record<string, string> = Object.fromEntries(
  CHECKOUT_PLAN_KEYS.map((k) => [k, PLAN_MAP[k]?.character ?? MUÑECA_POR_DEFECTO])
);
const muñecaDe = (plan: string): string =>
  planCharacter[plan] ?? MUÑECA_POR_DEFECTO;

function PasoCuatroContent() {
  const searchParams = useSearchParams();
  const planParam       = searchParams.get("plan")        ?? "";
  const nivelParam      = searchParams.get("nivel")       ?? "";
  const dificultades    = searchParams.get("dificultades") ?? "";

  /*
    ⚠️ El plan del enlace se resuelve contra el CATÁLOGO cuando el mapa local no
    lo conoce. Sin esto, `/paso-cuatro?plan=intensivo` —el enlace que emite la
    landing de un plan nuevo— caía a Essential: el alumno pulsaba "Comenzar" en
    un plan y aterrizaba en otro, con otro precio.
  */
  const {
    planes: catalogoDelEmbudo,
    estado: estadoDelCatalogo,
    reintentar: reintentarCatalogo,
  } = useCatalogoDePlanes();
  // ⚠️ Se compara contra la clave YA RECORTADA: la resolución de abajo usa
  // `planPedido` y aquí se usaba `planParam` en crudo, así que un espacio pegado
  // en la URL —copiar y pegar— hacía que el plan no se resolviera por catálogo
  // aunque existiera. Lo señaló la revisión del PR #14.
  const claveBuscada = planParam.trim().toLowerCase();
  const delCatalogo = catalogoDelEmbudo?.find(
    (p) => p.studentCheckout && p.key.toLowerCase() === claveBuscada,
  )?.key;

  /*
    ⚠️⚠️ **El plan del enlace NO cae a Essential, y esto era un bloqueante de
    dinero.** La línea decía `planMap[...] ?? delCatalogo ?? "Essential"`, así que
    un enlace a una RAMA —cuya clave el mapa local no conoce— caía a Essential en
    cuanto el catálogo no llegara: mientras cargaba, si estaba caído, o si el plan
    se había retirado. Y no era solo la cabecera: el `<select name="plan">` caía a
    su respaldo de cuatro y a `options[0]`, y el formulario **cobraba Essential**.

    Medido en el recorrido del 2026-09-09: `?plan=PERSONALIZED_INMERSION` con el
    catálogo caído llegaba a una sesión real de Stripe diciendo
    **"Essential — 10,00 US$"**, sin un solo aviso. El comprador de una rama de
    $210 acababa comprando otra cosa.

    Es el mismo fallo que el CLAUDE.md raíz ya documenta para el desplegable de
    "Editar usuario" del admin —un `select` que cae a su primera opción cuando no
    encuentra el valor— reaparecido en el checkout del comprador.

    Sin `?plan=` en la URL, Essential SÍ es el default legítimo: nadie pidió otra
    cosa. Lo que no puede es sustituir a un plan que el enlace nombró.
  */
  const planPedido = planParam.trim();
  const planResuelto: PlanType | null =
    planMap[planPedido.toLowerCase()] ?? delCatalogo ?? null;
  const noSeResolvio = planPedido !== "" && planResuelto === null;
  const initialPlan: PlanType = planResuelto ?? "Essential";
  const nivel: string = nivelMap[nivelParam] ?? "";

  const [activePlan, setActivePlan] = useState<PlanType>(initialPlan);

  /*
    El catálogo llega DESPUÉS del primer render, así que `initialPlan` puede
    cambiar de "Essential" al plan de verdad. `Form` ya sigue ese cambio con su
    propio efecto; la MUÑECA no, y se quedaba enseñando la de Essential sobre un
    formulario que ya decía otro plan.
  */
  useEffect(() => {
    setActivePlan(initialPlan);
  }, [initialPlan]);

  /*
    Mientras el catálogo viaja no se puede saber si la clave del enlace existe, y
    montar el formulario en ese hueco es justo lo que dejaba comprar Essential por
    error. Se espera; el hueco dura lo que tarda una petición.
  */
  if (noSeResolvio && estadoDelCatalogo === 'cargando') {
    return (
      <main
        className="relative min-h-[calc(100dvh-68px)] flex items-center justify-center"
        style={{ backgroundColor: "#fadadd" }}
      >
        <p className="text-[15px] font-bold text-zinc-500">Cargando tu plan…</p>
      </main>
    );
  }

  /*
    ⚠️ Y si no se resolvió con el catálogo YA en la mano —caído, o el plan
    retirado—, se dice y se ofrece salida en vez de vender otro. Cobrar el plan
    equivocado es el peor desenlace posible de esta pantalla.
  */
  if (noSeResolvio) {
    return (
      <main
        className="relative min-h-[calc(100dvh-68px)] flex flex-col items-center justify-center gap-5 px-6 text-center"
        style={{ backgroundColor: "#fadadd" }}
      >
        <h1 className="text-2xl lg:text-3xl font-extrabold" style={{ color: "#C0353E" }}>
          {estadoDelCatalogo === 'fallo'
            ? "No pudimos cargar tu plan"
            : "Ese plan ya no está disponible"}
        </h1>
        <p className="max-w-md text-[14px] font-medium text-zinc-600">
          {estadoDelCatalogo === 'fallo'
            ? "Ha sido un problema nuestro, no de tu enlace. Vuelve a intentarlo."
            : "Puede que se haya retirado o que el enlace esté mal. Estos son los planes que puedes contratar ahora mismo."}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          {estadoDelCatalogo === 'fallo' && (
            <button
              type="button"
              onClick={reintentarCatalogo}
              className="inline-flex items-center gap-3 rounded-2xl px-10 py-4 text-[15px] font-extrabold text-white shadow-lg transition hover:opacity-90 active:scale-95"
              style={{ backgroundColor: "#bd181e" }}
            >
              Reintentar
            </button>
          )}
          <Link
            href="/paso-tres"
            className="inline-flex items-center gap-3 rounded-2xl border-2 px-8 py-4 text-[15px] font-extrabold transition hover:opacity-90 active:scale-95"
            style={{ borderColor: "#bd181e", color: "#bd181e" }}
          >
            Ver los planes
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main
      className="relative min-h-[calc(100dvh-68px)]"
      style={{ backgroundColor: "#fadadd" }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, #9c181d 1px, transparent 0)",
          backgroundSize: "18px 18px",
        }}
      />

      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 relative">
        <div className="grid grid-cols-1 lg:grid-cols-2 items-center gap-0 min-h-[calc(100dvh-68px)]">

          {/* ── Personaje del plan (cambia según el plan activo) ── */}
          <div className="flex items-center justify-center order-2 lg:order-1 pb-6 lg:pb-0">
            <Image
              key={activePlan}
              src={muñecaDe(activePlan)}
              alt={`Muñeca ${activePlan}`}
              width={582}
              height={568}
              className="w-auto h-[360px] lg:h-[520px] transition-opacity duration-300 [filter:drop-shadow(-40px_30px_50px_rgba(0,0,0,0.45))]"
              sizes="(max-width: 1024px) 360px, 520px"
              priority
            />
          </div>

          {/* ── Formulario ── */}
          <div className="flex flex-col items-center justify-center py-8 lg:py-10 order-1 lg:order-2">
            <PaymentForm
              selectedPlan={initialPlan}
              selectedNivel={nivel}
              selectedDificultades={dificultades}
              embedded
              onPlanChange={setActivePlan}
            />
          </div>

        </div>
      </div>
    </main>
  );
}

export default function PasoCuatroPage() {
  return (
    <Suspense fallback={null}>
      <PasoCuatroContent />
    </Suspense>
  );
}
