/*
  Las horas de los horarios de grupo vistas desde el dispositivo del comprador.

  Los horarios se guardan en hora del Pacífico (PT), que es la de las cohortes, y
  se pintan en la zona de quien mira. Lo usan el formulario de pago (Form.tsx) y
  la página /mi-horario: con dos copias acabarían enseñando horas distintas para
  el mismo horario — justo lo que esta página existe para evitar.
*/

// "2026-10-30" -> "30 de octubre"
export function fechaLarga(iso?: string | null): string {
    if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return "";
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("es-ES", { day: "numeric", month: "long", timeZone: "UTC" });
}

// "2026-10-30T07:00" en hora del Pacífico -> el instante real.
export function ptStringToDate(datetimePt: string): Date {
    const [datePart, timePart] = datetimePt.split("T");
    const [y, mo, d] = datePart.split("-").map(Number);
    const [h, m, s = 0] = timePart.split(":").map(Number);
    const probe = new Date(Date.UTC(y, mo - 1, d, h, m, s));
    const fmt = new Intl.DateTimeFormat("en-US", {
        timeZone: "America/Los_Angeles",
        year: "numeric", month: "numeric", day: "numeric",
        hour: "2-digit", minute: "2-digit", second: "2-digit",
        hour12: false,
    }).formatToParts(probe);
    const g = (t: string) => parseInt(fmt.find(p => p.type === t)!.value);
    const ptProbe = Date.UTC(g("year"), g("month") - 1, g("day"), g("hour") % 24, g("minute"), g("second"));
    return new Date(probe.getTime() + (probe.getTime() - ptProbe));
}

/*
  ⚠️ Dos trampas que la primera versión no avisaba (auditorías de QA y UX):
   · DÍA: 20:00 PT del lunes son las 05:00 del MARTES en Madrid, y la cabecera
     dice "lunes a jueves". Se compara la fecha local con la del cohorte.
   · VERANO: PT cambia de hora en marzo y noviembre y casi toda Latinoamérica
     no. Se calcula la hora del primer día y la del último (28 días después):
     si difieren, la clase "se mueve" a mitad del ciclo y se dice.
*/
export function infoDeLaHora(startDate: string, horaPt: string) {
    const zona = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const fmtHora = new Intl.DateTimeFormat("es-ES", { timeZone: zona, hour: "numeric", minute: "2-digit", hour12: true });
    const fmtFecha = new Intl.DateTimeFormat("en-CA", { timeZone: zona, year: "numeric", month: "2-digit", day: "2-digit" });
    const inicio = ptStringToDate(`${startDate}T${horaPt}`);
    const [y, m, d] = startDate.split("-").map(Number);
    const finStr = new Date(Date.UTC(y, m - 1, d + 27)).toISOString().slice(0, 10);
    const fin = ptStringToDate(`${finStr}T${horaPt}`);
    const hora = fmtHora.format(inicio).replace(/\s/g, " ");
    const horaFin = fmtHora.format(fin).replace(/\s/g, " ");
    const fechaLocal = fmtFecha.format(inicio);
    return {
        hora,
        horaTrasCambio: horaFin !== hora ? horaFin : null,
        desfaseDia: fechaLocal === startDate ? 0 : fechaLocal > startDate ? 1 : -1,
    };
}

// "America/Guatemala" -> "Guatemala": "CST" o "GMT-5" no le dicen nada a nadie.
export function nombreDeLaZona(): string {
    try {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
        return tz.split("/").pop()?.replace(/_/g, " ") ?? "";
    } catch {
        return "";
    }
}
