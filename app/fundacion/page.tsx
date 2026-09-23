import Link from "next/link";
import { Container } from "../components/Container";
import Card from "../components/Card";
import Pill from "../components/Pill";

export const metadata = {
    title: "Nuestro propósito",
    description:
        "Un porcentaje de cada inscripción al Método 590 se destina a la Fundación LZ para financiar la educación de niños y niñas en situación vulnerable en Honduras.",
    alternates: { canonical: "https://lz-englishacademy.com/fundacion" },
    openGraph: {
        title: "Nuestro propósito | LZ English Academy",
        description:
            "Un porcentaje de cada inscripción al Método 590 se destina a la Fundación LZ para financiar la educación de niños y niñas en situación vulnerable en Honduras.",
        url: "https://lz-englishacademy.com/fundacion",
        images: [{ url: "https://lz-englishacademy.com/og-image.png", width: 1200, height: 630 }],
    },
};

export default function PropositoPage() {
    const DRIVE_FILE_ID = "1Zm8vIjIBsSRJAHu2d8i-_RIg3GfqZmDx";
    const Tiktok_URL = "https://www.tiktok.com/t/ZThVwGhUh/";

    const drivePreviewUrl = `https://drive.google.com/file/d/${DRIVE_FILE_ID}/preview`;

    return (
        <main className="bg-white">
            {/* HERO */}
            <section className="relative overflow-hidden">
                {/* Fondo */}
                <div className="absolute inset-0 bg-linear-to-b from-falu-red-100 via-white to-falu-red-50" />

                {/* Ornamentos */}
                <div className="pointer-events-none absolute -top-32 left-1/2 h-104 w-104 -translate-x-1/2 rounded-full bg-falu-red-400/20 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-40 -right-24 h-120 w-120 rounded-full bg-yellow-orange-300/20 blur-3xl" />
                <div className="pointer-events-none absolute inset-0 opacity-[0.08] bg-[radial-gradient(circle_at_1px_1px,rgba(156,24,29,0.35)_1px,transparent_0)] bg-size-[18px_18px]" />

                {/* Wave */}
                <svg
                    className="pointer-events-none absolute -bottom-px left-0 w-full"
                    viewBox="0 0 1440 120"
                    fill="none"
                    aria-hidden="true"
                >
                    <path
                        d="M0 80C120 70 240 55 360 52C480 48 600 64 720 72C840 80 960 78 1080 62C1200 46 1320 18 1440 10V120H0V80Z"
                        fill="rgba(156,24,29,0.06)"
                    />
                </svg>

                <Container>
                    <div className="relative py-16 sm:py-24">
                        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-center">
                            <div className="lg:col-span-7">
                                <Pill tone="falu">Más que inglés</Pill>

                                <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-zinc-900 sm:text-6xl">
                                    <span className="block">Aprender inglés</span>
                                    <span className="block text-falu-red-800">también puede ser</span>
                                    <span className="block">un acto de propósito.</span>
                                </h1>

                                <p className="mt-5 max-w-2xl text-base text-zinc-700 sm:text-lg">
                                    En LZ English Academy creemos que la educación transforma vidas.
                                    Por eso, un porcentaje de cada inscripción al Método 590 se destina a la
                                    Fundación LZ, una iniciativa enfocada en financiar la educación de niños y niñas en situación vulnerable en Honduras.
                                </p>

                                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                                    <Link
                                        href="/paso-uno"
                                        className="inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold text-white bg-falu-red-700 hover:bg-falu-red-800 active:bg-falu-red-900 transition shadow-sm"
                                    >
                                        Ver planes del Método 590
                                    </Link>

                                    <Link
                                        href="/metodo"
                                        className="inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold text-falu-red-800 ring-1 ring-inset ring-falu-red-200 hover:bg-falu-red-50 transition"
                                    >
                                        Ver el método
                                    </Link>
                                </div>

                                <div className="mt-10 flex flex-wrap gap-3">
                                    <span className="inline-flex items-center gap-2 rounded-2xl bg-white/70 px-4 py-2 text-xs font-semibold text-zinc-700 ring-1 ring-inset ring-falu-red-200/70">
                                        <span className="h-2 w-2 rounded-full bg-falu-red-600" />
                                        Inscripción con propósito
                                    </span>
                                    <span className="inline-flex items-center gap-2 rounded-2xl bg-white/70 px-4 py-2 text-xs font-semibold text-zinc-700 ring-1 ring-inset ring-falu-red-200/70">
                                        <span className="h-2 w-2 rounded-full bg-falu-red-600" />
                                        Educación básica y materiales
                                    </span>
                                    <span className="inline-flex items-center gap-2 rounded-2xl bg-white/70 px-4 py-2 text-xs font-semibold text-zinc-700 ring-1 ring-inset ring-falu-red-200/70">
                                        <span className="h-2 w-2 rounded-full bg-falu-red-600" />
                                        Oportunidades reales
                                    </span>
                                </div>
                            </div>

                            {/* Panel visual */}
                            <div className="lg:col-span-5">
                                <Card className="relative overflow-hidden ring-falu-red-200">
                                    <div className="absolute -left-16 -top-16 h-52 w-52 rounded-full bg-falu-red-300/25 blur-3xl" />
                                    <div className="absolute -right-16 -bottom-16 h-52 w-52 rounded-full bg-yellow-orange-300/15 blur-3xl" />

                                    <p className="text-sm font-semibold text-zinc-900">
                                        ¿Qué significa “propósito” aquí?
                                    </p>

                                    <div className="mt-4 space-y-3 text-sm text-zinc-700">
                                        <div className="flex gap-3">
                                            <span className="mt-1 h-2 w-2 rounded-full bg-falu-red-600" />
                                            Tú mejoras tu futuro con inglés.
                                        </div>
                                        <div className="flex gap-3">
                                            <span className="mt-1 h-2 w-2 rounded-full bg-falu-red-600" />
                                            Un niño recibe apoyo para estudiar.
                                        </div>
                                        <div className="flex gap-3">
                                            <span className="mt-1 h-2 w-2 rounded-full bg-falu-red-600" />
                                            Se crean oportunidades educativas reales.
                                        </div>
                                    </div>

                                    <div className="mt-6">
                                        <Link
                                            href="/paso-uno"
                                            className="text-sm font-semibold text-falu-red-800 hover:text-falu-red-900"
                                        >
                                            Comenzar mi proceso →
                                        </Link>
                                    </div>
                                </Card>
                            </div>
                        </div>

                        {/* 3 highlights */}
                        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-3">
                            <Card className="p-5 hover:ring-falu-red-200">
                                <p className="text-sm font-semibold text-falu-red-900">Educación básica</p>
                                <p className="mt-1 text-sm text-zinc-600">
                                    Apoyamos el acceso y permanencia en la escuela.
                                </p>
                            </Card>

                            <Card className="p-5 hover:ring-falu-red-200">
                                <p className="text-sm font-semibold text-falu-red-900">Útiles y materiales</p>
                                <p className="mt-1 text-sm text-zinc-600">
                                    Contribuimos con herramientas que facilitan el aprendizaje.
                                </p>
                            </Card>

                            <Card className="p-5 hover:ring-falu-red-200">
                                <p className="text-sm font-semibold text-falu-red-900">Romper ciclos</p>
                                <p className="mt-1 text-sm text-zinc-600">
                                    Oportunidades educativas que cambian historias.
                                </p>
                            </Card>
                        </div>
                    </div>
                </Container>
            </section>

            {/* SECCIÓN FUNDACIÓN */}
            <section className="relative py-14 sm:py-18">
                <div className="absolute inset-0 bg-linear-to-b from-falu-red-50/60 via-white to-white" />
                <div className="pointer-events-none absolute -right-30 top-10 h-72 w-72 rounded-full bg-falu-red-300/18 blur-3xl" />

                <Container>
                    <div className="relative grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-start">
                        <div className="lg:col-span-7">
                            <Pill tone="falu">Fundación LZ</Pill>

                            <h2 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl text-zinc-900">
                                Un porcentaje de tu inscripción se convierte en{" "}
                                <span className="text-falu-red-800">apoyo educativo</span>
                            </h2>

                            <p className="mt-4 text-zinc-600">
                                Nuestra fundación trabaja para financiar la educación de niños y niñas en situación vulnerable en Honduras. Cada estudiante que se une a la academia no solo
                                invierte en su propio crecimiento, también contribuye a que un niño tenga
                                la oportunidad de aprender, crecer y construir un futuro diferente.
                            </p>

                            <Card className="mt-6 p-6 ring-falu-red-200">
                                <p className="text-sm font-semibold text-zinc-900">
                                    ¿En qué trabaja la Fundación LZ?
                                </p>

                                <ul className="mt-4 space-y-3 text-sm text-zinc-700">
                                    <li className="flex gap-3">
                                        <span className="mt-1 h-2 w-2 rounded-full bg-falu-red-600" />
                                        Apoyar el acceso a la educación básica.
                                    </li>
                                    <li className="flex gap-3">
                                        <span className="mt-1 h-2 w-2 rounded-full bg-falu-red-600" />
                                        Contribuir con útiles escolares y materiales.
                                    </li>
                                    <li className="flex gap-3">
                                        <span className="mt-1 h-2 w-2 rounded-full bg-falu-red-600" />
                                        Facilitar que niños de bajos recursos asistan y se mantengan en la escuela.
                                    </li>
                                    <li className="flex gap-3">
                                        <span className="mt-1 h-2 w-2 rounded-full bg-falu-red-600" />
                                        Fomentar oportunidades educativas que rompan ciclos de pobreza.
                                    </li>
                                </ul>

                                <p className="mt-4 text-xs text-zinc-500">
                                    Transparencia: el porcentaje puede variar según costos operativos y campañas activas,
                                    pero el compromiso con la educación infantil es constante.
                                </p>
                            </Card>

                            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                                <Link
                                    href="/paso-uno"
                                    className="inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold text-white bg-falu-red-700 hover:bg-falu-red-800 transition shadow-sm"
                                >
                                    Elegir un plan
                                </Link>

                                <Link
                                    href="/"
                                    className="inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold text-falu-red-800 ring-1 ring-inset ring-falu-red-200 hover:bg-falu-red-50 transition"
                                >
                                    Volver al inicio
                                </Link>
                            </div>
                        </div>

                        {/* VIDEO DRIVE */}
                        <div className="lg:col-span-5">
                            <Card className="relative overflow-hidden ring-falu-red-200">
                                <div className="absolute -left-16 -top-16 h-48 w-48 rounded-full bg-falu-red-300/22 blur-3xl" />
                                <div className="absolute -right-16 -bottom-16 h-48 w-48 rounded-full bg-falu-red-400/16 blur-3xl" />

                                <p className="relative text-sm font-semibold text-zinc-900">
                                    Mira un ejemplo real
                                </p>
                                <p className="relative mt-2 text-sm text-zinc-600">
                                    Este video muestra parte de lo que estamos apoyando a través de la Fundación LZ.
                                </p>

                                <div className="relative mt-5 overflow-hidden rounded-2xl ring-1 ring-black/5 bg-white">
                                    {/* Drive embed */}
                                    <iframe
                                        title="Video Fundación LZ (Drive)"
                                        src={drivePreviewUrl}
                                        className="h-130 w-full"
                                        allow="autoplay; encrypted-media"
                                        allowFullScreen
                                    />
                                </div>

                                <div className="relative mt-5 flex flex-col gap-3">
                                    <a
                                        href={Tiktok_URL}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold text-white bg-falu-red-700 hover:bg-falu-red-800 transition shadow-sm"
                                    >
                                        Ver video en TikTok
                                    </a>

                                    <p className="text-xs text-zinc-500">
                                        Si el video no aparece, abre el enlace para verlo directamente.
                                    </p>
                                </div>
                            </Card>
                        </div>
                    </div>
                </Container>
            </section>

            {/* CTA FINAL */}
            <section className="relative py-16 sm:py-20">
                <div className="absolute inset-0 bg-linear-to-b from-falu-red-50 via-white to-falu-red-50/40" />

                <Container>
                    <Card className="relative overflow-hidden ring-falu-red-200">
                        <div className="absolute -left-20 -top-20 h-60 w-60 rounded-full bg-falu-red-300/18 blur-3xl" />
                        <div className="absolute -right-20 -bottom-20 h-60 w-60 rounded-full bg-falu-red-400/14 blur-3xl" />

                        <div className="relative grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-center">
                            <div className="lg:col-span-8">
                                <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl text-zinc-900">
                                    ¿Listo para aprender con propósito?
                                </h2>
                                <p className="mt-3 text-zinc-600">
                                    Tu inscripción al Método 590 impulsa tu avance y ayuda a crear oportunidades educativas en Honduras.
                                </p>
                            </div>

                            <div className="lg:col-span-4 flex flex-col gap-3 sm:flex-row lg:justify-end">
                                <Link
                                    href="/paso-uno"
                                    className="inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold text-white bg-falu-red-700 hover:bg-falu-red-800 transition shadow-sm"
                                >
                                    Ver planes
                                </Link>
                                <Link
                                    href="/paso-uno"
                                    className="inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold text-falu-red-800 ring-1 ring-inset ring-falu-red-200 hover:bg-falu-red-50 transition"
                                >
                                    Ir al formulario
                                </Link>
                            </div>
                        </div>
                    </Card>
                </Container>
            </section>
        </main>
    );
}