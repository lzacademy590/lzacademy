"use client";

// Kit de piezas del panel admin. Antes cada pantalla dibujaba su propia tarjeta de
// número (seis copias), su paginación (cinco), su "Cargando…" (doce) y su botón de
// guardar, cada uno de un color. Una pantalla nueva se arma con esto y se ve igual
// que las demás.

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { planColor } from "../_utils/planColors";
import { ESTADOS_DE_ALUMNO, ESTADOS_DE_SUSCRIPCION, TONO_CLASES, type Tono } from "./etiquetas";

export { Spinner, Boton, BotonEnlace, type VarianteDeBoton } from "./boton";
import { Spinner } from "./boton";
export { useToast } from "./toast";
export { useConfirmar } from "./confirmar";
export { EscribirCorreo, PLANTILLAS, type DestinoDelCorreo, type GrupoDeAlumnos, type Plantilla } from "./escribir-correo";
export * from "./etiquetas";

/* ── Página ─────────────────────────────────────────────────────────────── */

/** Contenedor de página. `ancho="estrecho"` para formularios de configuración. */
export function Pagina({
  children,
  ancho = "ancho",
}: {
  children: React.ReactNode;
  ancho?: "ancho" | "medio" | "estrecho";
}) {
  const max = { ancho: "max-w-screen-xl", medio: "max-w-5xl", estrecho: "max-w-3xl" }[ancho];
  return <div className={`p-4 md:p-8 ${max} mx-auto`}>{children}</div>;
}

export function EncabezadoDePagina({
  titulo,
  descripcion,
  acciones,
}: {
  titulo: string;
  descripcion?: React.ReactNode;
  acciones?: React.ReactNode;
}) {
  return (
    <div className="mb-6 md:mb-7 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">{titulo}</h1>
        {descripcion && <p className="text-sm text-gray-500 mt-1">{descripcion}</p>}
      </div>
      {acciones && <div className="flex flex-wrap items-center gap-2 flex-shrink-0">{acciones}</div>}
    </div>
  );
}

const EVENTO_ALMACEN = "lz-admin-almacen";

/**
 * Un valor de `localStorage` que se puede leer en el render sin descuadrar la
 * hidratación: en el servidor (y en el primer render del cliente) vale `null`.
 * Si el almacenamiento no está disponible, también `null`: solo no se recuerda.
 */
export function useAlmacenLocal(clave: string | null): [string | null, (v: string) => void] {
  const valor = useSyncExternalStore(
    (avisar) => {
      window.addEventListener("storage", avisar);
      window.addEventListener(EVENTO_ALMACEN, avisar);
      return () => {
        window.removeEventListener("storage", avisar);
        window.removeEventListener(EVENTO_ALMACEN, avisar);
      };
    },
    () => { try { return clave ? localStorage.getItem(clave) : null; } catch { return null; } },
    () => null,
  );
  const guardar = (v: string) => {
    if (!clave) return;
    try { localStorage.setItem(clave, v); } catch { /* sin almacenamiento */ }
    window.dispatchEvent(new Event(EVENTO_ALMACEN));
  };
  return [valor, guardar];
}

/**
 * Recuerda si un apartado plegable está abierto, por pantalla y por título.
 * Lo que no se ha tocado sigue `inicial`.
 */
export function usePlegado(clave: string | null, inicial = true) {
  const ruta = usePathname();
  const [guardado, guardar] = useAlmacenLocal(clave ? `lz-admin-plegado:${clave}@${ruta}` : null);
  const [local, setLocal] = useState(inicial);
  const abierto = guardado === "1" ? true : guardado === "0" ? false : local;
  const alternar = () => {
    setLocal(!abierto);
    guardar(abierto ? "0" : "1");
  };
  return { abierto, alternar };
}

