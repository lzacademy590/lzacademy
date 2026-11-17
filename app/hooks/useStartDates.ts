"use client";

import { useEffect, useState } from "react";

export interface StartDate {
  value: string;
  label: string;
  enabled: boolean;
  special?: boolean;
  excludedPlans?: string[];
  // Días que se sigue vendiendo DESPUÉS del inicio (Admin › Fechas). 0 o ausente:
  // solo hasta el mismo día de inicio.
  diasDeGracia?: number;
}

/*
  Último día en que se puede COMPRAR esa fecha (2026-11-16): su día de inicio más
  sus días de gracia. Misma regla que `ultimoDiaDeCompra` del backend, que es quien
  decide; esta copia solo evita ofrecer una fecha que el servidor rechazaría.
*/
export function ultimoDiaDeCompra(d: StartDate): string {
  const n = Number(d.diasDeGracia);
  const gracia = Number.isInteger(n) && n > 0 ? Math.min(n, 60) : 0;
  const [y, m, dia] = d.value.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, dia + gracia)).toISOString().slice(0, 10);
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL!;

/*
  UNA lectura por página, no una por componente (2026-10-17). Desde que las cartas
  de /paso-tres y las landings dicen "Próximo grupo: …", este hook se monta varias
  veces a la vez (dos rejillas × cuatro cartas). Con un fetch por montaje eran
  ocho peticiones iguales contra el limitador de 100/15 min por IP. Misma receta
  que `usePlanesDelCatalogo`: single-flight y un TTL corto.

  Un fallo NO se guarda: el siguiente montaje vuelve a intentarlo.
*/
const TTL_MS = 60_000;
let enCache: { datos: StartDate[]; en: number } | null = null;
let enVuelo: Promise<StartDate[]> | null = null;

function leerFechas(): Promise<StartDate[]> {
  if (enCache && Date.now() - enCache.en < TTL_MS) return Promise.resolve(enCache.datos);
  if (enVuelo) return enVuelo;
  enVuelo = fetch(`${BACKEND_URL}/config/start-dates`)
    .then((r) => r.json())
    .then((data) => {
      const datos = Array.isArray(data) ? (data as StartDate[]) : [];
      enCache = { datos, en: Date.now() };
      return datos;
    })
    .finally(() => {
      enVuelo = null;
    });
  return enVuelo;
}

export function useStartDates() {
  const [dates, setDates] = useState<StartDate[]>(() => enCache?.datos ?? []);
  const [loading, setLoading] = useState(() => !enCache);

  useEffect(() => {
    let vivo = true;
    leerFechas()
      .then((datos) => { if (vivo) { setDates(datos); setLoading(false); } })
      .catch(() => { if (vivo) setLoading(false); });
    return () => { vivo = false; };
  }, []);

  // "Hoy" en hora del PACÍFICO (2026-11-16), la misma con la que el servidor decide
  // si una fecha aún se vende. Con la hora del navegador, en Honduras una fecha
  // desaparecía a las 22:00 PT, y en Hawái se ofrecía una que el servidor ya
  // rechazaba.
  const todayLocal = new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Los_Angeles" }).format(new Date());
  // Orden ascendente por fecha (YYYY-MM-DD) para que [0] sea siempre la más cercana.
  const availableDates = dates
    .filter((d) => ultimoDiaDeCompra(d) >= todayLocal)
    .sort((a, b) => a.value.localeCompare(b.value));

  // Current calendar month in PT — used by form date pickers
  const currentMonthPT = new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Los_Angeles" })
    .format(new Date())
    .slice(0, 7); // "YYYY-MM"
  const datesCurrentMonth = availableDates.filter((d) => d.value.startsWith(currentMonthPT));

  return { dates: availableDates, datesCurrentMonth, loading };
}
