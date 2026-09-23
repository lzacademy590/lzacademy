"use client";
import { useEffect, useState } from "react";
import { useStartDates } from "../hooks/useStartDates";
import { planPriceDisplay } from "@/app/lib/plans";
import { leerRespuesta, MENSAJE_SATURADO } from "@/app/lib/respuesta-del-backend";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL!;

interface PremiumSlot { id: string; datetime_pt: string; start_date: string; enabled: boolean; }

function ptStringToDate(datetimePt: string): Date {
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
  const tzAbbr = new Intl.DateTimeFormat("en-US", { timeZone: userTz, timeZoneName: "short" })
    .formatToParts(date).find(p => p.type === "timeZoneName")?.value ?? "";
  return {
    dayName: weekdayMap[g("weekday")] ?? g("weekday"),
    day: parseInt(g("day")),
    monthName: monthNames[parseInt(g("month")) - 1],
    timeStr: `${g("hour")}:${g("minute")} ${g("dayPeriod")}`,
    tzAbbr,
  };
}

const LEVELS = [
  { key: "A1", label: "A1 — Principiante", value: "Principiante (A1)" },
  { key: "A2", label: "A2 — Básico", value: "Básico (A2)" },
  { key: "B1", label: "B1 — Intermedio", value: "Intermedio (B1)" },
  { key: "B2", label: "B2 — Intermedio Alto", value: "Intermedio Alto (B2)" },
];

const COUNTRIES = [
  "México", "Colombia", "Honduras", "El Salvador", "Guatemala", "Nicaragua",
  "Costa Rica", "Panamá", "Venezuela", "Ecuador", "Perú", "Bolivia",
  "Argentina", "Chile", "Uruguay", "Paraguay", "República Dominicana",
  "Puerto Rico", "Cuba", "Estados Unidos", "Canadá", "España", "Otro",
];

const inputCls =
  "w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-900 placeholder-zinc-400 transition focus:outline-none focus:ring-2 focus:ring-falu-red-400 focus:border-transparent focus:bg-white";
const selectCls =
  "w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-900 transition focus:outline-none focus:ring-2 focus:ring-falu-red-400 focus:border-transparent focus:bg-white appearance-none cursor-pointer";

