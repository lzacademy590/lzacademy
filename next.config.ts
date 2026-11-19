import type { NextConfig } from "next";
import { URL_DEL_SITIO } from "./app/lib/sitio";

/*
  La mudanza de dominio (de lz-englishacademy.com a lainz590.com).

  HOST_DEL_SITIO sale de URL_DEL_SITIO (app/lib/sitio.ts): su www redirige al
  dominio sin www.

  El dominio VIEJO solo redirige con REDIRIGIR_DOMINIO_VIEJO=1 en el entorno de
  Vercel. ⚠️ Se enciende el DÍA DEL CORTE, cuando lainz590.com ya sirve este
  proyecto: encendida antes, el sitio que vive en el dominio viejo mandaría a
  todo el mundo a un dominio que aún no lo sirve. Y nunca redirige al mismo host
  del que viene (con URL_DEL_SITIO todavía en el dominio viejo sería un bucle).
  Es permanente (308), que es lo que pide el cambio de dirección de Search Console.
*/
const HOST_DEL_SITIO = new URL(URL_DEL_SITIO).host;
const DOMINIO_VIEJO = "lz-englishacademy.com";
const redirigirDominioViejo =
  process.env.REDIRIGIR_DOMINIO_VIEJO === "1" && HOST_DEL_SITIO !== DOMINIO_VIEJO;

const nextConfig: NextConfig = {
  /*
    ⚠️ Compilar sobre el `.next` de un `next dev` que está corriendo CORROMPE el
    servidor de desarrollo: una auditoría llegó a reportar esa caída como su
    bloqueante nº 1 —las cartas sin girar, el CTA inerte— y no era del producto.
    Ya ha pasado tres veces en este negocio.

    Con `NEXT_DIST_DIR=.next-verify npx next build` el build va a su carpeta y no
    toca la del dev. Es la misma variable que ya tiene la plataforma, y `.next-*`
    está ignorado por git.
  */
  ...(process.env.NEXT_DIST_DIR ? { distDir: process.env.NEXT_DIST_DIR } : {}),
  async redirects() {
    return [
      // www → sin www (308 permanente)
      {
        source: "/:path*",
        has: [{ type: "host", value: `www.${HOST_DEL_SITIO}` }],
        destination: `${URL_DEL_SITIO}/:path*`,
        permanent: true,
      },
      // Dominio viejo → dominio nuevo, misma ruta (apagado hasta el corte)
      ...(redirigirDominioViejo
        ? [DOMINIO_VIEJO, `www.${DOMINIO_VIEJO}`].map((host) => ({
            source: "/:path*",
            has: [{ type: "host" as const, value: host }],
            destination: `${URL_DEL_SITIO}/:path*`,
            permanent: true,
          }))
        : []),
      /*
        Rediseño «sitio simple» (2026-11-18, HU-LZ-EMB): las páginas que se
        fusionaron redirigen a su sección de la página nueva. Permanentes, para
        que Google traspase el posicionamiento y los enlaces viejos sigan vivos.

        ⚠️ Next conserva la query del enlace viejo: `/paso-dos?nivel=B1` llega a
        `/paso-uno?nivel=B1` y `/premium?nivel=B1` a `/paso-tres?plan=Premium&nivel=B1`.
        ⚠️ Van ANTES del middleware (`proxy.ts`), así que estas rutas ya no
        tienen que estar en su lista blanca.
      */
      { source: "/como-funciona", destination: "/metodo#semana", permanent: true },
      { source: "/sesiones", destination: "/metodo#sesiones", permanent: true },
      { source: "/ciencia", destination: "/metodo#ciencia", permanent: true },
      { source: "/historia", destination: "/nosotros#historia", permanent: true },
      { source: "/fundacion", destination: "/nosotros#fundacion", permanent: true },
      { source: "/paso-dos", destination: "/paso-uno", permanent: true },
      // Las landings de cada plan (decisión del negocio: no se usan en anuncios).
      { source: "/essential", destination: "/paso-tres?plan=Essential", permanent: true },
      { source: "/premium", destination: "/paso-tres?plan=Premium", permanent: true },
      { source: "/personalizado", destination: "/paso-tres?plan=Personalizado", permanent: true },
      { source: "/fluidez", destination: "/paso-tres?plan=Fluidez", permanent: true },
      { source: "/plan/:clave", destination: "/paso-tres?plan=:clave", permanent: true },
      // Rutas de mercado eliminadas → home (301 permanent)
      { source: "/mexico", destination: "/", permanent: true },
      { source: "/colombia", destination: "/", permanent: true },
      { source: "/honduras", destination: "/", permanent: true },
      { source: "/latinos-usa", destination: "/", permanent: true },
    ];
  },
};

export default nextConfig;
