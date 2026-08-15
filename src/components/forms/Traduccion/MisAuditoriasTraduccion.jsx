import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  FileText,
  Search,
  ClipboardCheck,
  ClipboardX,
  ExternalLink,
  Download,
  Eye
} from "lucide-react";
import toast from "react-hot-toast";
import Swal from "sweetalert2";

import HeaderBox from "../../ui/HeaderBox";
import ModalGeneral from "../../ui/ModalGeneral";
import Table from "../../ui/Table";
import {
  getMisAsignacionesQuality,
  aprobarTraduccionQuality,
  rechazarTraduccionQuality
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

export default function MisAuditoriasTraduccion() {
  const queryClient = useQueryClient();

  // Get logged in user info
  const rawUser = JSON.parse(localStorage.getItem("user") ?? "{}");
  const currentUserId = Number(
    rawUser?.id ?? rawUser?.usuario_id ?? rawUser?.user_id ?? null
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDoc, setSelectedDoc] = useState(null);

  // Modals state
  const [auditOpen, setAuditOpen] = useState(false);
  const [rechazoOpen, setRechazoOpen] = useState(false);

  // Form states
  const [motivo, setMotivo] = useState("");
  const [observaciones, setObservaciones] = useState("");

  // React Query: fetch user's quality assignments
  const { data: asignaciones = [], isLoading } = useQuery({
    queryKey: ["traducciones", "quality", currentUserId],
    queryFn: () => getMisAsignacionesQuality(currentUserId),
    enabled: Number.isFinite(currentUserId),
  });

  // Mutations
  const approveMutation = useMutation({
    mutationFn: ({ expedienteId, documentoId, payload }) =>
      aprobarTraduccionQuality(expedienteId, documentoId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["traducciones", "quality", currentUserId] });
      toast.success("La traduccion ha sido aprobada y verificada exitosamente.");
      closeModal();
    },
    onError: (error) => {
      Swal.fire({
        title: "Error",
        text: error.message || "Ocurrió un error al aprobar la traducción.",
        icon: "error",
        confirmButtonColor: "#fe7405",
      });
    }
  });

  const rejectMutation = useMutation({
    mutationFn: ({ expedienteId, documentoId, payload }) =>
      rechazarTraduccionQuality(expedienteId, documentoId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["traducciones", "quality", currentUserId] });
      toast.success("La traduccion ha sido rechazada y devuelta al traductor.");
      closeModal();
    },
    onError: (error) => {
      Swal.fire({
        title: "Error",
        text: error.message || "Ocurrió un error al rechazar la traducción.",
        icon: "error",
        confirmButtonColor: "#fe7405",
      });
    }
  });

  const handleOpenAudit = (doc) => {
    setSelectedDoc(doc);
    setMotivo("");
    setObservaciones("");
    setRechazoOpen(false);
    setAuditOpen(true);
  };

  const closeModal = () => {
    setAuditOpen(false);
    setSelectedDoc(null);
    setMotivo("");
    setObservaciones("");
    setRechazoOpen(false);
  };

  const handleApprove = () => {
    if (!selectedDoc) return;
    Swal.fire({
      title: "¿Aprobar traducción?",
      text: "Se marcará la traducción como aprobada y verificada final.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, aprobar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#fe7405",
      cancelButtonColor: "#6b7280",
    }).then((result) => {
      if (result.isConfirmed) {
        approveMutation.mutate({
          expedienteId: selectedDoc.expediente_id,
          documentoId: selectedDoc.id,
          payload: {
            usuario_id: currentUserId,
            observaciones: "Aprobado por Quality",
          }
        });
      }
    });
  };

  const handleRejectSubmit = (e) => {
    e.preventDefault();
    if (!selectedDoc) return;
    if (!motivo.trim()) {
      Swal.fire({
        title: "Motivo requerido",
        text: "Debe escribir el motivo del rechazo.",
        icon: "warning",
        confirmButtonColor: "#fe7405",
      });
      return;
    }
    rejectMutation.mutate({
      expedienteId: selectedDoc.expediente_id,
      documentoId: selectedDoc.id,
      payload: {
        usuario_id: currentUserId,
        motivo: motivo.trim()
      }
    });
  };

  // Filter items
  const filteredData = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return asignaciones;
    return asignaciones.filter((item) => {
      return (
        `${item.codigo_expediente ?? ""}`.toLowerCase().includes(query) ||
        `${item.cliente_nombre ?? ""}`.toLowerCase().includes(query) ||
        `${item.nombre_documento ?? ""}`.toLowerCase().includes(query) ||
        `${item.traductor_nombre ?? ""}`.toLowerCase().includes(query)
      );
    });
  }, [asignaciones, searchQuery]);

  // Table columns
  const columns = [
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
      render: (val) => renderEstadoBadge(val)
    },
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
      header: "Fecha Asignación",
      accessor: "fecha_asignacion_quality",
      render: (val) => (
        <span className="text-xs font-semibold text-slate-500">
          {val ? new Date(val).toLocaleDateString() : "-"}
        </span>
      )
    }
  ];

  return (
    <section className="space-y-5">
      <HeaderBox
        title="Mis Qualities - Traducción"
        subtitle="Control de Calidad y Dictamen sobre Traducciones Asignadas"
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
              Pendientes: {filteredData.length}
            </div>
          </div>
        }
      />

      <Table
        columns={columns}
        data={filteredData}
        loading={isLoading}
        loadingLabel="Cargando mis asignaciones de revisión..."
        actions={(row) => (
          <div className="flex items-center justify-center">
            <button
              type="button"
              onClick={() => handleOpenAudit(row)}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-[#fe7405] px-3.5 py-1 text-xs font-bold text-white shadow-sm transition hover:bg-[#e06300] hover:scale-[1.02] active:scale-95"
            >
              <Eye size={14} />
              AUDITAR TRADUCCIÓN
            </button>
          </div>
        )}
      />

      {/* MODAL: AUDITORÍA (APROBAR / RECHAZAR) */}
      {auditOpen && selectedDoc && (
        <ModalGeneral
          open
          onClose={closeModal}
          size="lg"
          header={
            <div>
              <h3 className="text-md font-bold uppercase tracking-wide">Auditoría de Traducción</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Expediente: {selectedDoc.codigo_expediente}</p>
            </div>
          }
        >
          <div className="space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4 text-sm border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Cliente</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedDoc.cliente_nombre || "-"}</span>
                </div>
                <div>
                  <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Traductor</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedDoc.traductor_nombre || "-"}</span>
                </div>
                <div className="col-span-2">
                  <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Documento original</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedDoc.nombre_documento || "-"}</span>
                </div>
              </div>

              {/* Descargas */}
              <div className="space-y-2">
                <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Archivos</span>
                <div className="flex flex-col gap-2">
                  {selectedDoc.archivo_url && (
                    <a
                      href={selectedDoc.archivo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3 text-sm text-[#0e183f] dark:text-sky-400 hover:bg-slate-100 dark:hover:bg-slate-900 transition"
                    >
                      <span className="font-medium truncate pr-4 text-left">Documento Original</span>
                      <ExternalLink size={16} className="shrink-0 text-slate-400" />
                    </a>
                  )}
                  {selectedDoc.archivo_traduccion_url && (
                    <a
                      href={selectedDoc.archivo_traduccion_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between rounded-lg border border-orange-200 dark:border-orange-950 bg-orange-50/50 dark:bg-orange-950/20 p-3 text-sm text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/30 transition"
                    >
                      <span className="font-bold truncate pr-4 text-left">Traducción Recibida</span>
                      <Download size={16} className="shrink-0 text-orange-500" />
                    </a>
                  )}
                </div>
              </div>

              {/* Notas anteriores */}
              {selectedDoc.notes_traduccion || selectedDoc.notas_traduccion ? (
                <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 p-3 text-xs">
                  <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Historial de Observaciones</span>
                  <pre className="whitespace-pre-wrap font-sans text-slate-600 dark:text-slate-400">{selectedDoc.notas_traduccion || selectedDoc.notes_traduccion}</pre>
                </div>
              ) : null}

              {/* Formulario de Rechazo */}
              {rechazoOpen ? (
                <form onSubmit={handleRejectSubmit} className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800 animate-in slide-in-from-top-2">
                  <label className="block space-y-1">
                    <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Motivo del Rechazo *</span>
                    <textarea
                      required
                      placeholder="Escriba aquí las correcciones necesarias..."
                      value={motivo}
                      onChange={(e) => setMotivo(e.target.value)}
                      rows={3}
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 text-sm outline-none transition focus:border-red-500 focus:ring-1 focus:ring-red-500"
                    />
                  </label>
                  <div className="flex justify-end gap-2 pt-2">
                    <button type="button" onClick={() => setRechazoOpen(false)} className="h-10 rounded-lg px-4 text-sm font-semibold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800">Volver</button>
                    <button
                      type="submit"
                      disabled={rejectMutation.isPending}
                      className="h-10 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-700 transition"
                    >
                      {rejectMutation.isPending ? "Rechazando..." : "Confirmar Rechazo"}
                    </button>
                  </div>
                </form>
              ) : null}
          </div>

          {!rechazoOpen && (
            <footer className="flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800 pt-4">
                <button type="button" onClick={closeModal} className="h-10 rounded-lg px-4 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">Cerrar</button>
                <button
                  type="button"
                  onClick={() => setRechazoOpen(true)}
                  className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-red-200 dark:border-red-950 bg-red-50 dark:bg-red-950/20 px-4 text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/40 transition"
                >
                  <ClipboardX size={16} />
                  Rechazar
                </button>
                <button
                  type="button"
                  onClick={handleApprove}
                  disabled={approveMutation.isPending || !selectedDoc.archivo_traduccion_url}
                  className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white shadow hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ClipboardCheck size={16} />
                  {approveMutation.isPending ? "Aprobando..." : "Aprobar"}
                </button>
            </footer>
          )}
        </ModalGeneral>
      )}
    </section>
  );
}



