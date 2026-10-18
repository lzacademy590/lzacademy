"use client";

import Link from "next/link";
import { useStartDates } from "@/app/hooks/useStartDates";
import { usePlanCohorte } from "@/app/hooks/usePlanCohorte";
import { fechaLarga } from "@/app/lib/horario-local";

/**
 * Lo que calma el miedo a pagar, puesto JUNTO al botón y no solo en el formulario
 * (2026-10-17): la garantía de 3 días, el pago seguro y cuándo empieza.
 *
 * ⚠️ **La garantía se dice con su condición** ("primera inscripción"), que es la
 * de `/reembolsos` §1. Prometerla sin ella sería anunciar un reembolso que el
 * negocio niega al alumno que renueva.
 *
 * ⚠️ **"Próximo grupo" solo sale si es un dato**: el plan va por cohorte y hay una
 * fecha publicada que no lo excluye. Sin fecha no se inventa ninguna; sin cohorte
 * (Essential) se dice "Empiezas hoy mismo", que es la regla del checkout.
 * Mientras el catálogo carga no se dice nada de la fecha: decir "hoy" a un plan
 * por cohorte durante un segundo es justo la promesa que el formulario desmiente.
 */
export default function ConfianzaDeCompra({
  clave,
  tono = "claro",
  className = "",
}: {
  /** La clave del CATÁLOGO del plan (la de la base, si es una familia). */
  clave: string;
  tono?: "claro" | "oscuro";
  className?: string;
}) {
  const { dates, loading: cargandoFechas } = useStartDates();
  const { requiresCohort, loading: cargandoCohorte } = usePlanCohorte();

  const oscuro = tono === "oscuro";
  const color = oscuro ? "rgba(255,255,255,0.85)" : "#52525b";
  const acento = oscuro ? "#ffffff" : "#047857";

  let inicio: string | null = null;
  if (!cargandoCohorte) {
    if (!requiresCohort(clave)) {
      inicio = "Empiezas hoy mismo";
    } else if (!cargandoFechas) {
      const proxima = dates.find((d) => !d.excludedPlans?.includes(clave));
      if (proxima) inicio = `Próximo grupo: ${fechaLarga(proxima.value)}`;
    }
  }

  return (
    <ul
      className={`flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-[12px] font-semibold ${className}`}
      style={{ color }}
    >
      <li className="inline-flex items-center gap-1.5">
        <Icono color={acento} d="M12 2l7 3v6c0 5-3.5 9-7 11-3.5-2-7-6-7-11V5l7-3z M9 12l2 2 4-4" />
        <span>
          Garantía de 3 días
          <Link
            href="/reembolsos"
            onClick={(e) => e.stopPropagation()}
            className="ml-1 underline decoration-dotted underline-offset-2 opacity-80 hover:opacity-100"
          >
            (1.ª inscripción)
          </Link>
        </span>
      </li>
      <li className="inline-flex items-center gap-1.5">
        <Icono color={acento} d="M6 10V7a6 6 0 0 1 12 0v3 M5 10h14v11H5z" />
        Pago seguro con Stripe
      </li>
      {inicio && (
        <li className="inline-flex items-center gap-1.5">
          <Icono color={acento} d="M3 5h18v16H3z M3 10h18 M8 3v4 M16 3v4" />
          {inicio}
        </li>
      )}
    </ul>
  );
}

function Icono({ color, d }: { color: string; d: string }) {
  return (
    <svg
      aria-hidden
      className="h-3.5 w-3.5 shrink-0"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={d} />
    </svg>
  );
}
