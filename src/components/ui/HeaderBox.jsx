export default function HeaderBox({
  title,
  subtitle,
  Icon,
  action,
  layout = "default",
  panel,
  banner,
  badge,
}) {
  if (layout === "highlight") {
    return (
      <div className="-mt-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 py-8 shadow-sm md:px-10 transition-colors duration-300">
        {badge ? (
          <div className="flex justify-center">
            <div className="inline-flex rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-1 text-[11px] font-bold uppercase tracking-[0.28em] text-[#0e183f] dark:text-sky-300 shadow-sm">
              {badge}
            </div>
          </div>
        ) : null}

        <h2 className="mt-4 text-center text-3xl font-black uppercase tracking-tight text-[#0e183f] dark:text-white md:text-5xl">
          {title}
        </h2>

        {subtitle ? (
          <p className="mx-auto mt-4 max-w-4xl text-center text-sm leading-7 text-slate-500 dark:text-slate-400 md:text-base">
            {subtitle}
          </p>
        ) : null}

        {panel ? <div className="mt-7 flex justify-center">{panel}</div> : null}
        {action ? <div className="mt-6 flex justify-center">{action}</div> : null}

        {banner ? (
          <div className="mt-7 rounded-2xl border border-sky-200 dark:border-sky-900/50 bg-sky-100/70 dark:bg-sky-950/30 px-6 py-4 text-center text-sm text-[#0e183f] dark:text-sky-200">
            {banner}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-5 py-4 shadow-[0_10px_30px_rgba(15,23,42,0.08)] transition-colors duration-300">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-orange-50 dark:bg-orange-950/30 p-2 text-orange-500">
            {Icon ? <Icon size={18} /> : null}
          </div>

          <div className="min-w-0">
            <h2 className="truncate text-2xl font-black uppercase tracking-[0.08em] text-[#0e183f] dark:text-white">
              {title}
            </h2>
            {subtitle ? (
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
            ) : null}
          </div>
        </div>

        {action ? <div className="flex flex-wrap items-center gap-3">{action}</div> : null}
      </div>
    </div>
  );
}
