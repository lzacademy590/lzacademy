"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import { ErrorState } from "../_utils/ErrorState";
import { planesDeCheckout, planLabel, isSubscriptionPlan, type DiscountPlan } from "@/app/lib/plans";
import { usePlanesDelCatalogo } from "@/app/hooks/usePlanesDelCatalogo";

interface DiscountCode {
    code: string;
    type: "percent" | "fixed";
    value: number;
    plan: DiscountPlan;
    active: boolean;
    expires_at: string | null;
    max_uses: number | null;
    uses: number;
}

// Fila en memoria: datos del código + metadatos de UI (id estable, nuevo, editando).
interface Row extends DiscountCode {
    _id: string;
    _isNew: boolean;
    _editing: boolean;
}

// Opciones de plan para un código (catálogo + "all").
//
// ⚠️ **Se derivan del CATÁLOGO y por eso ya no son constantes de módulo.** Con
// `DISCOUNT_PLAN_OPTIONS` —una lista estática— un plan abierto en el admin de la
// plataforma no aparecía en este desplegable, así que **no se le podía crear un
// código de descuento** aunque fuese de pago único y el backend lo aceptara. Es
// el mismo hueco que tenía el panel de fechas.
const planOptionLabel = (p: DiscountPlan) => (p === "all" ? "Todos los planes" : planLabel(p));

function opcionesDePlan(catalogo: ReturnType<typeof usePlanesDelCatalogo>) {
    const claves: DiscountPlan[] = [
        "all",
        ...planesDeCheckout(catalogo).map((x) => x.key as DiscountPlan),
    ];
    return {
        opciones: claves.map((v) => ({ value: v, label: planOptionLabel(v) })),
        etiquetas: Object.fromEntries(claves.map((v) => [v, planOptionLabel(v)])) as Record<string, string>,
    };
}

// Las suscripciones aún NO aplican descuentos (coincide con el backend,
// discount.service.js → DISCOUNTS_FOR_SUBSCRIPTIONS); se deriva del catálogo.

const uid = () =>
    (typeof crypto !== "undefined" && crypto.randomUUID)
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2);

const emptyCode = (): DiscountCode => ({
    code: "", type: "percent", value: 10, plan: "Personalizado",
    active: true, expires_at: null, max_uses: null, uses: 0,
});

// Campos de datos (sin metadatos _) para comparar y enviar al backend.
const dataOf = (r: Row): DiscountCode => ({
    code: r.code, type: r.type, value: r.value, plan: r.plan,
    active: r.active, expires_at: r.expires_at, max_uses: r.max_uses, uses: r.uses,
});

// Normalización del code idéntica a la que aplica el backend (normalizeCode +
// el handleSave de abajo). Sin esto, "promo10" vs "PROMO10" daban dirty falso.
const normalizeCode = (code?: string) => (code ?? "").trim().toUpperCase();

// Comparación campo por campo (NO usar JSON.stringify: la columna jsonb de Postgres
// reordena las claves al leerlas, así que el string nunca coincidiría con el orden
// local y todo saldría siempre como "sin guardar").
const sameCode = (a?: DiscountCode, b?: DiscountCode): boolean =>
    !!a && !!b &&
    normalizeCode(a.code) === normalizeCode(b.code) &&
    a.type === b.type &&
    Number(a.value) === Number(b.value) &&
    a.plan === b.plan &&
    a.active === b.active &&
    (a.expires_at || null) === (b.expires_at || null) &&
    (a.max_uses ?? null) === (b.max_uses ?? null) &&
    Number(a.uses || 0) === Number(b.uses || 0);

const today = dayjs().format("YYYY-MM-DD");

function statusOf(c: DiscountCode) {
    if (!c.active)
        return { label: "Inactivo", text: "text-gray-500", bg: "bg-gray-100", dot: "bg-gray-400", ring: "ring-gray-200" };
    if (c.expires_at && c.expires_at < today)
        return { label: "Expirado", text: "text-red-600", bg: "bg-red-50", dot: "bg-red-400", ring: "ring-red-200" };
    if (c.max_uses != null && c.uses >= c.max_uses)
        return { label: "Agotado", text: "text-amber-600", bg: "bg-amber-50", dot: "bg-amber-400", ring: "ring-amber-200" };
    return { label: "Activo", text: "text-emerald-700", bg: "bg-emerald-50", dot: "bg-emerald-400", ring: "ring-emerald-200" };
}

