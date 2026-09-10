// ─────────────────────────────────────────────────────────────────────────────
// LOS DÍAS DE CLASE, TAL Y COMO LOS MANDA LA PLATAFORMA (2026-09-07)
//
// ⚠️⚠️ **Convención ZOOM: 1=Dom, 2=Lun … 7=Sáb.** No es la de `Date.getDay()`
// (0=Dom … 6=Sáb). Los días viajan así porque es la convención con la que la
// plataforma guarda sus plantillas y sus reuniones de Zoom. Aquí solo se les
// pone nombre: no se traduce entre convenciones ni se compara con
// `new Date().getDay()`. Un desfase de uno movería el día anunciado sin que nada
// fallara a la vista.
//
// ⚠️ Existe porque hasta hoy los días estaban ESCRITOS A MANO en cuatro archivos
// de este website, y se contradecían: la card de Premium prometía "lunes a
// jueves" y la landing a la que lleva, "lunes a miércoles" — dentro del mismo
// embudo.
// ─────────────────────────────────────────────────────────────────────────────

const NOMBRES = ["", "domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

/** Nombre en español de un día en convención Zoom. Fuera de rango, el número. */
export function nombreDeDia(dia: number): string {
  // El rango se comprueba y no se deduce de `NOMBRES[dia]`: el índice 0 EXISTE
  // (cadena vacía, para que 1 sea domingo), así que un `??` no saltaría nunca con
  // el 0 — y 0 es domingo en la OTRA convención, o sea el error más probable.
  if (!Number.isInteger(dia) || dia < 1 || dia > 7) return String(dia);
  return NOMBRES[dia];
}

/**
 * La lista como se lee: `[2,4,6]` → `"lunes, miércoles y viernes"`.
 *
 * Devuelve cadena vacía con la lista vacía, y quien llama decide qué decir: no es
 * "ningún día", es "sin día fijo" (los planes 1 a 1 lo acuerdan con cada alumno).
 */
export function listaDeDias(dias: number[]): string {
  const nombres = [...dias].sort((a, b) => a - b).map(nombreDeDia);
  if (nombres.length === 0) return "";
  if (nombres.length === 1) return nombres[0];
  return `${nombres.slice(0, -1).join(", ")} y ${nombres[nombres.length - 1]}`;
}

/** Modalidad de la clase, tal y como la manda la plataforma. */
export const UNO_A_UNO = "UNO_A_UNO";

/**
 * La frase de la card: *"Clases en vivo lunes a jueves"*, *"1 sesión 1 a 1 por
 * semana"*.
 *
 * ⚠️ Son CUATRO respuestas, y confundir las dos primeras es lo que hace que una
 * card mienta:
 *   · `null`   — la plataforma no lo dijo (versión antigua, respuesta a medias).
 *                No se pinta nada y la card se queda como estaba.
 *   · 1 a 1    — se dice la FRECUENCIA, no los días: su horario se acuerda con
 *                cada alumno, así que no hay día fijo que prometer.
 *   · con días — se nombran.
 *   · sin días — tiene clases, sin día fijo.
 */
export function fraseDeClases(
  clasesEnVivo: boolean | null,
  dias: number[],
  modalidad?: string | null,
  sesionesPorSemana?: number | null,
): string | null {
  if (clasesEnVivo !== true) return null;
  if (modalidad === UNO_A_UNO) {
    if (sesionesPorSemana && sesionesPorSemana > 0) {
      return sesionesPorSemana === 1
        ? "1 sesión 1 a 1 por semana"
        : `${sesionesPorSemana} sesiones 1 a 1 por semana`;
    }
    return "Clases 1 a 1, en el horario que acuerdes";
  }
  const lista = listaDeDias(dias);
  if (lista) return `Clases en vivo ${lista}`;
  /*
    ⚠️ **Un plan de GRUPO sin días declarados se CALLA**, no dice "en el horario
    que acuerdes". Eso solo es cierto en un 1 a 1: en un grupal con cohorte el
    alumno no acuerda nada, y encima ese mismo plan le lleva a un checkout donde
    elige de una lista cerrada. Misma degradación que cuando la plataforma no lo
    dice: callar antes que prometer de más.
  */
  return null;
}
