"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { ErrorState } from "../_utils/ErrorState";
import { PT, fmtDatePT } from "../_utils/format";
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
    EstadoDeSuscripcion,
    CampoDeBusqueda,
    Pildoras,
    usePaginacion,
    Paginacion,
    descargarCSV,
    ICONO_DESCARGA,
    nivelLabel,
    useParametroDeUrl,
    EscribirCorreo,
    PLANTILLAS,
    type Plantilla,
} from "../_ui";
dayjs.extend(utc);
dayjs.extend(timezone);

interface NoRenewUser {
    id: number;
    email: string;
    full_name: string;
    country: string;
    plan: string;
    level: string;
    subscription_status: string | null;
    cancel_at_period_end: boolean | null;
    current_period_end: string | null;
    last_payment_date: string | null;
}

/* ── Tipo de no renovado ────────────────────────────────────────────────── */

const TIPOS = ["todos", "pago-fallido", "cancela-pronto", "cancelados", "vencidos"] as const;
type Tipo = (typeof TIPOS)[number];

const ETIQUETA_DE_TIPO: Record<Tipo, string> = {
    "todos": "Todos",
    "pago-fallido": "Pago fallido",
    "cancela-pronto": "Cancela al fin del periodo",
    "cancelados": "Cancelados",
    "vencidos": "Vencidos",
};

const esCancelada = (s: string | null) => s === "canceled" || s === "cancelled";

/**
 * Cada alumno cae en UN tipo, con este orden de precedencia: cancelada → pago
 * fallido → cancela al fin del periodo → vencido. Un past_due que además tiene
 * cancel_at_period_end se cuenta como "Pago fallido", que es lo más urgente.
 * Puede no caer en ninguno (solo sale en "Todos").
 */
function tipoDe(u: NoRenewUser, ahora: number): Exclude<Tipo, "todos"> | null {
    if (esCancelada(u.subscription_status)) return "cancelados";
    if (u.subscription_status === "past_due") return "pago-fallido";
    if (u.cancel_at_period_end) return "cancela-pronto";
    if (u.current_period_end && new Date(u.current_period_end).getTime() < ahora) return "vencidos";
    return null;
}

/** `?tipo=` de la URL al cargar, para que el Inicio pueda enlazar a un tipo. */
function tipoDeLaUrl(): Tipo {
    if (typeof window === "undefined") return "todos";
    const t = new URLSearchParams(window.location.search).get("tipo");
    return (TIPOS as readonly string[]).includes(t ?? "") ? (t as Tipo) : "todos";
}

function ChipFinDePeriodo() {
    return (
        <span title="Programada para cancelarse al fin del periodo">
            <Chip tono="ambar">Fin de periodo</Chip>
        </span>
    );
}

const PAGE_SIZE = 15;

/** La plantilla del correo según por qué no renovó. */
function plantillaPara(t: Tipo | null): Plantilla {
    if (t === "pago-fallido") return PLANTILLAS.pagosFallidos;
    if (t === "cancela-pronto") return PLANTILLAS.cancelanPronto;
    if (t === "cancelados" || t === "vencidos") return PLANTILLAS.recuperar;
    return PLANTILLAS.general;
}
const OPCIONES_DE_PLAN = [
    { valor: "all", label: "Todos los planes" },
    ...ALL_PLAN_KEYS.map((p) => ({ valor: p as string, label: p })),
];

