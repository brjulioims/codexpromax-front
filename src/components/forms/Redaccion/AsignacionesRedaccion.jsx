import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  FileText,
  Search,
  PenTool,
  UserCheck,
  History,
  RefreshCw
} from "lucide-react";
import Swal from "sweetalert2";

import HeaderBox from "../../ui/HeaderBox";
import ModalGeneral from "../../ui/ModalGeneral";
import Table from "../../ui/Table";
import { useUsuariosQuery } from "../../../hooks/queries/useUsuariosQuery";
import {
  getPendientesRedactor,
  asignarRedactor,
  getPendientesQuality,
  asignarQuality,
  getHistorialAsignadorRedaccion,
  reasignarRedactor,
  reasignarQuality
} from "../../../services/redaccionServices";

const renderEstadoBadge = (estado) => {
  const map = {
    // Solicited / Pending
    SOLICITADA: { text: "Solicitada", classes: "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300" },
    REDACCION_SOLICITADA: { text: "Solicitada", classes: "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300" },
    PENDIENTE_ASIGNACION: { text: "Pendiente Asignación", classes: "bg-slate-100 text-slate-800 dark:bg-slate-800/40 dark:text-slate-400" },
    
    // Assigned to redactor
    ASIGNADO_REDACTOR: { text: "Asignado a Redactor", classes: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300" },
    REDACCION_ASIGNADA: { text: "Asignado a Redactor", classes: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300" },
    REDACCION_ASIGNADO: { text: "Asignado a Redactor", classes: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300" },
    ASIGNADO: { text: "Asignado", classes: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300" },

    // Contact registered
    CONTACTO_REGISTRADO: { text: "Contacto Registrado", classes: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300" },
    CONTACTO_CLIENTE: { text: "Contacto Registrado", classes: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300" },
    CONTACTO: { text: "Contacto Registrado", classes: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300" },

    // Interview / Toma declaración
    EN_TOMA_DECLARACION: { text: "Toma de Declaración", classes: "bg-orange-100 text-orange-800 dark:bg-orange-950/40 dark:text-orange-300" },
    TOMA_DECLARACION: { text: "Toma de Declaración", classes: "bg-orange-100 text-orange-800 dark:bg-orange-950/40 dark:text-orange-300" },
    TOMA_DECLARACION_EN_CURSO: { text: "Toma de Declaración", classes: "bg-orange-100 text-orange-800 dark:bg-orange-950/40 dark:text-orange-300" },

    // Review in Quality
    EN_REVISION_QUALITY: { text: "En revisión Quality", classes: "bg-cyan-100 text-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-300" },
    ENVIADO_QUALITY: { text: "En revisión Quality", classes: "bg-cyan-100 text-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-300" },
    ENVIADO_A_QUALITY: { text: "En revisión Quality", classes: "bg-cyan-100 text-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-300" },
    EN_QUALITY: { text: "En revisión Quality", classes: "bg-cyan-100 text-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-300" },

    // Rejected by Quality
    RECHAZADO_QUALITY: { text: "Devuelto por Quality", classes: "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200" },
    RECHAZADA_QUALITY: { text: "Devuelto por Quality", classes: "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200" },
    DEVUELTO_QUALITY: { text: "Devuelto por Quality", classes: "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200" },
    DEVUELTO_POR_QUALITY: { text: "Devuelto por Quality", classes: "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200" },

    // Approved
    APROBADO_QUALITY: { text: "Aprobada por Quality", classes: "bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300" },
    APROBADA_QUALITY: { text: "Aprobada por Quality", classes: "bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300" },
    APROBADA: { text: "Aprobada", classes: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300" },
    REDACCION_APROBADA: { text: "Aprobada", classes: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300" },

    // Sent to Translation
    ENVIADO_TRADUCCION: { text: "Enviado a Traducción", classes: "bg-teal-100 text-teal-800 dark:bg-teal-950/40 dark:text-teal-300" },
    ENVIADO_A_TRADUCCION: { text: "Enviado a Traducción", classes: "bg-teal-100 text-teal-800 dark:bg-teal-950/40 dark:text-teal-300" },
  };

  const config = map[estado] || { text: estado || "Desconocido", classes: "bg-slate-100 text-slate-800 dark:bg-slate-800/40 dark:text-slate-400" };

  return (
    <span className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide transition-colors ${config.classes}`}>
      {config.text}
    </span>
  );
};

export default function AsignacionesRedaccion() {
  const queryClient = useQueryClient();

  // Active Tab:
  // "asignar_redactor" -> Pendientes de redactor
  // "asignar_quality"  -> Pendientes de quality
  const [activeTab, setActiveTab] = useState("asignar_redactor");

  // Get logged in user info
  const rawUser = JSON.parse(localStorage.getItem("user") ?? "{}");
  const currentUserId = Number(
    rawUser?.id ?? rawUser?.usuario_id ?? rawUser?.user_id ?? null
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTicket, setSelectedTicket] = useState(null);

  // Modals state
  const [assignRedactorOpen, setAssignRedactorOpen] = useState(false);
  const [assignQualityOpen, setAssignQualityOpen] = useState(false);

  // Form states
  const [selectedUserId, setSelectedUserId] = useState("");
  const [observaciones, setObservaciones] = useState("");

  // Fetch all users for assignments
  const { data: usuarios = [] } = useUsuariosQuery();

  // Filter redactors and quality reviewers with robust fallback
  const redactorsList = useMemo(() => {
    const filtered = usuarios.filter((u) => {
      const rol = `${u.rolNombre ?? u.role ?? u.rol_nombre ?? ""}`.toLowerCase();
      return rol.includes("redac") || rol.includes("writer") || rol.includes("declar");
    });
    return filtered.length > 0 ? filtered : usuarios;
  }, [usuarios]);

  const qualityReviewersList = useMemo(() => {
    const filtered = usuarios.filter((u) => {
      const rol = `${u.rolNombre ?? u.role ?? u.rol_nombre ?? ""}`.toLowerCase();
      return rol.includes("quality") || rol.includes("auditor") || rol.includes("control");
    });
    return filtered.length > 0 ? filtered : usuarios;
  }, [usuarios]);

  // Queries
  const queryPendientesRedactor = useQuery({
    queryKey: ["redacciones", "pendientes-redactor"],
    queryFn: getPendientesRedactor,
    enabled: activeTab === "asignar_redactor",
  });

  const queryPendientesQuality = useQuery({
    queryKey: ["redacciones", "pendientes-quality"],
    queryFn: getPendientesQuality,
    enabled: activeTab === "asignar_quality",
  });

  const [isReassign, setIsReassign] = useState(false);

  const queryHistorial = useQuery({
    queryKey: ["redacciones", "historial-asignador", currentUserId],
    queryFn: () => getHistorialAsignadorRedaccion(currentUserId),
    enabled: activeTab === "historial" && Number.isFinite(currentUserId),
  });

  // Active data selection
  const { currentData, isLoading } = useMemo(() => {
    if (activeTab === "asignar_redactor") {
      return {
        currentData: queryPendientesRedactor.data ?? [],
        isLoading: queryPendientesRedactor.isLoading
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
  }, [activeTab, queryPendientesRedactor, queryPendientesQuality, queryHistorial]);

  // Mutations
  const assignRedactorMutation = useMutation({
    mutationFn: ({ expedienteId, payload }) =>
      asignarRedactor(expedienteId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["redacciones", "pendientes-redactor"] });
      Swal.fire({
        title: "Asignado",
        text: "El redactor ha sido asignado exitosamente.",
        icon: "success",
        confirmButtonColor: "#0e183f",
      });
      closeModal();
    },
    onError: (error) => {
      Swal.fire({
        title: "Error",
        text: error.message || "Ocurrió un error al asignar el redactor.",
        icon: "error",
        confirmButtonColor: "#0e183f",
      });
    }
  });

  const assignQualityMutation = useMutation({
    mutationFn: ({ expedienteId, payload }) =>
      asignarQuality(expedienteId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["redacciones", "pendientes-quality"] });
      Swal.fire({
        title: "Asignado",
        text: "El revisor de Quality Redacción ha sido asignado exitosamente.",
        icon: "success",
        confirmButtonColor: "#0e183f",
      });
      closeModal();
    },
    onError: (error) => {
      Swal.fire({
        title: "Error",
        text: error.message || "Ocurrió un error al asignar el revisor.",
        icon: "error",
        confirmButtonColor: "#0e183f",
      });
    }
  });

  const reasignarRedactorMutation = useMutation({
    mutationFn: ({ expedienteId, payload }) =>
      reasignarRedactor(expedienteId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["redacciones", "historial-asignador", currentUserId] });
      Swal.fire({
        title: "Reasignado",
        text: "El redactor ha sido reasignado exitosamente.",
        icon: "success",
        confirmButtonColor: "#0e183f",
      });
      closeModal();
    },
    onError: (error) => {
      Swal.fire({
        title: "Error",
        text: error.message || "Ocurrió un error al reasignar el redactor.",
        icon: "error",
        confirmButtonColor: "#0e183f",
      });
    }
  });

  const reasignarQualityMutation = useMutation({
    mutationFn: ({ expedienteId, payload }) =>
      reasignarQuality(expedienteId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["redacciones", "historial-asignador", currentUserId] });
      Swal.fire({
        title: "Reasignado",
        text: "El revisor de Quality ha sido reasignado exitosamente.",
        icon: "success",
        confirmButtonColor: "#0e183f",
      });
      closeModal();
    },
    onError: (error) => {
      Swal.fire({
        title: "Error",
        text: error.message || "Ocurrió un error al reasignar el revisor.",
        icon: "error",
        confirmButtonColor: "#0e183f",
      });
    }
  });

  const handleOpenAssignRedactor = (ticket) => {
    setSelectedTicket(ticket);
    setSelectedUserId("");
    setObservaciones("");
    setIsReassign(false);
    setAssignRedactorOpen(true);
  };

  const handleOpenReassignRedactor = (ticket) => {
    setSelectedTicket(ticket);
    setSelectedUserId(ticket.redactor_id || "");
    setObservaciones(ticket.observaciones || "");
    setIsReassign(true);
    setAssignRedactorOpen(true);
  };

  const handleOpenAssignQuality = (ticket) => {
    setSelectedTicket(ticket);
    setSelectedUserId("");
    setObservaciones("");
    setIsReassign(false);
    setAssignQualityOpen(true);
  };

  const handleOpenReassignQuality = (ticket) => {
    setSelectedTicket(ticket);
    setSelectedUserId(ticket.quality_id || "");
    setObservaciones(ticket.observaciones || "");
    setIsReassign(true);
    setAssignQualityOpen(true);
  };

  const closeModal = () => {
    setIsReassign(false);
    setAssignRedactorOpen(false);
    setAssignQualityOpen(false);
    setSelectedTicket(null);
    setSelectedUserId("");
    setObservaciones("");
  };

  const handleAssignRedactorSubmit = (e) => {
    e.preventDefault();
    if (!selectedTicket || !selectedUserId) return;

    const payload = {
      redaccion_id: selectedTicket.id || selectedTicket.redaccion_id,
      usuario_id: currentUserId,
      observaciones: observaciones.trim()
    };

    if (isReassign) {
      payload.nuevo_redactor_id = Number(selectedUserId);
      reasignarRedactorMutation.mutate({
        expedienteId: selectedTicket.expediente_id,
        payload
      });
    } else {
      payload.redactor_id = Number(selectedUserId);
      assignRedactorMutation.mutate({
        expedienteId: selectedTicket.expediente_id,
        payload
      });
    }
  };

  const handleAssignQualitySubmit = (e) => {
    e.preventDefault();
    if (!selectedTicket || !selectedUserId) return;

    const payload = {
      redaccion_id: selectedTicket.id || selectedTicket.redaccion_id,
      usuario_id: currentUserId,
      observaciones: observaciones.trim()
    };

    if (isReassign) {
      payload.nuevo_quality_id = Number(selectedUserId);
      reasignarQualityMutation.mutate({
        expedienteId: selectedTicket.expediente_id,
        payload
      });
    } else {
      payload.quality_id = Number(selectedUserId);
      assignQualityMutation.mutate({
        expedienteId: selectedTicket.expediente_id,
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
        `${item.redactor_nombre ?? ""}`.toLowerCase().includes(query) ||
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
        header: "Estado",
        accessor: "estado_redaccion",
        render: (val) => renderEstadoBadge(val)
      }
    ];

    if (activeTab === "asignar_redactor") {
      base.push(
        {
          header: "Urgente",
          accessor: "es_urgente",
          render: (val) => (
            <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-bold ${val ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-600'}`}>
              {val ? "SÍ" : "NO"}
            </span>
          )
        },
        {
          header: "Fecha Solicitud",
          accessor: "created_at",
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
          header: "Redactor",
          accessor: "redactor_nombre",
          render: (val) => (
            <span className="inline-flex rounded bg-blue-50 dark:bg-blue-950/30 px-2 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300">
              {val || "-"}
            </span>
          )
        },
        {
          header: "Fecha Envío",
          accessor: "updated_at",
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
          header: "Redactor",
          accessor: "redactor_nombre",
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
        title="Asignaciones - Redacción"
        subtitle="Asignación de Redactores y Revisores de Calidad para declaraciones de Asilo"
        Icon={PenTool}
        action={
          <div className="flex flex-col gap-3 sm:flex-row items-center w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Search size={16} />
              </span>
              <input
                type="text"
                placeholder="Buscar por expediente, cliente..."
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
            setActiveTab("asignar_redactor");
            setSearchQuery("");
          }}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-[12px] font-black uppercase tracking-[0.08em] transition-all duration-200 ${
            activeTab === "asignar_redactor"
              ? "text-[#fe7405] pl-3 border-l-[3px] border-l-[#fe7405] rounded-lg"
              : "text-[#0a1233] hover:text-[#0a1233] hover:bg-slate-100 dark:text-slate-200 dark:hover:text-white dark:hover:bg-slate-800 pl-4"
          }`}
        >
          <PenTool size={16} strokeWidth={2.2} />
          Asignación de Redactor
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
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-bold transition-all ${
            activeTab === "historial"
              ? "border-[#fe7405] text-[#fe7405]"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <History size={16} />
          Historial de Asignaciones
        </button>
      </div>

      {/* Table Section */}
      <Table
        columns={columns}
        data={filteredData}
        loading={isLoading}
        loadingLabel="Obteniendo declaraciones..."
        actions={(row) => (
          <div className="flex items-center justify-center">
            {activeTab === "asignar_redactor" && (
              <button
                type="button"
                onClick={() => handleOpenAssignRedactor(row)}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-[#fe7405] px-3.5 py-1 text-xs font-bold text-white shadow-sm transition hover:bg-[#e06300] hover:scale-[1.02] active:scale-95"
              >
                <PenTool size={14} />
                ASIGNAR REDACTOR
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
              const isFinished = ["APROBADO_QUALITY", "APROBADA_QUALITY", "APROBADA", "REDACCION_APROBADA", "ENVIADO_TRADUCCION", "ENVIADO_A_TRADUCCION"].includes(row.estado_redaccion);
              if (isFinished) {
                return <span className="text-xs text-slate-400 italic">Completado</span>;
              }
              return (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenReassignRedactor(row)}
                    className="inline-flex h-8 items-center justify-center gap-1 rounded bg-[#fe7405] px-2 py-0.5 text-[10px] font-bold text-white shadow-sm transition hover:bg-[#e06300] active:scale-95"
                  >
                    <RefreshCw size={10} />
                    REASIGNAR REDACTOR
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

      {/* MODAL: ASIGNAR REDACTOR */}
      {assignRedactorOpen && selectedTicket && (
        <ModalGeneral
          open
          onClose={closeModal}
          size="md"
          header={
            <div>
              <h3 className="text-md font-bold uppercase tracking-wide">{isReassign ? "Reasignar Redactor" : "Asignar Redactor"}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Expediente: {selectedTicket.codigo_expediente}</p>
            </div>
          }
        >
          <form onSubmit={handleAssignRedactorSubmit} className="space-y-4">
              <div className="space-y-1">
                <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Cliente</span>
                <span className="block text-sm font-semibold text-slate-800 dark:text-slate-200">{selectedTicket.cliente_nombre}</span>
              </div>
              <label className="block space-y-1">
                <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Seleccionar Redactor *</span>
                <select
                  required
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full h-10 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-sm outline-none transition focus:border-[#fe7405] focus:ring-1 focus:ring-[#fe7405]"
                >
                  <option value="">Seleccione un redactor...</option>
                  {redactorsList.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.nombre} ({user.rolNombre || user.role || user.rol_nombre || "Usuario"})
                    </option>
                  ))}
                </select>
              </label>
              <label className="block space-y-1">
                <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Instrucciones / Observaciones</span>
                <textarea
                  placeholder="Detalles o prioridades para la redacción..."
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
                  disabled={assignRedactorMutation.isPending || reasignarRedactorMutation.isPending}
                  className="h-10 rounded-lg bg-[#fe7405] px-5 text-sm font-semibold text-white shadow hover:bg-[#e06300] transition disabled:opacity-50"
                >
                  {assignRedactorMutation.isPending || reasignarRedactorMutation.isPending
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
      {assignQualityOpen && selectedTicket && (
        <ModalGeneral
          open
          onClose={closeModal}
          size="md"
          header={
            <div>
              <h3 className="text-md font-bold uppercase tracking-wide">{isReassign ? "Reasignar Revisor Quality" : "Asignar Revisor de Quality"}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Expediente: {selectedTicket.codigo_expediente}</p>
            </div>
          }
        >
          <form onSubmit={handleAssignQualitySubmit} className="space-y-4">
              <div className="space-y-1">
                <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Cliente</span>
                <span className="block text-sm font-semibold text-slate-800 dark:text-slate-200">{selectedTicket.cliente_nombre}</span>
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
