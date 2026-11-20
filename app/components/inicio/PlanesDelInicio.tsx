"use client";

import Image from "next/image";
import Link from "next/link";
import { usePlanesDelCatalogo, precioEtiqueta, type PlanDelCatalogo } from "@/app/hooks/usePlanesDelCatalogo";
import { usePlanCupos } from "@/app/hooks/usePlanCupos";
import { unidadDePrecio, notaDeCobro } from "@/app/components/PrecioDelPlan";
import { fraseDeClases } from "@/app/lib/dias-de-clase";
import { medirCtaInicio } from "@/app/lib/analitica";

/*
  Los planes, justo bajo «Cómo funciona» del inicio (HU-LZ-EMB, criterio 2).

  ⚠️ **El precio y el cobro salen del CATÁLOGO**, nunca de un literal: es la
  misma regla de /paso-tres y de las landings. Los importes de abajo son el
  RESPALDO para cuando el catálogo no ha llegado o no responde —una sección de
  precios en blanco no vende—, el mismo respaldo que ya usa /paso-tres.

  ⚠️ Una FAMILIA (Personalizado y sus ramas) es UNA tarjeta con «Desde» y el
  precio de la rama más barata: la escalera de ramas se elige en el paso 2.

  Cada tarjeta lleva a /paso-tres con ese plan abierto; el botón principal de la
  página sigue siendo «Descubre tu plan en 1 minuto».
*/

interface Arte {
  muñeca: string;
  resumen: string;
  badge?: string;
}

/** El copy corto y el arte de los planes de siempre. Un plan nuevo usa sus viñetas. */
const ARTE: Record<string, Arte> = {
  Essential: {
    muñeca: "/muñeca-essential.webp",
    resumen: "A tu ritmo, con la plataforma, la práctica en vivo de los viernes y la comunidad. Empiezas hoy.",
  },
  Premium: {
    muñeca: "/muñeca-premium.webp",
    // Los días y la frecuencia NO se escriben aquí: salen del catálogo (`fraseDeClases`).
    resumen: "Todo lo de Essential y clases en vivo con tu grupo.",
    badge: "Recomendado",
  },
  Personalizado: {
    muñeca: "/muñeca-personalizada.webp",
    resumen: "Sesiones privadas 1 a 1 en el horario que acuerdes, con un plan hecho para ti.",
  },
  Fluidez: {
    muñeca: "/muñeca-fluency.webp",
    resumen: "Coaching de speaking 1 a 1 cada semana para perder el miedo a hablar.",
  },
};
const MUÑECA_POR_DEFECTO = "/muñeca-premium.webp";

const RESPALDO: Pick<PlanDelCatalogo, "key" | "label" | "priceCents" | "recurring">[] = [
  { key: "Essential", label: "Essential", priceCents: 1000, recurring: true },
  { key: "Premium", label: "Premium", priceCents: 5000, recurring: true },
  { key: "Personalizado", label: "Personalizado", priceCents: 12000, recurring: false },
  { key: "Fluidez", label: "Fluidez", priceCents: 20000, recurring: false },
];

/** El nombre que lee el comprador: la clave para los de siempre ("Fluidez", no "Programa de Fluidez"). */
const nombreDe = (p: { key: string; label: string }) => (ARTE[p.key] ? p.key : p.label);

export default function PlanesDelInicio() {
  const catalogo = usePlanesDelCatalogo();
  const { isPlanAvailable, cuposLabel } = usePlanCupos();

  const tarjetas = (() => {
    if (!catalogo) {
      return RESPALDO.map((p) => ({ ...p, desde: false, features: [] as string[] }));
    }
    // Copy propio o plan que vino de la plataforma: el "Speaking" del legacy tiene su propio embudo.
    const visibles = catalogo.filter((p) => ARTE[p.key] || p.origenPlataforma);
    return visibles
      .filter((p) => !p.family || p.family === p.key || !catalogo.some((o) => o.key === p.family))
      .map((p) => {
        const ramas = catalogo.filter((o) => (o.family ? o.family === p.key : o.key === p.key));
        const masBarata = ramas.reduce((min, r) => (r.priceCents < min.priceCents ? r : min), p);
        return { ...p, priceCents: masBarata.priceCents, desde: ramas.length > 1 };
      });
  })().filter((p) => p.key !== "Fluidez" || isPlanAvailable("Fluidez"));

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {tarjetas.map((p) => {
        const arte = ARTE[p.key];
        const nombre = nombreDe(p);
        const recomendado = p.key === "Premium";
        const badge = p.key === "Fluidez" ? cuposLabel("Fluidez") || arte?.badge : arte?.badge;
        return (
          <article
            key={p.key}
            className={`lz-card flex flex-col gap-3 p-6 ${recomendado ? "border-lz-grape shadow-[0_0_0_3px_var(--color-lz-lila2)]" : ""}`}
          >
            <div className="flex min-h-7 items-center justify-between gap-2">
              <h3 className="lz-display text-[26px]">{nombre}</h3>
              {badge && <span className="lz-pill lz-pill-lila">{badge}</span>}
            </div>
            <Image
              src={arte?.muñeca ?? MUÑECA_POR_DEFECTO}
              alt={`Ilustración del plan ${nombre}`}
              width={300}
              height={300}
              className="h-[130px] w-auto self-center object-contain"
              sizes="160px"
            />
            <p>
              {p.desde && <span className="text-[14px] font-bold text-lz-ink2">Desde </span>}
              <span className="lz-display text-[38px] tabular-nums text-lz-grape">{precioEtiqueta(p.priceCents)}</span>
              <span className="text-[14px] text-lz-ink3">{unidadDePrecio(p.recurring === true)}</span>
            </p>
            <p className="text-[13px] font-semibold text-lz-ink2">
              {notaDeCobro(p.recurring === true)}
            </p>
            <p className="lz-p text-[15px]">{arte?.resumen ?? p.features.slice(0, 2).join(" · ")}</p>
            {(() => {
              // Las filas de respaldo no traen estos campos: sin dato, la línea no se pinta.
              const c = p as Partial<PlanDelCatalogo>;
              const frase = fraseDeClases(c.liveClasses ?? null, c.classDays ?? [], c.classMode ?? null, c.sessionsPerWeek ?? null);
              return frase ? <p className="text-[14px] font-semibold text-lz-violet">{frase}</p> : null;
            })()}
            <Link
              href={`/paso-tres?plan=${encodeURIComponent(p.key)}`}
              onClick={() => medirCtaInicio(`plan_${p.key}`)}
              className="lz-btn lz-btn-3 mt-auto self-start"
            >
              Ver y elegir {nombre} →
            </Link>
          </article>
        );
      })}
    </div>
  );
}
