import { useEffect, useRef, type ReactNode } from "react";

// Diálogo modal sobre <dialog> nativo: backdrop, Esc y foco incluidos.
export default function Modal({
  abierto,
  titulo,
  onCerrar,
  children,
}: {
  abierto: boolean;
  titulo: string;
  onCerrar: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (abierto && !d.open) d.showModal();
    if (!abierto && d.open) d.close();
  }, [abierto]);

  if (!abierto) return null;

  return (
    <dialog
      ref={ref}
      className="modal"
      aria-label={titulo}
      onClose={onCerrar}
      onClick={(e) => {
        // Solo cierra si el click cae fuera del rectángulo visible del diálogo.
        const r = ref.current?.getBoundingClientRect();
        if (r && (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom)) {
          onCerrar();
        }
      }}
    >
      <h3>{titulo}</h3>
      {children}
    </dialog>
  );
}
