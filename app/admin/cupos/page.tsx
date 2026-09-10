"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useRouter } from "next/navigation";
import { ErrorState } from "../_utils/ErrorState";
import { planLabel, planBadgeClass } from "@/app/lib/plans";

// Config cruda por plan (lo editable): tope y si el cupo está activo.
type CuposConfig = Record<string, { max: number; activo: boolean }>;
// Disponibilidad calculada por el backend (solo lectura).
type CuposAvailability = Record<
  string,
  { activo: boolean; max: number; usados: number; restantes: number }
>;

export default function CuposPage() {
  const router = useRouter();

  const [config, setConfig] = useState<CuposConfig>({});
  const [availability, setAvailability] = useState<CuposAvailability>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/admin/login"); return; }
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/config/plan-cupos`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) throw new Error(`Error cargando cupos (${res.status})`);
      const data = await res.json();
      setConfig(data?.config ?? {});
      setAvailability(data?.availability ?? {});
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Error de red");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { load(); }, [load]);

  async function save() {
    setSaving(true); setSaved(false); setError("");
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.push("/admin/login"); return; }
    const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/config/plan-cupos`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ cupos: config }),
    });
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      await load(); // refresca usados/restantes con la config guardada
    } else {
      setError("Error guardando los cambios. Intenta de nuevo.");
    }
    setSaving(false);
  }

  function setMax(plan: string, max: number) {
    setConfig((c) => ({ ...c, [plan]: { ...(c[plan] ?? { activo: true, max: 0 }), max } }));
  }
  function toggleActivo(plan: string) {
    setConfig((c) => {
      const cur = c[plan] ?? { activo: true, max: 0 };
      return { ...c, [plan]: { ...cur, activo: !cur.activo } };
    });
  }

  const plans = Object.keys(config);

  if (loadError) return <ErrorState message={loadError} onRetry={load} />;

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-3 text-gray-400">
        <svg className="w-8 h-8 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
        <span className="text-sm">Cargando…</span>
      </div>
    </div>
  );

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Cupos por plan</h1>
          <p className="text-sm text-gray-400 mt-1">
            Cuántas plazas van usadas de los planes con escasez. El TOPE se define en la
            plataforma (Admin › Planes); al agotarse, la card se oculta del sitio y el
            checkout se bloquea automáticamente, aquí y en la plataforma.
          </p>
        </div>
        {saving ? (
          <span className="shrink-0 text-xs font-medium text-gray-400">Guardando…</span>
        ) : saved ? (
          <span className="shrink-0 text-xs font-medium text-emerald-600">Guardado ✓</span>
        ) : null}
      </div>

      {error && (
        <div className="mb-4 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">{error}</div>
      )}

      {plans.length === 0 ? (
        <div className="rounded-2xl bg-white shadow-sm border border-gray-100 px-5 py-8 text-center text-sm text-gray-400">
          No hay planes con cupos. Se les pone tope en la plataforma, en Admin › Planes.
        </div>
      ) : (
        <div className="space-y-5">
          {plans.map((plan) => {
            const cfg = config[plan];
            const av = availability[plan];
            const restantes = av?.restantes ?? Math.max(0, (cfg?.max ?? 0) - (av?.usados ?? 0));
            const soldOut = !cfg?.activo || restantes <= 0;
            return (
              <div key={plan} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-2.5">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${planBadgeClass(plan)}`}>
                    {planLabel(plan)}
                  </span>
                  <span className={`text-xs font-medium ${soldOut ? "text-red-500" : "text-emerald-600"}`}>
                    {soldOut ? "Agotado / inactivo" : `${restantes} disponibles`}
                  </span>
                </div>

                <div className="px-5 py-4 grid grid-cols-3 gap-4 border-b border-gray-50">
                  <div>
                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Usados</p>
                    <p className="text-lg font-bold text-gray-800 mt-0.5">{av?.usados ?? 0}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Máximo</p>
                    <p className="text-lg font-bold text-gray-800 mt-0.5">{cfg?.max ?? 0}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Restantes</p>
                    <p className={`text-lg font-bold mt-0.5 ${restantes <= 0 ? "text-red-500" : "text-gray-800"}`}>{restantes}</p>
                  </div>
                </div>

                {/*
                  ⚠️⚠️ **Esta pantalla pasa a ser de SOLO LECTURA** (2026-09-07). El
                  tope se declara ahora en la plataforma (Admin › Planes), donde vive
                  el resto del contrato del plan —precio, recurrencia, cohorte, clases
                  en vivo—, y desde donde también se le puede poner a un plan NUEVO:
                  aquí la lista salía de `Object.keys(config)` y no tenía "añadir".

                  Lo que sigue valiendo, y por eso no se retira la pantalla, es la
                  mitad que la plataforma NO puede calcular: **usados y restantes**.
                  Las compras viven en esta base.

                  Dejarla editable habría sido dos sitios contestando la misma
                  pregunta, y ganaría el último que guarde.
                */}
                <div className="px-5 py-4 flex items-center justify-between gap-4">
                  <p className="text-xs text-gray-500">
                    El tope se define en la plataforma, en <span className="font-semibold">Admin › Planes</span>.
                    Aquí se ve cuántas plazas van usadas.
                  </p>
                  <span className={`shrink-0 text-xs font-medium ${cfg?.activo ? "text-emerald-600" : "text-gray-400"}`}>
                    {cfg?.activo ? "Activo" : "Inactivo"}
                  </span>
                </div>
              </div>
            );
          })}

        </div>
      )}
    </div>
  );
}
