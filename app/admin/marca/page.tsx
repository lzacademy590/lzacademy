"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";
import { ErrorState } from "../_utils/ErrorState";
import { Pagina, EncabezadoDePagina, Tarjeta, Cargando, Boton, Aviso, useToast, useConfirmar } from "../_ui";
import { LOGO_DE_FABRICA, LOGO_OSCURO_DE_FABRICA, olvidarMarca } from "@/app/hooks/useMarca";

/*
  Admin › Marca (2026-11-18): cambiar el logo del website sin tocar código.

  Dos logos porque el sitio los pinta sobre dos fondos: la barra (blanca) y el pie
  (violeta oscuro). La vista previa enseña cada uno SOBRE su fondo real, que es
  donde se nota si un logo oscuro desaparece sobre el violeta.

  ⚠️ El cambio se ve en el sitio en hasta 1 minuto (caché del GET público) y,
  en una pestaña ya abierta, al recargar.
*/

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL;
const MAX_BYTES = 1024 * 1024;
const FORMATOS = ["image/png", "image/jpeg", "image/webp"];

type Tipo = "logo" | "logoOscuro";
type Marca = Record<Tipo, string | null>;

const FICHAS: { tipo: Tipo; titulo: string; descripcion: string; fondo: string; fabrica: string }[] = [
  {
    tipo: "logo",
    titulo: "Logo sobre fondo claro",
    descripcion: "El de la barra superior de todas las páginas. Usa la versión a color.",
    fondo: "#ffffff",
    fabrica: LOGO_DE_FABRICA,
  },
  {
    tipo: "logoOscuro",
    titulo: "Logo sobre fondo oscuro",
    descripcion: "El del pie de página, sobre violeta. Usa la versión en blanco o clara.",
    fondo: "#5e108b",
    fabrica: LOGO_OSCURO_DE_FABRICA,
  },
];

function leerComoDataUrl(archivo: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(archivo);
  });
}

async function token(router: ReturnType<typeof useRouter>): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    router.push("/admin/login");
    return null;
  }
  return session.access_token;
}

