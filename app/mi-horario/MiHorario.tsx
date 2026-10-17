"use client";

/*
  /mi-horario (2026-10-16): el alumno cambia su horario de grupo —o pasa al
  siguiente inicio— con su enlace personal (?t=), sin sesión y sin repetir el
  formulario de pago.

  Llega aquí desde /success ("Cambiar mi horario") o desde el correo que el admin
  manda cuando un horario no reúne el mínimo. Las reglas las pone el backend
  (horarios.service.js); esta pantalla solo enseña lo que él permite:
    · antes del cierre (3 días antes del inicio) puede cambiar siempre;
    · después, solo si su horario no abrió;
    · pasar al siguiente inicio no cuesta nada: lo pagado cubre ese grupo.
*/

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { fechaLarga, infoDeLaHora, nombreDeLaZona } from "@/app/lib/horario-local";
import { leerRespuesta, MENSAJE_SATURADO } from "@/app/lib/respuesta-del-backend";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL!;

interface Horario {
    id: string;
    start_date: string;
    hora_pt: string;
    minimo: number;
    faltan: number;
    confirmado: boolean;
    lleno: boolean;
    noAbrio?: boolean;
    cierre?: string;
    restantes: number | null;
}

interface Situacion {
    nombre: string;
    plan: string;
    level: string;
    actual: Horario | null;
    inicio: string | null;
    empezado: boolean;
    puedeCambiar: boolean;
    /** Ya pasó al siguiente inicio en esta compra (una vez por compra). */
    inicioYaMovido?: boolean;
    mismoInicio: Horario[];
    siguiente: { fecha: string; label: string; horarios: Horario[] } | null;
    eligeAntesDe: string | null;
}

type Estado = "cargando" | "listo" | "error";

function etiquetaDeEstado(h: Horario) {
    if (h.noAbrio) return { texto: "No abrió", clase: "bg-zinc-200 text-zinc-700" };
    if (h.confirmado) return { texto: "Confirmado", clase: "bg-emerald-100 text-emerald-700" };
    return { texto: "Por confirmar", clase: "bg-amber-100 text-amber-800" };
}

function detalle(h: Horario) {
    if (h.noAbrio) return "No reunió el mínimo de alumnos";
    if (h.confirmado) {
        return h.restantes !== null
            ? `Confirmado · quedan ${h.restantes} ${h.restantes === 1 ? "lugar" : "lugares"}`
            : "Grupo confirmado";
    }
    return `Necesita ${h.faltan} ${h.faltan === 1 ? "alumno" : "alumnos"} más para abrir`;
}

