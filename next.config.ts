import type { NextConfig } from "next";

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
      // www → non-www (301 permanent)
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.lz-englishacademy.com" }],
        destination: "https://lz-englishacademy.com/:path*",
        permanent: true,
      },
      // Rutas de mercado eliminadas → home (301 permanent)
      { source: "/mexico", destination: "/", permanent: true },
      { source: "/colombia", destination: "/", permanent: true },
      { source: "/honduras", destination: "/", permanent: true },
      { source: "/latinos-usa", destination: "/", permanent: true },
    ];
  },
};

export default nextConfig;
