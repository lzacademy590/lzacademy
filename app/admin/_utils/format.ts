// Formateadores compartidos del panel admin. Centralizan zona horaria, formato de
// fecha y moneda para que TODAS las páginas se vean igual. Antes cada página
// redeclaraba `PT`, los nombres de meses y su propio `fmtDate` (MM/DD vs DD/MM vs
// YYYY-MM-DD), generando inconsistencias. Importar siempre desde aquí.

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

/** Zona horaria operativa del admin (California / Pacífico). */
export const PT = "America/Los_Angeles";

/** Nombres de mes abreviados en español. */
export const MONTH_NAMES = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
];

/**
 * Formato ESTÁNDAR de fecha del admin: "16 Jun 2026" (en PT).
 * Usa nombre de mes para evitar la ambigüedad MM/DD vs DD/MM.
 */
export const fmtDatePT = (ts: string | null | undefined): string =>
  ts ? `${dayjs.utc(ts).tz(PT).date()} ${MONTH_NAMES[dayjs.utc(ts).tz(PT).month()]} ${dayjs.utc(ts).tz(PT).year()}` : "—";

/**
 * Lo mismo para una fecha SIN hora ("2026-11-02": `inscription_date`, la fecha de
 * una cohorte). ⚠️ No pasa por PT: convertir "2026-11-02" desde UTC la movería al
 * día 1. También acepta un timestamp: se queda con su parte de fecha.
 */
export const fmtDia = (d: string | null | undefined): string => {
  const m = d ? /^(\d{4})-(\d{2})-(\d{2})/.exec(d) : null;
  return m ? `${parseInt(m[3], 10)} ${MONTH_NAMES[parseInt(m[2], 10) - 1]} ${m[1]}` : "—";
};

/** Formato ESTÁNDAR de fecha+hora del admin: "16 Jun 2026, 3:05 p. m." (en PT). */
export const fmtDateTimePT = (ts: string | null | undefined): string =>
  ts ? `${fmtDatePT(ts)}, ${dayjs.utc(ts).tz(PT).format("h:mm a")}` : "—";

/** Etiqueta "Mes Año" a partir de "YYYY-MM" (para tendencias mensuales). */
export const fmtMonthYear = (ym: string): string => {
  const [year, month] = ym.split("-");
  return `${MONTH_NAMES[parseInt(month, 10) - 1]} ${year}`;
};

/**
 * Formatea centavos a USD. Por defecto 2 decimales (montos de transacciones);
 * pasa `decimals: 0` para totales grandes (revenue).
 */
export const fmtMoney = (cents: number, decimals: number = 2): string =>
  `$${(cents / 100).toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
