/**
 * Qué plan recomendarle a alguien según lo que contestó en `/paso-uno` (nivel)
 * y `/paso-dos` (qué se le dificulta). (2026-10-17)
 *
 * Hasta hoy esas dos respuestas solo viajaban en la URL: la persona contestaba y
 * `/paso-tres` le enseñaba lo mismo que a todo el mundo. Esto cierra ese hueco.
 *
 * ⚠️ **Es una regla de NEGOCIO escrita aquí**, no un dato del catálogo: si algún
 * día se quiere editar desde el admin, ésta es la función a sustituir.
 *
 * ⚠️ **Solo recomienda planes que la página ENSEÑA**: quien llama pasa las
 * claves visibles. Recomendar Fluidez agotado sería mandar a alguien a una carta
 * que no existe. Si el elegido no está, se cae al siguiente; si ninguno, `null`
 * y la página se queda como siempre.
 */

/** Las mismas claves que `/paso-dos`. */
export const NOMBRE_DE_DIFICULTAD: Record<string, string> = {
  hablarlo: "hablarlo",
  gramatica: "la gramática",
  escuchar: "entenderlo al escucharlo",
  confianza: "la confianza al hablar",
};

export interface Recomendacion {
  clave: string;
  /** La frase que explica el porqué, con las palabras de la persona. */
  motivo: string;
}

function enumerar(cosas: string[]): string {
  if (cosas.length <= 1) return cosas[0] ?? "";
  return `${cosas.slice(0, -1).join(", ")} y ${cosas[cosas.length - 1]}`;
}

export function recomendarPlan(
  nivel: string,
  dificultadesCsv: string,
  visibles: string[],
): Recomendacion | null {
  const difs = dificultadesCsv
    .split(",")
    .map((d) => d.trim())
    .filter((d) => d in NOMBRE_DE_DIFICULTAD);
  if (!difs.length) return null;

  const loQueDijo = enumerar(difs.map((d) => NOMBRE_DE_DIFICULTAD[d]));
  const habla = difs.includes("hablarlo") || difs.includes("confianza");
  const conBase = nivel === "B1" || nivel === "B2";

  const candidatos: Recomendacion[] = [];

  // Ya tiene base y lo que le frena es HABLAR: es exactamente para lo que existe Fluidez.
  if (habla && conBase) {
    candidatos.push({
      clave: "Fluidez",
      motivo: `Ya tienes una base, y lo que más te cuesta es ${loQueDijo}. Fluidez se enfoca en romper la barrera de hablar, con coaching 1 a 1 cada semana.`,
    });
  }
  // Hablar o escuchar se entrena con gente: clases en vivo.
  if (habla || difs.includes("escuchar")) {
    candidatos.push({
      clave: "Premium",
      motivo: `Te cuesta ${loQueDijo}, y eso se entrena practicando con otras personas. Premium suma clases en vivo cada semana al método diario.`,
    });
  }
  // Solo la gramática: el método a su ritmo, con teoría clara, basta para empezar.
  candidatos.push({
    clave: "Essential",
    motivo: `Lo que más te cuesta es ${loQueDijo}. Essential te da el método paso a paso, con teoría clara y práctica diaria a tu ritmo.`,
  });

  return candidatos.find((c) => visibles.includes(c.clave)) ?? null;
}
