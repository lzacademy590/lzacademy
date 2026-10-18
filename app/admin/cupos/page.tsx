"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useRouter } from "next/navigation";
import { ErrorState } from "../_utils/ErrorState";
import { planLabel, planBadgeClass } from "@/app/lib/plans";
import { Pagina, EncabezadoDePagina, Tarjeta, Cargando, Vacio, Chip } from "../_ui";

/*
  ⚠️⚠️ **Esta pantalla es de SOLO LECTURA** (2026-09-07). El tope se declara en la
  plataforma (Admin › Planes), donde vive el resto del contrato del plan —precio,
  recurrencia, cohorte, clases en vivo—, y desde donde también se le puede poner a
  un plan NUEVO.

  Lo que sigue valiendo, y por eso no se retira la pantalla, es la mitad que la
  plataforma NO puede calcular: **usados y restantes**. Las compras viven en esta
  base. Dejarla editable habría sido dos sitios contestando la misma pregunta, y
  ganaría el último que guarde. Por eso se retiró el guardado (PUT /config/plan-cupos).
*/

// Config cruda por plan: tope y si el cupo está activo.
type CuposConfig = Record<string, { max: number; activo: boolean }>;
// Disponibilidad calculada por el backend.
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

  const plans = Object.keys(config);

  if (loadError) return <ErrorState message={loadError} onRetry={load} />;
  if (loading) return <Cargando />;

  return (
    <Pagina ancho="estrecho">
      <EncabezadoDePagina
        titulo="Cupos por plan"
        descripcion={
          <>
            Solo lectura: cuántas plazas van usadas de los planes con escasez. El tope se cambia en{" "}
            <span className="font-semibold">Admin › Planes</span> de la plataforma; al agotarse, la card se
            oculta del sitio y el checkout se bloquea automáticamente, aquí y en la plataforma.
          </>
        }
      />

      {plans.length === 0 ? (
        <Tarjeta>
          <Vacio>No hay planes con cupos. Se les pone tope en la plataforma, en Admin › Planes.</Vacio>
        </Tarjeta>
      ) : (
        <div className="space-y-5">
          {plans.map((plan) => {
            const cfg = config[plan];
            const av = availability[plan];
            const restantes = av?.restantes ?? Math.max(0, (cfg?.max ?? 0) - (av?.usados ?? 0));
            const soldOut = !cfg?.activo || restantes <= 0;
            return (
              <Tarjeta
                key={plan}
                sinRelleno
                titulo={
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${planBadgeClass(plan)}`}>
                    {planLabel(plan)}
                  </span>
                }
                acciones={
                  <Chip tono={soldOut ? "rojo" : "verde"} conPunto>
                    {soldOut ? "Agotado / inactivo" : `${restantes} disponibles`}
                  </Chip>
                }
              >
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

                <div className="px-5 py-4 flex items-center justify-between gap-4">
                  <p className="text-xs text-gray-500">
                    El tope se define en la plataforma, en <span className="font-semibold">Admin › Planes</span>.
                    Aquí se ve cuántas plazas van usadas.
                  </p>
                  <Chip tono={cfg?.activo ? "verde" : "gris"}>{cfg?.activo ? "Activo" : "Inactivo"}</Chip>
                </div>
              </Tarjeta>
            );
          })}
        </div>
      )}
    </Pagina>
  );
}
