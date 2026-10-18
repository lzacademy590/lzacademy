"use client";

import { useEffect, useState } from "react";

export interface StartDate {
  value: string;
  label: string;
  enabled: boolean;
  special?: boolean;
  excludedPlans?: string[];
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

  // "Hoy" en la zona horaria local del usuario (YYYY-MM-DD). Usamos la zona del
  // navegador (sin timeZone) para que cada fecha de inicio siga disponible todo su
  // día local —hasta las 11:59pm del usuario— y desaparezca recién al pasar a la
  // medianoche local. Antes se calculaba con toISOString() (UTC), lo que cortaba
  // las fechas a destiempo según la zona horaria del usuario.
  const todayLocal = new Intl.DateTimeFormat("sv-SE").format(new Date());
  // Orden ascendente por fecha (YYYY-MM-DD) para que [0] sea siempre la más cercana.
  const availableDates = dates
    .filter((d) => d.value >= todayLocal)
    .sort((a, b) => a.value.localeCompare(b.value));

  // Current calendar month in PT — used by form date pickers
  const currentMonthPT = new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Los_Angeles" })
    .format(new Date())
    .slice(0, 7); // "YYYY-MM"
  const datesCurrentMonth = availableDates.filter((d) => d.value.startsWith(currentMonthPT));

  return { dates: availableDates, datesCurrentMonth, loading };
}
