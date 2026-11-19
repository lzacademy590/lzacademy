"use client";

import { useEffect, useState } from "react";

/*
  Los logos del sitio, editables en Admin › Marca (2026-11-18).

  ⚠️ **Falla en abierto**: mientras carga, o si el backend no responde, se pintan
  los logos de fábrica de /public. Una barra sin logo por un fallo de red es peor
  que un logo de ayer.

  ⚠️ Una sola lectura por página (single-flight + caché de módulo), como el
  catálogo: la barra y el pie lo piden a la vez y cada petición gasta del
  limitador del backend.
*/
export const LOGO_DE_FABRICA = "/lainz590-logo.png";
export const LOGO_OSCURO_DE_FABRICA = "/lainz590-logo-blanco.png";

export interface Marca {
  logo: string;
  logoOscuro: string;
}

const DE_FABRICA: Marca = { logo: LOGO_DE_FABRICA, logoOscuro: LOGO_OSCURO_DE_FABRICA };
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

let enCache: Marca | null = null;
let enVuelo: Promise<Marca> | null = null;

/**
 * Solo una URL https absoluta (o la del Storage local en desarrollo): lo que
 * llegue raro cae al de fábrica. ⚠️ Se compara el `hostname`, no un prefijo:
 * `http://localhost.cualquiera` y `//host-ajeno/x.png` pasaban con la versión
 * anterior (ronda de agentes, 2026-11-18).
 */
function urlSegura(v: unknown, respaldo: string): string {
  if (typeof v !== "string" || !v || v.startsWith("//")) return respaldo;
  try {
    const u = new URL(v);
    if (u.protocol === "https:") return v;
    if (u.protocol === "http:" && (u.hostname === "127.0.0.1" || u.hostname === "localhost")) return v;
  } catch {
    // no es absoluta
  }
  return respaldo;
}

function leerMarca(): Promise<Marca> {
  if (enCache) return Promise.resolve(enCache);
  if (!enVuelo) {
    enVuelo = (BACKEND_URL ? fetch(`${BACKEND_URL}/config/marca`) : Promise.reject(new Error("sin backend")))
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d) => {
        enCache = { logo: urlSegura(d?.logo, LOGO_DE_FABRICA), logoOscuro: urlSegura(d?.logoOscuro, LOGO_OSCURO_DE_FABRICA) };
        return enCache;
      })
      .catch(() => DE_FABRICA)
      .finally(() => {
        enVuelo = null;
      });
  }
  return enVuelo;
}

/** Tras guardar en el admin: la próxima lectura va al backend. */
export function olvidarMarca() {
  enCache = null;
}

export function useMarca(): Marca {
  const [marca, setMarca] = useState<Marca>(() => enCache ?? DE_FABRICA);
  useEffect(() => {
    let vivo = true;
    leerMarca().then((m) => {
      if (vivo) setMarca(m);
    });
    return () => {
      vivo = false;
    };
  }, []);
  return marca;
}
