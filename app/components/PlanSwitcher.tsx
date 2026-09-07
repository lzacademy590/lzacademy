"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { planesDeCheckout } from "@/app/lib/plans";
import { usePlanCupos } from "@/app/hooks/usePlanCupos";
import { usePlanesDelCatalogo, precioEtiqueta } from "@/app/hooks/usePlanesDelCatalogo";

/*
  Las cuatro landings escritas a mano, con su id y su ruta.

  ⚠️ **El id NO es la clave en minúsculas**: Personalizado usa "personalizada"
  —con 'a'— y así lo pasan sus páginas. Derivarlo de la clave rompería el filtro
  que esconde el plan en el que ya estás.
*/
const LANDINGS_PROPIAS: Record<string, { id: string; route: string; label: string }> = {
  Essential:     { id: "essential",     route: "/essential",     label: "Essential" },
  Premium:       { id: "premium",       route: "/premium",       label: "Premium" },
  Personalizado: { id: "personalizada", route: "/personalizado", label: "Personalizado" },
  Fluidez:       { id: "fluidez",       route: "/fluidez",       label: "Programa de Fluidez" },
};

interface Props {
  /**
   * El id del plan en el que estamos, para esconderlo de la lista.
   *
   * ⚠️ Era una unión de los cuatro. Desde que un plan puede abrirse en el admin
   * y tener su propia landing (`/plan/<clave>`), es una cadena.
   */
  currentPlan: string;
  nivel: string;
}

export default function PlanSwitcher({ currentPlan, nivel }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { isPlanAvailable } = usePlanCupos();
  const catalogo = usePlanesDelCatalogo();

  /*
    ⚠️ **La lista sale del CATÁLOGO, no de una constante.** Un plan abierto en el
    admin tiene ahora su landing (`/plan/<clave>`) y tiene que poder alcanzarse
    desde aquí: si no, existe pero no se llega a él desde ninguna otra página.

    Mientras el catálogo viaja, `planesDeCheckout(null)` devuelve los cuatro de
    siempre, así que el conmutador nunca se queda vacío.
  */
  const allPlans = useMemo(
    () =>
      planesDeCheckout(catalogo).map((p) => {
        const propia = LANDINGS_PROPIAS[p.key];
        return {
          id: propia?.id ?? p.key.toLowerCase(),
          label: propia?.label ?? p.label,
          price: precioEtiqueta(p.priceCents),
          route: propia?.route ?? `/plan/${p.key.toLowerCase()}`,
        };
      }),
    [catalogo],
  );

  // Oculta Fluidez del switcher si se agotaron los cupos; el resto no maneja cupos.
  const otherPlans = allPlans.filter(
    (p) => p.id !== currentPlan && (p.id !== "fluidez" || isPlanAvailable("Fluidez"))
  );

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  function handleSelect(route: string) {
    setOpen(false);
    router.push(`${route}?nivel=${encodeURIComponent(nivel)}`);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="inline-flex items-center gap-2 rounded-2xl px-7 py-4 text-[14px] lg:text-[15px] font-bold text-zinc-600 bg-white shadow-sm transition hover:shadow-md active:scale-95"
        style={{ border: "1.5px solid #d4d4d4" }}
      >
        Cambiar plan
        <svg
          className={`w-4 h-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          viewBox="0 0 16 16" fill="none"
        >
          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-white rounded-2xl shadow-xl z-20 overflow-hidden"
          style={{ border: "1.5px solid #e8adb0", minWidth: "220px" }}
        >
          {otherPlans.map((plan, i) => (
            <button
              key={plan.id}
              type="button"
              onClick={() => handleSelect(plan.route)}
              className="w-full flex items-center justify-between px-5 py-3.5 text-left transition hover:bg-[#fadadd] active:scale-95"
              style={{ borderTop: i > 0 ? "1px solid #f0c8cc" : undefined }}
            >
              <span className="text-[14px] font-extrabold text-zinc-800">{plan.label}</span>
              <span className="text-[13px] font-bold ml-4" style={{ color: "#C0353E" }}>{plan.price}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
