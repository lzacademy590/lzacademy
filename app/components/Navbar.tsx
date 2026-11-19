"use client";

import LogoDeMarca from "./LogoDeMarca";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

/*
  Barra del sitio simple (2026-11-18, HU-LZ-EMB criterio 11):
  Método · Nosotros · Planes · Acceder + el botón «Empezar».

  ⚠️ Cuatro entradas y no más, también en móvil. Se retiraron "Inicio" (lo hace
  el logo), "Interés", "Cómo funciona" (vive dentro de Método) y "Historia" /
  "Fundación LZ" (viven en Nosotros). Lo de alumnos (suscripción, horario,
  renovar, legal) va SOLO en el pie: aquí competía con el botón de los nuevos.
*/
const URL_PLATAFORMA = "https://app.lainz590.com/login";

const navItems = [
  { href: "/metodo", label: "Método" },
  { href: "/nosotros", label: "Nosotros" },
  { href: "/paso-tres", label: "Planes" },
];

function IconMenu(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconX(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M6 6l12 12M18 6l-12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const firstLinkRef = useRef<HTMLAnchorElement | null>(null);

  // El menú se cierra en el onClick de cada enlace (no con un efecto sobre la
  // ruta: un setState dentro de un efecto re-renderiza en cascada).

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      setTimeout(() => firstLinkRef.current?.focus(), 0);
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <header className="sticky top-0 z-60 border-b border-lz-bd bg-white">
      <div className="lz-wrap">
        <div className="flex h-[72px] items-center gap-6">
          <Link href="/" aria-label="LZ English Academy · ir al inicio" className="shrink-0">
            <LogoDeMarca className="h-10 max-w-[180px]" />
          </Link>

          <nav aria-label="Principal" className="ml-auto hidden items-center gap-1 md:flex">
            {navItems.map((item) => {
              const activo = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={activo ? "page" : undefined}
                  className={`inline-flex min-h-11 items-center rounded-full px-4 text-[15px] font-bold transition ${
                    activo ? "bg-lz-lila text-lz-grape" : "text-lz-ink hover:bg-lz-lila"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
            <a
              href={URL_PLATAFORMA}
              className="inline-flex min-h-11 items-center rounded-full px-4 text-[15px] font-bold text-lz-ink transition hover:bg-lz-lila"
            >
              Acceder
            </a>
          </nav>

          <Link href="/paso-uno" className="lz-btn lz-btn-1 lz-btn-sm hidden md:inline-flex">
            Empezar
          </Link>

          <button
            type="button"
            onClick={() => setOpen(true)}
            className="ml-auto inline-flex h-12 w-12 items-center justify-center rounded-full border border-lz-bd2 text-lz-ink transition hover:bg-lz-lila md:hidden"
            aria-label="Abrir menú"
            aria-expanded={open}
          >
            <IconMenu className="h-6 w-6" />
          </button>
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-70 md:hidden" role="dialog" aria-modal="true" aria-label="Menú">
          <button
            type="button"
            aria-label="Cerrar menú"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-lz-ink/40"
          />
          <div className="absolute inset-x-0 top-0 border-b border-lz-bd bg-white shadow-lg">
            <div className="lz-wrap">
              <div className="flex h-[72px] items-center justify-between">
                <Link href="/" onClick={() => setOpen(false)} aria-label="Ir al inicio">
                  <LogoDeMarca className="h-10 max-w-[180px]" />
                </Link>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-lz-bd2 text-lz-ink"
                  aria-label="Cerrar menú"
                >
                  <IconX className="h-6 w-6" />
                </button>
              </div>
              <nav aria-label="Menú móvil" className="flex flex-col pb-6">
                {navItems.map((item, idx) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    ref={idx === 0 ? firstLinkRef : null}
                    onClick={() => setOpen(false)}
                    aria-current={pathname === item.href ? "page" : undefined}
                    className="flex min-h-[52px] items-center border-b border-lz-bd text-[18px] font-bold text-lz-ink"
                  >
                    {item.label}
                  </Link>
                ))}
                <a
                  href={URL_PLATAFORMA}
                  className="flex min-h-[52px] items-center border-b border-lz-bd text-[18px] font-bold text-lz-ink"
                >
                  Acceder
                </a>
                <Link href="/paso-uno" onClick={() => setOpen(false)} className="lz-btn lz-btn-1 mt-5 w-full">
                  Empezar
                </Link>
              </nav>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
