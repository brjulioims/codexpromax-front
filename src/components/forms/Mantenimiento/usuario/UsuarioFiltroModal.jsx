import ModalFiltro from "../../../ui/ModalFiltro";
import { DEFAULT_FILTERS } from "../../../../utils/Mantenimiento/usuario/usuarios.constants";

export default function UsuarioFiltroModal({
  filterOpen,
  setFilterOpen,
  draftFilters,
  setDraftFilters,
  setFilters,
  roleOptions,
  matchingUsers,
}) {
  const statusOptions = ["Todos", "Activo", "Inactivo"];
  const authProviderOptions = ["Todos", "local", "azure"];

  return (
    <ModalFiltro
      open={filterOpen}
      onClose={() => setFilterOpen(false)}
      title="FILTROS DE USUARIOS"
      footer={
        <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => {
              setDraftFilters(DEFAULT_FILTERS);
              setFilters(DEFAULT_FILTERS);
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
        <div className="sm:col-span-2">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">BUSCAR:</span>
            <input
              value={draftFilters.query}
              onChange={(e) =>
                setDraftFilters((current) => ({
                  ...current,
                  query: e.target.value.toUpperCase(),
                }))
              }
              placeholder="NOMBRE O USUARIO"
              className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 uppercase outline-none transition focus:border-slate-300"
            />
          </label>

          {draftFilters.query.trim() ? (
            <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-2">
              <div className="max-h-40 overflow-y-auto">
                {matchingUsers.length ? (
                  <div className="grid gap-2">
                    {matchingUsers.map((user) => (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() =>
                          setDraftFilters((current) => ({
                            ...current,
                            query: user.queryValue,
                          }))
                        }
                        className="w-full rounded-lg bg-white px-3 py-2 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                      >
                        {user.label}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="px-3 py-2 text-sm text-slate-500">
                    No hay usuarios con ese nombre.
                  </p>
                )}
              </div>
            </div>
          ) : null}
        </div>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">ROL:</span>
          <select
            value={draftFilters.role}
            onChange={(e) =>
              setDraftFilters((current) => ({
                ...current,
                role: e.target.value,
              }))
            }
            className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 uppercase outline-none transition focus:border-slate-300"
          >
            <option value="Todos">TODOS</option>
            {roleOptions.map((value, index) => (
              <option key={`${value}-${index}`} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">ESTADO:</span>
          <select
            value={draftFilters.status}
            onChange={(e) =>
              setDraftFilters((current) => ({
                ...current,
                status: e.target.value,
              }))
            }
            className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 uppercase outline-none transition focus:border-slate-300"
          >
            {statusOptions.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">AUTH PROVIDER:</span>
          <select
            value={draftFilters.authProvider}
            onChange={(e) =>
              setDraftFilters((current) => ({
                ...current,
                authProvider: e.target.value,
              }))
            }
            className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 uppercase outline-none transition focus:border-slate-300"
          >
            {authProviderOptions.map((value) => (
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
