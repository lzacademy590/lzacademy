"use client";

// "Pendientes de hoy": lo primero del Inicio. Cada tarjeta dice QUÉ pasa, a QUIÉN
// (una muestra de hasta cinco) y lleva a la pantalla donde se resuelve. Lo que está
// al día se resume en una línea al final, para que lo urgente no se pierda entre ceros.

import { useState } from "react";
import Link from "next/link";
import { Boton, BotonEnlace, EscribirCorreo, PLANTILLAS, PlanBadge, Spinner, nivelLabel, type GrupoDeAlumnos } from "../_ui";
import { usePendientes, type Pendientes, type AlumnoPendiente, type GrupoPendiente } from "../_ui/pendientes";
import { fmtDatePT, fmtDia } from "../_utils/format";
import { MotivoDelRechazo } from "../_ui/motivo-de-rechazo";

type Tono = "rojo" | "ambar" | "azul";

type Item = { clave: string; principal: React.ReactNode; secundario?: React.ReactNode; href?: string };

type Definicion = {
  clave: keyof Omit<Pendientes, "generadoEn">;
  titulo: string;
  explicacion: string;
  tono: Tono;
  accion: { label: string; href: string };
  items: (p: Pendientes) => Item[];
  extra?: (p: Pendientes) => string | null;
  /** Si se puede escribir a todo el grupo desde la tarjeta. */
  correo?: GrupoDeAlumnos;
};

// "19:00" -> "7:00 PM PT", como en la pantalla de Horarios.
function horaPT(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  if (Number.isNaN(h)) return hhmm;
  return `${((h + 11) % 12) + 1}:${String(m || 0).padStart(2, "0")} ${h < 12 ? "AM" : "PM"} PT`;
}

const fichaDe = (email: string) => `/admin/busqueda?q=${encodeURIComponent(email)}`;

const alumnoItem = (detalle: (a: AlumnoPendiente) => React.ReactNode) => (a: AlumnoPendiente): Item => ({
  clave: `${a.origen ?? "w"}-${a.id}-${a.email}`,
  principal: a.full_name || a.email,
  secundario: (
    <span className="inline-flex items-center gap-2 flex-wrap">
      <PlanBadge plan={a.plan} />
      {detalle(a)}
    </span>
  ),
  href: fichaDe(a.email),
});

const grupoItem = (detalle: (g: GrupoPendiente) => React.ReactNode) => (g: GrupoPendiente): Item => ({
  clave: g.id,
  principal: `${g.plan} · ${nivelLabel(g.level)}`,
  secundario: (
    <span>
      Inicio {fmtDia(g.start_date)} · {horaPT(g.hora_pt)} · {detalle(g)}
    </span>
  ),
});

const lista = <T,>(b: { ok: boolean; lista?: T[] }) => (b.ok && b.lista ? b.lista : []);

