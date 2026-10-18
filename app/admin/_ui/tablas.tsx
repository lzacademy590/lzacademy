"use client";

// Las tablas del panel que no caben se APILAN: cada fila pasa a ser una ficha
// con «etiqueta · valor» por línea (el estilo está en globals.css, `lz-apilada`).
//
// Antes cada tabla traía su `overflow-x-auto` y, en cuanto había un correo largo
// o una columna de más, la mitad quedaba fuera de la pantalla — en el móvil y
// también en un portátil con el menú lateral abierto. Escribir una versión de
// fichas a mano por tabla es lo que hacían tres pantallas, y las otras seis no.
// Esto lo hace para TODAS, incluidas las que se añadan, sin tocarlas.
//
// ⚠️ Se decide midiendo la tabla SIN apilar (se quita la clase, se mide y se
// vuelve a poner en el mismo instante, sin pintar entre medias). Medirla ya
// apilada siempre daría «cabe» y la tabla oscilaría entre los dos modos.

import { useEffect } from "react";

function etiquetar(tabla: HTMLTableElement) {
  const cabeceras = Array.from(tabla.tHead?.rows[0]?.cells ?? []);
  if (cabeceras.length === 0) return;
  // Una cabecera con colSpan ocupa varias columnas: se repite su rótulo.
  const rotulos: string[] = [];
  for (const th of cabeceras) {
    const texto = (th.textContent ?? "").trim();
    for (let i = 0; i < Math.max(1, th.colSpan); i++) rotulos.push(texto);
  }
  for (const cuerpo of Array.from(tabla.tBodies)) {
    for (const fila of Array.from(cuerpo.rows)) {
      let col = 0;
      for (const celda of Array.from(fila.cells)) {
        // La fila de «sin resultados» ocupa toda la tabla: no lleva rótulo.
        if (celda.colSpan > 1) celda.removeAttribute("data-label");
        else if (celda.getAttribute("data-label") !== rotulos[col]) celda.setAttribute("data-label", rotulos[col] ?? "");
        col += Math.max(1, celda.colSpan);
      }
    }
  }
}

function anchoDisponible(tabla: HTMLTableElement, raiz: HTMLElement) {
  // El hueco real es el del contenedor con scroll (si lo hay) y, como mucho, el
  // de la zona de contenido: un contenedor de rejilla sin `min-w-0` crece con la
  // tabla y por sí solo nunca diría que no cabe.
  let ancho = raiz.clientWidth;
  const izquierdaRaiz = raiz.getBoundingClientRect().left;
  let p = tabla.parentElement;
  while (p && p !== raiz) {
    const s = getComputedStyle(p);
    if (/(auto|scroll|hidden)/.test(s.overflowX)) {
      ancho = Math.min(ancho, p.clientWidth);
      break;
    }
    p = p.parentElement;
  }
  // Lo que quede a la derecha de la zona de contenido tampoco se ve.
  const izquierda = tabla.getBoundingClientRect().left - izquierdaRaiz;
  return Math.min(ancho, raiz.clientWidth - Math.max(0, izquierda));
}

function decidir(tabla: HTMLTableElement, raiz: HTMLElement) {
  // Oculta (p. ej. la versión de escritorio en un móvil): no hay nada que medir.
  if (!tabla.getClientRects().length) return;
  etiquetar(tabla);
  // Tres escalones, del menos al más invasivo: tal cual → dejando que el texto
  // parta línea (sigue siendo tabla) → apilada en fichas.
  tabla.classList.remove("lz-apilada", "lz-compacta");
  const cabe = () => tabla.scrollWidth <= anchoDisponible(tabla, raiz) + 1;
  if (cabe()) return;
  tabla.classList.add("lz-compacta");
  if (cabe()) return;
  tabla.classList.remove("lz-compacta");
  tabla.classList.add("lz-apilada");
}

/** Se monta UNA vez en el layout del panel y vigila todas sus tablas. */
export function AdaptarTablas({ raizId }: { raizId: string }) {
  useEffect(() => {
    // ⚠️ La raíz se busca en CADA revisión: React puede volver a montar el
    // `<main>` después de este efecto, y un vigilante atado al nodo del primer
    // render se queda mirando uno que ya no está en la página (medido).
    let pendiente: ReturnType<typeof setTimeout> | 0 = 0;
    let observada: HTMLElement | null = null;
    const alCambiarTamano = new ResizeObserver(() => revisar());
    const revisar = () => {
      if (pendiente) return;
      // Un temporizador y no requestAnimationFrame: éste no corre con la pestaña
      // oculta, y la tabla tiene que estar decidida al volver a ella.
      pendiente = setTimeout(() => {
        pendiente = 0;
        const raiz = document.getElementById(raizId);
        if (!raiz) return;
        if (raiz !== observada) {
          if (observada) alCambiarTamano.unobserve(observada);
          alCambiarTamano.observe(raiz);
          observada = raiz;
        }
        raiz.querySelectorAll("table").forEach((t) => decidir(t as HTMLTableElement, raiz));
      }, 30);
    };
    revisar();
    // Filas nuevas, otra página, un filtro, una tarjeta que se despliega…
    // Solo cambios de contenido: las clases que ponemos aquí no lo disparan.
    const alCambiarContenido = new MutationObserver(revisar);
    alCambiarContenido.observe(document.body, { childList: true, subtree: true, characterData: true });
    // Desplegar una tarjeta solo cambia una clase: lo cubre el ResizeObserver,
    // porque la raíz crece.
    return () => {
      if (pendiente) clearTimeout(pendiente);
      alCambiarTamano.disconnect();
      alCambiarContenido.disconnect();
    };
  }, [raizId]);
  return null;
}
