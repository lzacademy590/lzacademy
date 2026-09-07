"use client";

import { useEffect, useState, useMemo } from "react";
import { useLevelAvailability } from "../hooks/useLevelAvailability";
import { usePlanCohorte } from "../hooks/usePlanCohorte";
import { planesDeCheckout, descripcionDeCheckout } from "@/app/lib/plans";
import { usePlanesDelCatalogo, precioEtiqueta } from "@/app/hooks/usePlanesDelCatalogo";

interface StudentData {
  full_name: string;
  plan: string;
  level: string;
  inscription_date: string | null;
  country: string;
  subscription_status?: string | null;
  current_period_end?: string | null;
  cancel_at_period_end?: boolean;
  has_active_subscription?: boolean;
}

interface SpecialDate {
  value: string;
  label: string;
  special: boolean;
  excludedPlansSpecial?: string[]; // planes excluidos de /pago-estudiantes para esta fecha
}

const MONTH_NAMES_ES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

// Fusión B2: el `level` guardado de un alumno heredado sigue siendo B2.1 o B2.2,
// pero esos niveles ya no se ofrecen. Sin normalizar, el <select> se queda en
// blanco (React no encuentra la opción) mientras el estado conserva el valor
// viejo, así que el guard `if (!level)` no salta y se enviaría el nivel heredado.
// Al B2 partido ya no se entra: cualquier forma de B2 resuelve al nivel único.
const LEGACY_LEVEL_ALIASES: Record<string, string> = {
  "Intermedio alto-gramatica": "Intermedio alto",
  "Intermedio alto-produccion": "Intermedio alto",
};
const normalizeLevel = (level: string) => LEGACY_LEVEL_ALIASES[level] ?? level;

