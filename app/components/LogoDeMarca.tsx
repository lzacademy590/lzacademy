"use client";

import { useState } from "react";
import { useMarca, LOGO_DE_FABRICA, LOGO_OSCURO_DE_FABRICA } from "@/app/hooks/useMarca";

/*
  El logo del sitio, el que se suba en Admin › Marca o el de fábrica.

  `variante`: "claro" va sobre fondo blanco (la barra), "oscuro" sobre el violeta
  del pie.

  ⚠️ <img> y no next/image: la URL viene de Supabase Storage y con next/image
  habría que declarar ese dominio en `next.config.ts` por cada entorno.

  ⚠️ Si la imagen subida no carga (archivo borrado, bucket migrado, red), se
  vuelve al logo de fábrica: una barra con una imagen rota es peor que el logo
  de siempre (ronda de agentes, 2026-11-18).
*/
export default function LogoDeMarca({
  variante = "claro",
  className = "",
}: {
  variante?: "claro" | "oscuro";
  className?: string;
}) {
  const marca = useMarca();
  const fabrica = variante === "oscuro" ? LOGO_OSCURO_DE_FABRICA : LOGO_DE_FABRICA;
  const pedido = variante === "oscuro" ? marca.logoOscuro : marca.logo;
  const [rota, setRota] = useState<string | null>(null);
  const src = rota === pedido ? fabrica : pedido;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt="Lainz 590"
      className={`block w-auto object-contain ${className}`}
      decoding="async"
      onError={() => {
        if (src !== fabrica) setRota(pedido);
      }}
    />
  );
}
