"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useRouter } from "next/navigation";
import { ErrorState } from "../_utils/ErrorState";

/*
  El editor del texto de los correos que manda ESTE sitio.

  El admin escribe TEXTOS, nunca HTML: el diseño lo pone el backend. Por eso lo
  único que hay aquí son campos de escritura, su vista de "se verá" y el botón
  de ver el correo real — no hay editor de marcado ni interruptor de activación.

  ⚠️⚠️ **Se escribe SOBRE LA CARTA, no en un formulario.** Campos rotulados uno
  encima de otro es lo que el negocio rechazó en la plataforma —*"que se vea
  como un editor de correos"*— y por la misma razón: con un formulario el admin
  juzga frases sueltas, y lo que manda es cómo queda el correo entero. Aquí cada
  texto se edita EN SU SITIO, con el tamaño y el peso que va a tener, y el
  rótulo de la ranura solo aparece al enfocarla.

  ⚠️ Aquí GUARDAR es PUBLICAR: el correo siguiente sale con estos textos. La
  previsualización existe justo para poder mirarlo antes.

  ⚠️ La ruta sigue siendo `/admin/correo-interes` aunque ya sean cinco correos.
  Renombrarla obliga a tocar `proxy.ts` —una LISTA BLANCA que redirige a la
  portada lo que no esté declarado— y esa trampa ya costó un "no me muestra
  nada" el mismo día que nació esta pantalla.
*/

type Rol = "asunto" | "titulo" | "titulo_seccion" | "parrafos" | "planes" | "boton" | "nota" | "pasos";

interface Ranura {
    clave: string;
    rol: Rol;
    etiqueta: string;
    ayuda?: string;
    variables?: string[];
    texto: string;
}

interface Correo {
    clave: string;
    nombre: string;
    descripcion: string;
    ranuras: Ranura[];
    /*
      Los correos de ACCESOS vienen uno por plan (`accesos:<PLAN>`) porque su
      copy depende del plan. Se agrupan en UNA entrada de la lista con un
      selector de plan dentro: seis pestañas de "Accesos · …" harían ilegible
      una lista que ya tiene cinco correos distintos.
    */
    grupo?: string;
    plan?: string;
    planLabel?: string;
}

interface Respuesta {
    correos: Correo[];
    guardado: Record<string, Record<string, string>>;
    planesDisponibles: { key: string; label: string }[];
    /** Los valores de ejemplo de CADA correo, no una lista común. */
    ejemplos: Record<string, Record<string, string>>;
}

/*
  Las mismas reglas que el backend, para que el "se verá" no prometa otra cosa:
  `{clave}` se sustituye y una clave que no existe se va.

  ⚠️ El marcador es de UNA llave (`{nombre}`), como el panel de campañas — no el
  `{{doble}}` de la plataforma. Si este regex y el del backend divergen, la
  pantalla miente en la dirección peligrosa: el admin ve un hueco sin resolver,
  lo da por roto y lo cambia.
*/
const HUECO = /\{\s*(\w+)\s*\}/g;

function comoSeVera(texto: string, ejemplos: Record<string, string>) {
    return texto.replace(HUECO, (_, clave: string) =>
        Object.prototype.hasOwnProperty.call(ejemplos, clave) ? ejemplos[clave] : "",
    );
}

/*
  Los problemas de una `{clave}`, y son DOS cosas distintas porque el remedio no
  es el mismo: una desconocida se quita, una torcida se escribe bien y funciona.

  ⚠️ Lo torcido se detecta POR DESCARTE —se quitan los huecos válidos y lo que
  quede con una llave es un intento fallido—. Enumerar las formas de
  equivocarse deja fuera `{ {x}}`, `{nombre` y `{{nombre}}`, que son las que
  alguien comete de verdad.
*/
function problemasDeVariables(texto: string, permitidas: string[]) {
    const usadas = [...texto.matchAll(HUECO)].map((m) => m[1]);
    const desconocidas = [...new Set(usadas.filter((v) => !permitidas.includes(v)))];
    const sinHuecos = texto.replace(HUECO, "");
    const torcidas = /[{}]/.test(sinHuecos)
        ? [...new Set([...sinHuecos.matchAll(/\S*[{}]\S*/g)].map((m) => m[0]))]
        : [];
    return { desconocidas, torcidas };
}

