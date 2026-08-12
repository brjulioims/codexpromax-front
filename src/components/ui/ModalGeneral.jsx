import { useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

/**
 * ModalGeneral
 * Clase padre reusable PARA TODOS los modales del proyecto.
 *
 * Props:
 *  - open: boolean                         -> si se muestra o no
 *  - onClose: () => void                   -> callback al cerrar (backdrop, Escape, boton X)
 *  - title?: string | ReactNode            -> titulo principal (solo string o nodo dentro wrapper default)
 *  - subtitle?: string | ReactNode         -> subtitulo debajo del titulo
 *  - headerIcon?: ReactNode                -> nodo icono a la izquierda del titulo (ej: <Languages />, <Filter />, etc.)
 *  - headerAccent?: string                 -> color hex para el fondo del headerIcon (default #0d1b5e)
 *  - header?: ReactNode                    -> reemplaza TODO el header completo (ignora title/subtitle/icon si se pasa)
 *  - bodyClassName?: string                -> className extra para el contenedor del cuerpo
 *  - headerClassName?: string              -> className extra para el header
 *  - footerClassName?: string              -> className extra para el footer
 *  - footer?: ReactNode                    -> slot footer (normalmente botones)
 *  - children: ReactNode                   -> contenido del cuerpo
 *  - size?: "sm" | "md" | "lg" | "xl" | "2xl"
 *  - showClose?: boolean                   -> mostrar boton X en esquina superior derecha
 *  - closeOnBackdrop?: boolean             -> cerrar al hacer click fuera del modal (default true)
 *  - closeOnEscape?: boolean               -> cerrar al presionar Escape (default true)
 *  - lockScroll?: boolean                  -> bloquear body scroll mientras abre (default true)
 *  - zIndex?: number | string              -> z-index del portal (default 70)
 *  - role?: string                         -> a11y (default "dialog")
 *  - ariaLabel?: string                    -> a11y (default title si es string)
 *  - maxBodyHeightClass?: string           -> alt max body (default "max-h-[70vh]")
 */
export default function ModalGeneral({
  open = false,
  onClose,
  title,
  subtitle,
  headerIcon,
  headerAccent = "#0d1b5e",
  header,
  bodyClassName,
  headerClassName,
  footerClassName,
  footer,
  children,
  size = "md",
  showClose = true,
  closeOnBackdrop = true,
  closeOnEscape = true,
  lockScroll = true,
  zIndex = 70,
  role = "dialog",
  ariaLabel,
  maxBodyHeightClass = "max-h-[70vh]",
}) {
  const maxWidthClass = useMemo(() => {
    switch (size) {
      case "sm":
        return "max-w-md";
      case "lg":
        return "max-w-2xl";
      case "xl":
        return "max-w-4xl";
      case "2xl":
        return "max-w-7xl";
      case "md":
      default:
        return "max-w-lg";
    }
  }, [size]);

  // Bloqueo de scroll en el <body>
  useEffect(() => {
    if (!open || !lockScroll) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open, lockScroll]);

  // Cerrar con Escape
  useEffect(() => {
    if (!open || !closeOnEscape) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, closeOnEscape, onClose]);

  if (!open) return null;

  const tieneHeaderVisible = Boolean(
    header || title || subtitle || showClose || headerIcon
  );

  return createPortal(
    <div
      className={`fixed inset-0 z-[${String(zIndex)}] flex items-center justify-center p-4 sm:p-6`}
    >
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={() => (closeOnBackdrop ? onClose?.() : undefined)}
      />

      <div
        role={role}
        aria-modal="true"
        aria-label={ariaLabel ?? (typeof title === "string" ? title : undefined)}
        className={`relative z-10 flex w-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl transition animate-in fade-in zoom-in duration-200 dark:border-slate-800 dark:bg-slate-900 ${maxWidthClass}`}
      >
        {tieneHeaderVisible ? (
          header ? (
            <header
              className={`flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 dark:border-slate-800 sm:px-6 sm:py-5 ${headerClassName ?? ""}`}
            >
              {header}
              {showClose ? (
                <button
                  type="button"
                  onClick={() => onClose?.()}
                  className="group -mr-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-50 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-600 dark:bg-slate-800 dark:text-slate-500 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                  aria-label="Cerrar modal"
                >
                  <X size={18} className="transition-transform group-active:scale-90" />
                </button>
              ) : null}
            </header>
          ) : (
            <header
              className={`flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 dark:border-slate-800 sm:px-6 sm:py-5 ${headerClassName ?? ""}`}
            >
              <div className="min-w-0 flex-1">
                {title || subtitle || headerIcon ? (
                  <div className="flex min-w-0 items-start gap-3">
                    {headerIcon ? (
                      <div
                        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-sm dark:text-slate-100"
                        style={{ backgroundColor: headerAccent }}
                      >
                        {headerIcon}
                      </div>
                    ) : null}
                    <div className="min-w-0 flex-1">
                      {title ? (
                        <h2 className="truncate text-[15px] font-semibold tracking-tight text-slate-900 sm:text-[16px] dark:text-white">
                          {title}
                        </h2>
                      ) : null}
                      {subtitle ? (
                        <div className="mt-1 text-[11px] leading-5 text-slate-500 dark:text-slate-400">
                          {subtitle}
                        </div>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </div>

              {showClose ? (
                <button
                  type="button"
                  onClick={() => onClose?.()}
                  className="group -mr-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-50 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-600 dark:bg-slate-800 dark:text-slate-500 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                  aria-label="Cerrar modal"
                >
                  <X size={18} className="transition-transform group-active:scale-90" />
                </button>
              ) : null}
            </header>
          )
        ) : null}

        <div
          className={`overflow-y-auto px-5 py-5 text-slate-600 dark:text-slate-300 sm:px-6 ${maxBodyHeightClass} ${bodyClassName ?? ""}`}
        >
          {children}
        </div>

        {footer ? (
          <footer
            className={`flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/60 px-5 py-4 dark:border-slate-800 dark:bg-slate-950/60 sm:px-6 ${footerClassName ?? ""}`}
          >
            {footer}
          </footer>
        ) : null}
      </div>
    </div>,
    document.body
  );
}
