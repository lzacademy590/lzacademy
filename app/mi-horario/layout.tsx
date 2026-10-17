import type { Metadata } from "next";

// La URL lleva el enlace personal del alumno: no se indexa ni se sigue.
export const metadata: Metadata = {
  title: "Mi horario de clase",
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
