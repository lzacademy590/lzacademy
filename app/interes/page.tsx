import InterestForm from "../components/InterestForm";

export const metadata = {
    // Sin la marca: la pone el `template` del layout raíz ("%s | LZ English Academy").
    title: "Da el primer paso",
    description:
        "Regístrate y recibe información detallada sobre el Método 590. Sin costo, sin compromiso.",
    alternates: { canonical: "https://lz-englishacademy.com/interes" },
    openGraph: {
        title: "Da el primer paso — LZ English Academy",
        description:
            "Regístrate y recibe información detallada sobre el Método 590. Sin costo, sin compromiso.",
        url: "https://lz-englishacademy.com/interes",
        images: [{ url: "https://lz-englishacademy.com/og-image.png", width: 1200, height: 630 }],
    },
};

export default function InterestPage() {
    return (
        <main className="relative min-h-screen bg-zinc-50 overflow-hidden">
            <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-96 w-96 rounded-full bg-falu-red-200/20 blur-3xl" />

            <div className="relative mx-auto max-w-xl px-4 sm:px-6 py-8 sm:py-10">

                <div className="text-center mb-5">
                    <h1 className="text-2xl font-extrabold text-zinc-900 sm:text-3xl leading-tight">
                        En 90 días puedes hablar inglés.<br />
                        <span className="text-falu-red-700">¿Empezamos?</span>
                    </h1>
                    <p className="mt-2 text-sm text-zinc-500">
                        Completa el formulario — sin costo, sin compromiso.
                    </p>
                </div>

                <InterestForm />

            </div>
        </main>
    );
}
