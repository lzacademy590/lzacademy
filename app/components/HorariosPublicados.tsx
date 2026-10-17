"use client";

/*
  Los horarios de grupo, SOLO PARA VER (2026-10-16).

  Petición del negocio: "mucho alumno pregunta por los horarios" antes de comprar.
  Aquí se ENSEÑAN —hora en la zona de quien mira, días, nivel y estado— pero no se
  ofrecen: no hay nada que elegir. Elegir se hace en el formulario de pago
  (Form.tsx), que es el único sitio que valida y cobra. Por eso el botón de cada
  bloque lleva al formulario y no reserva nada.

  Se usa en dos sitios:
    · las landings de los planes con clase en vivo, PLEGADO tras "Ver horarios"
      (la landing ocupa una pantalla y no se alarga), y abierto ya en el nivel
      que el alumno eligió en /paso-uno;
    · la página pública /horarios, ABIERTO, para mandar el enlace por WhatsApp.

  ⚠️ Solo salen los inicios FUTUROS y nunca un horario que no abrió: enseñar uno
  "cerrado" en una página informativa solo genera la pregunta de por qué.
  ⚠️ Lleno SÍ sale, marcado: es una respuesta útil ("ese no, éste sí").
  ⚠️ Fail-open: si la lectura falla, la sección no aparece en la landing (no
  puede romper la página que vende) y en /horarios se dice y se ofrece reintentar.
*/

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { fechaLarga, infoDeLaHora, nombreDeLaZona } from "@/app/lib/horario-local";
import { listaDeDias } from "@/app/lib/dias-de-clase";
import { usePlanesDelCatalogo } from "@/app/hooks/usePlanesDelCatalogo";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL!;

interface Horario {
    id: string;
    plan: string;
    start_date: string;
    level: string;
    hora_pt: string;
    minimo: number;
    faltan: number;
    confirmado: boolean;
    lleno: boolean;
    noAbrio?: boolean;
    restantes: number | null;
}

// Mismo orden y nombres que el selector de nivel del formulario.
const NIVELES = [
    { clave: "Principiante", nombre: "Principiante (A1)", codigo: "A1" },
    { clave: "Basico", nombre: "Básico (A2)", codigo: "A2" },
    { clave: "Intermedio", nombre: "Intermedio (B1)", codigo: "B1" },
    { clave: "Intermedio alto", nombre: "Intermedio alto (B2)", codigo: "B2" },
];
const nombreDeNivel = (clave: string) => NIVELES.find(n => n.clave === clave)?.nombre ?? clave;

/** "B1" o "Intermedio" → "Intermedio". Lo de /paso-uno llega como código. */
function claveDeNivel(nivel?: string | null): string {
    if (!nivel) return "";
    const n = nivel.trim();
    if (n === "B2.1" || n === "B2.2") return "Intermedio alto";
    return NIVELES.find(x => x.codigo === n || x.clave.toLowerCase() === n.toLowerCase())?.clave ?? "";
}

function hoyLocal() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function estado(h: Horario) {
    if (h.lleno) return { texto: "Lleno", clase: "bg-zinc-200 text-zinc-600", detalle: "Sin lugares" };
    if (h.confirmado) {
        return {
            texto: "Confirmado",
            clase: "bg-emerald-100 text-emerald-700",
            detalle: h.restantes !== null ? `Quedan ${h.restantes} ${h.restantes === 1 ? "lugar" : "lugares"}` : "Grupo confirmado",
        };
    }
    return {
        texto: "Por confirmar",
        clase: "bg-amber-100 text-amber-800",
        // La MISMA frase que el formulario y /mi-horario (2026-10-17). Con el
        // mínimo al lado se podía restar y saber cuántos hay inscritos, que es
        // justo lo que la decisión del 2026-10-16 no quiere enseñar.
        detalle: `Necesita ${h.faltan} ${h.faltan === 1 ? "alumno" : "alumnos"} más para abrir`,
    };
}