/** `*así*` es negrita, como en WhatsApp. Solo para pintar el "se verá". */
function conNegritas(texto: string) {
    return texto.split(/(\*[^*\n]+\*)/g).map((trozo, i) =>
        trozo.startsWith("*") && trozo.endsWith("*") && trozo.length > 2
            ? <strong key={i}>{trozo.slice(1, -1)}</strong>
            : <span key={i}>{trozo}</span>,
    );
}

const NOMBRE_DE_VARIABLE: Record<string, string> = {
    nombre: "Su nombre",
    fechaInicio: "La próxima fecha de inicio",
    plan: "Su plan",
    fecha: "La fecha",
    nivel: "Su nivel",
    dias: "Los días de su clase",
};

/*
  Cada rol se pinta con la tipografía que tendrá en el correo. Es lo que hace
  que la hoja se lea como el correo y no como una lista de campos: el admin ve
  que eso de arriba es el titular porque MIDE como el titular.
*/
const ESTILO_POR_ROL: Record<Rol, string> = {
    asunto: "text-[14px] font-semibold text-gray-900",
    titulo: "text-[22px] leading-snug font-bold text-gray-900",
    titulo_seccion: "text-[15px] leading-snug font-bold text-gray-900",
    parrafos: "text-[16px] leading-[1.7] text-zinc-700",
    planes: "text-[15px] leading-relaxed text-zinc-700",
    boton: "text-[14px] font-bold text-white text-center",
    nota: "text-[13px] leading-relaxed text-zinc-500",
    pasos: "text-[14px] leading-[1.9] text-zinc-700",
};