const CHEVRON = (abierto: boolean) => (
  <svg className={`w-4 h-4 mt-0.5 flex-shrink-0 text-gray-300 transition-transform ${abierto ? "" : "-rotate-90"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
);

/**
 * Bloque blanco con título opcional. Con título se PLIEGA haciendo clic en la
 * cabecera (`plegable={false}` lo impide; `abierta={false}` lo hace nacer
 * cerrado). Lo que el admin pliega se recuerda por pantalla.
 */
export function Tarjeta({
  titulo,
  descripcion,
  acciones,
  children,
  sinRelleno = false,
  className = "",
  plegable = true,
  abierta = true,
}: {
  titulo?: React.ReactNode;
  descripcion?: React.ReactNode;
  acciones?: React.ReactNode;
  children: React.ReactNode;
  sinRelleno?: boolean;
  className?: string;
  plegable?: boolean;
  abierta?: boolean;
}) {
  const sePliega = plegable && !!titulo;
  const { abierto, alternar } = usePlegado(sePliega && typeof titulo === "string" ? titulo : null, abierta);
  const visible = !sePliega || abierto;
  return (
    <section className={`bg-white rounded-2xl border border-gray-100 overflow-hidden ${className}`}>
      {(titulo || acciones) && (
        <div className={`px-5 py-3.5 flex items-center justify-between gap-3 ${visible ? "border-b border-gray-50" : ""}`}>
          {sePliega ? (
            <button
              type="button"
              onClick={alternar}
              aria-expanded={abierto}
              className="min-w-0 flex-1 flex items-start gap-2 text-left cursor-pointer group"
            >
              {CHEVRON(abierto)}
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-gray-700 group-hover:text-gray-900">{titulo}</span>
                {descripcion && abierto && <span className="block text-xs text-gray-400 mt-0.5">{descripcion}</span>}
              </span>
            </button>
          ) : (
            <div className="min-w-0">
              {titulo && <h3 className="text-sm font-semibold text-gray-700">{titulo}</h3>}
              {descripcion && <p className="text-xs text-gray-400 mt-0.5">{descripcion}</p>}
            </div>
          )}
          {acciones && visible && <div className="flex-shrink-0 flex flex-wrap items-center justify-end gap-2">{acciones}</div>}
        </div>
      )}
      {/* Oculto, no desmontado: un formulario a medias dentro no pierde lo escrito. */}
      <div className={`${sinRelleno ? "" : "p-5"} ${visible ? "" : "hidden"}`}>{children}</div>
    </section>
  );
}

/* ── Números ────────────────────────────────────────────────────────────── */

const ACENTOS: Record<string, string> = {
  marca: "bg-falu-red-50 text-falu-red-600",
  violeta: "bg-violet-50 text-violet-600",
  verde: "bg-emerald-50 text-emerald-600",
  ambar: "bg-amber-50 text-amber-600",
  azul: "bg-blue-50 text-blue-600",
  rojo: "bg-red-50 text-red-600",
  gris: "bg-gray-100 text-gray-500",
};

export function TarjetaDeNumero({
  etiqueta,
  valor,
  detalle,
  icono,
  acento = "marca",
}: {
  etiqueta: string;
  valor: React.ReactNode;
  detalle?: React.ReactNode;
  icono?: React.ReactNode;
  acento?: keyof typeof ACENTOS;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 flex items-start gap-3 sm:gap-4">
      {icono && (
        <div className={`hidden sm:flex flex-shrink-0 w-10 h-10 rounded-xl items-center justify-center ${ACENTOS[acento]}`}>
          {icono}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-[11px] sm:text-xs font-medium text-gray-400 uppercase tracking-wide leading-tight">{etiqueta}</p>
        <p className="text-lg sm:text-2xl font-bold text-gray-800 mt-0.5 truncate">{valor}</p>
        {detalle && <p className="text-xs text-gray-400 mt-0.5 truncate">{detalle}</p>}
      </div>
    </div>
  );
}

/** Rejilla de tarjetas de número: 1 columna en móvil, `columnas` en escritorio. */
export function FilaDeNumeros({ children, columnas = 4 }: { children: React.ReactNode; columnas?: 2 | 3 | 4 | 5 }) {
  // Con el menú lateral (240 px), 4-5 columnas solo caben a partir de xl.
  const lg = { 2: "lg:grid-cols-2", 3: "lg:grid-cols-3", 4: "xl:grid-cols-4", 5: "lg:grid-cols-3 xl:grid-cols-5" }[columnas];
  // Dos por fila ya en el móvil: una por fila eran cuatro pantallas de scroll para cuatro números.
  return <div className={`grid grid-cols-2 ${lg} gap-3 sm:gap-4 mb-6`}>{children}</div>;
}

/* ── Estados de carga ───────────────────────────────────────────────────── */

export function Cargando({ texto = "Cargando…" }: { texto?: string }) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]" role="status">
      <div className="flex flex-col items-center gap-3 text-gray-400">
        <Spinner className="w-8 h-8" />
        <span className="text-sm">{texto}</span>
      </div>
    </div>
  );
}

export function Vacio({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-gray-400 text-center py-8">{children}</p>;
}

/* ── Insignias ──────────────────────────────────────────────────────────── */

export function Chip({ tono = "gris", conPunto = false, children }: { tono?: Tono; conPunto?: boolean; children: React.ReactNode }) {
  const c = TONO_CLASES[tono];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${c.chip}`}>
      {conPunto && <span className={`w-1.5 h-1.5 rounded-full ${c.punto}`} />}
      {children}
    </span>
  );
}

