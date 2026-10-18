"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { LongText } from "../_utils/LongText";
import { useEscapeKey } from "../_utils/useEscapeKey";
import { ErrorState } from "../_utils/ErrorState";
import { fmtDatePT, fmtDateTimePT } from "../_utils/format";
import {
    Pagina,
    EncabezadoDePagina,
    Tarjeta,
    TarjetaDeNumero,
    FilaDeNumeros,
    Cargando,
    Vacio,
    Chip,
    Boton,
    Spinner,
    Paginacion,
    usePaginacion,
    ICONO_DESCARGA,
    useToast,
    useParametroDeUrl,
} from "../_ui";
dayjs.extend(utc);

// ── Types ──────────────────────────────────────────────
interface CountryRow  { country: string; leads: number; paid: number; rate: number | null; }
interface MotiveRow   { motive: string; count: number; }
interface MarketingData {
    conversionByCountry: CountryRow[];
    motiveFrequency: MotiveRow[];
    totalLeads: number;
    totalPaid: number;
}
interface InterestSubmission {
    id: string;
    created_at: string;
    email: string;
    full_name: string;
    country: string;
    english_level: string;
    motive: string;
    main_difficulty: string;
    daily_routine: string;
    daily_time: string;
    community: string;
    interested_course: string | null;
    why_community: string | null;
    life_change: string | null;
    additional_info: string | null;
    contacted: boolean;
    contacted_at: string | null;
}

const PAGE_SIZE = 15;

const TABLE_HEADERS = [
    { label: "Contactado",  key: "contacted" },
    { label: "Fecha (PT)",  key: "created_at" },
    { label: "Nombre",      key: "full_name" },
    { label: "Email",       key: "email" },
    { label: "País",        key: "country" },
    { label: "Nivel",       key: "english_level" },
    { label: "Motivo",      key: "motive" },
    { label: "Dificultad",  key: "main_difficulty" },
    { label: "Rutina diaria", key: "daily_routine" },
    { label: "¿Qué cambiaría?", key: "life_change" },
    { label: "Info adicional",  key: "additional_info" },
];

const FILTROS_VACIOS = {
    country: "", english_level: "", community: "", interested_course: "", dateFrom: "", dateTo: "", contacted: "",
};

// Mismo estilo que `CampoDeBusqueda` del kit.
const CLASE_CAMPO = "px-3 py-2 text-sm rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-falu-red-200 focus:border-falu-red-300 max-w-full";

/**
 * `?filtro=sin-contactar` abre la tabla ya filtrada por «No contactados» (lo
 * usan los enlaces del Inicio). Se lee en el inicializador: el primer render
 * es siempre «Cargando…», así que no hay desajuste de hidratación.
 */
function filtrosIniciales() {
    if (typeof window === "undefined") return FILTROS_VACIOS;
    const filtro = new URLSearchParams(window.location.search).get("filtro");
    if (filtro === "sin-contactar") return { ...FILTROS_VACIOS, contacted: "no" };
    if (filtro === "contactados") return { ...FILTROS_VACIOS, contacted: "yes" };
    return FILTROS_VACIOS;
}

