"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useRouter } from "next/navigation";
import { ALL_PLAN_KEYS } from "@/app/lib/plans";
import {
    Pagina,
    EncabezadoDePagina,
    Tarjeta,
    Boton,
    Spinner,
    Chip,
    Aviso,
    Vacio,
    Pildoras,
    PlanBadge,
    EstadoDeSuscripcion,
    NIVELES,
    nivelLabel,
    ESTADOS_DE_ALUMNO,
    TONO_CLASES,
    useToast,
    useConfirmar,
    type Tono,
} from "../_ui";
import { fmtDatePT, fmtDateTimePT, fmtDia, fmtMoney } from "../_utils/format";

const PLANS: string[] = [...ALL_PLAN_KEYS];

/** Estado de un pago (`payments.payment_status`), en español. */
const ESTADOS_DE_PAGO: Record<string, { label: string; tono: Tono }> = {
    succeeded: { label: "Pagado", tono: "verde" },
    pending: { label: "Pendiente", tono: "ambar" },
    processing: { label: "Procesando", tono: "azul" },
    failed: { label: "Fallido", tono: "rojo" },
    refunded: { label: "Reembolsado", tono: "gris" },
    canceled: { label: "Cancelado", tono: "gris" },
};

function initials(name: string) {
    return name.split(" ").filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase();
}

function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
    const s = { sm: "w-8 h-8 text-xs", md: "w-10 h-10 text-sm", lg: "w-14 h-14 text-base" }[size];
    return (
        <div className={`${s} rounded-full bg-gradient-to-br from-falu-red-500 to-yellow-orange-400 flex items-center justify-center font-bold text-white flex-shrink-0 select-none`}>
            {initials(name) || "?"}
        </div>
    );
}

const ICONO_COPIAR = <svg className="w-3 h-3 text-gray-300 group-hover:text-gray-500 flex-shrink-0 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-4 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>;
const ICONO_COPIADO = <svg className="w-3 h-3 text-emerald-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>;

function CopyBadge({ value, label }: { value: string | null; label?: string }) {
    const [copied, setCopied] = useState(false);
    if (!value) return <span className="text-gray-300 text-xs">—</span>;
    return (
        <button
            onClick={() => { navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
            className="group inline-flex items-center gap-1.5 font-mono text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 hover:bg-gray-100 hover:border-gray-300 transition-all max-w-full cursor-pointer"
            title={value}
        >
            <span className="truncate">{label ?? value}</span>
            {copied ? ICONO_COPIADO : ICONO_COPIAR}
        </button>
    );
}

interface Payment {
    id: number; amount: number; payment_status: string;
    stripe_payment_intent_id: string | null;
    stripe_checkout_session_id: string | null;
    payment_date: string | null; created_at: string;
}
interface Interest {
    id: number; email: string; full_name: string;
    country: string; motive: string | null; created_at: string;
}
interface UserResult {
    id: number; email: string; full_name: string; country: string;
    plan: string; level: string; motive: string; status: string;
    inscription_date: string | null; last_payment_date: string | null;
    customer_stripe_id: string | null; created_at: string;
    notes: string | null;
    subscription_status: string | null;
    stripe_subscription_id: string | null;
    cancel_at_period_end: boolean | null;
    current_period_end: string | null;
    payments: Payment[]; interest: Interest[];
}

/** Lee el `error` de una respuesta fallida sin lanzar si el cuerpo no es JSON. */
async function mensajeDeError(res: Response, porDefecto: string): Promise<string> {
    try {
        const data = await res.json();
        if (data && typeof data.error === "string" && data.error) return data.error;
    } catch { /* cuerpo no JSON (p. ej. el 429 del limitador) */ }
    return `${porDefecto} (${res.status})`;
}

// ── Field atom ──────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1.5">{label}</p>
            <div className="text-sm text-gray-800">{children}</div>
        </div>
    );
}

const CAMPO_EDICION = "w-full text-sm border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-falu-red-200 focus:border-falu-red-300";

