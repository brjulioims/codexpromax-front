export default function Tooltip({
  title = "Información",
  items = [],
  iconSize = 16,
}) {
  return (
    <div className="relative inline-block">
      <button
        type="button"
        className="group peer relative z-10 inline-flex p-1 text-white transition hover:text-[#0e183f]"
        aria-label={title}
      >
        <svg
          className="transition duration-300 group-hover:scale-110 text-white"
          height={iconSize}
          width={iconSize}
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
          fill="currentColor"
        >
          <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 22c-5.518 0-10-4.482-10-10s4.482-10 10-10 10 4.482 10 10-4.482 10-10 10zm-1-16h2v6h-2zm0 8h2v2h-2z" />
        </svg>
      </button>

      <div className="pointer-events-none absolute left-1/2 top-full z-50 mt-2 w-64 -translate-x-1/2 rounded-lg bg-slate-700 p-3 text-left text-[11px] text-white opacity-0 shadow-lg transition peer-hover:mt-3 peer-hover:opacity-100">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-slate-100">
          {title}
        </p>
        <div className="space-y-1">
          {items.map((item) => (
            <p key={item} className="leading-4">
              {item}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
