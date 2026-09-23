import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "../components/Container";
import Card from "../components/Card";
import Pill from "../components/Pill";

export const metadata: Metadata = {
  title: "Ciencia detrás del Método 590",
  description:
    "Descubre la ciencia cognitiva detrás del Método 590: ritmo, repetición y consistencia para construir fluidez real en inglés.",
  alternates: { canonical: "https://lz-englishacademy.com/ciencia" },
  openGraph: {
    title: "Ciencia detrás del Método 590 | LZ English Academy",
    description:
      "Descubre la ciencia cognitiva detrás del Método 590: ritmo, repetición y consistencia para construir fluidez real en inglés.",
    url: "https://lz-englishacademy.com/ciencia",
    images: [{ url: "https://lz-englishacademy.com/og-image.png", width: 1200, height: 630 }],
  },
};

export default function CienciaPage() {
  return (
    <>
      <main className="bg-white text-zinc-900">
        {/* HERO */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-linear-to-b from-yellow-orange-50 via-white to-falu-red-50" />
          <div className="pointer-events-none absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-yellow-orange-300/22 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 right-10 h-72 w-72 rounded-full bg-falu-red-300/22 blur-3xl" />

          <Container>
            <div className="relative py-12 sm:py-16">
              <Pill tone="orange">Ciencia</Pill>
              <h1 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-6xl">
                La ciencia detrás del Método 590
              </h1>
              <p className="mt-5 max-w-3xl text-base text-zinc-600 sm:text-lg">
                El método nace de comprender cómo aprende realmente el cerebro humano:
                ritmo, repetición y consistencia. Cuando el aprendizaje se vuelve rutina,
                el idioma pasa de esfuerzo a automatización.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a
                  href="/paso-uno"
                  className="inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold text-white bg-falu-red-700 hover:bg-falu-red-800 transition shadow-sm"
                >
                  Comenzar proceso
                </a>
                <Link
                  href="/metodo"
                  className="inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold text-falu-red-800 ring-1 ring-inset ring-falu-red-200 hover:bg-falu-red-50 transition"
                >
                  Volver a Método
                </Link>
              </div>
            </div>
          </Container>
        </section>

        {/* Sección Ciencia Detallada */}
        <section className="py-12 sm:py-16">
          <Container>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {/* Sesión 1: Ritmo, repetición y consistencia */}
              <Card>
                <Pill tone="orange">1</Pill>
                <h2 className="mt-4 text-lg font-semibold">
                  Ritmo, repetición y consistencia
                </h2>
                <p className="mt-2 text-sm text-zinc-600">
                  El cerebro no aprende por acumulación caótica de información.
                  Aprende con ritmo y repetición. Cuando se vuelve rutina, el idioma
                  deja de ser esfuerzo y empieza a automatizarse.
                </p>
              </Card>

              {/* Sesión 2: Adquisición natural */}
              <Card>
                <Pill tone="orange">2</Pill>
                <h2 className="mt-4 text-lg font-semibold">Adquisición natural</h2>
                <p className="mt-2 text-sm text-zinc-600">
                  No adquirimos el idioma nativo memorizando reglas. Lo desarrollamos
                  con exposición constante, escucha, imitación y producción, en un entorno
                  donde el lenguaje se vive antes de analizarse.
                </p>
              </Card>

              {/* Sesión 3: Estructura para el cerebro adulto */}
              <Card>
                <Pill tone="orange">3</Pill>
                <h2 className="mt-4 text-lg font-semibold">
                  Estructura para el cerebro adulto
                </h2>
                <p className="mt-2 text-sm text-zinc-600">
                  El método replica el proceso natural, adaptado al adulto:
                  escucha, lectura, escritura, habla y pensamiento en inglés cada día.
                  Pero el adulto necesita un mapa: patrones, claridad y dirección.
                </p>
              </Card>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Sesión Clave */}
              <Card className="bg-zinc-50">
                <Pill tone="falu">Clave</Pill>
                <p className="mt-4 text-sm font-semibold text-falu-red-900">
                  La teoría no es el destino, pero sí el punto de orientación.
                </p>
                <p className="mt-2 text-sm text-zinc-700">
                  La estructura reduce incertidumbre, revela patrones y permite que el cerebro
                  procese el idioma con claridad.
                </p>
              </Card>

              {/* Sesión 1 Detalles */}
              <Card className="bg-white">
                <Pill tone="orange">Sesión 1</Pill>
                <p className="mt-4 text-sm font-semibold text-yellow-orange-900">
                  Por eso la Sesión 1 establece la base estructural y teórica.
                </p>
                <p className="mt-2 text-sm text-zinc-700">
                  Prepara el terreno para que exposición, práctica, producción y automatización
                  funcionen con profundidad y coherencia.
                </p>
              </Card>
            </div>

            <div className="mt-10">
              <Card className="relative overflow-hidden">
                <div className="absolute -left-20 -top-20 h-60 w-60 rounded-full bg-falu-red-300/12 blur-3xl" />
                <div className="absolute -right-20 -bottom-20 h-60 w-60 rounded-full bg-yellow-orange-300/12 blur-3xl" />

                <Pill tone="neutral">Resultado</Pill>
                <h3 className="mt-3 text-2xl font-extrabold tracking-tight">
                  El resultado no es solo aprendizaje.
                </h3>
                <p className="mt-2 text-zinc-600">Es la internalización del idioma.</p>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="/como-funciona"
                    className="inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold text-falu-red-800 ring-1 ring-inset ring-falu-red-200 hover:bg-falu-red-50 transition"
                  >
                    Como funciona →
                  </Link>
                  <a
                    href="/sesiones"
                    className="inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold text-white bg-falu-red-700 hover:bg-falu-red-800 active:bg-falu-red-900 transition shadow-sm"
                  >
                    Conocer las sesiones →
                  </a>
                </div>
              </Card>
            </div>
          </Container>
        </section>
      </main>
    </>
  );
}
