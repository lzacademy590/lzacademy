// Lectura segura de una respuesta del backend.
//
// ⚠️⚠️ EL CUERPO PUEDE NO SER JSON, y los tres formularios de pago daban por
// hecho que sí. El 429 del limitador de peticiones llega como TEXTO PLANO
// ("Too many requests, please try again later.", content-type text/html), así
// que un `await res.json()` escrito ANTES de mirar `res.ok` lanza SyntaxError y
// el flujo cae al catch genérico: el comprador leía "No pudimos iniciar tu
// pago. Intenta nuevamente." —que suena a que su tarjeta falló— cuando lo único
// que pasaba es que había que esperar un minuto. Medido:
//
//   status: 429 | content-type: text/html; charset=utf-8
//   res.json() -> LANZA: SyntaxError
//
// Lo mismo vale para un 502/504 del proxy, que tampoco viene en JSON.
//
// ⚠️ Esto NO decide el mensaje de error: devuelve el cuerpo si se puede leer y
// marca el caso de saturación. Cada pantalla conserva su propia copy.

export const MENSAJE_SATURADO =
  "Estamos recibiendo muchas solicitudes en este momento. Espera un minuto y vuelve a intentarlo.";

/**
 * Lo que este backend devuelve en sus respuestas de checkout. Es a propósito
 * laxo (`unknown` en el resto de claves): el cuerpo viene de la red y nada
 * garantiza su forma. Las tres declaradas son las únicas que leen las
 * pantallas, y cada una se comprueba antes de usarse.
 */
export interface CuerpoDelBackend {
  url?: string;
  error?: string;
  code?: string;
  [clave: string]: unknown;
}

export interface RespuestaLeida {
  /** El cuerpo ya parseado, o `null` si no era JSON. Nunca lanza. */
  data: CuerpoDelBackend | null;
  /** El backend contestó 429: no es un fallo del pago, es esperar y reintentar. */
  saturado: boolean;
}

export async function leerRespuesta(res: Response): Promise<RespuestaLeida> {
  let data: CuerpoDelBackend | null = null;
  try {
    data = (await res.json()) as CuerpoDelBackend;
  } catch {
    // Cuerpo que no es JSON (429 del limitador, error del proxy, respuesta
    // vacía). No es motivo para perder el status, que es lo que de verdad
    // dice qué pasó.
  }
  return { data, saturado: res.status === 429 };
}