// ── Small components ────────────────────────────────────
function RateBar({ rate }: { rate: number | null }) {
    if (rate === null) return <span className="text-xs text-gray-300">—</span>;
    const color     = rate >= 50 ? "bg-emerald-500" : rate >= 20 ? "bg-yellow-orange-500" : "bg-red-400";
    const textColor = rate >= 50 ? "text-emerald-700" : rate >= 20 ? "text-yellow-orange-700" : "text-red-600";
    return (
        <div className="flex items-center gap-2 min-w-[100px]">
            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(rate, 100)}%` }} />
            </div>
            <span className={`text-xs font-semibold ${textColor} w-10 text-right`}>{rate}%</span>
        </div>
    );
}

function TextModal({ title, text, onClose }: { title: string; text: string; onClose: () => void }) {
    useEscapeKey(true, onClose);
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-800 text-sm">{title}</h3>
                    <button onClick={onClose} aria-label="Cerrar" className="text-gray-400 hover:text-gray-600 transition cursor-pointer">
                        <svg className="h-5 w-5" viewBox="0 0 16 16" fill="none">
                            <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                    </button>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{text}</p>
            </div>
        </div>
    );
}

// ── Page ────────────────────────────────────────────────
export default function Marketing() {
    const router  = useRouter();
    const toast   = useToast();
    const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL;

    const [mkt, setMkt]             = useState<MarketingData | null>(null);
    const [submissions, setSubmissions] = useState<InterestSubmission[]>([]);
    const [loading, setLoading]     = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [countrySort, setCountrySort] = useState<"leads" | "paid" | "rate">("leads");
    const [modal, setModal]         = useState<{ title: string; text: string } | null>(null);
    const [toggling, setToggling]   = useState<string | null>(null);
    const [filters, setFilters] = useState(filtrosIniciales);
    // Al llegar por un enlace del Inicio, el inicializador aún lee la URL anterior.
    useParametroDeUrl("filtro", (f) => {
        if (f === "sin-contactar") setFilters((x) => ({ ...x, contacted: "no" }));
        else if (f === "contactados") setFilters((x) => ({ ...x, contacted: "yes" }));
    });

    const load = useCallback(async () => {
        setLoadError(null);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) { router.push("/admin/login"); return; }
            const h = { Authorization: `Bearer ${session.access_token}` };
            const res = await fetch(`${BACKEND}/admin/marketing`, { headers: h });
            if (!res.ok) throw new Error(`Error del servidor (${res.status})`);
            const data = await res.json();
            setMkt(data);
            setSubmissions(Array.isArray(data.submissions) ? data.submissions : []);
        } catch (e) {
            setLoadError(e instanceof Error ? e.message : "Error de red");
        } finally {
            setLoading(false);
        }
    }, [router, BACKEND]);

    useEffect(() => { load(); }, [load]);

    const handleToggleContacted = async (id: string, current: boolean, contactedAt: string | null) => {
        setToggling(id);
        setSubmissions(prev => prev.map(s => s.id === id
            ? { ...s, contacted: !current, contacted_at: !current ? new Date().toISOString() : null }
            : s));
        // Si el servidor no lo guarda, se deshace lo que ya se pintó.
        const revertir = () =>
            setSubmissions(prev => prev.map(s => s.id === id ? { ...s, contacted: current, contacted_at: contactedAt } : s));
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) { revertir(); router.push("/admin/login"); return; }
            const res = await fetch(`${BACKEND}/admin/marketing/${id}/contacted`, {
                method: "PATCH",
                headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" },
                body: JSON.stringify({ contacted: !current }),
            });
            if (!res.ok) {
                revertir();
                toast.error(`No se pudo guardar el cambio (error ${res.status}).`);
                return;
            }
            toast.exito(!current ? "Marcado como contactado." : "Marcado como no contactado.");
        } catch {
            revertir();
            toast.error("No se pudo conectar con el servidor. El cambio no se guardó.");
        } finally {
            setToggling(null);
        }
    };

    // ── Interest table filters ── (antes de los returns: usePaginacion es un hook)
    const filtered = submissions.filter(s => {
        if (filters.country          && s.country !== filters.country) return false;
        if (filters.english_level    && s.english_level !== filters.english_level) return false;
        if (filters.community        && s.community !== filters.community) return false;
        if (filters.interested_course) {
            if (filters.interested_course === "Sin selección" ? s.interested_course !== null : s.interested_course !== filters.interested_course) return false;
        }
        if (filters.dateFrom && dayjs.utc(s.created_at).isBefore(dayjs(filters.dateFrom))) return false;
        if (filters.dateTo   && dayjs.utc(s.created_at).isAfter(dayjs(filters.dateTo).endOf("day"))) return false;
        if (filters.contacted === "yes" && !s.contacted) return false;
        if (filters.contacted === "no"  && s.contacted)  return false;
        return true;
    });
    const { pagina, setPagina, totalPaginas, visibles: paginated } = usePaginacion(filtered, PAGE_SIZE, JSON.stringify(filters));

    if (loadError) return <ErrorState message={loadError} onRetry={load} />;
    if (loading) return <Cargando />;
    if (!mkt) return null;

    // ── Derived ──
    const globalRate  = mkt.totalLeads > 0 ? ((mkt.totalPaid / mkt.totalLeads) * 100).toFixed(1) : "0";
    const topCountry  = [...mkt.conversionByCountry]
        .filter(r => r.rate !== null && r.leads >= 3)
        .sort((a, b) => (b.rate ?? 0) - (a.rate ?? 0))[0];
    const sortedCountries = [...mkt.conversionByCountry].sort((a, b) => {
        if (countrySort === "leads") return b.leads - a.leads;
        if (countrySort === "paid")  return b.paid  - a.paid;
        return (b.rate ?? -1) - (a.rate ?? -1);
    });
    const maxMotive = mkt.motiveFrequency[0]?.count ?? 1;
    const contactados = submissions.filter(s => s.contacted).length;

    const countries = Array.from(new Set(submissions.map(s => s.country))).sort();
    const levels    = Array.from(new Set(submissions.map(s => s.english_level))).sort();
    const courses   = Array.from(new Set(submissions.map(s => s.interested_course ?? "Sin selección"))).sort();

    const hasFilters = Object.values(filters).some(Boolean);

    const handleExport = () => {
        const rows = filtered.map(s => ({
            "Fecha (PT)": fmtDateTimePT(s.created_at),
            Nombre: s.full_name, Email: s.email, País: s.country,
            "Nivel de inglés": s.english_level, Motivo: s.motive,
            "Mayor dificultad": s.main_difficulty, "Rutina diaria": s.daily_routine,
            "Tiempo por día": s.daily_time, "Participaría comunidad": s.community,
            "Curso de interés": s.interested_course ?? "Sin selección",
            "¿Por qué comunidad?": s.why_community ?? "",
            "¿Qué cambiaría?": s.life_change ?? "", "Info adicional": s.additional_info ?? "",
        }));
        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Interesados");
        saveAs(new Blob([XLSX.write(wb, { bookType: "xlsx", type: "array" })], { type: "application/octet-stream" }), "interesados.xlsx");
    };

    const desde = (pagina - 1) * PAGE_SIZE + 1;
    const hasta = Math.min(pagina * PAGE_SIZE, filtered.length);

    return (
        <Pagina>
            {modal && <TextModal title={modal.title} text={modal.text} onClose={() => setModal(null)} />}

            <EncabezadoDePagina
                titulo="Marketing"
                descripcion="Conversión por país, motivaciones y formularios de interés"
            />

            {/* ── Stats ── */}
            <FilaDeNumeros columnas={5}>
                <TarjetaDeNumero etiqueta="Total leads" valor={mkt.totalLeads} acento="marca"
                    icono={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-5-3.87M9 20H4v-2a4 4 0 015-3.87m6-4a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
                />
                <TarjetaDeNumero etiqueta="Convirtieron" valor={mkt.totalPaid} acento="verde"
                    icono={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                />
                <TarjetaDeNumero etiqueta="Tasa global" valor={`${globalRate}%`}
                    detalle={`${mkt.totalPaid} de ${mkt.totalLeads} leads`}
                    acento="violeta"
                    icono={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
                />
                <TarjetaDeNumero
                    etiqueta="Mejor conversión"
                    valor={topCountry ? topCountry.country : "—"}
                    detalle={topCountry ? `${topCountry.rate}% (${topCountry.leads} leads)` : "mín. 3 leads"}
                    acento="ambar"
                    icono={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M5 3l14 9-14 9V3z" /></svg>}
                />
                <TarjetaDeNumero
                    etiqueta="Contactados"
                    valor={`${contactados} / ${submissions.length}`}
                    detalle={submissions.length > 0 ? `${((contactados / submissions.length) * 100).toFixed(0)}% del total` : undefined}
                    acento="azul"
                    icono={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-3 3v-3z" /></svg>}
                />
            </FilaDeNumeros>

            {/* ── Conversion + Motives ── */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-10">
                <Tarjeta
                    titulo="Conversión por país"
                    descripcion="Formularios de interés → pagos"
                    sinRelleno
                    acciones={
                        <div className="flex gap-1">
                            {(["leads", "paid", "rate"] as const).map(s => (
                                <button key={s} onClick={() => setCountrySort(s)}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${countrySort === s ? "bg-gray-800 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
                                    {s === "leads" ? "Leads" : s === "paid" ? "Pagaron" : "Tasa"}
                                </button>
                            ))}
                        </div>
                    }
                >
                    <div className="overflow-auto max-h-[440px]">
                        <table className="min-w-full">
                            <thead className="sticky top-0 bg-gray-50">
                                <tr>
                                    <th className="px-5 py-2.5 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">País</th>
                                    <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Leads</th>
                                    <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Pagaron</th>
                                    <th className="px-5 py-2.5 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Tasa</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {sortedCountries.map(row => (
                                    <tr key={row.country} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-5 py-2.5 text-sm font-medium text-gray-700">{row.country}</td>
                                        <td className="px-4 py-2.5 text-sm text-right text-gray-500">{row.leads}</td>
                                        <td className="px-4 py-2.5 text-sm text-right font-semibold text-gray-700">{row.paid}</td>
                                        <td className="px-5 py-2.5"><RateBar rate={row.rate} /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Tarjeta>

                <Tarjeta
                    titulo="Motivos más frecuentes"
                    descripcion={`Top ${mkt.motiveFrequency.length} razones de los formularios de interés`}
                    sinRelleno
                >
                    <div className="overflow-auto max-h-[440px] px-5 py-4">
                        {mkt.motiveFrequency.length === 0 ? (
                            <Vacio>Sin datos</Vacio>
                        ) : (
                            <div className="flex flex-col gap-3">
                                {mkt.motiveFrequency.map((row, i) => (
                                    <div key={i}>
                                        <div className="flex items-start justify-between gap-2 mb-1">
                                            <div className="flex items-start gap-2 min-w-0">
                                                <span className="flex-shrink-0 w-5 h-5 rounded-md bg-gray-100 text-gray-400 text-xs font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
                                                <span className="text-sm text-gray-700 leading-snug">{row.motive}</span>
                                            </div>
                                            <span className="flex-shrink-0 text-xs font-semibold text-gray-500 mt-0.5">{row.count}</span>
                                        </div>
                                        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden ml-7">
                                            <div className="h-full rounded-full bg-falu-red-500 transition-all duration-500"
                                                style={{ width: `${Math.round((row.count / maxMotive) * 100)}%` }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </Tarjeta>
            </div>

            {/* ── Divider ── */}
            <div className="flex items-center gap-4 mb-7">
                <div className="flex-1 h-px bg-gray-100" />
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Formularios de interés</span>
                <div className="flex-1 h-px bg-gray-100" />
            </div>

            {/* ── Filters ── */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-5 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex flex-wrap gap-4 w-full md:w-auto">
                    {[
                        { label: "País", key: "country", options: countries },
                        { label: "Nivel", key: "english_level", options: levels },
                        { label: "Curso", key: "interested_course", options: courses },
                    ].map(({ label, key, options }) => (
                        <div key={key} className="flex flex-col">
                            <label className="text-xs text-gray-500 font-medium mb-1">{label}</label>
                            <select className={CLASE_CAMPO}
                                value={filters[key as keyof typeof filters]}
                                onChange={e => setFilters({ ...filters, [key]: e.target.value })}>
                                <option value="">Todos</option>
                                {options.map(o => <option key={o}>{o}</option>)}
                            </select>
                        </div>
                    ))}
                    <div className="flex flex-col">
                        <label className="text-xs text-gray-500 font-medium mb-1">Comunidad</label>
                        <select className={CLASE_CAMPO}
                            value={filters.community} onChange={e => setFilters({ ...filters, community: e.target.value })}>
                            <option value="">Todos</option>
                            <option>Sí</option><option>No</option><option>Tal vez</option>
                        </select>
                    </div>
                    <div className="flex flex-col min-w-0">
                        <label className="text-xs text-gray-500 font-medium mb-1">Desde</label>
                        <input type="date" className={CLASE_CAMPO}
                            value={filters.dateFrom} onChange={e => setFilters({ ...filters, dateFrom: e.target.value })} />
                    </div>
                    <div className="flex flex-col min-w-0">
                        <label className="text-xs text-gray-500 font-medium mb-1">Hasta</label>
                        <input type="date" className={CLASE_CAMPO}
                            value={filters.dateTo} onChange={e => setFilters({ ...filters, dateTo: e.target.value })} />
                    </div>
                    <div className="flex flex-col">
                        <label className="text-xs text-gray-500 font-medium mb-1">Contactado</label>
                        <select className={CLASE_CAMPO}
                            value={filters.contacted} onChange={e => setFilters({ ...filters, contacted: e.target.value })}>
                            <option value="">Todos</option>
                            <option value="yes">Contactados</option>
                            <option value="no">No contactados</option>
                        </select>
                    </div>
                    {hasFilters && (
                        <div className="flex flex-col justify-end">
                            <Boton variante="fantasma" tamano="sm" onClick={() => setFilters(FILTROS_VACIOS)}>
                                Limpiar filtros
                            </Boton>
                        </div>
                    )}
                </div>
                <Boton variante="secundario" icono={ICONO_DESCARGA} onClick={handleExport}>
                    Excel
                </Boton>
            </div>

            <p className="text-xs text-gray-400 mb-3 px-1">
                {filtered.length === 0 ? "Sin registros" : (
                    <><strong className="text-gray-600">{desde}–{hasta}</strong> de <strong className="text-gray-600">{filtered.length}</strong> registros</>
                )}
            </p>

            {/* ── Table ── */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-100 text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                {TABLE_HEADERS.map((h, i) => (
                                    <th key={h.key} className={`px-3 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap ${i === 0 ? "sticky left-0 bg-gray-50 z-10" : ""}`}>{h.label}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {paginated.length === 0 ? (
                                <tr><td colSpan={TABLE_HEADERS.length}><Vacio>Sin registros para los filtros aplicados.</Vacio></td></tr>
                            ) : paginated.map(s => (
                                <tr key={s.id} className={`hover:bg-gray-50 transition-colors ${s.contacted ? "bg-emerald-50/40" : ""}`}>
                                    <td className="px-3 py-2 whitespace-nowrap sticky left-0 z-10 bg-white">
                                        <button
                                            onClick={() => handleToggleContacted(s.id, s.contacted, s.contacted_at)}
                                            disabled={toggling === s.id}
                                            title={s.contacted ? `Contactado el ${fmtDatePT(s.contacted_at)}` : "Marcar como contactado"}
                                            className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full transition cursor-pointer disabled:opacity-50 ${s.contacted ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
                                        >
                                            {toggling === s.id
                                                ? <Spinner className="w-3 h-3" />
                                                : s.contacted
                                                    ? <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                                    : <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="9"/></svg>
                                            }
                                            {s.contacted ? "Sí" : "No"}
                                        </button>
                                    </td>
                                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-400">{fmtDateTimePT(s.created_at)}</td>
                                    <td className="px-3 py-2 whitespace-nowrap font-semibold text-gray-800">{s.full_name}</td>
                                    <td className="px-3 py-2 whitespace-nowrap text-gray-500">{s.email}</td>
                                    <td className="px-3 py-2 whitespace-nowrap text-gray-600">{s.country}</td>
                                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">{s.english_level}</td>
                                    <td className="px-3 py-2 text-xs text-gray-500 max-w-[140px] truncate" title={s.motive}>{s.motive}</td>
                                    <td className="px-3 py-2 text-xs text-gray-500 max-w-[140px] truncate" title={s.main_difficulty}>{s.main_difficulty}</td>
                                    <td className="px-3 py-2">
                                        {/* Respuesta libre del formulario (no es un plan): chip neutro. */}
                                        {s.daily_routine ? <Chip>{s.daily_routine}</Chip> : <span className="text-gray-300 text-xs">—</span>}
                                    </td>
                                    <td className="px-3 py-2"><LongText title="¿Qué cambiaría en tu vida?" value={s.life_change} onOpen={setModal} /></td>
                                    <td className="px-3 py-2"><LongText title="Información adicional" value={s.additional_info} onOpen={setModal} /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <Paginacion pagina={pagina} totalPaginas={totalPaginas} setPagina={setPagina} total={filtered.length} />
            </div>
        </Pagina>
    );
}
