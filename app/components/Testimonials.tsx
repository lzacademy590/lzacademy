"use client";

import { Container } from "./Container";
import Pill from "./Pill";
import ReactCountryFlag from "react-country-flag";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import { useTestimoniosDePlataforma } from "../hooks/useTestimoniosDePlataforma";

type Testimonial = {
    name: string;
    country: string;
    countryCode: string;
    text: string;
};

/**
 * Una tarjeta del carrusel, venga de donde venga. Los testimonios escritos a
 * mano traen PAÍS (con su bandera) y los de la plataforma traen NIVEL — no hay
 * país en el perfil del alumno, y derivarlo de su zona horaria diría "Perú"
 * para todo el que no la haya tocado, porque ése es el default. Antes que una
 * bandera inventada en una página pública, el nivel, que además es información
 * útil: dice desde dónde partía quien habla.
 */
type Tarjeta = {
    clave: string;
    nombre: string;
    texto: string;
    pais?: { nombre: string; codigo: string };
    nivel?: string | null;
    /** null = no dejó estrellas. Las escritas a mano no tienen: se pintan a 5. */
    estrellas?: number | null;
};

/** "B2_1" es como se guarda el nivel heredado; al alumno se le enseña "B2.1". */
function etiquetaDeNivel(nivel: string) {
    return `Nivel ${nivel.replace("_", ".")}`;
}

const testimonials: Testimonial[] = [
    {
        name: "Susan Pérez",
        country: "Guatemala",
        countryCode: "GT",
        text: "Me ayudó a resolver dudas y a ver el inglés de una manera más divertida, sin sentirme presionada ni con miedo a equivocarme.",
    },
    {
        name: "Mónica Alvarado de Paz",
        country: "Guatemala",
        countryCode: "GT",
        text: "El curso 590 me ayudó a aprender inglés después de años de intentar entender el idioma. Mejoró mi confianza y en un mes, comencé a ver los cambios.",
    },
    {
        name: "Sharick González",
        country: "Ecuador",
        countryCode: "EC",
        text: "Este curso me ayudó a mejorar y reforzar mucho en mi nivel A2 y tambien hizo que en mi escuela entendiera fácilmente las clases de inglés.",
    },
    {
        name: "Norma Calderón",
        country: "Estados Unidos",
        countryCode: "US",
        text: "Es el mejor método que he probado. Mejoré mi vocabulario, mi escritura y sobre todo perdí el miedo a hablar. Las docentes te dan la confianza y paciencia que necesitas.",
    },
    {
        name: "Lizbeth Ocampo",
        country: "México",
        countryCode: "MX",
        text: "Nunca había avanzado tanto con otros cursos. La comunidad genera confianza para practicar y como docente confirmo que trabaja las cuatro habilidades: escuchar, hablar, leer y escribir.",
    },
    {
        name: "Brendalix Ortega",
        country: "Colombia",
        countryCode: "CO",
        text: "Aprendí a defenderme en inglés, puedo comunicar, realizar preguntas a otras personas y entender lo que me dicen mis compañeros. Super recomiendo este método y curso.",
    },
    {
        name: "Fatima del Carmen Meza",
        country: "México",
        countryCode: "MX",
        text: "Me encanta, el método es muy dinámico y sencillo de entender y aplicar, siempre te están apoyando y estás en constante mejora en tu vocabulario.",
    },
    {
        name: "Saira Ochoa",
        country: "Colombia",
        countryCode: "CO",
        text: "Me ayudo mucho este curso, estoy perdiendo el miedo para hablar en inglés y también a compartir con otros compañeros. En general me gusta mucho el curso.",
    },
];

