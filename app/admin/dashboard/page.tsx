"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabaseClient";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { planColor } from "../_utils/planColors";
import { ErrorState } from "../_utils/ErrorState";
dayjs.extend(utc);
dayjs.extend(timezone);

const PT = "America/Los_Angeles";
const MONTH_NAMES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

function formatMonth(key: string) {
    const [year, month] = key.split("-");
    return `${MONTH_NAMES[parseInt(month, 10) - 1]} ${year}`;
}

// La clave viene en dos formas y significan cosas distintas (ver `cohortKey` en
// el backend): "YYYY-MM-DD" es una COHORTE de verdad —una tanda que el negocio
// abrió— y "YYYY-MM" es un mes de compra de los planes que NO van por cohorte,
// como Essential, que entra el día que paga.
//
// ⚠️ Se rotulan distinto A PROPÓSITO. Enseñar "sep 2026" al lado de "21 sep 2026"
// sin decir por qué invita a leerlos como lo mismo, y son justo lo contrario: uno
// es un grupo que empezó junto y el otro un montón de gente que no tiene tanda.
function formatCohort(key: string) {
    if (key === "Sin fecha") return key;
    if (/^\d{4}-\d{2}$/.test(key)) {
        return `${dayjs.utc(`${key}-01`).format("MMM YYYY")} · sin cohorte`;
    }
    return dayjs.utc(key).format("DD MMM YYYY");
}

function dollars(cents: number) {
    return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function dollarsK(cents: number) {
    const v = cents / 100;
    if (v >= 1000) return `$${(v / 1000).toFixed(1)}k`;
    return `$${v.toFixed(0)}`;
}

interface InicioData {
    mrr: {
        total: number;
        arr: number;
        activeSubscribers: number;
        byPlan: Record<string, { count: number; mrr: number; unitMonthly: number }>;
    };
    activeUsers: {
        total: number;
        byPlan: Record<string, number>;
    };
    revenueTrend: { month: string; amount: number; count: number }[];
    churnByCohort: {
        cohort: string;
        total: number;
        active: number;
        canceled: number;
        scheduled: number;
        pastDue: number;
        churnRate: number;
    }[];
    activity: {
        payments: { id: string | number; created_at: string; amount: number; plan: string; full_name: string; email: string }[];
        leads: { id: string; created_at: string; full_name: string; email: string; country: string; english_level: string; contacted: boolean }[];
        cancellations: { id: number; updated_at: string; full_name: string; email: string; plan: string; kind: "canceled" | "past_due" | "scheduled"; current_period_end: string | null }[];
    };
}

function StatCard({
    label, value, sub, icon, accent = "text-falu-red-600", bg = "bg-falu-red-50",
}: {
    label: string; value: string | number; sub?: string;
    icon: React.ReactNode; accent?: string; bg?: string;
}) {
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5 flex items-start gap-3 sm:gap-4 hover:shadow-md transition-shadow">
            <div className={`flex-shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-xl ${bg} flex items-center justify-center ${accent}`}>{icon}</div>
            <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide leading-tight">{label}</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-800 mt-0.5 truncate">{value}</p>
                {sub && <p className="text-xs text-gray-400 mt-0.5 truncate">{sub}</p>}
            </div>
        </div>
    );
}

