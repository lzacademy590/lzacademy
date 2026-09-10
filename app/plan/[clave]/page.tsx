"use client";

import Image from "next/image";
import { Suspense, use, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { unidadDePrecio, notaDeCobro } from "@/app/components/PrecioDelPlan";
import ContactModal from "@/app/components/ContactModal";
import PlanSwitcher from "@/app/components/PlanSwitcher";
import { PLAN_MAP } from "@/app/lib/plans";
import { fraseDeClases } from "@/app/lib/dias-de-clase";
import {
  useCatalogoDePlanes,
  precioEtiqueta,
} from "@/app/hooks/usePlanesDelCatalogo";

// ─────────────────────────────────────────────────────────────────────────────
// LA LANDING DE UN PLAN ABIERTO EN EL ADMIN (2026-09-06)
//
// Los cuatro planes de siempre tienen su página a mano (`/essential`, `/premium`,
// `/personalizado`, `/fluidez`), con su copy escrita por el negocio. Un plan que
// se abre desde el admin de la plataforma no la tiene, y hasta hoy eso lo dejaba
// sin puerta propia: su card mandaba a `/pricing` de la plataforma.
//
// Esta ruta le da la suya. Es la MISMA maqueta que las cuatro —misma muñeca a la
// izquierda, misma tarjeta blanca, mismos botones— con el contenido sacado del
// catálogo en vez de escrito.
//
// ⚠️ **No sustituye a las cuatro.** Sus páginas siguen intactas: tienen copy que
// nadie ha pedido cambiar y frases que solo son ciertas para ellas (ver el
// comentario largo de `essential/page.tsx` sobre las clases en vivo). Esta ruta
// atiende a los planes que no tienen página, y si algún día uno de ellos quiere
// la suya, se escribe y esta deja de alcanzarle.
//
// ⚠️ **El arte no se inventa**: muñeca de Premium por defecto, la misma decisión
// que ya se tomó para las cards de `/paso-tres` y para el personaje de
// `/paso-cuatro`. Un plan tiene que poder venderse el día que se abre.
// ─────────────────────────────────────────────────────────────────────────────

const MUÑECA_POR_DEFECTO = "/muñeca-premium.webp";

function LandingDePlan({ clave }: { clave: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nivel = searchParams.get("nivel") ?? "";
  const dificultades = searchParams.get("dificultades") ?? "";
  const [modalOpen, setModalOpen] = useState(false);

  const { planes: catalogo, estado, reintentar } = useCatalogoDePlanes();
  // La clave viaja en la URL en minúsculas (es lo que hacen los enlaces del
  // embudo); el catálogo la trae como la escribió el admin.
  const plan = catalogo?.find(
    (p) => p.key.toLowerCase() === clave.toLowerCase(),
  );

  /*
    CUATRO estados, no tres. El comentario de aquí decía "tres y no dos" y tenía
    razón a medias: distinguía "cargando" de "no existe" y metía en el mismo saco
    "cargando" y **"no se pudo cargar"**, porque el hook devolvía `null` para las
    dos. Medido en el recorrido del 2026-09-09: con el catálogo caído esta
    pantalla se quedaba en **"Cargando el plan…" para siempre** —mismo texto a los
    3, 10, 20 y 35 segundos— sin reintento y sin ninguna salida.

    Y era la MISMA pantalla la que resolvía bien el caso del plan retirado, así
    que daba tres respuestas distintas a la misma pregunta según por qué faltara
    el dato.
  */
  if (estado === 'cargando') {
    return (
      <main
        className="relative min-h-[calc(100dvh-68px)] flex items-center justify-center"
        style={{ backgroundColor: "#fadadd" }}
      >
        <p className="text-[15px] font-bold text-zinc-500">Cargando el plan…</p>
      </main>
    );
  }

  /*
    ⚠️ Un fallo de carga NO se pinta como "ese plan no existe". Le daría al
    comprador una explicación de NEGOCIO creíble —"lo retiraron"— para un problema
    TÉCNICO, así que se va y no vuelve. Es la misma regla que ya costó un hallazgo
    con las fechas de cohorte del checkout de la plataforma.
  */
  if (estado === 'fallo') {
    return (
      <main
        className="relative min-h-[calc(100dvh-68px)] flex flex-col items-center justify-center gap-5 px-6 text-center"
        style={{ backgroundColor: "#fadadd" }}
      >
        <h1 className="text-2xl lg:text-3xl font-extrabold" style={{ color: "#C0353E" }}>
          No pudimos cargar este plan
        </h1>
        <p className="max-w-md text-[14px] font-medium text-zinc-600">
          Ha sido un problema nuestro, no de tu enlace. Vuelve a intentarlo.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={reintentar}
            className="inline-flex items-center gap-3 rounded-2xl px-10 py-4 text-[15px] font-extrabold text-white shadow-lg transition hover:opacity-90 active:scale-95"
            style={{ backgroundColor: "#bd181e" }}
          >
            Reintentar
          </button>
          <button
            type="button"
            onClick={() => router.push("/paso-tres")}
            className="inline-flex items-center gap-3 rounded-2xl border-2 px-8 py-4 text-[15px] font-extrabold transition hover:opacity-90 active:scale-95"
            style={{ borderColor: "#bd181e", color: "#bd181e" }}
          >
            Ver los planes
          </button>
        </div>
      </main>
    );
  }

  if (!plan || !plan.studentCheckout) {
    return (
      <main
        className="relative min-h-[calc(100dvh-68px)] flex flex-col items-center justify-center gap-5 px-6 text-center"
        style={{ backgroundColor: "#fadadd" }}
      >
        <h1 className="text-2xl lg:text-3xl font-extrabold" style={{ color: "#C0353E" }}>
          Ese plan ya no está disponible
        </h1>
        <p className="max-w-md text-[14px] font-medium text-zinc-600">
          Puede que se haya retirado o que el enlace esté mal. Estos son los
          planes que puedes contratar ahora mismo.
        </p>
        <button
          type="button"
          onClick={() => router.push("/paso-tres")}
          className="inline-flex items-center gap-3 rounded-2xl px-10 py-4 text-[15px] font-extrabold text-white shadow-lg transition hover:opacity-90 active:scale-95"
          style={{ backgroundColor: "#bd181e" }}
        >
          Ver los planes
        </button>
      </main>
    );
  }

  const arte = PLAN_MAP[plan.key];
  const features = plan.features;
  /*
    Los días de clase del plan, del catálogo. Esta landing es la que estrena un
    plan abierto desde Admin › Planes, así que es justo donde no puede haber copy
    escrito a mano: nadie va a redactarle una frase de horarios a cada plan nuevo.
  */
  const clasesLinea = fraseDeClases(plan.liveClasses, plan.classDays, plan.classMode, plan.sessionsPerWeek);

  function handleComenzar() {
    router.push(
      `/paso-cuatro?nivel=${encodeURIComponent(nivel)}&plan=${encodeURIComponent(
        plan!.key,
      )}&dificultades=${encodeURIComponent(dificultades)}`,
    );
  }

  return (
    <>
      <ContactModal open={modalOpen} onClose={() => setModalOpen(false)} />
      <main
        className="relative min-h-[calc(100dvh-68px)]"
        style={{ backgroundColor: "#fadadd" }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, #9c181d 1px, transparent 0)",
            backgroundSize: "18px 18px",
          }}
        />

        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 items-center gap-0 min-h-[calc(100dvh-68px)]">

            {/* ── Columna izquierda: la muñeca ── */}
            <div className="flex items-center justify-center order-2 lg:order-1">
              <Image
                src={arte?.character ?? MUÑECA_POR_DEFECTO}
                alt={`Muñeca ${plan.label}`}
                width={582}
                height={568}
                className="w-[380px] h-auto lg:w-[460px] [filter:drop-shadow(-40px_30px_50px_rgba(0,0,0,0.45))]"
                sizes="(max-width: 1024px) 380px, 460px"
                priority
              />
            </div>

            {/* ── Columna derecha: el plan ── */}
            <div className="flex flex-col items-center justify-center py-6 lg:py-0 order-1 lg:order-2">

              <div className="text-center mb-6 lg:mb-8 w-full">
                <h1
                  className="text-3xl lg:text-4xl xl:text-5xl font-extrabold tracking-tight"
                  style={{ color: "#C0353E" }}
                >
                  Tu plan seleccionado
                </h1>
              </div>

              <div
                className="w-full max-w-[680px] lg:max-w-[780px] bg-white rounded-3xl shadow-sm"
                style={{ border: "2px solid #e8adb0" }}
              >
                <div className="flex flex-col sm:flex-row gap-0">

                  <div className="flex flex-col justify-center px-6 py-8 sm:w-[200px] lg:w-[210px] shrink-0">
                    <p className="text-2xl lg:text-3xl font-extrabold text-zinc-800 mb-1">
                      {plan.label}
                    </p>
                    <div className="flex items-baseline gap-1 mb-3" style={{ color: "#C0353E" }}>
                      <span className="text-4xl lg:text-5xl font-extrabold leading-none">
                        {precioEtiqueta(plan.priceCents)}
                      </span>
                      {/*
                        ⚠️ El periodo va DONDE significa algo: en la unidad si el
                        cobro se repite, y dentro de la nota si es un pago único.
                        Aquí había una copia propia que pintaba "USD / 28 días"
                        SIEMPRE, así que una rama de pago único salía con la tarifa
                        y su desmentido a dos centímetros. La regla vive ahora en
                        `PrecioDelPlan` y la comparten las dos pantallas.
                      */}
                      <span className="text-xs lg:text-sm font-bold">
                        {unidadDePrecio(plan.recurring)}
                      </span>
                    </div>
                    <p className="text-[11px] lg:text-[12px] text-zinc-400 font-medium mb-2">
                      {notaDeCobro(plan.recurring)}
                    </p>
                    {arte?.checkoutTagline && (
                      <p className="text-[12px] lg:text-[13px] text-zinc-500 font-medium leading-relaxed">
                        {arte.checkoutTagline}
                      </p>
                    )}
                  </div>

                  <div className="hidden sm:block w-px my-8 shrink-0" style={{ backgroundColor: "#f0c8cc" }} />
                  <div className="block sm:hidden h-px mx-8" style={{ backgroundColor: "#f0c8cc" }} />

                  <div className="flex flex-col justify-center px-8 py-8 flex-1">
                    <p className="text-[11px] lg:text-[13px] font-extrabold uppercase tracking-widest mb-4" style={{ color: "#C0353E" }}>
                      Incluye:
                    </p>
                    {clasesLinea && (
                      <p className="text-[13px] lg:text-[15px] font-bold mb-4" style={{ color: "#C0353E" }}>
                        {clasesLinea}
                      </p>
                    )}
                    {features.length > 0 ? (
                      <ul className="flex flex-col gap-3 lg:gap-4">
                        {features.map((feat) => (
                          <li key={feat} className="flex items-center gap-3">
                            <span className="shrink-0 flex items-center justify-center w-5 h-5 lg:w-6 lg:h-6 rounded-full" style={{ border: "2px solid #C0353E" }}>
                              <svg className="w-2.5 h-2.5 lg:w-3 lg:h-3" viewBox="0 0 10 10" fill="none">
                                <polyline points="1.5,5 4,7.5 8.5,2" stroke="#C0353E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </span>
                            <span className="text-[13px] lg:text-[15px] font-bold text-zinc-700">{feat}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      /*
                        Sin viñetas no se pinta una lista vacía bajo un "Incluye:",
                        que se lee como que el plan no incluye nada. Se dice dónde
                        se escriben — es el admin quien las teclea.
                      */
                      <p className="text-[13px] lg:text-[14px] font-medium text-zinc-500 leading-relaxed">
                        Escríbenos y te contamos en detalle qué trae este plan.
                      </p>
                    )}

                    {/*
                      La frase de cierre depende de si el plan va por cohorte, que
                      es lo que de verdad cambia para el alumno: empezar hoy o
                      esperar a su grupo. Es la misma distinción que hacen a mano
                      essential (sin cohorte) y premium (con ella).
                    */}
                    <p className="mt-5 text-[11.5px] lg:text-[13px] leading-relaxed italic" style={{ color: "#C0353E" }}>
                      {plan.requiresCohort
                        ? "Eliges tu fecha de inicio en el siguiente paso: empiezas con el grupo de esa fecha."
                        : "Accede hoy a la plataforma: empiezas el mismo día que pagas, sin esperar a ninguna fecha de inicio."}
                    </p>
                  </div>

                </div>
              </div>

              <div className="mt-6 lg:mt-8 flex flex-wrap items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={() => setModalOpen(true)}
                  className="inline-flex items-center gap-3 rounded-2xl px-7 py-4 text-[14px] lg:text-[15px] font-extrabold text-zinc-800 bg-white shadow-sm transition hover:shadow-md active:scale-95"
                  style={{ border: "2px solid #222" }}
                >
                  Más Información
                </button>
                <PlanSwitcher currentPlan={plan.key.toLowerCase()} nivel={nivel} />
                <button
                  type="button"
                  onClick={handleComenzar}
                  className="inline-flex items-center gap-3 rounded-2xl px-10 py-4 lg:px-12 lg:py-4 text-[15px] lg:text-[17px] font-extrabold text-white shadow-lg transition hover:opacity-90 active:scale-95"
                  style={{ backgroundColor: "#bd181e" }}
                >
                  Comenzar
                  <svg className="w-4 h-4 lg:w-5 lg:h-5 shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 3l5 5-5 5" /></svg>
                </button>
              </div>

            </div>
          </div>
        </div>
      </main>
    </>
  );
}

export default function PaginaDePlan({
  params,
}: {
  params: Promise<{ clave: string }>;
}) {
  const { clave } = use(params);
  return (
    <Suspense fallback={null}>
      <LandingDePlan clave={clave} />
    </Suspense>
  );
}
