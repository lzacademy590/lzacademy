"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getPlan, esPlanQueRenueva, pideHorario, planLabel } from "@/app/lib/plans";
import { usePlanesDelCatalogo } from "@/app/hooks/usePlanesDelCatalogo";
import { usePlanCohorte } from "@/app/hooks/usePlanCohorte";

interface PremiumSlot { id: string; datetime_pt: string; enabled: boolean; }

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
    const weekdayMap: Record<string, string> = { Sun:"Domingo", Mon:"Lunes", Tue:"Martes", Wed:"Miércoles", Thu:"Jueves", Fri:"Viernes", Sat:"Sábado" };
    const monthNames = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
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

function ptDatetimeToISO(datetimePt: string): string {
    const datePart = datetimePt.split("T")[0];
    const testDate = new Date(`${datePart}T12:00:00Z`);
    const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: "America/Los_Angeles",
        timeZoneName: "shortOffset",
    } as Intl.DateTimeFormatOptions).formatToParts(testDate);
    const tzName = parts.find(p => p.type === "timeZoneName")?.value ?? "GMT-7";
    const match  = tzName.match(/GMT([+-]\d+)/);
    const offsetHours = match ? parseInt(match[1]) : -7;
    const sign = offsetHours >= 0 ? "+" : "-";
    const absOffset = Math.abs(offsetHours);
    return `${datetimePt}:00${sign}${String(absOffset).padStart(2, "0")}:00`;
}

// Colores del chip de plan: vienen del catálogo único (app/lib/plans.ts).
const FALLBACK_CHIP = { color: "#0369a1", bg: "#f0f9ff", border: "#bae6fd" };

type UiState = "loading" | "success" | "error";

