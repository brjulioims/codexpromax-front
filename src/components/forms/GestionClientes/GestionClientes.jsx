import { useMemo, useState } from "react";
import { Filter, UserRoundSearch } from "lucide-react";

import HeaderBox from "../../ui/HeaderBox";
import { useClientesQuery } from "../../../hooks/queries/useClientesQuery";
import GestionClientesFiltroModal from "./cliente/GestionClientesFiltroModal";
import GestionClientesTable from "./cliente/GestionClientesTable";

const DEFAULT_FILTERS = {
  query: "",
  oficina: "Todos",
  estado: "Todos",
};

function normalizeText(value) {
  return `${value ?? ""}`.trim().toUpperCase();
}

export default function GestionClientes() {
  const { data: clientes = [], isLoading } = useClientesQuery();
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [draftFilters, setDraftFilters] = useState(DEFAULT_FILTERS);

  const oficinaOptions = useMemo(
    () =>
      [...new Set(clientes.map((item) => item.oficina).filter(Boolean))].sort((a, b) =>
        a.localeCompare(b)
      ),
    [clientes]
  );

  const estadoOptions = useMemo(
    () =>
      [...new Set(clientes.map((item) => item.estadoCliente).filter(Boolean))].sort((a, b) =>
        a.localeCompare(b)
      ),
    [clientes]
  );

  const filteredClientes = useMemo(() => {
    const query = normalizeText(filters.query);

    return clientes.filter((cliente) => {
      if (filters.oficina !== "Todos" && cliente.oficina !== filters.oficina) return false;
      if (filters.estado !== "Todos" && cliente.estadoCliente !== filters.estado) return false;
      if (!query) return true;

      return (
        normalizeText(cliente.nombre).includes(query) ||
        normalizeText(cliente.codigoCliente).includes(query) ||
        normalizeText(cliente.proceso).includes(query)
      );
    });
  }, [clientes, filters]);

  return (
    <section className="space-y-5">
      <HeaderBox
        title="Gestion de Clientes"
        subtitle="Consulta el listado general de clientes registrados"
        Icon={UserRoundSearch}
        action={
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-[#0e183f]">
              Registrados: {filteredClientes.length}
            </div>

            <button
              type="button"
              onClick={() => {
                setDraftFilters(filters);
                setFilterOpen(true);
              }}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 sm:w-auto"
            >
              <Filter size={16} />
              FILTROS
            </button>
          </div>
        }
      />

      <GestionClientesFiltroModal
        filterOpen={filterOpen}
        setFilterOpen={setFilterOpen}
        draftFilters={draftFilters}
        setDraftFilters={setDraftFilters}
        setFilters={setFilters}
        oficinaOptions={oficinaOptions}
        estadoOptions={estadoOptions}
        defaultFilters={DEFAULT_FILTERS}
      />

      <GestionClientesTable data={filteredClientes} loading={isLoading} />
    </section>
  );
}
