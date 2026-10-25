import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "../components/Container";
import Card from "../components/Card";
import Pill from "../components/Pill";
import { URL_DEL_SITIO } from "@/app/lib/sitio";

export const metadata: Metadata = {
  title: "Método 590 | Aprende inglés en 90 días",
  description:
    "Descubre el Método 590: un sistema estructurado para aprender inglés en 90 días mediante 5 sesiones diarias que convierten el idioma en una rutina real y efectiva.",
  alternates: { canonical: `${URL_DEL_SITIO}/metodo` },
  openGraph: {
    title: "Método 590 | Aprende inglés en 90 días",
    description:
      "Descubre el Método 590: un sistema estructurado para aprender inglés en 90 días mediante 5 sesiones diarias que convierten el idioma en una rutina real y efectiva.",
    url: `${URL_DEL_SITIO}/metodo`,
    images: [{ url: `${URL_DEL_SITIO}/og-image.png`, width: 1200, height: 630 }],
  },
};

function PrimaryButton({ children }: { children: React.ReactNode }) {
  return (
    <a
      href='/paso-uno'
      className="inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold text-white bg-falu-red-700 hover:bg-falu-red-800 transition shadow-sm"
    >
      {children}
    </a>
  );
}

function SecondaryButton({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold text-falu-red-800 ring-1 ring-inset ring-falu-red-200 hover:bg-falu-red-50 transition"
    >
      {children}
    </Link>
  );
}

const sesionesPreview = [
  { n: "01", title: "Teoría y estructura", accent: "falu" as const },
  { n: "02", title: "Listening (exposición real)", accent: "orange" as const },
  { n: "03", title: "Vocabulario (base)", accent: "falu" as const },
  { n: "04", title: "Lectura (estructura interna)", accent: "orange" as const },
  { n: "05", title: "Producción (fluidez real)", accent: "falu" as const },
];

