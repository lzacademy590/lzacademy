// Etiquetas compartidas del panel: niveles y estados. Antes cada pantalla tenía su
// propio mapa (tres formatos de nivel distintos, estados en inglés en Pagos y en
// español en Búsqueda). Importar siempre desde aquí.

/** Niveles en el orden en que se estudian. `value` es lo que guarda la base. */
export const NIVELES = [
  { value: "Principiante", label: "Principiante · A1", corto: "A1" },
  { value: "Basico", label: "Básico · A2", corto: "A2" },
  { value: "Intermedio", label: "Intermedio · B1", corto: "B1" },
  { value: "Intermedio alto", label: "Intermedio alto · B2", corto: "B2" },
  { value: "Intermedio alto-gramatica", label: "Intermedio alto · B2.1", corto: "B2.1" },
  { value: "Intermedio alto-produccion", label: "Intermedio alto · B2.2", corto: "B2.2" },
] as const;

const NIVEL_POR_VALOR: Record<string, (typeof NIVELES)[number]> = Object.fromEntries(
  NIVELES.map((n) => [n.value, n]),
);

/** "Básico · A2". Un nivel desconocido sale tal cual; vacío, "—". */
export const nivelLabel = (nivel: string | null | undefined): string =>
  !nivel ? "—" : NIVEL_POR_VALOR[nivel]?.label ?? nivel;

export type Tono = "verde" | "azul" | "ambar" | "naranja" | "rojo" | "gris" | "violeta";

export const TONO_CLASES: Record<Tono, { chip: string; punto: string }> = {
  verde: { chip: "bg-emerald-50 text-emerald-700", punto: "bg-emerald-400" },
  azul: { chip: "bg-blue-50 text-blue-700", punto: "bg-blue-400" },
  ambar: { chip: "bg-amber-50 text-amber-700", punto: "bg-amber-400" },
  naranja: { chip: "bg-orange-50 text-orange-700", punto: "bg-orange-400" },
  rojo: { chip: "bg-red-50 text-red-600", punto: "bg-red-400" },
  gris: { chip: "bg-gray-100 text-gray-500", punto: "bg-gray-300" },
  violeta: { chip: "bg-violet-50 text-violet-700", punto: "bg-violet-400" },
};

/** Estado del ALUMNO en `users.status`. */
export const ESTADOS_DE_ALUMNO: Record<string, { label: string; tono: Tono }> = {
  active: { label: "Activo", tono: "verde" },
  inactive: { label: "Inactivo", tono: "gris" },
  cancelled: { label: "Cancelado", tono: "rojo" },
};

/** Estado de la SUSCRIPCIÓN de Stripe en `users.subscription_status`. */
export const ESTADOS_DE_SUSCRIPCION: Record<string, { label: string; tono: Tono }> = {
  active: { label: "Activa", tono: "verde" },
  trialing: { label: "En prueba", tono: "azul" },
  past_due: { label: "Pago fallido", tono: "ambar" },
  canceled: { label: "Cancelada", tono: "rojo" },
  cancelled: { label: "Cancelada", tono: "rojo" },
  unpaid: { label: "Sin pagar", tono: "rojo" },
  incomplete: { label: "Incompleta", tono: "gris" },
  incomplete_expired: { label: "Expirada", tono: "gris" },
};

/**
 * El estado del alumno según la PLATAFORMA, que es quien da o quita el acceso
 * (decisión de negocio 2026-11-23: los dos paneles enseñan lo mismo). El backend
 * lo superpone a la ficha (`estado_real`), y la ficha original va en
 * `ficha_del_sitio`. Ver lzacademy-backend/src/services/estado-en-la-plataforma.service.js.
 */
export interface EstadoReal {
  plan: string | null; planNombre: string | null;
  estado: "activo" | "acceso_manual" | "pago_pendiente" | "en_prueba" | "cancela_al_final" | "caido" | "gratis";
  tieneAcceso: boolean; accesoHasta: string | null;
  ultimoCobro: { fecha: string; monto: number } | null;
}
export const ESTADO_REAL: Record<EstadoReal["estado"], { label: string; tono: Tono }> = {
  activo: { label: "Activo", tono: "verde" },
  acceso_manual: { label: "Acceso manual", tono: "azul" },
  pago_pendiente: { label: "Pago pendiente", tono: "ambar" },
  en_prueba: { label: "En prueba", tono: "azul" },
  cancela_al_final: { label: "Cancela al final del periodo", tono: "ambar" },
  caido: { label: "Plan caído", tono: "rojo" },
  gratis: { label: "Plan gratis", tono: "gris" },
};
/** Con respaldo: un estado nuevo de la plataforma no puede tumbar la pantalla. */
export const etiquetaDeEstadoReal = (estado: string) =>
  ESTADO_REAL[estado as EstadoReal["estado"]] ?? { label: estado, tono: "gris" as Tono };
