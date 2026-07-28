import { CirclePlus } from "lucide-react";

export default function Agregar({
  children,
  label = "Agregar",
  Icon = CirclePlus,
  className = "",
  type = "button",
  ...props
}) {
  return (
    <button
      type={type}
      className={`inline-flex w-full items-center justify-center gap-2 rounded-lg border border-orange-500 bg-white px-4 py-2 text-sm font-semibold text-orange-600 transition hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto ${className}`}
      {...props}
    >
      {Icon ? <Icon size={18} /> : null}
      {children ?? label}
    </button>
  );
}