// Ordenadas de más a menos urgente.
const DEFINICIONES: Definicion[] = [
  {
    clave: "pagosFallidos",
    titulo: "Pagos fallidos",
    explicacion:
      "Stripe no pudo cobrar la renovación y lo volverá a intentar. Si actualizan su tarjeta desde el portal, el próximo intento cobra solo.",
    tono: "rojo",
    accion: { label: "Ver no renovados", href: "/admin/no-renovados?tipo=pago-fallido" },
    correo: "pagosFallidos",
    items: (p) =>
      lista(p.pagosFallidos).map(
        alumnoItem((a) => (a.motivo !== undefined ? <MotivoDelRechazo d={{ motivo: a.motivo ?? null, intentos: a.intentos ?? null, proximo_intento: a.proximo_intento ?? null, sin_registro: a.sin_registro }} /> : null)),
      ),
    extra: (p) =>
      p.pagosFallidos.ok && p.pagosFallidos.yaNoReintenta
        ? `${p.pagosFallidos.yaNoReintenta} más que Stripe ya no reintenta, en No renovados`
        : null,
  },
  {
    clave: "noAbrioSinAvisar",
    titulo: "Grupos que no abrieron, sin avisar",
    explicacion: "Cerraron sin llegar al mínimo y sus alumnos todavía no saben que tienen que elegir otro horario.",
    tono: "rojo",
    accion: { label: "Ir a horarios", href: "/admin/horarios" },
    items: (p) => lista(p.noAbrioSinAvisar).map(grupoItem((g) => `${g.inscritos} alumno${g.inscritos === 1 ? "" : "s"}`)),
  },
  {
    clave: "enRiesgo",
    titulo: "Grupos por debajo del mínimo",
    explicacion: "Si no se llenan antes del cierre, no abren y hay que mover a sus alumnos.",
    tono: "ambar",
    accion: { label: "Ir a horarios", href: "/admin/horarios" },
    items: (p) => lista(p.enRiesgo).map(grupoItem((g) => `faltan ${g.faltan} · cierra el ${fmtDia(g.cierre)}`)),
  },
  {
    clave: "sinHorario",
    titulo: "Alumnos sin horario de grupo",
    explicacion: "Pagaron un plan con grupo pero no tienen horario asignado.",
    tono: "ambar",
    accion: { label: "Asignar horario", href: "/admin/horarios" },
    correo: "sinHorario",
    items: (p) =>
      lista(p.sinHorario).map(
        alumnoItem((a) => (a.inscription_date ? <span>inicio {fmtDia(a.inscription_date)}</span> : null)),
      ),
  },
  {
    clave: "accesosPendientes",
    titulo: "Accesos sin enviar",
    explicacion: "Alumnos activos que todavía no recibieron su correo de accesos.",
    tono: "ambar",
    accion: { label: "Ir a accesos", href: "/admin/accesos?estado=pendientes" },
    correo: "accesosPendientes",
    items: (p) => lista(p.accesosPendientes).map(alumnoItem((a) => <span>{nivelLabel(a.level)}</span>)),
  },
  {
    clave: "cancelanPronto",
    titulo: "Cancelaciones que vencen esta semana",
    explicacion: "Pidieron cancelar y pierden el acceso en los próximos 7 días. Es el último momento para escribirles.",
    tono: "ambar",
    accion: { label: "Ver no renovados", href: "/admin/no-renovados?tipo=cancela-pronto" },
    correo: "cancelanPronto",
    items: (p) =>
      lista(p.cancelanPronto).map(alumnoItem((a) => <span>vence el {fmtDatePT(a.current_period_end)}</span>)),
  },
  {
    clave: "cuposPorAgotarse",
    titulo: "Cupos por agotarse",
    explicacion: "Planes a punto de quedarse sin plazas. El tope se cambia en Admin › Planes de la plataforma.",
    tono: "azul",
    accion: { label: "Ver cupos", href: "/admin/cupos" },
    items: (p) =>
      lista(p.cuposPorAgotarse).map((c) => ({
        clave: c.plan,
        principal: <PlanBadge plan={c.plan} />,
        secundario: c.restantes === 0 ? "Agotado" : `Quedan ${c.restantes} de ${c.max}`,
      })),
  },
  {
    clave: "leadsNuevos",
    titulo: "Leads nuevos sin contactar",
    explicacion: "Personas que llenaron el formulario de interés en los últimos 7 días.",
    tono: "azul",
    accion: { label: "Ir a marketing", href: "/admin/marketing?filtro=sin-contactar" },
    items: (p) =>
      lista(p.leadsNuevos).map((l) => ({
        clave: l.id,
        principal: l.full_name || l.email,
        secundario: [l.country, fmtDatePT(l.created_at)].filter(Boolean).join(" · "),
      })),
    extra: (p) =>
      p.leadsNuevos.ok && p.leadsNuevos.totalSinContactar
        ? `${p.leadsNuevos.totalSinContactar} sin contactar en total`
        : null,
  },
];

const ICONO_SOBRE = (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const TONOS: Record<Tono, { borde: string; numero: string; punto: string }> = {
  rojo: { borde: "border-l-red-500", numero: "text-red-600", punto: "bg-red-500" },
  ambar: { borde: "border-l-amber-400", numero: "text-amber-600", punto: "bg-amber-400" },
  azul: { borde: "border-l-blue-400", numero: "text-blue-600", punto: "bg-blue-400" },
};

function hace(iso: string): string {
  const min = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 1) return "hace un momento";
  if (min === 1) return "hace 1 minuto";
  if (min < 60) return `hace ${min} minutos`;
  return `a las ${new Date(iso).toLocaleTimeString("es", { hour: "numeric", minute: "2-digit" })}`;
}

