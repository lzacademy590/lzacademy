"use client";

import { testimonials } from "@/app/components/Testimonials";
import { useTestimoniosDePlataforma } from "@/app/hooks/useTestimoniosDePlataforma";

/*
  Testimonios del inicio (HU-LZ-EMB, criterio 10, decisión del 2026-11-18).

  ⚠️ **Sin foto o video, el testimonio se publica igual**, con la inicial en un
  círculo. No se pinta un hueco de "foto pendiente": se lee como roto. El día que
  un alumno dé permiso para su foto, se le añade aquí.

  Primero las reseñas publicadas desde el admin de la plataforma (son las más
  recientes) y detrás las escritas a mano. Se enseñan seis: el resto sigue en el
  carrusel de siempre (`TestimonialsSection`).

  ⚠️ El nivel de una reseña de la plataforma viene como "B2_1": se enseña "B2.1",
  igual que en el carrusel.
*/
const CUANTOS = 6;

export default function TestimoniosDelInicio() {
  const deLaPlataforma = useTestimoniosDePlataforma();

  const tarjetas = [
    ...deLaPlataforma.map((t, i) => ({
      clave: `p-${i}-${t.nombre}`,
      nombre: t.nombre,
      texto: t.texto,
      lugar: t.pais ?? (t.nivel ? `Nivel ${t.nivel.replace("_", ".")}` : null),
    })),
    ...testimonials.map((t) => ({ clave: t.name, nombre: t.name, texto: t.text, lugar: t.country })),
  ].slice(0, CUANTOS);

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {tarjetas.map((t) => (
        <figure key={t.clave} className="lz-card m-0 flex flex-col gap-4 p-6">
          <blockquote className="m-0 line-clamp-[10] text-[17px] leading-relaxed text-lz-ink">
            “{t.texto}”
          </blockquote>
          <figcaption className="mt-auto flex items-center gap-3 text-[14px] text-lz-ink2">
            <span
              aria-hidden="true"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-lz-lila2 font-bold text-lz-violet"
            >
              {t.nombre.trim().charAt(0).toUpperCase()}
            </span>
            <span>
              <b className="block text-lz-ink">{t.nombre}</b>
              {t.lugar}
            </span>
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
