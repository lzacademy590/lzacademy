import { NextRequest, NextResponse } from "next/server";

const VALID_ROUTES = new Set([
  "/",
  "/interes",
  "/metodo",
  "/nosotros",
  "/success",
  "/pago-estudiantes",
  "/mi-horario",
  "/horarios",
  "/admin/dashboard",
  "/admin/pagos",
  "/admin/recurrentes",
  "/admin/fechas",
  "/admin/horarios",
  "/admin/niveles",
  "/admin/contenido",
  "/admin/marca",
  "/admin/login",
  "/admin/busqueda",
  "/admin/marketing",
  "/admin/correo-interes",
  "/admin/correos",
  "/admin/accesos",
  "/admin/descuentos",
  "/admin/no-renovados",
  "/admin/cupos",
  "/paso-uno",
  "/paso-tres",
  "/paso-cuatro",
  "/terminos",
  "/reembolsos",
  "/privacidad",
  "/legal",
  "/legal/plataforma",
  "/legal/plataforma/terminos",
  "/legal/plataforma/privacidad",
  "/legal/plataforma/normas-de-comunidad",
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

  // /plan/<clave> ya no es una página: redirige (308) al paso 2 desde next.config.ts.

  if (!VALID_ROUTES.has(pathname)) {
    return NextResponse.redirect(new URL("/", request.url), 307);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