/** Un texto que se escribe DONDE va a salir. */
function Editable({
    ranura,
    valor,
    fabrica,
    ejemplos,
    onCambiar,
}: {
    ranura: Ranura;
    valor: string;
    fabrica: string;
    ejemplos: Record<string, string>;
    onCambiar: (v: string) => void;
}) {
    const ref = useRef<HTMLTextAreaElement | null>(null);
    const [enfocado, setEnfocado] = useState(false);
    const enBoton = ranura.rol === "boton";

    /*
        Es un `textarea` siempre —también para un titular de una línea— porque
        crece con el contenido y así se ve el largo REAL de la frase. Un `input`
        la recorta y esconde justo lo que hay que juzgar.
    */
    const ajustarAlto = useCallback(() => {
        const el = ref.current;
        if (!el) return;
        el.style.height = "auto";
        el.style.height = `${el.scrollHeight}px`;
    }, []);

    /*
        ⚠️⚠️ Medir en el `useEffect` de montaje da una altura INVENTADA, y se vio
        en pantalla: el titular de una línea nacía con **920 px** y un párrafo
        con **11.268**, o sea la carta entera en blanco bajo la primera frase.
        La causa es que a esa altura el ancho todavía no es el definitivo, así
        que el texto se mide envuelto a un ancho que no existe.

        Por eso se mide TRES veces y no una: en el fotograma siguiente (ya con
        el ancho bueno), cuando las fuentes terminan de cargar —cambian el alto
        de línea— y en cada `resize`. Medir una sola vez es lo que falló.
    */
    useEffect(() => {
        ajustarAlto();
        const enElSiguienteFotograma = requestAnimationFrame(ajustarAlto);
        window.addEventListener("resize", ajustarAlto);
        document.fonts?.ready.then(ajustarAlto).catch(() => { });
        return () => {
            cancelAnimationFrame(enElSiguienteFotograma);
            window.removeEventListener("resize", ajustarAlto);
        };
    }, [valor, ajustarAlto]);

    const cambiado = valor !== fabrica;
    const vacio = valor.trim() === "";
    /*
        ⚠️⚠️ Lo permitido es lo que declara ESTA ranura, no todo el correo. El
        asunto se calcula en el sender y ahí no están todos los datos: con la
        lista del correo entero, teclear {nombre} en el asunto de accesos no
        avisaba, el campo enseñaba "Se verá: Ana Pérez" y en la bandeja salía
        "Hola , …". Medido.
    */
    const permitidasAqui = ranura.variables ?? [];
    const ejemplosAqui = Object.fromEntries(
        Object.entries(ejemplos).filter(([k]) => permitidasAqui.includes(k)),
    );
    const previa = comoSeVera(valor, ejemplosAqui);
    const { desconocidas, torcidas } = problemasDeVariables(valor, permitidasAqui);
    const hayProblema = desconocidas.length > 0 || torcidas.length > 0;

    // Solo se enseña cuando DICE algo nuevo: con un texto sin variables, "se
    // verá" repetiría lo que ya está escrito tres centímetros más arriba.
    const mereceVista = previa.trim() !== valor.trim() && previa.trim() !== "";

    function insertar(variable: string) {
        const el = ref.current;
        const marca = `{${variable}}`;
        if (!el) { onCambiar(valor + marca); return; }
        const i = el.selectionStart ?? valor.length;
        const j = el.selectionEnd ?? i;
        onCambiar(valor.slice(0, i) + marca + valor.slice(j));
        // React repinta el textarea con el valor nuevo: el cursor se coloca en
        // el fotograma siguiente, o se va al final y hay que buscar el sitio.
        requestAnimationFrame(() => {
            el.focus();
            el.setSelectionRange(i + marca.length, i + marca.length);
        });
    }

    return (
        <div className="relative">
            <textarea
                ref={ref}
                value={valor}
                onChange={(e) => onCambiar(e.target.value)}
                onFocus={() => setEnfocado(true)}
                onBlur={() => setEnfocado(false)}
                rows={1}
                spellCheck
                placeholder={
                    ranura.rol === "asunto"
                        ? "Sin asunto se usa el original: un correo sin asunto cae en spam"
                        : "Vacío: esta sección no saldrá en el correo"
                }
                aria-label={ranura.etiqueta}
                className={[
                    "block w-full resize-none overflow-hidden bg-transparent",
                    "rounded-lg px-3 -mx-3 py-1.5 transition outline-none",
                    // El campo no se ve hasta que se le acerca el ratón: la hoja
                    // tiene que leerse como un correo, no como una lista de cajas.
                    enBoton
                        ? "hover:bg-white/15 focus:bg-white/20 ring-1 ring-transparent focus:ring-2 focus:ring-white/70 placeholder:text-white/60"
                        : "hover:bg-yellow-orange-50/70 focus:bg-white ring-1 ring-transparent hover:ring-yellow-orange-200 focus:ring-2 focus:ring-yellow-orange-400 placeholder:text-gray-400",
                    "placeholder:italic placeholder:font-normal placeholder:text-sm",
                    hayProblema ? "ring-2 ring-red-300" : "",
                    vacio && !enBoton ? "opacity-70" : "",
                    ESTILO_POR_ROL[ranura.rol],
                ].join(" ")}
            />

            {/* El rótulo de la ranura solo aparece al enfocar: en reposo estorba. */}
            {enfocado && (
                <div className="mt-1 mb-2 -mx-3 px-3 py-2 rounded-lg bg-gray-50 border border-gray-200">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                        <span className="text-xs font-semibold text-gray-700">{ranura.etiqueta}</span>
                        {ranura.variables?.map((v) => (
                            <button
                                key={v}
                                type="button"
                                // `onMouseDown` y no `onClick`: el clic quita el
                                // foco antes de disparar, y sin foco no hay
                                // cursor donde insertar — ni barra que pulsar.
                                onMouseDown={(e) => { e.preventDefault(); insertar(v); }}
                                className="min-h-[36px] px-2.5 rounded-md text-xs font-semibold bg-white hover:bg-gray-100 text-gray-800 border border-gray-300"
                            >
                                + {NOMBRE_DE_VARIABLE[v] ?? v}
                            </button>
                        ))}
                        {cambiado && (
                            <button
                                type="button"
                                onMouseDown={(e) => { e.preventDefault(); onCambiar(fabrica); }}
                                className="min-h-[36px] px-2.5 text-xs font-semibold text-gray-600 hover:text-gray-900 underline decoration-dotted"
                            >
                                Restaurar el original
                            </button>
                        )}
                    </div>
                    {ranura.ayuda && (
                        <p className="mt-1.5 text-xs text-gray-500 leading-relaxed">{ranura.ayuda}</p>
                    )}
                </div>
            )}

            {hayProblema && (
                <p className="mt-1 mb-2 text-xs text-red-700">
                    {desconocidas.length > 0 && (
                        <>{desconocidas.map((d) => `{${d}}`).join(", ")}: este correo no tiene ese dato, saldría vacío. </>
                    )}
                    {torcidas.length > 0 && (
                        <>{torcidas.join(", ")}: no tiene la forma {"{unDato}"}. </>
                    )}
                    {permitidasAqui.length > 0
                        ? <>Sí puede usar {permitidasAqui.map((p) => `{${p}}`).join(", ")}.</>
                        : <>Este texto no admite ningún dato.</>}
                </p>
            )}

            {mereceVista && !hayProblema && (
                <p className={`mt-1 mb-2 text-xs whitespace-pre-line ${enBoton ? "text-white/80" : "text-gray-500"}`}>
                    <span className="font-semibold">Se verá:</span> {conNegritas(previa)}
                </p>
            )}
        </div>
    );
}