export default function MiHorario() {
    const params = useSearchParams();
    const token = params.get("t") ?? "";
    const [estado, setEstado] = useState<Estado>("cargando");
    const [error, setError] = useState("");
    const [datos, setDatos] = useState<Situacion | null>(null);
    const [propuesto, setPropuesto] = useState<{ h: Horario; cambiaInicio: boolean } | null>(null);
    const [guardando, setGuardando] = useState(false);
    const [hecho, setHecho] = useState("");
    const [errorCambio, setErrorCambio] = useState("");
    const zona = nombreDeLaZona();

    const cargar = useCallback(async () => {
        if (!token) { setEstado("error"); setError("Falta el enlace. Usa el que te llegó por correo."); return; }
        setEstado("cargando");
        try {
            const res = await fetch(`${BACKEND_URL}/mi-horario?t=${encodeURIComponent(token)}`);
            const { data, saturado } = await leerRespuesta(res);
            if (!res.ok) throw new Error(saturado ? MENSAJE_SATURADO : data?.error || "No pudimos cargar tu horario.");
            setDatos(data as unknown as Situacion);
            setEstado("listo");
        } catch (e) {
            setError(e instanceof Error ? e.message : "No pudimos cargar tu horario.");
            setEstado("error");
        }
    }, [token]);

    useEffect(() => { cargar(); }, [cargar]);

    const confirmar = async () => {
        if (!propuesto) return;
        setGuardando(true);
        setErrorCambio("");
        try {
            const res = await fetch(`${BACKEND_URL}/mi-horario`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ t: token, horarioId: propuesto.h.id }),
            });
            const { data, saturado } = await leerRespuesta(res);
            if (!res.ok) throw new Error(saturado ? MENSAJE_SATURADO : data?.error || "No pudimos cambiar tu horario.");
            const nueva = data?.situacion as Situacion | undefined;
            // El cambio está hecho aunque el servidor no haya podido releer la situación.
            if (nueva) setDatos(nueva); else cargar();
            const hora = infoDeLaHora(propuesto.h.start_date, propuesto.h.hora_pt).hora;
            setHecho(propuesto.cambiaInicio
                ? `Listo: empiezas el ${fechaLarga(propuesto.h.start_date)}, a las ${hora}, sin pagar nada más`
                : `Listo: tu horario ahora es a las ${hora}`);
            setPropuesto(null);
            window.scrollTo({ top: 0, behavior: "smooth" });
        } catch (e) {
            setErrorCambio(e instanceof Error ? e.message : "No pudimos cambiar tu horario.");
            // Lo que había puede haber cambiado (alguien tomó el último lugar).
            cargar();
        } finally {
            setGuardando(false);
        }
    };

    if (estado === "cargando") {
        return <Marco><p className="text-center text-zinc-500">Cargando tu horario…</p></Marco>;
    }
    if (estado === "error" || !datos) {
        return (
            <Marco>
                <h1 className="text-xl font-extrabold text-zinc-900 mb-2">No pudimos abrir tu horario</h1>
                <p className="text-sm text-zinc-600 mb-5">{error}</p>
                <div className="flex flex-wrap gap-3">
                    <button onClick={cargar} className="rounded-xl bg-falu-red-700 px-4 py-2 text-sm font-semibold text-white">Reintentar</button>
                    <a href="mailto:info@lz-englishacademy.com" className="rounded-xl border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-700">Escríbenos</a>
                </div>
            </Marco>
        );
    }

    const a = datos.actual;
    const infoActual = a ? infoDeLaHora(a.start_date, a.hora_pt) : null;
    const hayOpciones = datos.mismoInicio.length > 0 || !!datos.siguiente;

    return (
        <Marco>
            <p className="text-xs font-bold uppercase tracking-widest text-falu-red-700 mb-1">Mi horario de clase</p>
            <h1 className="text-2xl font-extrabold text-zinc-900">{datos.nombre ? `Hola, ${datos.nombre}` : "Tu horario"}</h1>
            <p className="text-sm text-zinc-500 mt-1">
                Horas de tu dispositivo{zona ? ` (${zona})` : ""}.
            </p>

            {hecho && (
                <p role="status" className="mt-5 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm font-medium text-emerald-800">{hecho}</p>
            )}

            {/* Su horario */}
            <section className="mt-6 rounded-2xl border border-zinc-200 bg-white p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 mb-2">Tu horario</p>
                {a && infoActual ? (
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <p className="text-lg font-bold text-zinc-900">{infoActual.hora}</p>
                            <p className="text-sm text-zinc-600">Empiezas el {fechaLarga(a.start_date)} · {detalle(a)}</p>
                            {/* En zonas muy lejanas (Kiritimati, Honolulu) la clase cae otro día. */}
                            {infoActual.desfaseDia !== 0 && (
                                <p className="text-xs text-amber-700 mt-0.5">
                                    {infoActual.desfaseDia > 0
                                        ? "Ojo: en tu zona la clase cae el día siguiente a esa fecha."
                                        : "Ojo: en tu zona la clase cae el día anterior a esa fecha."}
                                </p>
                            )}
                            {infoActual.horaTrasCambio && (
                                <p className="text-xs text-amber-700 mt-0.5">Por el cambio de horario de verano pasa a las {infoActual.horaTrasCambio} durante el ciclo.</p>
                            )}
                        </div>
                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${etiquetaDeEstado(a).clase}`}>
                            {etiquetaDeEstado(a).texto}
                        </span>
                    </div>
                ) : (
                    <p className="text-sm text-zinc-600">Todavía no tienes un horario asignado{datos.inicio ? ` para el inicio del ${fechaLarga(datos.inicio)}` : ""}.</p>
                )}

                {a?.noAbrio && !datos.empezado && (
                    <p className="mt-4 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-900">
                        Tu horario no reunió el mínimo de alumnos. Elige otro abajo, sin pagar de nuevo.
                        {datos.eligeAntesDe && <> Si no eliges antes del <strong>{fechaLarga(datos.eligeAntesDe)}</strong>, te pasamos al horario con lugar más cercano de tu nivel.</>}
                    </p>
                )}
                {a && !a.noAbrio && !a.confirmado && a.cierre && datos.puedeCambiar && (
                    <p className="mt-4 text-sm text-zinc-600">
                        Tu grupo se confirma el <strong>{fechaLarga(a.cierre)}</strong> si reúne {a.minimo} alumnos. Hasta entonces puedes cambiarte.
                    </p>
                )}
            </section>

            {!datos.puedeCambiar && (
                <p className="mt-5 text-sm text-zinc-600">
                    {datos.empezado
                        ? "Tu grupo ya empezó, así que el horario ya no se puede cambiar desde aquí. Si lo necesitas, escríbenos."
                        : "Tu grupo ya está confirmado: a partir del cierre los horarios no se cambian, para no dejar sin lugar a nadie. Si lo necesitas, escríbenos."}
                </p>
            )}

            {datos.puedeCambiar && datos.inicioYaMovido && (
                <p className="mt-5 text-sm text-zinc-600">
                    Ya usaste tu cambio al siguiente inicio en esta compra. Hasta el cierre puedes cambiar de horario dentro de tu misma fecha.
                </p>
            )}

            {datos.puedeCambiar && !hayOpciones && (
                <p className="mt-5 text-sm text-zinc-600">
                    Ahora mismo no hay otro horario con lugar en tu nivel. Escríbenos y te ayudamos a encontrar uno.
                </p>
            )}

            {errorCambio && (
                <p role="alert" className="mt-5 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{errorCambio}</p>
            )}

            {datos.mismoInicio.length > 0 && (
                <Opciones
                    titulo={`Otro horario que empieza el ${fechaLarga(datos.inicio)}`}
                    horarios={datos.mismoInicio}
                    propuesto={propuesto?.h.id}
                    onElegir={(h) => { setPropuesto({ h, cambiaInicio: false }); setHecho(""); }}
                />
            )}

            {datos.siguiente && (
                <Opciones
                    titulo={`O pasa al siguiente inicio: ${fechaLarga(datos.siguiente.fecha)}`}
                    subtitulo="Lo que ya pagaste te cubre ese grupo. Tu fecha de inicio y la de tu próxima renovación se mueven con él. Puedes pasar al siguiente inicio una sola vez por compra."
                    horarios={datos.siguiente.horarios}
                    propuesto={propuesto?.h.id}
                    onElegir={(h) => { setPropuesto({ h, cambiaInicio: true }); setHecho(""); }}
                />
            )}

            {/* Confirmación: cambiar no es irreversible, pero mover el inicio sí toca su cobro. */}
            {propuesto && (
                <div className="sticky bottom-4 mt-6 rounded-2xl border border-falu-red-200 bg-white p-4 shadow-lg">
                    <p className="text-sm text-zinc-800">
                        {propuesto.cambiaInicio
                            ? <>Vas a empezar el <strong>{fechaLarga(propuesto.h.start_date)}</strong>, a las <strong>{infoDeLaHora(propuesto.h.start_date, propuesto.h.hora_pt).hora}</strong>, y no pagas nada más. Solo puedes hacerlo una vez por compra.</>
                            : <>Tu horario pasará a las <strong>{infoDeLaHora(propuesto.h.start_date, propuesto.h.hora_pt).hora}</strong></>}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                        <button
                            onClick={confirmar}
                            disabled={guardando}
                            className="rounded-xl bg-falu-red-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                        >
                            {guardando ? "Guardando…" : "Confirmar cambio"}
                        </button>
                        <button onClick={() => setPropuesto(null)} disabled={guardando} className="rounded-xl border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-700">
                            Cancelar
                        </button>
                    </div>
                </div>
            )}
        </Marco>
    );
}

function Opciones({ titulo, subtitulo, horarios, propuesto, onElegir }: {
    titulo: string;
    subtitulo?: string;
    horarios: Horario[];
    propuesto?: string;
    onElegir: (h: Horario) => void;
}) {
    return (
        <section className="mt-6">
            <h2 className="text-sm font-bold text-zinc-900">{titulo}</h2>
            {subtitulo && <p className="text-xs text-zinc-500 mt-0.5">{subtitulo}</p>}
            <ul className="mt-3 space-y-2">
                {horarios.map((h) => {
                    const info = infoDeLaHora(h.start_date, h.hora_pt);
                    const marcado = propuesto === h.id;
                    const e = etiquetaDeEstado(h);
                    return (
                        <li key={h.id}>
                            <button
                                type="button"
                                onClick={() => onElegir(h)}
                                aria-pressed={marcado}
                                className={`w-full flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left transition ${
                                    marcado ? "border-falu-red-400 bg-falu-red-50 ring-2 ring-falu-red-200" : "border-zinc-200 bg-white hover:border-zinc-300"
                                }`}
                            >
                                <span>
                                    <span className="block text-sm font-semibold text-zinc-900">
                                        {info.hora}
                                        {info.desfaseDia !== 0 && (
                                            <span className="ml-1.5 text-[11px] font-medium text-amber-700">
                                                {info.desfaseDia > 0 ? "(del día siguiente en tu zona)" : "(del día anterior en tu zona)"}
                                            </span>
                                        )}
                                    </span>
                                    <span className="block text-xs text-zinc-600 mt-0.5">{detalle(h)}</span>
                                </span>
                                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${e.clase}`}>{e.texto}</span>
                            </button>
                        </li>
                    );
                })}
            </ul>
        </section>
    );
}

function Marco({ children }: { children: React.ReactNode }) {
    return (
        <main className="min-h-[70vh] bg-zinc-50 px-4 py-10">
            <div className="mx-auto max-w-[560px]">{children}</div>
        </main>
    );
}
