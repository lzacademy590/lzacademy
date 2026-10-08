import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "../components/Container";
import Card from "../components/Card";
import Pill from "../components/Pill";

export const metadata: Metadata = {
  title: "Cómo funciona el Método 590",
  description:
    "Descubre cómo funciona el Método 590: cinco sesiones diarias estructuradas para aprender inglés de forma natural y eficiente en 90 días.",
  alternates: { canonical: "https://lz-englishacademy.com/como-funciona" },
  openGraph: {
    title: "Cómo funciona el Método 590 | LZ English Academy",
    description:
      "Descubre cómo funciona el Método 590: cinco sesiones diarias estructuradas para aprender inglés de forma natural y eficiente en 90 días.",
    url: "https://lz-englishacademy.com/como-funciona",
    images: [{ url: "https://lz-englishacademy.com/og-image.png", width: 1200, height: 630 }],
  },
};


function PrimaryButton({ children }: { children: React.ReactNode }) {
  return (
    <a
      href="/paso-uno"
      rel="noreferrer"
      className="inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold text-white bg-falu-red-700 hover:bg-falu-red-800 active:bg-falu-red-900 transition shadow-sm"
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

const sesiones = [
  {
    n: "01",
    title: "Teoría (Estructura)",
    desc: "Te da la forma del idioma: patrones y estructura que usarás todo el día.",
    accent: "falu" as const,
  },
  {
    n: "02",
    title: "Escuchar (Input)",
    desc: "Película o podcast con subtítulos en inglés para entrenar oído + lectura visual.",
    accent: "orange" as const,
  },
  {
    n: "03",
    title: "Vocabulario (Repetición estratégica)",
    desc: "Set de palabras con contexto real en oraciones para memorizar con sentido.",
    accent: "falu" as const,
  },
  {
    n: "04",
    title: "Lectura (Consolidación)",
    desc: "Lectura asignada en voz alta para internalizar estructura y automatizar comprensión.",
    accent: "orange" as const,
  },
  {
    n: "05",
    title: "Práctica (Producción)",
    desc: "Journaling + speaking challenge: donde el idioma se vuelve tuyo.",
    accent: "falu" as const,
  },
];

export default function ComoFuncionaPage() {
  return (
    <>
      <main className="bg-white text-zinc-900">
        {/* HERO */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-linear-to-b from-falu-red-100 via-white to-falu-red-50" />
          <div className="pointer-events-none absolute -top-28 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-falu-red-300/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 right-10 h-80 w-80 rounded-full bg-yellow-orange-300/15 blur-3xl" />

          <Container>
            <div className="relative py-12 sm:py-16">
              <Pill tone="falu">Cómo funciona</Pill>
              <h1 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-6xl">
                Así se vive el Método 590{" "}
                <span className="text-falu-red-800">día a día</span>
              </h1>
              <p className="mt-5 max-w-3xl text-base text-zinc-600 sm:text-lg">
                La plataforma te guía con material y pasos claros para que no improvises.
                Tú solo cumples la rutina y acumulas progreso.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <PrimaryButton>Comenzar mi proceso</PrimaryButton>
                <SecondaryButton href="/metodo">Ver el método</SecondaryButton>
              </div>
            </div>
          </Container>
        </section>

        {/* CÓMO FUNCIONAN LAS CLASES (TU TEXTO) */}
        <section className="py-12 sm:py-16">
          <Container>
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-start">
              <div className="lg:col-span-7">
                <Pill tone="neutral">Clases</Pill>
                <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
                  ¿Cómo funcionan las clases?
                </h2>

                <div className="mt-6 space-y-4 text-zinc-600">
                  <p className="text-base sm:text-lg">
                    La plataforma te guía diariamente con las 5 sesiones: te da el material
                    para la sesión 1, te asigna la película o podcast para la sesión 2,
                    un set de vocabulario estratégico para la sesión 3, una lectura para
                    la sesión 4 y un tema para journaling en la sesión 5.
                  </p>

                  <p className="text-base sm:text-lg">
                    Además, hay un <span className="font-semibold text-zinc-900">speaking challenge</span>{" "}
                    que se envía por WhatsApp para que practiques producción real.
                  </p>

                  <p className="text-base sm:text-lg">
                    De lunes a jueves haces el método con la plataforma a la hora que puedas
                    según el día asignado. Los viernes o sábados hay reuniones de práctica:
                    primero damos 30 minutos de repaso para aclarar dudas y luego pasamos a practicar.
                  </p>
                </div>
              </div>

              <div className="lg:col-span-5">
                <Card className="relative overflow-hidden">
                  <div className="absolute -left-16 -top-16 h-52 w-52 rounded-full bg-falu-red-300/12 blur-3xl" />
                  <div className="absolute -right-16 -bottom-16 h-52 w-52 rounded-full bg-yellow-orange-300/12 blur-3xl" />

                  <Pill tone="falu">Práctica en vivo</Pill>
                  <h3 className="mt-4 text-xl font-extrabold text-falu-red-900">
                    Dinámica en Zoom (en parejas)
                  </h3>

                  <div className="mt-4 space-y-3 text-sm text-zinc-700">
                    {[
                      "Te ponemos en una sala con 1 persona (práctica en pareja).",
                      "Te damos instrucciones para conversar usando estructuras y vocabulario de la semana.",
                      "Conversas 3–5 minutos, se cierra la sala y vuelves a la sala principal.",
                      "Te enviamos otra vez con otra persona y repites la práctica (hasta 5 veces).",
                      "La repetición construye confianza para hablar.",
                    ].map((t) => (
                      <div
                        key={t}
                        className="flex items-start gap-3 rounded-xl bg-white/80 p-3 ring-1 ring-inset ring-zinc-200/70"
                      >
                        <span className="mt-1 h-2 w-2 rounded-full bg-falu-red-600" />
                        <p>{t}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                    <PrimaryButton>Seleccionar plan</PrimaryButton>
                    <SecondaryButton href="/historia">Leer la historia</SecondaryButton>
                  </div>
                </Card>
              </div>
            </div>
          </Container>
        </section>

        {/* LAS 5 SESIONES (DETALLE) */}
        <section className="relative py-12 sm:py-16">
          <div className="absolute inset-0 bg-linear-to-b from-white via-falu-red-50/40 to-white" />
          <Container>
            <div className="relative">
              <div className="mx-auto max-w-3xl text-center">
                <Pill tone="falu">Las 5 sesiones</Pill>
                <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
                  Una rutina diaria con estructura
                </h2>
                <p className="mt-4 text-zinc-600">
                  Cada sesión imita una parte del proceso natural de adquirir un idioma,
                  pero concentrado en un solo día.
                </p>
              </div>

              <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-5">
                {sesiones.map((s) => (
                  <Card key={s.n} className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <span
                        className={[
                          "inline-flex h-10 w-10 items-center justify-center rounded-2xl text-sm font-extrabold ring-1 ring-inset",
                          s.accent === "orange"
                            ? "bg-yellow-orange-100 text-yellow-orange-900 ring-yellow-orange-200"
                            : "bg-falu-red-100 text-falu-red-900 ring-falu-red-200",
                        ].join(" ")}
                      >
                        {s.n}
                      </span>
                      <Pill tone={s.accent === "orange" ? "orange" : "falu"}>Sesión</Pill>
                    </div>
                    <p className="mt-4 text-sm font-semibold text-zinc-900">{s.title}</p>
                    <p className="mt-2 text-sm text-zinc-600">{s.desc}</p>
                  </Card>
                ))}
              </div>

              <div className="mt-10 flex justify-center gap-3 flex-col sm:flex-row">
                <PrimaryButton>Comenzar</PrimaryButton>
                <SecondaryButton href="/metodo">Volver a Método</SecondaryButton>
              </div>
            </div>
          </Container>
        </section>
      </main>
    </>
  );
}