function formatDate(value: string | null): string {
  if (!value) return "No registrada";
  const [year, month, day] = value.split("-");
  return `${parseInt(day, 10)} de ${MONTH_NAMES_ES[parseInt(month, 10) - 1]} de ${year}`;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL!;

const selectClass =
  "w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-900 transition focus:outline-none focus:ring-2 focus:ring-falu-red-400 focus:border-transparent focus:bg-white hover:border-zinc-300 appearance-none cursor-pointer";

export default function PagoEstudiantesPage() {
  const [email, setEmail] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [student, setStudent] = useState<StudentData | null>(null);
  const [verifyError, setVerifyError] = useState("");

  const { isLevelAvailable } = useLevelAvailability();
  const { requiresCohort, loading: cohorteLoading } = usePlanCohorte();
  /*
    ⚠️ **La lista de planes sale del CATÁLOGO, no de una constante.** Con
    `CHECKOUT_PLAN_KEYS` un plan abierto en el admin no aparecía aquí aunque el
    backend ya supiera cobrarlo: la API lo aceptaba y el formulario no lo ofrecía.
    Mientras el catálogo viaja, `planesDeCheckout(null)` devuelve los de siempre.
  */
  const catalogo = usePlanesDelCatalogo();
  const planesCheckout = useMemo(() => planesDeCheckout(catalogo), [catalogo]);
  const [plan, setPlan] = useState("Essential");
  const [level, setLevel] = useState("");
  const [interestDate, setInterestDate] = useState("");
  const [specialDates, setSpecialDates] = useState<SpecialDate[]>([]);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [subModal, setSubModal] = useState<null | "confirm" | "alert" | "blocked">(null);
  // Essential empieza el mismo día del pago: no elige fecha ni la envía.
  const needsCohorte = requiresCohort(plan);

  // Código de descuento (solo para planes elegibles). Quién lo es sale de
  // `planesDeCheckout`, que lo DERIVA de `recurring`: el backend rechaza
  // descuentos en suscripciones (`DISCOUNTS_FOR_SUBSCRIPTIONS = false`).
  const [discountCode, setDiscountCode] = useState("");
  const [validatingDiscount, setValidatingDiscount] = useState(false);
  const [discountError, setDiscountError] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<{ code: string; label: string; discountedAmount: number } | null>(null);

  // Si el nivel deja de estar disponible para el plan, se limpia. Mismo patrón que
  // Form.tsx. Hace falta un efecto y no basta con validar en el prellenado, porque
  // useLevelAvailability arranca con los defaults de plans.ts y solo después llega
  // la config real: un nivel prellenado puede volverse no disponible a media carga.
  // Sin esto el <select> se queda en blanco (React no encuentra la opción) mientras
  // el estado conserva el valor, el guard `if (!level)` no salta y se envía igual.
  useEffect(() => {
    if (level && !isLevelAvailable(plan, level)) setLevel("");
  }, [plan, level, isLevelAvailable]);

  useEffect(() => {
    if (!student) return;
    fetch(`${BACKEND_URL}/config/special-dates`)
      .then((r) => r.json())
      .then((data) => setSpecialDates(Array.isArray(data) ? data : []))
      .catch(() => setSpecialDates([]));
  }, [student]);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || verifying) return;
    setVerifying(true);
    setVerifyError("");
    try {
      const res = await fetch(`${BACKEND_URL}/verify-student`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.found) {
        setVerifyError("No encontramos ninguna cuenta con ese correo. Esta ruta es exclusiva para estudiantes actuales.");
        return;
      }
      setStudent(data.user);
      setPlan(data.user.plan || "Essential");
      setLevel(normalizeLevel(data.user.level || ""));
    } catch {
      setVerifyError("Error al verificar. Intenta nuevamente.");
    } finally {
      setVerifying(false);
    }
  }

  async function handleApplyDiscount() {
    const code = discountCode.trim();
    if (!code || validatingDiscount) return;
    setValidatingDiscount(true);
    setDiscountError("");
    try {
      const res = await fetch(`${BACKEND_URL}/validate-discount`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, plan }),
      });
      const data = await res.json();
      if (data.valid) {
        setAppliedDiscount({ code: data.code, label: data.label, discountedAmount: data.discountedAmount });
        setDiscountError("");
      } else {
        setAppliedDiscount(null);
        setDiscountError(data.reason || "Código no válido.");
      }
    } catch {
      setAppliedDiscount(null);
      setDiscountError("No pudimos validar el código. Intenta de nuevo.");
    } finally {
      setValidatingDiscount(false);
    }
  }

  async function doCheckout() {
    setCheckoutLoading(true);
    setFormError("");
    try {
      const res = await fetch(`${BACKEND_URL}/student-checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          plan,
          level,
          // Sin cohorte no se manda fecha (el backend además la descarta).
          interestDate: needsCohorte ? interestDate : "",
          interestDateLabel: needsCohorte
            ? (futureDates.find((d) => d.value === interestDate)?.label ?? "")
            : "",
          description: descripcionDeCheckout(planActual),
          discountCode: appliedDiscount ? appliedDiscount.code : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        // Plan sin cupos: mensaje claro en vez del error genérico de pago.
        if (res.status === 409 && data?.code === "PLAN_SOLD_OUT") {
          setFormError("Este plan ya no tiene cupos disponibles.");
          setCheckoutLoading(false);
          return;
        }
        throw new Error(data?.error || "Error");
      }
      window.location.href = data.url;
    } catch (err) {
      setFormError(err instanceof Error && err.message !== "Error"
        ? err.message
        : "No pudimos iniciar tu pago. Intenta nuevamente.");
      setCheckoutLoading(false);
    }
  }

  async function handleCheckout(e: React.FormEvent) {
    e.preventDefault();
    if (!level) { setFormError("Selecciona tu nivel de inglés."); return; }
    // La fecha solo se exige a los planes que van por cohorte. Essential empieza
    // el mismo día del pago, así que su recompra no depende de que haya una fecha
    // especial abierta.
    if (needsCohorte && !interestDate) { setFormError("Selecciona una fecha de inicio."); return; }
    setFormError("");
    // Con suscripción recurrente viva:
    //  - Personalizado (pago único) → alerta (se permite, pero la sub no se cancela sola)
    //  - Downgrade (a un plan menor) → soporte (se agenda al fin del periodo)
    //  - Upgrade o mismo plan → confirmación normal (cambio inmediato)
    if (student?.has_active_subscription) {
      const RANK: Record<string, number> = { Essential: 1, Premium: 2 };
      const cur = student.plan, sel = plan;
      const isDowngrade = !!RANK[sel] && !!RANK[cur] && RANK[sel] < RANK[cur];
      setSubModal(sel === "Personalizado" || sel === "Fluidez" ? "alert" : isDowngrade ? "blocked" : "confirm");
      return;
    }
    await doCheckout();
  }

  // ─── Step 1: Email input ───────────────────────────────────────────────────
  if (!student) {
    return (
      <main className="min-h-screen bg-zinc-50 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">

          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-zinc-800 mb-5 shadow-lg">
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
            </div>
            <h1 className="text-2xl font-extrabold text-zinc-900">Área de estudiantes</h1>
            <p className="mt-2 text-sm text-zinc-500 max-w-xs mx-auto">
              Esta ruta es exclusiva para estudiantes actuales de LZ English Academy.
            </p>
          </div>

          <div className="rounded-2xl bg-white shadow-sm ring-1 ring-zinc-200 overflow-hidden">
            <div className="h-1.5 w-full bg-linear-to-r from-falu-red-700 via-falu-red-500 to-yellow-orange-400" />
            <form onSubmit={handleVerify} className="p-6 sm:p-8 space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-zinc-700 mb-1.5">
                  Correo electrónico
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setVerifyError(""); }}
                  placeholder="tu@correo.com"
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-900 placeholder-zinc-400 transition focus:outline-none focus:ring-2 focus:ring-falu-red-400 focus:border-transparent focus:bg-white hover:border-zinc-300"
                  required
                  autoComplete="email"
                />
              </div>

              {verifyError && (
                <div className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3">
                  <svg className="mt-0.5 h-4 w-4 shrink-0 text-red-500" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M8 5v3.5M8 11h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  <p className="text-sm text-red-600">{verifyError}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={verifying || !email.trim()}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold text-white bg-zinc-800 hover:bg-zinc-900 active:bg-zinc-950 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {verifying ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 16 16" fill="none">
                      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" strokeDasharray="28" strokeDashoffset="10" strokeLinecap="round" />
                    </svg>
                    Verificando...
                  </>
                ) : (
                  <>
                    Verificar acceso
                    <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none">
                      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </main>
    );
  }

  // ─── Step 2: Student card + plan selection ─────────────────────────────────
  // Fusión B2: se ofrece el nivel único. Los alumnos heredados llegan aquí con su
  // B2.1/B2.2 ya convertido a "Intermedio alto" por normalizeLevel.
  const ALL_LEVELS = [
    { value: "Principiante", label: "Principiante (A1)" },
    { value: "Basico", label: "Básico (A2)" },
    { value: "Intermedio", label: "Intermedio (B1)" },
    { value: "Intermedio alto", label: "Intermedio alto (B2)" },
  ];
  const availableLevels = ALL_LEVELS.filter((l) => isLevelAvailable(plan, l.value));

  // "Hoy" en la zona horaria local del usuario (YYYY-MM-DD), no en UTC: cada fecha
  // sigue disponible hasta las 11:59pm de la zona del usuario.
  const today = new Intl.DateTimeFormat("sv-SE").format(new Date());
  // Solo fechas futuras y que no excluyan el plan seleccionado en /pago-estudiantes.
  const futureDates = specialDates
    .filter((d) => d.value >= today)
    .filter((d) => !(d.excludedPlansSpecial ?? []).includes(plan));

  // Suscripción recurrente y elegibilidad de descuentos según el catálogo único.
  const planActual = planesCheckout.find((p) => p.key === plan);
  const isSubscription = planActual?.recurring ?? false;
  const showDiscount = planActual?.discountable ?? false;
  /*
    ⚠️ **Se reusa `precioEtiqueta`, que ya pone el "$".** Aquí había un formateador
    local que devolvía el número pelado, así que con un descuento aplicado el botón
    decía "Ir al pago seguro — 45" mientras el precio tachado justo al lado sí
    llevaba "$50": el mismo importe con dos formatos, en la pantalla del pago. Dos
    funciones para formatear un precio es exactamente como divergen.
    (Revisión del PR #12.)
  */
  const formatPrice = (cents: number) => precioEtiqueta(cents);
  /*
    ⚠️ Sin plan resuelto se pinta cadena vacía, NO "$0": mientras el catálogo
    viaja hay un instante sin `planActual`, y un cero en el precio de un checkout
    se lee como gratis. El hueco se lee como "cargando", que es la verdad.
  */
  const precioDelPlan = planActual ? precioEtiqueta(planActual.priceCents) : "";
  const displayPrice = appliedDiscount ? formatPrice(appliedDiscount.discountedAmount) : precioDelPlan;

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-12">
      <div className="w-full max-w-lg mx-auto space-y-4">

        {/* Student identity card */}
        <div className="rounded-2xl bg-zinc-800 shadow-md overflow-hidden">
          <div className="px-6 py-5 flex items-center gap-4">
            <div className="shrink-0 w-12 h-12 rounded-full bg-zinc-600 flex items-center justify-center text-white font-bold text-lg select-none">
              {getInitials(student.full_name)}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="text-white font-bold text-base truncate">{student.full_name}</p>
                <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full px-2 py-0.5">
                  <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Verificado
                </span>
              </div>
              <p className="text-zinc-400 text-xs truncate">{email}</p>
            </div>
          </div>

          <div className="border-t border-zinc-700 px-6 py-4 grid grid-cols-3 gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-0.5">Plan actual</p>
              <p className="text-sm font-semibold text-zinc-200">{student.plan || "—"}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-0.5">Nivel</p>
              <p className="text-sm font-semibold text-zinc-200">{student.level || "—"}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-0.5">Último inicio</p>
              <p className="text-sm font-semibold text-zinc-200">{formatDate(student.inscription_date)}</p>
            </div>
          </div>
        </div>

        {/* Selection form */}
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-zinc-200 overflow-hidden">
          <div className="h-1.5 w-full bg-linear-to-r from-falu-red-700 via-falu-red-500 to-yellow-orange-400" />

          <form onSubmit={handleCheckout} className="p-6 sm:p-8 space-y-5">
            <div>
              <p className="text-base font-bold text-zinc-900">Nuevo ciclo de inscripción</p>
              <p className="text-sm text-zinc-500 mt-0.5">Selecciona tu plan, nivel y fecha para este ciclo.</p>
            </div>

            {/* Plan */}
            <div>
              <label htmlFor="plan" className="block text-sm font-semibold text-zinc-700 mb-1.5">Plan</label>
              <div className="relative">
                <select
                  id="plan"
                  value={plan}
                  onChange={(e) => {
                    const newPlan = e.target.value;
                    setPlan(newPlan);
                    if (level && !isLevelAvailable(newPlan, level)) {
                      setLevel("");
                    }
                    // Si la fecha elegida queda excluida para el nuevo plan, resetearla.
                    if (interestDate) {
                      const d = specialDates.find((s) => s.value === interestDate);
                      if (d && (d.excludedPlansSpecial ?? []).includes(newPlan)) {
                        setInterestDate("");
                      }
                    }
                    // El descuento depende del plan: al cambiarlo se invalida.
                    setAppliedDiscount(null);
                    setDiscountError("");
                    setFormError("");
                  }}
                  className={selectClass}
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
              {isSubscription && (
                <p className="mt-1.5 text-xs text-zinc-400">Facturación automática cada 4 semanas</p>
              )}
            </div>

            {/* Level */}
            <div>
              <label htmlFor="level" className="block text-sm font-semibold text-zinc-700 mb-1.5">Nivel de inglés</label>
              <div className="relative">
                <select
                  id="level"
                  value={level}
                  onChange={(e) => { setLevel(e.target.value); setFormError(""); }}
                  className={selectClass}
                  required
                >
                  <option value="">Selecciona tu nivel</option>
                  {availableLevels.map((l) => (
                    <option key={l.value} value={l.value}>{l.label}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                  <svg className="h-4 w-4 text-zinc-400" viewBox="0 0 16 16" fill="none">
                    <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Special dates — solo para los planes que van por cohorte */}
            <div>
              <label htmlFor="interestDate" className="block text-sm font-semibold text-zinc-700 mb-1.5">Fecha de inicio</label>
              {cohorteLoading ? (
                <div className="h-[46px] rounded-xl border border-zinc-200 bg-zinc-50" aria-hidden="true" />
              ) : !needsCohorte ? (
                <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                  <svg className="h-4 w-4 shrink-0 text-emerald-600" viewBox="0 0 16 16" fill="none">
                    <path d="M3 8.4l3.2 3.2L13 4.8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="text-sm font-semibold text-emerald-800">Empiezas hoy mismo</span>
                </div>
              ) : futureDates.length === 0 ? (
                <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-500">
                  <svg className="h-4 w-4 shrink-0 text-zinc-400" viewBox="0 0 16 16" fill="none">
                    <rect x="2" y="3" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M5 2v2M11 2v2M2 7h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  No hay fechas especiales disponibles en este momento. Contacta a tu instructora.
                </div>
              ) : (
                <div className="relative">
                  <select
                    id="interestDate"
                    value={interestDate}
                    onChange={(e) => { setInterestDate(e.target.value); setFormError(""); }}
                    className={selectClass}
                    required
                  >
                    <option value="">Selecciona una fecha</option>
                    {futureDates.map((d) => (
                      <option key={d.value} value={d.value}>{d.label}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                    <svg className="h-4 w-4 text-zinc-400" viewBox="0 0 16 16" fill="none">
                      <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>
              )}
            </div>

            {/* Código de descuento (solo planes elegibles) */}
            {showDiscount && (
              <div>
                <label htmlFor="discount" className="block text-sm font-semibold text-zinc-700 mb-1.5">
                  Código de descuento <span className="font-normal text-zinc-400">(opcional)</span>
                </label>
                {appliedDiscount ? (
                  <div className="flex items-center justify-between gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <svg className="h-4 w-4 shrink-0 text-emerald-600" viewBox="0 0 16 16" fill="none">
                        <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <p className="text-sm text-emerald-700 truncate">
                        <span className="font-mono font-semibold">{appliedDiscount.code}</span> · {appliedDiscount.label}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setAppliedDiscount(null); setDiscountCode(""); setDiscountError(""); }}
                      className="shrink-0 text-xs font-medium text-zinc-500 hover:text-red-500 transition"
                    >
                      Quitar
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      id="discount"
                      type="text"
                      value={discountCode}
                      onChange={(e) => { setDiscountCode(e.target.value.toUpperCase()); setDiscountError(""); }}
                      placeholder="Ingresa tu código"
                      className="flex-1 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-mono uppercase text-zinc-900 placeholder-zinc-400 transition focus:outline-none focus:ring-2 focus:ring-falu-red-400 focus:border-transparent focus:bg-white hover:border-zinc-300"
                    />
                    <button
                      type="button"
                      onClick={handleApplyDiscount}
                      disabled={validatingDiscount || !discountCode.trim()}
                      className="shrink-0 inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white bg-zinc-800 hover:bg-zinc-900 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {validatingDiscount ? (
                        <svg className="h-4 w-4 animate-spin" viewBox="0 0 16 16" fill="none">
                          <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" strokeDasharray="28" strokeDashoffset="10" strokeLinecap="round" />
                        </svg>
                      ) : "Aplicar"}
                    </button>
                  </div>
                )}
                {discountError && <p className="mt-1.5 text-xs text-red-600">{discountError}</p>}
              </div>
            )}

            {formError && (
              <div className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3">
                <svg className="mt-0.5 h-4 w-4 shrink-0 text-red-500" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M8 5v3.5M8 11h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                <p className="text-sm text-red-600">{formError}</p>
              </div>
            )}

            {/* Disclosure de facturación (requerido por Stripe / redes de tarjetas) */}
            {isSubscription ? (
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3">
                <p className="text-xs leading-relaxed text-zinc-500">
                  <span className="font-semibold text-zinc-700">Suscripción:</span>{" "}
                  se te cobrará {precioDelPlan} cada 4 semanas de forma automática hasta que canceles.
                  Cancela cuando quieras escribiendo a{" "}
                  <a href="mailto:info@lz-englishacademy.com" className="font-medium text-falu-red-700 underline underline-offset-2 hover:text-falu-red-800">info@lz-englishacademy.com</a>;
                  conservas acceso hasta el final del periodo ya pagado.
                </p>
                <p className="mt-1.5 text-xs leading-relaxed text-zinc-500">
                  Reembolso completo si cancelas antes de iniciar tus clases o dentro de los primeros 3 días.
                </p>
                <p className="mt-1.5 text-xs text-zinc-400">
                  <a href="/terminos" className="underline underline-offset-2 hover:text-zinc-600">Términos y Condiciones</a>
                  <span className="mx-1.5 opacity-50">·</span>
                  <a href="/reembolsos" className="underline underline-offset-2 hover:text-zinc-600">Política de Reembolso</a>
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3">
                <p className="text-xs leading-relaxed text-zinc-500">
                  <span className="font-semibold text-zinc-700">Pago por periodo (28 días)</span> — al finalizar no hay renovación automática. Si deseas continuar, deberás pagar nuevamente.
                </p>
                <p className="mt-1.5 text-xs text-zinc-400">
                  <a href="/terminos" className="underline underline-offset-2 hover:text-zinc-600">Términos y Condiciones</a>
                  <span className="mx-1.5 opacity-50">·</span>
                  <a href="/reembolsos" className="underline underline-offset-2 hover:text-zinc-600">Política de Reembolso</a>
                </p>
              </div>
            )}

            <div className="border-t border-zinc-100 pt-2" />

            <button
              type="submit"
              // La falta de fechas especiales solo puede bloquear a los planes que
              // van por cohorte. Sin este matiz, un Essential veía "Empiezas hoy
              // mismo" y el botón de pago muerto, porque hoy no hay ninguna fecha
              // `special` futura abierta.
              disabled={checkoutLoading || cohorteLoading || (needsCohorte && futureDates.length === 0)}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold text-white bg-falu-red-700 hover:bg-falu-red-800 active:bg-falu-red-900 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {checkoutLoading ? (
                <>
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" strokeDasharray="28" strokeDashoffset="10" strokeLinecap="round" />
                  </svg>
                  Procesando...
                </>
              ) : (
                <>
                  Ir al pago seguro —{" "}
                  {appliedDiscount ? (
                    <span className="inline-flex items-center gap-1.5">
                      <span className="line-through opacity-60">{precioDelPlan}</span>
                      <span>{displayPrice}</span>
                    </span>
                  ) : (
                    displayPrice
                  )}
                  <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none">
                    <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </>
              )}
            </button>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-1">
              <span className="flex items-center gap-1.5 text-xs text-zinc-400">
                <svg className="h-3.5 w-3.5 text-green-500" viewBox="0 0 16 16" fill="none">
                  <path d="M13 4L6.5 11 3 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Pago seguro vía Stripe
              </span>
              <span className="flex items-center gap-1.5 text-xs text-zinc-400">
                <svg className="h-3.5 w-3.5 text-green-500" viewBox="0 0 16 16" fill="none">
                  <path d="M13 4L6.5 11 3 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Confirmación enviada por correo
              </span>
            </div>
          </form>
        </div>

        <button
          onClick={() => { setStudent(null); setEmail(""); setVerifyError(""); }}
          className="w-full text-center text-xs text-zinc-400 hover:text-zinc-600 transition py-2"
        >
          ← Usar otro correo
        </button>
      </div>

      {/* Modal de suscripción: confirmar (cambio entre suscripciones) o bloqueado
          (sub recurrente → Personalizado, que va por soporte) */}
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
                {subModal === "blocked"
                  ? "Coordinemos tu cambio de plan"
                  : subModal === "alert"
                    ? "Antes de continuar con Personalizado"
                    : "Ya tienes una suscripción activa"}
              </p>
            </div>
            <div className="px-6 py-5 text-sm text-zinc-600">
              {subModal === "blocked" ? (
                <>
                  <p>
                    Tienes una suscripción activa al plan <strong>{student?.plan}</strong>. Para bajar de
                    plan necesitamos coordinarlo contigo y que aplique al final de tu periodo actual, así
                    no pierdes el tiempo que ya pagaste.
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
              ) : subModal === "alert" ? (
                <>
                  <p>
                    Tienes una suscripción activa al plan <strong>{student?.plan}</strong>. El plan
                    Personalizado es un pago único y <strong>no cancela tu suscripción automáticamente</strong>.
                  </p>
                  {student?.current_period_end && (
                    <p className="mt-2">
                      Tu suscripción {student?.plan} seguirá {student.cancel_at_period_end ? "vigente hasta el " : "activa y cobrando hasta el "}
                      <strong>{new Date(student.current_period_end).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })}</strong>.
                    </p>
                  )}
                  <p className="mt-2">
                    Para no pagar ambos planes, cancela tu suscripción actual escribiéndonos a{" "}
                    <a href="mailto:info@lz-englishacademy.com" className="font-semibold text-falu-red-700 underline underline-offset-2 hover:text-falu-red-800">info@lz-englishacademy.com</a>.
                    Si continúas, se te cobrará el plan Personalizado ahora.
                  </p>
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
              ) : (
                <>
                  <p>
                    Tienes una suscripción activa al plan <strong>{student?.plan}</strong>. Si continúas con
                    un plan distinto, se cancelará la actual y se te cobrará el nuevo plan ahora. El cobro
                    inicial de tu plan actual no se reembolsa automáticamente.
                  </p>
                  {student?.current_period_end && (
                    <p className="mt-3 rounded-lg bg-zinc-50 px-3 py-2 text-xs text-zinc-500">
                      {student.cancel_at_period_end ? "Tu plan actual termina el " : "Tu plan actual está vigente hasta el "}
                      <strong className="text-zinc-700">
                        {new Date(student.current_period_end).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })}
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
    </main>
  );
}
