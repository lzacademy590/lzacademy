"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useRouter } from "next/navigation";
import { ErrorState } from "../_utils/ErrorState";
import { Pagina, EncabezadoDePagina, Tarjeta, Cargando, Boton, useToast } from "../_ui";

interface ContentConfig {
    email_no_response_title: string;
    success_contact_message: string;
}

const DEFAULTS: ContentConfig = {
    email_no_response_title: "¿No recibes respuesta en tres dias?",
    success_contact_message: "En las próximas 24 horas nuestro equipo te contactará con todos los detalles.",
};

const CAMPO =
    "w-full p-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-falu-red-200 focus:border-falu-red-300 bg-gray-50";

export default function ContenidoPage() {
    const [content, setContent] = useState<ContentConfig>(DEFAULTS);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const router = useRouter();
    const toast = useToast();

    const load = useCallback(async () => {
        setLoadError(null);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) { router.push("/admin/login"); return; }

            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/config/content`);
            if (!res.ok) throw new Error(`Error del servidor (${res.status})`);
            setContent(await res.json());
        } catch (e) {
            setLoadError(e instanceof Error ? e.message : "Error de red");
        } finally {
            setLoading(false);
        }
    }, [router]);

    useEffect(() => { load(); }, [load]);

    async function handleSave() {
        setSaving(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) { router.push("/admin/login"); return; }

            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/config/content`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${session.access_token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ content }),
            });

            if (res.ok) toast.exito("Cambios guardados correctamente.");
            else toast.error("Error guardando los cambios. Intenta de nuevo.");
        } catch {
            toast.error("No se pudo conectar con el servidor. Los cambios NO se guardaron.");
        } finally {
            setSaving(false);
        }
    }

    if (loadError) return <ErrorState message={loadError} onRetry={load} />;
    if (loading) return <Cargando />;

    return (
        <Pagina ancho="estrecho">
            <EncabezadoDePagina
                titulo="Contenido editable"
                descripcion="Edita los textos que aparecen en el correo de confirmación y en la página de pago exitoso."
            />

            <div className="flex flex-col gap-5">
                {/* Email: aviso sin respuesta */}
                <Tarjeta
                    titulo="Aviso en el correo de confirmación"
                    descripcion="Aparece en el correo que recibe el usuario al pagar, en el bloque naranja de contacto."
                >
                    <label className="text-xs text-gray-400 font-medium block mb-1">Título del aviso</label>
                    <input
                        type="text"
                        value={content.email_no_response_title}
                        onChange={(e) => setContent({ ...content, email_no_response_title: e.target.value })}
                        className={CAMPO}
                        placeholder="¿No recibes respuesta en tres dias?"
                    />
                    <div className="mt-2.5 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl">
                        <p className="text-xs text-amber-700">
                            <strong>Vista previa:</strong> {content.email_no_response_title}
                        </p>
                    </div>
                </Tarjeta>

                {/* Success page: mensaje de contacto */}
                <Tarjeta
                    titulo="Mensaje en la página de pago exitoso"
                    descripcion={<>Aparece debajo de &quot;¡Tu inscripción quedó registrada!&quot; en la página <strong>/success</strong>.</>}
                >
                    <label className="text-xs text-gray-400 font-medium block mb-1">Mensaje de contacto</label>
                    <textarea
                        value={content.success_contact_message}
                        onChange={(e) => setContent({ ...content, success_contact_message: e.target.value })}
                        rows={3}
                        className={`${CAMPO} resize-none`}
                        placeholder="En las próximas 24 horas nuestro equipo te contactará con todos los detalles."
                    />
                    <div className="mt-2.5 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl">
                        <p className="text-xs text-amber-700">
                            <strong>Vista previa:</strong> {content.success_contact_message}
                        </p>
                    </div>
                </Tarjeta>
            </div>

            <div className="mt-5 flex justify-end">
                <Boton onClick={handleSave} cargando={saving}>
                    {saving ? "Guardando…" : "Guardar cambios"}
                </Boton>
            </div>
        </Pagina>
    );
}
