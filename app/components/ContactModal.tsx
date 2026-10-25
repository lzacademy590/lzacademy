"use client";
import { CORREO_DE_CONTACTO } from "@/app/lib/sitio";

interface ContactModalProps {
  open: boolean;
  onClose: () => void;
}

export default function ContactModal({ open, onClose }: ContactModalProps) {
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-[360px] px-8 py-8 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="modal-title" className="text-2xl font-extrabold mb-2" style={{ color: "#C0353E" }}>
          ¿Tienes dudas?
        </h2>
        <p className="text-sm font-medium mb-7 leading-relaxed" style={{ color: "#C0353E" }}>
          Contáctanos y te ayudamos a elegir el plan ideal sin compromiso.
        </p>

        {/* WhatsApp */}
        <a
          href="https://chat.whatsapp.com/HhAvLoPoLwf1JsX0aWtnX1"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-3 w-full rounded-2xl px-6 py-4 text-white font-extrabold text-[15px] mb-3 transition hover:opacity-90 active:scale-95"
          style={{ backgroundColor: "#25D366" }}
        >
          <svg className="w-6 h-6 shrink-0" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
            <path d="M12 0C5.373 0 0 5.373 0 12c0 2.117.549 4.107 1.51 5.834L0 24l6.348-1.485A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.017-1.374l-.36-.214-3.727.872.888-3.638-.235-.374A9.818 9.818 0 1112 21.818z"/>
          </svg>
          Contáctanos por WhatsApp
        </a>

        {/* Discord */}
        <a
          href="https://discord.com/invite/uf9xSWBGUA"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-3 w-full rounded-2xl px-6 py-4 text-white font-extrabold text-[15px] mb-3 transition hover:opacity-90 active:scale-95"
          style={{ backgroundColor: "#5865F2" }}
        >
          <svg className="w-6 h-6 shrink-0" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
          </svg>
          Contáctanos por Discord
        </a>

        {/* Email */}
        <a
          href={`mailto:${CORREO_DE_CONTACTO}`}
          className="flex items-center justify-center gap-3 w-full rounded-2xl px-6 py-4 text-white font-extrabold text-[15px] mb-6 transition hover:opacity-90 active:scale-95"
          style={{ backgroundColor: "#C0353E" }}
        >
          <svg className="w-6 h-6 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="M2 7l10 7 10-7" />
          </svg>
          Escríbenos por correo
        </a>

        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="rounded-full border border-zinc-300 px-8 py-2 text-sm font-semibold text-zinc-500 transition hover:border-zinc-400 hover:text-zinc-700 active:scale-95"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}
