"use client";

import Link from "next/link";

export function Spinner({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={`${className} animate-spin`} fill="none" viewBox="0 0 24 24" aria-hidden>
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  );
}

/* ── Botones ────────────────────────────────────────────────────────────── */

const VARIANTES = {
  primario: "bg-falu-red-600 text-white hover:bg-falu-red-700 shadow-sm",
  secundario: "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50",
  peligro: "bg-red-600 text-white hover:bg-red-700 shadow-sm",
  fantasma: "text-gray-600 hover:bg-gray-100",
} as const;

export type VarianteDeBoton = keyof typeof VARIANTES;

export function Boton({
  variante = "primario",
  tamano = "md",
  cargando = false,
  icono,
  children,
  className = "",
  disabled,
  type = "button",
  ...rest
}: React.ComponentProps<"button"> & {
  variante?: VarianteDeBoton;
  tamano?: "sm" | "md";
  cargando?: boolean;
  icono?: React.ReactNode;
}) {
  const t = tamano === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm";
  return (
    <button
      type={type}
      disabled={disabled || cargando}
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${t} ${VARIANTES[variante]} ${className}`}
      {...rest}
    >
      {cargando ? <Spinner className="w-3.5 h-3.5" /> : icono}
      {children}
    </button>
  );
}

/** Enlace con forma de botón (para "Ir a…"). */
export function BotonEnlace({
  href,
  variante = "secundario",
  tamano = "sm",
  children,
}: {
  href: string;
  variante?: VarianteDeBoton;
  tamano?: "sm" | "md";
  children: React.ReactNode;
}) {
  const t = tamano === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm";
  return (
    <Link href={href} className={`inline-flex items-center justify-center gap-1.5 rounded-xl font-semibold transition ${t} ${VARIANTES[variante]}`}>
      {children}
    </Link>
  );
}

