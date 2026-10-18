"use client";

/*
  Horarios de GRUPO por cohorte y nivel (2026-10-16).

  El admin publica, para cada fecha de inicio, plan y nivel, las horas en que
  puede dar la clase en vivo. Cada horario abre con un MÍNIMO de alumnos (5 por
  defecto) y puede tener un MÁXIMO. El alumno elige uno en el formulario antes
  de pagar y ve "Faltan N para abrir".

  ⚠️ Si un horario no llega al mínimo, la promesa que lee el comprador es que se
  le pasa al horario más cercano de su nivel o se le devuelve el pago. Lo
  primero se hace aquí, con "Mover a"; lo segundo, desde Stripe.

  Los cambios de horarios se guardan juntos con "Guardar cambios" (el backend
  reemplaza el array entero). Mover a un alumno se guarda al instante.

  ⚠️ "Mover a" solo ofrece horarios de la MISMA fecha, plan y nivel: cambiar de
  fecha también cambiaría su cohorte, y eso no lo toca este botón.

  CIERRE (2026-10-16): 3 días antes del inicio. Un horario que no reúne el mínimo
  ese día queda en "No abrió"; el botón "Avisar a los alumnos" les manda su
  enlace a /mi-horario para elegir otro horario o el siguiente inicio, sin pagar
  de nuevo. Quien no elige, el día antes del inicio pasa solo al más cercano.
*/

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabaseClient";
import { todayPT } from "../_utils/ptTime";
import { fmtDia, fmtDatePT, fmtDateTimePT } from "../_utils/format";
import {
    Tarjeta, Boton, Chip, Aviso, Vacio, Spinner, NIVELES, nivelLabel, TONO_CLASES,
    useToast, useConfirmar,
} from "../_ui";

// `origen: "plataforma"`: compró en la plataforma (2026-10-17). No tiene id aquí:
// se mueve por correo, con su propia ruta.
interface Alumno { id: number | null; full_name: string | null; email: string; origen?: "website" | "plataforma"; }
interface CambioDeInicio {
    email: string;
    nombre: string | null;
    plan: string;
    inicioDe: string;
    inicioA: string;
    horaA: string;
    origen: "alumno" | "automatico";
    en: string;
}
// Compró sin horario: su fecha y nivel no tenían ninguno publicado (2026-10-17).
interface AlumnoSinElegir extends Alumno {
    plan: string | null;
    familia?: string | null;
    level: string | null;
    inscription_date: string | null;
}
interface AlumnoSinHorario extends Alumno {
    plan: string | null;
    familia?: string | null;
    level: string | null;
    inscription_date: string | null;
    horario_id: string;
}

interface Horario {
    id: string;
    plan: string;
    start_date: string;
    level: string;
    hora_pt: string;
    minimo: number;
    maximo: number | null;
    enabled: boolean;
    inscritos?: number;
    cierre?: string;
    noAbrio?: boolean;
    confirmado?: boolean;
    avisadoEn?: string | null;
    alumnos?: Alumno[];
}

// Los grupos se publican para los cuatro niveles base: B2.1 y B2.2 estudian en
// los grupos de "Intermedio alto" (2026-10-17), así que no se ofrecen aquí.
const NIVELES_DE_GRUPO = NIVELES.filter(n => !n.value.includes("-"));
const grupoDeNivel = (v: string | null) => String(v ?? "").trim().toLowerCase().split("-")[0].trim();

function horaLegible(hhmm: string) {
    const [h, m] = hhmm.split(":").map(Number);
    return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"} PT`;
}

const MINIMO_POR_DEFECTO = 5;

/** Nombre del alumno + correo + "Ver ficha" (abre Búsqueda con su correo). */
function AlumnoEnLista({ a }: { a: Alumno }) {
    return (
        <>
            <span className="font-medium text-gray-800">{a.full_name || "Sin nombre"}</span>
            <span className="text-gray-500">{a.email}</span>
            {a.origen === "plataforma" && <Chip tono="azul">plataforma</Chip>}
            <Link
                href={`/admin/busqueda?q=${encodeURIComponent(a.email)}`}
                className="font-semibold text-falu-red-600 hover:underline"
            >
                Ver ficha
            </Link>
        </>
    );
}