function TarjetaPendiente({ def, datos }: { def: Definicion; datos: Pendientes }) {
  const bloque = datos[def.clave];
  const t = TONOS[def.tono];
  const [escribiendo, setEscribiendo] = useState(false);

  if (!bloque.ok) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 border-l-4 border-l-gray-300 p-5">
        <h3 className="text-sm font-semibold text-gray-700">{def.titulo}</h3>
        <p className="text-xs text-gray-500 mt-1">No se pudo comprobar ahora. Revísalo en su pantalla.</p>
        <div className="mt-4"><BotonEnlace href={def.accion.href}>{def.accion.label} →</BotonEnlace></div>
      </div>
    );
  }

  const items = def.items(datos);
  const extra = def.extra?.(datos);
  const restantes = bloque.total - items.length;

  return (
    <div className={`bg-white rounded-2xl border border-gray-100 border-l-4 ${t.borde} p-5 flex flex-col`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-gray-800">{def.titulo}</h3>
          <p className="text-xs text-gray-500 mt-1 leading-relaxed">{def.explicacion}</p>
        </div>
        <span className={`text-3xl font-bold leading-none ${t.numero}`}>{bloque.total}</span>
      </div>

      <ul className="mt-4 divide-y divide-gray-50 flex-1">
        {items.map((it) => {
          const contenido = (
            <>
              <p className="text-sm font-medium text-gray-800 truncate">{it.principal}</p>
              {it.secundario && <div className="text-xs text-gray-500 mt-0.5">{it.secundario}</div>}
            </>
          );
          return (
            <li key={it.clave} className="py-2">
              {it.href ? (
                <Link href={it.href} className="block rounded-lg -mx-2 px-2 py-0.5 hover:bg-gray-50 transition" title="Abrir su ficha">
                  {contenido}
                </Link>
              ) : (
                contenido
              )}
            </li>
          );
        })}
      </ul>

      <div className="mt-3 pt-3 border-t border-gray-50 flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs text-gray-400">
          {restantes > 0 ? `y ${restantes} más` : ""}
          {restantes > 0 && extra ? " · " : ""}
          {extra}
        </span>
        <div className="flex flex-wrap items-center gap-2 ml-auto">
          {def.correo && (
            <Boton tamano="sm" onClick={() => setEscribiendo(true)} icono={ICONO_SOBRE}>
              {bloque.total === 1 ? "Escribirle" : `Escribirles (${bloque.total})`}
            </Boton>
          )}
          <BotonEnlace href={def.accion.href}>{def.accion.label} →</BotonEnlace>
        </div>
      </div>
      {escribiendo && def.correo && (
        <EscribirCorreo
          destino={{ tipo: "grupo", grupo: def.correo, etiqueta: def.titulo, total: bloque.total }}
          plantilla={PLANTILLAS[def.correo]}
          onCerrar={() => setEscribiendo(false)}
        />
      )}
    </div>
  );
}

export function PendientesDeHoy() {
  const { datos, error, cargando, recargar } = usePendientes();

  const cabecera = (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-4">
      <div>
        <h2 className="text-lg font-bold text-gray-800">Pendientes de hoy</h2>
        <p className="text-xs text-gray-400 mt-0.5">
          {datos ? `Actualizado ${hace(datos.generadoEn)}` : "Lo que necesita tu atención"}
        </p>
      </div>
      <Boton variante="secundario" tamano="sm" onClick={recargar} cargando={cargando}>
        Actualizar
      </Boton>
    </div>
  );

  if (!datos) {
    return (
      <section className="mb-8">
        {cabecera}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 text-sm text-gray-500 flex items-center gap-3">
          {error ? (
            <>No se pudieron cargar los pendientes ({error}). Las métricas de abajo siguen disponibles.</>
          ) : (
            <><Spinner /> Revisando pagos, horarios, accesos y leads…</>
          )}
        </div>
      </section>
    );
  }

  const conAlgo = DEFINICIONES.filter((d) => { const b = datos[d.clave]; return !b.ok || b.total > 0; });
  const alDia = DEFINICIONES.filter((d) => { const b = datos[d.clave]; return b.ok && b.total === 0; });

  return (
    <section className="mb-8">
      {cabecera}
      {error && (
        <p className="text-xs text-amber-700 mb-3">La última actualización falló ({error}); se muestran los datos anteriores.</p>
      )}
      {conAlgo.length === 0 ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-sm text-emerald-800">
          <p className="font-semibold">Todo al día</p>
          <p className="mt-0.5 text-emerald-700">No hay pagos fallidos, grupos en riesgo, accesos sin enviar ni leads nuevos por atender.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {conAlgo.map((d) => <TarjetaPendiente key={d.clave} def={d} datos={datos} />)}
        </div>
      )}
      {conAlgo.length > 0 && alDia.length > 0 && (
        <p className="text-xs text-gray-400 mt-4 flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="font-semibold text-emerald-600">Al día:</span>
          {alDia.map((d) => (
            <span key={d.clave} className="inline-flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              {d.titulo}
            </span>
          ))}
        </p>
      )}
    </section>
  );
}
