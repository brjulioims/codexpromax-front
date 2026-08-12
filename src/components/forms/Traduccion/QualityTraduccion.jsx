import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  FileText,
  Search,
  Languages,
  UserCheck
} from "lucide-react";
import Swal from "sweetalert2";

import HeaderBox from "../../ui/HeaderBox";
import Table from "../../ui/Table";
import { useUsuariosQuery } from "../../../hooks/queries/useUsuariosQuery";
import {
  getPendientesTraductor,
  asignarTraductor,
  getPendientesQuality,
  asignarQuality
} from "../../../services/traduccionServices";

export default function QualityTraduccion() {
  const queryClient = useQueryClient();

  // Active Tab:
  // "asignar_traductor" -> Pendientes de traductor (GET /api/traducciones/pendientes-traductor)
  // "asignar_quality"   -> Pendientes de quality (GET /api/traducciones/pendientes-quality)
  const [activeTab, setActiveTab] = useState("asignar_traductor");

  // Get logged in user info
  const rawUser = JSON.parse(localStorage.getItem("user") ?? "{}");
  const currentUserId = Number(
    rawUser?.id ?? rawUser?.usuario_id ?? rawUser?.user_id ?? null
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDoc, setSelectedDoc] = useState(null);

  // Modals state
  const [assignTraductorOpen, setAssignTraductorOpen] = useState(false);
  const [assignQualityOpen, setAssignQualityOpen] = useState(false);

  // Form states
  const [selectedUserId, setSelectedUserId] = useState("");
  const [observaciones, setObservaciones] = useState("");

  // Fetch all users for assignments
  const { data: usuarios = [] } = useUsuariosQuery();

  // Filter translators and quality reviewers with robust fallback
  const translatorsList = useMemo(() => {
    const filtered = usuarios.filter((u) => {
      const rol = `${u.rolNombre ?? u.role ?? u.rol_nombre ?? ""}`.toLowerCase();
      return rol.includes("trad") || rol.includes("translator");
    });
    return filtered.length > 0 ? filtered : usuarios;
  }, [usuarios]);

  const qualityReviewersList = useMemo(() => {
    return usuarios.filter((u) => Number(u.rolId) === 7);
  }, [usuarios]);

  // Queries
  const queryPendientesTraductor = useQuery({
    queryKey: ["traducciones", "pendientes-traductor"],
    queryFn: getPendientesTraductor,
    enabled: activeTab === "asignar_traductor",
  });

  const queryPendientesQuality = useQuery({
    queryKey: ["traducciones", "pendientes-quality"],
    queryFn: getPendientesQuality,
    enabled: activeTab === "asignar_quality",
  });

  // Active data selection
  const { currentData, isLoading } = useMemo(() => {
    if (activeTab === "asignar_traductor") {
      return {
        currentData: queryPendientesTraductor.data ?? [],
        isLoading: queryPendientesTraductor.isLoading
      };
    }
    return {
      currentData: queryPendientesQuality.data ?? [],
      isLoading: queryPendientesQuality.isLoading
    };
  }, [activeTab, queryPendientesTraductor, queryPendientesQuality]);

  // Mutations
  const assignTraductorMutation = useMutation({
    mutationFn: ({ expedienteId, documentoId, payload }) =>
      asignarTraductor(expedienteId, documentoId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["traducciones", "pendientes-traductor"] });
      Swal.fire({
        title: "Asignado",
        text: "El traductor ha sido asignado exitosamente.",
        icon: "success",
        confirmButtonColor: "#fe7405",
      });
      closeModal();
    },
    onError: (error) => {
      Swal.fire({
        title: "Error",
        text: error.message || "Ocurrió un error al asignar el traductor.",
        icon: "error",
        confirmButtonColor: "#fe7405",
      });
    }
  });

  const assignQualityMutation = useMutation({
    mutationFn: ({ expedienteId, documentoId, payload }) =>
      asignarQuality(expedienteId, documentoId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["traducciones", "pendientes-quality"] });
      Swal.fire({
        title: "Asignado",
        text: "El revisor de Quality ha sido asignado exitosamente.",
        icon: "success",
        confirmButtonColor: "#fe7405",
      });
      closeModal();
    },
    onError: (error) => {
      Swal.fire({
        title: "Error",
        text: error.message || "Ocurrió un error al asignar el revisor.",
        icon: "error",
        confirmButtonColor: "#fe7405",
      });
    }
  });

  const handleOpenAssignTraductor = (doc) => {
    setSelectedDoc(doc);
    setSelectedUserId("");
    setObservaciones("");
    setAssignTraductorOpen(true);
  };

  const handleOpenAssignQuality = (doc) => {
    setSelectedDoc(doc);
    setSelectedUserId("");
    setObservaciones("");
    setAssignQualityOpen(true);
  };

  const closeModal = () => {
    setAssignTraductorOpen(false);
    setAssignQualityOpen(false);
    setSelectedDoc(null);
    setSelectedUserId("");
    setObservaciones("");
  };

  const handleAssignTraductorSubmit = (e) => {
    e.preventDefault();
    if (!selectedDoc || !selectedUserId) return;
    assignTraductorMutation.mutate({
      expedienteId: selectedDoc.expediente_id,
      documentoId: selectedDoc.id,
      payload: {
        traductor_id: Number(selectedUserId),
        usuario_id: currentUserId,
        observaciones: observaciones.trim()
      }
    });
  };

  const handleAssignQualitySubmit = (e) => {
    e.preventDefault();
    if (!selectedDoc || !selectedUserId) return;
    assignQualityMutation.mutate({
      expedienteId: selectedDoc.expediente_id,
      documentoId: selectedDoc.id,
      payload: {
        quality_id: Number(selectedUserId),
        usuario_id: currentUserId,
        observaciones: observaciones.trim()
      }
    });
  };

  // Filter items
  const filteredData = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return currentData;
    return currentData.filter((item) => {
      return (
        `${item.codigo_expediente ?? ""}`.toLowerCase().includes(query) ||
        `${item.cliente_nombre ?? ""}`.toLowerCase().includes(query) ||
        `${item.nombre_documento ?? ""}`.toLowerCase().includes(query) ||
        `${item.traductor_nombre ?? ""}`.toLowerCase().includes(query) ||
        `${item.usuario_solicitante_nombre ?? ""}`.toLowerCase().includes(query)
      );
    });
  }, [currentData, searchQuery]);

  // Table columns
  const columns = useMemo(() => {
    const base = [
      {
        header: "N° Expediente",
        accessor: "codigo_expediente",
        render: (val) => (
          <span className="font-semibold text-[#0e183f] dark:text-sky-300">
            {val || "-"}
          </span>
        )
      },
      {
        header: "Cliente",
        accessor: "cliente_nombre",
        render: (val) => <span className="font-medium">{val || "-"}</span>
      },
      {
        header: "Documento",
        accessor: "nombre_documento",
        render: (val) => <span className="text-slate-600 dark:text-slate-400">{val || "-"}</span>
      }
    ];

    if (activeTab === "asignar_traductor") {
      base.push(
        {
          header: "Solicitante",
          accessor: "usuario_solicitante_nombre",
          render: (val) => <span className="text-xs text-slate-500">{val || "-"}</span>
        },
        {
          header: "Fecha Solicitud",
          accessor: "fecha_solicitud_traduccion",
          render: (val) => (
            <span className="text-xs font-semibold text-slate-500">
              {val ? new Date(val).toLocaleDateString() : "-"}
            </span>
          )
        }
      );
    } else {
      base.push(
        {
          header: "Traductor",
          accessor: "traductor_nombre",
          render: (val) => (
            <span className="inline-flex rounded bg-blue-50 dark:bg-blue-950/30 px-2 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300">
              {val || "-"}
            </span>
          )
        },
        {
          header: "Fecha Envío a Quality",
          accessor: "fecha_envio_quality",
          render: (val) => (
            <span className="text-xs font-semibold text-slate-500">
              {val ? new Date(val).toLocaleDateString() : "-"}
            </span>
          )
        }
      );
    }

    return base;
  }, [activeTab]);

  return (
    <section className="space-y-5">
      <HeaderBox
        title="Quality - Traducción"
        subtitle="Asignación de Traductores y Revisores de Calidad para Traducciones"
        Icon={FileText}
        action={
          <div className="flex flex-col gap-3 sm:flex-row items-center w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Search size={16} />
              </span>
              <input
                type="text"
                placeholder="Buscar por expediente, cliente, documento..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 pl-9 pr-4 text-sm outline-none transition focus:border-slate-300 dark:focus:border-slate-700"
              />
            </div>
            <div className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-4 text-sm font-semibold text-[#0e183f] dark:text-white">
              Resultados: {filteredData.length}
            </div>
          </div>
        }
      />

      {/* Tabs */}
      <div className="flex flex-wrap border-b border-slate-200 dark:border-slate-800">
        <button
          type="button"
          onClick={() => {
            setActiveTab("asignar_traductor");
            setSearchQuery("");
          }}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-bold transition-all ${
            activeTab === "asignar_traductor"
              ? "border-[#fe7405] text-[#fe7405]"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <Languages size={16} />
          Asignación de Traductor
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("asignar_quality");
            setSearchQuery("");
          }}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-bold transition-all ${
            activeTab === "asignar_quality"
              ? "border-[#fe7405] text-[#fe7405]"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <UserCheck size={16} />
          Asignación de Quality
        </button>
      </div>

      {/* Table Section */}
      <Table
        columns={columns}
        data={filteredData}
        loading={isLoading}
        loadingLabel="Obteniendo documentos..."
        actions={(row) => (
          <div className="flex items-center justify-center">
            {activeTab === "asignar_traductor" && (
              <button
                type="button"
                onClick={() => handleOpenAssignTraductor(row)}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-[#fe7405] px-3.5 py-1 text-xs font-bold text-white shadow-sm transition hover:bg-[#e06300] hover:scale-[1.02] active:scale-95"
              >
                <Languages size={14} />
                ASIGNAR TRADUCTOR
              </button>
            )}

            {activeTab === "asignar_quality" && (
              <button
                type="button"
                onClick={() => handleOpenAssignQuality(row)}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-[#0e183f] px-3.5 py-1 text-xs font-bold text-white shadow-sm transition hover:bg-[#1a2d69] hover:scale-[1.02] active:scale-95"
              >
                <UserCheck size={14} />
                ASIGNAR QUALITY
              </button>
            )}
          </div>
        )}
      />

      {/* MODAL: ASIGNAR TRADUCTOR */}
      {assignTraductorOpen && selectedDoc && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative z-10 w-full max-w-md rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl animate-in fade-in zoom-in duration-200">
            <header className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-4 bg-[#0e183f] text-white rounded-t-xl">
              <div>
                <h3 className="text-md font-bold uppercase tracking-wide">Asignar Traductor</h3>
                <p className="text-xs text-white/70">Expediente: {selectedDoc.codigo_expediente}</p>
              </div>
              <button type="button" onClick={closeModal} className="text-white hover:text-white/80 font-bold text-lg leading-none">&times;</button>
            </header>
            <form onSubmit={handleAssignTraductorSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <span className="block text-xs font-semibold text-slate-400 uppercase">Documento</span>
                <span className="block text-sm font-semibold text-slate-800 dark:text-slate-200">{selectedDoc.nombre_documento}</span>
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-400 uppercase">Seleccionar Traductor *</label>
                <select
                  required
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full h-10 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-sm outline-none transition focus:border-[#fe7405]"
                >
                  <option value="">Seleccione un traductor...</option>
                  {translatorsList.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.nombre} ({user.rolNombre || "Traductor"})
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-400 uppercase">Instrucciones / Observaciones</label>
                <textarea
                  placeholder="Detalles sobre prioridades o fecha límite..."
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 text-sm outline-none transition focus:border-[#fe7405]"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={closeModal} className="h-10 rounded-lg px-4 text-sm font-semibold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800">Cancelar</button>
                <button
                  type="submit"
                  disabled={assignTraductorMutation.isPending}
                  className="h-10 rounded-lg bg-[#fe7405] px-5 text-sm font-semibold text-white shadow hover:bg-[#e06300] transition disabled:opacity-50"
                >
                  {assignTraductorMutation.isPending ? "Asignando..." : "Asignar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ASIGNAR QUALITY */}
      {assignQualityOpen && selectedDoc && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative z-10 w-full max-w-md rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl animate-in fade-in zoom-in duration-200">
            <header className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-4 bg-[#0e183f] text-white rounded-t-xl">
              <div>
                <h3 className="text-md font-bold uppercase tracking-wide">Asignar Revisor de Quality</h3>
                <p className="text-xs text-white/70">Expediente: {selectedDoc.codigo_expediente}</p>
              </div>
              <button type="button" onClick={closeModal} className="text-white hover:text-white/80 font-bold text-lg leading-none">&times;</button>
            </header>
            <form onSubmit={handleAssignQualitySubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <span className="block text-xs font-semibold text-slate-400 uppercase">Documento</span>
                <span className="block text-sm font-semibold text-slate-800 dark:text-slate-200">{selectedDoc.nombre_documento}</span>
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-400 uppercase">Seleccionar Revisor Quality *</label>
                <select
                  required
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full h-10 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-sm outline-none transition focus:border-[#0e183f]"
                >
                  <option value="">Seleccione un revisor...</option>
                  {qualityReviewersList.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.nombre} ({user.rolNombre || "Quality Control"})
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-400 uppercase">Instrucciones / Observaciones</label>
                <textarea
                  placeholder="Instrucciones para el control de calidad..."
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 text-sm outline-none transition focus:border-[#0e183f]"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={closeModal} className="h-10 rounded-lg px-4 text-sm font-semibold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800">Cancelar</button>
                <button
                  type="submit"
                  disabled={assignQualityMutation.isPending}
                  className="h-10 rounded-lg bg-[#0e183f] px-5 text-sm font-semibold text-white shadow hover:bg-[#1a2d69] transition disabled:opacity-50"
                >
                  {assignQualityMutation.isPending ? "Asignando..." : "Asignar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
