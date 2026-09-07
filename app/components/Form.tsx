"use client";

import { useEffect, useMemo, useState } from "react";
import { useStartDates } from "../hooks/useStartDates";
import { useLevelAvailability } from "../hooks/useLevelAvailability";
import { usePlanCohorte } from "../hooks/usePlanCohorte";
import { requiresScheduling, planesDeCheckout, descripcionDeCheckout } from "@/app/lib/plans";
import { usePlanesDelCatalogo, precioEtiqueta } from "@/app/hooks/usePlanesDelCatalogo";

interface PremiumSlot { id: string; datetime_pt: string; start_date: string; enabled: boolean; }

function ptStringToDate(datetimePt: string): Date {
    // datetime_pt is PT (America/Los_Angeles) local time without timezone info.
    // Interpret it as PT and return the correct UTC Date.
    const [datePart, timePart] = datetimePt.split("T");
    const [y, mo, d] = datePart.split("-").map(Number);
    const [h, m, s = 0] = timePart.split(":").map(Number);
    const probe = new Date(Date.UTC(y, mo - 1, d, h, m, s));
    const fmt = new Intl.DateTimeFormat("en-US", {
        timeZone: "America/Los_Angeles",
        year: "numeric", month: "numeric", day: "numeric",
        hour: "2-digit", minute: "2-digit", second: "2-digit",
        hour12: false,
    }).formatToParts(probe);
    const g = (t: string) => parseInt(fmt.find(p => p.type === t)!.value);
    const ptProbe = Date.UTC(g("year"), g("month") - 1, g("day"), g("hour") % 24, g("minute"), g("second"));
    return new Date(probe.getTime() + (probe.getTime() - ptProbe));
}

function buildSlotDisplay(datetimePt: string) {
    const date = ptStringToDate(datetimePt);
    const userTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const weekdayMap: Record<string, string> = { Sun:"Dom", Mon:"Lun", Tue:"Mar", Wed:"Mié", Thu:"Jue", Fri:"Vie", Sat:"Sáb" };
    const monthNames = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];
    const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: userTz,
        weekday: "short", month: "numeric", day: "numeric",
        hour: "numeric", minute: "2-digit", hour12: true,
    }).formatToParts(date);
    const g = (t: string) => parts.find(p => p.type === t)?.value ?? "";
    const timeStr = `${g("hour")}:${g("minute")} ${g("dayPeriod")}`;
    const tzAbbr = new Intl.DateTimeFormat("en-US", { timeZone: userTz, timeZoneName: "short" })
        .formatToParts(date).find(p => p.type === "timeZoneName")?.value ?? "";
    return {
        dayName: weekdayMap[g("weekday")] ?? g("weekday"),
        day: parseInt(g("day")),
        monthName: monthNames[parseInt(g("month")) - 1],
        timeStr,
        tzAbbr,
    };
}

// El resumen del plan (tagline + features) vive en el catálogo único (app/lib/plans.ts).
/*
  ⚠️ Era una unión de cuatro literales. El selector se construye ahora con el
  CATÁLOGO, que puede traer planes abiertos en el admin de la plataforma, así que
  la clave es una cadena. Los `as PlanType` que había repartidos por el archivo
  ya venían coercionando `string`: lo que cambia es que ahora es honesto.
*/
type PlanType = string;

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL!;


// ─── Subcomponentes de UI ─────────────────────────────────────────────────────

