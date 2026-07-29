import ModalFiltro from "../../../ui/ModalFiltro";

export default function GestionClientesFiltroModal({
  filterOpen,
  setFilterOpen,
  draftFilters,
  setDraftFilters,
  setFilters,
  oficinaOptions,
  estadoOptions,
  defaultFilters,
}) {
  return (
    <ModalFiltro
      open={filterOpen}
      onClose={() => setFilterOpen(false)}
      title="FILTROS DE CLIENTES"
      footer={
        <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => {
              setDraftFilters(defaultFilters);
              setFilters(defaultFilters);
              setFilterOpen(false);
            }}
            className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            LIMPIAR
          </button>

          <button
            type="button"
            onClick={() => {
              setFilters(draftFilters);
              setFilterOpen(false);
            }}
            className="inline-flex items-center justify-center rounded-lg bg-[#0e183f] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#16245e]"
          >
            APLICAR
          </button>
        </div>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="text-sm font-medium text-slate-700">BUSCAR:</span>
          <input
            value={draftFilters.query}
            onChange={(e) =>
              setDraftFilters((current) => ({
                ...current,
                query: e.target.value.toUpperCase(),
              }))
            }
            placeholder="NOMBRE, CODIGO O PROCESO"
            className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 uppercase outline-none transition focus:border-slate-300"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">OFICINA:</span>
          <select
            value={draftFilters.oficina}
            onChange={(e) =>
              setDraftFilters((current) => ({
                ...current,
                oficina: e.target.value,
              }))
            }
            className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 uppercase outline-none transition focus:border-slate-300"
          >
            <option value="Todos">TODOS</option>
            {oficinaOptions.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">ESTADO:</span>
          <select
            value={draftFilters.estado}
            onChange={(e) =>
              setDraftFilters((current) => ({
                ...current,
                estado: e.target.value,
              }))
            }
            className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 uppercase outline-none transition focus:border-slate-300"
          >
            <option value="Todos">TODOS</option>
            {estadoOptions.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
      </div>
    </ModalFiltro>
  );
}
