import type { Metadata } from "next";
import { Container } from "../components/Container";
import Card from "../components/Card";
import Pill from "../components/Pill";
import { PrimaryButton, SecondaryButton } from "../components/Buttons";
import Link from "next/link";
import { URL_DEL_SITIO } from "@/app/lib/sitio";

export const metadata: Metadata = {
  title: "Sesiones del Método 590 | Aprende inglés en 90 días",
  description:
    "Explora las 5 sesiones diarias del Método 590: Teoría, Escuchar, Memorización, Lectura y Práctica. Una rutina estructurada para aprender inglés en 90 días.",
  alternates: { canonical: `${URL_DEL_SITIO}/sesiones` },
  openGraph: {
    title: "Sesiones del Método 590 | Aprende inglés en 90 días",
    description:
      "Explora las 5 sesiones diarias del Método 590: Teoría, Escuchar, Memorización, Lectura y Práctica. Una rutina estructurada para aprender inglés en 90 días.",
    url: `${URL_DEL_SITIO}/sesiones`,
    images: [{ url: `${URL_DEL_SITIO}/og-image.png`, width: 1200, height: 630 }],
  },
};

const sesiones = [
    {
        n: "01",
        title: "Teoría (Estructura)",
        description:
            "En esta sesión, entendemos la forma del idioma. Es como construir los cimientos antes de comenzar a hablar o escuchar. Aprenderemos la estructura básica que vamos a utilizar en las siguientes sesiones.",
        accent: "falu" as const,
    },
    {
        n: "02",
        title: "Escuchar (Input)",
        description:
            "Escuchar es el inicio del lenguaje en los bebés. En esta sesión, escuchamos inglés con subtítulos en inglés para conectar sonido, forma escrita y patrón. No se trata de entender todo, sino de entrenar el cerebro.",
        accent: "orange" as const,
    },
    {
        n: "03",
        title: "Memorización (Repetición de palabras)",
        description:
            "Al igual que los bebés imitan sonidos, en esta sesión repetimos palabras en contexto. Veremos palabras en frases reales para ayudar a nuestro cerebro a recordar el vocabulario de manera efectiva.",
        accent: "falu" as const,
    },
    {
        n: "04",
        title: "Lectura (Consolidación)",
        description:
            "Aquí leemos en inglés sin traducir. De igual manera que un niño aprende a leer para consolidar su conocimiento del idioma, nosotros consolidamos lo aprendido a través de la lectura en voz alta.",
        accent: "orange" as const,
    },
    {
        n: "05",
        title: "Práctica (Producción)",
        description:
            "Esta sesión es donde realmente hacemos nuestro propio idioma. Escribimos y hablamos en inglés, sin miedo. A través de la escritura y el habla, solidificamos lo aprendido y hacemos del inglés una parte de nuestra vida diaria.",
        accent: "falu" as const,
    },
];

export default function SesionesPage() {
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
                                Las 5 sesiones diarias del Método 590
                            </h1>
                            <p className="mt-5 max-w-3xl text-base text-zinc-600 sm:text-lg">
                                El método está diseñado para activar el inglés en tu rutina diaria.
                                Cada sesión tiene un propósito claro y está estructurada para
                                facilitar el aprendizaje continuo.
                            </p>

                            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                                <PrimaryButton>Comienza tu proceso</PrimaryButton>
                            </div>
                        </div>
                    </Container>
                </section>

                {/* SESIONES */}
                <section className="py-12 sm:py-16">
                    <Container>
                        <div className="mx-auto max-w-3xl text-center">
                            <Pill tone="neutral">Las 5 sesiones</Pill>
                            <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
                                Estructura diaria de sesiones
                            </h2>
                            <p className="mt-4 text-zinc-600">
                                Cinco bloques diarios que activan el idioma completo: escuchar,
                                leer, escribir, hablar y pensar en inglés todos los días.
                            </p>
                        </div>

                        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
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
                                    <p className="mt-2 text-sm text-zinc-600">{s.description}</p>
                                </Card>
                            ))}
                        </div>

                        <div className="mt-8 flex justify-center">
                            <SecondaryButton href="/metodo">Ver el método completo →</SecondaryButton>
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
                                    <PrimaryButton>Inscribirme</PrimaryButton>
                                    <Link
                                        href="/como-funciona"
                                        className="inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold text-falu-red-800 ring-1 ring-inset ring-falu-red-200 hover:bg-falu-red-50 transition"
                                    >
                                        Ver como funciona
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