const SuccessContent = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    // `loading` sí se consume aquí, al revés que en el checkout. El hook falla
    // CERRADO (sin datos, todos los planes llevan cohorte), que es la dirección
    // correcta al comprar —protege de que un Premium pague sin fecha— pero la
    // equivocada en esta pantalla: durante los primeros milisegundos le pintaría a
    // un Essential un "Inicio: ‹fecha vieja›" que luego desaparece. Es mejor no
    // enseñar fecha un instante que enseñar la equivocada y retirarla.
    const { requiresCohort, loading: cohorteLoading } = usePlanCohorte();
    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
    const session_id = useMemo(() => searchParams.get("session_id"), [searchParams]);

    const [state, setState] = useState<UiState>("loading");
    const [userData, setUserData] = useState<any>(null);
    const [schedulingStatus, setSchedulingStatus] = useState<string | null>(null);
    const [amount, setAmount] = useState<number | null>(null);
    const [errorMsg, setErrorMsg] = useState("");
    const [visible, setVisible] = useState(false);
    const [contactMessage, setContactMessage] = useState("En las próximas 24 horas nuestro equipo te contactará con todos los detalles.");
    const [skipSlot, setSkipSlot]       = useState(false);
    const [slots, setSlots]             = useState<PremiumSlot[]>([]);
    const [slotsLoading, setSlotsLoading] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
    const [bookingSlot, setBookingSlot] = useState(false);

    useEffect(() => {
        if (!session_id || !session_id.startsWith("cs_")) {
            setState("error");
            setErrorMsg("El identificador de pago no es válido.");
            setTimeout(() => setVisible(true), 100);
            return;
        }

        const verify = async () => {
            try {
                const res = await fetch(`${BACKEND_URL}/payment-status?session_id=${session_id}`);
                const data = await res.json();
                if (!res.ok) throw new Error(data?.error || "No se pudo verificar el pago");
                if (!data?.paid) throw new Error("El pago aún no está confirmado.");
                setUserData(data.user || null);
                setSchedulingStatus(data.scheduling_status ?? null);
                setAmount(data.amount ?? null);
                setState("success");
            } catch (err: any) {
                setState("error");
                setErrorMsg(err?.message || "Intenta nuevamente o contáctanos si el problema persiste.");
            } finally {
                setTimeout(() => setVisible(true), 80);
            }
        };

        verify();
        fetch(`${BACKEND_URL}/config/content`)
            .then(r => r.json())
            .then(d => { if (d.success_contact_message) setContactMessage(d.success_contact_message); })
            .catch(() => {});
    }, [session_id]);

    const catalogo = usePlanesDelCatalogo();
    const pideSuHorario = pideHorario(catalogo, userData?.plan ?? "");
    const isPremiumPending = state === "success" && schedulingStatus === "pending";
    const isPremiumBooked  = state === "success" && pideSuHorario && schedulingStatus === "completed";
    // Del catálogo, no de la lista de cuatro: ver `esPlanQueRenueva`.
    const isSubscription = esPlanQueRenueva(catalogo, userData?.plan ?? "");

    const nextChargeDate = isSubscription && userData?.current_period_end
        ? new Date(userData.current_period_end).toLocaleDateString("es-ES", {
            day: "numeric", month: "long", year: "numeric", timeZone: "UTC",
          })
        : null;

    const accessEndDate = !isSubscription && userData?.inscription_date
        ? (() => {
            const d = new Date(userData.inscription_date + "T00:00:00Z");
            d.setUTCDate(d.getUTCDate() + 28);
            return d.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
          })()
        : null;
    const planMeta = getPlan(userData?.plan)?.chip ?? FALLBACK_CHIP;
    const firstName = userData?.full_name?.split(" ")[0] ?? null;

    /**
     * Fecha de inicio a ENSEÑAR, o null si a este plan no le corresponde ninguna.
     *
     * ⚠️ El guard de `requiresCohort` es la pieza que faltaba: sin él esta misma
     * pantalla se contradecía a sí misma —cuatro centímetros más arriba le dice a
     * un Essential "te enviamos los accesos hoy mismo" y aquí le pintaba un chip
     * "Inicio: 21 de septiembre"—. Alimenta los DOS sitios donde se enseña la
     * fecha (el chip de la cabecera y la tarjeta del resumen).
     *
     * A quién le pasaba de verdad: una compra NUEVA de Essential guarda
     * `inscription_date = null` (el servidor la normaliza antes de escribirla), así
     * que el chip ni se pintaba. El caso real es la cuenta creada ANTES del cambio
     * que vuelve a comprar: conserva su fecha vieja y la vería anunciada como su
     * inicio, justo debajo del texto que le dice que empieza hoy.
     */
    const formattedStartDate =
        userData?.inscription_date && !cohorteLoading && requiresCohort(userData?.plan ?? "")
        ? new Date(userData.inscription_date + "T00:00:00Z").toLocaleDateString("es-ES", {
            day: "numeric", month: "long", year: "numeric", timeZone: "UTC",
          })
        : null;

    useEffect(() => {
        /*
          ⚠️⚠️ **Aquí ponía `userData?.plan !== "Premium"`**, un literal, mientras
          doce líneas más arriba la misma pregunta se contestaba con la bandera. O
          sea: el plan estaba escrito a mano DOS veces, y la que decidía si se
          carga el selector de horarios era la peor de las dos. Con eso, ningún
          plan que no se llame exactamente "Premium" —incluido cualquiera abierto
          en Admin › Planes— llegaba a ver la pantalla donde se elige la clase.
        */
        /*
          ⚠️⚠️ **El selector se decide por `scheduling_status`, no por el catálogo
          vivo.** `"pending"` solo se escribe cuando el plan COMPRADO pedía
          horario, así que ya es la respuesta congelada en el momento del pago.
          Preguntándole además al catálogo, un cambio del admin entre la compra y
          esta pantalla dejaba al alumno en `pending` y SIN selector: pagó, se le
          debe una clase, y no tiene ninguna vía para elegirla.

          (El caso `completed` de abajo sí sigue mirando el catálogo: ahí lo peor
          que pasa es no pintar una confirmación, no dejar a nadie colgado.)
        */
        if (state !== "success" || schedulingStatus !== "pending") return;
        const inscriptionDate = userData?.inscription_date ?? null;
        setSlotsLoading(true);
        // Por plan: un horario sin `plan` declarado sigue valiendo para todos.
        fetch(`${BACKEND_URL}/config/premium-slots?plan=${encodeURIComponent(userData?.plan ?? "")}`)
            .then(r => r.json())
            .then(data => {
                const all: PremiumSlot[] = Array.isArray(data) ? data : [];
                setSlots(inscriptionDate ? all.filter(s => (s as any).start_date === inscriptionDate) : all);
            })
            .catch(() => setSlots([]))
            .finally(() => setSlotsLoading(false));
        // ⚠️ `pideSuHorario` NO va en las dependencias, y es deliberado: este
        // efecto NO consulta el catálogo —lo explica el comentario de arriba— así
        // que tenerlo aquí solo forzaba un refetch de los horarios cada vez que el
        // catálogo llegaba. El código contradecía a su propio comentario. Lo
        // señaló la revisión del PR #14.
    }, [state, userData?.plan, userData?.inscription_date, schedulingStatus]);

    const handleConfirmSlot = async () => {
        if (!selectedSlot) return;
        setBookingSlot(true);
        try {
            await fetch(`${BACKEND_URL}/mark-scheduled`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ session_id, session_datetime: ptDatetimeToISO(selectedSlot) }),
            });
            setSchedulingStatus("completed");
        } catch (_) {}
        setBookingSlot(false);
    };

    const steps = [
        {
            title: "Confirmación enviada",
            desc: "Te mandamos el comprobante de pago a tu correo registrado.",
        },
        {
            title: "Te contactamos",
            desc: contactMessage,
        },
        {
            title: "Recibirás tus accesos",
            // Sin cohorte no hay "fecha de inicio" que esperar. Esta cadena no
            // interpolaba ninguna fecha, así que no aparecía en las búsquedas por
            // `inscription_date` — y es justo la que el alumno lee después de pagar.
            desc: requiresCohort(userData?.plan ?? "")
                ? "Te enviamos los accesos a la plataforma antes de tu fecha de inicio."
                : "Te enviamos los accesos a la plataforma hoy mismo, para que puedas empezar ya.",
        },
    ];

    const premiumSteps = [
        { title: "Selecciona tu horario", desc: "Elige entre los horarios disponibles para tu primera clase Premium." },
        ...steps,
    ];

    const displaySteps = (isPremiumPending && !skipSlot) ? premiumSteps : steps;

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
                *, *::before, *::after { box-sizing: border-box; }

                .sc-root {
                    min-height: 100vh;
                    background: #faf8f5;
                    background-image: radial-gradient(circle at 1px 1px, rgba(156,24,29,0.055) 1px, transparent 0);
                    background-size: 26px 26px;
                    display: flex;
                    align-items: flex-start;
                    justify-content: center;
                    padding: 48px 16px 72px;
                    font-family: 'DM Sans', sans-serif;
                    position: relative;
                }
                .sc-glow {
                    position: fixed; border-radius: 50%; filter: blur(120px);
                    pointer-events: none; z-index: 0;
                }
                .sc-glow-1 {
                    width: 640px; height: 640px;
                    background: radial-gradient(circle, rgba(156,24,29,0.07) 0%, transparent 65%);
                    top: -180px; left: -160px;
                }
                .sc-glow-2 {
                    width: 500px; height: 500px;
                    background: radial-gradient(circle, rgba(251,176,59,0.07) 0%, transparent 65%);
                    bottom: -80px; right: -100px;
                }

                /* ── Card ── */
                .sc-card {
                    position: relative; z-index: 1;
                    width: 100%; max-width: 580px;
                    background: #ffffff;
                    border-radius: 24px;
                    box-shadow:
                        0 0 0 1px rgba(0,0,0,0.06),
                        0 4px 8px rgba(0,0,0,0.04),
                        0 24px 64px rgba(0,0,0,0.08);
                    overflow: hidden;
                    opacity: 0;
                    transform: translateY(20px);
                    transition: opacity 0.5s cubic-bezier(.22,1,.36,1), transform 0.5s cubic-bezier(.22,1,.36,1);
                }
                .sc-card.sc-wide { max-width: 720px; }
                .sc-card.visible { opacity: 1; transform: translateY(0); }

                /* Top accent bar */
                .sc-bar {
                    height: 4px;
                    background: linear-gradient(90deg, #9c181d 0%, #bd181e 40%, #fbb03b 100%);
                }

                /* ── Hero ── */
                .sc-hero {
                    background: linear-gradient(160deg, #ffffff 0%, #fef2f2 70%, #fff8eb 100%);
                    border-bottom: 1px solid #ffe1e2;
                    padding: 36px 40px 32px;
                    text-align: center;
                    position: relative;
                    overflow: hidden;
                }
                .sc-hero::before {
                    content: '';
                    position: absolute;
                    top: -60px; left: 50%;
                    transform: translateX(-50%);
                    width: 300px; height: 200px;
                    background: radial-gradient(ellipse, rgba(156,24,29,0.06) 0%, transparent 70%);
                    pointer-events: none;
                }
                .sc-hero-error {
                    background: linear-gradient(160deg, #fff1f2 0%, #ffe4e6 100%);
                    border-bottom-color: #ffc9cb;
                }

                .sc-logo-pill {
                    display: inline-flex; align-items: center; gap: 6px;
                    background: rgba(156,24,29,0.06);
                    border: 1px solid rgba(156,24,29,0.15);
                    color: #9c181d;
                    padding: 5px 14px; border-radius: 100px;
                    font-size: 0.6875rem; font-weight: 700;
                    letter-spacing: 0.06em; text-transform: uppercase;
                    margin-bottom: 24px;
                }
                .sc-logo-dot {
                    width: 4px; height: 4px; border-radius: 50%;
                    background: rgba(156,24,29,0.4);
                }

                /* Success ring */
                .sc-ring-wrap {
                    position: relative; width: 80px; height: 80px;
                    margin: 0 auto 20px;
                }
                .sc-ring {
                    position: absolute; inset: 0; border-radius: 50%;
                    animation: rpulse 2.4s ease-out infinite;
                }
                .sc-ring-a { background: rgba(22,163,74,0.1); }
                .sc-ring-b { background: rgba(22,163,74,0.06); transform: scale(1.2); animation-delay: 0.4s; }
                @keyframes rpulse {
                    0%,100% { opacity: 1; transform: scale(var(--s,1)); }
                    50%      { opacity: 0.4; transform: scale(calc(var(--s,1)*1.06)); }
                }
                .sc-ring-b { --s: 1.2; }
                .sc-icon {
                    position: relative; z-index: 1;
                    width: 80px; height: 80px; border-radius: 50%;
                    display: flex; align-items: center; justify-content: center;
                }
                .sc-icon-success {
                    background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
                    box-shadow: 0 8px 28px rgba(22,163,74,0.32), 0 0 0 1px rgba(22,163,74,0.2);
                }
                .sc-icon-error {
                    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
                    box-shadow: 0 8px 28px rgba(220,38,38,0.28);
                }

                .sc-hero-title {
                    font-family: 'Playfair Display', serif;
                    font-size: 1.875rem; font-weight: 900;
                    color: #18181b; margin: 0 0 8px; line-height: 1.15;
                }
                .sc-hero-sub {
                    font-size: 0.9375rem; color: #71717a; margin: 0; line-height: 1.6;
                }

                /* ── Info strip ── */
                .sc-strip {
                    display: flex; align-items: center; justify-content: center;
                    gap: 8px; padding: 14px 24px;
                    background: #fafafa; border-bottom: 1px solid #f0f0f0;
                    flex-wrap: wrap;
                }
                .sc-chip {
                    display: inline-flex; align-items: center; gap: 5px;
                    padding: 4px 11px; border-radius: 100px;
                    font-size: 0.75rem; font-weight: 600; border: 1px solid;
                }
                .sc-chip-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }

                /* ── Body ── */
                .sc-body { padding: 28px 36px 36px; }

                /* ── Cal section ── */
                .sc-cal-section { margin-bottom: 24px; }
                .sc-section-head {
                    display: flex; align-items: center; gap: 10px; margin-bottom: 12px;
                }
                .sc-section-badge {
                    width: 26px; height: 26px; border-radius: 50%; flex-shrink: 0;
                    background: linear-gradient(135deg, #9c181d, #bd181e);
                    color: white; font-size: 0.6875rem; font-weight: 700;
                    display: flex; align-items: center; justify-content: center;
                }
                .sc-section-title { font-size: 0.9375rem; font-weight: 700; color: #18181b; margin: 0 0 1px; }
                .sc-section-sub   { font-size: 0.8125rem; color: #71717a; margin: 0; }
                .sc-cal-frame {
                    border-radius: 16px; overflow: hidden;
                    border: 1px solid #e4e4e7; background: #fff;
                    min-height: 560px;
                }

                /* ── Booked banner ── */
                .sc-booked {
                    display: flex; align-items: center; gap: 14px;
                    background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
                    border: 1px solid #bbf7d0; border-radius: 16px;
                    padding: 16px 20px; margin-bottom: 24px;
                }
                .sc-booked-icon {
                    width: 38px; height: 38px; border-radius: 50%; flex-shrink: 0;
                    background: linear-gradient(135deg, #22c55e, #16a34a);
                    display: flex; align-items: center; justify-content: center;
                }
                .sc-booked-title { font-size: 0.9375rem; font-weight: 700; color: #14532d; margin: 0 0 2px; }
                .sc-booked-sub   { font-size: 0.8125rem; color: #166534; margin: 0; }

                /* ── Date row ── */
                .sc-date-row {
                    display: flex; align-items: center; gap: 14px;
                    background: linear-gradient(135deg, #fef2f2 0%, #fff8eb 100%);
                    border: 1px solid #ffc9cb; border-radius: 16px;
                    padding: 16px 20px; margin-bottom: 20px;
                }
                .sc-date-icon {
                    width: 38px; height: 38px; border-radius: 12px; flex-shrink: 0;
                    background: rgba(156,24,29,0.1);
                    display: flex; align-items: center; justify-content: center;
                }
                .sc-date-label { font-size: 0.6875rem; font-weight: 700; letter-spacing: 0.07em; text-transform: uppercase; color: #9c181d; margin: 0 0 2px; }
                .sc-date-value { font-size: 0.9375rem; font-weight: 700; color: #18181b; margin: 0; }

                /* ── Steps / Timeline ── */
                .sc-steps-wrap { margin-bottom: 24px; }
                .sc-steps-head {
                    font-size: 0.6875rem; font-weight: 700; letter-spacing: 0.08em;
                    text-transform: uppercase; color: #a1a1aa; margin: 0 0 16px;
                }
                .sc-timeline { display: flex; flex-direction: column; }
                .sc-tl-item {
                    display: flex; gap: 14px;
                    position: relative;
                }
                .sc-tl-connector {
                    position: absolute;
                    left: 12px;
                    top: 28px;
                    bottom: 0;
                    width: 1px;
                    background: linear-gradient(to bottom, #e4e4e7 60%, transparent 100%);
                }
                .sc-tl-dot {
                    width: 24px; height: 24px; border-radius: 50%; flex-shrink: 0;
                    background: linear-gradient(135deg, #9c181d, #bd181e);
                    color: white; font-size: 0.625rem; font-weight: 700;
                    display: flex; align-items: center; justify-content: center;
                    position: relative; z-index: 1; margin-top: 1px;
                }
                .sc-tl-body { padding-bottom: 20px; flex: 1; min-width: 0; }
                .sc-tl-title { font-size: 0.875rem; font-weight: 600; color: #18181b; margin: 0 0 2px; }
                .sc-tl-desc  { font-size: 0.8125rem; color: #71717a; margin: 0; line-height: 1.55; }

                /* ── Reference ── */
                .sc-ref {
                    display: flex; align-items: center; gap: 12px;
                    background: #fafafa; border: 1px solid #f0f0f0;
                    border-radius: 14px; padding: 13px 18px; margin-bottom: 24px;
                }
                .sc-ref-icon {
                    width: 32px; height: 32px; border-radius: 9px; flex-shrink: 0;
                    background: #f4f4f5;
                    display: flex; align-items: center; justify-content: center;
                }
                .sc-ref-label { font-size: 0.625rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #a1a1aa; display: block; margin-bottom: 2px; }
                .sc-ref-value { font-size: 0.75rem; color: #52525b; font-family: 'SF Mono','Fira Code',monospace; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block; }

                /* ── Actions ── */
                .sc-actions { display: flex; flex-direction: column; gap: 10px; }
                .sc-btn {
                    display: inline-flex; align-items: center; justify-content: center; gap: 8px;
                    padding: 13px 24px; border-radius: 14px;
                    font-size: 0.875rem; font-weight: 600; font-family: 'DM Sans', sans-serif;
                    cursor: pointer; transition: all 0.18s ease; text-decoration: none; border: none; width: 100%;
                }
                .sc-btn-wa    { background: #25D366; color: white; box-shadow: 0 4px 14px rgba(37,211,102,0.26); }
                .sc-btn-wa:hover { background: #20c05c; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(37,211,102,0.32); }
                .sc-btn-primary { background: linear-gradient(135deg, #9c181d 0%, #bd181e 100%); color: white; box-shadow: 0 4px 14px rgba(156,24,29,0.24); }
                .sc-btn-primary:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(156,24,29,0.3); }
                .sc-btn-ghost { background: transparent; color: #71717a; border: 1.5px solid #e4e4e7; }
                .sc-btn-ghost:hover { background: #fafafa; color: #52525b; }

                .sc-footer {
                    text-align: center; font-size: 0.75rem; color: #a1a1aa;
                    margin-top: 20px; line-height: 1.7;
                }
                .sc-footer a { color: #9c181d; font-weight: 600; text-decoration: none; }

                /* ── Error ── */
                .sc-error-box {
                    background: #fff1f2; border: 1px solid #ffc9cb;
                    border-radius: 14px; padding: 16px 18px; margin-bottom: 20px;
                    font-size: 0.875rem; color: #9f1239; line-height: 1.6;
                }

                /* ── Loading ── */
                .sc-loading-card {
                    width: 100%; max-width: 420px;
                    background: #ffffff; border-radius: 24px;
                    box-shadow: 0 0 0 1px rgba(0,0,0,0.06), 0 24px 64px rgba(0,0,0,0.08);
                    overflow: hidden; position: relative; z-index: 1;
                }
                .sc-shimmer {
                    height: 3px; background: #fef2f2; overflow: hidden; position: relative;
                }
                .sc-shimmer::after {
                    content: ''; position: absolute; left: -40%; top: 0;
                    width: 40%; height: 100%;
                    background: linear-gradient(90deg, transparent, #9c181d, transparent);
                    animation: shimmer 1.4s ease-in-out infinite;
                }
                @keyframes shimmer { to { left: 140%; } }
                .sc-loading-body { padding: 52px 40px; text-align: center; }
                .sc-spinner {
                    width: 44px; height: 44px; border-radius: 50%;
                    border: 3px solid rgba(156,24,29,0.12);
                    border-top-color: #9c181d;
                    animation: spin 0.75s linear infinite;
                    margin: 0 auto 20px;
                }
                @keyframes spin { to { transform: rotate(360deg); } }
                .sc-loading-title { font-family: 'Playfair Display', serif; font-size: 1.375rem; font-weight: 700; color: #18181b; margin: 0 0 6px; }
                .sc-loading-sub   { font-size: 0.875rem; color: #a1a1aa; margin: 0; }

                /* ── Skip / no agendar ── */
                .sc-skip-row {
                    text-align: center; padding: 14px 0 2px;
                }
                .sc-skip-btn {
                    background: none; border: none; cursor: pointer;
                    font-size: 0.8125rem; font-weight: 500; color: #a1a1aa;
                    font-family: 'DM Sans', sans-serif;
                    text-decoration: underline; text-underline-offset: 3px;
                    transition: color 0.15s;
                }
                .sc-skip-btn:hover { color: #71717a; }

                .sc-skip-card {
                    display: flex; align-items: flex-start; gap: 14px;
                    background: #fef2f2; border: 1px solid #ffc9cb;
                    border-radius: 16px; padding: 18px 20px; margin-bottom: 24px;
                }
                .sc-skip-icon {
                    width: 36px; height: 36px; border-radius: 10px; flex-shrink: 0;
                    background: rgba(156,24,29,0.08);
                    display: flex; align-items: center; justify-content: center;
                    margin-top: 1px;
                }
                .sc-skip-title { font-size: 0.875rem; font-weight: 700; color: #18181b; margin: 0 0 5px; }
                .sc-skip-desc  { font-size: 0.8125rem; color: #71717a; margin: 0 0 12px; line-height: 1.55; }
                .sc-skip-undo {
                    background: none; border: 1px solid rgba(156,24,29,0.25);
                    border-radius: 8px; padding: 6px 14px;
                    font-size: 0.8125rem; font-weight: 600; color: #9c181d;
                    font-family: 'DM Sans', sans-serif; cursor: pointer;
                    transition: background 0.15s;
                }
                .sc-skip-undo:hover { background: rgba(156,24,29,0.06); }

                /* ── Slot picker ── */
                .sc-slots-section { margin-bottom: 24px; }
                .sc-slots-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(138px, 1fr));
                    gap: 10px;
                    margin-top: 4px;
                }
                .sc-slot-card {
                    position: relative;
                    background: #fafafa;
                    border: 1.5px solid #e4e4e7;
                    border-radius: 14px;
                    padding: 14px 10px 12px;
                    text-align: center;
                    cursor: pointer;
                    transition: all 0.15s ease;
                    font-family: 'DM Sans', sans-serif;
                }
                .sc-slot-card:hover {
                    border-color: #9c181d;
                    background: #fff8f8;
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(156,24,29,0.08);
                }
                .sc-slot-card.selected {
                    border-color: #9c181d;
                    background: linear-gradient(135deg, #fef2f2 0%, #fff8eb 100%);
                    box-shadow: 0 4px 16px rgba(156,24,29,0.12);
                }
                .sc-slot-day   { font-size: 0.625rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; color: #9c181d; margin-bottom: 5px; }
                .sc-slot-date  { font-size: 0.875rem; font-weight: 700; color: #18181b; margin-bottom: 6px; line-height: 1.2; }
                .sc-slot-time  { font-size: 0.8125rem; font-weight: 600; color: #52525b; }
                .sc-slot-tz    { font-size: 0.625rem; color: #a1a1aa; font-weight: 500; }
                .sc-slot-check {
                    position: absolute; top: 7px; right: 7px;
                    width: 18px; height: 18px; border-radius: 50%;
                    background: #9c181d; color: white;
                    display: flex; align-items: center; justify-content: center;
                }

                @media (max-width: 520px) {
                    .sc-root { padding: 24px 12px 56px; }
                    .sc-hero { padding: 28px 20px 24px; }
                    .sc-hero-title { font-size: 1.5rem; }
                    .sc-body { padding: 22px 20px 28px; }
                    .sc-strip { padding: 12px 16px; }
                }
            `}</style>

            <div className="sc-root">
                <div className="sc-glow sc-glow-1" />
                <div className="sc-glow sc-glow-2" />

                {/* ── Loading ── */}
                {state === "loading" ? (
                    <div className="sc-loading-card">
                        <div className="sc-shimmer" />
                        <div className="sc-loading-body">
                            <div className="sc-spinner" />
                            <div className="sc-loading-title">Confirmando tu pago</div>
                            <div className="sc-loading-sub">Esto puede tardar unos segundos…</div>
                        </div>
                    </div>
                ) : (
                    <div className={`sc-card${isPremiumPending ? " sc-wide" : ""}${visible ? " visible" : ""}`}>

                        {/* Accent bar */}
                        <div className="sc-bar" />

                        {/* ── Hero ── */}
                        <div className={`sc-hero${state === "error" ? " sc-hero-error" : ""}`}>
                            <div className="sc-logo-pill">
                                LZ English Academy
                                <span className="sc-logo-dot" />
                                Método 590
                            </div>

                            {state === "success" ? (
                                <div className="sc-ring-wrap">
                                    <div className="sc-ring sc-ring-a" />
                                    <div className="sc-ring sc-ring-b" />
                                    <div className="sc-icon sc-icon-success">
                                        <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M20 6L9 17l-5-5" />
                                        </svg>
                                    </div>
                                </div>
                            ) : (
                                <div className="sc-icon sc-icon-error" style={{ margin: "0 auto 20px" }}>
                                    <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                                        <path d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                            )}

                            <h1 className="sc-hero-title">
                                {state === "success"
                                    ? (firstName ? `¡Listo, ${firstName}!` : "¡Pago confirmado!")
                                    : "No pudimos confirmar"}
                            </h1>
                            <p className="sc-hero-sub">
                                {state === "success"
                                    ? "Tu inscripción quedó registrada correctamente."
                                    : (errorMsg || "Verifica tu pago o contáctanos.")}
                            </p>
                        </div>

                        {/* ── Info strip ── */}
                        {state === "success" && (
                            <div className="sc-strip">
                                {userData?.plan && (
                                    <span className="sc-chip" style={{ color: planMeta.color, background: planMeta.bg, borderColor: planMeta.border }}>
                                        <span className="sc-chip-dot" style={{ background: planMeta.color }} />
                                        Plan {userData.plan}
                                    </span>
                                )}
                                {formattedStartDate && (
                                    <span className="sc-chip" style={{ color: "#52525b", background: "#f4f4f5", borderColor: "#e4e4e7" }}>
                                        <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.5">
                                            <rect x="2" y="3" width="12" height="11" rx="2.5" />
                                            <path d="M5 1v3M11 1v3M2 7h12" strokeLinecap="round" />
                                        </svg>
                                        Inicio: {formattedStartDate}
                                    </span>
                                )}
                                {amount !== null && (
                                    <span className="sc-chip" style={{ color: "#166534", background: "#f0fdf4", borderColor: "#bbf7d0" }}>
                                        <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.5">
                                            <circle cx="8" cy="8" r="6" />
                                            <path d="M8 5v1.5m0 3V11m-1.5-5.5h2.25a1.25 1.25 0 010 2.5H7m0 0h2.5" strokeLinecap="round" />
                                        </svg>
                                        {isSubscription
                                            ? `Suscripción · $${(amount / 100).toFixed(0)} USD · se renueva cada 4 semanas`
                                            : `28 días de acceso · $${(amount / 100).toFixed(0)} USD · sin renovación automática`}
                                    </span>
                                )}
                            </div>
                        )}

                        {/* ── Body ── */}
                        <div className="sc-body">

                            {/* Error */}
                            {state === "error" && (
                                <>
                                    <div className="sc-error-box">{errorMsg}</div>
                                    <div className="sc-actions">
                                        <button onClick={() => router.refresh()} className="sc-btn sc-btn-primary">
                                            Reintentar verificación
                                        </button>
                                        <button onClick={() => router.push("/")} className="sc-btn sc-btn-ghost">
                                            Volver al inicio
                                        </button>
                                    </div>
                                </>
                            )}

                            {state === "success" && (
                                <>
                                    {/* Slot picker — Premium pending */}
                                    {isPremiumPending && !skipSlot && (
                                        <div className="sc-slots-section">
                                            <div className="sc-section-head">
                                                <span className="sc-section-badge">1</span>
                                                <div>
                                                    <p className="sc-section-title">Selecciona tu horario</p>
                                                    {/* ⚠️ El nombre del plan, no el literal "Premium": la decisión de MOSTRAR
    esto se hizo dinámica y el texto de dentro se quedó atrás, así que a un
    plan abierto en el admin se le nombraba otro plan justo después de pagar. */}
                                                    <p className="sc-section-sub">Primera clase de {planLabel(userData?.plan ?? "")} · en tu zona horaria</p>
                                                </div>
                                            </div>

                                            {slotsLoading ? (
                                                <div style={{ padding: "20px", textAlign: "center", color: "#a1a1aa", fontSize: "0.875rem" }}>
                                                    Cargando horarios disponibles…
                                                </div>
                                            ) : slots.length === 0 ? (
                                                <div style={{ padding: "18px 20px", background: "#fafafa", border: "1px solid #f0f0f0", borderRadius: "14px", color: "#71717a", fontSize: "0.875rem" }}>
                                                    No hay horarios disponibles en este momento. Nuestro equipo te contactará para coordinar tu horario.
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="sc-slots-grid">
                                                        {slots.map(slot => {
                                                            const { dayName, day, monthName, timeStr, tzAbbr } = buildSlotDisplay(slot.datetime_pt);
                                                            const isSelected = selectedSlot === slot.datetime_pt;
                                                            return (
                                                                <button
                                                                    key={slot.id}
                                                                    onClick={() => setSelectedSlot(isSelected ? null : slot.datetime_pt)}
                                                                    className={`sc-slot-card${isSelected ? " selected" : ""}`}
                                                                >
                                                                    <div className="sc-slot-day">{dayName}</div>
                                                                    <div className="sc-slot-date">{day} de {monthName}</div>
                                                                    <div className="sc-slot-time">{timeStr} <span className="sc-slot-tz">{tzAbbr}</span></div>
                                                                    {isSelected && (
                                                                        <div className="sc-slot-check">
                                                                            <svg viewBox="0 0 12 12" width="10" height="10" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                                                <path d="M10 3L5 9 2 6" />
                                                                            </svg>
                                                                        </div>
                                                                    )}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                    {selectedSlot && (
                                                        <button
                                                            onClick={handleConfirmSlot}
                                                            disabled={bookingSlot}
                                                            className="sc-btn sc-btn-primary"
                                                            style={{ marginTop: "14px" }}
                                                        >
                                                            {bookingSlot ? "Confirmando…" : "Confirmar horario"}
                                                        </button>
                                                    )}
                                                </>
                                            )}

                                            <div className="sc-skip-row">
                                                <button onClick={() => setSkipSlot(true)} className="sc-skip-btn">
                                                    No puedo agendar ahora
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Fallback: no agendó */}
                                    {isPremiumPending && skipSlot && (
                                        <div className="sc-skip-card">
                                            <div className="sc-skip-icon">
                                                <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="#9c181d" strokeWidth="1.5">
                                                    <circle cx="10" cy="10" r="8" />
                                                    <path d="M10 6v4l2.5 2.5" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            </div>
                                            <div>
                                                <p className="sc-skip-title">Sin problema, puedes agendarlo después</p>
                                                <p className="sc-skip-desc">
                                                    Nuestro equipo te contactará para coordinar el horario de tu primera clase.
                                                    Si necesitas ayuda, escríbenos a{" "}
                                                    <a href="mailto:info@lz-englishacademy.com" style={{ color: "#9c181d", fontWeight: 600 }}>
                                                        info@lz-englishacademy.com
                                                    </a>{" "}
                                                    con tu referencia de pago.
                                                </p>
                                                <button onClick={() => setSkipSlot(false)} className="sc-skip-undo">
                                                    Volver a horarios
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Premium booked */}
                                    {isPremiumBooked && (
                                        <div className="sc-booked">
                                            <div className="sc-booked-icon">
                                                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M20 6L9 17l-5-5" />
                                                </svg>
                                            </div>
                                            <div>
                                                <p className="sc-booked-title">¡Tu clase ya está agendada!</p>
                                                <p className="sc-booked-sub">Recibirás un recordatorio por correo antes de tu sesión.</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Date row */}
                                    {formattedStartDate && (
                                        <div className="sc-date-row">
                                            <div className="sc-date-icon">
                                                <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="#9c181d" strokeWidth="1.5">
                                                    <rect x="2" y="4" width="16" height="14" rx="3" />
                                                    <path d="M6 2v3M14 2v3M2 9h16" strokeLinecap="round" />
                                                </svg>
                                            </div>
                                            <div>
                                                <p className="sc-date-label">Fecha oficial de inicio</p>
                                                <p className="sc-date-value">{formattedStartDate}</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Vencimiento de acceso (solo planes de pago por periodo) */}
                                    {accessEndDate && (
                                        <div className="sc-date-row">
                                            <div className="sc-date-icon">
                                                <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="#9c181d" strokeWidth="1.5">
                                                    <rect x="2" y="5" width="16" height="11" rx="2.5" />
                                                    <path d="M2 9h16" strokeLinecap="round" />
                                                </svg>
                                            </div>
                                            <div>
                                                <p className="sc-date-label">Tu acceso vence el</p>
                                                <p className="sc-date-value">{accessEndDate}</p>
                                                <p style={{ fontSize: "0.75rem", color: "#71717a", margin: "3px 0 0", lineHeight: 1.5 }}>
                                                    Este pago cubre 28 días de acceso. Si deseas continuar al finalizar el periodo, deberás pagar nuevamente.
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Próximo cobro (solo suscripción) */}
                                    {nextChargeDate && (
                                        <div className="sc-date-row">
                                            <div className="sc-date-icon">
                                                <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="#9c181d" strokeWidth="1.5">
                                                    <rect x="2" y="5" width="16" height="11" rx="2.5" />
                                                    <path d="M2 9h16" strokeLinecap="round" />
                                                </svg>
                                            </div>
                                            <div>
                                                <p className="sc-date-label">Próximo cobro automático</p>
                                                <p className="sc-date-value">{nextChargeDate}</p>
                                                <p style={{ fontSize: "0.75rem", color: "#71717a", margin: "3px 0 0", lineHeight: 1.5 }}>
                                                    Este pago cubre tu primer periodo. Después se cobra ${amount !== null ? `${(amount / 100).toFixed(0)} USD ` : ""}cada 4 semanas; cancela cuando quieras desde tu portal de suscripción.
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Timeline */}
                                    <div className="sc-steps-wrap">
                                        <p className="sc-steps-head">
                                            {isPremiumPending ? "Después de confirmar" : "¿Qué sigue?"}
                                        </p>
                                        <div className="sc-timeline">
                                            {displaySteps.map((step, i) => (
                                                <div className="sc-tl-item" key={i}>
                                                    {i < displaySteps.length - 1 && <div className="sc-tl-connector" />}
                                                    <div className="sc-tl-dot">{i + 1}</div>
                                                    <div className="sc-tl-body">
                                                        <p className="sc-tl-title">{step.title}</p>
                                                        <p className="sc-tl-desc">{step.desc}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Reference */}
                                    {session_id && (
                                        <div className="sc-ref">
                                            <div className="sc-ref-icon">
                                                <svg viewBox="0 0 20 20" width="15" height="15" fill="none" stroke="#a1a1aa" strokeWidth="1.5">
                                                    <rect x="3" y="3" width="14" height="14" rx="3" />
                                                    <path d="M7 7h6M7 10h6M7 13h4" strokeLinecap="round" />
                                                </svg>
                                            </div>
                                            <div style={{ minWidth: 0 }}>
                                                <span className="sc-ref-label">Referencia de pago</span>
                                                <span className="sc-ref-value">{session_id}</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Actions */}
                                    <div className="sc-actions">
                                        <a href="https://chat.whatsapp.com/HhAvLoPoLwf1JsX0aWtnX1" target="_blank" rel="noopener noreferrer" className="sc-btn sc-btn-wa">
                                            <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                                            </svg>
                                            Unirme a la comunidad de WhatsApp
                                        </a>
                                        <button onClick={() => router.push("/")} className="sc-btn sc-btn-primary">
                                            Volver al inicio
                                        </button>
                                    </div>

                                    <p className="sc-footer">
                                        ¿Necesitas ayuda? Escríbenos a{" "}
                                        <a href="mailto:info@lz-englishacademy.com">info@lz-englishacademy.com</a>
                                        {" "}con tu referencia de pago.
                                    </p>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default SuccessContent;