export default function MetodoPage() {
  return (
    <>
      <main className="bg-white text-zinc-900">
        {/* HERO */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-linear-to-b from-falu-red-50 via-white to-yellow-orange-50" />
          <div className="pointer-events-none absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-falu-red-300/25 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 right-10 h-72 w-72 rounded-full bg-yellow-orange-300/25 blur-3xl" />

          <Container>
            <div className="relative py-12 sm:py-16">
              <Pill tone="falu">Método 590</Pill>
              <h1 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-6xl">
                Aprende inglés en 90 días.{" "}
                <span className="text-falu-red-800">Con método.</span>
              </h1>
              <p className="mt-5 max-w-3xl text-base text-zinc-600 sm:text-lg">
                El Método 590 transforma el inglés en una experiencia diaria
                estructurada, diseñada para activar el cerebro, construir fluidez
                y convertir el idioma en una herramienta real de comunicación.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <PrimaryButton>Comienza tu proceso</PrimaryButton>
                <SecondaryButton href="/sesiones">Ver las 5 sesiones</SecondaryButton>
              </div>
            </div>
          </Container>
        </section>

        {/* ¿QUÉ ES EL MÉTODO 590? */}
        <section className="py-12 sm:py-16">
          <Container>
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-start">
              <div className="lg:col-span-7">
                <Pill tone="neutral">¿Qué es el Método 590?</Pill>
                <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
                  Un sistema estructurado para convertir el inglés en rutina
                </h2>

                <div className="mt-6 space-y-4 text-zinc-600">
                  <p className="text-base sm:text-lg">
                    El Método 590 es un sistema de aprendizaje estructurado basado
                    en cinco sesiones diarias durante noventa días, diseñado para
                    convertir el inglés en una rutina viva, no en una materia.
                  </p>
                  <p className="text-base sm:text-lg">
                    El cerebro humano aprende mejor cuando el aprendizaje ocurre de
                    forma consistente. Cuando el idioma se integra a la rutina,
                    deja de ser información y comienza a convertirse en experiencia.
                  </p>
                  <p className="text-base sm:text-lg">
                    Por eso, el método no se enfoca en memorizar, sino en vivir el
                    idioma: escuchar, comprender, producir, escribir y pensar en
                    inglés todos los días.
                  </p>
                </div>
              </div>

              <div className="lg:col-span-5">
                <Card className="relative overflow-hidden">
                  <div className="absolute -left-16 -top-16 h-48 w-48 rounded-full bg-falu-red-300/15 blur-3xl" />
                  <div className="absolute -right-16 -bottom-16 h-48 w-48 rounded-full bg-yellow-orange-300/15 blur-3xl" />
                  <Pill tone="falu">Idea central</Pill>
                  <p className="mt-4 text-xl font-extrabold text-falu-red-900">
                    No se trata de estudiar inglés. Se trata de internalizarlo.
                  </p>
                  <p className="mt-3 text-sm text-zinc-600">
                    El hábito construye fluidez: repetición diaria con intención y estructura.
                  </p>
                  <div className="mt-6 flex flex-wrap gap-2">
                    <Pill tone="neutral">Ritmo</Pill>
                    <Pill tone="neutral">Consistencia</Pill>
                    <Pill tone="neutral">Exposición</Pill>
                    <Pill tone="neutral">Producción</Pill>
                  </div>
                </Card>
              </div>
            </div>
          </Container>
        </section>

        {/* CIENCIA DETRÁS DEL MÉTODO */}
        <section className="py-12 sm:py-16 bg-zinc-50">
          <Container>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-center">
              <div className="lg:col-span-7">
                <Pill tone="orange">Ciencia detrás del método</Pill>
                <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
                  Por qué funciona (en simple)
                </h2>
                <p className="mt-4 text-zinc-600">
                  El cerebro aprende mejor con ritmo, repetición y consistencia.
                  Cuando el aprendizaje se vuelve rutina, el idioma pasa de esfuerzo
                  a automatización.
                </p>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <SecondaryButton href="/ciencia">Ver ciencia completa</SecondaryButton>
                </div>
              </div>

              <div className="lg:col-span-5">
                <Card>
                  <p className="text-sm font-semibold text-zinc-900">
                    Resumen en 3 ideas
                  </p>
                  <div className="mt-4 space-y-3">
                    {[
                      "Ritmo + repetición + consistencia",
                      "Exposición real antes de “analizar”",
                      "Estructura para el cerebro adulto"
                    ].map((t) => (
                      <div
                        key={t}
                        className="flex items-start gap-3 rounded-xl bg-white p-3 ring-1 ring-inset ring-zinc-200/70"
                      >
                        <span className="mt-1 h-2 w-2 rounded-full  bg-falu-red-700" />
                        <p className="text-sm text-zinc-700">{t}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </div>
          </Container>
        </section>

        {/* 5 SESIONES */}
        <section className="py-12 sm:py-16">
          <Container>
            <div className="mx-auto max-w-3xl text-center">
              <Pill tone="neutral">Estructura diaria</Pill>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
                Las 5 sesiones (preview)
              </h2>
              <p className="mt-4 text-zinc-600">
                Cinco bloques diarios que activan escucha, lectura, escritura, habla y pensamiento.
              </p>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-5">
              {sesionesPreview.map((s) => (
                <Card key={s.n} className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <span
                      className={[
                        "inline-flex h-10 w-10 items-center justify-center rounded-2xl text-sm font-extrabold ring-1 ring-inset",
                        s.accent === "orange" ? "bg-yellow-orange-100 text-yellow-orange-900 ring-yellow-orange-200" : "bg-falu-red-100 text-falu-red-900 ring-falu-red-200"
                      ].join(" ")}
                    >
                      {s.n}
                    </span>
                    <Pill tone={s.accent === "orange" ? "orange" : "falu"}>Sesión</Pill>
                  </div>
                  <p className="mt-4 text-sm font-semibold text-zinc-900">{s.title}</p>
                  <p className="mt-2 text-sm text-zinc-600">Ver detalle en la página de sesiones.</p>
                </Card>
              ))}
            </div>

            <div className="mt-8 flex justify-center">
              <SecondaryButton href="/sesiones">Ver sesiones completas →</SecondaryButton>
            </div>
          </Container>
        </section>

        {/* CTA FINAL */}
        <section className="py-14 sm:py-18 bg-yellow-orange-50/35">
          <Container>
            <Card className="relative overflow-hidden">
              <div className="absolute -left-20 -top-20 h-60 w-60 rounded-full bg-falu-red-300/12 blur-3xl" />
              <div className="absolute -right-20 -bottom-20 h-60 w-60 rounded-full bg-yellow-orange-300/12 blur-3xl" />

              <div className="relative grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-center">
                <div className="lg:col-span-8">
                  <h3 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
                    Comienza tu proceso con el Método 590
                  </h3>
                  <p className="mt-3 text-zinc-600">
                    Llena el formulario y te orientamos para iniciar.
                  </p>
                </div>

                <div className="lg:col-span-4 flex flex-col gap-3 sm:flex-row lg:justify-end">
                  <PrimaryButton>Ir al formulario</PrimaryButton>
                  <Link
                    href="/historia"
                    className="inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold text-falu-red-800 ring-1 ring-inset ring-falu-red-200 hover:bg-falu-red-50 transition"
                  >
                    Conocer la historia
                  </Link>
                </div>
              </div>
            </Card>
          </Container>
        </section>
      </main>
    </>
  );
}
