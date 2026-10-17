import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Horarios de clase",
  description:
    "Horarios de las clases en vivo de LZ English Academy por nivel y fecha de inicio, en la hora de tu país.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
