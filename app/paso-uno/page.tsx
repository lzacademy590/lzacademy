"use client";

/**
 * Paso 1 de 3 del embudo («Sobre ti»): nivel + qué se le dificulta, en UNA
 * pantalla (antes /paso-uno y /paso-dos). Sigue a /paso-tres con
 * `?nivel=<A1|A2|B1|B2>&dificultades=<csv>`, que alimenta `recomendarPlan`.
 *
 * ⚠️ Los ids de dificultad son los de `NOMBRE_DE_DIFICULTAD`
 * (app/lib/recomendacion.ts): cambiarlos aquí deja la recomendación muda.
 *
 * Lee `?nivel=` y `?dificultades=` para volver con lo ya elegido
 * («Cambiar mis respuestas» y la redirección del viejo /paso-dos).
 */

import Image from "next/image";
import Link from "next/link";
import { Suspense, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ProgresoDelEmbudo from "@/app/components/ProgresoDelEmbudo";
import { medirDificultades, medirNivelElegido, medirPaso } from "@/app/lib/analitica";

type Nivel = "A1" | "A2" | "B1" | "B2";
type Opcion = Nivel | "?";

const NIVELES: { code: Opcion; name: string; desc: string }[] = [
  { code: "A1", name: "Principiante", desc: "Solo entiendo y uso frases muy básicas." },
  { code: "A2", name: "Básico", desc: "Puedo comunicarme en situaciones simples." },
  { code: "B1", name: "Intermedio", desc: "Me desenvuelvo en conversaciones cotidianas." },
  { code: "B2", name: "Intermedio alto", desc: "Expreso ideas con claridad y bastante fluidez." },
  { code: "?", name: "No estoy seguro/a", desc: "Lo averiguamos en 1 minuto." },
];

const DIFICULTADES = [
  { id: "hablarlo", label: "Hablarlo" },
  { id: "gramatica", label: "Gramática" },
  { id: "escuchar", label: "Entender al escucharlo" },
  { id: "confianza", label: "Confianza al hablar" },
];

/** Test rápido: [pregunta, opciones, índice de la correcta]. */
const PREGUNTAS: [string, string[], number][] = [
  ["¿Cuál está bien escrita?", ["She are my friend.", "She is my friend.", "She my friend is."], 1],
  ["“I ___ to the gym yesterday.”", ["go", "went", "gone"], 1],
  ["¿Qué significa “I’m looking forward to it”?", ["Lo estoy buscando", "Tengo muchas ganas", "Ya lo vi"], 1],
  ["“If I ___ more time, I would travel.”", ["have", "had", "will have"], 1],
  ["“She’s been working here ___ 2019.”", ["since", "for", "from"], 0],
];

/** 0-1 → A1, 2 → A2, 3-4 → B1, 5 → B2. */
function nivelPorPuntos(p: number): Nivel {
  if (p <= 1) return "A1";
  if (p === 2) return "A2";
  if (p <= 4) return "B1";
  return "B2";
}

const CODIGOS: Opcion[] = NIVELES.map((n) => n.code);
const IDS_DIFICULTAD = DIFICULTADES.map((d) => d.id);

const FOCO =
  "focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-lz-violet";

type Fase = "menu" | "test" | "res";

function PasoUnoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [nivel, setNivel] = useState<Opcion | null>(() => {
    const n = (searchParams.get("nivel") ?? "").trim().toUpperCase();
    return (CODIGOS as string[]).includes(n) ? (n as Opcion) : null;
  });
  const [difs, setDifs] = useState<string[]>(() =>
    (searchParams.get("dificultades") ?? "")
      .split(",")
      .map((d) => d.trim())
      .filter((d, i, arr) => IDS_DIFICULTAD.includes(d) && arr.indexOf(d) === i),
  );
  const [fase, setFase] = useState<Fase>("menu");
  // Cómo se llegó al resultado: el texto no puede hablar de "test" a quien no lo hizo.
  const [porElTest, setPorElTest] = useState(false);
  const [pregunta, setPregunta] = useState(0);
  // Una respuesta por pregunta (índice elegido, -1 = «No lo sé»): así se puede volver atrás.
  const [respuestas, setRespuestas] = useState<number[]>([]);

  const medido = useRef(false);
  useEffect(() => {
    if (medido.current) return;
    medido.current = true;
    medirPaso("paso_uno_visto");
  }, []);

  // Al avanzar en el test o ver el resultado, el foco va al título del panel:
  // si no, quien usa teclado se queda sobre un botón que ya no existe.
  const tituloPanel = useRef<HTMLHeadingElement>(null);
  const moverFoco = useRef(false);
  useEffect(() => {
    if (!moverFoco.current) return;
    moverFoco.current = false;
    tituloPanel.current?.focus({ preventScroll: true });
    // Que la pregunta se vea entera: en escritorio quedaba medio fuera de pantalla.
    panel.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [fase, pregunta]);

  const radios = useRef<(HTMLButtonElement | null)[]>([]);
  const panel = useRef<HTMLElement>(null);

  function elegirNivel(code: Opcion) {
    setNivel(code);
    setFase("menu");
    setPregunta(0);
    setRespuestas([]);
    if (code !== "?") medirNivelElegido(code, "lista");
    else {
      // El panel del test aparece debajo: llevarlo a la vista para que no quede bajo el pliegue.
      setTimeout(() => panel.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 0);
    }
  }

  function teclaEnNiveles(e: KeyboardEvent<HTMLDivElement>) {
    const actual = radios.current.findIndex((r) => r === document.activeElement);
    if (actual < 0) return;
    let siguiente = -1;
    if (e.key === "ArrowDown" || e.key === "ArrowRight") siguiente = (actual + 1) % NIVELES.length;
    else if (e.key === "ArrowUp" || e.key === "ArrowLeft") siguiente = (actual - 1 + NIVELES.length) % NIVELES.length;
    else if (e.key === "Home") siguiente = 0;
    else if (e.key === "End") siguiente = NIVELES.length - 1;
    if (siguiente < 0) return;
    e.preventDefault();
    radios.current[siguiente]?.focus();
    elegirNivel(NIVELES[siguiente].code);
  }

  function empezarTest() {
    moverFoco.current = true;
    setFase("test");
    setPregunta(0);
    setRespuestas([]);
  }

  function porDefecto() {
    moverFoco.current = true;
    setNivel("A1");
    setPorElTest(false);
    setFase("res");
    medirNivelElegido("A1", "por_defecto");
  }

  function responder(j: number) {
    const nuevas = [...respuestas.slice(0, pregunta), j];
    setRespuestas(nuevas);
    moverFoco.current = true;
    if (pregunta === PREGUNTAS.length - 1) {
      const total = nuevas.filter((r, i) => r === PREGUNTAS[i][2]).length;
      const resultado = nivelPorPuntos(total);
      setNivel(resultado);
      setPorElTest(true);
      setFase("res");
      medirNivelElegido(resultado, "test");
    } else {
      setPregunta(pregunta + 1);
    }
  }

  function anterior() {
    if (pregunta === 0) return;
    moverFoco.current = true;
    setPregunta(pregunta - 1);
  }

  function toggle(id: string) {
    setDifs((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  const listo = nivel !== null && nivel !== "?";
  const mostrarPanel = nivel === "?" || fase !== "menu";
  const indiceEnfocable = Math.max(0, nivel ? CODIGOS.indexOf(nivel) : 0);

  function continuar() {
    if (!listo) return;
    medirDificultades(difs);
    const query = `nivel=${encodeURIComponent(nivel)}&dificultades=${encodeURIComponent(difs.join(","))}`;
    // Se apunta lo elegido en ESTA entrada del historial: así el «atrás» del
    // navegador desde /paso-tres vuelve con las respuestas, no en blanco.
    // ⚠️ `history.replaceState` y no `router.replace`: seguido de `router.push`,
    // el replace del router se pierde (medido en el navegador).
    window.history.replaceState(window.history.state, "", `/paso-uno?${query}`);
    router.push(`/paso-tres?${query}`);
  }

  return (
    <main className="min-h-[calc(100dvh-68px)] bg-lz-lila text-lz-ink">
      <div className="lz-wrap pt-8 pb-16 sm:pt-12 sm:pb-[72px] grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:gap-12 lg:items-start">
        <div className="min-w-0 flex flex-col gap-[22px]">
          <ProgresoDelEmbudo paso={1} />

          <h1 className="lz-display font-display text-[32px] sm:text-[48px]">
            1. ¿Cuál es tu nivel de inglés?
          </h1>
          <p className="lz-lead -mt-2">
            Elige el que más se parezca a ti. Si te equivocas, lo ajustamos después.
          </p>

          <div
            role="radiogroup"
            aria-label="Tu nivel de inglés"
            className="flex flex-col gap-2.5"
            onKeyDown={teclaEnNiveles}
          >
            {NIVELES.map((n, i) => {
              const on = nivel === n.code;
              return (
                <button
                  key={n.code}
                  ref={(el) => {
                    radios.current[i] = el;
                  }}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  tabIndex={i === indiceEnfocable ? 0 : -1}
                  onClick={() => elegirNivel(n.code)}
                  className={`lz-opt ${FOCO}`}
                >
                  <span
                    aria-hidden="true"
                    className="font-display font-extrabold flex h-11 w-[52px] flex-[0_0_52px] items-center justify-center rounded-xl bg-lz-lila2 text-[20px] text-lz-violet"
                  >
                    {n.code}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <b className="text-[17px]">{n.name}</b>
                    <span className="text-[14px] text-lz-ink2">{n.desc}</span>
                  </span>
                  <span
                    aria-hidden="true"
                    className={`flex h-[26px] w-[26px] flex-[0_0_26px] items-center justify-center rounded-full border-[1.5px] text-[14px] font-bold text-white ${
                      on ? "border-lz-grape bg-lz-grape" : "border-lz-bd2 bg-white"
                    }`}
                  >
                    {on ? "✓" : ""}
                  </span>
                </button>
              );
            })}
          </div>

          {mostrarPanel && (
            <section
              ref={panel}
              aria-label="Descubre tu nivel"
              className="lz-card flex flex-col gap-4 p-5 sm:p-6 border-lz-grape"
            >
              {fase === "menu" && (
                <>
                  <h2 ref={tituloPanel} tabIndex={-1} className="lz-display font-display text-[24px] sm:text-[28px] outline-none">
                    Lo averiguamos aquí mismo
                  </h2>
                  <p className="lz-p">Elige cómo averiguarlo. El test rápido no te saca del sitio.</p>
                  <div className="flex flex-wrap gap-2.5">
                    <button type="button" onClick={empezarTest} className={`lz-btn lz-btn-1 lz-btn-sm ${FOCO}`}>
                      Test rápido de 5 preguntas
                    </button>
                    <button type="button" onClick={porDefecto} className={`lz-btn lz-btn-2 lz-btn-sm ${FOCO}`}>
                      Empezar en A1 y ajustarlo después
                    </button>
                  </div>
                  <a
                    href="https://www.englishradar.com/english-test/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`self-start inline-flex min-h-[44px] items-center text-[14px] text-lz-ink2 underline underline-offset-2 hover:text-lz-violet rounded ${FOCO}`}
                  >
                    Prefiero un test más largo (EnglishRadar, externo)
                    <span className="sr-only"> (se abre en una pestaña nueva)</span>
                  </a>
                </>
              )}

              {fase === "test" && (
                <>
                  <span className="text-[13px] font-bold text-lz-ink3">
                    Pregunta {pregunta + 1} de {PREGUNTAS.length}
                  </span>
                  <h2 ref={tituloPanel} tabIndex={-1} className="lz-display font-display text-[22px] sm:text-[26px] outline-none">
                    {PREGUNTAS[pregunta][0]}
                  </h2>
                  <div className="flex flex-col gap-2">
                    {PREGUNTAS[pregunta][1].map((t, j) => (
                      <button
                        key={`${pregunta}-${j}`}
                        type="button"
                        aria-pressed={respuestas[pregunta] === j}
                        onClick={() => responder(j)}
                        className={`lz-opt min-h-[52px] text-[16px] ${FOCO}`}
                      >
                        {t}
                      </button>
                    ))}
                    <button
                      type="button"
                      aria-pressed={respuestas[pregunta] === -1}
                      onClick={() => responder(-1)}
                      className={`lz-opt min-h-[52px] text-[16px] text-lz-ink2 ${FOCO}`}
                    >
                      No lo sé
                    </button>
                  </div>
                  {pregunta > 0 && (
                    <button type="button" onClick={anterior} className={`lz-btn lz-btn-3 lz-btn-sm self-start ${FOCO}`}>
                      ← Pregunta anterior
                    </button>
                  )}
                </>
              )}

              {fase === "res" && listo && (
                <>
                  <span className="lz-pill lz-pill-lila self-start">Listo</span>
                  <h2 ref={tituloPanel} tabIndex={-1} className="lz-display font-display text-[24px] sm:text-[28px] outline-none">
                    {porElTest ? `Te recomendamos empezar en ${nivel}` : `Empiezas en ${nivel}`}
                  </h2>
                  <p className="lz-p">
                    Ya lo marcamos arriba. Si después ves que no es tu nivel, puedes cambiarlo antes de pagar.
                  </p>
                  <button type="button" onClick={empezarTest} className={`lz-btn lz-btn-3 self-start ${FOCO}`}>
                    {porElTest ? "Repetir el test" : "Prefiero hacer el test"}
                  </button>
                </>
              )}
            </section>
          )}

          <section aria-labelledby="dificultades" className="mt-[18px] flex flex-col gap-3.5">
            <h2 id="dificultades" className="lz-display font-display text-[28px] sm:text-[36px]">
              2. ¿Qué se te dificulta más?
            </h2>
            <p className="lz-p">Elige todo lo que aplique. Con esto te recomendamos un plan.</p>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {DIFICULTADES.map((d) => {
                const on = difs.includes(d.id);
                return (
                  <button
                    key={d.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggle(d.id)}
                    className={`lz-opt ${FOCO}`}
                  >
                    <span
                      aria-hidden="true"
                      className={`flex h-[22px] w-[22px] flex-[0_0_22px] items-center justify-center rounded-md border-[1.5px] text-[14px] text-white ${
                        on ? "border-lz-grape bg-lz-grape" : "border-lz-bd2 bg-white"
                      }`}
                    >
                      {on ? "✓" : ""}
                    </span>
                    <b className="text-[16px]">{d.label}</b>
                  </button>
                );
              })}
            </div>
          </section>

          <div className="mt-1.5 flex flex-wrap items-center justify-between gap-3">
            <Link href="/" className={`lz-btn lz-btn-3 ${FOCO}`}>
              ← Volver
            </Link>
            <button
              type="button"
              onClick={continuar}
              disabled={!listo}
              className={`lz-btn lz-btn-1 lz-btn-lg ${FOCO}`}
            >
              Ver mi plan recomendado
            </button>
          </div>
          {!listo && (
            <p className="-mt-3 text-right text-[13px] text-lz-ink3">
              {nivel === "?"
                ? "Haz el test o empieza en A1 para continuar."
                : "Elige tu nivel para continuar."}
            </p>
          )}
        </div>

        <aside className="flex flex-col items-center gap-4">
          <Image
            src="/muñecapaso1.webp"
            alt="Ilustración de una alumna eligiendo su nivel de inglés"
            width={582}
            height={568}
            className="h-auto w-full max-w-[320px]"
            sizes="320px"
            priority
          />
          <div className="lz-card flex w-full max-w-[340px] flex-col gap-1.5 px-5 py-[18px]">
            <b className="text-[15px]">Toma 1 minuto</b>
            <span className="lz-p text-[14px]">
              Con tu nivel y lo que se te dificulta te recomendamos un plan. No pedimos tu correo hasta el final.
            </span>
          </div>
        </aside>
      </div>
    </main>
  );
}

export default function PasoUnoPage() {
  return (
    <Suspense fallback={null}>
      <PasoUnoContent />
    </Suspense>
  );
}
