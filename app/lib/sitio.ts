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
export const CORREO_DE_CONTACTO = "info@lz-englishacademy.com";

/** Remitente de la campaña a leads (lo envía el backend con este mismo valor). */
export const CORREO_DE_CAMPANA = "loren.lainez@lz-englishacademy.com";