// ── Page ────────────────────────────────────────────────
export default function BusquedaPage() {
    const [query, setQuery]     = useState("");
    const [results, setResults] = useState<UserResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);
    const [selected, setSelected] = useState<UserResult | null>(null);
    const [editing, setEditing] = useState(false);
    const [editForm, setEditForm] = useState({ plan: "", level: "", inscription_date: "", email: "" });
    const [saving, setSaving]   = useState(false);
    const [notesDraft, setNotesDraft] = useState("");
    const [notesSaving, setNotesSaving] = useState(false);
    const [statusSaving, setStatusSaving] = useState(false);
    const [subBusy, setSubBusy] = useState<null | "cancel" | "refund" | "portal">(null);
    const [portalUrl, setPortalUrl] = useState<string | null>(null);
    const [portalCopied, setPortalCopied] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const inputRef    = useRef<HTMLInputElement>(null);
    // Solo vale la respuesta de la ÚLTIMA búsqueda: una lenta no pisa a una más nueva.
    const busquedaRef = useRef(0);
    const router = useRouter();
    const toast = useToast();
    const confirmar = useConfirmar();

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (!session) router.push("/admin/login");
        });
        // Deep-link: otras páginas del admin (Inicio, pagos, no-renovados, recurrentes,
        // accesos) enlazan aquí con ?q=<email> para abrir directamente la ficha.
        const q = new URLSearchParams(window.location.search).get("q");
        if (q) setQuery(q);
        else inputRef.current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function buscar(q: string) {
        const turno = ++busquedaRef.current;
        setLoading(true);
        setSearchError(null);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) { router.push("/admin/login"); return; }
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/admin/search?q=${encodeURIComponent(q)}`, {
                headers: { Authorization: `Bearer ${session.access_token}` },
            });
            if (!res.ok) throw new Error(await mensajeDeError(res, "No se pudo buscar"));
            const data = await res.json();
            if (turno !== busquedaRef.current) return;
            const list: UserResult[] = Array.isArray(data) ? data : [];
            setResults(list);
            // Un solo resultado, o uno cuyo correo es exactamente lo buscado (el
            // ?q=<email> que mandan otras pantallas): se abre su ficha directamente.
            const exacto = list.find(u => u.email?.toLowerCase() === q.trim().toLowerCase());
            if (list.length === 1) openUser(list[0]);
            else if (exacto) openUser(exacto);
        } catch (err) {
            if (turno !== busquedaRef.current) return;
            setResults([]);
            setSelected(null);
            setSearchError(err instanceof Error && err.message !== "Failed to fetch" ? err.message : "No se pudo conectar con el servidor.");
        } finally {
            if (turno === busquedaRef.current) setLoading(false);
        }
    }

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (query.trim().length < 2) {
            busquedaRef.current++;
            setResults([]); setSelected(null); setSearchError(null); setLoading(false);
            return;
        }
        debounceRef.current = setTimeout(() => { buscar(query); }, 350);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [query]);

    // ESC cancels edit
    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === "Escape" && editing) setEditing(false); };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [editing]);

    function openUser(user: UserResult) {
        setSelected(user);
        setEditForm({ plan: user.plan, level: user.level, inscription_date: user.inscription_date ?? "", email: user.email });
        setNotesDraft(user.notes ?? "");
        setEditing(false);
        setPortalUrl(null);
        setPortalCopied(false);
        setSubBusy(null);
    }

    async function refreshUser(id: number) {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/admin/search?q=${encodeURIComponent(query)}`, {
                headers: { Authorization: `Bearer ${session.access_token}` },
            });
            if (!res.ok) return;
            const data = await res.json();
            const list: UserResult[] = Array.isArray(data) ? data : [];
            const fresh = list.find((u) => u.id === id);
            if (fresh) {
                setResults((prev) => prev.map((u) => (u.id === id ? fresh : u)));
                setSelected((prev) => (prev && prev.id === id ? fresh : prev));
            }
        } catch { /* el cambio ya se hizo; solo no se pudo refrescar la ficha */ }
    }

    async function handleCancelSubscription(refund: boolean) {
        if (!selected) return;
        const alumno = <p className="mt-2 text-gray-700"><strong>{selected.full_name}</strong> · {selected.email}</p>;
        const ok = refund
            ? await confirmar({
                titulo: "¿Reembolsar y cancelar la suscripción ahora?",
                mensaje: <>Esto emitirá un REEMBOLSO al cliente (garantía de 3 días) y cancelará la suscripción de inmediato. Esta acción no se puede deshacer.{alumno}</>,
                confirmar: "Sí, reembolsar y cancelar",
                peligro: true,
            })
            : await confirmar({
                titulo: "¿Programar la cancelación al fin del periodo actual?",
                mensaje: <>El usuario mantendrá el acceso hasta el final del periodo ya pagado.{alumno}</>,
                confirmar: "Sí, programar cancelación",
                peligro: true,
            });
        if (!ok) return;
        setSubBusy(refund ? "refund" : "cancel");
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) { router.push("/admin/login"); return; }
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/admin/users/${selected.id}/cancel-subscription`, {
                method: "POST",
                headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" },
                body: JSON.stringify({ refund }),
            });
            const data = await res.json().catch(() => null);
            if (!res.ok || !data?.success) throw new Error(data?.error || `No se pudo procesar la solicitud (${res.status})`);
            toast.exito(data.mode === "refund_and_cancel"
                ? "Reembolso emitido y suscripción cancelada correctamente."
                : "Cancelación programada al fin del periodo correctamente.");
            await refreshUser(selected.id);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Ocurrió un error inesperado.");
        } finally {
            setSubBusy(null);
        }
    }

    async function handleBillingPortal() {
        if (!selected) return;
        setSubBusy("portal");
        setPortalUrl(null);
        setPortalCopied(false);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) { router.push("/admin/login"); return; }
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/admin/users/${selected.id}/billing-portal`, {
                headers: { Authorization: `Bearer ${session.access_token}` },
            });
            const data = await res.json().catch(() => null);
            if (!res.ok || !data?.url) throw new Error(data?.error || `No se pudo generar el link del portal (${res.status})`);
            setPortalUrl(data.url);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Ocurrió un error inesperado.");
        } finally {
            setSubBusy(null);
        }
    }

    async function handleStatusChange(newStatus: string) {
        if (!selected || statusSaving || selected.status === newStatus) return;
        const usuario = selected;
        const etiqueta = ESTADOS_DE_ALUMNO[newStatus]?.label ?? newStatus;
        const ok = await confirmar({
            titulo: `¿Cambiar el estado de ${usuario.full_name} a «${etiqueta}»?`,
            mensaje: <>Alumno: <strong>{usuario.full_name}</strong> · {usuario.email}<br />Estado actual: {ESTADOS_DE_ALUMNO[usuario.status]?.label ?? usuario.status}</>,
            confirmar: `Sí, marcar como ${etiqueta.toLowerCase()}`,
            peligro: newStatus === "cancelled",
        });
        if (!ok) return;
        setStatusSaving(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) { router.push("/admin/login"); return; }
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/admin/users/${usuario.id}/status`, {
                method: "PATCH",
                headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
            });
            if (!res.ok) throw new Error(await mensajeDeError(res, "No se pudo cambiar el estado"));
            setSelected(prev => prev && prev.id === usuario.id ? { ...prev, status: newStatus } : prev);
            setResults(prev => prev.map(u => u.id === usuario.id ? { ...u, status: newStatus } : u));
            toast.exito(`${usuario.full_name} ahora está «${etiqueta}».`);
        } catch (err) {
            toast.error(err instanceof Error && err.message !== "Failed to fetch" ? err.message : "No se pudo cambiar el estado: error de red.");
        } finally {
            setStatusSaving(false);
        }
    }

    /** `manual`: lo pidió el botón (avisa si no hay nada que guardar); si no, el blur. */
    async function handleSaveNotes(manual = false) {
        if (!selected || notesSaving) return;
        const usuario = selected;
        const nuevas = notesDraft;
        if (nuevas === (usuario.notes ?? "")) {
            if (manual) toast.info("Las notas no tienen cambios.");
            return;
        }
        setNotesSaving(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) { router.push("/admin/login"); return; }
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/admin/users/${usuario.id}/fields`, {
                method: "PATCH",
                headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" },
                body: JSON.stringify({ notes: nuevas }),
            });
            if (!res.ok) throw new Error(await mensajeDeError(res, "No se pudieron guardar las notas"));
            setSelected(prev => prev && prev.id === usuario.id ? { ...prev, notes: nuevas } : prev);
            setResults(prev => prev.map(u => u.id === usuario.id ? { ...u, notes: nuevas } : u));
            toast.exito("Notas guardadas.");
        } catch (err) {
            // El borrador se conserva en el campo para poder reintentar.
            toast.error(err instanceof Error && err.message !== "Failed to fetch" ? err.message : "No se pudieron guardar las notas: error de red.");
        } finally {
            setNotesSaving(false);
        }
    }

    async function handleSave() {
        if (!selected || saving) return;
        const usuario = selected;
        const body: Record<string, string> = { plan: editForm.plan, level: editForm.level };
        if (editForm.inscription_date) body.inscription_date = editForm.inscription_date;
        if (editForm.email && editForm.email !== usuario.email) body.email = editForm.email;

        const cambiaPlan = body.plan !== usuario.plan;
        const cambiaEmail = !!body.email;
        if (cambiaPlan || cambiaEmail) {
            const ok = await confirmar({
                titulo: `¿Guardar los cambios de ${usuario.full_name}?`,
                mensaje: (
                    <ul className="list-disc pl-5 space-y-1">
                        {cambiaPlan && <li>Plan: <strong>{usuario.plan || "—"}</strong> → <strong>{body.plan}</strong></li>}
                        {cambiaEmail && <li>Correo: <strong>{usuario.email}</strong> → <strong>{body.email}</strong></li>}
                    </ul>
                ),
                confirmar: "Sí, guardar",
            });
            if (!ok) return;
        }

        setSaving(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) { router.push("/admin/login"); return; }
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/admin/users/${usuario.id}/fields`, {
                method: "PATCH",
                headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            if (!res.ok) throw new Error(await mensajeDeError(res, "No se pudieron guardar los cambios"));
            setSelected(prev => prev && prev.id === usuario.id ? { ...prev, ...body } : prev);
            setResults(prev => prev.map(u => u.id === usuario.id ? { ...u, ...body } : u));
            setEditing(false);
            toast.exito("Cambios guardados correctamente.");
        } catch (err) {
            // Se queda en modo edición con lo tecleado, para corregir o reintentar.
            toast.error(err instanceof Error && err.message !== "Failed to fetch" ? err.message : "No se pudieron guardar los cambios: error de red.");
        } finally {
            setSaving(false);
        }
    }

    const totalPaid = selected
        ? selected.payments.filter(p => p.payment_status === "succeeded").reduce((s, p) => s + p.amount, 0)
        : 0;

    const hasResults = results.length > 0;
    const showEmpty  = query.trim().length >= 2 && !loading && !searchError && !hasResults;

    // Un plan o nivel que el desplegable no conoce (un plan adoptado, un dato viejo)
    // se añade como opción: si no, el <select> caería a su primera opción y guardar
    // le cambiaría el plan al alumno sin que nadie lo eligiera.
    const opcionesDePlan = selected && selected.plan && !PLANS.includes(selected.plan) ? [selected.plan, ...PLANS] : PLANS;
    const opcionesDeNivel: { value: string; label: string }[] = [
        ...(selected && selected.level && !NIVELES.some(n => n.value === selected.level) ? [{ value: selected.level, label: selected.level }] : []),
        ...NIVELES.map(n => ({ value: n.value as string, label: n.label as string })),
    ];

    return (
        <Pagina>
            <EncabezadoDePagina titulo="Búsqueda" descripcion="Encuentra un usuario por nombre o correo electrónico" />

            {/* ── Search bar ── */}
            <div className="relative max-w-2xl mb-8">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-400">
                    {loading
                        ? <Spinner className="w-5 h-5" />
                        : <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" /></svg>
                    }
                </div>
                <input
                    ref={inputRef}
                    type="text"
                    placeholder="Nombre o correo electrónico…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full pl-12 pr-12 py-3.5 text-sm bg-white border border-gray-200 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-falu-red-200 focus:border-falu-red-300 transition-all placeholder:text-gray-400"
                />
                {query && (
                    <button
                        onClick={() => { setQuery(""); setResults([]); setSelected(null); inputRef.current?.focus(); }}
                        aria-label="Borrar búsqueda"
                        className="absolute inset-y-0 right-4 flex items-center text-gray-300 hover:text-gray-500 transition-colors cursor-pointer"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                )}
            </div>

            {/* ── Search error ── */}
            {searchError && (
                <div className="max-w-2xl mb-8">
                    <Aviso
                        tono="rojo"
                        titulo="No se pudo hacer la búsqueda"
                        accion={<Boton variante="secundario" tamano="sm" onClick={() => buscar(query)}>Reintentar</Boton>}
                    >
                        {searchError}
                    </Aviso>
                </div>
            )}

            {/* ── Results layout ── */}
            {hasResults && (
                <div className="flex flex-col lg:flex-row gap-5 items-start">

                    {/* ── Results list ── */}
                    <div className="w-full lg:w-72 xl:w-80 flex-shrink-0 flex flex-col gap-2">
                        <p className="text-xs text-gray-400 px-1 mb-1">
                            {results.length} resultado{results.length !== 1 ? "s" : ""}
                        </p>
                        {results.map(u => {
                            const isActive = selected?.id === u.id;
                            const tono = ESTADOS_DE_ALUMNO[u.status]?.tono ?? "gris";
                            return (
                                <button
                                    key={u.id}
                                    onClick={() => openUser(u)}
                                    className={`w-full text-left rounded-2xl border p-3.5 transition-all duration-150 cursor-pointer ${
                                        isActive
                                            ? "border-falu-red-300 bg-falu-red-50 shadow-sm ring-1 ring-falu-red-200"
                                            : "border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm"
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <Avatar name={u.full_name} size="sm" />
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-semibold text-gray-800 truncate leading-tight">{u.full_name}</p>
                                            <p className="text-xs text-gray-400 truncate mt-0.5">{u.email}</p>
                                        </div>
                                        <div
                                            className={`w-2 h-2 rounded-full flex-shrink-0 ${TONO_CLASES[tono].punto}`}
                                            title={ESTADOS_DE_ALUMNO[u.status]?.label ?? u.status}
                                        />
                                    </div>
                                    <div className="flex items-center gap-2 mt-2.5 ml-11">
                                        <PlanBadge plan={u.plan} />
                                        <span className="text-xs text-gray-400 truncate">{u.country}</span>
                                        {u.notes && (
                                            <span title="Tiene notas internas" className="flex-shrink-0 w-4 h-4 rounded-full bg-amber-100 flex items-center justify-center">
                                                <svg className="w-2.5 h-2.5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                                                    <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                                                    <path fillRule="evenodd" d="M2 16a2 2 0 002 2h12a2 2 0 002-2v-5a1 1 0 10-2 0v5H4V8a1 1 0 00-1-1H3a1 1 0 00-1 1v8z" clipRule="evenodd" />
                                                </svg>
                                            </span>
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {/* ── Detail panel ── */}
                    {selected && (
                        <div className="flex-1 min-w-0 flex flex-col gap-4">

                            {/* Profile header */}
                            <Tarjeta>
                                {/* Header row */}
                                <div className="flex items-start gap-4 mb-6">
                                    <Avatar name={selected.full_name} size="lg" />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-3 flex-wrap">
                                            <div className="min-w-0">
                                                <h2 className="text-lg font-bold text-gray-900 leading-tight">{selected.full_name}</h2>
                                                {editing ? (
                                                    <input
                                                        type="email"
                                                        value={editForm.email}
                                                        onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                                                        className={`mt-1 max-w-xs ${CAMPO_EDICION}`}
                                                        placeholder="correo@ejemplo.com"
                                                    />
                                                ) : (
                                                    <p className="text-sm text-gray-400 mt-0.5">{selected.email}</p>
                                                )}
                                            </div>
                                            <div className="flex flex-col items-end gap-2 flex-shrink-0">
                                                {/* Status */}
                                                <div className="flex items-center gap-2">
                                                    {statusSaving && <Spinner className="w-3.5 h-3.5 text-gray-400" />}
                                                    <Pildoras
                                                        opciones={(["active", "inactive", "cancelled"] as const).map(s => ({ valor: s, label: ESTADOS_DE_ALUMNO[s].label }))}
                                                        valor={selected.status as "active" | "inactive" | "cancelled"}
                                                        onCambio={handleStatusChange}
                                                    />
                                                </div>
                                                {/* Edit / Save */}
                                                {!editing ? (
                                                    <Boton
                                                        variante="secundario"
                                                        tamano="sm"
                                                        onClick={() => setEditing(true)}
                                                        icono={<svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>}
                                                    >
                                                        Editar campos
                                                    </Boton>
                                                ) : (
                                                    <div className="flex gap-2">
                                                        <Boton variante="secundario" tamano="sm" onClick={() => setEditing(false)} disabled={saving}>
                                                            Cancelar
                                                        </Boton>
                                                        <Boton variante="primario" tamano="sm" onClick={handleSave} cargando={saving}>
                                                            {saving ? "Guardando…" : "Guardar"}
                                                        </Boton>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Edit hint */}
                                {editing && (
                                    <div className="flex items-center gap-2 mb-5 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-600">
                                        <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        Editando campos · <kbd className="font-mono bg-white border border-gray-200 px-1 rounded">Esc</kbd> para cancelar
                                    </div>
                                )}

                                {/* Info grid */}
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-5">
                                    <Field label="ID en BD">
                                        <span className="font-mono font-semibold text-gray-600">#{selected.id}</span>
                                    </Field>

                                    <Field label="País">
                                        <span className="font-medium">{selected.country}</span>
                                    </Field>

                                    <Field label="Registrado">
                                        <span className="text-gray-600">{fmtDatePT(selected.created_at)}</span>
                                    </Field>

                                    <Field label="Plan">
                                        {editing ? (
                                            <select value={editForm.plan} onChange={e => setEditForm({ ...editForm, plan: e.target.value })}
                                                className={`${CAMPO_EDICION} font-medium`}>
                                                {opcionesDePlan.map(p => <option key={p} value={p}>{p}</option>)}
                                            </select>
                                        ) : (
                                            <PlanBadge plan={selected.plan} />
                                        )}
                                    </Field>

                                    <Field label="Nivel">
                                        {editing ? (
                                            <select value={editForm.level} onChange={e => setEditForm({ ...editForm, level: e.target.value })}
                                                className={CAMPO_EDICION}>
                                                {!editForm.level && <option value="">—</option>}
                                                {opcionesDeNivel.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                                            </select>
                                        ) : (
                                            <span className="font-medium">{nivelLabel(selected.level)}</span>
                                        )}
                                    </Field>

                                    <Field label="Fecha de inicio">
                                        {editing ? (
                                            <input type="date" value={editForm.inscription_date}
                                                onChange={e => setEditForm({ ...editForm, inscription_date: e.target.value })}
                                                className={CAMPO_EDICION} />
                                        ) : (
                                            <span className="font-medium">{fmtDia(selected.inscription_date)}</span>
                                        )}
                                    </Field>

                                    <Field label="Último pago (PT)">
                                        <span className="text-gray-600">{fmtDateTimePT(selected.last_payment_date)}</span>
                                    </Field>

                                    <Field label="Motivo">
                                        <span className="text-gray-600 leading-snug">{selected.motive || "—"}</span>
                                    </Field>
                                </div>

                                {/* Stripe */}
                                <div className="mt-6 pt-5 border-t border-gray-100">
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Referencias Stripe</p>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs text-gray-400 w-24 flex-shrink-0">Customer ID</span>
                                        <CopyBadge value={selected.customer_stripe_id} />
                                    </div>
                                </div>
                            </Tarjeta>

                            {/* ── Suscripción ── */}
                            {(selected.stripe_subscription_id || selected.subscription_status) && (
                                <Tarjeta titulo="Suscripción">
                                    {/* Info grid */}
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-5 mb-6">
                                        <Field label="Estado">
                                            <EstadoDeSuscripcion estado={selected.subscription_status} />
                                        </Field>
                                        <Field label="Cancela al fin del periodo">
                                            {selected.cancel_at_period_end ? (
                                                <Chip tono="ambar" conPunto>Sí</Chip>
                                            ) : (
                                                <span className="font-medium text-gray-600">No</span>
                                            )}
                                        </Field>
                                        <Field label="Fin de periodo">
                                            <span className="text-gray-600">{fmtDatePT(selected.current_period_end)}</span>
                                        </Field>
                                        <Field label="Subscription ID">
                                            <CopyBadge value={selected.stripe_subscription_id} label={selected.stripe_subscription_id ? selected.stripe_subscription_id.slice(0, 18) + "…" : undefined} />
                                        </Field>
                                    </div>

                                    {/* Portal URL result */}
                                    {portalUrl && (
                                        <div className="mb-4 px-3 py-3 bg-gray-50 border border-gray-200 rounded-xl">
                                            <p className="text-xs font-medium text-gray-500 mb-2">Link del portal de Stripe (envíalo al usuario):</p>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    readOnly
                                                    value={portalUrl}
                                                    onFocus={(e) => e.currentTarget.select()}
                                                    className="flex-1 min-w-0 font-mono text-xs text-gray-600 bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-falu-red-200"
                                                />
                                                <Boton
                                                    variante="secundario"
                                                    tamano="sm"
                                                    onClick={() => { navigator.clipboard.writeText(portalUrl); setPortalCopied(true); setTimeout(() => setPortalCopied(false), 1500); }}
                                                >
                                                    {portalCopied ? "Copiado" : "Copiar"}
                                                </Boton>
                                            </div>
                                        </div>
                                    )}

                                    {/* Actions */}
                                    <div className="flex flex-col sm:flex-row flex-wrap gap-2.5">
                                        <Boton
                                            variante="secundario"
                                            tamano="sm"
                                            onClick={() => handleCancelSubscription(false)}
                                            disabled={subBusy !== null}
                                            cargando={subBusy === "cancel"}
                                        >
                                            {subBusy === "cancel" ? "Procesando…" : "Cancelar al fin del periodo"}
                                        </Boton>
                                        <Boton
                                            variante="peligro"
                                            tamano="sm"
                                            onClick={() => handleCancelSubscription(true)}
                                            disabled={subBusy !== null}
                                            cargando={subBusy === "refund"}
                                        >
                                            {subBusy === "refund" ? "Procesando…" : "Reembolsar y cancelar (garantía 3 días)"}
                                        </Boton>
                                        <Boton
                                            variante="secundario"
                                            tamano="sm"
                                            onClick={handleBillingPortal}
                                            disabled={subBusy !== null}
                                            cargando={subBusy === "portal"}
                                        >
                                            {subBusy === "portal" ? "Generando…" : "Generar link de portal de Stripe"}
                                        </Boton>
                                    </div>
                                </Tarjeta>
                            )}

                            {/* ── Payment history ── */}
                            <Tarjeta
                                sinRelleno
                                titulo="Historial de pagos"
                                acciones={
                                    <>
                                        <span className="text-xs text-gray-400">{selected.payments.length} pago{selected.payments.length !== 1 ? "s" : ""}</span>
                                        {totalPaid > 0 && (
                                            <span className="text-sm font-bold text-gray-800 bg-gray-50 border border-gray-100 px-2.5 py-1 rounded-lg">
                                                {fmtMoney(totalPaid)} total
                                            </span>
                                        )}
                                    </>
                                }
                            >
                                {selected.payments.length === 0 ? (
                                    <Vacio>Sin pagos registrados</Vacio>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    {["Fecha (PT)", "Monto", "Estado", "Payment Intent", "Session ID"].map(h => (
                                                        <th key={h} className="px-5 py-2.5 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {selected.payments.map(p => {
                                                    const estado = ESTADOS_DE_PAGO[p.payment_status] ?? { label: p.payment_status, tono: "gris" as Tono };
                                                    return (
                                                        <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                                                            <td className="px-5 py-3 text-xs text-gray-500 whitespace-nowrap">{fmtDateTimePT(p.created_at)}</td>
                                                            <td className="px-5 py-3 text-sm font-bold text-gray-800">{fmtMoney(p.amount)}</td>
                                                            <td className="px-5 py-3"><Chip tono={estado.tono} conPunto>{estado.label}</Chip></td>
                                                            <td className="px-5 py-3"><CopyBadge value={p.stripe_payment_intent_id} label={p.stripe_payment_intent_id ? p.stripe_payment_intent_id.slice(0, 18) + "…" : undefined} /></td>
                                                            <td className="px-5 py-3"><CopyBadge value={p.stripe_checkout_session_id} label={p.stripe_checkout_session_id ? p.stripe_checkout_session_id.slice(0, 18) + "…" : undefined} /></td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </Tarjeta>

                            {/* ── Interest submissions ── */}
                            {selected.interest.length > 0 && (
                                <Tarjeta
                                    sinRelleno
                                    titulo="Formularios de interés"
                                    acciones={<span className="text-xs text-gray-400">{selected.interest.length} formulario{selected.interest.length !== 1 ? "s" : ""}</span>}
                                >
                                    <div className="flex flex-col divide-y divide-gray-50">
                                        {selected.interest.map(s => (
                                            <div key={s.id} className="px-5 py-4 hover:bg-gray-50 transition-colors">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-xs font-medium text-gray-500">{fmtDateTimePT(s.created_at)}</span>
                                                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md">{s.country}</span>
                                                </div>
                                                {s.motive && <p className="text-sm text-gray-600 leading-relaxed">{s.motive}</p>}
                                            </div>
                                        ))}
                                    </div>
                                </Tarjeta>
                            )}

                            {/* ── Internal notes ── */}
                            <Tarjeta titulo="Notas internas">
                                <textarea
                                    value={notesDraft}
                                    onChange={e => setNotesDraft(e.target.value)}
                                    onBlur={() => handleSaveNotes(false)}
                                    rows={4}
                                    placeholder="Agrega notas sobre este usuario (visible solo para el equipo)…"
                                    className="w-full text-sm text-gray-700 placeholder:text-gray-300 border border-gray-200 rounded-xl px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-falu-red-200 focus:border-falu-red-300 transition-all"
                                />
                                <div className="flex items-center justify-between mt-2.5">
                                    <p className="text-xs text-gray-400">Se guarda al perder el foco</p>
                                    <Boton
                                        variante="secundario"
                                        tamano="sm"
                                        // onMouseDown evita que el blur del textarea dispare otro guardado a la vez.
                                        onMouseDown={e => e.preventDefault()}
                                        onClick={() => handleSaveNotes(true)}
                                        cargando={notesSaving}
                                    >
                                        {notesSaving ? "Guardando…" : "Guardar"}
                                    </Boton>
                                </div>
                            </Tarjeta>
                        </div>
                    )}
                </div>
            )}

            {/* ── Empty state ── */}
            {showEmpty && (
                <div className="max-w-sm mx-auto text-center py-16">
                    <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
                        </svg>
                    </div>
                    <p className="text-sm font-semibold text-gray-500">Sin resultados</p>
                    <p className="text-xs text-gray-400 mt-1">No encontramos usuarios para <span className="font-medium text-gray-500">&quot;{query}&quot;</span></p>
                </div>
            )}

            {/* ── Initial hint ── */}
            {!hasResults && !showEmpty && !searchError && query.trim().length === 0 && (
                <div className="max-w-sm mx-auto text-center py-16">
                    <div className="w-16 h-16 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center mx-auto mb-4">
                        <svg className="w-7 h-7 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-5-3.87M9 20H4v-2a4 4 0 015-3.87m6-4a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                    </div>
                    <p className="text-sm text-gray-400">Escribe el nombre o correo de un usuario</p>
                </div>
            )}
        </Pagina>
    );
}
