import { SquarePen } from "lucide-react";

export default function Editar({
  onClick,
  className = "",
  type = "button",
  title = "Editar",
  children,
  Icon = SquarePen,
  "aria-label": ariaLabel,
  ...props
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      title={title}
      aria-label={ariaLabel ?? title}
      className={`inline-flex h-9 w-9 items-center justify-center gap-2 rounded-lg border border-slate-200 text-slate-700 transition hover:bg-slate-50 ${className}`}
      {...props}
    >
      {Icon ? <Icon size={18} /> : null}
      {children}
    </button>
  );
}
