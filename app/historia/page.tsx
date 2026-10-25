import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Container } from "../components/Container";
import Card from "../components/Card";
import Pill from "../components/Pill";
import { URL_DEL_SITIO } from "@/app/lib/sitio";

export const metadata: Metadata = {
  title: "La historia de Loren Laínez | Método 590",
  description:
    "Conoce a Loren Laínez, fundadora del Método 590. Descubre su historia real de aprendizaje intensivo de inglés en 3 meses y cómo creó un método efectivo y estructurado.",
  alternates: { canonical: `${URL_DEL_SITIO}/historia` },
  openGraph: {
    title: "La historia de Loren Laínez | Método 590",
    description:
      "Conoce a Loren Laínez, fundadora del Método 590. Descubre su historia real de aprendizaje intensivo de inglés en 3 meses y cómo creó un método efectivo y estructurado.",
    url: `${URL_DEL_SITIO}/historia`,
    images: [{ url: `${URL_DEL_SITIO}/creadora.jpeg` }],
  },
};

const mentora = {
    name: "Loren Laínez",
    role: "Fundadora del Método 590",
    location: "Estados Unidos",
    photo: "/creadora.jpeg",
    socials: [
        { platform: "Instagram" as const, handle: "@lz_academym590", href: "https://instagram.com/lz_academym590" },
        { platform: "TikTok" as const, handle: "@lore_lainez21", href: "https://tiktok.com/lore_lainez21" },
    ],
};

function PrimaryCTA({ children }: { children: React.ReactNode }) {
    return (
        <a href="/paso-uno" className="inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold text-white bg-falu-red-700 hover:bg-falu-red-800 active:bg-falu-red-900 transition shadow-sm">
            {children}
        </a>
    );
}

function SecondaryLink({ href, children }: { href: string; children: React.ReactNode }) {
    return (
        <Link href={href} className="inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold text-falu-red-800 ring-1 ring-inset ring-falu-red-200 hover:bg-falu-red-50 transition">
            {children}
        </Link>
    );
}

type Platform = "Instagram" | "TikTok";

function InstagramIcon({ className = "" }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none">
            <path d="M7.5 2.75h9A4.75 4.75 0 0 1 21.25 7.5v9A4.75 4.75 0 0 1 16.5 21.25h-9A4.75 4.75 0 0 1 2.75 16.5v-9A4.75 4.75 0 0 1 7.5 2.75Z" stroke="currentColor" strokeWidth="1.6" />
            <path d="M12 16.2a4.2 4.2 0 1 0 0-8.4 4.2 4.2 0 0 0 0 8.4Z" stroke="currentColor" strokeWidth="1.6" />
            <path d="M17.35 6.85h.01" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />
        </svg>
    );
}

function TikTokIcon({ className = "" }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
            <path d="M14 3v10.1a4.6 4.6 0 1 1-3-4.3V6.2c1.2 1.5 2.9 2.6 5 2.8V7.3c-1-.2-2-.8-2.7-1.7A4.7 4.7 0 0 1 14 3Z" fill="currentColor" opacity="0.25" />
            <path d="M14.6 3v10.2a4.9 4.9 0 1 1-3.4-4.7V12a2.5 2.5 0 1 0 1.7 2.4V3h1.7Zm0 0c1.1 2 2.7 3.3 4.7 3.6v1.8c-1.8-.2-3.4-1-4.7-2.2V3Z" fill="currentColor" />
        </svg>
    );
}

function platformIcon(platform: Platform) {
    const cls = "h-5 w-5";
    if (platform === "Instagram") return <InstagramIcon className={cls} />;
    return <TikTokIcon className={cls} />;
}

function SocialButton({ platform, handle, href }: { platform: Platform; handle: string; href: string }) {
    const accent = platform === "Instagram" ? "text-falu-red-800" : "text-yellow-orange-800";
    return (
        <a href={href} target="_blank" rel="noreferrer" className="group flex items-center justify-between gap-3 rounded-xl px-4 py-3 bg-white/70 ring-1 ring-inset ring-zinc-200 hover:bg-white transition">
            <div className="flex items-center gap-3 min-w-0">
                <span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-50 ring-1 ring-inset ring-zinc-200 ${accent}`}>
                    {platformIcon(platform)}
                </span>
                <div className="min-w-0">
                    <p className="text-xs font-semibold text-zinc-600">{platform}</p>
                    <p className="truncate text-sm font-semibold text-zinc-900">{handle}</p>
                </div>
            </div>
            <span className="text-sm font-semibold text-falu-red-700 group-hover:text-falu-red-800">Ver →</span>
        </a>
    );
}

// ─── Chip de etapa — va ENCIMA del título, no al lado ────────────────────────
function StageChip({ label, accent = false }: { label: string; accent?: boolean }) {
    return (
        <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${accent ? "bg-falu-red-100 text-falu-red-800" : "bg-zinc-100 text-zinc-600"}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${accent ? "bg-falu-red-500" : "bg-zinc-400"}`} />
            {label}
        </div>
    );
}

