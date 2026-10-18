/**
 * La barra de los cuatro pasos del embudo (`/paso-uno` … `/paso-cuatro`).
 *
 * Sustituye al rótulo suelto "Paso N de 4": con la barra se ve de un vistazo
 * cuánto falta, que es lo que decide si alguien sigue o se va.
 *
 * `tono` existe porque `/paso-tres` va sobre fondo rojo oscuro y los otros tres
 * sobre rosa claro.
 */
const PASOS = ["Tu nivel", "Tu objetivo", "Tu plan", "Inscripción"];

export default function ProgresoDelEmbudo({
  paso,
  tono = "claro",
}: {
  paso: 1 | 2 | 3 | 4;
  tono?: "claro" | "oscuro";
}) {
  const oscuro = tono === "oscuro";
  const lleno = oscuro ? "#ffffff" : "#C0353E";
  const vacio = oscuro ? "rgba(255,255,255,0.25)" : "#f0c8cc";
  const texto = oscuro ? "rgba(255,255,255,0.75)" : "#C0353E";
  const apagado = oscuro ? "rgba(255,255,255,0.45)" : "#a1a1aa";

  return (
    <div className="mx-auto mb-3 w-full max-w-[420px]" aria-label={`Paso ${paso} de 4`}>
      <p className="mb-2 text-center text-xs font-bold uppercase tracking-widest" style={{ color: texto }}>
        Paso {paso} de 4
      </p>
      <ol className="grid grid-cols-4 gap-1.5">
        {PASOS.map((nombre, i) => {
          const n = i + 1;
          const hecho = n <= paso;
          return (
            <li key={nombre} className="flex flex-col gap-1" aria-current={n === paso ? "step" : undefined}>
              <span
                className="h-1.5 w-full rounded-full"
                style={{ backgroundColor: hecho ? lleno : vacio }}
              />
              <span
                className="text-[10px] font-semibold leading-tight sm:text-[11px]"
                style={{ color: n === paso ? texto : apagado }}
              >
                {nombre}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
