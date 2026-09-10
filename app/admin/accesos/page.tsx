"use client";

const ACCESOS_ENABLED = true;

import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { ErrorState } from "../_utils/ErrorState";
import { LEVELED_PLAN_KEYS, planColor } from "@/app/lib/plans";
dayjs.extend(utc);
dayjs.extend(timezone);

const PT = "America/Los_Angeles";

const LEVEL_LABEL: Record<string, string> = {
    "Principiante":               "Principiante · A1",
    "Basico":                     "Básico · A2",
    "Intermedio":                 "Intermedio · B1",
    "Intermedio alto":            "Intermedio alto · B2",
    "Intermedio alto-gramatica":  "Intermedio alto · B2.1",
    "Intermedio alto-produccion": "Intermedio alto · B2.2",
};

interface AccessUser {
    id: number;
    email: string;
    full_name: string;
    plan: string;
    level: string;
    country: string;
    inscription_date: string | null;
    status: string;
    access_sent_at: string | null;
}

interface LevelConfig {
    whatsapp_link: string;
    classroom_link: string;
    classroom_code: string;
}

type AccessLinks = Record<string, Record<string, LevelConfig>>;

const LEVEL_LABELS: Record<string, string> = {
    "Principiante":               "A1",
    "Basico":                     "A2",
    "Intermedio":                 "B1",
    "Intermedio alto":            "B2",
    "Intermedio alto-gramatica":  "B2.1",
    "Intermedio alto-produccion": "B2.2",
};

// Planes con niveles, derivados del catálogo único de planes.
const PLANS = LEVELED_PLAN_KEYS;

const LEVEL_BADGE: Record<string, { bg: string; text: string; label: string }> = {
    "Principiante":               { bg: "bg-emerald-100", text: "text-emerald-700", label: "A1" },
    "Basico":                     { bg: "bg-blue-100",    text: "text-blue-700",    label: "A2" },
    "Intermedio":                 { bg: "bg-violet-100",  text: "text-violet-700",  label: "B1" },
    "Intermedio alto":            { bg: "bg-rose-100",    text: "text-rose-700",    label: "B2" },
    "Intermedio alto-gramatica":  { bg: "bg-amber-100",   text: "text-amber-700",   label: "B2.1" },
    "Intermedio alto-produccion": { bg: "bg-orange-100",  text: "text-orange-700",  label: "B2.2" },
};

function initials(name: string) {
    return name.split(" ").filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase();
}

function Avatar({ name }: { name: string }) {
    return (
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-falu-red-500 to-yellow-orange-400 flex items-center justify-center font-bold text-white text-xs flex-shrink-0 select-none">
            {initials(name)}
        </div>
    );
}

// Debe seguir a LEVELS de lzacademy-backend/src/config/plans.js. "Intermedio alto"
// (B2) es el nivel único de la fusión; B2.1/B2.2 se quedan mientras haya alumnos
// heredados en esos cursos, para poder seguir gestionando sus accesos.
const LEVELS = [
    "Principiante",
    "Basico",
    "Intermedio",
    "Intermedio alto",
    "Intermedio alto-gramatica",
    "Intermedio alto-produccion",
];

const MONTHS_SHORT_ES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

// Día de ALTA del alumno, normalizado a "YYYY-MM-DD". Los usuarios sin fecha caen
// en el grupo "none".
//
// ⚠️ **Esto NO es una cohorte, aunque el campo se llame `inscription_date` y aquí
// se llamara así.** Desde el 2026-08-28 un ESSENTIAL entra el día que paga, así
// que su fecha es la de su COMPRA. Agrupar por ella sigue siendo útil AQUÍ —esta
// pantalla es para encontrar a una persona, y "quién se dio de alta el 14" es una
// buena forma de buscar—, y por eso las pestañas se conservan: lo único que se
// cambió es el rótulo, que prometía una fecha de inicio de curso.
//
// ⚠️ En el CHURN del Inicio la respuesta es otra (allí se agrupa por mes lo que no
// va por cohorte, ver `cohortKey` en `metrics.service.js`), y es deliberado: una
// pantalla busca personas y la otra compara tandas.
const cohortKey = (u: AccessUser) =>
    u.inscription_date ? dayjs.utc(u.inscription_date).format("YYYY-MM-DD") : "none";

// Etiqueta corta para el tab: "15 jun" / "Sin fecha".
function cohortLabel(key: string) {
    if (key === "none") return "Sin fecha";
    const [, m, d] = key.split("-");
    return `${parseInt(d, 10)} ${MONTHS_SHORT_ES[parseInt(m, 10) - 1]}`;
}

