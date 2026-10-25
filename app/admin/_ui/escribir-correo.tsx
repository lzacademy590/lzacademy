"use client";

// Redactar y mandar un correo a alumnos desde el panel (2026-10-17).
//
// «Pendientes de hoy» decía «escríbeles» y el botón solo llevaba a otra pantalla:
// no había con qué escribirles. Esto lo abre cualquier pantalla con una plantilla
// según el motivo, y el admin la retoca antes de enviar.
//
// ⚠️ Al GRUPO se le manda por su nombre (`pagosFallidos`…) y el servidor saca la
// lista entera: la tarjeta del Inicio solo trae una muestra de cinco.

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { authHeaders } from "../_utils/auth";
import { Boton } from "./boton";
import { useToast } from "./toast";
import { CORREO_DE_CONTACTO } from "@/app/lib/sitio";

export type GrupoDeAlumnos = "pagosFallidos" | "cancelanPronto" | "accesosPendientes" | "sinHorario";

export type DestinoDelCorreo =
  | { tipo: "grupo"; grupo: GrupoDeAlumnos; etiqueta: string; total: number }
  | { tipo: "alumnos"; alumnos: { email: string; nombre?: string | null }[] };

export type Plantilla = { asunto: string; cuerpo: string; conBoton: boolean };

export const PLANTILLAS: Record<GrupoDeAlumnos | "recuperar" | "general", Plantilla> = {
  recuperar: {
    asunto: "{nombre}, te extrañamos en las clases",
    cuerpo:
      "Hola {nombre},\n\nVimos que tu suscripción ya no está activa. Si quieres retomar tus clases donde las dejaste, puedes reactivarla desde el botón de abajo.\n\nY si algo no te funcionó, responde a este correo: nos ayuda mucho saberlo.",
    conBoton: true,
  },
  pagosFallidos: {
    asunto: "{nombre}, no pudimos cobrar tu renovación",
    cuerpo:
      "Hola {nombre},\n\nIntentamos cobrar la renovación de tu plan y tu banco no la aprobó. Para no perder tu lugar en las clases, actualiza tu tarjeta desde el botón de abajo.\n\nSi necesitas ayuda, responde a este correo y lo vemos contigo.",
    conBoton: true,
  },
  cancelanPronto: {
    asunto: "{nombre}, tu acceso termina pronto",
    cuerpo:
      "Hola {nombre},\n\nVimos que cancelaste tu suscripción y tu acceso termina en los próximos días. Nos encantaría saber si hay algo que podamos mejorar.\n\nSi quieres seguir con nosotros, puedes reactivarla desde el botón de abajo. Y si prefieres contarnos qué pasó, responde a este correo.",
    conBoton: true,
  },
  accesosPendientes: {
    asunto: "{nombre}, ya casi tienes tus accesos",
    cuerpo:
      "Hola {nombre},\n\nEstamos preparando tus accesos a las clases. En breve te llegarán en otro correo.\n\nSi tienes alguna duda mientras tanto, responde a este correo.",
    conBoton: false,
  },
  sinHorario: {
    asunto: "{nombre}, elige el horario de tus clases",
    cuerpo:
      "Hola {nombre},\n\nTodavía no tienes un horario de grupo asignado para tus clases en vivo. Responde a este correo con el horario que mejor te queda y te lo asignamos.",
    conBoton: false,
  },
  general: {
    asunto: "Hola {nombre}",
    cuerpo: "Hola {nombre},\n\n",
    conBoton: false,
  },
};

type Envio = {
  id: string;
  estado: "preparando" | "enviando" | "terminada" | "error";
  total: number | null;
  procesados: number;
  enviados: number;
  fallidos: { email: string; error: string }[];
  omitidos: { email: string; motivo: string }[];
  error: string | null;
};
const ACTIVO = (e: Envio | null) => !!e && (e.estado === "preparando" || e.estado === "enviando");
const BASE = () => `${process.env.NEXT_PUBLIC_BACKEND_URL}/admin/alumnos/correo`;

