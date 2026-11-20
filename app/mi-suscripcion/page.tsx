"use client";

import { useState } from "react";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL!;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function MiSuscripcionPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;

    const trimmed = email.trim();
    if (!EMAIL_RE.test(trimmed)) {
      setError("Ingresa un correo electrónico válido.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${BACKEND_URL}/subscription-portal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      });
      if (!res.ok) throw new Error("request failed");
      await res.json();
      setSent(true);
    } catch {
      setError("No pudimos procesar tu solicitud. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-lz-lila flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-lz-grape mb-5">
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>
          <h1 className="lz-display font-display text-[30px] text-lz-ink">Gestiona tu suscripción</h1>
          <p className="mt-2 text-sm text-zinc-600 max-w-sm mx-auto">
            Si tu plan se renueva solo (Essential o Premium), te enviamos un enlace para cambiar tu tarjeta o
            cancelar. Los planes de pago único (Personalizado, Fluidez) no se renuevan solos: para volver a
            pagar, ve a{" "}
            <a href="/pago-estudiantes" className="font-semibold text-lz-grape underline">Renovar mi plan</a>.
          </p>
        </div>

        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-zinc-200 overflow-hidden">
          <div className="h-1.5 w-full bg-linear-to-r from-lz-violet via-lz-grape to-lz-fucsia" />

          {sent ? (
            <div className="p-6 sm:p-8 space-y-4 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200">
                <svg className="w-6 h-6 text-emerald-500" viewBox="0 0 24 24" fill="none">
                  <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p className="text-base font-bold text-zinc-900">Revisa tu correo</p>
              <p className="text-sm leading-relaxed text-zinc-500">
                Si tu correo está asociado a una suscripción activa, te enviamos un enlace a tu bandeja de
                entrada para gestionarla o cancelarla. Revisa también tu carpeta de spam.
              </p>
              <p className="text-xs leading-relaxed text-zinc-400">
                El enlace es personal y temporal: no lo compartas y úsalo pronto, ya que caduca.
              </p>
              <button
                onClick={() => { setSent(false); setEmail(""); setError(""); }}
                className="text-xs text-zinc-400 hover:text-zinc-600 transition pt-1"
              >
                Usar otro correo
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-zinc-700 mb-1.5">
                  Correo electrónico
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(""); }}
                  placeholder="tu@correo.com"
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-900 placeholder-zinc-400 transition focus:outline-none focus:ring-2 focus:ring-falu-red-400 focus:border-transparent focus:bg-white hover:border-zinc-300"
                  required
                  autoComplete="email"
                />
                <p className="mt-1.5 text-xs text-zinc-400">
                  Por tu seguridad, el enlace para gestionar tu suscripción se envía por correo y nunca se muestra aquí.
                </p>
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3">
                  <svg className="mt-0.5 h-4 w-4 shrink-0 text-red-500" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M8 5v3.5M8 11h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold text-white bg-falu-red-700 hover:bg-falu-red-800 active:bg-falu-red-900 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {loading ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 16 16" fill="none">
                      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" strokeDasharray="28" strokeDashoffset="10" strokeLinecap="round" />
                    </svg>
                    Enviando...
                  </>
                ) : (
                  <>
                    Enviarme el enlace
                    <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none">
                      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