const discountSummary = (c: DiscountCode) =>
    c.type === "percent" ? `${c.value}% de descuento` : `$${c.value} de descuento`;

export default function DescuentosPage() {
    // El desplegable de plan sale del catálogo: un plan nuevo tiene que poder
    // recibir su código sin tocar código.
    const catalogoDescuentos = usePlanesDelCatalogo();
    const { opciones: PLAN_OPTIONS, etiquetas: PLAN_LABEL } = useMemo(
        () => opcionesDePlan(catalogoDescuentos),
        [catalogoDescuentos],
    );
    /*
      ⚠️ Qué planes son de pago único sale del CATÁLOGO, no escrito a mano. El aviso
      de abajo decía "hoy, Personalizado y Programa de Fluidez": en cuanto el admin
      abra otro plan de pago único —o cambie el cobro de uno existente, que ahora
      puede— el texto queda desfasado sin que nada falle. Es la misma pantalla que
      ya deriva su desplegable del catálogo. (Revisión del PR #12.)
    */
    const { unicos, recurrentes } = useMemo(() => {
        const lista = planesDeCheckout(catalogoDescuentos);
        return {
            unicos: lista.filter((p) => !p.recurring).map((p) => planLabel(p.key as DiscountPlan)),
            recurrentes: lista.filter((p) => p.recurring).map((p) => planLabel(p.key as DiscountPlan)),
        };
    }, [catalogoDescuentos]);
    const [rows, setRows] = useState<Row[]>([]);
    // Snapshot ordenado de lo último guardado, para detectar cambios y descartar.
    const [saved, setSaved] = useState<{ _id: string; data: DiscountCode }[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<{ ok: boolean; msg: string } | null>(null);
    const router = useRouter();

    const load = useCallback(async () => {
        setLoadError(null);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) { router.push("/admin/login"); return; }
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/admin/discounts`, {
                headers: { Authorization: `Bearer ${session.access_token}` },
            });
            if (!res.ok) throw new Error(`Error del servidor (${res.status})`);
            const data: DiscountCode[] = await res.json();
            const list = (Array.isArray(data) ? data : []).map((c) => ({ _id: uid(), data: c }));
            setSaved(list);
            setRows(list.map((s) => ({ ...s.data, _id: s._id, _isNew: false, _editing: false })));
        } catch (e) {
            setLoadError(e instanceof Error ? e.message : "Error de red");
        } finally {
            setLoading(false);
        }
    }, [router]);

    useEffect(() => { load(); }, [load]);

    const savedById = useMemo(() => {
        const m: Record<string, DiscountCode> = {};
        saved.forEach((s) => { m[s._id] = s.data; });
        return m;
    }, [saved]);

    const isDirty = (r: Row) =>
        r._isNew || !sameCode(dataOf(r), savedById[r._id]);

    const dirtyCount = rows.filter(isDirty).length;
    const deletedCount = saved.length - rows.filter((r) => !r._isNew).length;
    const pendingCount = dirtyCount + deletedCount;
    const hasChanges = pendingCount > 0;

    const activeCount = rows.filter((r) => statusOf(r).label === "Activo").length;

    const showToast = (ok: boolean, msg: string) => {
        setToast({ ok, msg });
        setTimeout(() => setToast(null), 3500);
    };

    const update = (id: string, patch: Partial<Row>) =>
        setRows((prev) => prev.map((r) => (r._id === id ? { ...r, ...patch } : r)));

    const remove = (id: string) => setRows((prev) => prev.filter((r) => r._id !== id));

    const addNew = () =>
        setRows((prev) => [{ ...emptyCode(), _id: uid(), _isNew: true, _editing: true }, ...prev]);

    const discard = () =>
        setRows(saved.map((s) => ({ ...s.data, _id: s._id, _isNew: false, _editing: false })));

    const handleSave = async () => {
        const seen = new Set<string>();
        for (const r of rows) {
            const code = r.code.trim().toUpperCase();
            if (!code) { showToast(false, "Hay un código vacío."); return; }
            if (seen.has(code)) { showToast(false, `Código duplicado: ${code}`); return; }
            seen.add(code);
            if (!(r.value > 0)) { showToast(false, `El valor de ${code} debe ser mayor a 0.`); return; }
            if (r.type === "percent" && r.value > 100) { showToast(false, `${code}: el porcentaje no puede superar 100.`); return; }
        }

        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        setSaving(true);
        try {
            const payload = rows.map((r) => ({ ...dataOf(r), code: r.code.trim().toUpperCase() }));
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/admin/discounts`, {
                method: "PUT",
                headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (res.ok) {
                const newRows = rows.map((r) => ({ ...r, code: r.code.trim().toUpperCase(), _isNew: false, _editing: false }));
                setRows(newRows);
                setSaved(newRows.map((r) => ({ _id: r._id, data: dataOf(r) })));
                showToast(true, "Cambios guardados correctamente.");
            } else {
                showToast(false, "Error al guardar.");
            }
        } catch {
            showToast(false, "Error al guardar.");
        } finally {
            setSaving(false);
        }
    };

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
        <div className="p-4 md:p-8 max-w-3xl mx-auto pb-28">
            {toast && (
                <div className={`fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl shadow-lg text-sm font-medium ${toast.ok ? "bg-emerald-600 text-white" : "bg-red-600 text-white"}`}>
                    {toast.ok
                        ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                        : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>}
                    {toast.msg}
                </div>
            )}

            {/* Header */}
            <div className="flex items-start justify-between gap-3 flex-wrap mb-5">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Códigos de descuento</h1>
                    <p className="text-sm text-gray-400 mt-1">
                        {rows.length} {rows.length === 1 ? "código" : "códigos"}
                        {rows.length > 0 && <> · <span className="text-emerald-600 font-medium">{activeCount} activo{activeCount === 1 ? "" : "s"}</span></>}
                    </p>
                </div>
                <button
                    onClick={addNew}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-yellow-orange-500 rounded-xl hover:bg-yellow-orange-600 transition shadow-sm cursor-pointer"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                    Nuevo código
                </button>
            </div>

            {/* Nota planes de suscripción */}
            <div className="flex items-start gap-3 px-4 py-3 mb-5 bg-blue-50 border border-blue-200 rounded-2xl">
                <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <p className="text-sm text-blue-800">
                    El código solo se aplica a los planes de <strong>pago único</strong>
                    {unicos.length > 0 && <>: hoy, <strong>{unicos.join(" y ")}</strong></>}.
                    {recurrentes.length > 0 && (
                        <>
                            {" "}
                            <strong>{recurrentes.join(" y ")}</strong> se {recurrentes.length === 1 ? "renueva" : "renuevan"} y aún no {recurrentes.length === 1 ? "acepta" : "aceptan"} códigos — si eliges <strong>Todos los planes</strong>, el descuento se ignora en {recurrentes.length === 1 ? "ese plan" : "esos"}.
                        </>
                    )}
                </p>
            </div>

            {/* Lista */}
            {rows.length === 0 ? (
                <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
                    <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4">
                        <svg className="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5a1.99 1.99 0 011.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.99 1.99 0 013 12V7a4 4 0 014-4z" /></svg>
                    </div>
                    <p className="text-sm font-medium text-gray-600">Aún no hay códigos de descuento</p>
                    <p className="text-xs text-gray-400 mt-1 mb-4">Crea tu primer código para usarlo en el checkout.</p>
                    <button onClick={addNew} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-yellow-orange-500 rounded-xl hover:bg-yellow-orange-600 transition shadow-sm cursor-pointer">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                        Crear código
                    </button>
                </div>
            ) : (
                <div className="flex flex-col gap-3">
                    {rows.map((r) => {
                        const dirty = isDirty(r);
                        const st = statusOf(r);
                        const subWarning = isSubscriptionPlan(r.plan);

                        // ── Tarjeta en modo edición / borrador ──────────────────────
                        if (r._editing) {
                            return (
                                <div key={r._id} className={`bg-white rounded-2xl shadow-sm overflow-hidden ${r._isNew ? "border-2 border-dashed border-falu-red-300" : "border border-falu-red-200 ring-1 ring-falu-red-100"}`}>
                                    {/* Cabecera de edición */}
                                    <div className="flex items-center justify-between px-4 md:px-5 py-3 bg-falu-red-50/50 border-b border-falu-red-100">
                                        <div className="flex items-center gap-2">
                                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-falu-red-100 text-falu-red-700">
                                                {r._isNew ? "Nuevo código" : "Editando"}
                                            </span>
                                            {r.code && <span className="text-sm font-mono font-semibold text-gray-700">{r.code}</span>}
                                        </div>
                                        {!r._isNew && (
                                            <button
                                                onClick={() => update(r._id, { _editing: false })}
                                                className="inline-flex items-center gap-1.5 text-xs font-medium text-falu-red-700 hover:text-falu-red-800 px-2 py-1 rounded-lg hover:bg-falu-red-100 transition cursor-pointer"
                                            >
                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                                Listo
                                            </button>
                                        )}
                                    </div>

                                    <div className="p-4 md:p-5">
                                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                                            {/* Código */}
                                            <div className="md:col-span-4">
                                                <label className="block text-xs font-medium text-gray-500 mb-1">Código</label>
                                                <input
                                                    type="text" value={r.code}
                                                    onChange={(e) => update(r._id, { code: e.target.value.toUpperCase() })}
                                                    placeholder="EJ: VERANO20"
                                                    className="w-full text-sm font-mono uppercase border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-falu-red-300"
                                                />
                                            </div>
                                            {/* Tipo */}
                                            <div className="md:col-span-4">
                                                <label className="block text-xs font-medium text-gray-500 mb-1">Tipo de descuento</label>
                                                <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                                                    {([["percent", "Porcentaje %"], ["fixed", "Monto $"]] as const).map(([val, lbl]) => (
                                                        <button key={val} type="button" onClick={() => update(r._id, { type: val })}
                                                            className={`flex-1 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer ${r.type === val ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                                                            {lbl}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            {/* Valor */}
                                            <div className="md:col-span-4">
                                                <label className="block text-xs font-medium text-gray-500 mb-1">{r.type === "percent" ? "Porcentaje" : "Monto (USD)"}</label>
                                                <div className="relative">
                                                    {r.type === "fixed" && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">$</span>}
                                                    <input
                                                        type="number" min={0} value={r.value}
                                                        onChange={(e) => update(r._id, { value: parseFloat(e.target.value) || 0 })}
                                                        className={`w-full text-sm border border-gray-200 rounded-lg py-2 focus:outline-none focus:ring-2 focus:ring-falu-red-300 ${r.type === "percent" ? "px-3 pr-7" : "pl-6 pr-3"}`}
                                                    />
                                                    {r.type === "percent" && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">%</span>}
                                                </div>
                                            </div>
                                            {/* Plan */}
                                            <div className="md:col-span-5">
                                                <label className="block text-xs font-medium text-gray-500 mb-1">Aplica a</label>
                                                <select value={r.plan} onChange={(e) => update(r._id, { plan: e.target.value as DiscountCode["plan"] })}
                                                    className="w-full text-sm border border-gray-200 rounded-lg px-2 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-falu-red-300 cursor-pointer">
                                                    {PLAN_OPTIONS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                                                </select>
                                            </div>
                                            {/* Expiración */}
                                            <div className="md:col-span-4">
                                                <label className="block text-xs font-medium text-gray-500 mb-1">Expira (opcional)</label>
                                                <input type="date" value={r.expires_at ?? ""}
                                                    onChange={(e) => update(r._id, { expires_at: e.target.value || null })}
                                                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-falu-red-300" />
                                            </div>
                                            {/* Límite usos */}
                                            <div className="md:col-span-3">
                                                <label className="block text-xs font-medium text-gray-500 mb-1">Límite de usos</label>
                                                <input type="number" min={0} value={r.max_uses ?? ""}
                                                    onChange={(e) => update(r._id, { max_uses: e.target.value === "" ? null : parseInt(e.target.value, 10) })}
                                                    placeholder="Sin límite"
                                                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-falu-red-300" />
                                            </div>
                                        </div>

                                        {/* Activo + acciones */}
                                        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                                            <label className="flex items-center gap-2 cursor-pointer select-none">
                                                <input type="checkbox" checked={r.active} onChange={(e) => update(r._id, { active: e.target.checked })} className="sr-only peer" />
                                                <span className="relative w-9 h-5 bg-gray-200 rounded-full peer-checked:bg-emerald-500 transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-4 after:h-4 after:bg-white after:rounded-full after:transition-transform peer-checked:after:translate-x-4" />
                                                <span className="text-sm font-medium text-gray-600">{r.active ? "Activo" : "Inactivo"}</span>
                                            </label>
                                            <button
                                                onClick={() => remove(r._id)}
                                                className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-red-500 transition px-2 py-1.5 rounded-lg hover:bg-red-50 cursor-pointer"
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                {r._isNew ? "Descartar" : "Eliminar"}
                                            </button>
                                        </div>

                                        {subWarning && (
                                            <p className="mt-3 text-xs text-amber-600 flex items-center gap-1.5">
                                                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /></svg>
                                                Este plan es de suscripción: el descuento no se aplicará todavía.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            );
                        }

                        // ── Tarjeta en modo lectura (código guardado) ────────────────
                        return (
                            <div key={r._id} className={`bg-white rounded-2xl border shadow-sm p-4 md:p-5 transition ${dirty ? "border-amber-200 ring-1 ring-amber-100" : "border-gray-100"}`}>
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0 flex-1">
                                        {/* Código + estado */}
                                        <div className="flex items-center gap-2 flex-wrap mb-1.5">
                                            <span className="text-base font-mono font-bold text-gray-800">{r.code || "—"}</span>
                                            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-full ${st.bg} ${st.text}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                                                {st.label}
                                            </span>
                                            {dirty && (
                                                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                                    Sin guardar
                                                </span>
                                            )}
                                        </div>
                                        {/* Detalles */}
                                        <div className="flex items-center gap-x-4 gap-y-1 flex-wrap text-sm text-gray-500">
                                            <span className="font-medium text-gray-700">{discountSummary(r)}</span>
                                            <span className="inline-flex items-center gap-1.5">
                                                <svg className="w-3.5 h-3.5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5a1.99 1.99 0 011.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.99 1.99 0 013 12V7a4 4 0 014-4z" /></svg>
                                                {PLAN_LABEL[r.plan]}
                                            </span>
                                            <span className="inline-flex items-center gap-1.5">
                                                <svg className="w-3.5 h-3.5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-5-3.87M9 20H4v-2a4 4 0 015-3.87m6-4a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                                                {r.uses}{r.max_uses != null ? ` / ${r.max_uses}` : ""} usos
                                            </span>
                                            {r.expires_at && (
                                                <span className="inline-flex items-center gap-1.5">
                                                    <svg className="w-3.5 h-3.5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                    Expira {dayjs(r.expires_at).format("DD/MM/YYYY")}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    {/* Acciones */}
                                    <div className="flex items-center gap-1 flex-shrink-0">
                                        <button
                                            onClick={() => update(r._id, { _editing: true })}
                                            className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition cursor-pointer"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                            Editar
                                        </button>
                                        <button
                                            onClick={() => remove(r._id)}
                                            aria-label="Eliminar código"
                                            className="w-8 h-8 flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition cursor-pointer"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Barra fija de guardado — solo aparece si hay cambios pendientes */}
            {hasChanges && (
                <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur border-t border-gray-200 shadow-[0_-2px_10px_rgba(0,0,0,0.04)]">
                    <div className="max-w-3xl mx-auto px-4 md:px-8 py-3 flex items-center justify-between gap-3">
                        <p className="text-sm text-amber-700 font-medium flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                            {pendingCount} cambio{pendingCount === 1 ? "" : "s"} sin guardar
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={discard}
                                disabled={saving}
                                className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition disabled:opacity-50 cursor-pointer"
                            >
                                Descartar
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex items-center gap-2 px-5 py-2 text-sm font-semibold bg-yellow-orange-500 text-white rounded-xl hover:bg-yellow-orange-600 transition shadow-sm disabled:opacity-50 cursor-pointer"
                            >
                                {saving
                                    ? <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>
                                    : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                                Guardar cambios
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
