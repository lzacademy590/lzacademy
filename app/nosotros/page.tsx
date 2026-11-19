import Image from "next/image";
import Link from "next/link";

/*
 * Nosotros: une /historia (#historia) y /fundacion (#fundacion). Las URL
 * viejas redirigen a estas anclas: no renombrar los `id`.
 *
 * ⚠️ De la fundación NO se da porcentaje ni cifra (decisión del negocio): solo
 * que "una parte de cada inscripción" va a ella.
 */

// El mismo video que enseñaba /fundacion.
const VIDEO_FUNDACION = "https://drive.google.com/file/d/1Zm8vIjIBsSRJAHu2d8i-_RIg3GfqZmDx/preview";
const TIKTOK_FUNDACION = "https://www.tiktok.com/t/ZThVwGhUh/";

const HITOS = [
  {
    cuando: "2021 · el requisito",
    texto:
      "Loren se preparaba para estudiar en Estados Unidos. Le faltaba un requisito que no había leído: una entrevista completamente en inglés, con nivel conversacional B1. No sabía ni el verbo “to be”.",
  },
  {
    cuando: "El plazo",
    texto:
      "Tenía 3 meses. Las academias le dijeron que era imposible: eso se logra en mínimo 6 a 8 meses.",
  },
  {
    cuando: "El método",
    texto:
      "Estudió cómo los bebés adquieren su primer idioma y armó una rutina de 5 sesiones diarias que sigue ese mismo camino, con la estructura que necesita un adulto.",
  },
  {
    cuando: "El resultado",
    texto: "Pasó la entrevista. Esa rutina es hoy el Método 590.",
  },
];

const APOYO = [
  "Acceso a educación básica",
  "Útiles y materiales escolares",
  "Ayuda para que niños de familias de bajos recursos asistan y se mantengan en la escuela",
];

export default function NosotrosPage() {
  return (
    <main className="bg-white text-lz-ink">
      {/* HERO */}
      <section className="bg-linear-to-b from-white to-lz-lila py-12 sm:py-16 lg:pb-20">
        <div className="lz-wrap grid grid-cols-1 items-center gap-10 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-14">
          <div className="flex min-w-0 flex-col gap-5">
            <p className="lz-eyebrow">Nosotros</p>
            <h1 className="lz-display text-[38px] sm:text-[50px] lg:text-[58px]">
              Un método que nació de una necesidad real
            </h1>
            <p className="lz-lead">
              Somos LZ English Academy. Enseñamos inglés con el Método 590, la rutina que Loren
              Laínez creó para sí misma, y apoyamos la educación de niños en Honduras con la
              Fundación LZ.
            </p>
            <nav aria-label="En esta página" className="flex flex-wrap gap-2">
              <a href="#historia" className="lz-pill lz-pill-lila no-underline hover:bg-lz-bd">
                La historia
              </a>
              <a href="#fundacion" className="lz-pill lz-pill-lila no-underline hover:bg-lz-bd">
                La Fundación LZ
              </a>
            </nav>
          </div>
          <div className="relative mx-auto aspect-[4/5] w-full max-w-[400px] overflow-hidden rounded-3xl">
            <Image
              src="/creadora.jpeg"
              alt="Retrato de Loren Laínez, creadora del Método 590, con saco rojo y las manos bajo el mentón"
              fill
              priority
              sizes="(min-width: 440px) 400px, 100vw"
              className="object-cover object-[50%_30%]"
            />
          </div>
        </div>
      </section>

      {/* HISTORIA */}
      <section id="historia" className="scroll-mt-24 py-16 sm:py-22">
        <div className="lz-wrap">
          <div className="flex max-w-[960px] flex-col gap-8">
            <div className="flex flex-col gap-2.5">
              <p className="lz-eyebrow">La historia</p>
              <h2 className="lz-display text-[32px] sm:text-[44px]">
                Tres meses para una entrevista en inglés
              </h2>
            </div>
            <ol className="m-0 ml-2.5 flex list-none flex-col border-l-2 border-lz-lila2 p-0">
              {HITOS.map((h) => (
                <li key={h.cuando} className="relative pb-7 pl-7 last:pb-0">
                  <span
                    aria-hidden="true"
                    className="absolute top-1 -left-[9px] h-4 w-4 rounded-full bg-lz-grape"
                  />
                  <b className="text-[13px] tracking-[0.08em] text-lz-grape uppercase">{h.cuando}</b>
                  <p className="lz-p mt-1 text-[17px] text-lz-ink">{h.texto}</p>
                </li>
              ))}
            </ol>
            <blockquote className="lz-card m-0 flex flex-col gap-2.5 border-lz-lila2 bg-lz-lila p-6 sm:p-7">
              <p className="font-display text-[22px] leading-tight font-extrabold text-lz-ink sm:text-[28px]">
                “En tres meses pasé de no saber ni el verbo to be a pasar mi entrevista en inglés.”
              </p>
              <footer className="text-[14px] text-lz-ink2">
                <b className="text-lz-ink">Loren Laínez</b> · creadora del Método 590
              </footer>
            </blockquote>
            <p className="lz-p">
              Hoy Loren estudia Ingeniería Biomédica y Ciencias de la Computación en Estados Unidos,
              y el método que la llevó ahí es el que siguen nuestros alumnos.
            </p>
          </div>
        </div>
      </section>

      {/* FUNDACIÓN */}
      <section id="fundacion" className="scroll-mt-24 bg-lz-lila py-16 sm:py-22">
        <div className="lz-wrap grid grid-cols-1 items-center gap-10 lg:grid-cols-[380px_minmax(0,1fr)] lg:gap-12">
          <div className="order-2 flex flex-col items-center gap-3 lg:order-1">
            <div className="aspect-[9/16] w-full max-w-[340px] overflow-hidden rounded-3xl border border-lz-bd bg-white">
              <iframe
                title="Video de la Fundación LZ"
                src={VIDEO_FUNDACION}
                className="h-full w-full"
                allow="autoplay; encrypted-media"
                allowFullScreen
                loading="lazy"
              />
            </div>
            <a
              href={TIKTOK_FUNDACION}
              target="_blank"
              rel="noreferrer"
              className="lz-btn lz-btn-3 text-[15px]"
            >
              ¿No ves el video? Míralo en TikTok
            </a>
          </div>
          <div className="order-1 flex min-w-0 flex-col gap-4.5 lg:order-2">
            <p className="lz-eyebrow">La Fundación LZ</p>
            <h2 className="lz-display text-[32px] sm:text-[44px]">
              Tu inscripción también ayuda a un niño a seguir en la escuela
            </h2>
            <p className="lz-lead">
              Una parte de cada inscripción al Método 590 va a la Fundación LZ, que apoya la
              educación de niños y niñas en situación vulnerable en Honduras.
            </p>
            <ul className="m-0 flex list-none flex-col gap-3 p-0">
              {APOYO.map((t) => (
                <li key={t} className="lz-p flex items-start gap-3 text-lz-ink">
                  <span className="lz-tic" aria-hidden="true">
                    ✓
                  </span>
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-18">
        <div className="lz-wrap flex flex-col items-center gap-4 text-center">
          <h2 className="lz-display max-w-[720px] text-[30px] sm:text-[42px]">
            Empieza tu propia rutina
          </h2>
          <Link href="/paso-uno" className="lz-btn lz-btn-1 lz-btn-lg">
            Descubre tu plan en 1 minuto
          </Link>
        </div>
      </section>
    </main>
  );
}
