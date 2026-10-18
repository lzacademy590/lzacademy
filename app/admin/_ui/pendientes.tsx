"use client";

// Los "pendientes de hoy" (`GET /admin/pendientes`), leídos UNA vez por el layout
// y compartidos por el Inicio y los contadores del menú. Dos lecturas separadas
// gastarían el doble del limitador de 100/15 min que el panel comparte con la tienda.

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

type Bloque<T> = { ok: true; total: number; lista: T[] } | { ok: false };

export type AlumnoPendiente = {
  id: number;
  full_name: string | null;
  email: string;
  plan: string;
  level: string | null;
  current_period_end?: string | null;
  inscription_date?: string | null;
  origen?: string;
};

export type GrupoPendiente = {
  id: string;
  plan: string;
  level: string;
  start_date: string;
  hora_pt: string;
  inscritos: number;
  minimo: number;
  faltan: number;
  cierre: string;
};

export type Pendientes = {
  generadoEn: string;
  pagosFallidos: Bloque<AlumnoPendiente>;
  cancelanPronto: Bloque<AlumnoPendiente>;
  accesosPendientes: Bloque<AlumnoPendiente>;
  leadsNuevos: Bloque<{ id: string; full_name: string | null; email: string; country: string | null; created_at: string }> & { totalSinContactar?: number };
  enRiesgo: Bloque<GrupoPendiente>;
  noAbrioSinAvisar: Bloque<GrupoPendiente>;
  sinHorario: Bloque<AlumnoPendiente>;
  cuposPorAgotarse: Bloque<{ plan: string; max: number; usados: number; restantes: number }>;
};

type Estado = {
  datos: Pendientes | null;
  error: string | null;
  cargando: boolean;
  recargar: () => void;
};

const Contexto = createContext<Estado | null>(null);

const CADA_MS = 5 * 60 * 1000;

export const totalDe = (b: Bloque<unknown> | undefined) => (b && b.ok ? b.total : 0);

/** Contador del menú por ruta. Solo lo que pide una acción. */
export function contadoresDelMenu(p: Pendientes | null): Record<string, number> {
  if (!p) return {};
  return {
    "/admin/no-renovados": totalDe(p.pagosFallidos) + totalDe(p.cancelanPronto),
    "/admin/accesos": totalDe(p.accesosPendientes),
    "/admin/horarios": totalDe(p.enRiesgo) + totalDe(p.noAbrioSinAvisar) + totalDe(p.sinHorario),
    "/admin/cupos": totalDe(p.cuposPorAgotarse),
    "/admin/marketing": totalDe(p.leadsNuevos),
  };
}

export function ProveedorDePendientes({ activo, children }: { activo: boolean; children: React.ReactNode }) {
  const [datos, setDatos] = useState<Pendientes | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const enVuelo = useRef(false);

  const recargar = useCallback(async () => {
    if (enVuelo.current) return;
    enVuelo.current = true;
    setCargando(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/admin/pendientes`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) throw new Error(`Error del servidor (${res.status})`);
      setDatos(await res.json());
      setError(null);
    } catch (e) {
      // Se conserva lo que había: un parpadeo de red no tiene por qué vaciar el Inicio.
      setError(e instanceof Error ? e.message : "Error de red");
    } finally {
      enVuelo.current = false;
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    if (!activo) return;
    recargar();
    // Una pestaña oculta no consulta: es presupuesto del limitador.
    const t = setInterval(() => { if (document.visibilityState === "visible") recargar(); }, CADA_MS);
    return () => clearInterval(t);
  }, [activo, recargar]);

  return <Contexto.Provider value={{ datos, error, cargando, recargar }}>{children}</Contexto.Provider>;
}

export function usePendientes(): Estado {
  const c = useContext(Contexto);
  if (!c) throw new Error("usePendientes fuera de ProveedorDePendientes");
  return c;
}
