import { useState } from "react";

interface CopyButtonProps {
  text: string;
  children?: string;
  className?: string;
  successLabel?: string;
}

export function CopyButton({
  text,
  children = "Copiar",
  className = "secundario",
  successLabel = "Copiado"
}: CopyButtonProps) {
  const [label, setLabel] = useState(children);

  async function copyText() {
    try {
      await navigator.clipboard.writeText(text);
      setLabel(successLabel);
    } catch {
      setLabel("No se pudo copiar");
    } finally {
      window.setTimeout(() => setLabel(children), 1600);
    }
  }

  return (
    <button type="button" className={className} onClick={copyText}>
      {label}
    </button>
  );
}