const CAMPO =
  "w-full text-sm rounded-xl border border-gray-200 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-falu-red-200 focus:border-falu-red-300";

export function EscribirCorreo({
  destino,
  plantilla,
  onCerrar,
}: {
  destino: DestinoDelCorreo;
  plantilla: Plantilla;
  onCerrar: () => void;
}) {
  const toast = useToast();
  const [asunto, setAsunto] = useState(plantilla.asunto);
  const [cuerpo, setCuerpo] = useState(plantilla.cuerpo);
  const [conBoton, setConBoton] = useState(plantilla.conBoton);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // El envío corre en el SERVIDOR (segundo plano): esto es su última foto.
  const [envio, setEnvio] = useState<Envio | null>(null);
  const activo = ACTIVO(envio);

  const cuantos = destino.tipo === "grupo" ? destino.total : destino.alumnos.length;
  const aQuien =
    destino.tipo === "grupo"
      ? `${destino.etiqueta} · ${cuantos} alumno${cuantos === 1 ? "" : "s"}`
      : destino.alumnos.length === 1
        ? destino.alumnos[0].nombre || destino.alumnos[0].email
        : `${cuantos} alumnos`;

  useEffect(() => {
    // Esc cierra siempre: el envío sigue en el servidor aunque se cierre esto.
    const tecla = (e: KeyboardEvent) => { if (e.key === "Escape") onCerrar(); };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [onCerrar]);

  // Progreso: se consulta mientras el servidor está preparando o enviando.
  const idActivo = activo ? envio?.id : null;
  useEffect(() => {
    if (!idActivo) return;
    let vivo = true;
    const t = setInterval(async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const res = await fetch(`${BASE()}/estado`, { headers: authHeaders(session.access_token) });
        const datos = await res.json().catch(() => null);
        if (!vivo || !datos?.envio || datos.envio.id !== idActivo) return;
        setEnvio(datos.envio);
        if (datos.envio.estado === "terminada" && datos.envio.enviados > 0 && datos.envio.fallidos.length === 0) {
          toast.exito(`Correo enviado a ${datos.envio.enviados} alumno${datos.envio.enviados === 1 ? "" : "s"}`);
        }
      } catch { /* un parpadeo de red: la siguiente consulta lo recupera */ }
    }, 2000);
    return () => { vivo = false; clearInterval(t); };
  }, [idActivo, toast]);

  const enviar = async () => {
    setError(null);
    if (!asunto.trim() || !cuerpo.trim()) { setError("Escribe el asunto y el mensaje."); return; }
    setEnviando(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setError("Tu sesión expiró. Vuelve a entrar."); return; }
      const res = await fetch(BASE(), {
        method: "POST",
        headers: authHeaders(session.access_token, true),
        body: JSON.stringify({
          ...(destino.tipo === "grupo" ? { grupo: destino.grupo } : { emails: destino.alumnos.map((a) => a.email) }),
          asunto,
          cuerpo,
          conBotonDeSuscripcion: conBoton,
        }),
      });
      const datos = await res.json().catch(() => null);
      if (res.status === 409 && datos?.code === "ENVIO_EN_CURSO" && datos.envio) {
        // Ya había otro envío a alumnos: se enseña SU progreso, y se dice que el
        // tuyo no salió para que no se dé por enviado.
        setEnvio(datos.envio as Envio);
        setError("Ya había un envío en curso; arriba ves su progreso. El tuyo no se envió: inténtalo cuando termine.");
        return;
      }
      if (!res.ok) {
        setError(datos?.error || (res.status === 429 ? "Demasiadas peticiones; espera un minuto." : `Error del servidor (${res.status})`));
        return;
      }
      setEnvio(datos.envio as Envio);
    } catch {
      setError("No se pudo conectar con el servidor. No se envió nada.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/40 flex items-end sm:items-center justify-center sm:p-4" onClick={() => !enviando && onCerrar()}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="escribir-correo-titulo"
        className="bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 pt-5 pb-3 border-b border-gray-100">
          <h2 id="escribir-correo-titulo" className="text-base font-semibold text-gray-800">Escribir correo</h2>
          <p className="text-xs text-gray-500 mt-0.5 break-words">Para: {aQuien}</p>
        </div>

        {envio ? (
          <div className="p-5 text-sm text-gray-700 space-y-3">
            {envio.estado === "error" ? (
              <p className="font-semibold text-red-700" role="alert">{envio.error || "El envío se interrumpió."}</p>
            ) : activo ? (
              <>
                <p className="font-semibold">
                  {envio.estado === "preparando" || !envio.total
                    ? "Preparando la lista de alumnos…"
                    : `Enviando ${envio.procesados} de ${envio.total}…`}
                </p>
                <div className="h-2 rounded-full bg-gray-100 overflow-hidden" role="progressbar" aria-valuemin={0} aria-valuemax={envio.total ?? 0} aria-valuenow={envio.procesados}>
                  <div
                    className="h-full bg-falu-red-600 transition-all duration-500"
                    style={{ width: `${envio.total ? Math.round((envio.procesados / envio.total) * 100) : 4}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500">Puedes cerrar esta ventana: el envío sigue en el servidor.</p>
              </>
            ) : (
              <p className="font-semibold">
                {envio.enviados === envio.total
                  ? `Enviado a ${envio.enviados} alumno${envio.enviados === 1 ? "" : "s"}.`
                  : `Enviados ${envio.enviados} de ${envio.total}.`}
              </p>
            )}
            {envio.fallidos.length > 0 && (
              <p className="text-red-700 break-words">No se pudo enviar a: {envio.fallidos.map((f) => f.email).join(", ")}</p>
            )}
            {envio.omitidos.length > 0 && (
              <p className="text-amber-700 break-words">Sin enviar: {envio.omitidos.map((o) => `${o.email} (${o.motivo})`).join(", ")}</p>
            )}
            {error && <p className="text-amber-700">{error}</p>}
            <p className="text-xs text-gray-400">Las respuestas llegan a {CORREO_DE_CONTACTO}.</p>
            <div className="flex justify-end pt-1"><Boton variante={activo ? "secundario" : "primario"} onClick={onCerrar}>{activo ? "Cerrar" : "Listo"}</Boton></div>
          </div>
        ) : (
          <div className="p-5 space-y-4">
            <div>
              <label htmlFor="correo-asunto" className="text-xs font-medium text-gray-500">Asunto</label>
              <input id="correo-asunto" className={`${CAMPO} mt-1`} value={asunto} maxLength={200} onChange={(e) => setAsunto(e.target.value)} />
            </div>
            <div>
              <label htmlFor="correo-cuerpo" className="text-xs font-medium text-gray-500">Mensaje</label>
              <textarea id="correo-cuerpo" className={`${CAMPO} mt-1 min-h-[180px] leading-relaxed`} value={cuerpo} maxLength={5000} onChange={(e) => setCuerpo(e.target.value)} />
              <p className="text-[11px] text-gray-400 mt-1">
                <code className="text-gray-500">{"{nombre}"}</code> se cambia por el nombre de cada alumno. <code className="text-gray-500">*así*</code> sale en negrita.
              </p>
            </div>
            <label className="flex items-start gap-2 text-sm text-gray-700 cursor-pointer">
              <input type="checkbox" className="mt-0.5 accent-falu-red-600" checked={conBoton} onChange={(e) => setConBoton(e.target.checked)} />
              <span>
                Incluir botón «Gestionar mi suscripción»
                <span className="block text-xs text-gray-400">Para actualizar la tarjeta, reactivar o cambiar de plan.</span>
              </span>
            </label>
            {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-1">
              <Boton variante="secundario" onClick={onCerrar} disabled={enviando}>Cancelar</Boton>
              <Boton onClick={enviar} cargando={enviando}>
                {enviando ? "Enviando…" : `Enviar${cuantos > 1 ? ` a ${cuantos}` : ""}`}
              </Boton>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
