/**
 * El dominio del sitio y los correos del negocio, escritos UNA vez.
 *
 * Antes estaban a mano en unas 30 páginas (canonical, Open Graph, sitemap,
 * robots y los `mailto:`). Al mudar el website de dominio se cambia aquí, y
 * `next.config.ts` lee lo mismo para las redirecciones.
 *
 * ⚠️ Las páginas legales (términos, privacidad, reembolsos y `legal/`) NO leen
 * estos correos en su texto: cambiar el texto legal obliga a subir la versión
 * de los términos, y eso se hace aparte, al final de la mudanza.
 */
export const URL_DEL_SITIO = "https://lz-englishacademy.com";

/** Buzón de dudas y soporte. */
export const CORREO_DE_CONTACTO = "soporte@lainz590.com";

/**
 * El video de presentación del inicio (rediseño «sitio simple», 2026-11-18).
 *
 * ⚠️ **Mientras `src` esté vacío el hero enseña la ilustración de siempre**, no
 * un botón de reproducir que no lleva a nada. Para publicarlo basta con rellenar
 * esto y desplegar:
 *   - `src`: un .mp4 (se sirve con <video>) o un enlace de YouTube/Vimeo (se
 *     incrusta). Solo se carga al pulsar Play, para no frenar la página en móvil.
 *   - `duracion`: "2 min", tal cual se leerá bajo el título.
 *   - `transcripcion`: el texto del video, para quien no puede oírlo. Opcional.
 */
export const VIDEO_INTRO = {
  src: "",
  poster: "/creadora.jpeg",
  titulo: "Loren te explica el Método 590",
  duracion: "",
  transcripcion: "",
};

/** Remitente de la campaña a leads (lo envía el backend con este mismo valor). */
export const CORREO_DE_CAMPANA = "loren@lainz590.com";