/** Punto del color del plan + su nombre. Color de `lib/plans.ts`. */
export function PlanBadge({ plan }: { plan: string | null | undefined }) {
  if (!plan) return <span className="text-gray-300 text-xs">—</span>;
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-gray-700 whitespace-nowrap">
      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${planColor(plan)}`} />
      {plan}
    </span>
  );
}

export function EstadoDeAlumno({ estado }: { estado: string | null | undefined }) {
  if (!estado) return <span className="text-gray-300 text-xs">—</span>;
  const e = ESTADOS_DE_ALUMNO[estado] ?? { label: estado, tono: "gris" as Tono };
  return <Chip tono={e.tono} conPunto>{e.label}</Chip>;
}

export function EstadoDeSuscripcion({ estado }: { estado: string | null | undefined }) {
  if (!estado) return <span className="text-gray-300 text-xs">—</span>;
  const e = ESTADOS_DE_SUSCRIPCION[estado] ?? { label: estado, tono: "gris" as Tono };
  return <Chip tono={e.tono} conPunto>{e.label}</Chip>;
}

/* ── Parámetros de la URL ───────────────────────────────────────────────── */

/**
 * Lee `?nombre=` al MONTAR y se lo pasa a `aplicar`. Es lo que permite que el
 * Inicio enlace a una lista ya filtrada (`/admin/no-renovados?tipo=pago-fallido`).
 *
 * ⚠️ No vale leerlo en el inicializador de `useState`: al llegar por un `<Link>`,
 * Next pinta la página nueva ANTES de cambiar la URL, así que el inicializador lee
 * la de la página anterior. Medido: escribiendo la dirección a mano funcionaba y
 * desde el Inicio abría la lista sin filtrar. En un efecto la URL ya es la nueva.
 * (Sin `useSearchParams` para no obligar a envolver cada página en Suspense.)
 */
export function useParametroDeUrl(nombre: string, aplicar: (valor: string | null) => void) {
  const ref = useRef(aplicar);
  useEffect(() => { ref.current = aplicar; });
  useEffect(() => {
    ref.current(new URLSearchParams(window.location.search).get(nombre));
  }, [nombre]);
}

/* ── Paginación ─────────────────────────────────────────────────────────── */

/**
 * Pagina una lista en el cliente. Vuelve a la página 1 cuando cambia `reinicio`
 * (los filtros), para no quedarse en una página que ya no existe.
 */
export function usePaginacion<T>(items: T[], porPagina = 15, reinicio: unknown = null) {
  const [pagina, setPagina] = useState(1);
  const totalPaginas = Math.max(1, Math.ceil(items.length / porPagina));
  const [reinicioPrevio, setReinicioPrevio] = useState(reinicio);
  if (reinicioPrevio !== reinicio) {
    setReinicioPrevio(reinicio);
    setPagina(1);
  }
  const actual = Math.min(pagina, totalPaginas);
  const visibles = useMemo(
    () => items.slice((actual - 1) * porPagina, actual * porPagina),
    [items, actual, porPagina],
  );
  return { pagina: actual, setPagina, totalPaginas, visibles, total: items.length };
}

export function Paginacion({
  pagina,
  totalPaginas,
  setPagina,
  total,
}: {
  pagina: number;
  totalPaginas: number;
  setPagina: (p: number) => void;
  total?: number;
}) {
  if (totalPaginas <= 1) return null;
  const btn = "px-3 py-1.5 text-xs rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer";
  return (
    <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50">
      <p className="text-xs text-gray-400">
        Página <strong className="text-gray-600">{pagina}</strong> de <strong className="text-gray-600">{totalPaginas}</strong>
        {total !== undefined && <span className="hidden sm:inline"> · {total} en total</span>}
      </p>
      <div className="flex gap-2">
        <button onClick={() => setPagina(pagina - 1)} disabled={pagina === 1} className={btn}>← Anterior</button>
        <button onClick={() => setPagina(pagina + 1)} disabled={pagina === totalPaginas} className={btn}>Siguiente →</button>
      </div>
    </div>
  );
}

/* ── Filtros ────────────────────────────────────────────────────────────── */

export function CampoDeBusqueda({
  valor,
  onCambio,
  placeholder = "Buscar por nombre o correo…",
}: {
  valor: string;
  onCambio: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative flex-1 min-w-[200px]">
      <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
      </svg>
      <input
        type="search"
        value={valor}
        onChange={(e) => onCambio(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-falu-red-200 focus:border-falu-red-300"
      />
    </div>
  );
}

/** Grupo de píldoras para elegir UNA opción (filtro de plan, de estado…). */
export function Pildoras<T extends string>({
  opciones,
  valor,
  onCambio,
}: {
  opciones: { valor: T; label: React.ReactNode; cuenta?: number }[];
  valor: T;
  onCambio: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5" role="radiogroup">
      {opciones.map((o) => {
        const activa = o.valor === valor;
        return (
          <button
            key={o.valor}
            role="radio"
            aria-checked={activa}
            onClick={() => onCambio(o.valor)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer ${
              activa ? "bg-gray-800 text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            {o.label}
            {o.cuenta !== undefined && (
              <span className={`ml-1.5 ${activa ? "text-white/70" : "text-gray-400"}`}>{o.cuenta}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ── Exportar ───────────────────────────────────────────────────────────── */

/** Descarga filas como CSV (con BOM, para que Excel lea bien los acentos). */
export function descargarCSV(nombre: string, cabeceras: string[], filas: (string | number | null | undefined)[][]) {
  const celda = (v: string | number | null | undefined) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csv = [cabeceras, ...filas].map((f) => f.map(celda).join(",")).join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nombre;
  a.click();
  URL.revokeObjectURL(url);
}

export const ICONO_DESCARGA = (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);

/* ── Avisos en línea ────────────────────────────────────────────────────── */

export function Aviso({
  tono = "ambar",
  titulo,
  children,
  accion,
}: {
  tono?: "ambar" | "rojo" | "azul" | "verde";
  titulo?: React.ReactNode;
  children?: React.ReactNode;
  accion?: React.ReactNode;
}) {
  const c = {
    ambar: "bg-amber-50 border-amber-200 text-amber-800",
    rojo: "bg-red-50 border-red-200 text-red-700",
    azul: "bg-blue-50 border-blue-200 text-blue-800",
    verde: "bg-emerald-50 border-emerald-200 text-emerald-800",
  }[tono];
  return (
    <div className={`rounded-xl border px-4 py-3 text-sm flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 ${c}`} role={tono === "rojo" ? "alert" : undefined}>
      <div className="flex-1 min-w-0">
        {titulo && <p className="font-semibold">{titulo}</p>}
        {children && <div className={titulo ? "mt-0.5 opacity-90" : ""}>{children}</div>}
      </div>
      {accion && <div className="flex-shrink-0">{accion}</div>}
    </div>
  );
}