export default function HistoriaPage() {
    return (
        <>
            <main className="bg-white text-zinc-900">

                {/* HERO */}
                <section className="relative overflow-hidden">
                    {/* Fondos decorativos */}
                    <div className="absolute inset-0 bg-linear-to-b from-falu-red-100 via-white to-falu-red-50" />
                    <div className="pointer-events-none absolute -top-28 left-10 h-72 w-72 rounded-full bg-falu-red-300/18 blur-3xl" />
                    <div className="pointer-events-none absolute -bottom-28 right-10 h-72 w-72 rounded-full bg-yellow-orange-300/14 blur-3xl" />

                    <Container>
                        <div className="relative py-12 sm:py-16">

                            <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-10 lg:items-start">

                                {/* HEADLINE — en móvil aparece PRIMERO (order-1)
                       en desktop columna derecha (order-last → order-2) */}
                                <div className="order-1 lg:order-2 lg:col-span-7">
                                    <Pill tone="falu">La historia detrás del Método 590</Pill>
                                    <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-zinc-900 sm:text-4xl lg:text-5xl">
                                        Una necesidad real.{" "}
                                        <span className="text-falu-red-800">Un camino que parecía imposible.</span>
                                    </h1>
                                    <p className="mt-4 text-base text-zinc-600 sm:text-lg leading-relaxed">
                                        Soy Loren Laínez, creadora del Método 590. Actualmente estudio Ingeniería
                                        Biomédica y Computer Science en Estados Unidos. Este método nació de una
                                        necesidad profunda: aprender inglés para poder venir a estudiar aquí y abrir
                                        un camino que, en ese momento, parecía imposible.
                                    </p>
                                    <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                                        <SecondaryLink href="/como-funciona">Cómo funcionan las clases →</SecondaryLink>
                                        <SecondaryLink href="/sesiones">Ver sesiones →</SecondaryLink>
                                    </div>
                                </div>

                                {/* PERFIL — en móvil */}
                                <div className="order-2 lg:order-1 lg:col-span-5">
                                    <Card className="overflow-hidden">

                                        {/* Banner de color */}
                                        <div className="relative h-24 sm:h-28 bg-linear-to-r from-falu-red-800 to-yellow-orange-500">
                                            <div className="pointer-events-none absolute -top-10 -right-10 h-44 w-44 rounded-full bg-white/15 blur-2xl" />
                                            <div className="pointer-events-none absolute -bottom-14 -left-14 h-44 w-44 rounded-full bg-black/10 blur-2xl" />
                                        </div>

                                        <div className="relative -mt-10 px-5 pb-6 sm:-mt-12 sm:px-8 sm:pb-8">

                                            {/* Foto + nombre en la misma fila */}
                                            <div className="flex items-end gap-4">
                                                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl ring-4 ring-white shadow-sm sm:h-28 sm:w-28 sm:rounded-3xl">
                                                    <Image
                                                        src={mentora.photo}
                                                        alt={mentora.name}
                                                        fill
                                                        sizes="(max-width: 640px) 80px, 112px"
                                                        className="object-cover"
                                                        priority
                                                    />
                                                </div>
                                                <div className="min-w-0 pb-1">
                                                    <p className="text-lg font-extrabold text-zinc-900 sm:text-xl">
                                                        {mentora.name}
                                                    </p>
                                                    <p className="text-sm font-semibold text-zinc-700">{mentora.role}</p>
                                                    <p className="text-xs text-zinc-500">{mentora.location}</p>
                                                </div>
                                            </div>

                                            {/* Pills */}
                                            <div className="mt-4 flex flex-wrap gap-2">
                                                <Pill tone="falu">Historia real</Pill>
                                                <Pill tone="orange">3 meses</Pill>
                                                <Pill tone="neutral">Proceso + rutina</Pill>
                                            </div>

                                            {/* Redes sociales */}
                                            <div className="mt-4 grid grid-cols-1 gap-2 sm:gap-3">
                                                {mentora.socials.map((s) => (
                                                    <SocialButton
                                                        key={s.platform}
                                                        platform={s.platform}
                                                        handle={s.handle}
                                                        href={s.href}
                                                    />
                                                ))}
                                            </div>

                                            {/* CTAs */}
                                            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:gap-3">
                                                <PrimaryCTA>Comenzar mi proceso</PrimaryCTA>
                                                <SecondaryLink href="/metodo">Ver el método</SecondaryLink>
                                            </div>

                                        </div>
                                    </Card>
                                </div>

                            </div>
                        </div>
                    </Container>
                </section>

                {/* ══════════════════════════════════════════════════════════════════
            NARRATIVA — layout limpio en dos columnas
        ══════════════════════════════════════════════════════════════════ */}
                <section className="py-14 sm:py-20 bg-zinc-50/50">
                    <Container>
                        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-10">

                            {/* ── Columna izquierda: bloques narrativos ──────────────── */}
                            <div className="lg:col-span-7 space-y-6">

                                {/* BLOQUE 1 */}
                                <div className="rounded-2xl bg-white border border-zinc-100 overflow-hidden">
                                    {/* Header del bloque con año destacado */}
                                    <div className="flex items-center gap-4 px-6 pt-6 pb-4 border-b border-zinc-100">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-falu-red-700 text-sm font-extrabold text-white">
                                            21
                                        </div>
                                        <div>
                                            <StageChip label="2021" accent />
                                            <h2 className="mt-1 text-xl font-extrabold text-zinc-900">
                                                El requisito que no leí… y el problema real
                                            </h2>
                                        </div>
                                    </div>

                                    <div className="px-6 py-5 space-y-4 text-sm leading-relaxed text-zinc-600">
                                        <p>
                                            En 2021 yo estaba en el proceso para venir a estudiar a Estados Unidos.
                                            Mi primer año sería para aprender inglés ya dentro del país, pero antes
                                            debía cumplir varios requisitos. Tenía siete meses para hacerlo todo.
                                        </p>
                                        <p>
                                            Por descuido, nunca leí que uno de esos requisitos era pasar una entrevista…
                                            en inglés.
                                        </p>

                                        {/* Conversación */}
                                        <div className="rounded-xl bg-zinc-50 border border-zinc-200 p-4 space-y-2">
                                            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                                                Un mensaje que lo cambió todo
                                            </p>
                                            <p className="text-zinc-700">
                                                <span className="font-semibold">—</span>{" "}
                                                El último paso es la entrevista. Avísame cuando estés lista.
                                            </p>
                                            <p className="text-zinc-700">
                                                En mi inocencia, respondí:{" "}
                                                <span className="font-semibold text-zinc-900">Ya estoy lista.</span>
                                            </p>
                                            <p className="text-zinc-700">
                                                Entonces me dijo la verdad: la entrevista era completamente en inglés,
                                                y necesitaba un nivel conversacional (B1).
                                            </p>
                                        </div>

                                        {/* Cita de impacto */}
                                        <div className="flex gap-3 items-start pt-1">
                                            <div className="mt-1 h-full w-1 shrink-0 rounded-full bg-falu-red-400" />
                                            <p className="text-base font-semibold text-zinc-800 italic">
                                                Ese era el problema. Yo no sabía ni el verbo to be.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* BLOQUE 2 */}
                                <div className="rounded-2xl bg-white border border-zinc-100 overflow-hidden">
                                    <div className="flex items-center gap-4 px-6 pt-6 pb-4 border-b border-zinc-100">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-xs font-extrabold text-zinc-600">
                                            3m
                                        </div>
                                        <div>
                                            <StageChip label="El límite" />
                                            <h2 className="mt-1 text-xl font-extrabold text-zinc-900">
                                                Tenía tres meses
                                            </h2>
                                        </div>
                                    </div>

                                    <div className="px-6 py-5 space-y-4 text-sm leading-relaxed text-zinc-600">
                                        <p>
                                            Había estado en academias antes, pero el método tradicional siempre me pareció
                                            aburrido. Nunca desarrollé un gusto por aprender inglés; al contrario,
                                            eso hizo que no quisiera aprenderlo.
                                        </p>
                                        <p>
                                            Pero esta vez no era una opción. Si no pasaba esa entrevista, no venía a
                                            Estados Unidos. Tenía tres meses.
                                        </p>

                                        <div className="rounded-xl bg-yellow-orange-50 border border-yellow-orange-200 p-4">
                                            <p className="text-xs font-semibold uppercase tracking-wide text-yellow-orange-700 mb-2">
                                                Contacté academias. Todas me dijeron lo mismo:
                                            </p>
                                            <div className="flex gap-3 items-start">
                                                <div className="mt-1 w-1 shrink-0 rounded-full bg-yellow-orange-400 self-stretch" />
                                                <p className="text-sm font-semibold text-zinc-800 italic">
                                                    "Es imposible. Eso lo logras en mínimo 6–8 meses."
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* BLOQUE 3 */}
                                <div className="rounded-2xl bg-white border border-zinc-100 overflow-hidden">
                                    <div className="flex items-center gap-4 px-6 pt-6 pb-4 border-b border-zinc-100">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-sm font-extrabold text-zinc-600">
                                            →
                                        </div>
                                        <div>
                                            <StageChip label="El giro" />
                                            <h2 className="mt-1 text-xl font-extrabold text-zinc-900">
                                                Fui a consultar a mi amiga de confianza: la ciencia
                                            </h2>
                                        </div>
                                    </div>

                                    <div className="px-6 py-5 space-y-4 text-sm leading-relaxed text-zinc-600">
                                        <p>
                                            Sin dejar que eso me desanimara, y recordando que me encanta el proceso
                                            científico, fui a consultar a mi amiga de confianza: la ciencia.
                                        </p>

                                        <div className="rounded-xl bg-zinc-50 border border-zinc-200 p-4 space-y-3">
                                            <div>
                                                <p className="text-sm font-semibold text-zinc-800">
                                                    ¿Qué dice la ciencia sobre aprender idiomas rápido?
                                                </p>
                                                <p className="mt-1 text-zinc-600">
                                                    Hasta ese momento, no encontré una respuesta directa.
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-zinc-800">
                                                    ¿Pero sabes qué sí dice la ciencia?
                                                </p>
                                                <p className="mt-1 text-zinc-600">
                                                    Habla del proceso real: cómo el ser humano adquiere su idioma nativo.
                                                    Cómo un bebé desarrolla lenguaje. Cómo aprende a hablar.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex gap-3 items-start pt-1">
                                            <div className="mt-1 w-1 shrink-0 rounded-full bg-falu-red-400 self-stretch" />
                                            <p className="text-base font-semibold text-zinc-800 italic">
                                                Y ahí supe exactamente qué hacer: imitar la forma en la que
                                                adquirimos nuestro idioma nativo.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                            </div>

                            {/* ── Columna derecha: sticky ─────────────────────────────── */}
                            <div className="lg:col-span-5">
                                <div className="lg:sticky lg:top-24 space-y-5">

                                    {/* Panel del descubrimiento */}
                                    <div className="rounded-2xl bg-white border border-zinc-200 overflow-hidden">
                                        <div className="px-5 pt-5 pb-4 border-b border-zinc-100">
                                            <Pill tone="neutral">El descubrimiento</Pill>
                                            <h3 className="mt-3 text-lg font-extrabold text-zinc-900">
                                                Así nace el lenguaje (en simple)
                                            </h3>
                                        </div>

                                        <div className="px-5 py-4 space-y-2">
                                            {[
                                                "Primero escuchamos: el cerebro se familiariza con sonidos y patrones.",
                                                "Observamos: gestos, labios, expresiones; conectamos emoción con significado.",
                                                "Imitamos: nacen sonidos, luego palabras, luego vocabulario.",
                                                "Nos equivocamos: no por falta de capacidad, sino por falta de estructura.",
                                                "La estructura se consolida con lectura y escritura.",
                                            ].map((text, i) => (
                                                <div key={i} className="flex items-start gap-3 rounded-lg bg-zinc-50 px-3 py-2.5">
                                                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-falu-red-100 text-xs font-bold text-falu-red-700">
                                                        {i + 1}
                                                    </span>
                                                    <p className="text-sm text-zinc-600 leading-relaxed">{text}</p>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="px-5 pb-5">
                                            <p className="text-sm leading-relaxed text-zinc-600">
                                                Un adulto ya habla, ya lee y ya escribe. Entonces, recorrer ese mismo camino
                                                para adquirir una segunda lengua se vuelve más fácil si lo hacemos con
                                                intención y lo volvemos parte de la rutina.
                                            </p>

                                            <div className="mt-4 rounded-xl bg-falu-red-50 border border-falu-red-100 p-4">
                                                <p className="text-sm font-semibold text-falu-red-900">
                                                    Y ahí nació el Método 590.
                                                </p>
                                                <p className="mt-1 text-sm text-zinc-600">
                                                    Si querés ver el método completo y cómo se aplica, lo tenés explicado en sus páginas.
                                                </p>
                                                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                                                    <SecondaryLink href="/metodo">Conocer el método</SecondaryLink>
                                                    <SecondaryLink href="/sesiones">Ver sesiones</SecondaryLink>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Stats 0 → 90 → B1 */}
                                    <div className="grid grid-cols-3 gap-3">
                                        {[
                                            { value: "0", label: "nivel inicial" },
                                            { value: "90", label: "días después" },
                                            { value: "B1", label: "nivel final" },
                                        ].map((s) => (
                                            <div key={s.label} className="rounded-xl bg-white border border-zinc-200 p-3 text-center">
                                                <p className="text-2xl font-extrabold text-zinc-900">{s.value}</p>
                                                <p className="text-xs text-zinc-400 mt-0.5">{s.label}</p>
                                            </div>
                                        ))}
                                    </div>

                                </div>
                            </div>

                        </div>
                    </Container>
                </section>

                {/* ══════════════════════════════════════════════════════════════════
            CIERRE — fondo oscuro, momento de mayor impacto
        ══════════════════════════════════════════════════════════════════ */}
                <section className="relative py-16 sm:py-20 overflow-hidden">
                    <div className="absolute inset-0 bg-zinc-900" />
                    <div className="pointer-events-none absolute -top-20 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-falu-red-600/20 blur-3xl" />
                    <div className="pointer-events-none absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-yellow-orange-400/10 blur-3xl" />
                    <div className="pointer-events-none absolute inset-0 opacity-[0.04] bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.8)_1px,transparent_0)] bg-size-[20px_20px]" />

                    <Container>
                        <div className="relative grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-center">

                            <div className="lg:col-span-7 space-y-6">
                                <Pill tone="orange">Cierre</Pill>

                                <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
                                    Cambié el rumbo de mi vida.
                                </h2>

                                <div className="space-y-4 text-zinc-300 text-base leading-relaxed">
                                    <p>
                                        En tres meses pasé de no saber ni el verbo{" "}
                                        <span className="font-semibold text-white">to be</span>…
                                        a pasar mi entrevista en inglés.
                                    </p>
                                    <p>Ese día no solo aprobé una entrevista. Cambié el rumbo de mi vida.</p>
                                    <p>
                                        El Método 590 no es magia. Es proceso. Es una rutina diaria diseñada
                                        para ayudarte a salir del "no puedo" y convertir el inglés en algo real.
                                    </p>
                                </div>

                                <div className="flex flex-col gap-3 sm:flex-row pt-2">
                                    <PrimaryCTA>Comenzar mi proceso</PrimaryCTA>
                                    <Link href="/" className="inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold text-zinc-300 ring-1 ring-inset ring-zinc-600 hover:bg-zinc-800 transition">
                                        Volver al inicio
                                    </Link>
                                </div>
                            </div>

                            {/* Cita de Loren */}
                            <div className="lg:col-span-5">
                                <div className="rounded-2xl border border-white/10 bg-white/5 p-7 space-y-4">
                                    <svg className="h-7 w-7 text-falu-red-400" viewBox="0 0 32 32" fill="currentColor" aria-hidden="true">
                                        <path d="M10 8C6.686 8 4 10.686 4 14v10h10V14H7.5c0-1.38 1.12-2.5 2.5-2.5V8Zm14 0c-3.314 0-6 2.686-6 6v10h10V14h-6.5c0-1.38 1.12-2.5 2.5-2.5V8Z" />
                                    </svg>
                                    <p className="text-white text-lg font-semibold leading-relaxed">
                                        Todas las academias me dijeron que era imposible aprender inglés en 3 meses.
                                    </p>
                                    <p className="text-zinc-300 text-base leading-relaxed">
                                        Diseñé mi propio método y pasé la entrevista. Ese método es el 590.
                                    </p>
                                    <div className="pt-2 border-t border-white/10 flex items-center gap-3">
                                        <div className="relative h-10 w-10 overflow-hidden rounded-full ring-2 ring-white/20">
                                            <Image src={mentora.photo} alt={mentora.name} fill sizes="40px" className="object-cover" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-white">{mentora.name}</p>
                                            <p className="text-xs text-zinc-400">{mentora.role}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </Container>
                </section>

            </main>
        </>
    );
}