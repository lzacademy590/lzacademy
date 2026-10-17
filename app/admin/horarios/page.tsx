"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useRouter } from "next/navigation";
import { ErrorState } from "../_utils/ErrorState";
import { todayPT } from "../_utils/ptTime";
import { planesDeCheckout } from "@/app/lib/plans";
import { usePlanCohorte } from "@/app/hooks/usePlanCohorte";
import { usePlanesDelCatalogo } from "@/app/hooks/usePlanesDelCatalogo";
import { HorariosDeGrupo } from "./HorariosDeGrupo";

/*
  Horarios por grupo, en su propia pestaña (2026-10-17). Vivían como sección 2
  de «Fechas de inicio», y el negocio los buscaba ahí sin encontrarlos: son otra
  tarea —publicar grupos, ver quién falta, mover alumnos— que se hace mucho más
  a menudo que abrir una fecha nueva.

  Solo LEE las fechas: se crean en «Fechas de inicio», y un horario se publica
  para una fecha que ya existe. Por eso aquí no hay forma de añadir una.
*/
interface StartDate {
    value: string;
    label: string;
    enabled: boolean;
}

export default function HorariosPage() {
    const router = useRouter();
    const { requiresCohort } = usePlanCohorte();
    const catalogo = usePlanesDelCatalogo();

    const [fechas, setFechas] = useState<StartDate[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoadError(null);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) { router.push("/admin/login"); return; }
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/config/start-dates/all`, {
                headers: { Authorization: `Bearer ${session.access_token}` },
            });
            if (!res.ok) throw new Error(`Error fechas (${res.status})`);
            setFechas(await res.json());
        } catch (e) {
            setLoadError(e instanceof Error ? e.message : "Error de red");
        } finally {
            setLoading(false);
        }
    }, [router]);

    useEffect(() => { load(); }, [load]);

    const today = todayPT();

    // Solo los planes por cohorte, y solo las BASES: un horario vale para toda su
    // familia (2026-10-17), así que publicarlo "para una rama" no existe.
    const planes = useMemo(
        () => planesDeCheckout(catalogo)
            .filter(p => requiresCohort(p.key))
            .filter(p => {
                const fam = catalogo?.find(c => c.key === p.key)?.family;
                return !fam || fam === p.key;
            })
            .map(p => ({ key: p.key, nombre: p.nombreEnCheckout })),
        [catalogo, requiresCohort],
    );

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

    const futuras = fechas.filter(d => d.value >= today);

    return (
        <div className="p-4 md:p-8 max-w-2xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Horarios por grupo</h1>
                <p className="text-sm text-gray-400 mt-1">
                    Publica los horarios de cada fecha de inicio y nivel, mira cuántos alumnos faltan para abrir cada grupo y mueve alumnos entre grupos.
                    Las fechas se crean en <a href="/admin/fechas" className="text-falu-red-600 hover:underline">Fechas de inicio</a>.
                </p>
            </div>

            {futuras.length === 0 && (
                <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                    No hay fechas de inicio futuras. Crea una en{" "}
                    <a href="/admin/fechas" className="font-semibold underline">Fechas de inicio</a> para poder publicar sus horarios.
                </div>
            )}

            <HorariosDeGrupo fechas={futuras} planes={planes} />
        </div>
    );
}
