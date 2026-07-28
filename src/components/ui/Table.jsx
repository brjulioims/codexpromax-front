import { useMemo, useState } from "react";
import Loading from "./Loading";

export default function Table({
  columns = [],
  data = [],
  loading = false,
  loadingLabel = "Cargando datos...",
  actions,
  variant = "card",
  theadClassName,
  density = "normal",
  tableClassName,
  paginate = true,
  initialPageSize = 15,
  pageSizeOptions = [15, 20, 25, 50],
}) {
  const cellClassName =
    density === "compact" ? "px-2 py-2 text-sm" : "px-4 py-3 text-sm";
  const headerCellClassName =
    density === "compact"
      ? "px-2 py-2 text-[12px] font-black uppercase tracking-[0.14em]"
      : "px-4 py-3 text-[12px] font-black uppercase tracking-[0.14em]";
  const getAlignClass = (align, col) => {
    if (align === "center") return "text-center";
    if (align === "right") return "text-right";

    const accessor = `${col?.accessor ?? ""}`.toLowerCase();
    const header = `${col?.header ?? ""}`.toLowerCase();
    const isNameColumn =
      accessor.includes("name") ||
      accessor.includes("nombre") ||
      accessor.includes("vendedor") ||
      header.includes("name") ||
      header.includes("nombre") ||
      header.includes("vendedor");

    return isNameColumn ? "text-left" : "text-left";
  };

  const resolvedPageSizeOptions = useMemo(() => {
    const options = Array.from(new Set([initialPageSize, ...pageSizeOptions]))
      .filter((n) => Number.isFinite(n) && n > 0)
      .sort((a, b) => a - b);
    return options.length ? options : [10, 25, 50];
  }, [initialPageSize, pageSizeOptions]);

  const initialResolvedPageSize = useMemo(() => {
    return resolvedPageSizeOptions.includes(initialPageSize)
      ? initialPageSize
      : resolvedPageSizeOptions[0];
  }, [initialPageSize, resolvedPageSizeOptions]);

  const [pageSize, setPageSize] = useState(initialResolvedPageSize);
  const [page, setPage] = useState(0);

  const resolvedPageSize = resolvedPageSizeOptions.includes(pageSize)
    ? pageSize
    : initialResolvedPageSize;

  const pageCount = useMemo(() => {
    if (!paginate) return 1;
    if (!data.length) return 1;
    return Math.ceil(data.length / resolvedPageSize);
  }, [data.length, resolvedPageSize, paginate]);

  const resolvedPage = paginate ? Math.min(page, pageCount - 1) : 0;
  const startIndex = paginate ? resolvedPage * resolvedPageSize : 0;
  const paginatedData = useMemo(() => {
    if (!paginate) return data;
    return data.slice(startIndex, startIndex + resolvedPageSize);
  }, [data, paginate, resolvedPageSize, startIndex]);

  const rangeLabel = useMemo(() => {
    if (!paginate) return null;
    if (!data.length) return "0 DE 0";
    const start = startIndex + 1;
    const end = Math.min(startIndex + resolvedPageSize, data.length);
    return `${start}–${end} DE ${data.length}`;
  }, [data.length, resolvedPageSize, paginate, startIndex]);

  const tableMarkup = (
    <div className="w-full">
      <div className="overflow-x-auto">
        <table className={tableClassName ?? "w-full text-sm"}>
          <thead
            className={
              theadClassName ??
              "bg-[linear-gradient(135deg,#0e183f_0%,#17305f_55%,#21497d_100%)] text-white"
            }
          >
            <tr className="border-b border-white/10">
              {columns.map((col) => (
                <th
                  key={col.accessor}
                  className={`${headerCellClassName} ${getAlignClass(col.align, col)} whitespace-nowrap`}
                >
                  {col.header}
                </th>
              ))}

              {actions ? (
                <th
                  className={`${headerCellClassName} text-center whitespace-nowrap`}
                >
                  ACCIONES
                </th>
              ) : null}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {loading ? (
              <tr>
                <td
                  colSpan={columns.length + (actions ? 1 : 0)}
                  className="py-6 text-center"
                >
                  <Loading label={loadingLabel} />
                </td>
              </tr>
            ) : data.length > 0 ? (
              paginatedData.map((row, index) => (
                <tr
                  key={row?.id ? row.id : `${startIndex}-${index}`}
                  className="transition hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-800 dark:text-slate-200"
                >
                  {columns.map((col) => (
                    <td
                      key={col.accessor}
                      className={`${cellClassName} ${getAlignClass(col.align, col)}`}
                    >
                      {col.render ? col.render(row[col.accessor], row) : row[col.accessor]}
                    </td>
                  ))}

                  {actions ? (
                    <td className={`${cellClassName} text-right`}>{actions(row)}</td>
                  ) : null}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length + (actions ? 1 : 0)}
                  className="py-10 text-center text-sm text-slate-400"
                >
                  No hay datos disponibles
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {paginate && !loading && data.length > 0 ? (
        <div
          className={`flex flex-col gap-3 border-t border-slate-200 dark:border-slate-800/80 ${
            density === "compact" ? "px-3 py-3" : "px-4 py-4"
          } md:flex-row md:items-center md:justify-between`}
        >
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-semibold uppercase text-slate-600 dark:text-slate-400">
              <span className="hidden sm:inline">FILAS POR PÁGINA</span>
              <span className="sm:hidden">FILAS</span>
            </span>
            <select
              value={resolvedPageSize}
              onChange={(e) => {
                const next = Number(e.target.value);
                setPageSize(next);
                setPage(0);
              }}
              className="h-9 w-16 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2 text-sm font-semibold text-slate-700 dark:text-slate-300 outline-none transition focus:border-slate-300 dark:focus:border-slate-700"
            >
              {resolvedPageSizeOptions.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 md:justify-end">
            <span className="text-xs font-semibold uppercase text-slate-600 dark:text-slate-400">{rangeLabel}</span>

            <div className="flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setPage(Math.max(0, resolvedPage - 1))}
                disabled={resolvedPage === 0}
                className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-xs font-semibold text-slate-700 dark:text-slate-300 transition hover:bg-slate-50 dark:hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="hidden sm:inline">ANTERIOR</span>
                <span className="sm:hidden">ANT.</span>
              </button>
              <span className="text-xs font-semibold uppercase text-slate-600 dark:text-slate-400">
                <span className="hidden sm:inline">
                  PÁGINA {resolvedPage + 1} DE {pageCount}
                </span>
                <span className="sm:hidden">
                  {resolvedPage + 1}/{pageCount}
                </span>
              </span>
              <button
                type="button"
                onClick={() => setPage(Math.min(pageCount - 1, resolvedPage + 1))}
                disabled={resolvedPage >= pageCount - 1}
                className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-xs font-semibold text-slate-700 dark:text-slate-300 transition hover:bg-slate-50 dark:hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="hidden sm:inline">SIGUIENTE</span>
                <span className="sm:hidden">SIG.</span>
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );

  if (variant === "plain") {
    return <div className="w-full">{tableMarkup}</div>;
  }

  return (
    <div className="w-full overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-[0_14px_36px_rgba(15,23,42,0.07)] transition-colors duration-300">
      {tableMarkup}
    </div>
  );
}
