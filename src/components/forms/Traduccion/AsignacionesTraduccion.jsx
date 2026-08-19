import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  FileText,
  Search,
  Languages,
  UserCheck,
  History,
  RefreshCw
} from "lucide-react";
import toast from "react-hot-toast";
import Swal from "sweetalert2";

import HeaderBox from "../../ui/HeaderBox";
import ModalGeneral from "../../ui/ModalGeneral";
import Table from "../../ui/Table";
import { invalidateWorkflowQueries, workflowInvalidations } from "../../../utils/queryKeys";
import { useUsuariosQuery } from "../../../hooks/queries/useUsuariosQuery";
import {
  getPendientesTraductor,
  asignarTraductor,
  getPendientesQuality,
  asignarQuality,
  getHistorialAsignadorTraduccion,
  reasignarTraductor,
  reasignarQuality
} from "../../../services/traduccionServices";

const renderEstadoBadge = (estado) => {
  const map = {
    SOLICITADA: { text: "Solicitada", classes: "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300" },
    PENDIENTE_TRADUCCION: { text: "Pendiente Traducción", classes: "bg-slate-100 text-slate-800 dark:bg-slate-800/40 dark:text-slate-400" },
    ASIGNADO_TRADUCTOR: { text: "Asignado a Traductor", classes: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300" },
    QUALITY_DEVUELTO_TRADUCTOR: { text: "Devuelto por Quality", classes: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-900" },
    EN_QUALITY_PENDIENTE_ASIGNACION: { text: "Listo para Quality", classes: "bg-cyan-100 text-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-300" },
    ASIGNADO_QUALITY: { text: "En Auditoría Quality", classes: "bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300" },
    TRADUCIDO_Y_VERIFICADO: { text: "Aprobado", classes: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300" },
    ILEGIBLE_DEVUELTO: { text: "Devuelto (Ilegible)", classes: "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300" },
    NO_REQUIERE: { text: "No Requiere", classes: "bg-slate-100 text-slate-500 dark:bg-slate-900 dark:text-slate-400" },
    ILEGIBLE_CORREGIDO: { text: "Ilegible Corregido", classes: "bg-teal-100 text-teal-800 dark:bg-teal-950/40 dark:text-teal-300" },
    CORREGIDO_TRADUCTOR_QUALITY: { text: "Corregido por Traductor", classes: "bg-orange-100 text-orange-800 dark:bg-orange-950/40 dark:text-orange-300" },
  };

  const config = map[estado] || { text: estado || "Desconocido", classes: "bg-slate-100 text-slate-800 dark:bg-slate-800/40 dark:text-slate-400" };

  return (
    <span className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide transition-colors ${config.classes}`}>
      {config.text}
    </span>
  );
};

export default function AsignacionesTraduccion() {
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
    return usuarios;
  }, [usuarios]);

  const qualityReviewersList = useMemo(() => {
    return usuarios;
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

  const [isReassign, setIsReassign] = useState(false);

  const queryHistorial = useQuery({
    queryKey: ["traducciones", "historial-asignador", currentUserId],
    queryFn: () => getHistorialAsignadorTraduccion(currentUserId),
    enabled: activeTab === "historial" && Number.isFinite(currentUserId),
  });

  // Active data selection
  const { currentData, isLoading } = useMemo(() => {
    if (activeTab === "asignar_traductor") {
      return {
        currentData: queryPendientesTraductor.data ?? [],
        isLoading: queryPendientesTraductor.isLoading
      };
    }
    if (activeTab === "asignar_quality") {
      return {
        currentData: queryPendientesQuality.data ?? [],
        isLoading: queryPendientesQuality.isLoading
      };
    }
    return {
      currentData: queryHistorial.data ?? [],
      isLoading: queryHistorial.isLoading
    };
  }, [activeTab, queryPendientesTraductor, queryPendientesQuality, queryHistorial]);

  // Mutations
  const assignTraductorMutation = useMutation({
    mutationFn: ({ expedienteId, documentoId, payload }) =>
      asignarTraductor(expedienteId, documentoId, payload),
    onSuccess: async () => {
      await invalidateWorkflowQueries(queryClient, workflowInvalidations.traduccion.asignarTraductor);
      toast.success("El traductor ha sido asignado exitosamente.");
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
    onSuccess: async () => {
      await invalidateWorkflowQueries(queryClient, workflowInvalidations.traduccion.asignarQuality);
      toast.success("El revisor de Quality ha sido asignado exitosamente.");
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

  const reasignarTraductorMutation = useMutation({
    mutationFn: ({ expedienteId, documentoId, payload }) =>
      reasignarTraductor(expedienteId, documentoId, payload),
    onSuccess: async () => {
      await invalidateWorkflowQueries(queryClient, workflowInvalidations.traduccion.reasignarTraductor);
      toast.success("El traductor ha sido reasignado exitosamente.");
      closeModal();
    },
    onError: (error) => {
      Swal.fire({
        title: "Error",
        text: error.message || "Ocurrió un error al reasignar el traductor.",
        icon: "error",
        confirmButtonColor: "#fe7405",
      });
    }
  });

  const reasignarQualityMutation = useMutation({
    mutationFn: ({ expedienteId, documentoId, payload }) =>
      reasignarQuality(expedienteId, documentoId, payload),
    onSuccess: async () => {
      await invalidateWorkflowQueries(queryClient, workflowInvalidations.traduccion.reasignarQuality);
      toast.success("El revisor de Quality ha sido reasignado exitosamente.");
      closeModal();
    },
    onError: (error) => {
      Swal.fire({
        title: "Error",
        text: error.message || "Ocurrió un error al reasignar el revisor.",
        icon: "error",
        confirmButtonColor: "#fe7405",
      });
    }
  });

  const handleOpenAssignTraductor = (doc) => {
    setSelectedDoc(doc);
    setSelectedUserId("");
    setObservaciones("");
    setIsReassign(false);
    setAssignTraductorOpen(true);
  };

  const handleOpenReassignTraductor = (doc) => {
    setSelectedDoc(doc);
    setSelectedUserId(doc.traductor_id || "");
    setObservaciones(doc.observaciones || "");
    setIsReassign(true);
    setAssignTraductorOpen(true);
  };

  const handleOpenAssignQuality = (doc) => {
    setSelectedDoc(doc);
    setSelectedUserId("");
    setObservaciones("");
    setIsReassign(false);
    setAssignQualityOpen(true);
  };

  const handleOpenReassignQuality = (doc) => {
    setSelectedDoc(doc);
    setSelectedUserId(doc.quality_id || "");
    setObservaciones(doc.observaciones || "");
    setIsReassign(true);
    setAssignQualityOpen(true);
  };

  const closeModal = () => {
    setIsReassign(false);
    setAssignTraductorOpen(false);
    setAssignQualityOpen(false);
    setSelectedDoc(null);
    setSelectedUserId("");
    setObservaciones("");
  };

  const handleAssignTraductorSubmit = (e) => {
    e.preventDefault();
    if (!selectedDoc || !selectedUserId) return;

    const payload = {
      usuario_id: currentUserId,
      observaciones: observaciones.trim()
    };

    if (isReassign) {
      payload.nuevo_traductor_id = Number(selectedUserId);
      reasignarTraductorMutation.mutate({
        expedienteId: selectedDoc.expediente_id,
        documentoId: selectedDoc.id,
        payload
      });
    } else {
      payload.traductor_id = Number(selectedUserId);
      assignTraductorMutation.mutate({
        expedienteId: selectedDoc.expediente_id,
        documentoId: selectedDoc.id,
        payload
      });
    }
  };

  const handleAssignQualitySubmit = (e) => {
    e.preventDefault();
    if (!selectedDoc || !selectedUserId) return;

    const payload = {
      usuario_id: currentUserId,
      observaciones: observaciones.trim()
    };

    if (isReassign) {
      payload.nuevo_quality_id = Number(selectedUserId);
      reasignarQualityMutation.mutate({
        expedienteId: selectedDoc.expediente_id,
        documentoId: selectedDoc.id,
        payload
      });
    } else {
      payload.quality_id = Number(selectedUserId);
      assignQualityMutation.mutate({
        expedienteId: selectedDoc.expediente_id,
        documentoId: selectedDoc.id,
        payload
      });
    }
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
      },
      {
        header: "Estado",
        accessor: "estado_traduccion",
        align: "center",
        render: (val) => renderEstadoBadge(val)
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
    } else if (activeTab === "asignar_quality") {
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
          header: "Revisor Quality",
          accessor: "quality_nombre",
          render: (val) => (
            <span className="inline-flex rounded bg-purple-50 dark:bg-purple-950/30 px-2 py-1 text-xs font-semibold text-purple-700 dark:text-purple-300">
              {val || "-"}
            </span>
          )
        },
        {
          header: "Fecha Asignación",
          accessor: "updated_at",
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
        title="Asignaciones - Traducción"
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
      <div className="inline-flex items-center gap-1 rounded-xl border border-[#0a1233]/10 bg-gradient-to-r from-[#ffffff] to-[#ffffff]/85 px-2 py-2 shadow-[0_8px_24px_rgba(10,18,51,0.18)] dark:border-slate-800 dark:bg-slate-900 dark:from-slate-900 dark:to-slate-900/85 dark:shadow-[0_8px_24px_rgba(2,6,23,0.45)]">
        <button
          type="button"
          onClick={() => {
            setActiveTab("asignar_traductor");
            setSearchQuery("");
          }}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-[12px] font-black uppercase tracking-[0.08em] transition-all duration-200 ${
            activeTab === "asignar_traductor"
              ? "text-[#fe7405] pl-3 border-l-[3px] border-l-[#fe7405] rounded-lg"
              : "text-[#0a1233] hover:text-[#0a1233] hover:bg-slate-100 dark:text-slate-200 dark:hover:text-white dark:hover:bg-slate-800 pl-4"
          }`}
        >
          <Languages size={16} strokeWidth={2.2} />
          Asignación de Traductor
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("asignar_quality");
            setSearchQuery("");
          }}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-[12px] font-black uppercase tracking-[0.08em] transition-all duration-200 ${
            activeTab === "asignar_quality"
              ? "text-[#fe7405] pl-3 border-l-[3px] border-l-[#fe7405] rounded-lg"
              : "text-[#0a1233] hover:text-[#0a1233] hover:bg-slate-100 dark:text-slate-200 dark:hover:text-white dark:hover:bg-slate-800 pl-4"
          }`}
        >
          <UserCheck size={16} strokeWidth={2.2} />
          Asignación de Quality
        </button>

       <button
          type="button"
          onClick={() => {
            setActiveTab("historial");
            setSearchQuery("");
          }}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-[12px] font-black uppercase tracking-[0.08em] transition-all duration-200 ${
            activeTab === "historial"
              ? "text-[#fe7405] pl-3 border-l-[3px] border-l-[#fe7405] rounded-lg"
              : "text-[#0a1233] hover:text-[#0a1233] hover:bg-slate-100 dark:text-slate-200 dark:hover:text-white dark:hover:bg-slate-800 pl-4"
          }`}
        >
          <History size={16} strokeWidth={2.2} />
          Historial de Asignaciones
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

            {activeTab === "historial" && (() => {
              const isFinished = ["TRADUCIDO_Y_VERIFICADO", "NO_REQUIERE"].includes(row.estado_traduccion);
              if (isFinished) {
                return <span className="text-xs text-slate-400 italic">Completado</span>;
              }
              return (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenReassignTraductor(row)}
                    className="inline-flex h-8 items-center justify-center gap-1 rounded bg-[#fe7405] px-2 py-0.5 text-[10px] font-bold text-white shadow-sm transition hover:bg-[#e06300] active:scale-95"
                  >
                    <RefreshCw size={10} />
                    REASIGNAR TRADUCTOR
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenReassignQuality(row)}
                    className="inline-flex h-8 items-center justify-center gap-1 rounded bg-[#0e183f] px-2 py-0.5 text-[10px] font-bold text-white shadow-sm transition hover:bg-[#1a2d69] active:scale-95"
                  >
                    <RefreshCw size={10} />
                    REASIGNAR QUALITY
                  </button>
                </div>
              );
            })()}
          </div>
        )}
      />

      {/* MODAL: ASIGNAR TRADUCTOR */}
      {assignTraductorOpen && selectedDoc && (
        <ModalGeneral
          open
          onClose={closeModal}
          size="md"
          header={
            <div>
              <h3 className="text-md font-bold uppercase tracking-wide">{isReassign ? "Reasignar Traductor" : "Asignar Traductor"}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Expediente: {selectedDoc.codigo_expediente}</p>
            </div>
          }
        >
          <form onSubmit={handleAssignTraductorSubmit} className="space-y-4">
              <div className="space-y-1">
                <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Documento</span>
                <span className="block text-sm font-semibold text-slate-800 dark:text-slate-200">{selectedDoc.nombre_documento}</span>
              </div>
              <label className="block space-y-1">
                <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Seleccionar Traductor *</span>
                <select
                  required
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full h-10 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-sm outline-none transition focus:border-[#fe7405] focus:ring-1 focus:ring-[#fe7405]"
                >
                  <option value="">Seleccione un traductor...</option>
                  {translatorsList.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.nombre} ({user.rolNombre || "Traductor"})
                    </option>
                  ))}
                </select>
              </label>
              <label className="block space-y-1">
                <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Instrucciones / Observaciones</span>
                <textarea
                  placeholder="Detalles sobre prioridades o fecha límite..."
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 text-sm outline-none transition focus:border-[#fe7405] focus:ring-1 focus:ring-[#fe7405]"
                />
              </label>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={closeModal} className="h-10 rounded-lg px-4 text-sm font-semibold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800">Cancelar</button>
                <button
                  type="submit"
                  disabled={assignTraductorMutation.isPending || reasignarTraductorMutation.isPending}
                  className="h-10 rounded-lg bg-[#fe7405] px-5 text-sm font-semibold text-white shadow hover:bg-[#e06300] transition disabled:opacity-50"
                >
                  {assignTraductorMutation.isPending || reasignarTraductorMutation.isPending
                    ? "Asignando..."
                    : isReassign
                    ? "Reasignar"
                    : "Asignar"}
                </button>
              </div>
          </form>
        </ModalGeneral>
      )}

      {/* MODAL: ASIGNAR QUALITY */}
      {assignQualityOpen && selectedDoc && (
        <ModalGeneral
          open
          onClose={closeModal}
          size="md"
          header={
            <div>
              <h3 className="text-md font-bold uppercase tracking-wide">{isReassign ? "Reasignar Revisor Quality" : "Asignar Revisor de Quality"}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Expediente: {selectedDoc.codigo_expediente}</p>
            </div>
          }
        >
          <form onSubmit={handleAssignQualitySubmit} className="space-y-4">
              <div className="space-y-1">
                <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Documento</span>
                <span className="block text-sm font-semibold text-slate-800 dark:text-slate-200">{selectedDoc.nombre_documento}</span>
              </div>
              <label className="block space-y-1">
                <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Seleccionar Revisor Quality *</span>
                <select
                  required
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full h-10 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-sm outline-none transition focus:border-[#0e183f] focus:ring-1 focus:ring-[#0e183f]"
                >
                  <option value="">Seleccione un revisor...</option>
                  {qualityReviewersList.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.nombre} ({user.rolNombre || user.role || user.rol_nombre || "Usuario"})
                    </option>
                  ))}
                </select>
              </label>
              <label className="block space-y-1">
                <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Instrucciones / Observaciones</span>
                <textarea
                  placeholder="Instrucciones para el control de calidad..."
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 text-sm outline-none transition focus:border-[#0e183f] focus:ring-1 focus:ring-[#0e183f]"
                />
              </label>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={closeModal} className="h-10 rounded-lg px-4 text-sm font-semibold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800">Cancelar</button>
                <button
                  type="submit"
                  disabled={assignQualityMutation.isPending || reasignarQualityMutation.isPending}
                  className="h-10 rounded-lg bg-[#0e183f] px-5 text-sm font-semibold text-white shadow hover:bg-[#1a2d69] transition disabled:opacity-50"
                >
                  {assignQualityMutation.isPending || reasignarQualityMutation.isPending
                    ? "Asignando..."
                    : isReassign
                    ? "Reasignar"
                    : "Asignar"}
                </button>
              </div>
          </form>
        </ModalGeneral>
      )}
    </section>
  );
}