// Mini gráfico de barras para la tendencia. Sin libs externas; Tailwind puro.
// Separado en dos rows (barras + labels) para que el % de altura resuelva
// directamente contra el contenedor h-32, sin flex anidados que rompan el cálculo.
function RevenueTrendChart({ data }: { data: InicioData["revenueTrend"] }) {
    const max = Math.max(1, ...data.map((d) => d.amount));
    return (
        <div>
            <div className="flex items-end gap-2 h-32">
                {data.map((d) => {
                    const pct = d.amount > 0 ? Math.max(4, (d.amount / max) * 100) : 0;
                    return (
                        <div
                            key={d.month}
                            className="flex-1 rounded-t-md bg-gradient-to-t from-falu-red-500 to-yellow-orange-400 transition-all hover:opacity-90"
                            style={{ height: `${pct}%` }}
                            title={`${formatMonth(d.month)}: ${dollars(d.amount)} (${d.count} pagos)`}
                        />
                    );
                })}
            </div>
            <div className="flex gap-2 mt-2">
                {data.map((d) => (
                    <div key={d.month} className="flex-1 text-center min-w-0">
                        <p className="text-[11px] text-gray-700 font-semibold truncate">{dollarsK(d.amount)}</p>
                        <p className="text-[10px] text-gray-400 truncate">{formatMonth(d.month)}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function Inicio() {
    const [data, setData] = useState<InicioData | null>(null);
    const [loadError, setLoadError] = useState<string | null>(null);
    const router = useRouter();

    const load = useCallback(async () => {
        setLoadError(null);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) { router.push("/admin/login"); return; }
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/admin/inicio`, {
                headers: { Authorization: `Bearer ${session.access_token}` },
            });
            if (!res.ok) throw new Error(`Error del servidor (${res.status})`);
            setData(await res.json());
        } catch (e) {
            setLoadError(e instanceof Error ? e.message : "Error de red");
        }
    }, [router]);

    useEffect(() => { load(); }, [load]);

    if (loadError) return <ErrorState message={loadError} onRetry={load} />;

    if (!data) return (
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

    const { mrr, activeUsers, revenueTrend, churnByCohort, activity } = data;

    // Para el global churn rate: total cancelados / total con suscripción
    const globalChurn = (() => {
        const tot = churnByCohort.reduce((a, c) => a + c.total, 0);
        const can = churnByCohort.reduce((a, c) => a + c.canceled, 0);
        return tot > 0 ? parseFloat(((can / tot) * 100).toFixed(1)) : 0;
    })();

    const planEntries = Object.entries(mrr.byPlan).sort((a, b) => b[1].mrr - a[1].mrr);

    return (
        <div className="p-4 md:p-8 max-w-screen-xl mx-auto">
            {/* Header */}
            <div className="mb-7">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Inicio</h1>
                <p className="text-sm text-gray-400 mt-1">Resumen del negocio y actividad reciente</p>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <StatCard label="MRR" value={dollars(mrr.total)}
                    sub="cobro por ciclo (28d)"
                    icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" /></svg>}
                />
                <StatCard label="ARR proyectado" value={dollars(mrr.arr)}
                    sub="13 ciclos × revenue actual"
                    bg="bg-violet-50" accent="text-violet-600"
                    icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}
                />
                <StatCard label="Usuarios activos" value={activeUsers.total}
                    sub={`${mrr.activeSubscribers} con suscripción`}
                    bg="bg-emerald-50" accent="text-emerald-600"
                    icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-5-3.87M9 20H4v-2a4 4 0 015-3.87m6-4a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
                />
                <StatCard label="Churn global" value={`${globalChurn}%`}
                    sub={`${churnByCohort.reduce((a, c) => a + c.canceled, 0)} cancelados`}
                    bg="bg-amber-50" accent="text-amber-600"
                    icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6" /></svg>}
                />
            </div>

            {/* Trend + MRR breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-sm font-semibold text-gray-700">Revenue real · últimos 6 meses</h3>
                            <p className="text-xs text-gray-400 mt-0.5">Pagos recibidos (no proyectados) por mes en PT</p>
                        </div>
                    </div>
                    <RevenueTrendChart data={revenueTrend} />
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                    <h3 className="text-sm font-semibold text-gray-700 mb-1">MRR por plan</h3>
                    <p className="text-xs text-gray-400 mb-4">Solo planes recurrentes</p>
                    {planEntries.length === 0 ? (
                        <p className="text-xs text-gray-400">Sin suscriptores activos</p>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {planEntries.map(([plan, s]) => (
                                <div key={plan}>
                                    <div className="flex items-center justify-between mb-1">
                                        <div className="flex items-center gap-2">
                                            <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${planColor(plan)}`} />
                                            <span className="text-sm font-medium text-gray-700">{plan}</span>
                                        </div>
                                        <span className="text-sm font-semibold text-gray-800">{dollars(s.mrr)}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-[11px] text-gray-400">
                                        <span>{s.count} × {dollars(s.unitMonthly)}/ciclo</span>
                                        <span>{mrr.total > 0 ? ((s.mrr / mrr.total) * 100).toFixed(0) : 0}%</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Usuarios activos por plan (incluye one-time payments) */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6">
                <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-semibold text-gray-700">Usuarios activos por plan</h3>
                    <span className="text-xs text-gray-400">{activeUsers.total} total</span>
                </div>
                <p className="text-xs text-gray-400 mb-4">Todos los alumnos con estado activo, incluye pagos únicos (Personalizado, Speaking)</p>
                {activeUsers.total === 0 ? (
                    <p className="text-xs text-gray-400">Sin usuarios activos</p>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {Object.entries(activeUsers.byPlan)
                            .sort((a, b) => b[1] - a[1])
                            .map(([plan, count]) => (
                                <div key={plan} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                                    <div className="flex items-center gap-1.5 mb-1">
                                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${planColor(plan)}`} />
                                        <span className="text-xs font-medium text-gray-600 truncate">{plan}</span>
                                    </div>
                                    <p className="text-xl font-bold text-gray-800">{count}</p>
                                    <p className="text-[10px] text-gray-400 mt-0.5">
                                        {activeUsers.total > 0 ? ((count / activeUsers.total) * 100).toFixed(0) : 0}% del total
                                    </p>
                                </div>
                            ))}
                    </div>
                )}
            </div>

            {/* Churn por cohorte */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
                <div className="px-5 py-4 border-b border-gray-50">
                    <h3 className="text-sm font-semibold text-gray-700">Churn por cohorte</h3>
                    <p className="text-xs text-gray-400 mt-0.5">% de cancelaciones efectivas sobre el total de cada fecha de inicio</p>
                </div>
                {churnByCohort.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-8">Sin cohortes con suscripciones registradas</p>
                ) : (
                    <div className="overflow-auto max-h-80">
                        <table className="min-w-full">
                            <thead className="sticky top-0 bg-gray-50">
                                <tr>
                                    <th className="px-5 py-2.5 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Cohorte</th>
                                    <th className="px-5 py-2.5 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Total</th>
                                    <th className="px-5 py-2.5 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Activos</th>
                                    <th className="px-5 py-2.5 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Programadas</th>
                                    <th className="px-5 py-2.5 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Past due</th>
                                    <th className="px-5 py-2.5 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Canceladas</th>
                                    <th className="px-5 py-2.5 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Churn</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {churnByCohort.map((c) => (
                                    <tr key={c.cohort} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-5 py-3 text-sm font-medium text-gray-700 whitespace-nowrap">{formatCohort(c.cohort)}</td>
                                        <td className="px-5 py-3 text-sm text-gray-700 font-semibold">{c.total}</td>
                                        <td className="px-5 py-3 text-sm text-emerald-600">{c.active}</td>
                                        <td className="px-5 py-3 text-sm text-amber-600">{c.scheduled}</td>
                                        <td className="px-5 py-3 text-sm text-orange-600">{c.pastDue}</td>
                                        <td className="px-5 py-3 text-sm text-red-600">{c.canceled}</td>
                                        <td className="px-5 py-3">
                                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
                                                c.churnRate >= 50 ? "bg-red-50 text-red-700"
                                                : c.churnRate >= 20 ? "bg-amber-50 text-amber-700"
                                                : "bg-emerald-50 text-emerald-700"
                                            }`}>
                                                {c.churnRate}%
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Actividad reciente: 3 columnas */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Últimos pagos */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-gray-700">Últimos pagos</h3>
                        <Link href="/admin/pagos" className="text-[11px] font-medium text-falu-red-700 hover:text-falu-red-800 transition">Ver todos →</Link>
                    </div>
                    {activity.payments.length === 0 ? (
                        <p className="text-sm text-gray-400 text-center py-8">Sin pagos recientes</p>
                    ) : (
                        <ul className="divide-y divide-gray-50">
                            {activity.payments.map((p) => (
                                <li key={p.id} className="px-5 py-3 hover:bg-gray-50 transition-colors">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-medium text-gray-800 truncate">{p.full_name || "—"}</p>
                                            <p className="text-[11px] text-gray-400 truncate">{p.email}</p>
                                            <div className="flex items-center gap-1.5 mt-1">
                                                <span className={`w-1.5 h-1.5 rounded-full ${planColor(p.plan)}`} />
                                                <span className="text-[11px] text-gray-500">{p.plan}</span>
                                            </div>
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            <p className="text-sm font-semibold text-gray-800">{dollars(p.amount)}</p>
                                            <p className="text-[10px] text-gray-400 mt-0.5">{dayjs.utc(p.created_at).tz(PT).format("DD MMM h:mm a")}</p>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Últimos leads */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-gray-700">Últimos leads</h3>
                        <Link href="/admin/marketing" className="text-[11px] font-medium text-falu-red-700 hover:text-falu-red-800 transition">Ver todos →</Link>
                    </div>
                    {activity.leads.length === 0 ? (
                        <p className="text-sm text-gray-400 text-center py-8">Sin leads recientes</p>
                    ) : (
                        <ul className="divide-y divide-gray-50">
                            {activity.leads.map((l) => (
                                <li key={l.id} className="px-5 py-3 hover:bg-gray-50 transition-colors">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-medium text-gray-800 truncate">{l.full_name || "—"}</p>
                                            <p className="text-[11px] text-gray-400 truncate">{l.email}</p>
                                            <p className="text-[11px] text-gray-500 mt-1 truncate">{l.country} · {l.english_level}</p>
                                        </div>
                                        <div className="text-right flex-shrink-0 flex flex-col items-end gap-1">
                                            {l.contacted ? (
                                                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-teal-50 text-teal-700">Contactado</span>
                                            ) : (
                                                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-gray-50 text-gray-500">Nuevo</span>
                                            )}
                                            <p className="text-[10px] text-gray-400">{dayjs.utc(l.created_at).tz(PT).format("DD MMM")}</p>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Últimas cancelaciones */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-gray-700">Cancelaciones recientes</h3>
                        <Link href="/admin/no-renovados" className="text-[11px] font-medium text-falu-red-700 hover:text-falu-red-800 transition">Ver todas →</Link>
                    </div>
                    {activity.cancellations.length === 0 ? (
                        <p className="text-sm text-gray-400 text-center py-8">Sin cancelaciones recientes</p>
                    ) : (
                        <ul className="divide-y divide-gray-50">
                            {activity.cancellations.map((c) => {
                                const kindMap = {
                                    canceled: { label: "Cancelada", cls: "bg-red-50 text-red-700" },
                                    past_due: { label: "Past due", cls: "bg-orange-50 text-orange-700" },
                                    scheduled: { label: "Programada", cls: "bg-amber-50 text-amber-700" },
                                };
                                const k = kindMap[c.kind];
                                return (
                                    <li key={c.id} className="px-5 py-3 hover:bg-gray-50 transition-colors">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-medium text-gray-800 truncate">{c.full_name || "—"}</p>
                                                <p className="text-[11px] text-gray-400 truncate">{c.email}</p>
                                                <div className="flex items-center gap-1.5 mt-1">
                                                    <span className={`w-1.5 h-1.5 rounded-full ${planColor(c.plan)}`} />
                                                    <span className="text-[11px] text-gray-500">{c.plan}</span>
                                                </div>
                                            </div>
                                            <div className="text-right flex-shrink-0 flex flex-col items-end gap-1">
                                                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${k.cls}`}>{k.label}</span>
                                                {c.current_period_end && (
                                                    <p className="text-[10px] text-gray-400">hasta {dayjs.utc(c.current_period_end).tz(PT).format("DD MMM")}</p>
                                                )}
                                            </div>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
}
