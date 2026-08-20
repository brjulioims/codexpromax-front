import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  FileCheck2, 
  Search, 
  UserCheck,
  FolderOpen
} from "lucide-react";
import toast from "react-hot-toast";
import Swal from "sweetalert2";

import HeaderBox from "../../ui/HeaderBox";
import Table from "../../ui/Table";
import ModalGeneral from "../../ui/ModalGeneral";
import { useUsuariosQuery } from "../../../hooks/queries/useUsuariosQuery";
import { 
  getExpedientesAsignados,
  reasignarParalegal 
} from "../../../services/expedientesServices";

export default function AsignacionesEnsamble() {
  const queryClient = useQueryClient();

  // Get logged in user info
  const rawUser = JSON.parse(localStorage.getItem("user") ?? "{}");
  const currentUserId = Number(
    rawUser?.id ?? rawUser?.usuario_id ?? rawUser?.user_id ?? null
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCase, setSelectedCase] = useState(null);
  
  // Reassignment Modal state
  const [reassignOpen, setReassignOpen] = useState(false);
  const [selectedParalegalId, setSelectedParalegalId] = useState("");
  const [motivo, setMotivo] = useState("");

  // Fetch all users to filter paralegals
  const { data: usuarios = [] } = useUsuariosQuery();
  
  // Fetch all assigned cases
  const { data: assignedCases = [], isLoading: loadingCases } = useQuery({
    queryKey: ["expedientes-asignados"],
    queryFn: () => getExpedientesAsignados(),
  });

  const paralegalsList = useMemo(() => {
    // Filter by role paralegal or team
    return usuarios.filter(u => 
      u.rolNombre?.toUpperCase().includes("PARALEGAL") || 
      u.rolCodigo?.toUpperCase().includes("PARALEGAL")
    );
  }, [usuarios]);

  const reassignMutation = useMutation({
    mutationFn: ({ id, payload }) => reasignarParalegal(id, payload),
    onSuccess: () => {
      toast.success("Paralegal reasignado exitosamente para el ensamble.");
      setReassignOpen(false);
      setSelectedCase(null);
      setSelectedParalegalId("");
      setMotivo("");
      queryClient.invalidateQueries({ queryKey: ["expedientes-asignados"] });
    },
    onError: (error) => {
      Swal.fire({
        title: "Error",
        text: error.message || "Ocurrió un error al reasignar el paralegal.",
        icon: "error",
        confirmButtonColor: "#0e183f",
      });
    }
  });

  const filteredCases = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return assignedCases;
    return assignedCases.filter((item) => {
      return (
        `${item.numeroExpediente ?? ""}`.toLowerCase().includes(query) ||
        `${item.nombre ?? ""}`.toLowerCase().includes(query) ||
        `${item.proceso ?? ""}`.toLowerCase().includes(query) ||
        `${item.oficina ?? ""}`.toLowerCase().includes(query) ||
        `${item.custodioNombre ?? ""}`.toLowerCase().includes(query)
      );
    });
  }, [assignedCases, searchQuery]);

  const handleOpenReassign = (row) => {
    setSelectedCase(row);
    setSelectedParalegalId(row.custodioUsuarioId ? String(row.custodioUsuarioId) : "");
    setMotivo("Reasignación de expediente para revisión y ensamble final.");
    setReassignOpen(true);
  };

  const handleSaveReassign = (e) => {
    e.preventDefault();
    if (!selectedCase || !selectedParalegalId) {
      toast.error("Por favor selecciona un paralegal.");
      return;
    }

    reassignMutation.mutate({
      id: selectedCase.id,
      payload: {
        nuevo_paralegal_usuario_id: Number(selectedParalegalId),
        reasignador_usuario_id: currentUserId,
        motivo: motivo.trim()
      }
    });
  };

  const columns = [
    {
      header: "N° Expediente",
      accessor: "numeroExpediente",
      render: (val) => (
        <span className="font-semibold text-[#0e183f] dark:text-sky-300">
          {val || "-"}
        </span>
      ),
    },
    {
      header: "Cliente",
      accessor: "nombre",
      render: (val) => <span className="font-medium">{val || "-"}</span>,
    },
    {
      header: "Proceso",
      accessor: "proceso",
      render: (val, row) => (
        <span className="text-xs text-slate-600 dark:text-slate-400">
          {val || "-"} {row.categoria ? `(${row.categoria})` : ""}
        </span>
      ),
    },
    {
      header: "Paralegal Custodio",
      accessor: "custodioNombre",
      render: (val) => (
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 px-2 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300">
          {val || "No asignado"}
        </span>
      ),
    },
    {
      header: "Oficina",
      accessor: "oficina",
    },
  ];

  return (
    <section className="space-y-6">
      <HeaderBox 
        title="ASIGNACIONES - ENSAMBLE"
        subtitle="Asigna y reasigna los expedientes a los Paralegales encargados del Ensamble."
        Icon={UserCheck}
      />

      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/60 dark:border-slate-800 shadow-sm">
          <h3 className="text-sm font-bold text-[#0e183f] dark:text-white uppercase tracking-wider">
            Expedientes Asignados ({filteredCases.length})
          </h3>
          
          <div className="relative w-full sm:w-72">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar expediente, cliente, paralegal..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950 text-slate-700 dark:text-slate-300 outline-none focus:border-[#0e183f] focus:bg-white transition"
            />
          </div>
        </div>

        <Table
          columns={columns}
          data={filteredCases}
          loading={loadingCases}
          loadingLabel="Cargando expedientes asignados..."
          actions={(row) => (
            <button
              type="button"
              onClick={() => handleOpenReassign(row)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 dark:bg-slate-850 dark:border-slate-800 dark:text-slate-300 transition"
            >
              <UserCheck size={14} />
              Reasignar
            </button>
          )}
          paginate={filteredCases.length > 10}
          itemsPerPage={10}
          variant="card"
        />
      </div>

      {/* Reassign Modal */}
      <ModalGeneral
        open={reassignOpen}
        onClose={() => {
          setReassignOpen(false);
          setSelectedCase(null);
          setSelectedParalegalId("");
          setMotivo("");
        }}
        title="REASIGNAR PARALEGAL RESPONSABLE"
        size="md"
        footer={
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => {
                setReassignOpen(false);
                setSelectedCase(null);
                setSelectedParalegalId("");
                setMotivo("");
              }}
              className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              CANCELAR
            </button>
            <button
              type="button"
              onClick={handleSaveReassign}
              disabled={reassignMutation.isPending}
              className="inline-flex items-center justify-center rounded-lg bg-[#0e183f] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#16245e]"
            >
              {reassignMutation.isPending ? "GUARDANDO..." : "CONFIRMAR REASIGNACIÓN"}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm space-y-1">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Expediente Seleccionado</p>
            <p className="font-bold text-slate-800">
              {selectedCase?.numeroExpediente} - {selectedCase?.nombre}
            </p>
            <p className="text-xs text-slate-500">
              Custodio actual: {selectedCase?.custodioNombre || "Sin asignar"}
            </p>
          </div>

          <label className="block space-y-2">
            <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Nuevo Paralegal Responsable *
            </span>
            <select
              value={selectedParalegalId}
              onChange={(e) => setSelectedParalegalId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-medium text-slate-700 outline-none transition focus:border-[#0e183f]"
            >
              <option value="">SELECCIONA UN PARALEGAL</option>
              {paralegalsList.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nombre} ({item.rolNombre || "Paralegal"})
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-2">
            <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Motivo de la Reasignación
            </span>
            <textarea
              required
              rows={3}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Detalla el motivo del cambio..."
              className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-700 outline-none transition focus:border-[#0e183f]"
            />
          </label>
        </div>
      </ModalGeneral>
    </section>
  );
}