export function HorariosDeGrupo({
    fechas,
    planes,
}: {
    fechas: { value: string; label: string }[];
    planes: { key: string; nombre: string }[];
}) {
    const base = process.env.NEXT_PUBLIC_BACKEND_URL;
    const toast = useToast();
    const confirmar = useConfirmar();
    const [horarios, setHorarios] = useState<Horario[]>([]);
    // Alumnos activos cuyo horario ya no existe (se borró con gente dentro, o
    // pagaron sobre una sesión abierta antes de borrarlo).
    const [sinHorario, setSinHorario] = useState<AlumnoSinHorario[]>([]);
    const [sinElegir, setSinElegir] = useState<AlumnoSinElegir[]>([]);
    // Alumnos que pasaron a OTRO inicio (desde su enlace o la reasignación). La
    // plataforma todavía no recibe ese cambio: hay que actualizarle la cohorte allí.
    const [cambiosDeInicio, setCambiosDeInicio] = useState<CambioDeInicio[]>([]);
    const [avisando, setAvisando] = useState<string | null>(null);
    const [cargando, setCargando] = useState(true);
    // Solo el fallo de LECTURA se queda a la vista: sin él la lista vacía se
    // leería como "no hay horarios". Los de escritura van por aviso flotante.
    const [errorDeCarga, setErrorDeCarga] = useState("");
    const [guardando, setGuardando] = useState(false);
    const [sucio, setSucio] = useState(false);
    const [abierto, setAbierto] = useState<string | null>(null);

    const [nuevo, setNuevo] = useState({ start_date: "", plan: "", level: "", hora_pt: "", minimo: String(MINIMO_POR_DEFECTO), maximo: "" });

    const token = async () => (await supabase.auth.getSession()).data.session?.access_token ?? "";

    const cargar = useCallback(async () => {
        setErrorDeCarga("");
        try {
            const res = await fetch(`${base}/config/horarios-de-clase/all`, { headers: { Authorization: `Bearer ${await token()}` } });
            if (!res.ok) throw new Error(`Error cargando horarios (${res.status})`);
            const data = await res.json();
            setHorarios(Array.isArray(data?.horarios) ? data.horarios : []);
            setSinHorario(Array.isArray(data?.sinHorarioVigente) ? data.sinHorarioVigente : []);
            setSinElegir(Array.isArray(data?.sinHorarioElegido) ? data.sinHorarioElegido : []);
            setCambiosDeInicio(Array.isArray(data?.cambiosDeInicio) ? data.cambiosDeInicio : []);
            setSucio(false);
        } catch (e) {
            setErrorDeCarga(e instanceof Error ? e.message : "Error de red");
        } finally {
            setCargando(false);
        }
    }, [base]);

    useEffect(() => { cargar(); }, [cargar]);

    // Son muchos campos: salir con cambios sin guardar los perdería en silencio.
    useEffect(() => {
        if (!sucio) return;
        const h = (e: BeforeUnloadEvent) => { e.preventDefault(); };
        window.addEventListener("beforeunload", h);
        return () => window.removeEventListener("beforeunload", h);
    }, [sucio]);

    const editar = (id: string, cambios: Partial<Horario>) => {
        setHorarios(prev => prev.map(h => (h.id === id ? { ...h, ...cambios } : h)));
        setSucio(true);
    };

    const agregar = () => {
        const minimo = parseInt(nuevo.minimo, 10);
        const maximo = nuevo.maximo ? parseInt(nuevo.maximo, 10) : null;
        if (!nuevo.start_date || !nuevo.plan || !nuevo.level || !nuevo.hora_pt) {
            toast.error("Completa fecha, plan, nivel y hora."); return;
        }
        if (!Number.isInteger(minimo) || minimo < 1) { toast.error("El mínimo tiene que ser 1 o más."); return; }
        if (maximo !== null && (!Number.isInteger(maximo) || maximo < minimo)) {
            toast.error("El máximo no puede ser menor que el mínimo."); return;
        }
        const repetido = horarios.some(h =>
            h.start_date === nuevo.start_date && h.plan === nuevo.plan && h.level === nuevo.level && h.hora_pt === nuevo.hora_pt);
        if (repetido) { toast.error("Ese horario ya existe para esa fecha, plan y nivel."); return; }
        setHorarios(prev => [...prev, {
            id: crypto.randomUUID(),
            start_date: nuevo.start_date, plan: nuevo.plan, level: nuevo.level, hora_pt: nuevo.hora_pt,
            minimo, maximo, enabled: true, inscritos: 0, alumnos: [],
        }]);
        setNuevo(n => ({ ...n, hora_pt: "" }));
        setSucio(true);
        toast.info("Añadido a la lista. Pulsa «Guardar cambios» para publicarlo.");
    };

    const borrar = async (h: Horario) => {
        const n = h.inscritos ?? 0;
        const ok = await confirmar(n > 0
            ? {
                titulo: `¿Borrar el horario de las ${horaLegible(h.hora_pt)}?`,
                mensaje: `Este horario tiene ${n} ${n === 1 ? "alumno inscrito" : "alumnos inscritos"}. Si lo borras se quedan SIN horario. ` +
                    `Muévelos antes a otro, o usa "Inactivo" para dejar de ofrecerlo sin perderlos.`,
                confirmar: "Borrarlo igual",
                peligro: true,
            }
            : {
                titulo: `¿Borrar el horario de las ${horaLegible(h.hora_pt)}?`,
                mensaje: "Se quita de la lista; no se publica hasta que pulses «Guardar cambios».",
                confirmar: "Borrar",
                peligro: true,
            });
        if (!ok) return;
        setHorarios(prev => prev.filter(x => x.id !== h.id));
        setSucio(true);
    };

    const guardar = async () => {
        setGuardando(true);
        try {
            // Solo lo que se guarda: los inscritos son una cuenta del servidor.
            const limpios = horarios.map(h => ({
                id: h.id, plan: h.plan, start_date: h.start_date, level: h.level,
                hora_pt: h.hora_pt, minimo: h.minimo, maximo: h.maximo, enabled: h.enabled,
            }));
            const res = await fetch(`${base}/config/horarios-de-clase`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${await token()}` },
                body: JSON.stringify({ horarios: limpios }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data?.error || `Error guardando (${res.status})`);
            await cargar();
            toast.exito("Horarios guardados. Ya se ven en el formulario.");
        } catch (e) {
            // Los cambios se quedan en pantalla (sin guardar) para poder corregir y reintentar.
            toast.error(`Los horarios NO se guardaron: ${e instanceof Error ? e.message : "error de red"}`);
        } finally {
            setGuardando(false);
        }
    };

    const mover = async (alumno: Alumno, destino: string | null) => {
        if (sucio) { toast.error("Guarda primero los cambios de horarios antes de mover alumnos."); return; }
        const quien = alumno.full_name || alumno.email;
        const horaDestino = destino ? horarios.find(x => x.id === destino)?.hora_pt : null;
        const ok = await confirmar(destino
            ? {
                titulo: `¿Mover a ${quien} al horario de las ${horaDestino ? horaLegible(horaDestino) : "otro horario"}?`,
                mensaje: alumno.origen === "plataforma"
                    ? "Compró en la plataforma: se le avisa allí del cambio."
                    : undefined,
                confirmar: "Mover",
            }
            : {
                titulo: `¿Quitarle el horario a ${quien}?`,
                mensaje: "Se queda sin horario de grupo hasta que se le asigne otro.",
                confirmar: "Quitar horario",
                peligro: true,
            });
        if (!ok) return;
        try {
            const dePlataforma = alumno.origen === "plataforma";
            const res = await fetch(dePlataforma
                ? `${base}/config/horarios-de-clase/alumno-plataforma`
                : `${base}/config/horarios-de-clase/alumno/${alumno.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${await token()}` },
                body: JSON.stringify(dePlataforma ? { email: alumno.email, horario_id: destino } : { horario_id: destino }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data?.error || `Error (${res.status})`);
            await cargar();
            toast.exito(`${quien} ${destino ? "cambió de horario" : "quedó sin horario"}.`);
        } catch (e) {
            toast.error(`No se pudo mover al alumno: ${e instanceof Error ? e.message : "error de red"}`);
        }
    };

    const avisar = async (h: Horario) => {
        const n = h.inscritos ?? 0;
        const ok = await confirmar({
            titulo: `¿Avisar a ${n} ${n === 1 ? "alumno" : "alumnos"} del horario de las ${horaLegible(h.hora_pt)}?`,
            mensaje: "Se le manda a cada uno un correo con su enlace para elegir otro horario o el siguiente inicio.",
            confirmar: "Enviar",
        });
        if (!ok) return;
        setAvisando(h.id);
        try {
            const res = await fetch(`${base}/config/horarios-de-clase/${encodeURIComponent(h.id)}/avisar`, {
                method: "POST",
                headers: { Authorization: `Bearer ${await token()}` },
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data?.error || `Error (${res.status})`);
            await cargar();
            const texto = `Aviso enviado a ${data.enviados} ${data.enviados === 1 ? "alumno" : "alumnos"}${data.fallidos ? ` · ${data.fallidos} no se pudieron enviar` : ""}.`;
            if (data.fallidos) toast.error(texto); else toast.exito(texto);
        } catch (e) {
            toast.error(`No se mandó el aviso: ${e instanceof Error ? e.message : "error de red"}`);
        } finally {
            setAvisando(null);
        }
    };

    const nombrePlan = (k: string) => planes.find(p => p.key === k)?.nombre ?? k;
    const hoy = todayPT();

    // Agrupado por fecha → plan · nivel, con las horas en orden.
    const grupos = useMemo(() => {
        const out = new Map<string, Map<string, Horario[]>>();
        const orden = [...horarios].sort((a, b) =>
            a.start_date.localeCompare(b.start_date) || a.plan.localeCompare(b.plan) ||
            a.level.localeCompare(b.level) || a.hora_pt.localeCompare(b.hora_pt));
        for (const h of orden) {
            if (!out.has(h.start_date)) out.set(h.start_date, new Map());
            const k = `${h.plan}|${h.level}`;
            const g = out.get(h.start_date)!;
            if (!g.has(k)) g.set(k, []);
            g.get(k)!.push(h);
        }
        return out;
    }, [horarios]);

    const campo = "w-full p-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-falu-red-200 focus:border-falu-red-300 bg-gray-50";
    const selectorDeAlumno = "ml-auto p-1 text-xs border border-gray-200 rounded-lg bg-white";

    return (
        <div>
            <Tarjeta
                className="mb-4"
                titulo="Agregar horario"
                descripcion={
                    <>
                        El alumno lo elige en el formulario al comprar, después de su nivel y su fecha. Hora en <strong>PT</strong>; el alumno la ve en la suya.
                        Si un plan tiene horarios para una fecha y nivel, elegir uno es <strong>obligatorio</strong> para comprar.
                    </>
                }
            >
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                    <label className="text-xs text-gray-400 font-medium">Fecha de inicio
                        <select value={nuevo.start_date} onChange={e => setNuevo(n => ({ ...n, start_date: e.target.value }))} className={`${campo} mt-1`}>
                            <option value="">Selecciona</option>
                            {fechas.map(f => <option key={f.value} value={f.value}>{fmtDia(f.value)}</option>)}
                        </select>
                    </label>
                    <label className="text-xs text-gray-400 font-medium">Plan
                        <select value={nuevo.plan} onChange={e => setNuevo(n => ({ ...n, plan: e.target.value }))} className={`${campo} mt-1`}>
                            <option value="">Selecciona</option>
                            {planes.map(p => <option key={p.key} value={p.key}>{p.nombre}</option>)}
                        </select>
                    </label>
                    <label className="text-xs text-gray-400 font-medium">Nivel
                        <select value={nuevo.level} onChange={e => setNuevo(n => ({ ...n, level: e.target.value }))} className={`${campo} mt-1`}>
                            <option value="">Selecciona</option>
                            {NIVELES_DE_GRUPO.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                        </select>
                    </label>
                    <label className="text-xs text-gray-400 font-medium">Hora (PT)
                        <input type="time" value={nuevo.hora_pt} onChange={e => setNuevo(n => ({ ...n, hora_pt: e.target.value }))} className={`${campo} mt-1`} />
                    </label>
                    <label className="text-xs text-gray-400 font-medium">Mínimo para abrir
                        <input type="number" min={1} value={nuevo.minimo} onChange={e => setNuevo(n => ({ ...n, minimo: e.target.value }))} className={`${campo} mt-1`} />
                    </label>
                    <label className="text-xs text-gray-400 font-medium">Máximo (opcional)
                        <input type="number" min={1} placeholder="Sin tope" value={nuevo.maximo} onChange={e => setNuevo(n => ({ ...n, maximo: e.target.value }))} className={`${campo} mt-1`} />
                    </label>
                </div>
                <div className="flex justify-end">
                    <Boton variante="secundario" onClick={agregar}>
                        Agregar a la lista
                    </Boton>
                </div>
            </Tarjeta>

            {errorDeCarga && (
                <div className="mb-4">
                    <Aviso
                        tono="rojo"
                        titulo="No se pudieron cargar los horarios"
                        accion={<Boton variante="secundario" tamano="sm" onClick={cargar}>Reintentar</Boton>}
                    >
                        {errorDeCarga}
                    </Aviso>
                </div>
            )}

            <Tarjeta
                sinRelleno
                titulo={
                    <>
                        Horarios publicados {sucio && <span className="ml-2 text-xs font-medium text-amber-600">· cambios sin guardar</span>}
                    </>
                }
                acciones={
                    <Boton onClick={guardar} disabled={!sucio} cargando={guardando}>
                        {guardando ? "Guardando…" : "Guardar cambios"}
                    </Boton>
                }
            >
                {cargando ? (
                    <div className="px-5 py-8 flex items-center justify-center gap-2 text-gray-400 text-sm">
                        <Spinner /> Cargando…
                    </div>
                ) : horarios.length === 0 ? (
                    <Vacio>Sin horarios. Mientras no haya, el formulario vende como siempre.</Vacio>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {[...grupos.entries()].map(([fecha, porPlanNivel]) => (
                            <div key={fecha} className="px-5 py-4">
                                <p className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-3">Inicio: {fmtDia(fecha)}</p>
                                <div className="space-y-4">
                                    {[...porPlanNivel.entries()].map(([k, lista]) => (
                                        <div key={k}>
                                            <p className="text-sm font-semibold text-gray-800 mb-2">
                                                {nombrePlan(lista[0].plan)} · {nivelLabel(lista[0].level)}
                                            </p>
                                            <ul className="space-y-2">
                                                {lista.map(h => {
                                                    const inscritos = h.inscritos ?? 0;
                                                    // Pasado el cierre, "confirmado" lo congela el servidor.
                                                    const abre = h.confirmado ?? inscritos >= h.minimo;
                                                    const lleno = h.maximo !== null && inscritos >= h.maximo;
                                                    // Destinos para "Mover a": misma fecha, plan y nivel.
                                                    const destinos = horarios.filter(x =>
                                                        x.id !== h.id && x.plan === h.plan && x.level === h.level && x.start_date === h.start_date);
                                                    return (
                                                        <li key={h.id} className={`rounded-xl border px-3 py-3 ${h.enabled ? "border-gray-200" : "border-dashed border-gray-200 bg-gray-50 opacity-70"}`}>
                                                            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                                                                <span className="text-sm font-semibold text-gray-900 w-28">{horaLegible(h.hora_pt)}</span>
                                                                {h.noAbrio ? <Chip tono="rojo" conPunto>No abrió</Chip>
                                                                    : lleno ? <Chip tono="gris" conPunto>Lleno</Chip>
                                                                    : abre ? <Chip tono="verde" conPunto>Confirmado</Chip>
                                                                    : <Chip tono="ambar" conPunto>{`Faltan ${h.minimo - inscritos}`}</Chip>}
                                                                {h.cierre && (
                                                                    <span className="text-[11px] text-gray-500">
                                                                        {/* Por la FECHA: un grupo confirmado antes de su cierre sigue abierto a cambios. */}
                                                                        {hoy > h.cierre ? "Cerró" : "Cierra"} el {fmtDia(h.cierre)}
                                                                    </span>
                                                                )}
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setAbierto(abierto === h.id ? null : h.id)}
                                                                    className="text-xs font-medium text-gray-600 underline decoration-dotted cursor-pointer"
                                                                    aria-expanded={abierto === h.id}
                                                                >
                                                                    {inscritos} {inscritos === 1 ? "inscrito" : "inscritos"}
                                                                </button>
                                                                <label className="text-xs text-gray-500 flex items-center gap-1">
                                                                    Mín.
                                                                    <input type="number" min={1} value={h.minimo}
                                                                        onChange={e => editar(h.id, { minimo: Math.max(1, parseInt(e.target.value, 10) || 1) })}
                                                                        className="w-14 p-1 text-xs border border-gray-200 rounded-lg" />
                                                                </label>
                                                                <label className="text-xs text-gray-500 flex items-center gap-1">
                                                                    Máx.
                                                                    <input type="number" min={1} placeholder="—" value={h.maximo ?? ""}
                                                                        onChange={e => editar(h.id, { maximo: e.target.value ? Math.max(1, parseInt(e.target.value, 10) || 1) : null })}
                                                                        className="w-14 p-1 text-xs border border-gray-200 rounded-lg" />
                                                                </label>
                                                                {h.maximo !== null && h.maximo < h.minimo && (
                                                                    <span className="text-[11px] font-semibold text-red-600">El máximo es menor que el mínimo: no se podrá guardar</span>
                                                                )}
                                                                <span className="ml-auto flex items-center gap-2">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => editar(h.id, { enabled: !h.enabled })}
                                                                        aria-pressed={h.enabled}
                                                                        title={h.enabled ? "Clic para dejar de ofrecerlo" : "Clic para volver a ofrecerlo"}
                                                                        className={`text-xs font-semibold px-2 py-1 rounded-lg cursor-pointer ${TONO_CLASES[h.enabled ? "verde" : "gris"].chip}`}
                                                                    >
                                                                        {h.enabled ? "Activo" : "Inactivo"}
                                                                    </button>
                                                                    <button type="button" onClick={() => borrar(h)} aria-label={`Borrar horario de las ${horaLegible(h.hora_pt)}`}
                                                                        className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition cursor-pointer">
                                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                        </svg>
                                                                    </button>
                                                                </span>
                                                            </div>

                                                            {h.noAbrio && inscritos > 0 && (
                                                                <div className="mt-3 flex flex-wrap items-center gap-3 rounded-lg bg-red-50 border border-red-100 px-3 py-2">
                                                                    <span className="text-xs text-red-800">
                                                                        No reunió el mínimo. {h.avisadoEn
                                                                            ? `Avisado el ${fmtDateTimePT(h.avisadoEn)}.`
                                                                            : "Sus alumnos todavía no han sido avisados."}
                                                                        {" "}El día antes del inicio, quien no elija pasa solo al horario más cercano.
                                                                    </span>
                                                                    <Boton
                                                                        variante="peligro"
                                                                        tamano="sm"
                                                                        className="ml-auto"
                                                                        onClick={() => avisar(h)}
                                                                        disabled={sucio}
                                                                        cargando={avisando === h.id}
                                                                        title={sucio ? "Guarda primero los cambios" : undefined}
                                                                    >
                                                                        {avisando === h.id ? "Enviando…" : h.avisadoEn ? "Volver a avisar" : "Avisar a los alumnos"}
                                                                    </Boton>
                                                                </div>
                                                            )}

                                                            {abierto === h.id && (
                                                                <div className="mt-3 border-t border-gray-100 pt-3">
                                                                    {(h.alumnos ?? []).length === 0 ? (
                                                                        <p className="text-xs text-gray-400">Nadie inscrito todavía.</p>
                                                                    ) : (
                                                                        <ul className="space-y-1.5">
                                                                            {(h.alumnos ?? []).map(a => (
                                                                                <li key={a.id ?? a.email} className="flex flex-wrap items-center gap-2 text-xs">
                                                                                    <AlumnoEnLista a={a} />
                                                                                    <select
                                                                                        className={selectorDeAlumno}
                                                                                        value=""
                                                                                        onChange={e => {
                                                                                            const v = e.target.value;
                                                                                            if (v) mover(a, v === "__ninguno" ? null : v);
                                                                                        }}
                                                                                    >
                                                                                        <option value="">Mover a…</option>
                                                                                        {destinos.map(d => {
                                                                                            const llenoD = d.maximo !== null && (d.inscritos ?? 0) >= d.maximo;
                                                                                            return (
                                                                                                <option key={d.id} value={d.id} disabled={llenoD}>
                                                                                                    {horaLegible(d.hora_pt)}{llenoD ? " · lleno" : !d.enabled ? " · inactivo" : ""}
                                                                                                </option>
                                                                                            );
                                                                                        })}
                                                                                        <option value="__ninguno">Quitar horario</option>
                                                                                    </select>
                                                                                </li>
                                                                            ))}
                                                                        </ul>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Tarjeta>
            {cambiosDeInicio.length > 0 && (
                <Tarjeta
                    className="mt-4"
                    titulo="Cambiaron de fecha de inicio"
                    acciones={<Chip tono="azul">{cambiosDeInicio.length}</Chip>}
                    descripcion={
                        <>
                            Su renovación en Stripe ya se movió. <strong>La plataforma todavía no recibe este cambio</strong>: actualiza
                            su cohorte allí a la nueva fecha.
                        </>
                    }
                >
                    <ul className="space-y-1.5">
                        {cambiosDeInicio.map((c, i) => (
                            <li key={`${c.email}-${c.en}-${i}`} className="flex flex-wrap items-center gap-2 text-xs">
                                <AlumnoEnLista a={{ id: null, full_name: c.nombre, email: c.email }} />
                                <span className="text-gray-600">· {fmtDia(c.inicioDe)} → <strong>{fmtDia(c.inicioA)}</strong> a las {horaLegible(c.horaA)}</span>
                                <span className="ml-auto text-gray-400">
                                    {c.origen === "automatico" ? "automático" : "lo eligió el alumno"} · {fmtDatePT(c.en)}
                                </span>
                            </li>
                        ))}
                    </ul>
                </Tarjeta>
            )}
            {sinHorario.length > 0 && (
                <Tarjeta
                    className="mt-4"
                    titulo="Alumnos sin horario vigente"
                    acciones={<Chip tono="ambar" conPunto>{sinHorario.length}</Chip>}
                    descripcion="Pagaron con un horario que ya no existe (se borró). Asígnales uno de su fecha y nivel."
                >
                    <ul className="space-y-1.5">
                        {sinHorario.map(a => {
                            const destinos = horarios.filter(x =>
                                x.plan === (a.familia ?? a.plan) && grupoDeNivel(x.level) === grupoDeNivel(a.level) && x.start_date === a.inscription_date);
                            return (
                                <li key={a.id ?? a.email} className="flex flex-wrap items-center gap-2 text-xs">
                                    <AlumnoEnLista a={a} />
                                    <span className="text-gray-500">
                                        · {a.plan ? nombrePlan(a.plan) : "—"} · {nivelLabel(a.level)} · {a.inscription_date ? fmtDia(a.inscription_date) : "sin fecha"}
                                    </span>
                                    <select
                                        className={selectorDeAlumno}
                                        value=""
                                        onChange={e => {
                                            const v = e.target.value;
                                            if (v) mover(a, v === "__ninguno" ? null : v);
                                        }}
                                    >
                                        <option value="">{destinos.length ? "Asignar a…" : "Sin horarios de su fecha y nivel"}</option>
                                        {destinos.map(d => (
                                            <option key={d.id} value={d.id}>{horaLegible(d.hora_pt)}</option>
                                        ))}
                                        <option value="__ninguno">Quitar horario</option>
                                    </select>
                                </li>
                            );
                        })}
                    </ul>
                </Tarjeta>
            )}
            {sinElegir.length > 0 && (
                <Tarjeta
                    className="mt-4"
                    titulo="Compraron sin horario de grupo"
                    acciones={<Chip tono="naranja" conPunto>{sinElegir.length}</Chip>}
                    descripcion={
                        <>
                            Su fecha y nivel no tenían horarios publicados cuando pagaron. Publica uno para su fecha y nivel y asígnaselo,
                            o escríbeles: desde su enlace de <strong>Cambiar mi horario</strong> también pueden elegirlo ellos.
                        </>
                    }
                >
                    <ul className="space-y-1.5">
                        {sinElegir.map(a => {
                            const destinos = horarios.filter(x =>
                                x.plan === (a.familia ?? a.plan) && grupoDeNivel(x.level) === grupoDeNivel(a.level) && x.start_date === a.inscription_date);
                            return (
                                <li key={a.id ?? a.email} className="flex flex-wrap items-center gap-2 text-xs">
                                    <AlumnoEnLista a={a} />
                                    <span className="text-gray-500">
                                        · {a.plan ? nombrePlan(a.plan) : "—"} · {nivelLabel(a.level)} · {a.inscription_date ? fmtDia(a.inscription_date) : "sin fecha"}
                                    </span>
                                    <select
                                        className={selectorDeAlumno}
                                        value=""
                                        disabled={!destinos.length}
                                        onChange={e => { const v = e.target.value; if (v) mover(a, v); }}
                                    >
                                        <option value="">{destinos.length ? "Asignar a…" : "Sin horarios de su fecha y nivel"}</option>
                                        {destinos.map(d => {
                                            const llenoD = d.maximo !== null && (d.inscritos ?? 0) >= d.maximo;
                                            return (
                                                <option key={d.id} value={d.id} disabled={llenoD}>
                                                    {horaLegible(d.hora_pt)}{llenoD ? " · lleno" : !d.enabled ? " · inactivo" : ""}
                                                </option>
                                            );
                                        })}
                                    </select>
                                </li>
                            );
                        })}
                    </ul>
                </Tarjeta>
            )}
            <p className="text-xs text-gray-400 mt-3 px-1 leading-relaxed">
                El alumno ve <strong>&ldquo;Necesita N alumnos más para abrir&rdquo;</strong>, nunca el total ni los nombres. Cada horario
                <strong> cierra 3 días antes del inicio</strong>: si no llegó al mínimo, pulsa <strong>Avisar a los alumnos</strong> y
                cada uno elige otro horario o el siguiente inicio desde su enlace, sin pagar de nuevo. También puedes moverlos tú con
                <strong> Mover a</strong>. Si alguien pide su reembolso (garantía de 3 días), hazlo desde
                <strong> Búsqueda › Reembolsar y cancelar</strong> y no desde el panel de Stripe: así deja de contar en el horario y no
                se le cobra la renovación. <strong>Inactivo</strong> deja de ofrecerlo sin perder a quienes ya están dentro.
            </p>
        </div>
    );
}
