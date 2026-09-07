"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useRouter } from "next/navigation";
import { ErrorState } from "../_utils/ErrorState";
import { todayPT, nowPTInput } from "../_utils/ptTime";
import { planesDeCheckout } from "@/app/lib/plans";
import { usePlanCohorte } from "@/app/hooks/usePlanCohorte";
import { usePlanesDelCatalogo } from "@/app/hooks/usePlanesDelCatalogo";

interface StartDate {
    value: string;
    label: string;
    enabled: boolean;
    special?: boolean;
    excludedPlans?: string[];        // planes excluidos del formulario público normal
    excludedPlansSpecial?: string[]; // planes excluidos de /pago-estudiantes
}

interface PremiumSlot {
    id: string;
    datetime_pt: string;
    start_date: string;
    enabled: boolean;
}

const MONTH_NAMES_ES = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function buildLabel(value: string) {
    const [year, month, day] = value.split("-");
    return `${parseInt(day, 10)} de ${MONTH_NAMES_ES[parseInt(month, 10) - 1]} de ${year}`;
}

function formatMMDDYYYY(value: string) {
    const [year, month, day] = value.split("-");
    return `${month}/${day}/${year}`;
}

function buildSlotLabel(datetimePt: string): string {
    const [datePart, timePart] = datetimePt.split("T");
    const [year, month, day] = datePart.split("-").map(Number);
    const [h, m] = timePart.split(":").map(Number);
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 || 12;
    const timeStr = `${h12}:${m.toString().padStart(2, "0")} ${ampm}`;
    const d = new Date(Date.UTC(year, month - 1, day));
    const dayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
    const monthShort = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];
    return `${dayNames[d.getUTCDay()]} ${day} ${monthShort[month - 1]} ${year} · ${timeStr} PT`;
}

