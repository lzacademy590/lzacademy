"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { useEscapeKey } from "../_utils/useEscapeKey";
import { ErrorState } from "../_utils/ErrorState";
dayjs.extend(utc);
dayjs.extend(timezone);

const PT = "America/Los_Angeles";

interface Lead {
    id: string;
    created_at: string;
    email: string;
    full_name: string;
    country: string;
    english_level: string;
    contacted: boolean;
    converted: boolean;
}

/*
  La campaña se envía EN SEGUNDO PLANO desde el 2026-10-17: el POST responde al
  momento con esta foto y la pantalla la vuelve a pedir hasta que termina. Antes
  era una sola petición de hasta una hora, y con «todos» el servidor ni siquiera
  la aceptaba (413: la lista de ids pasaba de 100 KB).
*/
interface Campana {
    id: string;
    estado: "enviando" | "terminada" | "error";
    asunto: string;
    total: number;
    procesados: number;
    sent: number;
    sentButNotMarked: number;
    failed: number;
    skipped: number;
    converted: number;
    iniciada: string;
    terminada: string | null;
    error: string | null;
    fallidos: { email?: string; error?: string }[];
    omitidos: { email?: string; reason?: string }[];
}

const CADA_MS = 4000;

type FilterKey = "nuevos" | "no_contactados" | "no_convertidos" | "convertidos" | "todos";

const FILTERS: { key: FilterKey; label: string; hint: string }[] = [
    { key: "nuevos", label: "Nuevos", hint: "Sin contactar y sin pago" },
    { key: "no_contactados", label: "No contactados", hint: "Aún no marcados como contactados" },
    { key: "no_convertidos", label: "No convertidos", hint: "Aún sin ningún pago registrado" },
    // Los que ya pagaron (su correo está entre los alumnos). Sirve para escribir
    // solo a quien ya es alumno — una novedad, una encuesta — sin mezclarlo con
    // los leads que aún no compran.
    { key: "convertidos", label: "Convertidos", hint: "Ya tienen un pago registrado" },
    { key: "todos", label: "Todos", hint: "Todos los leads" },
];

