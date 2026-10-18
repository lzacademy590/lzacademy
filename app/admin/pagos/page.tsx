"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { planColor } from "../_utils/planColors";
import { ErrorState } from "../_utils/ErrorState";
import { PT, fmtDateTimePT, fmtDia, fmtMoney, fmtMonthYear } from "../_utils/format";
import {
    Pagina,
    EncabezadoDePagina,
    Tarjeta,
    TarjetaDeNumero,
    FilaDeNumeros,
    Cargando,
    Vacio,
    Boton,
    PlanBadge,
    Aviso,
    CampoDeBusqueda,
    usePaginacion,
    Paginacion,
    useToast,
    useConfirmar,
    ICONO_DESCARGA,
    NIVELES,
    nivelLabel,
    ESTADOS_DE_ALUMNO,
    TONO_CLASES,
} from "../_ui";
dayjs.extend(utc);
dayjs.extend(timezone);

interface User {
    id: number;
    email: string;
    full_name: string;
    country: string;
    plan: string;
    level: string;
    motive: string;
    status: string;
    inscription_date: string | null;
    last_payment_date: string | null;
    created_at: string;
    updated_at: string;
}

interface DashboardData {
    totalUsers: number;
    totalPayments: number;
    totalRevenue: number;
    revenueByMonth: Record<string, { amount: number; count: number; byPlan?: Record<string, { count: number; amount: number }> }>;
    paymentsByPlan: Record<string, { count: number; amount: number }>;
    users: User[];
}

const PAGE_SIZE = 15;
const ESTADOS = Object.keys(ESTADOS_DE_ALUMNO);
const ORDEN_DE_NIVELES: string[] = NIVELES.map((n) => n.value);
const etiquetaDeEstado = (s: string) => ESTADOS_DE_ALUMNO[s]?.label ?? s;

/** Ordena niveles como se estudian; los desconocidos, al final. */
function compararNiveles(a: string, b: string) {
    const ai = ORDEN_DE_NIVELES.indexOf(a), bi = ORDEN_DE_NIVELES.indexOf(b);
    if (ai !== -1 && bi !== -1) return ai - bi;
    if (ai !== -1) return -1;
    if (bi !== -1) return 1;
    return 0;
}

const SELECT = "p-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-falu-red-200 bg-white";
const FILTROS_VACIOS = { country: "", status: "", plan: "", level: "", inscriptionDate: "", paymentDateFrom: "", paymentDateTo: "" };