export default function AccesosPage() {
    const [users, setUsers] = useState<AccessUser[]>([]);
    const [links, setLinks] = useState<AccessLinks>({});
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [filter, setFilter] = useState<"all" | "pending" | "sent">("pending");
    const [dateFilter, setDateFilter] = useState<string>("all");
    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [sending, setSending] = useState<number | null>(null);
    const [toast, setToast] = useState<{ id: number; name: string; ok: boolean } | null>(null);
    const [showConfig, setShowConfig] = useState(false);
    const [configDraft, setConfigDraft] = useState<AccessLinks>({});
    const [savingConfig, setSavingConfig] = useState(false);
    const [configPlan, setConfigPlan] = useState("Essential");
    const router = useRouter();

    const load = useCallback(async () => {
        setLoadError(null);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) { router.push("/admin/login"); return; }
            const headers = { Authorization: `Bearer ${session.access_token}` };
            const base = process.env.NEXT_PUBLIC_BACKEND_URL;

            const [usersRes, configRes] = await Promise.all([
                fetch(`${base}/admin/accesos`, { headers }),
                fetch(`${base}/admin/accesos/config`, { headers }),
            ]);
            if (!usersRes.ok) throw new Error(`Error cargando usuarios (${usersRes.status})`);
            if (!configRes.ok) throw new Error(`Error cargando config (${configRes.status})`);
            const [usersData, configData] = await Promise.all([usersRes.json(), configRes.json()]);
            setUsers(usersData);
            setLinks(configData);
            setConfigDraft(configData);
        } catch (e) {
            setLoadError(e instanceof Error ? e.message : "Error de red");
        } finally {
            setLoading(false);
        }
    }, [router]);

    useEffect(() => { load(); }, [load]);

    const showToast = (id: number, name: string, ok: boolean) => {
        setToast({ id, name, ok });
        setTimeout(() => setToast(null), 3500);
    };

    const handleSend = async (user: AccessUser) => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        setSending(user.id);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/admin/accesos/send/${user.id}`, {
                method: "POST",
                headers: { Authorization: `Bearer ${session.access_token}` },
            });
            if (res.ok) {
                setUsers(prev => prev.map(u => u.id === user.id ? { ...u, access_sent_at: new Date().toISOString() } : u));
                showToast(user.id, user.full_name, true);
            } else {
                showToast(user.id, user.full_name, false);
            }
        } catch {
            showToast(user.id, user.full_name, false);
        } finally {
            setSending(null);
        }
    };

    const handleToggleMark = async (user: AccessUser, sent: boolean) => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/admin/accesos/${user.id}/mark`, {
            method: "PATCH",
            headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" },
            body: JSON.stringify({ sent }),
        });
        if (res.ok) {
            setUsers(prev => prev.map(u => u.id === user.id
                ? { ...u, access_sent_at: sent ? new Date().toISOString() : null }
                : u
            ));
        }
    };

    // Exporta los usuarios actualmente filtrados (respeta tab + búsqueda) a CSV.
    // Pensado para importarlo en la plataforma (Classroom) y disparar las invitaciones.
    const handleExportCSV = () => {
        const headers = ["Nombre", "Correo", "Plan", "Nivel", "Fecha de inicio"];
        const escape = (v: string) => `"${(v ?? "").replace(/"/g, '""')}"`;
        const rows = filtered.map(u => [
            u.full_name,
            u.email,
            u.plan,
            LEVEL_LABEL[u.level] ?? u.level,
            u.inscription_date ? dayjs.utc(u.inscription_date).format("DD/MM/YYYY") : "",
        ].map(escape).join(","));
        // BOM UTF-8 para que Excel/la plataforma respeten acentos y ñ.
        const csv = "﻿" + [headers.map(escape).join(","), ...rows].join("\r\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `accesos-${filter}-${dateFilter === "all" ? "todas" : dateFilter}-${dayjs().format("YYYY-MM-DD")}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleSaveConfig = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        setSavingConfig(true);
        try {
            await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/admin/accesos/config`, {
                method: "PUT",
                headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" },
                body: JSON.stringify(configDraft),
            });
            setLinks(configDraft);
            setShowConfig(false);
        } finally {
            setSavingConfig(false);
        }
    };

    // Coincidencia con los filtros que NO son la fecha de inicio (tab enviado/pendiente
    // + búsqueda). Se reutiliza para el conteo de cada tab de cohorte.
    const matchesNonDate = (u: AccessUser) => {
        if (filter === "pending" && u.access_sent_at) return false;
        if (filter === "sent" && !u.access_sent_at) return false;
        if (search) {
            const q = search.toLowerCase();
            if (!u.full_name.toLowerCase().includes(q) && !u.email.toLowerCase().includes(q)) return false;
        }
        return true;
    };

    // Cohortes (fechas de inicio) presentes en los usuarios, ascendente; "Sin fecha" al final.
    const cohorts = Array.from(new Set(users.map(cohortKey)))
        .sort((a, b) => (a === "none" ? 1 : b === "none" ? -1 : a.localeCompare(b)));

    const cohortCount = (key: string) =>
        users.filter(u => (key === "all" || cohortKey(u) === key) && matchesNonDate(u)).length;

    const filtered = users.filter(u =>
        (dateFilter === "all" || cohortKey(u) === dateFilter) && matchesNonDate(u)
    );

    const PAGE_SIZE = 15;
    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
    const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    // Las tarjetas de stats reflejan el cohorte seleccionado (todos si dateFilter = "all").
    const dateScoped = dateFilter === "all" ? users : users.filter(u => cohortKey(u) === dateFilter);
    const pendingCount = dateScoped.filter(u => !u.access_sent_at).length;
    const sentCount    = dateScoped.filter(u => !!u.access_sent_at).length;

    useEffect(() => { setCurrentPage(1); }, [filter, dateFilter, search]);

    const levelConfigOk = (plan: string, level: string) => {
        const c = links[plan]?.[level];
        return !!(c?.whatsapp_link || c?.classroom_link);
    };

    if (!ACCESOS_ENABLED) return (
        <div className="p-4 md:p-8 max-w-screen-xl mx-auto">
            <div className="mb-7">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Accesos</h1>
                <p className="text-sm text-gray-400 mt-1">Envío de accesos al classroom por nivel</p>
            </div>
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 max-w-md">
                    <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
                        <svg className="w-6 h-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                        </svg>
                    </div>
                    <h2 className="text-base font-semibold text-amber-900 mb-2">Sección en preparación</h2>
                    <p className="text-sm text-amber-700 leading-relaxed">Esta sección estará disponible próximamente. Se están realizando ajustes finales antes de habilitar el envío de accesos.</p>
                </div>
            </div>
        </div>
    );

    if (loadError) return <ErrorState message={loadError} onRetry={load} />;

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="flex flex-col items-center gap-3 text-gray-400">
                <svg className="w-8 h-8 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span className="text-sm">Cargando…</span>
            </div>
        </div>
    );

    return (
        <div className="p-4 md:p-8 max-w-screen-xl mx-auto">

            {/* Toast */}
            {toast && (
                <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-lg text-sm font-medium transition-all ${toast.ok ? "bg-emerald-600 text-white" : "bg-red-600 text-white"}`}>
                    {toast.ok
                        ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                        : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    }
                    {toast.ok ? `Acceso enviado a ${toast.name}` : `Error al enviar acceso a ${toast.name}`}
                </div>
            )}

            {/* Config modal */}
            {showConfig && (
                <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm px-0 sm:px-4" onClick={() => setShowConfig(false)}>
                    <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl max-w-2xl w-full sm:p-0 max-h-[92vh] flex flex-col" onClick={e => e.stopPropagation()}>

                        {/* Modal header */}
                        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100 flex-shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                                    <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-800 text-sm leading-tight">Links de acceso</h3>
                                    <p className="text-xs text-gray-400">Por nivel y plan de estudio</p>
                                </div>
                            </div>
                            <button onClick={() => setShowConfig(false)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        {/* Plan tabs */}
                        <div className="px-6 pt-4 pb-3 flex-shrink-0">
                            <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
                                {PLANS.map(p => {
                                    const planLevels = configDraft[p] ?? {};
                                    const configured = LEVELS.filter(l => planLevels[l]?.whatsapp_link || planLevels[l]?.classroom_link).length;
                                    return (
                                        <button key={p} onClick={() => setConfigPlan(p)}
                                            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all relative ${configPlan === p ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                                            {p}
                                            <span className={`block text-[10px] font-normal mt-0.5 ${configPlan === p ? (configured === LEVELS.length ? "text-emerald-500" : "text-amber-500") : "text-gray-400"}`}>
                                                {configured}/{LEVELS.length}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Levels */}
                        <div className="overflow-y-auto flex-1 min-h-0 px-6 pb-2 overscroll-y-contain">
                            <div className="flex flex-col gap-3">
                                {LEVELS.map(level => {
                                    const draft = configDraft[configPlan]?.[level] ?? { whatsapp_link: "", classroom_link: "", classroom_code: "" };
                                    const badge = LEVEL_BADGE[level];
                                    const hasWa = !!draft.whatsapp_link;
                                    const hasClassroom = !!draft.classroom_link;
                                    const hasCode = !!draft.classroom_code;
                                    const filledCount = [hasWa, hasClassroom, hasCode].filter(Boolean).length;
                                    const statusColor = filledCount === 3 ? "bg-emerald-400" : filledCount > 0 ? "bg-amber-400" : "bg-gray-300";
                                    const statusLabel = filledCount === 3 ? "Completo" : filledCount > 0 ? "Parcial" : "Vacío";
                                    const statusText = filledCount === 3 ? "text-emerald-600" : filledCount > 0 ? "text-amber-600" : "text-gray-400";
                                    return (
                                        <div key={level} className="border border-gray-100 rounded-xl overflow-hidden">
                                            <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-100">
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${badge?.bg ?? "bg-gray-100"} ${badge?.text ?? "text-gray-600"}`}>
                                                        {badge?.label ?? level}
                                                    </span>
                                                    <span className="text-sm font-medium text-gray-700">{LEVEL_LABEL[level] ?? level}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <span className={`w-1.5 h-1.5 rounded-full ${statusColor}`} />
                                                    <span className={`text-xs font-medium ${statusText}`}>{statusLabel}</span>
                                                </div>
                                            </div>
                                            <div className="p-3 flex flex-col gap-2">
                                                {/* WhatsApp */}
                                                <div className="flex items-center gap-2">
                                                    <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                                                        <svg className="w-3.5 h-3.5 text-emerald-500" fill="currentColor" viewBox="0 0 24 24">
                                                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                                                            <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.122 1.532 5.856L.078 23.467a.5.5 0 00.63.61l5.765-1.519A11.943 11.943 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.882a9.876 9.876 0 01-5.017-1.369l-.36-.214-3.724.981.996-3.635-.234-.374A9.847 9.847 0 012.118 12C2.118 6.525 6.525 2.118 12 2.118S21.882 6.525 21.882 12 17.475 21.882 12 21.882z" />
                                                        </svg>
                                                    </div>
                                                    <input
                                                        type="text"
                                                        className="flex-1 text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-300 bg-white placeholder:text-gray-300 transition-shadow"
                                                        placeholder="https://chat.whatsapp.com/…"
                                                        value={draft.whatsapp_link}
                                                        onChange={e => setConfigDraft(prev => ({
                                                            ...prev,
                                                            [configPlan]: { ...prev[configPlan], [level]: { ...draft, whatsapp_link: e.target.value } },
                                                        }))}
                                                    />
                                                </div>
                                                {/* Classroom link + code in one row */}
                                                <div className="flex items-center gap-2">
                                                    <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                                                        <svg className="w-3.5 h-3.5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                        </svg>
                                                    </div>
                                                    <input
                                                        type="text"
                                                        className="flex-1 text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white placeholder:text-gray-300 transition-shadow"
                                                        placeholder="https://classroom.google.com/…"
                                                        value={draft.classroom_link}
                                                        onChange={e => setConfigDraft(prev => ({
                                                            ...prev,
                                                            [configPlan]: { ...prev[configPlan], [level]: { ...draft, classroom_link: e.target.value } },
                                                        }))}
                                                    />
                                                    <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                                                        <svg className="w-3.5 h-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                                                        </svg>
                                                    </div>
                                                    <input
                                                        type="text"
                                                        className="w-28 text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-300 bg-white placeholder:text-gray-300 transition-shadow font-mono"
                                                        placeholder="ej: jp42tnpb"
                                                        value={draft.classroom_code}
                                                        onChange={e => setConfigDraft(prev => ({
                                                            ...prev,
                                                            [configPlan]: { ...prev[configPlan], [level]: { ...draft, classroom_code: e.target.value } },
                                                        }))}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex-shrink-0 mt-2">
                            <p className="text-xs text-gray-400">Los cambios se aplican al instante al guardar.</p>
                            <div className="flex gap-2">
                                <button onClick={() => setShowConfig(false)} className="px-4 py-2 text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg hover:bg-white transition cursor-pointer">
                                    Cancelar
                                </button>
                                <button onClick={handleSaveConfig} disabled={savingConfig} className="px-4 py-2 text-xs font-semibold bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition disabled:opacity-50 cursor-pointer flex items-center gap-2">
                                    {savingConfig
                                        ? <><svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>Guardando…</>
                                        : <><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>Guardar cambios</>
                                    }
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex items-start justify-between mb-7">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Accesos</h1>
                    <p className="text-sm text-gray-400 mt-1">Envío de accesos al classroom por nivel</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleExportCSV}
                        disabled={filtered.length === 0}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
                        title={filtered.length === 0 ? "No hay usuarios para exportar" : `Exportar ${filtered.length} usuario(s) a CSV`}
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        Exportar CSV
                    </button>
                    <button
                        onClick={() => setShowConfig(true)}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        Configurar links
                    </button>
                </div>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-7">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-5-3.87M9 20H4v-2a4 4 0 015-3.87m6-4a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Total activos</p>
                        <p className="text-2xl font-bold text-gray-800">{dateScoped.length}</p>
                    </div>
                </div>
                <div className={`bg-white rounded-2xl border shadow-sm p-5 flex items-center gap-4 ${pendingCount > 0 ? "border-amber-200" : "border-gray-100"}`}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${pendingCount > 0 ? "bg-amber-50 text-amber-500" : "bg-gray-50 text-gray-400"}`}>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Pendientes</p>
                        <p className={`text-2xl font-bold ${pendingCount > 0 ? "text-amber-600" : "text-gray-800"}`}>{pendingCount}</p>
                    </div>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Enviados</p>
                        <p className="text-2xl font-bold text-emerald-600">{sentCount}</p>
                    </div>
                </div>
            </div>

            {/* Alert if pending */}
            {pendingCount > 0 && filter !== "sent" && (
                <div className="flex items-center gap-3 px-4 py-3 mb-5 bg-amber-50 border border-amber-200 rounded-2xl">
                    <svg className="w-5 h-5 text-amber-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /></svg>
                    <p className="text-sm text-amber-800 font-medium">{pendingCount} usuario{pendingCount > 1 ? "s" : ""} sin acceso enviado</p>
                </div>
            )}

            {/* Search */}
            <div className="relative mb-4">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
                </svg>
                <input
                    type="text"
                    placeholder="Buscar por nombre o correo…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-orange-300 bg-gray-50"
                />
                {search && (
                    <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                )}
            </div>

            {/* Cohort (start date) tabs */}
            {cohorts.length > 1 && (
                <div className="mb-4">
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Fecha de alta</p>
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            onClick={() => setDateFilter("all")}
                            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-sm font-medium border transition ${dateFilter === "all" ? "bg-violet-600 text-white border-violet-600 shadow-sm" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"}`}
                        >
                            Todas
                            <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${dateFilter === "all" ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"}`}>{cohortCount("all")}</span>
                        </button>
                        {cohorts.map(key => (
                            <button
                                key={key}
                                onClick={() => setDateFilter(key)}
                                className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-sm font-medium border transition ${dateFilter === key ? "bg-violet-600 text-white border-violet-600 shadow-sm" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"}`}
                            >
                                {cohortLabel(key)}
                                <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${dateFilter === key ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"}`}>{cohortCount(key)}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Filter tabs */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 w-fit mb-5">
                {([["all", "Todos"], ["pending", "Pendientes"], ["sent", "Enviados"]] as const).map(([val, label]) => (
                    <button
                        key={val}
                        onClick={() => setFilter(val)}
                        className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${filter === val ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-700">
                        {filter === "pending" ? "Usuarios sin acceso enviado" : filter === "sent" ? "Accesos enviados" : "Todos los usuarios activos"}
                    </h3>
                    <span className="text-xs text-gray-400">
                        {filtered.length === 0 ? "Sin registros" : <><strong className="text-gray-600">{(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)}</strong> de <strong className="text-gray-600">{filtered.length}</strong></>}
                    </span>
                </div>

                {/* Desktop */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="min-w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                {["Usuario", "Plan", "Nivel", "País", "Fecha inicio", "Estado", ""].map(h => (
                                    <th key={h} className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {paginated.length === 0 ? (
                                <tr><td colSpan={7} className="text-center py-12 text-gray-300 text-sm">Sin registros</td></tr>
                            ) : paginated.map(u => {
                                const configReady = levelConfigOk(u.plan, u.level);
                                const isSending = sending === u.id;
                                return (
                                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-5 py-3.5">
                                        <div className="flex items-center gap-3">
                                            <Avatar name={u.full_name} />
                                            <div className="min-w-0">
                                                <p className="text-sm font-semibold text-gray-800 truncate">{u.full_name}</p>
                                                <p className="text-xs text-gray-400 truncate">{u.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <span className="inline-flex items-center gap-1.5 text-sm text-gray-700">
                                            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${planColor(u.plan)}`} />
                                            {u.plan}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3.5 text-sm text-gray-600 whitespace-nowrap">
                                        {LEVEL_LABEL[u.level] ?? u.level}
                                    </td>
                                    <td className="px-5 py-3.5 text-sm text-gray-500">{u.country}</td>
                                    <td className="px-5 py-3.5 text-xs text-gray-500 whitespace-nowrap">
                                        {u.inscription_date ? dayjs.utc(u.inscription_date).format("DD/MM/YYYY") : "—"}
                                    </td>
                                    <td className="px-5 py-3.5">
                                        {u.access_sent_at ? (
                                            <div>
                                                <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                                    Enviado
                                                </span>
                                                <p className="text-xs text-gray-400 mt-1">{dayjs.utc(u.access_sent_at).tz(PT).format("DD/MM/YY")}</p>
                                            </div>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700">
                                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                                Pendiente
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <div className="flex flex-col gap-1.5">
                                            <button
                                                onClick={() => handleToggleMark(u, !u.access_sent_at)}
                                                className={`inline-flex items-center gap-2 text-xs font-semibold px-3.5 py-2 rounded-xl transition shadow-sm ${u.access_sent_at ? "border border-gray-200 text-gray-500 hover:bg-gray-50" : "bg-emerald-500 text-white hover:bg-emerald-600"}`}
                                            >
                                                {u.access_sent_at ? "Marcar como pendiente" : "Marcar como enviado"}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {totalPages > 1 && (
                    <div className="hidden md:flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50">
                        <p className="text-xs text-gray-400">Pág. <strong className="text-gray-600">{currentPage}</strong> / <strong className="text-gray-600">{totalPages}</strong></p>
                        <div className="flex gap-2">
                            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                                className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 disabled:opacity-30 hover:bg-white transition">← Ant.</button>
                            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                                className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 disabled:opacity-30 hover:bg-white transition">Sig. →</button>
                        </div>
                    </div>
                )}

                {/* Mobile */}
                <div className="md:hidden flex flex-col divide-y divide-gray-50">
                    {paginated.length === 0 ? (
                        <div className="p-8 text-center text-gray-300 text-sm">Sin registros</div>
                    ) : paginated.map(u => {
                        const configReady = levelConfigOk(u.plan, u.level);
                        const isSending = sending === u.id;
                        return (
                        <div key={u.id} className="p-4 flex items-start gap-3">
                            <Avatar name={u.full_name} />
                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-gray-800 truncate">{u.full_name}</p>
                                        <p className="text-xs text-gray-400 truncate">{u.email}</p>
                                    </div>
                                    {u.access_sent_at ? (
                                        <span className="flex-shrink-0 inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />Enviado
                                        </span>
                                    ) : (
                                        <span className="flex-shrink-0 inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
                                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />Pendiente
                                        </span>
                                    )}
                                </div>
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                    <span className="inline-flex items-center gap-1 text-xs text-gray-600 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-md">
                                        <span className={`w-1.5 h-1.5 rounded-full ${planColor(u.plan)}`} />{u.plan}
                                    </span>
                                    <span className="text-xs text-gray-500 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-md">{LEVEL_LABEL[u.level] ?? u.level}</span>
                                </div>
                                <div className="flex flex-col gap-1.5 mt-3">
                                    <button
                                        onClick={() => handleToggleMark(u, !u.access_sent_at)}
                                        className={`inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-xl transition ${u.access_sent_at ? "border border-gray-200 text-gray-500 hover:bg-gray-50" : "bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm"}`}
                                    >
                                        {u.access_sent_at ? "Marcar como pendiente" : "Marcar como enviado"}
                                    </button>
                                </div>
                            </div>
                        </div>
                        );
                    })}
                </div>

                {totalPages > 1 && (
                    <div className="md:hidden flex justify-between items-center px-4 py-3 border-t border-gray-100 bg-gray-50">
                        <p className="text-xs text-gray-400">Pág. {currentPage} / {totalPages}</p>
                        <div className="flex gap-2">
                            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                                className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 disabled:opacity-30 bg-white">← Ant.</button>
                            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                                className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 disabled:opacity-30 bg-white">Sig. →</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
