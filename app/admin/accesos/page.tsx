"use client";

const ACCESOS_ENABLED = true;

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { ErrorState } from "../_utils/ErrorState";
import { LEVELED_PLAN_KEYS } from "@/app/lib/plans";
import {
    Pagina,
    EncabezadoDePagina,
    Tarjeta,
    TarjetaDeNumero,
    FilaDeNumeros,
    Cargando,
    Vacio,
    Boton,
    Chip,
    Aviso,
    PlanBadge,
    CampoDeBusqueda,
    Pildoras,
    Paginacion,
    usePaginacion,
    descargarCSV,
    ICONO_DESCARGA,
    NIVELES,
    nivelLabel,
    useToast,
    useConfirmar,
} from "../_ui";
import { fmtDatePT, fmtDia } from "../_utils/format";
dayjs.extend(utc);

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

type FiltroDeEnvio = "all" | "pending" | "sent";

/**
 * Planes con niveles que este front conoce **de memoria**. Es el RESPALDO de las
 * pestañas de "Links de acceso", no su fuente: ver `planesConAccesos`.
 */
const PLANES_DE_RESPALDO = LEVELED_PLAN_KEYS;

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
const LEVELS: string[] = NIVELES.map(n => n.value);
const NIVEL_CORTO: Record<string, string> = Object.fromEntries(NIVELES.map(n => [n.value, n.corto]));

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

// Etiqueta del tab: "15 Jun 2026" / "Sin fecha".
const cohortLabel = (key: string) => (key === "none" ? "Sin fecha" : fmtDia(key));

/** `?estado=pendientes|enviados|todos` en la URL (lo usa el Inicio para enlazar aquí). */
function filtroDesdeLaUrl(): FiltroDeEnvio | null {
    const v = new URLSearchParams(window.location.search).get("estado")?.toLowerCase();
    if (v === "pendientes" || v === "pending") return "pending";
    if (v === "enviados" || v === "sent") return "sent";
    if (v === "todos" || v === "all") return "all";
    return null;
}

