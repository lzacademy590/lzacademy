"use client";

import { useEffect, useState } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// LAS RESEÑAS QUE VIENEN DE LA PLATAFORMA (2026-09-18)
//
// Son los comentarios que los alumnos escriben al terminar su evaluación final,
// y que el admin publica desde Admin › Evaluaciones › Ya llenadas. El carrusel
// de la portada las mezcla con las que tiene escritas a mano.
//
// ⚠️ Pide al backend del SITIO (`/config/testimonials`), no a la API de la
// plataforma: el mismo camino que el catálogo de planes. Así no hace falta CORS
// y la caché se comparte entre todas las visitas.
//
// ⚠️⚠️ **Fail-open, y acá significa "las de siempre"**: ante cualquier fallo se
// devuelve una lista VACÍA y el carrusel se queda con sus testimonios propios.
// Una portada sin reseñas se lee como un negocio sin alumnos.
// ─────────────────────────────────────────────────────────────────────────────

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL!;

export type TestimonioDePlataforma = {
  nombre: string;
  /** Lo eligió el alumno al dejar la reseña; puede no haberlo dicho. */
  pais: string | null;
  /** ISO-2, para la bandera. Null si no declaró país. */
  codigoPais: string | null;
  /** 1 a 5, o null: las estrellas son opcionales y las respuestas antiguas no las tienen. */
  estrellas: number | null;
  nivel: string | null;
  texto: string;
  fecha: string | null;
};

export function useTestimoniosDePlataforma() {
  const [items, setItems] = useState<TestimonioDePlataforma[]>([]);

  useEffect(() => {
    if (!BACKEND_URL) return;
    let vivo = true;

    fetch(`${BACKEND_URL}/config/testimonials`)
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((d) => {
        if (!vivo) return;
        const lista = Array.isArray(d?.items) ? d.items : [];
        setItems(
          lista.filter(
            (t: TestimonioDePlataforma) =>
              t && typeof t.texto === "string" && typeof t.nombre === "string",
          ),
        );
      })
      .catch(() => {
        // Silencio a propósito: el carrusel ya tiene con qué pintarse.
      });

    return () => {
      vivo = false;
    };
  }, []);

  return items;
}