export function TestimonialsSection() {
    const deLaPlataforma = useTestimoniosDePlataforma();

    // Las de la plataforma van PRIMERO: son las recientes y las que el negocio
    // acaba de decidir publicar. El carrusel va en bucle, así que las de siempre
    // siguen viéndose — no se sustituyen, se suman.
    const tarjetas: Tarjeta[] = [
        ...deLaPlataforma.map((t, i) => ({
            clave: `plataforma-${i}-${t.nombre}`,
            nombre: t.nombre,
            texto: t.texto,
            nivel: t.nivel,
            estrellas: t.estrellas,
            // El país lo eligió el alumno, así que su tarjeta se pinta con
            // bandera igual que las de siempre. Sin país cae al nivel.
            ...(t.pais && t.codigoPais
                ? { pais: { nombre: t.pais, codigo: t.codigoPais } }
                : {}),
        })),
        ...testimonials.map((t) => ({
            clave: `${t.name}-${t.countryCode}`,
            nombre: t.name,
            texto: t.text,
            pais: { nombre: t.country, codigo: t.countryCode },
        })),
    ];

    return (
        <section className="py-14 sm:py-18 bg-white">
            <Container>
                <div className="mx-auto max-w-2xl text-center mb-10">
                    <Pill tone="orange">Testimonios</Pill>
                    <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-zinc-900 sm:text-4xl">
                        Resultados que se sienten
                    </h2>
                    <p className="mt-3 text-zinc-500 text-sm">
                        Confianza, estructura y fluidez real con práctica diaria.
                    </p>
                </div>

                {/* ⚠️⚠️ Las alturas se igualan desde `globals.css`
                    (`.lz-testimonios`) y NO desde aquí, y el motivo es la
                    CASCADA: las utilidades de Tailwind viven en
                    `@layer utilities`, el CSS de Swiper es UNLAYERED, y lo
                    unlayered le gana a lo layered pase lo que pase con la
                    especificidad.

                    Este div llevaba `[&_.swiper-slide]:flex
                    [&_.swiper-slide]:h-auto`, con un comentario prometiendo que
                    así la tarjeta se estiraba a la más alta. La clase SÍ se
                    generaba —medido en el CSSOM el 2026-09-18:
                    `.\[\&_\.swiper-slide\]\:flex .swiper-slide` está en
                    `@layer utilities`— y aun así perdía contra el
                    `.swiper-slide { display:block; height:100% }` de Swiper.
                    Ese `100%`, contra un wrapper de altura automática, colapsa
                    a "lo que mida cada una": 198 y 221 px en la misma fila.

                    ⚠️ La consecuencia práctica, que es lo que hay que saber
                    antes de tocar esto: NINGUNA utilidad de Tailwind puesta
                    sobre el slide le va a ganar a Swiper. Si alguien vuelve a
                    intentar arreglarlo con clases, no va a funcionar. El CSS
                    plano de `globals.css` sí, porque compila fuera de capa. */}
                <div className="lz-testimonios" style={{ paddingBottom: "32px" }}>
                    <Swiper
                        modules={[Autoplay, Pagination]}
                        loop
                        grabCursor
                        autoplay={{ delay: 4500, disableOnInteraction: false }}
                        pagination={{ clickable: true }}
                        slidesPerView={1}
                        spaceBetween={16}
                        style={{ paddingBottom: "32px" }}
                        breakpoints={{
                            640: { slidesPerView: 1.1, spaceBetween: 16 },
                            768: { slidesPerView: 2, spaceBetween: 20 },
                            1024: { slidesPerView: 3, spaceBetween: 24 },
                        }}
                    >
                        {tarjetas.map((t) => (
                            <SwiperSlide key={t.clave}>
                                <div className="flex h-full w-full flex-col bg-white rounded-2xl shadow-sm ring-1 ring-black/5 p-6 transition hover:shadow-md">
                                    {/* Estrellas — TRES estados, no dos:
                                        · `undefined`: escrita a mano. Nunca tuvo
                                          calificación y se pinta a 5, como se ha
                                          publicado siempre.
                                        · un número: las que el alumno dio.
                                        · `null`: el alumno NO calificó, y
                                          entonces no se pinta ninguna estrella.
                                          Ponerle cinco a quien no puso ninguna es
                                          inventarle una nota. */}
                                    {t.estrellas !== null && (
                                    <div className="flex gap-0.5 mb-4">
                                        {[...Array(5)].map((_, i) => (
                                            <svg key={i} className={`w-4 h-4 ${i < (t.estrellas ?? 5) ? "text-yellow-orange-400" : "text-zinc-200"}`} viewBox="0 0 20 20" fill="currentColor">
                                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                            </svg>
                                        ))}
                                    </div>
                                    )}

                                    {/* ⚠️⚠️ El `line-clamp` NO es cosmético: es el
                                        tope de alto de la sección. Este
                                        comentario prometía que "keeps all cards
                                        the same height" y la clase NO ESTABA —
                                        con las reseñas de la plataforma, que
                                        son texto libre de un alumno, una de
                                        4.000 caracteres medía **2.064 px** de
                                        alto frente a los 221-244 de las
                                        escritas a mano, y empujaba el resto de
                                        la página debajo. Medido el 2026-09-18.

                                        Las 12 líneas no son a ojo: es lo que
                                        ocupan a 375 px los 400 caracteres a los
                                        que la plataforma topa una reseña nueva
                                        (`MAX_RESENA`), así que lo que un alumno
                                        escriba hoy se lee ENTERO. Solo se corta
                                        lo que viene de la forma vieja, cuando
                                        la pregunta era un texto libre sin tope.

                                        Acota el TECHO; lo que IGUALA las alturas
                                        es `.lz-testimonios`. Son dos cosas
                                        distintas y hacen falta las dos: sin el
                                        tope, "que se vean parejas" significaria
                                        estirar las once tarjetas buenas hasta
                                        los 2.064 px de la mas larga. */}
                                    <p className="text-sm text-zinc-700 leading-relaxed mb-5 line-clamp-[12]">
                                        &ldquo;{t.texto}&rdquo;
                                    </p>

                                    {/* ⚠️ `mt-auto` es lo que hace CIERTO el
                                        "siempre abajo" que este comentario ya
                                        prometia: sin el, en una tarjeta estirada
                                        a la altura de su vecina el pie se queda
                                        pegado al texto y el hueco cae DEBAJO,
                                        que es justo lo que se lee como tarjeta
                                        rota. */}
                                    <div className="mt-auto flex items-center gap-3 pt-4 border-t border-zinc-100">
                                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-zinc-50 ring-1 ring-inset ring-zinc-200 shrink-0">
                                            {t.pais ? (
                                                <ReactCountryFlag
                                                    countryCode={t.pais.codigo}
                                                    svg
                                                    style={{ width: "16px", height: "16px", borderRadius: "999px" }}
                                                    aria-label={t.pais.nombre}
                                                    title={t.pais.nombre}
                                                />
                                            ) : (
                                                <span className="text-[11px] font-semibold text-zinc-500" aria-hidden="true">
                                                    {t.nombre.slice(0, 1).toUpperCase()}
                                                </span>
                                            )}
                                        </span>
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-zinc-900 truncate">{t.nombre}</p>
                                            <p className="text-xs text-zinc-400">
                                                {t.pais ? t.pais.nombre : t.nivel ? etiquetaDeNivel(t.nivel) : "Alumno del Método 590"}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </SwiperSlide>
                        ))}
                    </Swiper>
                </div>
            </Container>
        </section>
    );
}