function FichaDeLogo({
  ficha,
  actual,
  onCambio,
}: {
  ficha: (typeof FICHAS)[number];
  actual: string | null;
  onCambio: (m: Marca) => void;
}) {
  const router = useRouter();
  const toast = useToast();
  const confirmar = useConfirmar();
  const entrada = useRef<HTMLInputElement>(null);
  const [borrador, setBorrador] = useState<{ dataUrl: string; nombre: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const enUso = actual ?? ficha.fabrica;
  const vista = borrador?.dataUrl ?? enUso;

  async function elegir(e: React.ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    e.target.value = "";
    setError(null);
    if (!archivo) return;
    if (!FORMATOS.includes(archivo.type)) {
      setError("El logo tiene que ser PNG, JPG o WebP.");
      return;
    }
    if (archivo.size > MAX_BYTES) {
      setError(`Pesa ${(archivo.size / 1024 / 1024).toFixed(1)} MB. El máximo es 1 MB.`);
      return;
    }
    setBorrador({ dataUrl: await leerComoDataUrl(archivo), nombre: archivo.name });
  }

  async function guardar() {
    if (!borrador) return;
    setGuardando(true);
    try {
      const t = await token(router);
      if (!t) return;
      const res = await fetch(`${BACKEND}/config/marca/${ficha.tipo}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${t}`, "Content-Type": "application/json" },
        body: JSON.stringify({ imagen: borrador.dataUrl }),
      });
      const cuerpo = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(cuerpo?.error ?? `No se pudo guardar el logo (${res.status}). No se cambió nada.`);
        return;
      }
      olvidarMarca();
      onCambio(cuerpo as Marca);
      setBorrador(null);
      toast.exito("Logo publicado. En el sitio se ve en 1 minuto, o al recargar.");
    } catch {
      toast.error("No se pudo conectar con el servidor. El logo NO se cambió.");
    } finally {
      setGuardando(false);
    }
  }

  async function restaurar() {
    const si = await confirmar({
      titulo: "¿Volver al logo de fábrica?",
      mensaje: "El sitio dejará de usar el logo que subiste y volverá al original de Lainz 590.",
      confirmar: "Sí, restaurar",
    });
    if (!si) return;
    setGuardando(true);
    try {
      const t = await token(router);
      if (!t) return;
      const res = await fetch(`${BACKEND}/config/marca/${ficha.tipo}/restaurar`, {
        method: "POST",
        headers: { Authorization: `Bearer ${t}` },
      });
      const cuerpo = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(cuerpo?.error ?? `No se pudo restaurar (${res.status}).`);
        return;
      }
      olvidarMarca();
      onCambio(cuerpo as Marca);
      toast.exito("Listo: el sitio vuelve a usar el logo de fábrica.");
    } catch {
      toast.error("No se pudo conectar con el servidor. No se cambió nada.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Tarjeta titulo={ficha.titulo} descripcion={ficha.descripcion} plegable={false}>
      <div
        className="flex h-32 items-center justify-center rounded-xl border border-gray-200 p-4"
        style={{ backgroundColor: ficha.fondo }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={vista}
          alt={`Vista previa: ${ficha.titulo.toLowerCase()}`}
          className="max-h-full max-w-[260px] object-contain"
          onError={() => {
            // Un archivo renombrado a .png que no es imagen: no se deja publicar.
            if (borrador) {
              setBorrador(null);
              setError("Ese archivo no se puede abrir como imagen. Elige un PNG, JPG o WebP.");
            }
          }}
        />
      </div>
      <p className="mt-2 text-xs text-gray-500">
        {borrador
          ? <>Vista previa de <strong>{borrador.nombre}</strong>. Aún no está publicado.</>
          : actual
            ? "En uso: el logo que subiste."
            : "En uso: el logo de fábrica."}
      </p>
      {error && <p className="mt-2 text-sm font-medium text-red-700" role="alert">{error}</p>}

      <input
        ref={entrada}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={elegir}
        className="sr-only"
        aria-label={`Elegir archivo para el ${ficha.titulo.toLowerCase()}`}
      />
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {borrador ? (
          <>
            <Boton onClick={guardar} cargando={guardando}>Publicar este logo</Boton>
            <Boton variante="secundario" onClick={() => setBorrador(null)} disabled={guardando}>Descartar</Boton>
          </>
        ) : (
          <Boton variante="secundario" onClick={() => entrada.current?.click()} disabled={guardando}>
            {actual ? "Cambiar el logo" : "Subir un logo"}
          </Boton>
        )}
        {actual && !borrador && (
          <Boton variante="fantasma" onClick={restaurar} disabled={guardando}>Restaurar el de fábrica</Boton>
        )}
      </div>
    </Tarjeta>
  );
}

export default function MarcaPage() {
  const router = useRouter();
  const [marca, setMarca] = useState<Marca | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setLoadError(null);
    try {
      const t = await token(router);
      if (!t) return;
      const res = await fetch(`${BACKEND}/config/marca/all`, { headers: { Authorization: `Bearer ${t}` } });
      if (!res.ok) throw new Error(`Error del servidor (${res.status})`);
      setMarca(await res.json());
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Error de red");
    }
  }, [router]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  if (loadError) return <ErrorState message={loadError} onRetry={cargar} />;
  if (!marca) return <Cargando />;

  return (
    <Pagina ancho="estrecho">
      <EncabezadoDePagina
        titulo="Marca"
        descripcion="El logo que se ve en la barra superior y en el pie de página del sitio."
      />
      <div className="flex flex-col gap-5">
        <Aviso tono="azul">
          Sube un PNG con fondo transparente, horizontal y de al menos 600 px de ancho (máximo 1 MB). Antes de publicarlo
          verás cómo queda sobre su fondo.
        </Aviso>
        {FICHAS.map((f) => (
          <FichaDeLogo key={f.tipo} ficha={f} actual={marca[f.tipo]} onCambio={setMarca} />
        ))}
      </div>
    </Pagina>
  );
}
