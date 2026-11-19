"use client";

import Image from "next/image";
import { useState } from "react";
import { VIDEO_INTRO } from "@/app/lib/sitio";
import { medirVideoIntro } from "@/app/lib/analitica";

/*
  El video de presentación del hero (HU «sitio simple», 2026-11-18).

  ⚠️ **No arranca solo.** Hasta que se pulsa Play solo hay una imagen: ni el
  <video> ni el <iframe> existen en el DOM, así que no descargan nada. Un video
  que se carga al entrar frena la portada en el móvil, y la HU pide que la
  velocidad de la home no empeore (criterio 18).

  ⚠️ Sin `VIDEO_INTRO.src` se enseña la ilustración de siempre: un botón de
  reproducir que no reproduce nada es peor que no tener video.
*/

/** YouTube y Vimeo se incrustan; cualquier otra URL se trata como archivo de video. */
function incrustacion(src: string): string | null {
  try {
    const u = new URL(src);
    const host = u.hostname.replace(/^www\./, "");
    if (host === "youtu.be") return `https://www.youtube-nocookie.com/embed/${u.pathname.slice(1)}?autoplay=1&cc_load_policy=1&rel=0`;
    if (host === "youtube.com" || host === "m.youtube.com") {
      const id = u.searchParams.get("v") ?? u.pathname.split("/").pop();
      return id ? `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&cc_load_policy=1&rel=0` : null;
    }
    if (host === "vimeo.com") return `https://player.vimeo.com/video/${u.pathname.split("/").filter(Boolean)[0]}?autoplay=1`;
  } catch {
    // Ruta relativa (/videos/intro.mp4): es un archivo.
  }
  return null;
}

export default function VideoIntro() {
  const [reproduciendo, setReproduciendo] = useState(false);
  const [transcripcion, setTranscripcion] = useState(false);

  if (!VIDEO_INTRO.src) {
    return (
      <div className="flex flex-1 basis-[380px] justify-center">
        <Image
          src="/human.webp"
          alt="Ilustración de una persona estudiando inglés con su laptop"
          width={560}
          height={560}
          className="h-auto w-full max-w-[460px]"
          sizes="(max-width: 1024px) 90vw, 460px"
          priority
        />
      </div>
    );
  }

  const embed = incrustacion(VIDEO_INTRO.src);

  function reproducir() {
    setReproduciendo(true);
    medirVideoIntro("reproducido");
  }

  return (
    <figure className="m-0 flex w-full max-w-[560px] flex-1 basis-[420px] flex-col gap-3">
      <div className="relative aspect-video w-full overflow-hidden rounded-[22px] bg-black shadow-[0_20px_44px_rgba(30,16,41,0.18)]">
        {reproduciendo ? (
          embed ? (
            <iframe
              src={embed}
              title={VIDEO_INTRO.titulo}
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
              className="absolute inset-0 h-full w-full border-0"
            />
          ) : (
            <video
              src={VIDEO_INTRO.src}
              poster={VIDEO_INTRO.poster}
              controls
              autoPlay
              playsInline
              onEnded={() => medirVideoIntro("completado")}
              className="absolute inset-0 h-full w-full"
            />
          )
        ) : (
          <button
            type="button"
            onClick={reproducir}
            aria-label={`Ver el video: ${VIDEO_INTRO.titulo}`}
            className="group absolute inset-0 flex cursor-pointer items-center justify-center border-0 p-0"
          >
            <Image
              src={VIDEO_INTRO.poster}
              alt=""
              fill
              sizes="(max-width: 1024px) 90vw, 560px"
              className="object-cover object-[center_25%] opacity-90"
              priority
            />
            <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-b from-transparent from-40% to-black/55" />
            <span className="relative flex h-[84px] w-[84px] items-center justify-center rounded-full bg-lz-grape text-white shadow-[0_0_0_10px_rgba(255,255,255,0.25)] transition group-hover:bg-lz-violet">
              <svg width="34" height="34" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>
            </span>
            <span className="absolute bottom-4 left-[18px] flex flex-col gap-0.5 text-left text-white">
              <b className="text-[16px]">{VIDEO_INTRO.titulo}</b>
              <span className="text-[13px] opacity-90">
                {[VIDEO_INTRO.duracion, "con subtítulos"].filter(Boolean).join(" · ")}
              </span>
            </span>
          </button>
        )}
      </div>
      <figcaption className="flex flex-wrap justify-between gap-2.5 text-[14px] text-lz-ink2">
        <span>Qué es, cómo es tu semana y qué plan te conviene.</span>
        {VIDEO_INTRO.transcripcion && (
          <button
            type="button"
            onClick={() => setTranscripcion((v) => !v)}
            aria-expanded={transcripcion}
            className="font-bold text-lz-grape underline-offset-2 hover:underline"
          >
            {transcripcion ? "Ocultar la transcripción" : "Leer la transcripción"}
          </button>
        )}
      </figcaption>
      {transcripcion && (
        <p className="lz-card whitespace-pre-line p-4 text-[15px] leading-relaxed text-lz-ink2">
          {VIDEO_INTRO.transcripcion}
        </p>
      )}
    </figure>
  );
}