function CopyEmail({ email }: { email: string }) {
    const [copied, setCopied] = useState(false);
    return (
        <span className="inline-flex items-center gap-1.5 group max-w-[180px]">
            <span className="truncate text-sm text-gray-600">{email}</span>
            <button
                onClick={() => { navigator.clipboard.writeText(email); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
                className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded text-gray-300 hover:text-gray-600 cursor-pointer"
                title="Copiar correo"
            >
                {copied
                    ? <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    : <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-4 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                }
            </button>
        </span>
    );
}

/** Selector de estado del alumno, coloreado con el tono de su estado. */
function SelectorDeEstado({ valor, deshabilitado, onCambio, className = "" }: {
    valor: string; deshabilitado: boolean; onCambio: (v: string) => void; className?: string;
}) {
    const tono = ESTADOS_DE_ALUMNO[valor]?.tono ?? "gris";
    return (
        <select
            value={valor}
            disabled={deshabilitado}
            onChange={(e) => onCambio(e.target.value)}
            aria-label="Estado del alumno"
            className={`text-xs font-semibold px-2 py-1 rounded-lg border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-falu-red-200 disabled:opacity-50 disabled:cursor-wait ${TONO_CLASES[tono].chip} ${className}`}
        >
            {ESTADOS.map((s) => <option key={s} value={s}>{etiquetaDeEstado(s)}</option>)}
        </select>
    );
}

export default function Dashboard() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [filters, setFilters] = useState(FILTROS_VACIOS);
    const [search, setSearch] = useState("");
    const [sortBy, setSortBy] = useState<"last_payment_date" | "id">("last_payment_date");
    const [showAtRisk, setShowAtRisk] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [guardando, setGuardando] = useState<Set<number>>(() => new Set());
    const router = useRouter();
    const toast = useToast();
    const confirmar = useConfirmar();

    const load = useCallback(async () => {
        setLoadError(null);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) { router.push("/admin/login"); return; }
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/admin/dashboard`, {
                headers: { Authorization: `Bearer ${session.access_token}` },
            });
            if (!res.ok) throw new Error(`Error del servidor (${res.status})`);
            setData(await res.json());
        } catch (e) {
            setLoadError(e instanceof Error ? e.message : "Error de red");
        }
    }, [router]);

    useEffect(() => { load(); }, [load]);

    const ponerEstado = (userId: number, status: string) =>
        setData((prev) => prev ? {
            ...prev,
            users: prev.users.map((u) => u.id === userId ? { ...u, status } : u),
        } : prev);

    const handleStatusChange = async (user: User, newStatus: string) => {
        const anterior = user.status;
        if (newStatus === anterior) return;
        const ok = await confirmar({
            titulo: `¿Cambiar el estado de ${user.full_name || user.email}?`,
            mensaje: <>{etiquetaDeEstado(anterior)} → <strong>{etiquetaDeEstado(newStatus)}</strong></>,
            confirmar: "Cambiar estado",
            peligro: newStatus === "cancelled",
        });
        if (!ok) return;

        ponerEstado(user.id, newStatus);
        setGuardando((s) => new Set(s).add(user.id));
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error("Tu sesión expiró. Vuelve a iniciar sesión.");
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/admin/users/${user.id}/status`, {
                method: "PATCH",
                headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
            });
            if (!res.ok) throw new Error(`Error del servidor (${res.status})`);
            toast.exito(`${user.full_name || user.email}: ${etiquetaDeEstado(newStatus)}`);
        } catch (e) {
            ponerEstado(user.id, anterior);
            toast.error(`No se pudo cambiar el estado. ${e instanceof Error ? e.message : "Error de red"}`);
        } finally {
            setGuardando((s) => { const n = new Set(s); n.delete(user.id); return n; });
        }
    };

    // Todo lo derivado se calcula antes de los retornos tempranos: la paginación es un hook.
    const users = data?.users ?? [];

    const atRiskUsers = users.filter((u) =>
        u.status === "active" && (!u.last_payment_date || dayjs().diff(dayjs.utc(u.last_payment_date), "day") > 30)
    );
    const atRiskIds = new Set(atRiskUsers.map((u) => u.id));

    const filteredUsers = users.filter((u) => {
        if (filters.country && u.country !== filters.country) return false;
        if (filters.status && u.status !== filters.status) return false;
        if (filters.plan && u.plan !== filters.plan) return false;
        if (filters.level && u.level !== filters.level) return false;
        if (filters.inscriptionDate && !u.inscription_date?.startsWith(filters.inscriptionDate)) return false;
        if (filters.paymentDateFrom && (!u.last_payment_date || dayjs.utc(u.last_payment_date).tz(PT).format("YYYY-MM-DD") < filters.paymentDateFrom)) return false;
        if (filters.paymentDateTo && (!u.last_payment_date || dayjs.utc(u.last_payment_date).tz(PT).format("YYYY-MM-DD") > filters.paymentDateTo)) return false;
        if (showAtRisk && !atRiskIds.has(u.id)) return false;
        if (search) {
            const q = search.toLowerCase();
            if (!u.full_name.toLowerCase().includes(q) && !u.email.toLowerCase().includes(q)) return false;
        }
        return true;
    });

    const sortedUsers = [...filteredUsers].sort((a, b) => {
        if (sortBy === "id") return a.id - b.id;
        // last_payment_date desc, nulls last
        if (!a.last_payment_date && !b.last_payment_date) return 0;
        if (!a.last_payment_date) return 1;
        if (!b.last_payment_date) return -1;
        return b.last_payment_date.localeCompare(a.last_payment_date);
    });

    const { pagina, setPagina, totalPaginas, visibles: paginatedUsers, total } = usePaginacion(
        sortedUsers,
        PAGE_SIZE,
        JSON.stringify({ filters, search, showAtRisk, sortBy }),
    );

    const handleExportExcel = () => {
        if (!data) return;
        const rows = sortedUsers.map((u) => ({
            ID: u.id, Email: u.email, Nombre: u.full_name,
            "Fecha de Inicio": u.inscription_date ? dayjs.utc(u.inscription_date).format("MM/DD/YYYY") : "N/A",
            País: u.country, Plan: u.plan, Nivel: u.level, Motivo: u.motive, Estado: u.status,
            "Último Pago (PT)": u.last_payment_date ? dayjs.utc(u.last_payment_date).tz(PT).format("MM/DD/YYYY h:mm a") : "—",
        }));
        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Usuarios");
        saveAs(new Blob([XLSX.write(wb, { bookType: "xlsx", type: "array" })], { type: "application/octet-stream" }), "usuarios.xlsx");
    };

    if (loadError) return <ErrorState message={loadError} onRetry={load} />;
    if (!data) return <Cargando />;

    const countries = Array.from(new Set(users.map((u) => u.country)));
    const statuses = Array.from(new Set(users.map((u) => u.status)));
    const inscriptionDates = Array.from(
        new Set(users.map((u) => u.inscription_date).filter(Boolean))
    ).sort() as string[];
    const levels = (Array.from(new Set(users.map((u) => u.level).filter(Boolean))) as string[])
        .sort((a, b) => compararNiveles(a, b) || a.localeCompare(b));

    const monthlyRows = Object.entries(data.revenueByMonth ?? {}).sort((a, b) => b[0].localeCompare(a[0]));
    const planRows = Object.entries(data.paymentsByPlan ?? {}).sort((a, b) => b[1].count - a[1].count);
    const maxPlanCount = planRows[0]?.[1]?.count ?? 1;

    const ticketPromedio = data.totalPayments > 0 ? data.totalRevenue / data.totalPayments : 0;
    const hasActiveFilters = Object.values(filters).some(Boolean) || !!search || showAtRisk;

    // Distribución por nivel
    const levelMap: Record<string, Record<string, number>> = {};
    for (const u of users) {
        const lvl = u.level || "Sin nivel";
        const plan = u.plan || "Sin plan";
        if (!levelMap[lvl]) levelMap[lvl] = {};
        levelMap[lvl][plan] = (levelMap[lvl][plan] ?? 0) + 1;
    }
    const levelRows = Object.entries(levelMap)
        .map(([level, plans]) => ({ level, total: Object.values(plans).reduce((a, b) => a + b, 0), plans }))
        .sort((a, b) => compararNiveles(a.level, b.level) || b.total - a.total);
    const maxLevelTotal = levelRows[0]?.total ?? 1;

    const desde = total === 0 ? 0 : (pagina - 1) * PAGE_SIZE + 1;
    const hasta = Math.min(pagina * PAGE_SIZE, total);

    return (
        <Pagina>
            <EncabezadoDePagina
                titulo="Pagos"
                descripcion="Resumen de pagos recibidos"
                acciones={<Boton variante="secundario" icono={ICONO_DESCARGA} onClick={handleExportExcel}>Excel</Boton>}
            />

            <FilaDeNumeros columnas={4}>
                <TarjetaDeNumero etiqueta="Total usuarios" valor={filteredUsers.length}
                    detalle={hasActiveFilters ? "filtrado" : undefined}
                    icono={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-5-3.87M9 20H4v-2a4 4 0 015-3.87m6-4a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
                />
                <TarjetaDeNumero etiqueta="Total pagos" valor={data.totalPayments}
                    detalle="histórico"
                    icono={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
                />
                <TarjetaDeNumero etiqueta="Total revenue" valor={fmtMoney(data.totalRevenue)}
                    detalle="histórico" acento="verde"
                    icono={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" /></svg>}
                />
                <TarjetaDeNumero etiqueta="Ticket promedio" valor={fmtMoney(ticketPromedio)}
                    detalle="por pago" acento="violeta"
                    icono={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
                />
            </FilaDeNumeros>

            {/* En riesgo */}
            {atRiskUsers.length > 0 && (
                <div className="mb-5">
                    <Aviso
                        tono="ambar"
                        titulo={`${atRiskUsers.length} usuario${atRiskUsers.length > 1 ? "s" : ""} activo${atRiskUsers.length > 1 ? "s" : ""} sin pago en más de 30 días`}
                        accion={
                            <Boton variante="secundario" tamano="sm" onClick={() => setShowAtRisk((v) => !v)} aria-pressed={showAtRisk}>
                                {showAtRisk ? "Ver todos" : "Ver en riesgo"}
                            </Boton>
                        }
                    >
                        {showAtRisk ? "Mostrando solo los usuarios en riesgo." : "Se marcan en ámbar en la tabla."}
                    </Aviso>
                </div>
            )}

            {/* Plan breakdown + Monthly revenue */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
                {planRows.length > 0 && (
                    <Tarjeta titulo="Pagos por plan" descripcion="Basado en el plan registrado en cada pago">
                        <div className="flex flex-col gap-4">
                            {planRows.map(([plan, stats]) => {
                                const pctCount = Math.round((stats.count / maxPlanCount) * 100);
                                const revenuePct = data.totalRevenue > 0 ? ((stats.amount / data.totalRevenue) * 100).toFixed(1) : "0";
                                return (
                                    <div key={plan}>
                                        <div className="flex items-center justify-between mb-1.5">
                                            <PlanBadge plan={plan} />
                                            <div className="flex items-center gap-3 text-xs">
                                                <span className="font-semibold text-gray-700">{stats.count} pagos</span>
                                                <span className="text-gray-500 font-medium">{fmtMoney(stats.amount, 0)}</span>
                                                <span className="px-1.5 py-0.5 rounded-md font-semibold bg-gray-100 text-gray-600">{revenuePct}%</span>
                                            </div>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-2">
                                            <div className={`h-2 rounded-full transition-all duration-500 ${planColor(plan)}`} style={{ width: `${pctCount}%` }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
                            <span className="text-xs text-gray-400">Revenue total histórico</span>
                            <span className="text-sm font-bold text-gray-700">{fmtMoney(data.totalRevenue)}</span>
                        </div>
                    </Tarjeta>
                )}

                {monthlyRows.length > 0 && (
                    <Tarjeta titulo="Revenue por mes" descripcion="Desglose por plan registrado en cada pago" sinRelleno>
                        <div className="overflow-auto max-h-80">
                            <table className="min-w-full">
                                <thead className="sticky top-0 bg-gray-50">
                                    <tr>
                                        {["Mes", "Pagos", "Revenue", "vs ant.", "Por plan"].map((h) => (
                                            <th key={h} className="px-5 py-2.5 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {monthlyRows.map(([month, stats], i) => {
                                        const prev = monthlyRows[i + 1]?.[1]?.amount;
                                        const change = prev && prev > 0 ? ((stats.amount - prev) / prev) * 100 : null;
                                        const planEntries = Object.entries(stats.byPlan ?? {}).sort((a, b) => b[1].amount - a[1].amount);
                                        return (
                                            <tr key={month} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-5 py-3 text-sm font-medium text-gray-700 whitespace-nowrap">{fmtMonthYear(month)}</td>
                                                <td className="px-5 py-3 text-sm text-gray-500">{stats.count}</td>
                                                <td className="px-5 py-3 text-sm font-semibold text-gray-800 whitespace-nowrap">{fmtMoney(stats.amount)}</td>
                                                <td className="px-5 py-3">
                                                    {change !== null ? (
                                                        <span className={`text-xs font-semibold ${change >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                                                            {change >= 0 ? "+" : ""}{change.toFixed(1)}%
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs text-gray-300">—</span>
                                                    )}
                                                </td>
                                                <td className="px-5 py-3">
                                                    <div className="flex flex-wrap gap-1">
                                                        {planEntries.map(([plan, s]) => (
                                                            <span key={plan} className="inline-flex items-center gap-1 text-xs text-gray-600 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-md whitespace-nowrap">
                                                                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${planColor(plan)}`} />
                                                                {plan} · {s.count}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </Tarjeta>
                )}
            </div>

            {/* Distribución por nivel */}
            {levelRows.length > 0 && (
                <Tarjeta titulo="Distribución por nivel" className="mb-6">
                    <div className="flex flex-col gap-3.5">
                        {levelRows.map(({ level, total: totalNivel, plans }) => (
                            <div key={level}>
                                <div className="flex items-center justify-between mb-1.5">
                                    <span className="text-sm font-medium text-gray-700 w-48 flex-shrink-0">{nivelLabel(level)}</span>
                                    <div className="flex items-center gap-2 flex-1 mx-3">
                                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full rounded-full bg-gradient-to-r from-falu-red-500 to-yellow-orange-400 transition-all duration-500"
                                                style={{ width: `${Math.round((totalNivel / maxLevelTotal) * 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                    <span className="text-sm font-semibold text-gray-700 w-6 text-right">{totalNivel}</span>
                                </div>
                                <div className="ml-20 flex flex-wrap gap-1.5">
                                    {Object.entries(plans).sort((a, b) => b[1] - a[1]).map(([plan, count]) => (
                                        <span key={plan} className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-md">
                                            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${planColor(plan)}`} />
                                            {plan} · {count}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </Tarjeta>
            )}

            {/* Filtros */}
            <Tarjeta className="mb-5">
                <div className="mb-3 flex">
                    <CampoDeBusqueda valor={search} onCambio={setSearch} />
                </div>
                <div className="flex flex-wrap gap-3 items-end w-full">
                    <div className="flex flex-col gap-1">
                        <label className="text-xs text-gray-400 font-medium">País</label>
                        <select className={SELECT} value={filters.country} onChange={(e) => setFilters({ ...filters, country: e.target.value })}>
                            <option value="">Todos</option>
                            {countries.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs text-gray-400 font-medium">Estado</label>
                        <select className={SELECT} value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
                            <option value="">Todos</option>
                            {statuses.map((s) => <option key={s} value={s}>{etiquetaDeEstado(s)}</option>)}
                        </select>
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs text-gray-400 font-medium">Plan</label>
                        <select className={SELECT} value={filters.plan} onChange={(e) => setFilters({ ...filters, plan: e.target.value })}>
                            <option value="">Todos</option>
                            {Array.from(new Set(users.map((u) => u.plan))).sort().map((p) => (
                                <option key={p} value={p}>{p}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs text-gray-400 font-medium">Nivel</label>
                        <select className={SELECT} value={filters.level} onChange={(e) => setFilters({ ...filters, level: e.target.value })}>
                            <option value="">Todos</option>
                            {levels.map((l) => <option key={l} value={l}>{nivelLabel(l)}</option>)}
                        </select>
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs text-gray-400 font-medium">Fecha de inicio</label>
                        <select className={SELECT} value={filters.inscriptionDate} onChange={(e) => setFilters({ ...filters, inscriptionDate: e.target.value })}>
                            <option value="">Todas</option>
                            {inscriptionDates.map((d) => (
                                <option key={d} value={d}>{fmtDia(d)}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex flex-col gap-1 min-w-0">
                        <label className="text-xs text-gray-400 font-medium">Pagos desde</label>
                        <input type="date" className={`${SELECT} max-w-full`}
                            value={filters.paymentDateFrom} onChange={(e) => setFilters({ ...filters, paymentDateFrom: e.target.value })} />
                    </div>
                    <div className="flex flex-col gap-1 min-w-0">
                        <label className="text-xs text-gray-400 font-medium">Pagos hasta</label>
                        <input type="date" className={`${SELECT} max-w-full`}
                            value={filters.paymentDateTo} onChange={(e) => setFilters({ ...filters, paymentDateTo: e.target.value })} />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs text-gray-400 font-medium">Ordenar por</label>
                        <select className={SELECT} value={sortBy} onChange={(e) => setSortBy(e.target.value as "last_payment_date" | "id")}>
                            <option value="last_payment_date">Último pago</option>
                            <option value="id">ID usuario</option>
                        </select>
                    </div>
                    {hasActiveFilters && (
                        <Boton variante="fantasma" tamano="sm" onClick={() => { setFilters(FILTROS_VACIOS); setSearch(""); setShowAtRisk(false); }}>
                            Limpiar filtros
                        </Boton>
                    )}
                </div>
            </Tarjeta>

            <p className="text-xs text-gray-400 mb-3 px-1">
                {total === 0 ? "Sin registros" : (
                    <><strong className="text-gray-600">{desde}–{hasta}</strong> de <strong className="text-gray-600">{total}</strong> registros</>
                )}
            </p>

            <Tarjeta sinRelleno>
                {paginatedUsers.length === 0 ? (
                    <Vacio>Sin registros</Vacio>
                ) : (
                    <>
                        {/* Escritorio */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-100">
                                <thead className="bg-gray-50">
                                    <tr>
                                        {["#", "Email", "Nombre", "Fecha inicio", "País", "Plan", "Estado", "Último pago", "Nivel", "Gestionar"].map((h) => (
                                            <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {paginatedUsers.map((u) => {
                                        const isAtRisk = atRiskIds.has(u.id);
                                        return (
                                            <tr key={u.id} className={`transition-colors ${isAtRisk ? "bg-amber-50 hover:bg-amber-100" : "hover:bg-gray-50"}`}>
                                                <td className="px-4 py-3 text-xs text-gray-400">{u.id}</td>
                                                <td className="px-4 py-3"><CopyEmail email={u.email} /></td>
                                                <td className="px-4 py-3 text-sm font-semibold text-gray-800 whitespace-nowrap">
                                                    {isAtRisk && <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 mr-1.5 mb-0.5" title="Sin pago en más de 30 días" />}
                                                    {u.full_name}
                                                </td>
                                                <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{fmtDia(u.inscription_date)}</td>
                                                <td className="px-4 py-3 text-sm text-gray-600">{u.country}</td>
                                                <td className="px-4 py-3"><PlanBadge plan={u.plan} /></td>
                                                <td className="px-4 py-3">
                                                    <SelectorDeEstado valor={u.status} deshabilitado={guardando.has(u.id)} onCambio={(v) => handleStatusChange(u, v)} />
                                                </td>
                                                <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{fmtDateTimePT(u.last_payment_date)}</td>
                                                <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{nivelLabel(u.level)}</td>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <Link href={`/admin/busqueda?q=${encodeURIComponent(u.email)}`} className="text-xs font-medium text-falu-red-700 hover:text-falu-red-800 transition">Ver detalle →</Link>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Móvil */}
                        <div className="md:hidden flex flex-col gap-3 p-3">
                            {paginatedUsers.map((u) => {
                                const isAtRisk = atRiskIds.has(u.id);
                                return (
                                    <div key={u.id} className={`rounded-2xl border p-4 ${isAtRisk ? "bg-amber-50 border-amber-200" : "bg-white border-gray-100"}`}>
                                        <div className="flex items-start justify-between gap-2 mb-2">
                                            <div className="min-w-0">
                                                <p className="text-sm font-semibold text-gray-800">
                                                    {isAtRisk && <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 mr-1.5 mb-0.5" />}
                                                    {u.full_name}
                                                </p>
                                                <CopyEmail email={u.email} />
                                            </div>
                                            <SelectorDeEstado valor={u.status} deshabilitado={guardando.has(u.id)} onCambio={(v) => handleStatusChange(u, v)} className="flex-shrink-0" />
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2 mt-2">
                                            <PlanBadge plan={u.plan} />
                                            <span className="text-xs text-gray-600 bg-white px-2 py-1 rounded-lg border border-gray-100">{u.country}</span>
                                            {u.level && <span className="text-xs text-gray-600 bg-white px-2 py-1 rounded-lg border border-gray-100">{nivelLabel(u.level)}</span>}
                                            {u.last_payment_date && (
                                                <span className="text-xs text-gray-400 bg-white px-2 py-1 rounded-lg border border-gray-100">
                                                    Pago: {fmtDateTimePT(u.last_payment_date)}
                                                </span>
                                            )}
                                        </div>
                                        <div className="mt-3 pt-2 border-t border-gray-100">
                                            <Link href={`/admin/busqueda?q=${encodeURIComponent(u.email)}`} className="text-xs font-medium text-falu-red-700 hover:text-falu-red-800 transition">Ver detalle →</Link>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
                <Paginacion pagina={pagina} totalPaginas={totalPaginas} setPagina={setPagina} total={total} />
            </Tarjeta>
        </Pagina>
    );
}