function FieldLabel({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
    return (
        <label htmlFor={htmlFor} className="block text-sm font-semibold text-zinc-700 mb-1.5">
            {children}
        </label>
    );
}

const inputClass =
    "w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-900 placeholder-zinc-400 transition focus:outline-none focus:ring-2 focus:ring-falu-red-400 focus:border-transparent focus:bg-white hover:border-zinc-300";

const selectClass =
    "w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-900 transition focus:outline-none focus:ring-2 focus:ring-falu-red-400 focus:border-transparent focus:bg-white hover:border-zinc-300 appearance-none cursor-pointer";

function getEmailSuggestion(email: string): string | null {
    const TYPOS: Record<string, string> = { ".con": ".com", ".cmo": ".com", ".ocm": ".com", ".vom": ".com", ".coml": ".com" };
    const lower = email.toLowerCase();
    for (const [typo, fix] of Object.entries(TYPOS)) {
        if (lower.endsWith(typo)) return email.slice(0, email.length - typo.length) + fix;
    }
    return null;
}

// ─── Componente principal ─────────────────────────────────────────────────────

const PaymentForm = ({
    selectedPlan,
    selectedNivel = "",
    selectedDificultades = "",
    embedded = false,
    onPlanChange,
}: {
    selectedPlan: PlanType;
    selectedNivel?: string;
    selectedDificultades?: string;
    embedded?: boolean;
    onPlanChange?: (plan: PlanType) => void;
}) => {
    const [plan, setPlan] = useState<PlanType>(selectedPlan);
    const [loading, setLoading] = useState(false);
    const [emailSuggestion, setEmailSuggestion] = useState<string | null>(null);
    // Si el correo ya tiene una suscripción activa, avisamos antes del checkout.
    const [existingSub, setExistingSub] = useState<{ plan: string; periodEnd: string | null; cancelAtPeriodEnd: boolean } | null>(null);
    const [subModal, setSubModal] = useState<null | "confirm" | "blocked">(null);
    const { dates: allDates } = useStartDates();
    const { isLevelAvailable } = useLevelAvailability();
    const { requiresCohort, loading: cohorteLoading } = usePlanCohorte();
    // Essential empieza el mismo día del pago: no elige fecha ni la envía.
    const needsCohorte = requiresCohort(plan);
    const availableDates = allDates.filter(d => !d.excludedPlans?.includes(plan));
    const [formData, setFormData] = useState({
        email: "",
        emailConfirm: "",
        fullName: "",
        country: "",
        englishLevel: selectedNivel,
        interestDate: "",
    });
    const [error, setError] = useState("");
    const [accepted, setAccepted] = useState(false);
    const [premiumSlots, setPremiumSlots] = useState<PremiumSlot[]>([]);
    const [premiumSlotsLoading, setPremiumSlotsLoading] = useState(false);

    // Label legible de la fecha elegida (p. ej. "29 de junio de 2026"), para
    // mostrarla en la nota, el checkbox y enviarla a Stripe.
    const selectedDateLabel =
        availableDates.find(d => d.value === formData.interestDate)?.label
        ?? allDates.find(d => d.value === formData.interestDate)?.label
        ?? "";

    /*
      ⚠️ **La lista de planes sale del CATÁLOGO, no de una constante.** Con
      `CHECKOUT_PLAN_KEYS` un plan abierto en el admin no aparecía en este
      selector aunque el backend ya supiera cobrarlo. Mientras el catálogo viaja,
      `planesDeCheckout(null)` devuelve los cuatro de siempre.
    */
    const catalogo = usePlanesDelCatalogo();
    const planesCheckout = useMemo(() => planesDeCheckout(catalogo), [catalogo]);
    const planActual = planesCheckout.find((p) => p.key === plan);

    // Suscripción recurrente (cobro automático cada 4 semanas) según el catálogo.
    const isSubscription = planActual?.recurring ?? false;
    /*
      ⚠️ Sin plan resuelto se pinta cadena vacía, NO "$0": hay un instante en que
      el catálogo aún no llegó, y un cero en el precio de un checkout se lee como
      gratis. El hueco se lee como "cargando", que es la verdad.
    */
    const precioDelPlan = planActual ? precioEtiqueta(planActual.priceCents) : "";

    useEffect(() => { setPlan(selectedPlan); }, [selectedPlan]);

    useEffect(() => {
        if (selectedNivel) {
            setFormData(prev => ({ ...prev, englishLevel: selectedNivel }));
        }
    }, [selectedNivel]);

    // Si el nivel actual no está disponible para el plan (p. ej. viene preseleccionado
    // desde paso-uno), se limpia para que el usuario lo vuelva a elegir entre los válidos.
    useEffect(() => {
        if (formData.englishLevel && !isLevelAvailable(plan, formData.englishLevel)) {
            setFormData(prev => ({ ...prev, englishLevel: "" }));
        }
    }, [plan, formData.englishLevel, isLevelAvailable]);

    // Auto-select the nearest available date — solo para los planes con cohorte.
    // En un plan sin cohorte se limpia la fecha en vez de preseleccionarla: si el
    // alumno venía de Premium y cambia a Essential, la fecha que ya había elegido
    // debe DESAPARECER del formData, no viajar escondida hasta el checkout.
    useEffect(() => {
        if (!needsCohorte) {
            if (formData.interestDate) setFormData(prev => ({ ...prev, interestDate: "" }));
            return;
        }
        if (availableDates.length > 0 && !formData.interestDate) {
            setFormData(prev => ({ ...prev, interestDate: availableDates[0].value }));
        }
    }, [availableDates, needsCohorte, formData.interestDate]);

    // Re-confirmación obligatoria: si cambia el plan o la fecha, se desmarca el
    // checkbox para que el alumno acepte la fecha vigente (no una anterior).
    useEffect(() => { setAccepted(false); }, [plan, formData.interestDate]);

    useEffect(() => {
        if (!requiresScheduling(plan)) { setPremiumSlots([]); return; }
        setPremiumSlotsLoading(true);
        fetch(`${BACKEND_URL}/config/premium-slots`)
            .then(r => r.json())
            .then(data => setPremiumSlots(Array.isArray(data) ? data : []))
            .catch(() => setPremiumSlots([]))
            .finally(() => setPremiumSlotsLoading(false));
    }, [plan]);

    const validateForm = () => {
        if (!formData.email || !formData.fullName)
            return "Completa tu correo y nombre";
        if (formData.email !== formData.emailConfirm)
            return "Los correos electrónicos no coinciden";
        if (!formData.country)
            return "Selecciona tu país";
        if (!formData.englishLevel)
            return "Selecciona tu nivel de inglés";
        return null;
    };

    // Chequea (al salir del campo de correo) si ese email ya tiene una suscripción
    // activa, para avisar que un nuevo checkout la cambia/cancela y vuelve a cobrar.
    const checkExistingSub = async (
        rawEmail: string,
    ): Promise<{ plan: string; periodEnd: string | null; cancelAtPeriodEnd: boolean } | null> => {
        const e = rawEmail.trim();
        if (!e || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) { setExistingSub(null); return null; }
        try {
            const res = await fetch(`${BACKEND_URL}/verify-student`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: e }),
            });
            const data = await res.json();
            const info = res.ok && data.found && data.user?.has_active_subscription
                ? {
                    plan: data.user.plan as string,
                    periodEnd: (data.user.current_period_end as string | null) ?? null,
                    cancelAtPeriodEnd: !!data.user.cancel_at_period_end,
                }
                : null;
            setExistingSub(info);
            return info;
        } catch {
            setExistingSub(null);
            return null;
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (name === "plan") {
            setPlan(value as PlanType);
            onPlanChange?.(value as PlanType);
            const updates: Partial<typeof formData> = {};
            if (formData.englishLevel && !isLevelAvailable(value as PlanType, formData.englishLevel)) {
                updates.englishLevel = "";
            }
            if (formData.interestDate && allDates.find(d => d.value === formData.interestDate)?.excludedPlans?.includes(value)) {
                updates.interestDate = "";
            }
            if (Object.keys(updates).length) setFormData(prev => ({ ...prev, ...updates }));
            return;
        }
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (name === "email") setEmailSuggestion(null);
        setError("");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (loading) return;
        const validationError = validateForm();
        if (validationError) { setError(validationError); return; }
        // Guard explícito: un plan con cohorte NO puede comprarse sin fecha. El
        // `required` del select no basta —el campo no se renderiza mientras el
        // catálogo carga— y sin fecha el cobro se anclaría al próximo cohorte y
        // el alumno se quedaría sin horario de clase asignado.
        if (needsCohorte && !formData.interestDate) {
            setError("Selecciona tu fecha de inicio."); return;
        }
        if (!accepted) {
            setError(needsCohorte
                ? "Debes aceptar los términos y confirmar tu fecha de inicio"
                : "Debes aceptar los términos para continuar");
            return;
        }
        setError("");
        // Si el correo ya tiene una suscripción recurrente viva: cambiar a
        // Personalizado (pago único) va por soporte (evita doble cobro). Para
        // cambios entre suscripciones, modal de confirmación.
        const active = await checkExistingSub(formData.email);
        if (active) {
            // Personalizado (pago único) y downgrade (a plan menor) → soporte.
            // Upgrade o mismo plan → confirmación normal.
            const RANK: Record<string, number> = { Essential: 1, Premium: 2 };
            const isDowngrade = !!RANK[plan] && !!RANK[active.plan] && RANK[plan] < RANK[active.plan];
            setSubModal(plan === "Personalizado" || plan === "Fluidez" || isDowngrade ? "blocked" : "confirm");
            return;
        }
        await doCheckout();
    };

    const doCheckout = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${BACKEND_URL}/create-checkout-session`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: formData.email.trim(),
                    fullName: formData.fullName.trim(),
                    country: formData.country,
                    plan,
                    level: formData.englishLevel,
                    interestDate: formData.interestDate,
                    interestDateLabel: selectedDateLabel,
                    description: descripcionDeCheckout(planActual),
                    motive: selectedDificultades || "no especificado",
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                // Plan sin cupos: mensaje claro en vez del error genérico de pago.
                if (res.status === 409 && data?.code === "PLAN_SOLD_OUT") {
                    setError("Este plan ya no tiene cupos disponibles.");
                    setLoading(false);
                    return;
                }
                throw new Error(data?.error || "Error creando sesión");
            }
            window.location.href = data.url;
        } catch (err: any) {
            console.error("Error Checkout:", err);
            setError("No pudimos iniciar tu pago. Intenta nuevamente.");
            setLoading(false);
        }
    };

    const formContent = (
        <div className="w-full max-w-[580px]">

                {/* Encabezado */}
                <div className="text-center mb-6">
                    {embedded && (
                        <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#C0353E" }}>
                            Paso 4 de 4
                        </p>
                    )}
                    <h2 className="text-2xl font-extrabold text-zinc-900 sm:text-3xl">
                        {embedded ? "¡Ya casi terminas!" : "Comenzá tu camino en inglés"}
                    </h2>
                    <p className="mt-1.5 text-sm text-zinc-500">
                        {embedded
                            ? "Confirma tus datos y reservamos tu cupo."
                            : "Completá el formulario y te reservamos tu cupo en el Plan que elijas."}
                    </p>
                    {embedded && (
                        <div className="mt-3 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold" style={{ backgroundColor: "#fadadd", color: "#C0353E" }}>
                            {/*
                                ⚠️ El NOMBRE comercial, no la clave. Con los cinco de
                                siempre no se distinguía —la clave de Essential ES
                                "Essential"— pero un plan abierto desde el admin llegaba
                                al momento del pago como "Plan UXADM_B". El botón de
                                abajo ya usaba `nombreEnCheckout`; este chip se quedó
                                con la clave.
                            */}
                            <span>{planActual?.nombreEnCheckout ?? plan}</span>
                            <span className="opacity-50">·</span>
                            <span>{precioDelPlan}</span>
                        </div>
                    )}
                    {embedded && isSubscription && (
                        <p className="mt-1.5 text-xs text-zinc-400">Facturación automática cada 4 semanas</p>
                    )}
                    {!embedded && (
                        <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-zinc-600 ring-1 ring-inset ring-zinc-200">
                            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                            {availableDates.length > 0
                                ? `Próximo inicio: ${availableDates[0].label}`
                                : "Cupos disponibles · Próximamente"}
                        </div>
                    )}
                </div>

                {/* Detalle del plan seleccionado */}
                <div className="mb-5 rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
                    <div className="px-5 py-3 bg-zinc-50 border-b border-zinc-100">
                        <p className="text-xs font-bold uppercase tracking-wide text-zinc-500">Tu Plan {plan} incluye</p>
                        <p className="text-[13px] text-zinc-600 mt-0.5">{planActual?.tagline ?? ""}</p>
                    </div>
                    <ul className="px-5 py-4 space-y-2.5">
                        {(planActual?.features ?? []).map((feat) => (
                            <li key={feat} className="flex items-start gap-2.5">
                                <span className="mt-0.5 shrink-0 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-100">
                                    <svg className="h-2.5 w-2.5 text-emerald-600" viewBox="0 0 10 10" fill="none">
                                        <polyline points="1.5,5 4,7.5 8.5,2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </span>
                                <span className="text-[13px] text-zinc-700 leading-snug">{feat}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Card del formulario */}
                <div className="rounded-2xl bg-white shadow-sm ring-1 ring-zinc-200 overflow-hidden">

                    {/* Banda superior de color */}
                    <div className="h-1.5 w-full bg-linear-to-r from-falu-red-700 via-falu-red-500 to-yellow-orange-400" />

                    <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5">

                        <div>
                            <FieldLabel htmlFor="email">Correo electrónico *</FieldLabel>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                onBlur={() => setEmailSuggestion(getEmailSuggestion(formData.email))}
                                placeholder="tu@correo.com"
                                autoComplete="email"
                                className={inputClass}
                                required
                            />
                            {emailSuggestion && (
                                <div className="mt-2 flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2.5">
                                    <svg className="h-4 w-4 shrink-0 text-amber-500" viewBox="0 0 16 16" fill="none">
                                        <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
                                        <path d="M8 5v3.5M8 11h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                    </svg>
                                    <p className="text-xs text-amber-800 flex-1">
                                        ¿Quisiste escribir <strong>{emailSuggestion}</strong>?
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => { setFormData(prev => ({ ...prev, email: emailSuggestion!, emailConfirm: emailSuggestion! })); setEmailSuggestion(null); }}
                                        className="text-xs font-semibold text-amber-700 hover:text-amber-900 underline underline-offset-2 shrink-0"
                                    >
                                        Corregir
                                    </button>
                                </div>
                            )}
                        </div>

                        <div>
                            <FieldLabel htmlFor="emailConfirm">Confirmar correo *</FieldLabel>
                            <input
                                type="email"
                                id="emailConfirm"
                                name="emailConfirm"
                                value={formData.emailConfirm}
                                onChange={handleChange}
                                placeholder="Repite tu correo"
                                autoComplete="email"
                                className={inputClass}
                                required
                            />
                            {formData.emailConfirm && formData.email !== formData.emailConfirm && (
                                <p className="mt-1.5 text-xs text-red-500">Los correos no coinciden</p>
                            )}
                        </div>

                        {/* Error de correos */}
                        {error && (
                            <div role="alert" className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3">
                                <svg className="mt-0.5 h-4 w-4 shrink-0 text-red-500" viewBox="0 0 16 16" fill="none">
                                    <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
                                    <path d="M8 5v3.5M8 11h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                </svg>
                                <p className="text-sm text-red-600">{error}</p>
                            </div>
                        )}

                        {/* Nombre */}
                        <div>
                            <FieldLabel htmlFor="fullName">Nombre completo *</FieldLabel>
                            <input
                                type="text"
                                id="fullName"
                                name="fullName"
                                value={formData.fullName}
                                onChange={handleChange}
                                placeholder="Tu nombre completo"
                                autoComplete="name"
                                className={inputClass}
                                required
                            />
                        </div>

                        {/* País + Plan en dos columnas */}
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                            <div>
                                <FieldLabel htmlFor="country">País donde resides *</FieldLabel>
                                <div className="relative">
                                    <select
                                        id="country"
                                        name="country"
                                        value={formData.country}
                                        onChange={handleChange}
                                        autoComplete="country"
                                        className={selectClass}
                                        required
                                    >
                                        <option value="">Selecciona tu país</option>
                                        <option value="Canadá">Canadá</option>
                                        <option value="Estados Unidos">Estados Unidos</option>
                                        <option value="México">México</option>
                                        <option value="Guatemala">Guatemala</option>
                                        <option value="Belice">Belice</option>
                                        <option value="Honduras">Honduras</option>
                                        <option value="El Salvador">El Salvador</option>
                                        <option value="Nicaragua">Nicaragua</option>
                                        <option value="Costa Rica">Costa Rica</option>
                                        <option value="Panamá">Panamá</option>
                                        <option value="Cuba">Cuba</option>
                                        <option value="República Dominicana">República Dominicana</option>
                                        <option value="Puerto Rico">Puerto Rico</option>
                                        <option value="Haití">Haití</option>
                                        <option value="Jamaica">Jamaica</option>
                                        <option value="Bahamas">Bahamas</option>
                                        <option value="Barbados">Barbados</option>
                                        <option value="Trinidad y Tobago">Trinidad y Tobago</option>
                                        <option value="Antigua y Barbuda">Antigua y Barbuda</option>
                                        <option value="San Cristóbal y Nieves">San Cristóbal y Nieves</option>
                                        <option value="Santa Lucía">Santa Lucía</option>
                                        <option value="San Vicente y las Granadinas">San Vicente y las Granadinas</option>
                                        <option value="Granada">Granada</option>
                                        <option value="Dominica">Dominica</option>
                                        <option value="Colombia">Colombia</option>
                                        <option value="Venezuela">Venezuela</option>
                                        <option value="Guyana">Guyana</option>
                                        <option value="Surinam">Surinam</option>
                                        <option value="Ecuador">Ecuador</option>
                                        <option value="Perú">Perú</option>
                                        <option value="Bolivia">Bolivia</option>
                                        <option value="Brasil">Brasil</option>
                                        <option value="Paraguay">Paraguay</option>
                                        <option value="Uruguay">Uruguay</option>
                                        <option value="Argentina">Argentina</option>
                                        <option value="Chile">Chile</option>
                                        <option value="España">España</option>
                                        <option value="Guinea Ecuatorial">Guinea Ecuatorial</option>
                                        <option value="Otro">Otro</option>
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                                        <svg className="h-4 w-4 text-zinc-400" viewBox="0 0 16 16" fill="none">
                                            <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <FieldLabel htmlFor="plan">Plan seleccionado *</FieldLabel>
                                <div className="relative">
                                    <select
                                        id="plan"
                                        name="plan"
                                        value={plan}
                                        onChange={handleChange}
                                        className={selectClass}
                                        required
                                    >
                                        {planesCheckout.map((op) => (
                                            <option key={op.key} value={op.key}>{`${op.nombreEnCheckout} — ${precioEtiqueta(op.priceCents)}`}</option>
                                        ))}
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                                        <svg className="h-4 w-4 text-zinc-400" viewBox="0 0 16 16" fill="none">
                                            <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Nivel + Fecha en dos columnas */}
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                            <div>
                                <FieldLabel htmlFor="englishLevel">Nivel de inglés *</FieldLabel>
                                <div className="relative">
                                    <select
                                        id="englishLevel"
                                        name="englishLevel"
                                        value={formData.englishLevel}
                                        onChange={handleChange}
                                        className={selectClass}
                                        required
                                    >
                                        <option value="">Selecciona tu nivel</option>
                                        {isLevelAvailable(plan, "Principiante") && <option value="Principiante">Principiante (A1)</option>}
                                        {isLevelAvailable(plan, "Basico") && <option value="Basico">Básico (A2)</option>}
                                        {isLevelAvailable(plan, "Intermedio") && <option value="Intermedio">Intermedio (B1)</option>}
                                        {/* Fusión B2: B2.1 y B2.2 ya no se venden por separado. Los dos
                                            niveles heredados siguen existiendo en el catálogo del backend
                                            para los alumnos que los están cursando, pero no se ofrecen aquí. */}
                                        {isLevelAvailable(plan, "Intermedio alto") && <option value="Intermedio alto">Intermedio alto (B2)</option>}
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                                        <svg className="h-4 w-4 text-zinc-400" viewBox="0 0 16 16" fill="none">
                                            <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {!cohorteLoading && needsCohorte && (
                                <div>
                                    <FieldLabel htmlFor="interestDate">Fecha de inicio *</FieldLabel>
                                    <div className="relative">
                                        <select
                                            id="interestDate"
                                            name="interestDate"
                                            value={formData.interestDate}
                                            onChange={handleChange}
                                            className={selectClass}
                                            required
                                        >
                                            <option value="">Selecciona una fecha</option>
                                            {availableDates.map((date) => (
                                                <option key={date.value} value={date.value}>
                                                    {date.label}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                                            <svg className="h-4 w-4 text-zinc-400" viewBox="0 0 16 16" fill="none">
                                                <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Sin cohorte: en lugar del selector, la promesa de que empieza hoy. */}
                            {!cohorteLoading && !needsCohorte && (
                                <div>
                                    <FieldLabel htmlFor="">Fecha de inicio</FieldLabel>
                                    <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                                        <svg className="h-4 w-4 shrink-0 text-emerald-600" viewBox="0 0 16 16" fill="none">
                                            <path d="M3 8.4l3.2 3.2L13 4.8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                        <span className="text-sm font-semibold text-emerald-800">Empiezas hoy mismo</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Horarios disponibles — solo Premium con fecha seleccionada */}
                        {requiresScheduling(plan) && formData.interestDate && (() => {
                            const dateSlots = premiumSlots.filter(s => s.start_date === formData.interestDate);
                            if (premiumSlotsLoading) return null;
                            if (dateSlots.length === 0) return (
                                <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-500">
                                    <svg className="h-4 w-4 shrink-0 text-zinc-400" viewBox="0 0 16 16" fill="none">
                                        <rect x="2" y="3" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
                                        <path d="M5 2v2M11 2v2M2 7h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                    </svg>
                                    Los horarios para esta fecha se publicarán próximamente
                                </div>
                            );
                            return (
                                <div className="rounded-xl overflow-hidden border border-falu-red-200">
                                    <div className="flex items-center justify-between px-4 py-2.5 bg-falu-red-50 border-b border-falu-red-100">
                                        <p className="text-sm font-semibold text-falu-red-900">Horarios de primera clase</p>
                                        <span className="text-xs text-zinc-400 bg-white border border-zinc-200 px-2 py-0.5 rounded-full">{dateSlots.length} disponibles</span>
                                    </div>
                                    <div className="px-4 py-3 flex flex-wrap gap-2">
                                        {dateSlots.map(slot => {
                                            const { dayName, day, monthName, timeStr, tzAbbr } = buildSlotDisplay(slot.datetime_pt);
                                            return (
                                                <span key={slot.id} className="inline-flex flex-col items-center text-center bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 min-w-[90px]">
                                                    <span className="text-[10px] font-bold uppercase tracking-wide text-falu-red-600">{dayName} {day} {monthName}</span>
                                                    <span className="text-sm font-semibold text-zinc-800 mt-0.5">{timeStr} <span className="text-[10px] text-zinc-400 font-normal">{tzAbbr}</span></span>
                                                </span>
                                            );
                                        })}
                                    </div>
                                    <div className="px-4 py-2 bg-zinc-50 border-t border-zinc-100">
                                        <p className="text-xs text-zinc-400">Seleccionarás tu horario después de confirmar el pago</p>
                                    </div>
                                </div>
                            );
                        })()}

                        {/* Nota de inicio */}
                        <div className="flex items-start gap-2 rounded-xl bg-falu-red-50 border border-falu-red-100 px-4 py-3">
                            <svg className="mt-0.5 h-4 w-4 shrink-0 text-falu-red-500" viewBox="0 0 16 16" fill="none">
                                <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
                                <path d="M8 5v3.5M8 11h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                            </svg>
                            <div>
                                <p className="text-xs font-semibold text-falu-red-900">Importante sobre el inicio</p>
                                {/* Mientras el catálogo carga NO se afirma nada sobre la fecha: el
                                    render del servidor asume cohorte (el default seguro del hook) y
                                    un Essential vería "inicia en la fecha seleccionada" durante unos
                                    cientos de ms antes de que el texto cambie solo. */}
                                {cohorteLoading ? (
                                    <p className="mt-0.5 text-xs text-falu-red-700">
                                        Accede hoy a la plataforma.
                                    </p>
                                ) : needsCohorte ? (
                                    <p className="mt-0.5 text-xs text-falu-red-700">
                                        Accede hoy a la plataforma. Las clases grupales del viernes y sesiones 1:1 (si aplica) inician{" "}
                                        {selectedDateLabel
                                            ? <>el <span className="font-bold">{selectedDateLabel}</span></>
                                            : "en la fecha seleccionada"}.
                                    </p>
                                ) : (
                                    <p className="mt-0.5 text-xs text-falu-red-700">
                                        Tu acceso a la plataforma se activa <span className="font-bold">hoy mismo</span>: no esperas a ninguna fecha de inicio. Las sesiones de práctica en vivo son todos los viernes, así que puedes entrar a la próxima.
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Disclosure de facturación (requerido por Stripe / redes de tarjetas) */}
                        {isSubscription ? (
                            <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3">
                                <p className="text-xs leading-relaxed text-zinc-500">
                                    <span className="font-semibold text-zinc-700">Suscripción:</span>{" "}
                                    Cancela cuando quieras desde{" "}
                                    <a href="/mi-suscripcion" className="font-medium text-falu-red-700 underline underline-offset-2 hover:text-falu-red-800">tu portal de suscripción</a>.
                                </p>
                                <div className="mt-2.5 flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2">
                                    <svg className="h-4 w-4 shrink-0 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                                    </svg>
                                    <span className="text-xs font-semibold text-emerald-800">Reembolso garantizado los primeros 3 días</span>
                                </div>
                            </div>
                        ) : (
                            <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3">
                                <p className="text-xs leading-relaxed text-zinc-500">
                                    <span className="font-semibold text-zinc-700">Pago por periodo (28 días)</span> — al finalizar no hay renovación automática. Si deseas continuar, deberás pagar nuevamente.
                                </p>
                            </div>
                        )}

                        {/* Confirmación de términos + fecha (clickwrap: aceptación activa y registrada) */}
                        <label className={`flex items-start gap-2.5 cursor-pointer select-none rounded-xl border px-4 py-3 transition ${accepted ? "border-falu-red-300 bg-falu-red-50" : "border-zinc-200"}`}>
                            <input
                                type="checkbox"
                                checked={accepted}
                                onChange={(e) => { setAccepted(e.target.checked); setError(""); }}
                                className="mt-0.5 h-4 w-4 shrink-0 rounded border-zinc-300 text-falu-red-700 focus:ring-falu-red-600"
                            />
                            <span className="text-xs leading-relaxed text-zinc-600">
                                Acepto los{" "}
                                <a href="/terminos" target="_blank" rel="noopener noreferrer" className="font-medium text-falu-red-700 underline underline-offset-2 hover:text-falu-red-800">Términos y Condiciones</a>
                                {" "}y la{" "}
                                <a href="/reembolsos" target="_blank" rel="noopener noreferrer" className="font-medium text-falu-red-700 underline underline-offset-2 hover:text-falu-red-800">Política de Reembolso</a>
                                {/* El clickwrap es la aceptación que queda registrada: no puede
                                    afirmar una fecha que todavía no se sabe si existe. Mientras
                                    carga el catálogo se acepta solo lo que es cierto en ambos casos,
                                    y el botón de pago está deshabilitado igualmente. */}
                                {cohorteLoading ? "." : (
                                    <>
                                        , y confirmo que mi Plan {plan}{" "}
                                        {!needsCohorte
                                            ? <>empieza <span className="font-semibold text-zinc-800">hoy mismo</span></>
                                            : selectedDateLabel
                                                ? <>inicia el <span className="font-semibold text-zinc-800">{selectedDateLabel}</span></>
                                                : "inicia en la fecha seleccionada"}.
                                    </>
                                )}
                            </span>
                        </label>

                        {/* Divisor */}
                        <div className="border-t border-zinc-100 pt-2" />

                        {/* CTA */}
                        <button
                            type="submit"
                            disabled={loading || !accepted || cohorteLoading}
                            className="w-full inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold text-white bg-falu-red-700 hover:bg-falu-red-800 active:bg-falu-red-900 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                        >
                            {loading ? (
                                <>
                                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 16 16" fill="none">
                                        <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" strokeDasharray="28" strokeDashoffset="10" strokeLinecap="round" />
                                    </svg>
                                    Procesando...
                                </>
                            ) : (
                                <>
                                    {`Comenzar ${planActual?.nombreEnCheckout ?? plan} — ${precioDelPlan}`}
                                    <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none">
                                        <path stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </>
                            )}
                        </button>

                        {/* Trust badges */}
                        <div className="flex flex-wrap items-center justify-center gap-4 pt-1">
                            <span className="flex items-center gap-1.5 text-xs text-zinc-400">
                                <svg className="h-3.5 w-3.5 text-green-500" viewBox="0 0 16 16" fill="none">
                                    <path d="M8 2l1.5 4.5H14l-3.5 2.5 1.5 4.5L8 11l-4 2.5 1.5-4.5L2 6.5h4.5L8 2z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
                                </svg>
                                Pago seguro vía Stripe
                            </span>
                            <span className="flex items-center gap-1.5 text-xs text-zinc-400">
                                <svg className="h-3.5 w-3.5 text-green-500" viewBox="0 0 16 16" fill="none">
                                    <path d="M13 4L6.5 11 3 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                Sin contratos ni compromisos
                            </span>
                        </div>

                    </form>
                </div>

                {/* Modal de suscripción: confirmar (cambio entre suscripciones) o
                    bloqueado (sub recurrente → Personalizado, que va por soporte) */}
                {subModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/60 px-4">
                        <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
                            <div className="flex flex-col items-center gap-3 rounded-t-2xl bg-amber-50 px-6 py-6 text-center">
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100">
                                    <svg className="h-6 w-6 text-amber-600" viewBox="0 0 20 20" fill="none">
                                        <path d="M10 7v4m0 3h.01M10 2l8 14H2L10 2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </div>
                                <p className="text-base font-bold text-amber-900">
                                    {subModal === "blocked" ? "Coordinemos tu cambio de plan" : "Ya tienes una suscripción activa"}
                                </p>
                            </div>
                            <div className="px-6 py-5 text-sm text-zinc-600">
                                {subModal === "blocked" ? (
                                    <>
                                        <p>
                                            Tienes una suscripción activa al plan <strong>{existingSub?.plan}</strong>.
                                            Para este cambio de plan necesitamos coordinarlo contigo, para que no haya
                                            cobros duplicados ni pierdas el tiempo que ya pagaste.
                                        </p>
                                        <p className="mt-3">
                                            Escríbenos a{" "}
                                            <a href="mailto:info@lz-englishacademy.com" className="font-semibold text-falu-red-700 underline underline-offset-2 hover:text-falu-red-800">info@lz-englishacademy.com</a>{" "}
                                            y te ayudamos.
                                        </p>
                                        <div className="mt-5">
                                            <button
                                                type="button"
                                                onClick={() => setSubModal(null)}
                                                className="w-full rounded-xl bg-falu-red-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-falu-red-800"
                                            >
                                                Entendido
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <p>
                                            Tienes una suscripción activa al plan <strong>{existingSub?.plan}</strong>. Si
                                            continúas con un plan distinto, se cancelará la actual y se te cobrará el nuevo
                                            plan ahora. El cobro inicial de tu plan actual no se reembolsa automáticamente.
                                        </p>
                                        {existingSub?.periodEnd && (
                                            <p className="mt-3 rounded-lg bg-zinc-50 px-3 py-2 text-xs text-zinc-500">
                                                {existingSub.cancelAtPeriodEnd ? "Tu plan actual termina el " : "Tu plan actual está vigente hasta el "}
                                                <strong className="text-zinc-700">
                                                    {new Date(existingSub.periodEnd).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })}
                                                </strong>.
                                            </p>
                                        )}
                                        <div className="mt-5 flex flex-col gap-2 sm:flex-row-reverse">
                                            <button
                                                type="button"
                                                onClick={() => { setSubModal(null); doCheckout(); }}
                                                className="flex-1 rounded-xl bg-falu-red-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-falu-red-800"
                                            >
                                                Continuar de todos modos
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setSubModal(null)}
                                                className="flex-1 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-600 transition hover:bg-zinc-50"
                                            >
                                                Volver
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}
        </div>
    );

    if (embedded) return formContent;

    return (
        <section className="relative py-16 sm:py-20 overflow-hidden bg-zinc-50">
            <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-96 w-96 rounded-full bg-falu-red-200/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 right-0 h-72 w-72 rounded-full bg-yellow-orange-200/15 blur-3xl" />
            <div className="relative mx-auto max-w-2xl px-4 sm:px-6">
                {formContent}
            </div>
        </section>
    );
};

export default PaymentForm;