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
      // Rutas de mercado eliminadas → home (301 permanent)
      { source: "/mexico", destination: "/", permanent: true },
      { source: "/colombia", destination: "/", permanent: true },
      { source: "/honduras", destination: "/", permanent: true },
      { source: "/latinos-usa", destination: "/", permanent: true },
    ];
  },
};

export default nextConfig;
