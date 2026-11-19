import LogoDeMarca from "./LogoDeMarca";
import Link from "next/link";

/*
  Pie del sitio simple (2026-11-18, HU-LZ-EMB criterio 12).

  ⚠️ Es el ÚNICO sitio donde viven las cosas de quien ya es alumno (gestionar la
  suscripción, renovar, su horario, el legal de la plataforma). En el cuerpo de
  las páginas competían con el botón de los nuevos, que es el que vende.
*/
const WHATSAPP_URL = "https://chat.whatsapp.com/HhAvLoPoLwf1JsX0aWtnX1";
const DISCORD_URL = "https://discord.gg/uf9xSWBGUA";

const enlace = "inline-flex min-h-9 items-center gap-2 text-[15px] text-lz-sobre-oscuro transition hover:text-white";
const titulo = "mb-1.5 text-[13px] font-bold uppercase tracking-[0.1em] text-lz-fucsia-claro";

export function Footer() {
  return (
    <footer className="bg-lz-violet text-white">
      <div className="lz-wrap flex flex-col gap-10 pb-8 pt-14">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-3.5">
            <LogoDeMarca variante="oscuro" className="h-11 max-w-[200px] self-start" />
            <p className="text-[15px] leading-relaxed text-lz-sobre-oscuro">
              Inglés como rutina diaria, con el Método 590.
            </p>
          </div>

          <nav aria-label="El sitio" className="flex flex-col">
            <p className={titulo}>El sitio</p>
            <Link href="/metodo" className={enlace}>Método 590</Link>
            <Link href="/nosotros" className={enlace}>Nosotros</Link>
            <Link href="/paso-tres" className={enlace}>Planes y precios</Link>
            <Link href="/horarios" className={enlace}>Horarios de clase</Link>
          </nav>

          <nav aria-label="Ya soy alumno" className="flex flex-col">
            <p className={titulo}>Ya soy alumno</p>
            <a href="https://app.lainz590.com/login" className={enlace}>Acceder a la plataforma</a>
            <Link href="/mi-suscripcion" className={enlace}>Gestionar suscripción</Link>
            <Link href="/pago-estudiantes" className={enlace}>Renovar mi plan</Link>
            {/* "Mi horario" no va aquí: /mi-horario solo abre con el enlace personal
                que llega por correo, y sin él solo dice "Falta el enlace". */}
            <Link href="/legal/plataforma" className={enlace}>Legal de la plataforma</Link>
          </nav>

          <nav aria-label="Legal y contacto" className="flex flex-col">
            <p className={titulo}>Legal y contacto</p>
            <Link href="/terminos" className={enlace}>Términos</Link>
            <Link href="/reembolsos" className={enlace}>Reembolsos y garantía</Link>
            <Link href="/privacidad" className={enlace}>Privacidad</Link>
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className={enlace}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 12a9 9 0 0 1-13.5 7.8L3 21l1.2-4.5A9 9 0 1 1 21 12z" /></svg>
              Comunidad de WhatsApp
            </a>
            <a href={DISCORD_URL} target="_blank" rel="noopener noreferrer" className={enlace}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M8 7c-2 .5-3 1-3 1-1.5 3-2 6-1.5 9 1.5 1.2 3 1.8 4.5 2l1-2M16 7c2 .5 3 1 3 1 1.5 3 2 6 1.5 9-1.5 1.2-3 1.8-4.5 2l-1-2M8.5 15.5c2.3 1 4.7 1 7 0" /></svg>
              Discord
            </a>
          </nav>
        </div>

        <div className="flex flex-wrap justify-between gap-3 border-t border-white/15 pt-5 text-[14px] text-lz-sobre-oscuro">
          <span>© {new Date().getFullYear()} LZ English Academy · Método 590</span>
          <Link href="/nosotros#fundacion" className="text-lz-sobre-oscuro underline-offset-2 hover:underline">
            Conoce la Fundación LZ
          </Link>
        </div>
      </div>
    </footer>
  );
}