export default function NoRenovadosPage() {
    const [users, setUsers] = useState<NoRenewUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [planFilter, setPlanFilter] = useState("all");
    // Inicializador perezoso: en el primer render se pinta <Cargando/>, así que leer
    // la URL aquí no descuadra la hidratación.
    const [tipo, setTipoState] = useState<Tipo>(tipoDeLaUrl);
    // Al llegar por un enlace del Inicio, el inicializador aún lee la URL anterior.
    useParametroDeUrl("tipo", (t) => { if ((TIPOS as readonly string[]).includes(t ?? "")) setTipoState(t as Tipo); });
    const [ahora] = useState(() => Date.now());
    const [loadError, setLoadError] = useState<string | null>(null);
    const [escribirA, setEscribirA] = useState<{ alumnos: { email: string; nombre: string }[]; plantilla: Plantilla } | null>(null);
    const escribirAUno = (u: NoRenewUser) =>
        setEscribirA({ alumnos: [{ email: u.email, nombre: u.full_name }], plantilla: plantillaPara(tipoDe(u, ahora)) });
    const router = useRouter();

    const setTipo = (t: Tipo) => {
        setTipoState(t);
        try {
            const url = new URL(window.location.href);
            if (t === "todos") url.searchParams.delete("tipo");
            else url.searchParams.set("tipo", t);
            window.history.replaceState(window.history.state, "", url.toString());
        } catch { /* la URL es solo una comodidad */ }
    };

    const loadData = useCallback(async () => {
        setLoadError(null);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) { router.push("/admin/login"); return; }
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/admin/no-renovados`, {
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

    // Búsqueda y plan primero; el tipo se aplica después para que las píldoras
    // cuenten sobre lo que ya filtraron los otros dos.
    const filtradosSinTipo = users.filter((u) => {
        const q = search.toLowerCase();
        const matchSearch = !q || (u.full_name ?? "").toLowerCase().includes(q) || (u.email ?? "").toLowerCase().includes(q);
        const matchPlan = planFilter === "all" || u.plan === planFilter;
        return matchSearch && matchPlan;
    });

    const cuentas: Record<Tipo, number> = { "todos": filtradosSinTipo.length, "pago-fallido": 0, "cancela-pronto": 0, "cancelados": 0, "vencidos": 0 };
    for (const u of filtradosSinTipo) {
        const t = tipoDe(u, ahora);
        if (t) cuentas[t]++;
    }

    const filtered = filtradosSinTipo
        .filter((u) => tipo === "todos" || tipoDe(u, ahora) === tipo)
        .sort((a, b) => {
            const ta = a.current_period_end ? new Date(a.current_period_end).getTime() : 0;
            const tb = b.current_period_end ? new Date(b.current_period_end).getTime() : 0;
            return ta - tb;
        });

    const { pagina, setPagina, totalPaginas, visibles: paginated, total } = usePaginacion(
        filtered,
        PAGE_SIZE,
        JSON.stringify({ search, planFilter, tipo }),
    );

    if (loadError) return <ErrorState message={loadError} onRetry={loadData} />;
    if (loading) return <Cargando />;

    const flaggedCount = users.filter((u) => u.cancel_at_period_end).length;

    function exportCSV() {
        descargarCSV(
            `no_renovados_${dayjs().format("YYYY-MM-DD")}.csv`,
            ["Nombre", "Email", "País", "Plan", "Nivel", "Estado", "Cancela al final", "Fin de periodo", "Último pago"],
            filtered.map((u) => [
                u.full_name,
                u.email,
                u.country,
                u.plan,
                u.level,
                u.subscription_status ?? "",
                u.cancel_at_period_end ? "Sí" : "No",
                u.current_period_end ? dayjs.utc(u.current_period_end).tz(PT).format("YYYY-MM-DD") : "",
                u.last_payment_date ? dayjs.utc(u.last_payment_date).tz(PT).format("YYYY-MM-DD") : "",
            ]),
        );
    }

    const filtrado = !!search || planFilter !== "all" || tipo !== "todos";
    const opcionesDeTipo = TIPOS.map((t) => ({ valor: t, label: ETIQUETA_DE_TIPO[t], cuenta: cuentas[t] }));

    return (
        <Pagina>
            <EncabezadoDePagina
                titulo="No renovados"
                descripcion="Suscriptores que cancelaron o no renovaron su suscripción"
                acciones={filtered.length > 0 && (
                    <>
                        <Boton
                            onClick={() => setEscribirA({ alumnos: filtered.map((u) => ({ email: u.email, nombre: u.full_name })), plantilla: plantillaPara(tipo === "todos" ? null : tipo) })}
                        >
                            {filtered.length === 1 ? "Escribirle" : `Escribir a ${filtered.length}`}
                        </Boton>
                        <Boton variante="secundario" icono={ICONO_DESCARGA} onClick={exportCSV}>Exportar CSV</Boton>
                    </>
                )}
            />

            <FilaDeNumeros columnas={2}>
                <TarjetaDeNumero etiqueta="No renovados" valor={users.length} acento="rojo"
                    icono={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>}
                />
                <TarjetaDeNumero etiqueta="Cancelan al fin del periodo" valor={flaggedCount} acento="ambar"
                    icono={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                />
            </FilaDeNumeros>

            {/* Filtros */}
            <div className="flex flex-col gap-3 mb-5">
                <Pildoras opciones={opcionesDeTipo} valor={tipo} onCambio={setTipo} />
                <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                    <div className="flex sm:max-w-xs w-full">
                        <CampoDeBusqueda valor={search} onCambio={setSearch} placeholder="Nombre o correo…" />
                    </div>
                    <Pildoras opciones={OPCIONES_DE_PLAN} valor={planFilter} onCambio={setPlanFilter} />
                </div>
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
                        {users.length === 0 ? "No hay suscriptores no renovados por el momento." : "Sin resultados para los filtros aplicados."}
                    </Vacio>
                ) : (
                    <>
                        {/* Escritorio */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-100">
                                <thead className="bg-gray-50">
                                    <tr>
                                        {["Nombre", "Email", "País", "Plan", "Nivel", "Estado", "Fin de periodo", "Último pago", ""].map((h) => (
                                            <th key={h} className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {paginated.map((u) => (
                                        <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-5 py-3 text-sm font-semibold text-gray-800 whitespace-nowrap">{u.full_name}</td>
                                            <td className="px-5 py-3 text-sm text-gray-500">{u.email}</td>
                                            <td className="px-5 py-3 text-sm text-gray-600">{u.country}</td>
                                            <td className="px-5 py-3"><PlanBadge plan={u.plan} /></td>
                                            <td className="px-5 py-3 text-sm text-gray-600 whitespace-nowrap">{nivelLabel(u.level)}</td>
                                            <td className="px-5 py-3">
                                                <div className="flex items-center gap-1.5">
                                                    <EstadoDeSuscripcion estado={u.subscription_status} />
                                                    {u.cancel_at_period_end && <ChipFinDePeriodo />}
                                                </div>
                                            </td>
                                            <td className="px-5 py-3 text-xs text-gray-400 whitespace-nowrap">{fmtDatePT(u.current_period_end)}</td>
                                            <td className="px-5 py-3 text-xs text-gray-400 whitespace-nowrap">{fmtDatePT(u.last_payment_date)}</td>
                                            <td className="px-5 py-3 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <button type="button" onClick={() => escribirAUno(u)} className="text-xs font-medium text-falu-red-700 hover:text-falu-red-800 transition cursor-pointer">Escribir</button>
                                                    <Link href={`/admin/busqueda?q=${encodeURIComponent(u.email)}`} className="text-xs font-medium text-gray-500 hover:text-gray-800 transition">Gestionar →</Link>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Móvil */}
                        <div className="md:hidden flex flex-col gap-3 p-3">
                            {paginated.map((u) => (
                                <div key={u.id} className="bg-white rounded-2xl border border-gray-100 p-4">
                                    <div className="flex items-start justify-between gap-2 mb-3">
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-gray-800">{u.full_name}</p>
                                            <p className="text-xs text-gray-400 mt-0.5 truncate">{u.email}</p>
                                        </div>
                                        <EstadoDeSuscripcion estado={u.subscription_status} />
                                    </div>
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <PlanBadge plan={u.plan} />
                                            <span className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-lg">{u.country}</span>
                                        </div>
                                        {u.cancel_at_period_end && <ChipFinDePeriodo />}
                                    </div>
                                    <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-xs text-gray-400">
                                        <span>Fin: {fmtDatePT(u.current_period_end)}</span>
                                        <span>·</span>
                                        <span>Último pago: {fmtDatePT(u.last_payment_date)}</span>
                                    </div>
                                    <div className="mt-3 pt-2 border-t border-gray-100 flex items-center gap-4">
                                        <button type="button" onClick={() => escribirAUno(u)} className="text-xs font-medium text-falu-red-700 hover:text-falu-red-800 transition cursor-pointer">Escribir</button>
                                        <Link href={`/admin/busqueda?q=${encodeURIComponent(u.email)}`} className="text-xs font-medium text-gray-500 hover:text-gray-800 transition">Gestionar →</Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
                <Paginacion pagina={pagina} totalPaginas={totalPaginas} setPagina={setPagina} total={total} />
            </Tarjeta>
            {escribirA && (
                <EscribirCorreo
                    destino={{ tipo: "alumnos", alumnos: escribirA.alumnos }}
                    plantilla={escribirA.plantilla}
                    onCerrar={() => setEscribirA(null)}
                />
            )}
        </Pagina>
    );
}
