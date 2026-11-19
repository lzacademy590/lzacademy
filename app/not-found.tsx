// app/not-found.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Página 404 personalizada. Next.js la usa automáticamente para cualquier
// ruta no encontrada. Retiene al usuario con navegación clara y CTA directo.
// ─────────────────────────────────────────────────────────────────────────────

import Link from "next/link";
import { Container } from "@/app/components/Container";

const suggestedLinks = [
    { href: "/", label: "Inicio", description: "Ver el Método 590" },
    { href: "/metodo", label: "El método", description: "Cómo funciona en 90 días" },
    { href: "/nosotros", label: "Nosotros", description: "Por qué nació la academia" },
    { href: "/paso-tres", label: "Planes y precios", description: "Elige el que va contigo" },
];

export default function NotFound() {
    return (
        <main className="bg-white">
            <section className="relative overflow-hidden min-h-[70vh] flex items-center">
                {/* Fondo sutil */}
                <div className="absolute inset-0 bg-linear-to-b from-falu-red-50/60 via-white to-white" />
                <div className="pointer-events-none absolute -top-32 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-falu-red-300/15 blur-3xl" />

                <Container>
                    <div className="relative py-20 max-w-2xl mx-auto text-center">
                        {/* Número 404 decorativo */}
                        <p className="text-[120px] font-extrabold leading-none text-falu-red-100 select-none">
                            404
                        </p>

                        <div className="-mt-6">
                            <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 sm:text-4xl">
                                Esta página no existe
                            </h1>
                            <p className="mt-4 text-base text-zinc-600">
                                El link que seguiste está roto o la página fue movida.
                                Aquí tienes acceso directo a lo que probablemente buscabas:
                            </p>
                        </div>

                        {/* Links sugeridos */}
                        <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2 text-left">
                            {suggestedLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className="group flex items-center justify-between rounded-xl p-4 ring-1 ring-inset ring-zinc-200 hover:ring-falu-red-200 hover:bg-falu-red-50/40 transition"
                                >
                                    <div>
                                        <p className="text-sm font-semibold text-zinc-900 group-hover:text-falu-red-800 transition">
                                            {link.label}
                                        </p>
                                        <p className="text-xs text-zinc-500 mt-0.5">{link.description}</p>
                                    </div>
                                    <span className="text-zinc-300 group-hover:text-falu-red-400 transition text-lg">
                                        →
                                    </span>
                                </Link>
                            ))}
                        </div>

                        {/* CTA principal */}
                        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                            <a
                                href="/paso-uno"
                                className="inline-flex items-center justify-center rounded-xl px-6 py-3 text-sm font-semibold text-white bg-falu-red-700 hover:bg-falu-red-800 transition shadow-sm"
                            >
                                Inscribirme al Método 590
                            </a>
                            <Link
                                href="/"
                                className="inline-flex items-center justify-center rounded-xl px-6 py-3 text-sm font-semibold text-falu-red-800 ring-1 ring-inset ring-falu-red-200 hover:bg-falu-red-50 transition"
                            >
                                Volver al inicio
                            </Link>
                        </div>
                    </div>
                </Container>
            </section>
        </main>
    );
}