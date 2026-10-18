"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { ErrorState } from "../_utils/ErrorState";
import { PT, fmtDatePT, fmtMoney } from "../_utils/format";
import { ALL_PLAN_KEYS } from "@/app/lib/plans";
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
    PlanBadge,
    CampoDeBusqueda,
    Pildoras,
    usePaginacion,
    Paginacion,
    descargarCSV,
    ICONO_DESCARGA,
} from "../_ui";
dayjs.extend(utc);
dayjs.extend(timezone);

interface RecurringUser {
    email: string;
    full_name: string;
    country: string;
    plan: string;
    payment_count: number;
    total_paid: number;
    first_payment: string;
    last_payment: string;
}

const PAGE_SIZE = 15;
const OPCIONES_DE_PLAN = [
    { valor: "all", label: "Todos" },
    ...ALL_PLAN_KEYS.map((p) => ({ valor: p as string, label: p })),
];

export default function RecurrentesPage() {
    const [users, setUsers] = useState<RecurringUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [planFilter, setPlanFilter] = useState("all");
    const [sortBy, setSortBy] = useState<"payment_count" | "total_paid" | "last_payment">("payment_count");
    const [loadError, setLoadError] = useState<string | null>(null);
    const router = useRouter();

    const loadData = useCallback(async () => {
        setLoadError(null);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) { router.push("/admin/login"); return; }
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/admin/recurrentes`, {
                headers: { Authorization: `Bearer ${session.access_token}` },
            });
            if (!response.ok) throw new Error(`Error del servidor (${response.status})`);
            const result = await response.json();
            if (Array.isArray(result)) setUsers(result);
        } catch (e) {
            setLoadError(e instanceof Error ? e.message : "Error de red");
        } finally {
            setLoading(false);
        }
    }, [router]);

    useEffect(() => { loadData(); }, [loadData]);

    const filtered = users
        .filter((u) => {
            const q = search.toLowerCase();
            const matchSearch = !q || u.full_name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
            const matchPlan = planFilter === "all" || u.plan === planFilter;
            return matchSearch && matchPlan;
        })
        .sort((a, b) => {
            if (sortBy === "total_paid") return b.total_paid - a.total_paid;
            if (sortBy === "last_payment") return new Date(b.last_payment).getTime() - new Date(a.last_payment).getTime();
            return b.payment_count - a.payment_count;
        });

    const { pagina, setPagina, totalPaginas, visibles: paginated, total } = usePaginacion(
        filtered,
        PAGE_SIZE,
        JSON.stringify({ search, planFilter, sortBy }),
    );

    if (loadError) return <ErrorState message={loadError} onRetry={loadData} />;
    if (loading) return <Cargando />;

    const totalRevenue = users.reduce((sum, u) => sum + u.total_paid, 0);
    const totalPayments = users.reduce((sum, u) => sum + u.payment_count, 0);

    function exportCSV() {
        descargarCSV(
            `recurrentes_${dayjs().format("YYYY-MM-DD")}.csv`,
            ["Nombre", "Email", "País", "Plan", "Pagos", "Total pagado (USD)", "Primer pago", "Último pago"],
            filtered.map((u) => [
                u.full_name,
                u.email,
                u.country,
                u.plan,
                u.payment_count,
                (u.total_paid / 100).toFixed(2),
                dayjs.utc(u.first_payment).tz(PT).format("YYYY-MM-DD"),
                dayjs.utc(u.last_payment).tz(PT).format("YYYY-MM-DD"),
            ]),
        );
    }

    const filtrado = !!search || planFilter !== "all";

    return (
        <Pagina>
            <EncabezadoDePagina
                titulo="Usuarios Recurrentes"
                descripcion="Usuarios con más de un pago registrado"
                acciones={filtered.length > 0 && (
                    <Boton variante="secundario" icono={ICONO_DESCARGA} onClick={exportCSV}>Exportar CSV</Boton>
                )}
            />

            <FilaDeNumeros columnas={3}>
                <TarjetaDeNumero etiqueta="Usuarios recurrentes" valor={users.length} acento="azul"
                    icono={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>}
                />
                <TarjetaDeNumero etiqueta="Pagos totales" valor={totalPayments} acento="violeta"
                    icono={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
                />
                <TarjetaDeNumero etiqueta="Revenue recurrentes" valor={fmtMoney(totalRevenue)} acento="verde"
                    icono={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" /></svg>}
                />
            </FilaDeNumeros>

            {/* Filtros */}
            <div className="flex flex-col lg:flex-row lg:items-center gap-3 mb-5">
                <div className="flex sm:max-w-xs w-full">
                    <CampoDeBusqueda valor={search} onCambio={setSearch} placeholder="Nombre o correo…" />
                </div>
                <Pildoras opciones={OPCIONES_DE_PLAN} valor={planFilter} onCambio={setPlanFilter} />
                <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                    aria-label="Ordenar"
                    className="text-sm bg-white border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-falu-red-200 text-gray-600 lg:ml-auto"
                >
                    <option value="payment_count">Más pagos</option>
                    <option value="total_paid">Mayor LTV</option>
                    <option value="last_payment">Último pago</option>
                </select>
            </div>

            {total > 0 && (
                <p className="text-xs text-gray-400 mb-3 px-1">
                    <strong className="text-gray-600">{(pagina - 1) * PAGE_SIZE + 1}–{Math.min(pagina * PAGE_SIZE, total)}</strong> de <strong className="text-gray-600">{total}</strong> registros
                    {filtrado && <span className="ml-1 text-gray-500">(filtrado)</span>}
                </p>
            )}

            <Tarjeta sinRelleno>
                {total === 0 ? (
                    <Vacio>
                        {users.length === 0 ? "No hay usuarios con más de un pago registrado aún." : "Sin resultados para los filtros aplicados."}
                    </Vacio>
                ) : (
                    <>
                        {/* Escritorio */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-100">
                                <thead className="bg-gray-50">
                                    <tr>
                                        {["Nombre", "Email", "País", "Plan", "Pagos", "Total pagado", "Primer pago", "Último pago", "Gestionar"].map((h) => (
                                            <th key={h} className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {paginated.map((u) => (
                                        <tr key={u.email} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-5 py-3 text-sm font-semibold text-gray-800 whitespace-nowrap">{u.full_name}</td>
                                            <td className="px-5 py-3 text-sm text-gray-500">{u.email}</td>
                                            <td className="px-5 py-3 text-sm text-gray-600">{u.country}</td>
                                            <td className="px-5 py-3"><PlanBadge plan={u.plan} /></td>
                                            <td className="px-5 py-3"><Chip tono="naranja">{u.payment_count}×</Chip></td>
                                            <td className="px-5 py-3 text-sm font-bold text-gray-800 whitespace-nowrap">{fmtMoney(u.total_paid)}</td>
                                            <td className="px-5 py-3 text-xs text-gray-400 whitespace-nowrap">{fmtDatePT(u.first_payment)}</td>
                                            <td className="px-5 py-3 text-xs text-gray-400 whitespace-nowrap">{fmtDatePT(u.last_payment)}</td>
                                            <td className="px-5 py-3 whitespace-nowrap">
                                                <Link href={`/admin/busqueda?q=${encodeURIComponent(u.email)}`} className="text-xs font-medium text-falu-red-700 hover:text-falu-red-800 transition">Ver detalle →</Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Móvil */}
                        <div className="md:hidden flex flex-col gap-3 p-3">
                            {paginated.map((u) => (
                                <div key={u.email} className="bg-white rounded-2xl border border-gray-100 p-4">
                                    <div className="flex items-start justify-between gap-2 mb-3">
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-gray-800">{u.full_name}</p>
                                            <p className="text-xs text-gray-400 mt-0.5 truncate">{u.email}</p>
                                        </div>
                                        <Chip tono="naranja">{u.payment_count}×</Chip>
                                    </div>
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <PlanBadge plan={u.plan} />
                                            <span className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-lg">{u.country}</span>
                                        </div>
                                        <span className="text-sm font-bold text-gray-800">{fmtMoney(u.total_paid)}</span>
                                    </div>
                                    <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-xs text-gray-400">
                                        <span>Desde: {fmtDatePT(u.first_payment)}</span>
                                        <span>·</span>
                                        <span>Último: {fmtDatePT(u.last_payment)}</span>
                                    </div>
                                    <div className="mt-3 pt-2 border-t border-gray-100">
                                        <Link href={`/admin/busqueda?q=${encodeURIComponent(u.email)}`} className="text-xs font-medium text-falu-red-700 hover:text-falu-red-800 transition">Ver detalle →</Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
                <Paginacion pagina={pagina} totalPaginas={totalPaginas} setPagina={setPagina} total={total} />
            </Tarjeta>
        </Pagina>
    );
}
