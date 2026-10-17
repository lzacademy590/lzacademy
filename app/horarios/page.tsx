"use client";

/*
  /horarios (2026-10-16): los horarios de grupo publicados, para quien todavía
  no ha comprado. Es la página que el equipo manda por WhatsApp cuando alguien
  pregunta "¿a qué hora son las clases?".

  Solo INFORMA: el horario se elige en el formulario de pago, que es el único
  que valida plazas y cobra. Ver HorariosPublicados.
*/

import Link from "next/link";
import HorariosPublicados from "@/app/components/HorariosPublicados";

export default function HorariosPage() {
  return (
    <main className="min-h-screen bg-[#fdf7f4] px-4 py-10 sm:py-14">
      <div className="mx-auto w-full max-w-[820px]">
        <h1 className="text-3xl sm:text-4xl font-black text-zinc-900">Horarios de clase</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-zinc-700">
          Estos son los horarios de las clases en vivo para los próximos inicios. Cada grupo se
          abre cuando reúne el mínimo de alumnos. El horario lo eliges al inscribirte.
        </p>
        <div className="mt-8">
          <HorariosPublicados modo="abierto" />
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/paso-tres"
            className="inline-flex items-center rounded-2xl px-7 py-3.5 text-[15px] font-extrabold text-zinc-800 bg-white shadow-sm"
            style={{ border: "2px solid #222" }}
          >
            Ver los planes
          </Link>
        </div>
      </div>
    </main>
  );
}
