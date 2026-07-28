import { useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { Filter, X } from "lucide-react";

export default function ModalFiltro({
  open = false,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = "md",
  showClose = true,
}) {
  const maxWidthClass = useMemo(() => {
    switch (size) {
      case "sm": return "max-w-md";
      case "lg": return "max-w-2xl";
      case "xl": return "max-w-4xl";
      case "2xl": return "max-w-7xl";
      case "md":
      default: return "max-w-lg";
    }
  }, [size]);

  // Bloqueo de scroll
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, [open]);

  // Cerrar con Escape
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-6">
      {/* Overlay con desenfoque (Backdrop) */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={() => onClose?.()}
      />

      {/* Contenedor del Modal */}
      <div
        role="dialog"
        aria-modal="true"
        className={`relative z-10 w-full ${maxWidthClass} flex flex-col overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl animate-in fade-in zoom-in duration-200`}
      >
        {/* Header - Ahora más limpio y sin el fondo azul */}
        {(title || subtitle || showClose) && (
          <header className="flex items-start justify-between gap-4 border-b border-slate-100 dark:border-slate-800 px-8 py-6">
            <div className="min-w-0">
              {title && (
                <div className="flex items-center gap-3">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#0e183f] dark:bg-slate-800 text-white shadow-sm">
                    <Filter size={18} />
                  </div>
                  <h2 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white uppercase">
                    {title}
                  </h2>
                </div>
              )}
              {subtitle && (
                <div className="mt-1 text-sm text-slate-500 dark:text-slate-400 uppercase">
                  {subtitle}
                </div>
              )}
            </div>

            {showClose && (
              <button
                type="button"
                onClick={() => onClose?.()}
                className="group -mr-2 flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 transition-all hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={20} className="transition-transform group-active:scale-90" />
              </button>
            )}
          </header>
        )}

        {/* Cuerpo - Scrollable si el contenido es largo */}
        <div className="max-h-[70vh] overflow-y-auto px-8 py-6 text-slate-600 dark:text-slate-300 uppercase">
          {children}
        </div>

        {/* Footer - Con un diseño más integrado */}
        {footer && (
          <footer className="flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 px-8 py-5 uppercase">
            {footer}
          </footer>
        )}
      </div>
    </div>,
    document.body
  );
}
