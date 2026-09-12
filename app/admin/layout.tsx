"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../lib/supabaseClient";

type NavItem = { label: string; href: string; icon: React.ReactNode };
type NavGroup = { title: string; items: NavItem[] };

const ICON = {
  home: (
    <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  payments: (
    <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  search: (
    <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
    </svg>
  ),
  premium: (
    <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  marketing: (
    <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
    </svg>
  ),
  mail: (
    <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  discount: (
    <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5a1.99 1.99 0 011.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.99 1.99 0 013 12V7a4 4 0 014-4z" />
    </svg>
  ),
  refresh: (
    <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  ),
  warning: (
    <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
    </svg>
  ),
  doc: (
    <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  calendar: (
    <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  key: (
    <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
    </svg>
  ),
  layers: (
    <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l9 4.5-9 4.5-9-4.5L12 3z M3 12l9 4.5 9-4.5 M3 16.5l9 4.5 9-4.5" />
    </svg>
  ),
  ticket: (
    <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5h14a2 2 0 012 2v3a2 2 0 000 4v3a2 2 0 01-2 2H5a2 2 0 01-2-2v-3a2 2 0 000-4V7a2 2 0 012-2z" />
    </svg>
  ),
  logout: (
    <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" />
    </svg>
  ),
};

const navGroups: NavGroup[] = [
  {
    title: "Estudiantes",
    items: [
      { label: "Inicio", href: "/admin/dashboard", icon: ICON.home },
      { label: "Pagos", href: "/admin/pagos", icon: ICON.payments },
      { label: "Búsqueda", href: "/admin/busqueda", icon: ICON.search },
      { label: "Premium · Agenda", href: "/admin/premium-agenda", icon: ICON.premium },
    ],
  },
  {
    title: "Marketing",
    items: [
      { label: "Marketing", href: "/admin/marketing", icon: ICON.marketing },
      { label: "Correos", href: "/admin/correos", icon: ICON.mail },
      { label: "Descuentos", href: "/admin/descuentos", icon: ICON.discount },
    ],
  },
  {
    title: "Retención",
    items: [
      { label: "Usuarios recurrentes", href: "/admin/recurrentes", icon: ICON.refresh },
      { label: "No renovados", href: "/admin/no-renovados", icon: ICON.warning },
    ],
  },
  {
    title: "Configuración",
    items: [
      { label: "Contenido", href: "/admin/contenido", icon: ICON.doc },
      { label: "Textos de los correos", href: "/admin/correo-interes", icon: ICON.mail },
      { label: "Fechas de inicio", href: "/admin/fechas", icon: ICON.calendar },
      { label: "Niveles por plan", href: "/admin/niveles", icon: ICON.layers },
      { label: "Cupos por plan", href: "/admin/cupos", icon: ICON.ticket },
      { label: "Accesos", href: "/admin/accesos", icon: ICON.key },
    ],
  },
];

const IDLE_MS = 20 * 60 * 1000;
const WARN_MS = 1 * 60 * 1000;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [idleWarning, setIdleWarning] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warnRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isLogin = pathname === "/admin/login";

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
    router.push("/admin/login");
  }, [router]);

  const resetTimer = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warnRef.current) clearTimeout(warnRef.current);
    setIdleWarning(false);
    warnRef.current = setTimeout(() => setIdleWarning(true), IDLE_MS - WARN_MS);
    timeoutRef.current = setTimeout(() => handleLogout(), IDLE_MS);
  }, [handleLogout]);

  useEffect(() => {
    if (isLogin) return;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.email) setAdminEmail(session.user.email);
    });

    const events = ["mousemove", "mousedown", "keypress", "touchstart", "scroll"];
    events.forEach((e) => window.addEventListener(e, resetTimer, { passive: true }));
    resetTimer();

    return () => {
      events.forEach((e) => window.removeEventListener(e, resetTimer));
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warnRef.current) clearTimeout(warnRef.current);
    };
  }, [isLogin, resetTimer]);

  if (isLogin) {
    return <div className="min-h-screen bg-gray-50">{children}</div>;
  }

  const renderNavItem = (item: NavItem, onClick?: () => void) => {
    const isActive = pathname === item.href;
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={onClick}
        className={`group relative flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150 ${
          isActive
            ? "bg-falu-red-50 text-falu-red-700"
            : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
        }`}
      >
        {isActive && (
          <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-gradient-to-b from-falu-red-500 to-yellow-orange-400" />
        )}
        <span
          className={`flex-shrink-0 transition-colors ${
            isActive ? "text-falu-red-600" : "text-gray-400 group-hover:text-gray-600"
          }`}
        >
          {item.icon}
        </span>
        <span className="truncate">{item.label}</span>
      </Link>
    );
  };

  const Sidebar = (
    <aside className="hidden lg:flex lg:flex-col fixed top-0 left-0 h-screen w-60 bg-white border-r border-gray-100 z-30">
      {/* Logo */}
      <Link
        href="/admin/dashboard"
        className="flex items-center gap-2.5 px-5 h-16 border-b border-gray-100 flex-shrink-0"
      >
        <span className="relative w-9 h-9 rounded-full overflow-hidden ring-1 ring-black/5 shadow-sm flex-shrink-0">
          <img
            src="/lzacademy_logo1.png"
            alt="LZ English Academy"
            className="absolute inset-0 w-full h-full object-cover"
          />
        </span>
        <div className="leading-none">
          <p className="text-[13px] font-bold text-gray-900 leading-tight">LZ Academy</p>
          <p className="text-[10px] font-semibold text-gray-400 tracking-widest uppercase leading-tight mt-0.5">
            Admin
          </p>
        </div>
      </Link>

      {/* Nav scroll area */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-5">
        {navGroups.map((group) => (
          <div key={group.title}>
            <p className="px-3 mb-1.5 text-[10px] font-semibold text-gray-300 uppercase tracking-[0.08em]">
              {group.title}
            </p>
            <div className="flex flex-col gap-0.5">
              {group.items.map((item) => renderNavItem(item))}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer (user + logout) */}
      <div className="border-t border-gray-100 p-3 flex-shrink-0">
        {adminEmail && (
          <div className="flex items-center gap-2.5 px-2 py-2 mb-1">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-falu-red-500 to-yellow-orange-400 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-[11px] font-bold">{adminEmail[0].toUpperCase()}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-gray-700 truncate leading-tight">
                {adminEmail.split("@")[0]}
              </p>
              <p className="text-[10px] text-gray-400 truncate leading-tight mt-0.5 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Activo
              </p>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
        >
          <span className="flex-shrink-0">{ICON.logout}</span>
          Cerrar sesión
        </button>
      </div>
    </aside>
  );

  const MobileTopbar = (
    <nav className="lg:hidden bg-white sticky top-0 z-20 shadow-[0_1px_0_0_#f3f4f6]">
      <div className="px-4 flex items-center justify-between h-16">
        <Link href="/admin/dashboard" className="flex items-center gap-2.5">
          <span className="relative w-8 h-8 rounded-full overflow-hidden ring-1 ring-black/5 shadow-sm flex-shrink-0">
            <img
              src="/lzacademy_logo1.png"
              alt="LZ English Academy"
              className="absolute inset-0 w-full h-full object-cover"
            />
          </span>
          <div className="leading-none">
            <p className="text-[13px] font-bold text-gray-900 leading-tight">LZ Academy</p>
            <p className="text-[10px] font-semibold text-gray-400 tracking-widest uppercase leading-tight">
              Admin
            </p>
          </div>
        </Link>

        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-500 hover:bg-gray-100 transition-colors cursor-pointer"
          aria-label="Menú"
        >
          {menuOpen ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {menuOpen && (
        <div className="border-t border-gray-100 bg-white max-h-[calc(100vh-4rem)] overflow-y-auto">
          {adminEmail && (
            <div className="flex items-center gap-2.5 px-4 py-3 border-b border-gray-50">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-falu-red-500 to-yellow-orange-400 flex items-center justify-center flex-shrink-0">
                <span className="text-white text-[10px] font-bold">{adminEmail[0].toUpperCase()}</span>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-700 truncate">{adminEmail.split("@")[0]}</p>
                <p className="text-[10px] text-gray-400 truncate">{adminEmail}</p>
              </div>
              <span className="ml-auto flex-shrink-0 flex items-center gap-1 text-[10px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Activo
              </span>
            </div>
          )}

          <div className="px-3 py-3 flex flex-col gap-4">
            {navGroups.map((group) => (
              <div key={group.title}>
                <p className="px-3 mb-1.5 text-[10px] font-semibold text-gray-300 uppercase tracking-[0.08em]">
                  {group.title}
                </p>
                <div className="flex flex-col gap-0.5">
                  {group.items.map((item) => renderNavItem(item, () => setMenuOpen(false)))}
                </div>
              </div>
            ))}
          </div>

          <div className="px-3 pb-3 pt-1 border-t border-gray-50 mt-1">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
            >
              <span className="flex-shrink-0">{ICON.logout}</span>
              Cerrar sesión
            </button>
          </div>
        </div>
      )}
    </nav>
  );

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      {Sidebar}
      {MobileTopbar}

      <div className="lg:ml-60 flex flex-col min-h-screen">
        <main className="flex-1">{children}</main>

        <footer className="mt-8 mb-6 border-t border-gray-100 pt-6 px-4 md:px-8">
          <div className="max-w-screen-xl mx-auto">
            <p className="text-xs text-gray-400">
              © {new Date().getFullYear()} LZ English Academy. Todos los derechos reservados.
            </p>
          </div>
        </footer>
      </div>

      {idleWarning && (
        <div className="fixed bottom-4 right-4 z-50 bg-white border border-yellow-200 shadow-lg rounded-2xl p-4 flex items-center gap-3 max-w-xs">
          <div className="w-8 h-8 rounded-xl bg-yellow-50 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-700">Sesión por expirar</p>
            <p className="text-xs text-gray-400 mt-0.5">Tu sesión se cerrará por inactividad</p>
          </div>
          <button
            onClick={resetTimer}
            className="flex-shrink-0 text-xs bg-yellow-orange-500 hover:bg-yellow-orange-600 text-white px-3 py-1.5 rounded-lg transition font-medium"
          >
            Continuar
          </button>
        </div>
      )}
    </div>
  );
}