export default function PremiumButton() {
  const [step, setStep] = useState<0 | 1 | 2>(0); // 0=closed, 1=level, 2=form
  const [selectedLevel, setSelectedLevel] = useState<(typeof LEVELS)[0] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ email: "", fullName: "", country: "", interestDate: "" });
  const [premiumSlots, setPremiumSlots] = useState<PremiumSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const { dates } = useStartDates();

  useEffect(() => {
    if (!form.interestDate) return;
    setSlotsLoading(true);
    fetch(`${BACKEND_URL}/config/premium-slots`)
      .then(r => r.json())
      .then(data => setPremiumSlots(Array.isArray(data) ? data : []))
      .catch(() => setPremiumSlots([]))
      .finally(() => setSlotsLoading(false));
  }, [form.interestDate]);

  const close = () => {
    setStep(0);
    setSelectedLevel(null);
    setError("");
    setForm({ email: "", fullName: "", country: "", interestDate: "" });
    setLoading(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || !selectedLevel) return;
    if (!form.email || !form.fullName || !form.country || !form.interestDate) {
      setError("Completa todos los campos para continuar.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/create-checkout-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email.trim(),
          fullName: form.fullName.trim(),
          country: form.country,
          plan: "Premium",
          level: selectedLevel.value,
          interestDate: form.interestDate,
          description: `Plan Premium — ${selectedLevel.label}`,
        }),
      });
      const { data, saturado } = await leerRespuesta(res);
      // ⚠️ El 429 del limitador NO viene en JSON: antes reventaba el parseo y
      // caía al catch, que aquí pinta `err.message`. Ver lib/respuesta-del-backend.
      if (saturado) throw new Error(MENSAJE_SATURADO);
      if (!res.ok || !data?.url) throw new Error(data?.error || "No se pudo crear la sesión de pago.");
      window.location.href = data.url;
    } catch (err: any) {
      setError(err.message || "Error al procesar. Intenta nuevamente.");
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setStep(1)}
        className="mt-6 inline-flex w-full items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold text-falu-red-900 bg-white hover:bg-zinc-50 transition shadow-sm cursor-pointer"
      >
        Seleccionar Premium
      </button>

      {step > 0 && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          role="dialog"
          aria-modal="true"
          onClick={close}
        >
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="relative w-full max-w-lg rounded-2xl bg-white shadow-xl ring-1 ring-falu-red-200 p-6 sm:p-8 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                {step === 1 && (
                  <>
                    <h3 className="text-xl font-extrabold text-zinc-900">Elige tu nivel de inglés</h3>
                    <p className="mt-1 text-sm text-zinc-500">Selecciona el nivel que corresponde a tu inglés actual.</p>
                  </>
                )}
                {step === 2 && (
                  <>
                    <button
                      onClick={() => setStep(1)}
                      className="mb-2 flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-600 transition"
                    >
                      <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M10 12L6 8l4-4" />
                      </svg>
                      Cambiar nivel
                    </button>
                    <h3 className="text-xl font-extrabold text-zinc-900">Completa tu inscripción</h3>
                    <div className="mt-1 inline-flex items-center gap-2 rounded-full bg-falu-red-50 px-3 py-1 text-xs font-semibold text-falu-red-800 ring-1 ring-inset ring-falu-red-200">
                      Plan Premium · {selectedLevel?.label}
                    </div>
                  </>
                )}
              </div>
              <button
                onClick={close}
                className="rounded-lg px-2 py-1 text-zinc-500 hover:bg-zinc-100 shrink-0"
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>

            {/* Paso 1 — selector de nivel */}
            {step === 1 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {LEVELS.map((lvl) => (
                  <button
                    key={lvl.key}
                    onClick={() => { setSelectedLevel(lvl); setStep(2); }}
                    className="rounded-xl px-4 py-4 text-sm font-semibold bg-falu-red-700 text-white hover:bg-falu-red-800 transition text-left"
                  >
                    <span className="block text-base">{lvl.key}</span>
                    <span className="block text-xs font-normal opacity-80">{lvl.label.split("— ")[1]}</span>
                  </button>
                ))}
                <p className="col-span-full mt-1 text-xs text-zinc-400">
                  Si no estás seguro, elige el más cercano; podemos ajustarlo después.
                </p>
              </div>
            )}

            {/* Paso 2 — formulario */}
            {step === 2 && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-zinc-700 mb-1.5">Nombre completo *</label>
                  <input
                    type="text"
                    name="fullName"
                    value={form.fullName}
                    onChange={handleChange}
                    placeholder="Tu nombre completo"
                    className={inputCls}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-zinc-700 mb-1.5">Correo electrónico *</label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="tu@correo.com"
                    className={inputCls}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-zinc-700 mb-1.5">País *</label>
                  <div className="relative">
                    <select name="country" value={form.country} onChange={handleChange} className={selectCls} required>
                      <option value="">Selecciona tu país</option>
                      {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                      <svg className="h-4 w-4 text-zinc-400" viewBox="0 0 16 16" fill="none">
                        <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-zinc-700 mb-1.5">Fecha de inicio *</label>
                  <div className="relative">
                    <select name="interestDate" value={form.interestDate} onChange={handleChange} className={selectCls} required>
                      <option value="">Selecciona una fecha</option>
                      {dates.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                      <svg className="h-4 w-4 text-zinc-400" viewBox="0 0 16 16" fill="none">
                        <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  </div>
                </div>

                {form.interestDate && !slotsLoading && (() => {
                  const dateSlots = premiumSlots.filter(s => s.start_date === form.interestDate);
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

                {error && (
                  <p className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading}
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
                    `Proceder al pago — ${planPriceDisplay("Premium")}`
                  )}
                </button>

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
            )}
          </div>
        </div>
      )}
    </>
  );
}