/**
 * La ranura de planes no es texto libre: son CUÁLES salen.
 *
 * ⚠️ Se guarda igual —una lista separada por comas, que es lo que el backend
 * parsea— pero teclear nombres de plan a mano es la única forma de equivocarse
 * aquí: una errata no falla, simplemente ese plan no sale y nadie se entera.
 */
function ElegirPlanes({
    valor,
    disponibles,
    onCambiar,
}: {
    valor: string;
    disponibles: { key: string; label: string }[];
    onCambiar: (v: string) => void;
}) {
    const elegidos = useMemo(
        () => valor.split(",").map((s) => s.trim()).filter(Boolean),
        [valor],
    );
    const esta = (k: string) => elegidos.some((e) => e.toLowerCase() === k.toLowerCase());

    function alternar(k: string) {
        const siguiente = esta(k)
            ? elegidos.filter((e) => e.toLowerCase() !== k.toLowerCase())
            // Se respeta el ORDEN del catálogo, que va por precio: así la carta
            // los enumera de menor a mayor sin que nadie lo ordene a mano.
            : disponibles.filter((p) => p.key === k || esta(p.key)).map((p) => p.key);
        onCambiar(siguiente.join(", "));
    }

    return (
        <div className="my-3 rounded-xl border border-dashed border-gray-300 bg-gray-50/70 px-3 py-3">
            <p className="text-xs font-semibold text-gray-700">Los planes que se ofrecen en la carta</p>
            <div className="mt-2 flex flex-wrap gap-2">
                {disponibles.map((p) => (
                    <button
                        key={p.key}
                        type="button"
                        onClick={() => alternar(p.key)}
                        aria-pressed={esta(p.key)}
                        className={[
                            "min-h-[44px] px-3 rounded-lg text-sm font-semibold border transition",
                            esta(p.key)
                                ? "bg-yellow-orange-500 text-white border-yellow-orange-500"
                                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100",
                        ].join(" ")}
                    >
                        {p.label}
                    </button>
                ))}
            </div>
            <p className="mt-2 text-xs text-gray-500 leading-relaxed">
                Aquí solo eliges <strong>cuáles</strong> aparecen. El nombre, el precio, si renueva y si
                empieza con un grupo salen de <strong>Planes</strong> y se pintan solos en el correo.
            </p>
            {elegidos.length === 0 && (
                <p className="mt-1 text-xs text-amber-700">Sin ninguno marcado, la carta no ofrece ningún plan.</p>
            )}
        </div>
    );
}

