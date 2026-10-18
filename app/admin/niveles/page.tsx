"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useRouter } from "next/navigation";
import { ErrorState } from "../_utils/ErrorState";
import { LEVELED_PLAN_KEYS, planLabel, planBadgeClass } from "@/app/lib/plans";
import { Pagina, EncabezadoDePagina, Tarjeta, Cargando, Spinner, NIVELES, useToast } from "../_ui";

type Availability = Record<string, Record<string, boolean>>;

// Planes con niveles y su presentación: derivados del catálogo único de planes.
const PLANS = LEVELED_PLAN_KEYS;

const PLAN_META: Record<string, { label: string; chip: string }> = Object.fromEntries(
  PLANS.map((p) => [p, { label: planLabel(p), chip: planBadgeClass(p) }])
);

// Debe seguir a LEVELS de lzacademy-backend/src/config/plans.js (lo hace `NIVELES`
// del kit). Este panel es el que controla qué niveles se venden: el corte de la
// fusión B2 (encender B2 y apagar B2.1/B2.2) se hace desde aquí, sin desplegar.
const HEREDADOS = new Set(["Intermedio alto-gramatica", "Intermedio alto-produccion"]);
const LEVELS = NIVELES.map((n) => ({
  value: n.value,
  label: HEREDADOS.has(n.value) ? `${n.label} · heredado` : n.label,
}));

export default function NivelesPage() {
  const router = useRouter();
  const toast = useToast();

  const [availability, setAvailability] = useState<Availability>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // GET público a propósito: el formulario de pago lee la misma ruta sin sesión.
  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const base = process.env.NEXT_PUBLIC_BACKEND_URL;
      const res = await fetch(`${base}/config/level-availability`);
      if (!res.ok) throw new Error(`Error cargando niveles (${res.status})`);
      setAvailability(await res.json());
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Error de red");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Optimista: el interruptor cambia al instante y vuelve atrás si el guardado falla.
  async function save(updated: Availability, previo: Availability) {
    setSaving(true);
    setAvailability(updated);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setAvailability(previo); router.push("/admin/login"); return; }
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/config/level-availability`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ availability: updated }),
      });
      if (res.ok) {
        toast.exito("Niveles guardados.");
      } else {
        setAvailability(previo);
        toast.error("Error guardando los cambios. Intenta de nuevo.");
      }
    } catch {
      setAvailability(previo);
      toast.error("No se pudo conectar con el servidor. El cambio NO se guardó.");
    } finally {
      setSaving(false);
    }
  }

  function handleToggle(plan: string, level: string) {
    const current = availability[plan]?.[level] !== false;
    const updated: Availability = {
      ...availability,
      [plan]: { ...(availability[plan] ?? {}), [level]: !current },
    };
    save(updated, availability);
  }

  if (loadError) return <ErrorState message={loadError} onRetry={load} />;
  if (loading) return <Cargando />;

  return (
    <Pagina ancho="estrecho">
      <EncabezadoDePagina
        titulo="Niveles por plan"
        descripcion="Activa o desactiva qué niveles se pueden comprar en cada plan. Los cambios se aplican de inmediato en el formulario de pago."
        acciones={
          saving ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-400">
              <Spinner className="w-3.5 h-3.5" /> Guardando…
            </span>
          ) : undefined
        }
      />

      <div className="space-y-5">
        {PLANS.map((plan) => (
          <Tarjeta
            key={plan}
            sinRelleno
            titulo={
              <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${PLAN_META[plan]?.chip ?? "bg-gray-100 text-gray-600"}`}>
                {PLAN_META[plan]?.label ?? plan}
              </span>
            }
          >
            <ul className="divide-y divide-gray-50">
              {LEVELS.map((lvl) => {
                const enabled = availability[plan]?.[lvl.value] !== false;
                return (
                  <li key={lvl.value} className="flex items-center justify-between px-5 py-3.5 gap-4">
                    <p className="text-sm font-semibold text-gray-700">{lvl.label}</p>
                    <div className="flex items-center gap-3 shrink-0">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={enabled}
                        aria-label={`${lvl.label} en ${PLAN_META[plan]?.label ?? plan}`}
                        onClick={() => handleToggle(plan, lvl.value)}
                        disabled={saving}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed ${
                          enabled ? "bg-emerald-500" : "bg-gray-200"
                        }`}
                      >
                        <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                          enabled ? "translate-x-6" : "translate-x-1"
                        }`} />
                      </button>
                      <span className={`text-xs font-medium w-20 ${enabled ? "text-emerald-600" : "text-gray-400"}`}>
                        {enabled ? "Disponible" : "Desactivado"}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </Tarjeta>
        ))}
      </div>
    </Pagina>
  );
}