export default function CorreosMasivos() {
    const router = useRouter();
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    const [subject, setSubject] = useState("");
    const [body, setBody] = useState("");
    const [filter, setFilter] = useState<FilterKey>("nuevos");
    const [search, setSearch] = useState("");
    const [selected, setSelected] = useState<Set<string>>(new Set());

    const [starting, setStarting] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [campana, setCampana] = useState<Campana | null>(null);
    const [error, setError] = useState<string | null>(null);
    // Mientras haya una campaña enviándose no se puede lanzar otra.
    const sending = starting || campana?.estado === "enviando";
    // Al lanzar una campaña la pantalla sube hasta su progreso: el botón de
    // enviar está abajo y el progreso arriba, fuera de la vista (medido).
    const progresoRef = useRef<HTMLDivElement>(null);
    const [recienLanzada, setRecienLanzada] = useState<string | null>(null);
    useEffect(() => {
        if (recienLanzada && campana?.id === recienLanzada) {
            progresoRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
            setRecienLanzada(null);
        }
    }, [recienLanzada, campana]);

    // Cerrar el modal de confirmación con Esc (además del click-fuera existente).
    useEscapeKey(confirmOpen && !sending, () => setConfirmOpen(false));

    const load = useCallback(async () => {
        setLoadError(null);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.push("/admin/login");
                return;
            }
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/admin/marketing`, {
                headers: { Authorization: `Bearer ${session.access_token}` },
            });
            if (!res.ok) throw new Error(`Error del servidor (${res.status})`);
            const result = await res.json();
            const subs: Lead[] = (result.submissions ?? []).map((s: Record<string, unknown>) => ({
                id: String(s.id),
                created_at: s.created_at as string,
                email: s.email as string,
                full_name: (s.full_name as string) ?? "",
                country: (s.country as string) ?? "",
                english_level: (s.english_level as string) ?? "",
                contacted: Boolean(s.contacted),
                converted: Boolean(s.converted),
            }));
            setLeads(subs);
        } catch (e) {
            setLoadError(e instanceof Error ? e.message : "Error de red");
        } finally {
            setLoading(false);
        }
    }, [router]);

    useEffect(() => { load(); }, [load]);

    // Progreso de la campaña. Al entrar se pregunta si hay una en curso —el
    // admin puede haber cerrado la pestaña a mitad—, y mientras se envía se
    // vuelve a preguntar cada pocos segundos.
    const consultarCampana = useCallback(async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return null;
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/admin/leads/bulk-email/estado`, {
                headers: { Authorization: `Bearer ${session.access_token}` },
            });
            if (!res.ok) return null;
            const data = await res.json();
            return (data?.campana ?? null) as Campana | null;
        } catch {
            return null;
        }
    }, []);

    useEffect(() => {
        consultarCampana().then((c) => { if (c) setCampana(c); });
    }, [consultarCampana]);

    useEffect(() => {
        if (campana?.estado !== "enviando") return;
        const t = setTimeout(async () => {
            const c = await consultarCampana();
            if (!c) return setCampana((prev) => prev ? { ...prev } : prev); // reintenta en el siguiente ciclo
            setCampana(c);
            // Al terminar se recargan los leads: la marca de «contactado» la
            // escribe el servidor uno por uno.
            if (c.estado !== "enviando") load();
        }, CADA_MS);
        return () => clearTimeout(t);
    }, [campana, consultarCampana, load]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return leads.filter((l) => {
            if (filter === "nuevos" && (l.contacted || l.converted)) return false;
            if (filter === "no_contactados" && l.contacted) return false;
            if (filter === "no_convertidos" && l.converted) return false;
            if (filter === "convertidos" && !l.converted) return false;
            if (q && !l.full_name.toLowerCase().includes(q) && !l.email.toLowerCase().includes(q)) return false;
            return true;
        });
    }, [leads, filter, search]);

    // Cuántos hay en cada categoría, para que se vea sin tener que pulsarla.
    const conteo = useMemo(() => ({
        nuevos: leads.filter((l) => !l.contacted && !l.converted).length,
        no_contactados: leads.filter((l) => !l.contacted).length,
        no_convertidos: leads.filter((l) => !l.converted).length,
        convertidos: leads.filter((l) => l.converted).length,
        todos: leads.length,
    }), [leads]);

    const visibleIds = useMemo(() => filtered.map((l) => l.id), [filtered]);
    const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selected.has(id));
    const selectedList = useMemo(() => leads.filter((l) => selected.has(l.id)), [leads, selected]);

    const toggleOne = (id: string) => {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const toggleAllVisible = () => {
        setSelected((prev) => {
            const next = new Set(prev);
            if (allVisibleSelected) visibleIds.forEach((id) => next.delete(id));
            else visibleIds.forEach((id) => next.add(id));
            return next;
        });
    };

    const canSend = subject.trim().length > 0 && body.trim().length > 0 && selected.size > 0 && !sending;

    const handleSend = async () => {
        setConfirmOpen(false);
        setStarting(true);
        setError(null);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/admin/leads/bulk-email`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${session!.access_token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    subject: subject.trim(),
                    body,
                    ids: Array.from(selected),
                }),
            });
            // Un 413 o un 429 no llegan en JSON: se lee el texto sin lanzar.
            const texto = await res.text();
            let data: { error?: string; campana?: Campana } = {};
            try { data = texto ? JSON.parse(texto) : {}; } catch { /* no era JSON */ }
            if (!res.ok) {
                if (data.campana) setCampana(data.campana);
                setError(
                    data.error ||
                    (res.status === 429 ? "Demasiadas solicitudes. Espera un minuto y vuelve a intentarlo." : `Error del servidor (${res.status}). No se envió ningún correo.`)
                );
                return;
            }
            if (data.campana) {
                setCampana(data.campana);
                setRecienLanzada(data.campana.id);
            }
            setSelected(new Set());
        } catch {
            setError("No se pudo conectar con el servidor. No se envió ningún correo.");
        } finally {
            setStarting(false);
        }
    };

    if (loadError) return <ErrorState message={loadError} onRetry={load} />;

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-3 text-gray-400">
                    <svg className="w-8 h-8 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    <span className="text-sm">Cargando leads…</span>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 max-w-screen-xl mx-auto">
            {/* Header */}
            <div className="mb-7">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Correos masivos</h1>
                <p className="text-sm text-gray-400 mt-1">
                    Envía un correo a varios leads a la vez. Se envía desde{" "}
                    <span className="font-medium text-gray-600">loren.lainez@lz-englishacademy.com</span>.
                    Cada lead enviado queda marcado como <span className="font-medium text-teal-600">contactado</span>;
                    aparece como <span className="font-medium text-violet-600">convertido</span> solo si tiene un pago registrado.
                </p>
            </div>

            {/* Progreso / resumen de la campaña */}
            {campana && (() => {
                const enviados = campana.sent + campana.sentButNotMarked;
                const pct = campana.total ? Math.round((campana.procesados / campana.total) * 100) : 0;
                const enCurso = campana.estado === "enviando";
                const fallo = campana.estado === "error";
                // ~1,2 s por correo entre la pausa de Resend y la llamada.
                const minutos = Math.max(1, Math.ceil(((campana.total - campana.procesados) * 1.2) / 60));
                // Terminada CON fallos no se pinta en verde: «completado» encima de
                // una lista de fallidos se lee como que todo salió bien.
                const conFallos = !enCurso && !fallo && campana.failed > 0;
                const tono = fallo ? "border-red-100 bg-red-50" : enCurso || conFallos ? "border-amber-100 bg-amber-50" : "border-emerald-100 bg-emerald-50";
                return (
                    <div ref={progresoRef} className={`mb-6 rounded-2xl border p-4 sm:p-5 scroll-mt-4 ${tono}`} role="status" aria-live="polite">
                        <p className={`text-sm font-semibold ${fallo ? "text-red-800" : enCurso || conFallos ? "text-amber-800" : "text-emerald-800"}`}>
                            {enCurso ? "Enviando la campaña…" : fallo ? "La campaña se interrumpió" : conFallos ? "Envío terminado, con fallos" : "Envío completado"}
                            <span className="font-normal text-gray-500"> · “{campana.asunto}”</span>
                        </p>
                        <div className="mt-3 h-2 w-full rounded-full bg-white/70 overflow-hidden">
                            <div className={`h-full rounded-full transition-all ${fallo ? "bg-red-400" : enCurso || conFallos ? "bg-amber-400" : "bg-emerald-500"}`} style={{ width: `${pct}%` }} />
                        </div>
                        <p className="text-xs text-gray-600 mt-2 tabular-nums">
                            <strong>{campana.procesados}</strong> de <strong>{campana.total}</strong> ({pct}%) ·{" "}
                            <strong>{enviados}</strong> enviados · <strong>{enviados - campana.converted}</strong> contactados (sin pago) ·{" "}
                            <strong>{campana.converted}</strong> ya convertidos
                            {campana.skipped > 0 && <> · {campana.skipped} omitidos</>}
                            {campana.failed > 0 && <> · <strong className="text-red-600">{campana.failed} fallidos</strong></>}
                        </p>
                        {enCurso && (
                            <p className="text-xs text-amber-700 mt-1">
                                Quedan unos {minutos} min. Puedes cerrar esta página: el envío sigue en el servidor y al volver verás el progreso.
                            </p>
                        )}
                        {fallo && (
                            <p className="text-xs text-red-600 mt-1">
                                {campana.error ? `${campana.error}. ` : ""}Lo enviado ya quedó marcado como contactado: para seguir, envía a «No contactados».
                            </p>
                        )}
                        {campana.failed > 0 && !enCurso && (
                            <p className="text-xs text-red-500 mt-1 break-words">
                                Fallidos: {campana.fallidos.map((r) => r.email).filter(Boolean).join(", ")}
                            </p>
                        )}
                        {campana.omitidos.some((o) => o.reason?.includes("baja")) && !enCurso && (
                            <p className="text-xs text-gray-500 mt-1">
                                Los omitidos por baja pidieron no recibir estos correos y no se marcan como contactados.
                            </p>
                        )}
                    </div>
                );
            })()}

            {error && (
                <div className="mb-6 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* ── Compositor ── */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                        <h2 className="text-sm font-semibold text-gray-700 mb-4">Redactar correo</h2>

                        <label className="block text-xs font-medium text-gray-500 mb-1">Asunto</label>
                        <input
                            type="text"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            placeholder="Ej. ¿Lista para empezar tu inglés?"
                            className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-orange-400"
                        />
                        <p className="text-xs text-gray-500 mt-1 mb-4">
                            Es también el <strong>titular</strong> que se ve dentro del correo, y admite{" "}
                            <code className="bg-gray-100 px-1 rounded">{"{nombre}"}</code>.
                        </p>

                        <label className="block text-xs font-medium text-gray-500 mb-1">Cuerpo del correo</label>
                        <textarea
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            rows={11}
                            placeholder={"Hola {nombre},\n\nEscribe aquí tu mensaje…\n\nLos enlaces (https://…) se convierten automáticamente."}
                            className="w-full p-3 border border-gray-200 rounded-lg text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-yellow-orange-400 resize-y"
                        />
                        <p className="text-xs text-gray-400 mt-2">
                            Usa <code className="bg-gray-100 px-1 rounded">{"{nombre}"}</code> para insertar el nombre del lead.
                            Se aplica el diseño de marca de LZ English Academy.
                        </p>

                        {(subject.trim() || body.trim()) && (
                            <div className="mt-4 border-t border-gray-100 pt-4">
                                <p className="text-xs font-medium text-gray-500 mb-2">
                                    Vista previa <span className="text-gray-400">(con un nombre de ejemplo)</span>
                                </p>
                                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                                    {/*
                                        El asunto se sustituye AQUÍ TAMBIÉN desde que
                                        vale `{nombre}` en él: enseñándolo crudo, el
                                        panel diría "{nombre}" y el correo "María".
                                        Y con la misma regex que el backend (`gi`).
                                    */}
                                    {subject.trim() && (
                                        <p className="text-sm font-semibold text-gray-800 mb-2">
                                            {subject.trim().replace(/\{nombre\}/gi, "María")}
                                        </p>
                                    )}
                                    <p className="text-sm leading-relaxed text-gray-700 whitespace-pre-wrap">
                                        {(body || "").replace(/\{nombre\}/gi, "María")}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Selección + envío */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-gray-500">Destinatarios seleccionados</span>
                            <span className="text-2xl font-bold text-gray-800">{selected.size}</span>
                        </div>
                        <p className="text-xs text-gray-400 mb-4">
                            Se enviará uno por uno. Puede tardar ~0.5s por correo.
                        </p>
                        <button
                            onClick={() => setConfirmOpen(true)}
                            disabled={!canSend}
                            className="w-full flex items-center justify-center gap-2 bg-yellow-orange-500 text-white px-4 py-2.5 rounded-lg hover:bg-yellow-orange-600 transition shadow-sm text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            {sending ? (
                                <>
                                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                    </svg>
                                    Enviando…
                                </>
                            ) : (
                                <>
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                    Enviar a {selected.size} lead{selected.size === 1 ? "" : "s"}
                                </>
                            )}
                        </button>
                        {!canSend && !sending && (
                            <p className="text-xs text-gray-400 mt-2 text-center">
                                {selected.size === 0
                                    ? "Selecciona al menos un lead"
                                    : "Completa el asunto y el cuerpo"}
                            </p>
                        )}
                    </div>
                </div>

                {/* ── Lista de leads ── */}
                <div className="lg:col-span-3">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        {/* Toolbar */}
                        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                            <div className="flex gap-1.5 flex-wrap">
                                {FILTERS.map((f) => (
                                    <button
                                        key={f.key}
                                        onClick={() => setFilter(f.key)}
                                        title={f.hint}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                                            filter === f.key
                                                ? "bg-falu-red-50 text-falu-red-700 ring-1 ring-falu-red-200"
                                                : "text-gray-500 hover:bg-gray-50"
                                        }`}
                                    >
                                        {f.label} <span className="text-gray-400 tabular-nums">({conteo[f.key]})</span>
                                    </button>
                                ))}
                            </div>
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Buscar por nombre o email…"
                                className="p-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-orange-400 w-full sm:w-56"
                            />
                        </div>

                        {/* Select all */}
                        <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                            <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={allVisibleSelected}
                                    onChange={toggleAllVisible}
                                    className="rounded border-gray-300 text-falu-red-600 focus:ring-falu-red-500"
                                />
                                Seleccionar visibles ({filtered.length})
                            </label>
                            {selected.size > 0 && (
                                <button
                                    onClick={() => setSelected(new Set())}
                                    className="text-xs text-gray-400 hover:text-gray-600 underline"
                                >
                                    Limpiar selección
                                </button>
                            )}
                        </div>

                        {/* List */}
                        <div className="max-h-[60vh] overflow-y-auto divide-y divide-gray-50">
                            {filtered.length === 0 ? (
                                <p className="text-center py-12 text-gray-300 text-sm">Sin leads para este filtro.</p>
                            ) : (
                                filtered.map((l) => {
                                    const isSel = selected.has(l.id);
                                    return (
                                        <label
                                            key={l.id}
                                            className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition ${
                                                isSel ? "bg-falu-red-50/40" : "hover:bg-gray-50"
                                            }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={isSel}
                                                onChange={() => toggleOne(l.id)}
                                                className="rounded border-gray-300 text-falu-red-600 focus:ring-falu-red-500 flex-shrink-0"
                                            />
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-medium text-gray-800 truncate">{l.full_name || "—"}</p>
                                                <p className="text-xs text-gray-400 truncate">{l.email}</p>
                                            </div>
                                            <div className="flex items-center gap-1.5 flex-shrink-0">
                                                {l.converted ? (
                                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-violet-100 text-violet-700">
                                                        Convertido
                                                    </span>
                                                ) : l.contacted ? (
                                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-teal-100 text-teal-700">
                                                        Contactado
                                                    </span>
                                                ) : (
                                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-400">
                                                        Nuevo
                                                    </span>
                                                )}
                                                <span className="hidden sm:inline text-[10px] text-gray-300">
                                                    {dayjs.utc(l.created_at).tz(PT).format("DD/MM/YY")}
                                                </span>
                                            </div>
                                        </label>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Confirmación */}
            {confirmOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={() => setConfirmOpen(false)}>
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
                        <h3 className="font-semibold text-gray-800 text-base mb-2">Confirmar envío</h3>
                        <p className="text-sm text-gray-500 leading-relaxed mb-4">
                            Vas a enviar el correo <strong className="text-gray-700">“{subject.trim()}”</strong> a{" "}
                            <strong className="text-falu-red-700">{selected.size}</strong> lead{selected.size === 1 ? "" : "s"} desde{" "}
                            <span className="font-medium">loren.lainez@lz-englishacademy.com</span>. Cada uno quedará marcado como contactado.
                        </p>
                        <div className="max-h-32 overflow-y-auto rounded-lg bg-gray-50 border border-gray-100 p-3 mb-4 text-xs text-gray-500 space-y-0.5">
                            {selectedList.slice(0, 50).map((l) => (
                                <p key={l.id} className="truncate">{l.full_name || l.email} <span className="text-gray-300">· {l.email}</span></p>
                            ))}
                            {selectedList.length > 50 && <p className="text-gray-400">…y {selectedList.length - 50} más</p>}
                        </div>
                        <div className="flex gap-2 justify-end">
                            <button
                                onClick={() => setConfirmOpen(false)}
                                className="px-4 py-2 text-sm rounded-lg text-gray-500 hover:bg-gray-100 transition"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSend}
                                className="px-4 py-2 text-sm rounded-lg bg-yellow-orange-500 text-white hover:bg-yellow-orange-600 transition font-semibold shadow-sm"
                            >
                                Sí, enviar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
