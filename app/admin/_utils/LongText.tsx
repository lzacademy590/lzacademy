"use client";

// Botón compacto que muestra un preview truncado del texto y al click invoca
// onOpen({title, text}) para que el padre abra su modal. Usado por interes y marketing.
export function LongText({
  title,
  value,
  onOpen,
  maxChars = 40,
}: {
  title: string;
  value: string | null;
  onOpen: (data: { title: string; text: string }) => void;
  maxChars?: number;
}) {
  if (!value) return <span className="text-gray-300 text-xs">—</span>;
  const preview = value.length > maxChars ? value.slice(0, maxChars) + "…" : value;
  return (
    <button
      className="text-xs text-left text-gray-600 hover:text-falu-red-700 hover:underline transition max-w-[160px] truncate block"
      onClick={() => onOpen({ title, text: value })}
      title="Ver completo"
    >
      {preview}
    </button>
  );
}
