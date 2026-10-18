"use client";

import Image from "next/image";
import Link from "next/link";
import { InfoSessionSection } from "../components/Infosessionsection";
import Pill from "../components/Pill";
import { TestimonialsSection } from "../components/Testimonials";
import { usePlanesDelCatalogo, precioEtiqueta } from "../hooks/usePlanesDelCatalogo";

/**
 * "Desde $10 USD cada 4 semanas · Garantía de 3 días", bajo el botón del hero.
 *
 * ⚠️ El importe es el del plan MÁS BARATO que vende el embudo, leído del
 * catálogo, con el de Essential como respaldo mientras carga. Escrito a mano se
 * quedaría mintiendo el primer día que el admin cambie el precio.
 */
const CLAVES_DEL_EMBUDO = ["Essential", "Premium", "Personalizado", "Fluidez"];
function PrecioDeEntrada() {
    const catalogo = usePlanesDelCatalogo();
    const precios = (catalogo ?? [])
        .filter((p) => CLAVES_DEL_EMBUDO.includes(p.key) || p.origenPlataforma)
        .map((p) => p.priceCents)
        .filter((c) => c > 0);
    const desde = precios.length ? Math.min(...precios) : 1000;
    return (
        // En móvil va en DOS líneas: en una sola, la garantía quedaba debajo de
        // los botones flotantes de Discord/WhatsApp (medido a 375 px).
        <p className="flex flex-col gap-0.5 text-[13px] font-semibold text-zinc-600 sm:block">
            <span>
                Desde <strong className="text-zinc-900">{precioEtiqueta(desde)} USD</strong> cada 4 semanas
            </span>
            <span className="hidden sm:inline">{" · "}</span>
            <Link href="/reembolsos" className="self-start underline decoration-dotted underline-offset-2">
                Garantía de 3 días
            </Link>
        </p>
    );
}

