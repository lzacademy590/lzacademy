import { NextRequest, NextResponse } from "next/server";

const VALID_ROUTES = new Set([
  "/",
  "/historia",
  "/interes",
  "/metodo",
  "/ciencia",
  "/como-funciona",
  "/sesiones",
  "/fundacion",
  "/success",
  "/pago-estudiantes",
  "/admin/dashboard",
  "/admin/pagos",
  "/admin/recurrentes",
  "/admin/fechas",
  "/admin/niveles",
  "/admin/contenido",
  "/admin/login",
  "/admin/busqueda",
  "/admin/premium-agenda",
  "/admin/marketing",
  "/admin/correo-interes",
  "/admin/correos",
  "/admin/accesos",
  "/admin/descuentos",
  "/admin/no-renovados",
  "/admin/cupos",
  "/paso-uno",
  "/paso-dos",
  "/paso-tres",
  "/paso-cuatro",
  "/essential",
  "/premium",
  "/personalizado",
  "/fluidez",
  "/terminos",
  "/reembolsos",
  "/privacidad",
  "/mi-suscripcion",
]);

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname === "/sitemap.xml" ||
    pathname === "/robots.txt" ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  /*
    La landing de un plan abierto en el admin (`/plan/<clave>`) es DINÁMICA, así
    que no puede estar en `VALID_ROUTES`: su clave no se conoce al desplegar.

    ⚠️⚠️ **Esta lista es una LISTA BLANCA, y por eso una ruta nueva muere en
    silencio si nadie la añade**: no da 404 —que se vería— sino un 307 a la
    portada, que parece que el enlace "no hace nada". Medido: la landing
    respondía 307 y el navegador acababa en `/` sin ningún error.

    Se comprueba la FORMA de la clave (un solo segmento, sin barras) y no que el
    plan exista: de eso se encarga la página, que sabe distinguir "todavía no
    cargó el catálogo" de "ese plan ya no está disponible". El middleware no
    puede consultar el catálogo sin pagar una llamada en cada navegación.
  */
  if (/^\/plan\/[A-Za-z0-9_-]+$/.test(pathname)) {
    return NextResponse.next();
  }

  if (!VALID_ROUTES.has(pathname)) {
    return NextResponse.redirect(new URL("/", request.url), 307);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
