"use client";

import { Suspense } from "react";
import MiHorario from "./MiHorario";

export default function MiHorarioPage() {
    return (
        <Suspense fallback={<div className="p-10 text-center text-zinc-500">Cargando…</div>}>
            <MiHorario />
        </Suspense>
    );
}