export default function AccesosPage() {
    const [users, setUsers] = useState<AccessUser[]>([]);
    const [links, setLinks] = useState<AccessLinks>({});
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [filter, setFilter] = useState<FiltroDeEnvio>("pending");
    const [dateFilter, setDateFilter] = useState<string>("all");
    const [search, setSearch] = useState("");
    const [sending, setSending] = useState<number | null>(null);
    const [marking, setMarking] = useState<number | null>(null);
    const [showConfig, setShowConfig] = useState(false);
    const [configDraft, setConfigDraft] = useState<AccessLinks>({});
    const [savingConfig, setSavingConfig] = useState(false);
    const [configPlan, setConfigPlan] = useState("Essential");
    const router = useRouter();
    const toast = useToast();
    const confirmar = useConfirmar();

    useEffect(() => {
        const f = filtroDesdeLaUrl();
        if (f) setFilter(f);
    }, []);

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

    /*
      QUÉ PLANES TIENEN FICHA DE ACCESOS, y por qué no es una constante.

      ⚠️⚠️ Esta pestaña se armaba con `LEVELED_PLAN_KEYS`, los cuatro que
      `plans.ts` define, así que un plan abierto en Admin › Planes **no tenía
      dónde escribir su grupo de WhatsApp ni su classroom**. Se vio con
      PERSONALIZED_PLUS: se vendía, se cobraba y su ficha de accesos no existía
      en ninguna pantalla.

      Lo correcto ya lo contestaba el BACKEND: `getAccessLinks()` recorre
      `LEVELED_PLANS`, que `insertarPlanAdoptado` muta EN SITIO al adoptar un
      plan, y devuelve una entrada por cada uno. O sea que la respuesta ya venía
      en el payload y esta pantalla la estaba ignorando para preguntarle a una
      constante. Derivarlo de aquí no puede divergir de lo que se guarda.

      ⚠️ Incluye también los planes RETIRADOS de la venta, y hace falta: sus
      alumnos siguen existiendo y hay que poder reenviarles sus accesos.

      ⚠️ Un payload vacío significa "todavía no cargó" o "falló la red", nunca
      "no hay planes": ahí se cae a la lista local, que es el fail-open del resto
      del sitio. Un modal de configuración sin ninguna pestaña se lee como roto.
    */
    const planesConAccesos = useMemo(() => {
        const delServidor = Object.keys(configDraft);
        return delServidor.length ? delServidor : PLANES_DE_RESPALDO;
    }, [configDraft]);

    // La pestaña abierta tiene que existir en la lista de verdad. Sin esto, el
    // "Essential" del estado inicial se queda seleccionado aunque el backend
    // devuelva otra cosa, y los campos de abajo editan un plan sin pestaña.
    useEffect(() => {
        if (planesConAccesos.length && !planesConAccesos.includes(configPlan)) {
            setConfigPlan(planesConAccesos[0]);
        }
    }, [planesConAccesos, configPlan]);

    const handleSend = async (user: AccessUser) => {
        if (sending !== null) return;
        const reenvio = !!user.access_sent_at;
        const ok = await confirmar({
            titulo: reenvio ? `¿Reenviar los accesos a ${user.full_name}?` : `¿Enviar los accesos a ${user.full_name}?`,
            mensaje: (
                <>
                    Se mandará el correo de accesos de <strong>{user.plan}</strong> · {nivelLabel(user.level)} a{" "}
                    <strong>{user.email}</strong>.
                    {reenvio && <> Ya se le enviaron el {fmtDatePT(user.access_sent_at)}; le llegará otro correo.</>}
                </>
            ),
            confirmar: reenvio ? "Sí, reenviar" : "Sí, enviar",
        });
        if (!ok) return;
        setSending(user.id);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) { router.push("/admin/login"); return; }
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/admin/accesos/send/${user.id}`, {
                method: "POST",
                headers: { Authorization: `Bearer ${session.access_token}` },
            });
            if (res.ok) {
                setUsers(prev => prev.map(u => u.id === user.id ? { ...u, access_sent_at: new Date().toISOString() } : u));
                toast.exito(`Accesos enviados a ${user.full_name}.`);
            } else {
                let detalle = "";
                try { const d = await res.json(); if (typeof d?.error === "string") detalle = `: ${d.error}`; } catch { /* sin cuerpo JSON */ }
                toast.error(`Error al enviar los accesos a ${user.full_name}${detalle || ` (${res.status})`}.`);
            }
        } catch {
            toast.error(`Error al enviar los accesos a ${user.full_name}: error de red.`);
        } finally {
            setSending(null);
        }
    };

    const handleToggleMark = async (user: AccessUser, sent: boolean) => {
        if (marking !== null) return;
        setMarking(user.id);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) { router.push("/admin/login"); return; }
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/admin/accesos/${user.id}/mark`, {
                method: "PATCH",
                headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" },
                body: JSON.stringify({ sent }),
            });
            if (!res.ok) throw new Error(String(res.status));
            setUsers(prev => prev.map(u => u.id === user.id
                ? { ...u, access_sent_at: sent ? new Date().toISOString() : null }
                : u
            ));
            toast.exito(sent ? `${user.full_name} marcado como enviado.` : `${user.full_name} marcado como pendiente.`);
        } catch {
            toast.error(`No se pudo cambiar la marca de ${user.full_name}.`);
        } finally {
            setMarking(null);
        }
    };

    const handleSaveConfig = async () => {
        setSavingConfig(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) { router.push("/admin/login"); return; }
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/admin/accesos/config`, {
                method: "PUT",
                headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" },
                body: JSON.stringify(configDraft),
            });
            if (!res.ok) {
                let detalle = "";
                try { const d = await res.json(); if (typeof d?.error === "string") detalle = `: ${d.error}`; } catch { /* sin cuerpo JSON */ }
                throw new Error(`No se guardaron los links${detalle || ` (${res.status})`}.`);
            }
            setLinks(configDraft);
            setShowConfig(false);
            toast.exito("Links de acceso guardados.");
        } catch (e) {
            // El modal se queda abierto con lo tecleado para poder reintentar.
            toast.error(e instanceof Error && e.message !== "Failed to fetch" ? e.message : "No se guardaron los links: error de red.");
        } finally {
            setSavingConfig(false);
        }
    };

    // Cerrar sin guardar descarta el borrador: al reabrir se ve lo que hay guardado.
    const closeConfig = () => {
        if (savingConfig) return;
        setConfigDraft(links);
        setShowConfig(false);
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
    const { pagina, setPagina, totalPaginas, visibles: paginated, total } =
        usePaginacion(filtered, PAGE_SIZE, JSON.stringify([filter, dateFilter, search]));

    // Las tarjetas de stats reflejan el cohorte seleccionado (todos si dateFilter = "all").
    const dateScoped = dateFilter === "all" ? users : users.filter(u => cohortKey(u) === dateFilter);
    const pendingCount = dateScoped.filter(u => !u.access_sent_at).length;
    const sentCount    = dateScoped.filter(u => !!u.access_sent_at).length;

    const levelConfigOk = (plan: string, level: string) => {
        const c = links[plan]?.[level];
        return !!(c?.whatsapp_link || c?.classroom_link);
    };

    // Exporta los usuarios actualmente filtrados (respeta tab + búsqueda) a CSV.
    // Pensado para importarlo en la plataforma (Classroom) y disparar las invitaciones.
    // ⚠️ La fecha va en DD/MM/YYYY como siempre: es lo que espera esa importación.
    const handleExportCSV = () => {
        descargarCSV(
            `accesos-${filter}-${dateFilter === "all" ? "todas" : dateFilter}-${dayjs().format("YYYY-MM-DD")}.csv`,
            ["Nombre", "Correo", "Plan", "Nivel", "Fecha de inicio"],
            filtered.map(u => [
                u.full_name,
                u.email,
                u.plan,
                u.level ? nivelLabel(u.level) : "",
                u.inscription_date ? dayjs.utc(u.inscription_date).format("DD/MM/YYYY") : "",
            ]),
        );
    };

    /** Botones de cada fila: enviar/reenviar, marcar y ver ficha. */
    const accionesDeFila = (u: AccessUser) => {
        const configReady = levelConfigOk(u.plan, u.level);
        const isSending = sending === u.id;
        return (
            <div className="flex flex-wrap items-center gap-1.5">
                <span title={configReady ? undefined : `Faltan los links de ${u.plan} · ${nivelLabel(u.level)}. Configúralos en «Configurar links».`}>
                    <Boton
                        variante="secundario"
                        tamano="sm"
                        onClick={() => handleSend(u)}
                        disabled={!configReady || (sending !== null && !isSending)}
                        cargando={isSending}
                    >
                        {isSending ? "Enviando…" : u.access_sent_at ? "Reenviar" : "Enviar accesos"}
                    </Boton>
                </span>
                <Boton
                    variante="fantasma"
                    tamano="sm"
                    onClick={() => handleToggleMark(u, !u.access_sent_at)}
                    cargando={marking === u.id}
                    disabled={marking !== null && marking !== u.id}
                >
                    {u.access_sent_at ? "Marcar como pendiente" : "Marcar como enviado"}
                </Boton>
                <Link
                    href={`/admin/busqueda?q=${encodeURIComponent(u.email)}`}
                    className="text-xs font-semibold text-falu-red-600 hover:text-falu-red-700 hover:underline px-1"
                >
                    Ver ficha
                </Link>
            </div>
        );
    };

    const estadoDeEnvio = (u: AccessUser) =>
        u.access_sent_at ? <Chip tono="verde" conPunto>Enviado</Chip> : <Chip tono="ambar" conPunto>Pendiente</Chip>;

    if (!ACCESOS_ENABLED) return (
        <Pagina>
            <EncabezadoDePagina titulo="Accesos" descripcion="Envío de accesos al classroom por nivel" />
            <Aviso tono="ambar" titulo="Sección en preparación">
                Esta sección estará disponible próximamente. Se están realizando ajustes finales antes de habilitar el envío de accesos.
            </Aviso>
        </Pagina>
    );

    if (loadError) return <ErrorState message={loadError} onRetry={load} />;

    if (loading) return <Cargando />;

    return (
        <Pagina>

            {/* Config modal */}
            {showConfig && (
                <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm px-0 sm:px-4" onClick={closeConfig}>
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
                            <button onClick={closeConfig} aria-label="Cerrar" className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        {/* Plan tabs */}
                        <div className="px-6 pt-4 pb-3 flex-shrink-0">
                            {/* flex-wrap y min-w: con cuatro pestañas `flex-1` bastaba, pero la
                                clave de un plan adoptado es larga ("PERSONALIZED_PLUS") y a
                                partir de la quinta se aplastaban hasta no leerse. */}
                            <div className="flex flex-wrap gap-1 bg-gray-100 rounded-xl p-1">
                                {planesConAccesos.map(p => {
                                    const planLevels = configDraft[p] ?? {};
                                    const configured = LEVELS.filter(l => planLevels[l]?.whatsapp_link || planLevels[l]?.classroom_link).length;
                                    return (
                                        <button key={p} onClick={() => setConfigPlan(p)}
                                            className={`flex-1 min-w-[7.5rem] px-2 py-2 rounded-lg text-xs font-semibold transition-all relative cursor-pointer ${configPlan === p ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
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
                                    const hasWa = !!draft.whatsapp_link;
                                    const hasClassroom = !!draft.classroom_link;
                                    const hasCode = !!draft.classroom_code;
                                    const filledCount = [hasWa, hasClassroom, hasCode].filter(Boolean).length;
                                    return (
                                        <div key={level} className="border border-gray-100 rounded-xl overflow-hidden">
                                            <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-100">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-white border border-gray-200 text-gray-600">
                                                        {NIVEL_CORTO[level] ?? level}
                                                    </span>
                                                    <span className="text-sm font-medium text-gray-700">{nivelLabel(level)}</span>
                                                </div>
                                                {filledCount === 3
                                                    ? <Chip tono="verde" conPunto>Completo</Chip>
                                                    : filledCount > 0
                                                        ? <Chip tono="ambar" conPunto>Parcial</Chip>
                                                        : <Chip tono="gris" conPunto>Vacío</Chip>}
                                            </div>
                                            <div className="p-3 flex flex-col gap-2">
                                                {/* WhatsApp */}
                                                <div className="flex items-center gap-2">
                                                    <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0" title="Grupo de WhatsApp">
                                                        <svg className="w-3.5 h-3.5 text-emerald-500" fill="currentColor" viewBox="0 0 24 24">
                                                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                                                            <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.122 1.532 5.856L.078 23.467a.5.5 0 00.63.61l5.765-1.519A11.943 11.943 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.882a9.876 9.876 0 01-5.017-1.369l-.36-.214-3.724.981.996-3.635-.234-.374A9.847 9.847 0 012.118 12C2.118 6.525 6.525 2.118 12 2.118S21.882 6.525 21.882 12 17.475 21.882 12 21.882z" />
                                                        </svg>
                                                    </div>
                                                    <input
                                                        type="text"
                                                        className="flex-1 min-w-0 text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-falu-red-200 bg-white placeholder:text-gray-300 transition-shadow"
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
                                                    <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0" title="Link del classroom">
                                                        <svg className="w-3.5 h-3.5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                        </svg>
                                                    </div>
                                                    <input
                                                        type="text"
                                                        className="flex-1 min-w-0 text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-falu-red-200 bg-white placeholder:text-gray-300 transition-shadow"
                                                        placeholder="https://classroom.google.com/…"
                                                        value={draft.classroom_link}
                                                        onChange={e => setConfigDraft(prev => ({
                                                            ...prev,
                                                            [configPlan]: { ...prev[configPlan], [level]: { ...draft, classroom_link: e.target.value } },
                                                        }))}
                                                    />
                                                    <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0" title="Código del classroom">
                                                        <svg className="w-3.5 h-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                                                        </svg>
                                                    </div>
                                                    <input
                                                        type="text"
                                                        className="w-28 text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-falu-red-200 bg-white placeholder:text-gray-300 transition-shadow font-mono"
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
                        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex-shrink-0 mt-2">
                            <p className="text-xs text-gray-400">Los cambios se aplican al instante al guardar.</p>
                            <div className="flex gap-2">
                                <Boton variante="secundario" tamano="sm" onClick={closeConfig} disabled={savingConfig}>
                                    Cancelar
                                </Boton>
                                <Boton variante="primario" tamano="sm" onClick={handleSaveConfig} cargando={savingConfig}>
                                    {savingConfig ? "Guardando…" : "Guardar cambios"}
                                </Boton>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <EncabezadoDePagina
                titulo="Accesos"
                descripcion="Envío de accesos al classroom por nivel"
                acciones={
                    <>
                        <Boton
                            variante="secundario"
                            onClick={handleExportCSV}
                            disabled={filtered.length === 0}
                            icono={ICONO_DESCARGA}
                            title={filtered.length === 0 ? "No hay usuarios para exportar" : `Exportar ${filtered.length} usuario(s) a CSV`}
                        >
                            Exportar CSV
                        </Boton>
                        <Boton
                            variante="secundario"
                            onClick={() => setShowConfig(true)}
                            icono={<svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>}
                        >
                            Configurar links
                        </Boton>
                    </>
                }
            />

            {/* Stat cards */}
            <FilaDeNumeros columnas={3}>
                <TarjetaDeNumero
                    etiqueta="Total activos"
                    valor={dateScoped.length}
                    acento="gris"
                    icono={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-5-3.87M9 20H4v-2a4 4 0 015-3.87m6-4a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
                />
                <TarjetaDeNumero
                    etiqueta="Pendientes"
                    valor={pendingCount}
                    acento={pendingCount > 0 ? "ambar" : "gris"}
                    icono={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                />
                <TarjetaDeNumero
                    etiqueta="Enviados"
                    valor={sentCount}
                    acento="verde"
                    icono={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                />
            </FilaDeNumeros>

            {/* Alert if pending */}
            {pendingCount > 0 && filter !== "sent" && (
                <div className="mb-5">
                    <Aviso tono="ambar" titulo={`${pendingCount} usuario${pendingCount > 1 ? "s" : ""} sin acceso enviado`} />
                </div>
            )}

            {/* Search */}
            <div className="flex mb-4">
                <CampoDeBusqueda valor={search} onCambio={setSearch} />
            </div>

            {/* Cohort (start date) tabs */}
            {cohorts.length > 1 && (
                <div className="mb-4">
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Fecha de alta</p>
                    <Pildoras
                        opciones={[
                            { valor: "all", label: "Todas", cuenta: cohortCount("all") },
                            ...cohorts.map(key => ({ valor: key, label: cohortLabel(key), cuenta: cohortCount(key) })),
                        ]}
                        valor={dateFilter}
                        onCambio={setDateFilter}
                    />
                </div>
            )}

            {/* Filter tabs */}
            <div className="mb-5">
                <Pildoras<FiltroDeEnvio>
                    opciones={[
                        { valor: "all", label: "Todos" },
                        { valor: "pending", label: "Pendientes" },
                        { valor: "sent", label: "Enviados" },
                    ]}
                    valor={filter}
                    onCambio={setFilter}
                />
            </div>

            {/* Table */}
            <Tarjeta
                sinRelleno
                titulo={filter === "pending" ? "Usuarios sin acceso enviado" : filter === "sent" ? "Accesos enviados" : "Todos los usuarios activos"}
                acciones={
                    <span className="text-xs text-gray-400">
                        {total === 0 ? "Sin registros" : <><strong className="text-gray-600">{(pagina - 1) * PAGE_SIZE + 1}–{Math.min(pagina * PAGE_SIZE, total)}</strong> de <strong className="text-gray-600">{total}</strong></>}
                    </span>
                }
            >
                {/* Desktop */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="min-w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                {["Usuario", "Plan", "Nivel", "País", "Fecha de alta", "Estado", ""].map(h => (
                                    <th key={h} className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {paginated.length === 0 ? (
                                <tr><td colSpan={7}><Vacio>Sin registros</Vacio></td></tr>
                            ) : paginated.map(u => (
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
                                    <td className="px-5 py-3.5"><PlanBadge plan={u.plan} /></td>
                                    <td className="px-5 py-3.5 text-sm text-gray-600 whitespace-nowrap">{nivelLabel(u.level)}</td>
                                    <td className="px-5 py-3.5 text-sm text-gray-500">{u.country}</td>
                                    <td className="px-5 py-3.5 text-xs text-gray-500 whitespace-nowrap">{fmtDia(u.inscription_date)}</td>
                                    <td className="px-5 py-3.5">
                                        {estadoDeEnvio(u)}
                                        {u.access_sent_at && <p className="text-xs text-gray-400 mt-1">{fmtDatePT(u.access_sent_at)}</p>}
                                    </td>
                                    <td className="px-5 py-3.5">{accionesDeFila(u)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Mobile */}
                <div className="md:hidden flex flex-col divide-y divide-gray-50">
                    {paginated.length === 0 ? (
                        <Vacio>Sin registros</Vacio>
                    ) : paginated.map(u => (
                        <div key={u.id} className="p-4 flex items-start gap-3">
                            <Avatar name={u.full_name} />
                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-gray-800 truncate">{u.full_name}</p>
                                        <p className="text-xs text-gray-400 truncate">{u.email}</p>
                                    </div>
                                    <div className="flex-shrink-0 text-right">
                                        {estadoDeEnvio(u)}
                                        {u.access_sent_at && <p className="text-[11px] text-gray-400 mt-1">{fmtDatePT(u.access_sent_at)}</p>}
                                    </div>
                                </div>
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-gray-500">
                                    <PlanBadge plan={u.plan} />
                                    <span>{nivelLabel(u.level)}</span>
                                    <span>Alta: {fmtDia(u.inscription_date)}</span>
                                </div>
                                <div className="mt-3">{accionesDeFila(u)}</div>
                            </div>
                        </div>
                    ))}
                </div>

                <Paginacion pagina={pagina} totalPaginas={totalPaginas} setPagina={setPagina} total={total} />
            </Tarjeta>
        </Pagina>
    );
}