export default function CorreosDelSitioPage() {
    const router = useRouter();
    const [datos, setDatos] = useState<Respuesta | null>(null);
    /*
        Un borrador POR CORREO.

        ⚠️ La lista invita justo a saltar de uno a otro, así que con un solo
        borrador cambiar de correo se llevaría lo tecleado en silencio. Es el
        mismo fallo que hubo que arreglar en el editor de la plataforma.
    */
    const [borradores, setBorradores] = useState<Record<string, Record<string, string>>>({});
    const [seleccionado, setSeleccionado] = useState<string | null>(null);
    const [cargando, setCargando] = useState(true);
    const [errorCarga, setErrorCarga] = useState<string | null>(null);
    const [guardando, setGuardando] = useState(false);
    const [guardado, setGuardado] = useState(false);
    const [error, setError] = useState("");
    const [vista, setVista] = useState<string | null>(null);
    const [cargandoVista, setCargandoVista] = useState(false);
    const vistaRef = useRef<HTMLDivElement | null>(null);

    const correo = useMemo(
        () => datos?.correos.find((c) => c.clave === seleccionado) ?? null,
        [datos, seleccionado],
    );
    // En su propio `useMemo`: si no, es un objeto nuevo en cada render y todo
    // lo que dependa de él se recalcula siempre.
    const textos = useMemo(
        () => (seleccionado ? borradores[seleccionado] ?? {} : {}),
        [seleccionado, borradores],
    );
    const ejemplos = useMemo(
        () => (seleccionado ? datos?.ejemplos?.[seleccionado] ?? {} : {}),
        [datos, seleccionado],
    );

    // El texto de FÁBRICA de cada ranura, para poder restaurarlo campo a campo.
    const fabrica = useMemo(() => {
        const m: Record<string, string> = {};
        correo?.ranuras.forEach((r) => { m[r.clave] = r.texto; });
        return m;
    }, [correo]);

    const cambiados = useMemo(
        () => Object.keys(fabrica).filter((c) => (textos[c] ?? "") !== fabrica[c]),
        [fabrica, textos],
    );

    /** ¿Ese correo tiene algo sin guardar? Se pregunta por CORREO, no en global. */
    const sinGuardarDe = useCallback(
        (clave: string) => {
            const c = datos?.correos.find((x) => x.clave === clave);
            if (!c) return false;
            const yaGuardado = datos?.guardado[clave] ?? {};
            const borrador = borradores[clave] ?? {};
            return c.ranuras.some((r) => {
                const actual = borrador[r.clave] ?? "";
                const previo = typeof yaGuardado[r.clave] === "string" ? yaGuardado[r.clave] : r.texto;
                return actual !== previo;
            });
        },
        [datos, borradores],
    );

    const sinGuardar = seleccionado ? sinGuardarDe(seleccionado) : false;
    const algunoSinGuardar = useMemo(
        () => (datos?.correos ?? []).some((c) => sinGuardarDe(c.clave)),
        [datos, sinGuardarDe],
    );

    const cargar = useCallback(async () => {
        setErrorCarga(null);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) { router.push("/admin/login"); return; }

            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/config/email-slots`, {
                headers: { Authorization: `Bearer ${session.access_token}` },
            });
            if (!res.ok) throw new Error(`Error del servidor (${res.status})`);
            const json: Respuesta = await res.json();
            setDatos(json);

            const iniciales: Record<string, Record<string, string>> = {};
            for (const c of json.correos) {
                const yaGuardado = json.guardado[c.clave] ?? {};
                iniciales[c.clave] = Object.fromEntries(
                    c.ranuras.map((r) => [
                        r.clave,
                        typeof yaGuardado[r.clave] === "string" ? yaGuardado[r.clave] : r.texto,
                    ]),
                );
            }
            setBorradores(iniciales);
            setSeleccionado((s) => s ?? json.correos[0]?.clave ?? null);
        } catch (e) {
            setErrorCarga(e instanceof Error ? e.message : "Error de red");
        } finally {
            setCargando(false);
        }
    }, [router]);

    useEffect(() => { cargar(); }, [cargar]);

    // ⚠️ Son decenas de textos: cerrar la pestaña sin avisar se lleva una tarde.
    useEffect(() => {
        if (!algunoSinGuardar) return;
        const avisar = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ""; };
        window.addEventListener("beforeunload", avisar);
        return () => window.removeEventListener("beforeunload", avisar);
    }, [algunoSinGuardar]);

    function ponTexto(clave: string, v: string) {
        if (!seleccionado) return;
        setBorradores((b) => ({ ...b, [seleccionado]: { ...b[seleccionado], [clave]: v } }));
    }

    async function sesionOSalir() {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { router.push("/admin/login"); return null; }
        return session;
    }

    async function guardar() {
        if (!correo) return;
        setGuardando(true); setGuardado(false); setError("");
        const session = await sesionOSalir();
        if (!session) { setGuardando(false); return; }

        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/config/email-slots`, {
            method: "PUT",
            headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" },
            body: JSON.stringify({ correo: correo.clave, textos }),
        });

        if (res.ok) {
            setGuardado(true);
            setTimeout(() => setGuardado(false), 2500);
            setDatos((d) => (d ? { ...d, guardado: { ...d.guardado, [correo.clave]: { ...textos } } } : d));
        } else {
            const cuerpo = await res.json().catch(() => ({}));
            setError(cuerpo.error || "No se pudieron guardar los cambios. Intenta de nuevo.");
        }
        setGuardando(false);
    }

    async function verElCorreo() {
        if (!correo) return;
        setCargandoVista(true); setError("");
        const session = await sesionOSalir();
        if (!session) { setCargandoVista(false); return; }

        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/config/email-slots/preview`, {
            method: "POST",
            headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" },
            body: JSON.stringify({ correo: correo.clave, textos }),
        });
        if (res.ok) {
            setVista((await res.json()).html);
            // Sin esto la vista se pinta fuera de pantalla y parece que el botón
            // no hizo nada: es el fallo que ya tuvo el editor de la plataforma.
            setTimeout(() => vistaRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
        } else {
            setError("No se pudo generar la vista previa.");
        }
        setCargandoVista(false);
    }

    if (errorCarga) return <ErrorState message={errorCarga} onRetry={cargar} />;

    if (cargando || !correo) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="flex flex-col items-center gap-3 text-gray-500">
                <svg className="w-8 h-8 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span className="text-sm">Cargando…</span>
            </div>
        </div>
    );

    const asunto = correo.ranuras.find((r) => r.rol === "asunto") ?? null;
    const cuerpo = correo.ranuras.filter((r) => r.rol !== "asunto");

    /*
      La lista de la izquierda: un correo suelto es una entrada, y los que
      cambian POR PLAN se agrupan en una sola con su selector debajo.
    */
    const entradas: { id: string; nombre: string; claves: string[] }[] = [];
    for (const c of datos?.correos ?? []) {
        if (!c.grupo) { entradas.push({ id: c.clave, nombre: c.nombre, claves: [c.clave] }); continue; }
        const ya = entradas.find((e) => e.id === c.grupo);
        if (ya) ya.claves.push(c.clave);
        else entradas.push({ id: c.grupo, nombre: "Accesos", claves: [c.clave] });
    }
    const porPlan = correo.grupo
        ? (datos?.correos ?? []).filter((c) => c.grupo === correo.grupo)
        : [];

    return (
        <div className="p-4 md:p-8 pb-28">
            <div className="max-w-[720px] mx-auto">
                <div className="mb-4">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Textos de los correos</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Los que manda este sitio. La bienvenida y los de la cuenta se editan en la plataforma.
                    </p>
                </div>

                {/* La lista: cada correo con su marca de borrador sin guardar. */}
                <div className="flex flex-wrap gap-2 mb-3">
                    {entradas.map((e) => {
                        const activo = e.claves.includes(seleccionado ?? "");
                        const conBorrador = e.claves.some((k) => sinGuardarDe(k));
                        return (
                            <button
                                key={e.id}
                                type="button"
                                onClick={() => { setSeleccionado(e.claves[0]); setVista(null); setError(""); }}
                                aria-pressed={activo}
                                className={[
                                    "min-h-[44px] px-3 rounded-xl text-sm font-semibold border transition flex items-center gap-2",
                                    activo
                                        ? "bg-gray-900 text-white border-gray-900"
                                        : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100",
                                ].join(" ")}
                            >
                                {e.nombre}
                                {conBorrador && (
                                    <span
                                        title="Tiene cambios sin guardar"
                                        className={`h-2 w-2 rounded-full ${activo ? "bg-yellow-orange-300" : "bg-yellow-orange-500"}`}
                                    />
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* El selector de PLAN, solo en el correo que cambia por plan. */}
                {porPlan.length > 1 && (
                    <div className="mb-4 rounded-xl border border-dashed border-gray-300 bg-gray-50/70 px-3 py-3">
                        <p className="text-xs font-semibold text-gray-700">
                            Este correo cambia según el plan. Estás editando el de:
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                            {porPlan.map((c) => {
                                const activo = c.clave === seleccionado;
                                return (
                                    <button
                                        key={c.clave}
                                        type="button"
                                        onClick={() => { setSeleccionado(c.clave); setVista(null); setError(""); }}
                                        aria-pressed={activo}
                                        className={[
                                            "min-h-[44px] px-3 rounded-lg text-sm font-semibold border transition flex items-center gap-2",
                                            activo
                                                ? "bg-yellow-orange-500 text-white border-yellow-orange-500"
                                                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100",
                                        ].join(" ")}
                                    >
                                        {c.planLabel ?? c.plan}
                                        {sinGuardarDe(c.clave) && (
                                            <span
                                                title="Tiene cambios sin guardar"
                                                className={`h-2 w-2 rounded-full ${activo ? "bg-white" : "bg-yellow-orange-500"}`}
                                            />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                        <p className="mt-2 text-xs text-gray-500 leading-relaxed">
                            Cada plan tiene su propio texto y se guarda por separado: cambiar uno no toca a los demás.
                        </p>
                    </div>
                )}

                <p className="mb-3 text-xs text-gray-500 leading-relaxed">
                    {correo.descripcion}{" "}
                    Haz clic sobre cualquier texto para cambiarlo. Para poner algo en{" "}
                    <strong>negrita</strong>, escríbelo entre asteriscos:{" "}
                    <code className="bg-gray-100 px-1 rounded">*así*</code>.
                </p>

                {/* El ASUNTO va FUERA de la hoja: no es parte del correo, es lo
                    que se lee en la bandeja antes de abrirlo. */}
                {asunto && (
                    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm px-5 py-3 mb-3">
                        <div className="flex items-baseline gap-3">
                            <span className="shrink-0 text-xs font-semibold text-gray-500 w-14">Asunto</span>
                            <div className="min-w-0 flex-1">
                                <Editable
                                    ranura={asunto}
                                    valor={textos[asunto.clave] ?? ""}
                                    fabrica={fabrica[asunto.clave] ?? ""}
                                    ejemplos={ejemplos}
                                    onCambiar={(v) => ponTexto(asunto.clave, v)}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* La hoja. Reproduce el envoltorio del correo para que lo que se
                    edita se lea en su sitio: la barra de marca y el pie son del
                    diseño y NO se tocan desde aquí. */}
                <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                    <div className="h-1.5 bg-yellow-orange-500" />
                    <div className="px-5 pt-5">
                        <span className="inline-block rounded-full bg-gray-100 px-3 py-1 text-[11px] font-semibold tracking-wide text-gray-600">
                            LZ English Academy · Método 590
                        </span>
                    </div>

                    <div className="px-5 py-5 flex flex-col">
                        {cuerpo.map((r) => {
                            const valor = textos[r.clave] ?? "";
                            const alCambiar = (v: string) => ponTexto(r.clave, v);

                            if (r.rol === "planes") {
                                return (
                                    <ElegirPlanes
                                        key={r.clave}
                                        valor={valor}
                                        disponibles={datos?.planesDisponibles ?? []}
                                        onCambiar={alCambiar}
                                    />
                                );
                            }

                            const campo = (
                                <Editable
                                    ranura={r}
                                    valor={valor}
                                    fabrica={fabrica[r.clave] ?? ""}
                                    ejemplos={ejemplos}
                                    onCambiar={alCambiar}
                                />
                            );

                            // El botón se escribe DENTRO del botón: su rótulo se
                            // juzga sobre el color que va a tener, no sobre blanco.
                            if (r.rol === "boton") {
                                return (
                                    <div key={r.clave} className="mt-4">
                                        <span className="inline-flex rounded-xl bg-falu-red-700 px-5 py-3 max-w-full">
                                            {campo}
                                        </span>
                                    </div>
                                );
                            }

                            return (
                                <div
                                    key={r.clave}
                                    className={r.rol === "titulo_seccion" ? "mt-5" : r.rol === "titulo" ? "" : "mt-2"}
                                >
                                    {campo}
                                </div>
                            );
                        })}
                    </div>

                    <div className="border-t border-gray-100 px-5 py-3">
                        <p className="text-[11px] text-gray-400">
                            Notificación automática · el pie y el enlace para darse de baja los pone el diseño
                        </p>
                    </div>
                </div>

                {error && (
                    <div className="mt-4 px-4 py-3 rounded-xl bg-red-50 border border-red-300 text-sm text-red-800">{error}</div>
                )}
                {guardado && (
                    <div className="mt-4 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-300 text-sm text-emerald-800 flex items-center gap-2">
                        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        Guardado. El próximo correo ya sale con estos textos.
                    </div>
                )}

                {vista && (
                    <div ref={vistaRef} className="mt-6">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-semibold text-gray-800">El correo, tal y como se recibe</p>
                            <button
                                type="button"
                                onClick={() => setVista(null)}
                                className="min-h-[44px] px-3 text-xs font-semibold text-gray-700 hover:text-gray-900 underline decoration-dotted"
                            >
                                Cerrar
                            </button>
                        </div>
                        <iframe
                            title="Vista previa del correo"
                            srcDoc={vista}
                            sandbox=""
                            className="w-full h-[70vh] rounded-2xl border border-gray-300 bg-white"
                        />
                    </div>
                )}
            </div>

            {/* Pie fijo: el correo es largo y el botón de guardar quedaría muy abajo. */}
            <div className="fixed bottom-0 left-0 right-0 md:left-64 bg-white/95 backdrop-blur border-t border-gray-200 px-4 py-3">
                <div className="max-w-[720px] mx-auto flex items-center justify-between gap-3">
                    <p className="text-xs text-gray-600 min-w-0 truncate">
                        {sinGuardar
                            ? "Tienes cambios sin guardar"
                            : cambiados.length > 0
                                ? `${cambiados.length} ${cambiados.length === 1 ? "texto cambiado" : "textos cambiados"} respecto al original`
                                : "Todo con los textos originales"}
                    </p>
                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            type="button"
                            onClick={verElCorreo}
                            disabled={cargandoVista}
                            className="min-h-[44px] px-4 rounded-xl text-sm font-semibold border border-gray-300 text-gray-800 hover:bg-gray-100 disabled:opacity-40"
                        >
                            {cargandoVista ? "Generando…" : "Ver el correo real"}
                        </button>
                        <button
                            type="button"
                            onClick={guardar}
                            disabled={guardando || !sinGuardar}
                            className="min-h-[44px] px-5 rounded-xl text-sm font-semibold bg-yellow-orange-500 text-white hover:bg-yellow-orange-600 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            {guardando ? "Guardando…" : "Guardar y publicar"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
