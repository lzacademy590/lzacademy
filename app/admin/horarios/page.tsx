"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabaseClient";
import { useRouter } from "next/navigation";
import { ErrorState } from "../_utils/ErrorState";
import { todayPT } from "../_utils/ptTime";
import { planesDeCheckout } from "@/app/lib/plans";
import { usePlanCohorte } from "@/app/hooks/usePlanCohorte";
import { usePlanesDelCatalogo } from "@/app/hooks/usePlanesDelCatalogo";
import { Pagina, EncabezadoDePagina, Cargando, Aviso } from "../_ui";
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
    if (loading) return <Cargando />;

    const futuras = fechas.filter(d => d.value >= today);

    return (
        <Pagina ancho="medio">
            <EncabezadoDePagina
                titulo="Horarios por grupo"
                descripcion={
                    <>
                        Publica los horarios de cada fecha de inicio y nivel, mira cuántos alumnos faltan para abrir cada grupo y mueve alumnos entre grupos.
                        Las fechas se crean en <Link href="/admin/fechas" className="text-falu-red-600 hover:underline">Fechas de inicio</Link>.
                    </>
                }
            />

            {futuras.length === 0 && (
                <div className="mb-6">
                    <Aviso tono="ambar">
                        No hay fechas de inicio futuras. Crea una en{" "}
                        <Link href="/admin/fechas" className="font-semibold underline">Fechas de inicio</Link> para poder publicar sus horarios.
                    </Aviso>
                </div>
            )}

            <HorariosDeGrupo fechas={futuras} planes={planes} />
        </Pagina>
    );
}