export default function InicioPage() {
    return (
        <>
            {/* ── Hero ── */}
            <section
                className="relative overflow-hidden"
                style={{ backgroundColor: "#fadadd" }}
            >
                <div
                    className="pointer-events-none absolute inset-0 opacity-[0.04]"
                    style={{
                        backgroundImage:
                            "radial-gradient(circle at 1px 1px, #9c181d 1px, transparent 0)",
                        backgroundSize: "18px 18px",
                    }}
                />
                <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="relative grid min-h-[520px] lg:min-h-[82vh] grid-cols-1 items-center gap-8 py-12 lg:grid-cols-2 lg:py-0">

                        {/* Columna izquierda: texto + botones */}
                        <div className="z-10 flex flex-col items-start order-1 lg:order-1">
                            <div className="relative mt-1 w-full h-[300px] sm:h-[280px] lg:h-[400px]">
                                <Image
                                    src="/textoinicio.webp"
                                    alt="M590 siguiente nivel en 90 dias"
                                    fill
                                    className="object-contain object-left-bottom"
                                    sizes="(max-width: 1024px) 100vw, 50vw"
                                    priority
                                />
                            </div>

                            {/* El titular de la imagen, en TEXTO: lo leen Google y
                                los lectores de pantalla, que de la imagen solo ven el alt. */}
                            <h1 className="sr-only">
                                Método 590: lleva tu inglés al siguiente nivel en 90 días
                            </h1>
                            <p className="mt-4 max-w-[480px] text-[15px] lg:text-[17px] font-medium leading-relaxed text-zinc-700">
                                Una rutina diaria de 5 sesiones, clases en vivo y una comunidad que te
                                acompaña. Para principiantes y para quienes ya tienen base.
                            </p>

                            <div className="mt-5 lg:mt-6 flex flex-col items-start gap-3">
                                <Link
                                    href="/paso-uno"
                                    className="inline-flex items-center gap-3 rounded-2xl px-8 py-4 text-base font-extrabold text-white shadow-lg transition hover:opacity-90 active:scale-95"
                                    style={{
                                        backgroundColor: "#bd181e",
                                        fontFamily: "var(--font-barlow), 'Arial Black', sans-serif",
                                        fontWeight: 700,
                                        letterSpacing: "0.02em",
                                    }}
                                >
                                    Descubre tu plan en 1 minuto
                                    <span className="text-xl leading-none">›</span>
                                </Link>
                                <PrecioDeEntrada />
                                {/* A la RECOMPRA, no a las cartas del embudo de captación:
                                    quien ya estudia tiene su propio flujo (verify-student). */}
                                <Link
                                    href="/pago-estudiantes"
                                    className="inline-block py-3 px-1 text-sm font-semibold transition hover:opacity-70"
                                    style={{ color: "#bd181e" }}
                                >
                                    Ya soy estudiante →
                                </Link>
                            </div>
                        </div>

                        {/* Columna derecha: ilustración */}
                        <div className="relative flex items-center justify-center lg:h-full order-2 lg:order-2">
                            <div className="relative w-full h-full min-h-[260px] select-none">
                                <Image
                                    src="/human.webp"
                                    alt="Persona estudiando inglés con laptop"
                                    fill
                                    className="object-contain object-center"
                                    sizes="(max-width: 1024px) 100vw, 50vw"
                                    priority
                                />
                            </div>
                        </div>

                    </div>
                </div>
            </section>


            {/* ── Testimonios, ARRIBA (2026-10-17) ──
                Antes solo salían en /paso-tres, o sea a quien ya había decidido
                mirar precios. La prueba social trabaja antes: es lo que convence
                de empezar el embudo. */}
            <TestimonialsSection />

            {/* ── El método nació de una necesidad real ── */}
            <section className="relative w-full py-20 px-4 overflow-hidden" style={{ background: "#fafafa" }}>
                <div aria-hidden className="absolute top-0 left-0 right-0 h-px" style={{ background: "rgba(156,24,29,0.1)" }} />
                <div className="relative max-w-7xl mx-auto px-4 lg:px-16">
                    <div className="flex flex-col lg:flex-row gap-12 lg:gap-24 items-start">

                        {/* Columna izquierda */}
                        <div className="flex-1">
                            <Pill tone="falu">La fundadora</Pill>
                            <h2 className="mt-4 text-3xl sm:text-4xl font-black tracking-tight" style={{ color: "#111" }}>
                                El método nació de una{" "}
                                <span style={{ color: "#9c181d" }}>necesidad real</span>
                            </h2>
                            <p className="mt-4 text-base leading-relaxed" style={{ color: "#555", maxWidth: "460px" }}>
                                La creadora necesitaba aprender inglés en 3 meses para una entrevista completa en inglés.
                                Así nació una rutina estructurada en 5 sesiones diarias.
                            </p>
                            <div className="mt-8 flex flex-wrap gap-3">
                                <Link href="/historia" className="inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold text-white bg-falu-red-700 hover:bg-falu-red-800 transition shadow-sm">
                                    Conocer su historia
                                </Link>
                                <Link href="/metodo" className="inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold text-falu-red-800 ring-1 ring-inset ring-falu-red-200 hover:bg-falu-red-50 transition">
                                    Ver el método completo
                                </Link>
                            </div>
                        </div>

                        {/* Columna derecha */}
                        <div
                            className="w-full lg:w-80 shrink-0 rounded-2xl overflow-hidden"
                            style={{ border: "1px solid rgba(156,24,29,0.12)", background: "#fff" }}
                        >
                            <div className="px-7 pt-7 pb-5">
                                <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "#9c181d" }}>
                                    El método
                                </p>
                                <p className="text-2xl font-black" style={{ color: "#111" }}>¿Qué vas a vivir?</p>
                            </div>
                            <div style={{ height: "1px", background: "rgba(156,24,29,0.08)", margin: "0 28px" }} />
                            <div className="px-7 py-5 space-y-4">
                                {[
                                    "5 sesiones diarias con propósito",
                                    "Speaking real + journaling con feedback",
                                    "Progreso visible semana a semana",
                                    "Comunidad de práctica los viernes",
                                ].map((item) => (
                                    <div key={item} className="flex items-start gap-3">
                                        <span className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5" style={{ background: "rgba(156,24,29,0.07)" }}>
                                            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                                                <polyline points="1.5,5 4,7.5 8.5,2" stroke="#9c181d" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        </span>
                                        <p className="text-sm" style={{ color: "#333" }}>{item}</p>
                                    </div>
                                ))}
                            </div>
                            <div className="px-7 pb-6">
                                <Link href="/como-funciona" className="text-sm font-semibold hover:opacity-70 transition" style={{ color: "#9c181d" }}>
                                    Ver detalle de sesiones →
                                </Link>
                            </div>
                        </div>

                    </div>
                </div>
                <div aria-hidden className="absolute bottom-0 left-0 right-0 h-px" style={{ background: "rgba(156,24,29,0.1)" }} />
            </section>
            {/* ── Info Session gratuita ── */}
            <InfoSessionSection />

        </>
    );
}
