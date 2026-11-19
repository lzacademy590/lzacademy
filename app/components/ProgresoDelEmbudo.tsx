/**
 * La barra de los TRES pasos del embudo (rediseño «sitio simple», 2026-11-18):
 *
 *   1 · Sobre ti      /paso-uno    nivel + qué se te dificulta (antes /paso-uno y /paso-dos)
 *   2 · Tu plan       /paso-tres   los planes, con lo que incluye cada uno (antes también las landings)
 *   3 · Inscripción   /paso-cuatro datos, fecha, horario y pago
 *
 * ⚠️ Las RUTAS no cambiaron de nombre aunque el número del paso sí: /paso-tres es
 * el paso 2. Renombrarlas obligaría a tocar `proxy.ts`, los enlaces de los correos
 * y los anuncios, y no aporta nada al comprador, que nunca lee la URL.
 */
const PASOS = ["Sobre ti", "Tu plan", "Inscripción"];

export default function ProgresoDelEmbudo({
  paso,
  className = "",
}: {
  paso: 1 | 2 | 3;
  className?: string;
}) {
  return (
    <div className={`w-full max-w-[360px] ${className}`} aria-label={`Paso ${paso} de 3`}>
      <ol className="grid grid-cols-3 gap-2">
        {PASOS.map((nombre, i) => {
          const n = i + 1;
          const hecho = n <= paso;
          return (
            <li key={nombre} className="flex flex-col gap-1.5" aria-current={n === paso ? "step" : undefined}>
              <span className={`h-1.5 w-full rounded-full ${hecho ? "bg-lz-grape" : "bg-lz-bd"}`} />
              <span className={`text-[12px] font-bold leading-tight ${n === paso ? "text-lz-grape" : "text-lz-ink3"}`}>
                {n}. {nombre}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
