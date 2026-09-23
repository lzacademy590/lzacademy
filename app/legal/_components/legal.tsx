import Link from "next/link";
import { Container } from "../../components/Container";

/*
  Piezas del Centro legal (`/legal`).

  Hay DOS juegos de documentos: los del SITIO WEB (`/terminos`, `/privacidad`)
  y los de la PLATAFORMA de aprendizaje (`/legal/plataforma/*`). La Política de
  Reembolso (`/reembolsos`) es UNA sola y se enlaza desde las dos vistas: el
  dinero y sus reglas son los mismos se compre donde se compre, y dos copias
  acabarían diciendo plazos distintos.

  ⚠️ Las URL `/terminos`, `/privacidad` y `/reembolsos` NO se mueven: las enlazan
  el clickwrap del checkout (`components/Form.tsx`) y la plataforma.
  ⚠️ Toda ruta nueva de aquí va también en `VALID_ROUTES` de `proxy.ts`, o
  responde 307 a la portada sin error visible.
*/

export const EMAIL_LEGAL = "info@lz-englishacademy.com";

/**
 * Donde cancela quien compró en la PLATAFORMA: Configuración › Suscripción, que
 * abre el portal de Stripe. Es el mismo camino que da el correo de compra
 * (`platform_backend/src/email/email.service.ts`, `comoCancelar`): si se renombra
 * esa pantalla o su botón «Gestionar suscripción y pago», cambian los dos.
 *
 * ⚠️ `/mi-suscripcion` de este sitio NO sirve para esos compradores: busca en la
 * base del website, donde no están, y responde igual para no delatar correos.
 */
export const URL_SUSCRIPCION_PLATAFORMA = "https://app.lainz590.com/settings/subscription";

/**
 * Versión de cada documento de la plataforma. Al cambiar un texto de forma
 * sustancial, se cambia aquí su versión.
 *
 * ⚠️⚠️ La plataforma registra la aceptación con SU copia de esta versión
 * (`TERMINOS_VERSION_VIGENTE`, `platform_backend/src/common/terminos.ts`): son
 * dos repos y no se pueden importar. Se suben JUNTAS, o la base dirá que el
 * alumno aceptó un texto que no es el que leyó.
 */
export const VERSIONES_PLATAFORMA = {
  terminos: "2026-09-22",
  privacidad: "2026-09-22",
  normas: "2026-09-22",
} as const;

export const FECHA_PLATAFORMA = "22 de septiembre de 2026";

type Vista = "sitio" | "plataforma";

/** `activa` vacía = documento común a las dos vistas (los reembolsos). */
export function PestanasLegales({ activa }: { activa?: Vista }) {
  const base =
    "inline-flex min-h-11 items-center rounded-full px-4 text-sm font-semibold transition";
  const on = "bg-falu-red-700 text-white shadow-sm";
  const off = "bg-white text-zinc-700 ring-1 ring-zinc-200 hover:bg-zinc-50";
  return (
    <nav aria-label="Documentos legales" className="flex flex-wrap gap-2">
      <Link
        href="/legal"
        aria-current={activa === "sitio" ? "page" : undefined}
        className={`${base} ${activa === "sitio" ? on : off}`}
      >
        Sitio web
      </Link>
      <Link
        href="/legal/plataforma"
        aria-current={activa === "plataforma" ? "page" : undefined}
        className={`${base} ${activa === "plataforma" ? on : off}`}
      >
        Plataforma de aprendizaje
      </Link>
    </nav>
  );
}

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10 first:mt-0">
      <h2 className="text-xl font-extrabold tracking-tight text-zinc-900 sm:text-2xl">
        {title}
      </h2>
      <div className="mt-4 space-y-4 text-[15px] leading-relaxed text-zinc-600">
        {children}
      </div>
    </section>
  );
}

export function Enlace({ href, children }: { href: string; children: React.ReactNode }) {
  const clase = "font-semibold text-falu-red-700 hover:text-falu-red-800";
  if (href.startsWith("mailto:") || href.startsWith("http")) {
    return (
      <a href={href} className={clase}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={clase}>
      {children}
    </Link>
  );
}

export function Correo() {
  return <Enlace href={`mailto:${EMAIL_LEGAL}`}>{EMAIL_LEGAL}</Enlace>;
}

/** Cabecera + cuerpo de un documento de la plataforma, con las pestañas arriba. */
export function DocumentoLegal({
  titulo,
  version,
  children,
}: {
  titulo: string;
  version: string;
  children: React.ReactNode;
}) {
  return (
    <main className="bg-white text-zinc-900">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-b from-falu-red-100 via-white to-falu-red-50" />
        <Container>
          <div className="relative mx-auto max-w-3xl py-12 sm:py-16">
            <PestanasLegales activa="plataforma" />
            <p className="mt-8 text-xs font-semibold uppercase tracking-wide text-falu-red-700">
              Plataforma de aprendizaje — Método 590
            </p>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-zinc-900 sm:text-4xl">
              {titulo}
            </h1>
            <p className="mt-4 text-sm text-zinc-500">
              Última actualización: {FECHA_PLATAFORMA} · Versión {version}
            </p>
          </div>
        </Container>
      </section>

      <section className="py-12 sm:py-16">
        <Container>
          <article className="mx-auto max-w-3xl">{children}</article>
        </Container>
      </section>
    </main>
  );
}

/** Una tarjeta del índice: título, de qué trata y a dónde lleva. */
export function TarjetaDocumento({
  href,
  titulo,
  resumen,
  comun,
}: {
  href: string;
  titulo: string;
  resumen: string;
  comun?: boolean;
}) {
  return (
    <Link
      href={href}
      className="group block rounded-2xl border border-zinc-200 bg-white p-5 transition hover:border-falu-red-300 hover:shadow-sm"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-extrabold tracking-tight text-zinc-900 group-hover:text-falu-red-800">
          {titulo}
        </h2>
        {comun && (
          <span className="shrink-0 rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-700">
            Común a los dos
          </span>
        )}
      </div>
      <p className="mt-2 text-sm leading-relaxed text-zinc-600">{resumen}</p>
    </Link>
  );
}

/** Cabecera del índice, con la explicación de las dos vistas. */
export function IndiceLegal({
  activa,
  titulo,
  intro,
  children,
}: {
  activa: Vista;
  titulo: string;
  intro: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <main className="bg-white text-zinc-900">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-b from-falu-red-100 via-white to-falu-red-50" />
        <Container>
          <div className="relative mx-auto max-w-3xl py-12 sm:py-16">
            <p className="text-xs font-semibold uppercase tracking-wide text-falu-red-700">
              LZ English Academy — Centro legal
            </p>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-zinc-900 sm:text-4xl">
              {titulo}
            </h1>
            <div className="mt-4 text-[15px] leading-relaxed text-zinc-600">{intro}</div>
            <div className="mt-8">
              <PestanasLegales activa={activa} />
            </div>
          </div>
        </Container>
      </section>
      <section className="pb-16">
        <Container>
          <div className="mx-auto grid max-w-3xl gap-4">{children}</div>
        </Container>
      </section>
    </main>
  );
}
