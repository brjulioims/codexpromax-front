import { Filter } from "lucide-react";

export default function Filtro({
  onClick,
  children = "Filtro",
  variant = "solid",
  className = "",
  type = "button",
}) {
  const variants = {
    solid:
      "border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-[#0e183f] dark:text-slate-100 shadow-sm hover:-translate-y-0.5 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 hover:shadow-md",
    outline:
      "bg-[#0e183f] text-white shadow-sm hover:-translate-y-0.5 hover:bg-[#16245e] hover:shadow-md",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      className={`inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200 sm:w-auto ${variants[variant]} ${className}`}
    >
      <Filter size={16} />
      {children}
    </button>
  );
}