export default function HorariosPublicados({
    plan,
    nivel,
    modo = "plegable",
    enlaceInscripcion,
}: {
    /** Clave del plan. Sin ella, todos los planes que tengan horarios (/horarios). */
    plan?: string;
    /** Nivel de /paso-uno ("B1") o clave ("Intermedio"): abre ya en ese nivel. */
    nivel?: string | null;
    modo?: "plegable" | "abierto";
    /** A dónde lleva "Inscribirme". Por defecto, el embudo. */
    enlaceInscripcion?: (plan: string) => string;
}) {
    const [horarios, setHorarios] = useState<Horario[] | null>(null);
    const [fallo, setFallo] = useState(false);
    const [abierto, setAbierto] = useState(modo === "abierto");
    const [nivelVisto, setNivelVisto] = useState<string>(claveDeNivel(nivel));
    const catalogo = usePlanesDelCatalogo();
    // La zona se lee en el navegador, no en el render: en el servidor saldría la
    // del servidor y no casaría al hidratar.
    const [zona, setZona] = useState("");

    const cargar = useCallback(() => {
        const q = plan ? `?plan=${encodeURIComponent(plan)}` : "";
        fetch(`${BACKEND_URL}/config/horarios-de-clase${q}`)
            .then(r => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
            .then((data: Horario[]) => {
                const hoy = hoyLocal();
                setZona(nombreDeLaZona());
                setFallo(false);
                setHorarios((Array.isArray(data) ? data : []).filter(h => h.start_date >= hoy && !h.noAbrio));
            })
            .catch(() => { setFallo(true); setHorarios([]); });
    }, [plan]);

    useEffect(() => { cargar(); }, [cargar]);

    // Plan → inicio → nivel → horarios, todo en orden.
    const grupos = useMemo(() => {
        const out = new Map<string, Map<string, Map<string, Horario[]>>>();
        const lista = [...(horarios ?? [])]
            .filter(h => !nivelVisto || h.level === nivelVisto)
            // Un plan retirado del catálogo no se anuncia aunque le queden horarios.
            .filter(h => !catalogo || catalogo.some(p => p.key === h.plan))
            .sort((a, b) => a.plan.localeCompare(b.plan) || a.start_date.localeCompare(b.start_date) ||
                NIVELES.findIndex(n => n.clave === a.level) - NIVELES.findIndex(n => n.clave === b.level) ||
                a.hora_pt.localeCompare(b.hora_pt));
        for (const h of lista) {
            if (!out.has(h.plan)) out.set(h.plan, new Map());
            const porInicio = out.get(h.plan)!;
            if (!porInicio.has(h.start_date)) porInicio.set(h.start_date, new Map());
            const porNivel = porInicio.get(h.start_date)!;
            if (!porNivel.has(h.level)) porNivel.set(h.level, []);
            porNivel.get(h.level)!.push(h);
        }
        return out;
    }, [horarios, nivelVisto, catalogo]);

    const nivelesConHorario = useMemo(
        () => NIVELES.filter(n => (horarios ?? []).some(h => h.level === n.clave)),
        [horarios],
    );

    // En la landing, sin horarios no se pinta nada: ni botón ni hueco.
    if (modo === "plegable" && (horarios === null || horarios.length === 0)) return null;

    const nombrePlan = (k: string) => catalogo?.find(p => p.key === k)?.label ?? k;
    const diasDe = (k: string) => listaDeDias(catalogo?.find(p => p.key === k)?.classDays ?? []);
    // Sin enlace propio (la página /horarios), directo al formulario con ese plan:
    // mandar a /paso-uno le hacía repetir tres pasos y perder el plan que miraba.
    const irA = (k: string) => (enlaceInscripcion ? enlaceInscripcion(k) : `/paso-cuatro?${new URLSearchParams({ plan: k })}`);

    if (modo === "plegable" && !abierto) {
        return (
            <div className="mt-5 flex justify-center">
                <button
                    type="button"
                    onClick={() => setAbierto(true)}
                    className="inline-flex items-center gap-2 text-[14px] font-bold underline underline-offset-4 text-zinc-800 hover:text-zinc-950"
                    aria-expanded={false}
                >
                    <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                        <circle cx="8" cy="8" r="6.5" /><path d="M8 4.5V8l2.5 1.5" strokeLinecap="round" />
                    </svg>
                    Ver horarios de clase
                </button>
            </div>
        );
    }

    return (
        <section
            aria-label="Horarios de clase"
            className={`w-full rounded-3xl bg-white shadow-sm text-left ${modo === "plegable" ? "max-w-[780px] mx-auto mt-6" : ""}`}
            style={{ border: "2px solid #e8adb0" }}
        >
            <div className="flex flex-wrap items-start justify-between gap-3 px-6 pt-6">
                <div>
                    {/* En /horarios el título y la explicación ya los pone la página. */}
                    {modo === "plegable" && <h2 className="text-lg font-extrabold text-zinc-900">Horarios de clase</h2>}
                    <p className="text-[13px] text-zinc-600 mt-0.5">
                        Horas de tu dispositivo{zona ? ` (${zona})` : ""}.
                        {modo === "plegable" && " El horario lo eliges al inscribirte."}
                    </p>
                </div>
                {modo === "plegable" && (
                    <button type="button" onClick={() => setAbierto(false)} className="text-[13px] font-semibold text-zinc-500 underline">
                        Ocultar
                    </button>
                )}
            </div>

            {nivelesConHorario.length > 1 && (
                <div className="flex flex-wrap gap-2 px-6 pt-4" role="group" aria-label="Filtrar por nivel">
                    <FiltroNivel activo={!nivelVisto} onClick={() => setNivelVisto("")}>Todos los niveles</FiltroNivel>
                    {nivelesConHorario.map(n => (
                        <FiltroNivel key={n.clave} activo={nivelVisto === n.clave} onClick={() => setNivelVisto(n.clave)}>
                            {n.nombre}
                        </FiltroNivel>
                    ))}
                </div>
            )}

            <div className="px-6 py-5 space-y-6">
                {horarios === null && <p className="text-sm text-zinc-500">Cargando horarios…</p>}

                {fallo && (
                    <p className="text-sm text-zinc-600">
                        No pudimos cargar los horarios.{" "}
                        <button type="button" onClick={() => { setFallo(false); setHorarios(null); cargar(); }} className="font-semibold underline">Reintentar</button>
                    </p>
                )}

                {horarios !== null && !fallo && grupos.size === 0 && (
                    <p className="text-sm text-zinc-600">
                        {nivelVisto
                            ? `Todavía no hay horarios publicados para ${nombreDeNivel(nivelVisto)}. `
                            : "Pronto publicaremos los horarios del próximo inicio. "}
                        Escríbenos por WhatsApp y te avisamos.
                    </p>
                )}

                {[...grupos.entries()].map(([clavePlan, porInicio]) => (
                    <div key={clavePlan}>
                        {!plan && <h3 className="text-base font-extrabold text-zinc-900 mb-3">{nombrePlan(clavePlan)}</h3>}
                        {diasDe(clavePlan) && (
                            <p className="text-[13px] text-zinc-600 mb-3">Clases en vivo los {diasDe(clavePlan)}.</p>
                        )}
                        <div className="space-y-5">
                            {[...porInicio.entries()].map(([inicio, porNivel]) => (
                                <div key={inicio}>
                                    <p className="text-[12px] font-bold uppercase tracking-wide" style={{ color: "#C0353E" }}>
                                        Inicio: {fechaLarga(inicio)}
                                    </p>
                                    <div className="mt-2 space-y-3">
                                        {[...porNivel.entries()].map(([lvl, lista]) => (
                                            <div key={lvl}>
                                                <p className="text-[13px] font-semibold text-zinc-800 mb-1.5">{nombreDeNivel(lvl)}</p>
                                                <ul className="flex flex-wrap gap-2">
                                                    {lista.map(h => {
                                                        const info = infoDeLaHora(h.start_date, h.hora_pt);
                                                        const e = estado(h);
                                                        return (
                                                            <li key={h.id} className={`rounded-xl border px-3 py-2 min-w-[150px] ${h.lleno ? "border-zinc-200 bg-zinc-50" : "border-zinc-200 bg-white"}`}>
                                                                <div className="flex items-center justify-between gap-2">
                                                                    <span className={`text-sm font-bold ${h.lleno ? "text-zinc-500" : "text-zinc-900"}`}>{info.hora}</span>
                                                                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${e.clase}`}>{e.texto}</span>
                                                                </div>
                                                                <p className="text-[11.5px] text-zinc-500 mt-0.5">{e.detalle}</p>
                                                                {info.desfaseDia !== 0 && (
                                                                    <p className="text-[11px] text-amber-700 mt-0.5">
                                                                        {info.desfaseDia > 0 ? "Del día siguiente en tu zona" : "Del día anterior en tu zona"}
                                                                    </p>
                                                                )}
                                                            </li>
                                                        );
                                                    })}
                                                </ul>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                        {!plan && (
                            <Link href={irA(clavePlan)} className="mt-4 inline-block text-sm font-bold underline" style={{ color: "#C0353E" }}>
                                Inscribirme en {nombrePlan(clavePlan)}
                            </Link>
                        )}
                    </div>
                ))}
            </div>
        </section>
    );
}

function FiltroNivel({ activo, onClick, children }: { activo: boolean; onClick: () => void; children: React.ReactNode }) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={activo}
            className={`rounded-full px-3 py-1 text-[12px] font-semibold border transition ${
                activo ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300"
            }`}
        >
            {children}
        </button>
    );
}