export default function FechasPage() {
    const router = useRouter();

    // Los chips de exclusión solo tienen sentido para los planes que SE COMPRAN
    // PARA UNA FECHA. Un plan sin cohorte (Essential, Speaking) empieza el día del
    // pago y `createCheckoutSession` le borra la fecha ANTES de llegar a la
    // validación de `excludedPlans`, así que su chip nunca hizo nada: prometía un
    // control que el servidor ignora. La lista se deriva de GET /config/plans
    // (mismo catálogo del backend) en vez de hardcodearse, para que un plan nuevo
    // o un cambio de `requiresCohort` no deje este panel desincronizado.
    const { requiresCohort } = usePlanCohorte();
    /*
      ⚠️ La LISTA también sale del catálogo, no solo `requiresCohort`. Este
      bloque ya derivaba la regla de `/config/plans` —su comentario de arriba lo
      dice— pero seguía filtrando sobre `CHECKOUT_PLAN_KEYS`, una constante: un
      plan abierto en el admin de la plataforma no aparecía aquí, así que no se le
      podía excluir de ninguna fecha. Medio panel era dinámico.
    */
    const catalogoDeFechas = usePlanesDelCatalogo();
    const cohortPlanKeys = useMemo(
        () => planesDeCheckout(catalogoDeFechas).map((p) => p.key).filter(requiresCohort),
        [catalogoDeFechas, requiresCohort],
    );

    // Start dates
    const [dates, setDates]     = useState<StartDate[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [saving, setSaving]   = useState(false);
    const [newDate, setNewDate] = useState("");
    const [error, setError]     = useState("");
    const [saved, setSaved]     = useState(false);

    // Premium slots
    const [slots, setSlots]             = useState<PremiumSlot[]>([]);
    const [loadingSlots, setLoadingSlots] = useState(true);
    const [savingSlots, setSavingSlots] = useState(false);
    const [newSlotDt, setNewSlotDt]     = useState("");
    const [newSlotStartDate, setNewSlotStartDate] = useState("");
    const [slotsError, setSlotsError]   = useState("");
    const [slotsSaved, setSlotsSaved]   = useState(false);

    const load = useCallback(async () => {
        setLoadError(null);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) { router.push("/admin/login"); return; }

            const token = session.access_token;
            const base  = process.env.NEXT_PUBLIC_BACKEND_URL;

            const [datesRes, slotsRes] = await Promise.all([
                fetch(`${base}/config/start-dates/all`, { headers: { Authorization: `Bearer ${token}` } }),
                fetch(`${base}/config/premium-slots/all`, { headers: { Authorization: `Bearer ${token}` } }),
            ]);

            if (!datesRes.ok) throw new Error(`Error fechas (${datesRes.status})`);
            if (!slotsRes.ok) throw new Error(`Error horarios (${slotsRes.status})`);
            setDates(await datesRes.json());
            setSlots(await slotsRes.json());
        } catch (e) {
            setLoadError(e instanceof Error ? e.message : "Error de red");
        } finally {
            setLoading(false);
            setLoadingSlots(false);
        }
    }, [router]);

    useEffect(() => { load(); }, [load]);

    // ─── Start dates ───────────────────────────────────────────────
    /*
      ⚠️⚠️ **El `fetch` va en try/catch, y no es defensa de más.** Sin él, un fallo
      de RED —el backend reiniciándose, el wifi cayéndose— rechaza la promesa, la
      excepción se pierde y pasan tres cosas a la vez: no se pinta ningún error,
      `saving` se queda en `true` (y con él TODOS los chips deshabilitados, que
      llevan `disabled={saving}`), y el panel queda inerte hasta recargar.

      Medido el 2026-09-06: se pulsó "Agregar", la fecha no se guardó, el campo se
      vació y la pantalla no dijo NADA — el error solo estaba en la consola. En un
      panel que decide qué planes se abren en qué fecha, un guardado que se pierde
      en silencio es de lo peor que puede pasar.

      Devuelve si se guardó, para que quien llama no dé por hecho que sí.
    */
    async function saveDates(updatedDates: StartDate[]): Promise<boolean> {
        setSaving(true); setSaved(false); setError("");
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { router.push("/admin/login"); return false; }
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/config/start-dates`, {
                method: "PUT",
                headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" },
                body: JSON.stringify({ dates: updatedDates }),
            });
            if (res.ok) {
                setDates(updatedDates); setSaved(true); setTimeout(() => setSaved(false), 2500);
                return true;
            }
            setError("Error guardando los cambios. Intenta de nuevo.");
            return false;
        } catch {
            // Ni siquiera llegó: se distingue de un rechazo del servidor porque lo
            // que hay que hacer es distinto (mirar la conexión, no los datos).
            setError("No se pudo conectar con el servidor. Los cambios NO se guardaron.");
            return false;
        } finally {
            setSaving(false);
        }
    }

    function handleToggle(index: number) {
        saveDates(dates.map((d, i) => i === index ? { ...d, enabled: !d.enabled } : d));
    }
    /*
      ⚠️⚠️ **Borrar una fecha PREGUNTA antes, y no es una cortesía.** Este panel
      escribe en la base de PRODUCCIÓN: la papelera retiraba la fecha de arranque
      de un grupo —con sus exclusiones por plan y dejando sus horarios huérfanos—
      en un clic, sin confirmación y sin deshacer. Medido el 2026-09-06: 12 px de
      separación entre el interruptor "Especial" (inocuo y reversible) y la
      papelera, con alturas de 20 y 28 px. Un resbalón del ratón retiraba del
      calendario una fecha ya vendida.

      Y al lado ya existía el camino reversible: marcarla "Inactiva".

      ⚠️ El aviso NOMBRA la fecha. Un "¿seguro?" genérico no protege de lo que
      protege esto, que es haber pulsado en la fila equivocada — el mismo motivo
      por el que a 375 px había que arreglar el título truncado.
    */
    function handleDelete(index: number) {
        const f = dates[index];
        const ok = window.confirm(
            `¿Quitar la fecha de inicio ${f?.label ?? f?.value}?\n\n` +
            "Deja de ofrecerse como fecha de arranque en el sitio y en la plataforma, " +
            "con sus planes excluidos, y sus horarios se quedan sin fecha.\n\n" +
            "Si solo quieres dejar de ofrecerla, márcala como Inactiva: eso se puede deshacer."
        );
        if (!ok) return;
        saveDates(dates.filter((_, i) => i !== index));
    }
    async function handleAdd() {
        if (!newDate) return;
        if (dates.some(d => d.value === newDate)) { setError("Esa fecha ya existe."); return; }
        const updated = [...dates, { value: newDate, label: buildLabel(newDate), enabled: true }]
            .sort((a, b) => a.value.localeCompare(b.value));
        setError("");
        // ⚠️ El campo se vacía SOLO si se guardó. Vaciarlo antes le borraba al
        // admin la fecha que acababa de teclear cuando el guardado fallaba, y
        // encima sin decirle que había fallado.
        if (await saveDates(updated)) setNewDate("");
    }

    // ─── Premium slots ─────────────────────────────────────────────
    // Mismo hueco que `saveDates`, y por el mismo motivo: ver su comentario.
    async function saveSlots(updatedSlots: PremiumSlot[]): Promise<boolean> {
        setSavingSlots(true); setSlotsSaved(false); setSlotsError("");
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { router.push("/admin/login"); return false; }
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/config/premium-slots`, {
                method: "PUT",
                headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" },
                body: JSON.stringify({ slots: updatedSlots }),
            });
            if (res.ok) {
                setSlots(updatedSlots); setSlotsSaved(true); setTimeout(() => setSlotsSaved(false), 2500);
                return true;
            }
            setSlotsError("Error guardando los horarios.");
            return false;
        } catch {
            setSlotsError("No se pudo conectar con el servidor. Los horarios NO se guardaron.");
            return false;
        } finally {
            setSavingSlots(false);
        }
    }

    function handleToggleSlot(index: number) {
        saveSlots(slots.map((s, i) => i === index ? { ...s, enabled: !s.enabled } : s));
    }
    // Mismo motivo que `handleDelete`: escribe en producción y no hay deshacer.
    function handleDeleteSlot(index: number) {
        const h = slots[index];
        const ok = window.confirm(
            `¿Quitar el horario ${h?.datetime_pt ?? ""} del grupo que empieza el ${h?.start_date ?? ""}?\n\n` +
            "Si esa fecha se queda sin ningún horario, a quien compre Premium se le dirá " +
            "que el equipo le contactará para coordinarlo."
        );
        if (!ok) return;
        saveSlots(slots.filter((_, i) => i !== index));
    }
    async function handleAddSlot() {
        if (!newSlotDt || !newSlotStartDate) return;
        const targetDate = dates.find(d => d.value === newSlotStartDate);
        if (!targetDate || !targetDate.enabled || targetDate.value < today) {
            setSlotsError("Esa fecha de inicio está inactiva o ya pasó."); return;
        }
        if (slots.some(s => s.datetime_pt === newSlotDt && s.start_date === newSlotStartDate)) {
            setSlotsError("Ese horario ya existe para esa fecha de inicio."); return;
        }
        const updated = [
            ...slots,
            { id: crypto.randomUUID(), datetime_pt: newSlotDt, start_date: newSlotStartDate, enabled: true },
        ].sort((a, b) => a.start_date.localeCompare(b.start_date) || a.datetime_pt.localeCompare(b.datetime_pt));
        setSlotsError("");
        /*
          ⚠️ Los campos se vacían SOLO si se guardó, igual que en `handleAdd`. Esta
          función se quedó atrás en el arreglo del 2026-09-06: vaciaba antes y sin
          `await`, así que un fallo de red dejaba al admin leyendo "los horarios NO
          se guardaron" sobre dos campos ya vacíos. Son las dos mitades del mismo
          fallo y ahora se comportan igual.
        */
        if (await saveSlots(updated)) { setNewSlotDt(""); setNewSlotStartDate(""); }
    }

    // Fecha/hora actual en horario de California (PT), no en UTC, para que los
    // límites de los inputs y el cálculo de "pasada" coincidan con la zona del negocio.
    const today = todayPT();
    const nowDT = nowPTInput();

    // ─── Render helpers (reutilizan saving / dates / saveDates por closure) ───

    // Switch compacto y accesible (estados Activa / Especial).
    const renderToggle = (opts: {
        on: boolean;
        color: "emerald" | "violet";
        label: string;
        srLabel: string;
        onClick: () => void;
    }) => {
        const trackOn = opts.color === "emerald" ? "bg-emerald-500" : "bg-violet-500";
        const textOn = opts.color === "emerald" ? "text-emerald-600" : "text-violet-600";
        const ring = opts.color === "emerald" ? "focus-visible:ring-emerald-300" : "focus-visible:ring-violet-300";
        return (
            <button
                type="button"
                role="switch"
                aria-checked={opts.on}
                aria-label={opts.srLabel}
                onClick={opts.onClick}
                disabled={saving}
                className={`group inline-flex items-center gap-2 rounded-full cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 ${ring}`}
            >
                <span className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${opts.on ? trackOn : "bg-gray-200 group-hover:bg-gray-300"}`}>
                    <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform ${opts.on ? "translate-x-[1.125rem]" : "translate-x-0.5"}`} />
                </span>
                <span className={`text-xs font-medium ${opts.on ? textOn : "text-gray-400"}`}>{opts.label}</span>
            </button>
        );
    };

    // Chips de exclusión de planes: ✓ disponible / ✗ excluido (toggle al hacer clic).
    const renderPlanExclusion = (
        date: StartDate,
        i: number,
        field: "excludedPlans" | "excludedPlansSpecial",
        accent: "red" | "violet",
    ) => {
        const excludedCls = accent === "red"
            ? "border-red-200 bg-red-50 text-red-600"
            : "border-violet-200 bg-violet-50 text-violet-600";
        return (
            <div className="flex flex-wrap items-center gap-1.5">
                {cohortPlanKeys.map((p) => {
                    const current = date[field] ?? [];
                    const excluded = current.includes(p);
                    return (
                        <button
                            key={p}
                            type="button"
                            disabled={saving}
                            aria-pressed={!excluded}
                            title={`${p}: ${excluded ? "excluido — clic para habilitar" : "disponible — clic para excluir"}`}
                            onClick={() => {
                                const next = excluded ? current.filter((x) => x !== p) : [...current, p];
                                saveDates(dates.map((d, idx) => idx === i ? { ...d, [field]: next } : d));
                            }}
                            className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs font-medium transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-gray-300 ${
                                excluded
                                    ? `${excludedCls} line-through`
                                    : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                            }`}
                        >
                            {excluded ? (
                                <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
                            ) : (
                                <svg className="h-3 w-3 text-emerald-500" viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M2 6.2l2.4 2.4L10 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                            )}
                            {p}
                        </button>
                    );
                })}
            </div>
        );
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
        <div className="p-4 md:p-8 max-w-2xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Fechas</h1>
                <p className="text-sm text-gray-400 mt-1">
                    Administra las fechas de inicio y los horarios disponibles para clases Premium.
                </p>
            </div>

            {/* ══ SECCIÓN 1: Fechas de inicio ══ */}
            <div className="mb-10">
                <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-gray-100 flex items-center justify-center text-[10px] font-black text-gray-500">1</span>
                    Fechas de inicio
                </h2>

                {/* Agregar fecha */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-4">
                    <p className="text-sm font-semibold text-gray-700 mb-3">Agregar nueva fecha</p>
                    <div className="flex gap-3 items-end">
                        <div className="flex-1">
                            <label className="text-xs text-gray-400 font-medium block mb-1">Fecha</label>
                            <input
                                type="date"
                                min={today}
                                value={newDate}
                                onChange={(e) => { setNewDate(e.target.value); setError(""); }}
                                className="w-full p-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-orange-300 bg-gray-50"
                            />
                        </div>
                        <button
                            onClick={handleAdd}
                            disabled={!newDate || saving}
                            className="px-4 py-2 bg-yellow-orange-500 text-white text-sm font-semibold rounded-xl hover:bg-yellow-orange-600 transition shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            Agregar
                        </button>
                    </div>
                    {newDate && (
                        <p className="text-xs text-gray-400 mt-2">
                            Se mostrará como: <span className="font-medium text-gray-600">{buildLabel(newDate)}</span>
                        </p>
                    )}
                </div>

                {error && (
                    <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600">{error}</div>
                )}
                {saved && (
                    <div className="mb-4 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-700 flex items-center gap-2">
                        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        Cambios guardados correctamente.
                    </div>
                )}

                {/* Lista de fechas */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
                        <p className="text-sm font-semibold text-gray-700">Fechas configuradas</p>
                        <span className="text-xs text-gray-400">{dates.length} fechas</span>
                    </div>
                    {dates.length === 0 ? (
                        <div className="px-5 py-10 text-center text-gray-300 text-sm">No hay fechas configuradas. Agrega una arriba.</div>
                    ) : (
                        <ul className="divide-y divide-gray-50">
                            {dates.map((date, i) => {
                                const isPast = date.value < today;
                                return (
                                    <li key={date.value} className={`px-4 sm:px-5 py-4 transition-colors hover:bg-gray-50/60 ${isPast ? "opacity-60" : ""}`}>
                                        {/* Cabecera: fecha + estados + eliminar */}
                                        {/*
                                          ⚠️⚠️ **A 375 px el título tenía 32 px para un texto de 122.** Se leía
                                          "3…" y era el 31 de agosto — indistinguible del 3 de agosto. Debajo
                                          de esa cabecera están los chips que deciden QUÉ PLANES SE PUEDEN
                                          COMPRAR para ese grupo, así que excluir Premium de la fecha
                                          equivocada es cerrar la venta de una cohorte real.

                                          La causa: el bloque de la derecha (dos interruptores + papelera) es
                                          `shrink-0` y el título `truncate` dentro de un `min-w-0`, así que los
                                          controles se quedaban con todo el ancho. Se apila en móvil y el
                                          título deja de truncarse.
                                        */}
                                        <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                                            <div className="min-w-0">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <p className="text-sm font-semibold text-gray-800">{date.label}</p>
                                                    {isPast && (
                                                        <span className="shrink-0 text-[10px] font-medium bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded-md">Pasada</span>
                                                    )}
                                                </div>
                                                {/*
                                                  ⚠️ Iba en MM/DD/YYYY: el 4 de mayo se leía "05/04/2026", que
                                                  para un hispanohablante es el 5 de ABRIL. O sea que el
                                                  respaldo del título truncado no solo era críptico — decía
                                                  otra fecha. Se pinta el ISO, que no se puede malinterpretar.
                                                */}
                                                <p className="text-xs text-gray-400 tabular-nums mt-0.5">{date.value}</p>
                                            </div>
                                            <div className="flex items-center gap-3 sm:gap-5 shrink-0">
                                                {renderToggle({
                                                    on: !!date.enabled,
                                                    color: "emerald",
                                                    label: date.enabled ? "Activa" : "Inactiva",
                                                    srLabel: `Mostrar ${date.label} en el formulario público`,
                                                    onClick: () => handleToggle(i),
                                                })}
                                                {renderToggle({
                                                    on: !!date.special,
                                                    color: "violet",
                                                    label: date.special ? "Especial" : "Normal",
                                                    srLabel: `Mostrar ${date.label} en /pago-estudiantes`,
                                                    onClick: () => saveDates(dates.map((d, idx) => idx === i ? { ...d, special: !d.special } : d)),
                                                })}
                                                <button
                                                    onClick={() => handleDelete(i)}
                                                    disabled={saving}
                                                    aria-label={`Eliminar ${date.label}`}
                                                    className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition cursor-pointer disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-200"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>

                                        {/* Panel: exclusión de planes por flujo */}
                                        <div className="mt-3 rounded-xl border border-gray-100 bg-gray-50/70 px-3 py-2.5 space-y-2">
                                            <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3">
                                                <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 sm:w-44 sm:shrink-0">
                                                    Planes · Formulario público
                                                </span>
                                                {renderPlanExclusion(date, i, "excludedPlans", "red")}
                                            </div>

                                            {date.special ? (
                                                <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3 pt-2 border-t border-gray-100">
                                                    <span className="text-[11px] font-semibold uppercase tracking-wide text-violet-600 sm:w-44 sm:shrink-0">
                                                        Planes · /pago-estudiantes
                                                    </span>
                                                    {renderPlanExclusion(date, i, "excludedPlansSpecial", "violet")}
                                                </div>
                                            ) : (
                                                <p className="text-[11px] text-gray-400 pt-2 border-t border-gray-100">
                                                    Activa <span className="font-medium text-violet-500">Especial</span> para configurar los planes de <code>/pago-estudiantes</code>.
                                                </p>
                                            )}
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
                <p className="text-xs text-gray-400 mt-3 px-1 leading-relaxed">
                    <strong className="text-emerald-600">Activa</strong> muestra la fecha en el formulario público; <strong className="text-violet-500">Especial</strong> la muestra en <code>/pago-estudiantes</code>. Son independientes y las fechas pasadas se ocultan solas.
                    En el panel de cada fecha, un plan con ✓ está disponible y uno <span className="line-through">tachado</span> queda excluido <strong>solo en ese flujo</strong>.
                </p>
            </div>

            {/* ══ SECCIÓN 2: Horarios Premium ══ */}
            <div>
                <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-purple-100 flex items-center justify-center text-[10px] font-black text-purple-600">2</span>
                    Horarios Premium
                </h2>

                {/* Agregar horario */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-4">
                    <p className="text-sm font-semibold text-gray-700 mb-1">Agregar nuevo horario</p>
                    <p className="text-xs text-gray-400 mb-3">
                        Asocia un horario (en <strong>hora PT</strong>) a una fecha de inicio específica. El alumno verá solo los horarios de su fecha.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                        <div>
                            <label className="text-xs text-gray-400 font-medium block mb-1">Fecha de inicio</label>
                            <select
                                value={newSlotStartDate}
                                onChange={(e) => { setNewSlotStartDate(e.target.value); setSlotsError(""); }}
                                className="w-full p-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-orange-300 bg-gray-50 appearance-none cursor-pointer"
                            >
                                <option value="">Selecciona fecha de inicio</option>
                                {dates.filter(d => d.enabled && d.value >= today).map(d => (
                                    <option key={d.value} value={d.value}>{d.label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 font-medium block mb-1">Hora de la clase (PT)</label>
                            <input
                                type="datetime-local"
                                min={nowDT}
                                value={newSlotDt}
                                onChange={(e) => { setNewSlotDt(e.target.value); setSlotsError(""); }}
                                className="w-full p-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-orange-300 bg-gray-50"
                            />
                        </div>
                    </div>
                    <div className="flex items-end justify-between gap-3">
                        <div className="text-xs text-gray-400">
                            {newSlotDt && newSlotStartDate
                                ? <>Se mostrará a alumnos con inicio <span className="font-medium text-gray-600">{dates.find(d => d.value === newSlotStartDate)?.label ?? newSlotStartDate}</span> como: <span className="font-medium text-gray-600">{buildSlotLabel(newSlotDt)}</span></>
                                : <span className="text-gray-300">Selecciona fecha de inicio y hora para ver la vista previa</span>
                            }
                        </div>
                        <button
                            onClick={handleAddSlot}
                            disabled={!newSlotDt || !newSlotStartDate || savingSlots}
                            className="shrink-0 px-4 py-2 bg-purple-600 text-white text-sm font-semibold rounded-xl hover:bg-purple-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            Agregar
                        </button>
                    </div>
                </div>

                {slotsError && (
                    <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600">{slotsError}</div>
                )}
                {slotsSaved && (
                    <div className="mb-4 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-700 flex items-center gap-2">
                        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        Horarios guardados correctamente.
                    </div>
                )}

                {/* Lista de horarios */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
                        <p className="text-sm font-semibold text-gray-700">Horarios configurados</p>
                        <span className="text-xs text-gray-400">{slots.length} horarios</span>
                    </div>
                    {loadingSlots ? (
                        <div className="px-5 py-8 text-center text-gray-400 text-sm">Cargando…</div>
                    ) : slots.length === 0 ? (
                        <div className="px-5 py-10 text-center text-gray-300 text-sm">No hay horarios configurados. Agrega uno arriba.</div>
                    ) : (
                        <ul className="divide-y divide-gray-50">
                            {slots.map((slot, i) => {
                                const startDateLabel = dates.find(d => d.value === slot.start_date)?.label ?? slot.start_date;
                                return (
                                <li key={slot.id} className="flex items-center justify-between px-5 py-4 gap-4">
                                    <div className="min-w-0">
                                        <p className="text-xs font-semibold text-purple-500 mb-0.5">Inicio: {startDateLabel}</p>
                                        <p className="text-sm font-semibold text-gray-800">{buildSlotLabel(slot.datetime_pt)}</p>
                                        <p className="text-xs text-gray-400 font-mono mt-0.5">{slot.datetime_pt}</p>
                                    </div>
                                    <div className="flex items-center gap-3 shrink-0">
                                        <button
                                            onClick={() => handleToggleSlot(i)}
                                            disabled={savingSlots}
                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50 ${
                                                slot.enabled ? "bg-purple-500" : "bg-gray-200"
                                            }`}
                                        >
                                            <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                                                slot.enabled ? "translate-x-6" : "translate-x-1"
                                            }`} />
                                        </button>
                                        <span className={`text-xs font-medium w-16 ${slot.enabled ? "text-purple-600" : "text-gray-400"}`}>
                                            {slot.enabled ? "Activo" : "Inactivo"}
                                        </span>
                                        <button
                                            onClick={() => handleDeleteSlot(i)}
                                            disabled={savingSlots}
                                            className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
                <p className="text-xs text-gray-400 mt-3 px-1">
                    Los horarios <strong>activos</strong> se muestran al alumno en la página de confirmación de pago Premium. Ingresa siempre en hora PT (Pacífico).
                </p>
            </div>
        </div>
    );
}
