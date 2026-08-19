import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  FileText,
  Search,
  ClipboardCheck,
  ClipboardX,
  ExternalLink,
  Download,
  Eye,
  Languages
} from "lucide-react";
import Swal from "sweetalert2";

import HeaderBox from "../../ui/HeaderBox";
import ModalGeneral from "../../ui/ModalGeneral";
import Table from "../../ui/Table";
import {
  getMisAsignacionesQuality,
  aprobarQualityRedaccion,
  rechazarQualityRedaccion,
  enviarTraduccionRedaccion
} from "../../../services/redaccionServices";

const renderEstadoBadge = (estado) => {
  const map = {
    // Solicited / Pending
    SOLICITADA: { text: "Solicitada", classes: "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300" },
    REDACCION_SOLICITADA: { text: "Solicitada", classes: "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300" },
    SOLICITADA_PARALEGAL: { text: "Solicitada", classes: "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300" },
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
    EN_QUALITY_PENDIENTE_ASIGNACION: { text: "Listo para Quality", classes: "bg-cyan-100 text-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-300" },
    CORREGIDO_REDACTOR_QUALITY: { text: "Corregido p/ Quality", classes: "bg-cyan-100 text-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-300" },
    ASIGNADO_QUALITY: { text: "En revisión Quality", classes: "bg-cyan-100 text-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-300" },

    // Rejected by Quality
    RECHAZADO_QUALITY: { text: "Devuelto por Quality", classes: "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200" },
    RECHAZADA_QUALITY: { text: "Devuelto por Quality", classes: "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200" },
    DEVUELTO_QUALITY: { text: "Devuelto por Quality", classes: "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200" },
    DEVUELTO_POR_QUALITY: { text: "Devuelto por Quality", classes: "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200" },
    QUALITY_DEVUELTO_REDACTOR: { text: "Devuelto por Quality", classes: "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200" },

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

export default function MisAuditoriasRedaccion() {
  const queryClient = useQueryClient();

  // Get logged in user info
  const rawUser = JSON.parse(localStorage.getItem("user") ?? "{}");
  const currentUserId = Number(
    rawUser?.id ?? rawUser?.usuario_id ?? rawUser?.user_id ?? null
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTicket, setSelectedTicket] = useState(null);

  // Modals state
  const [auditOpen, setAuditOpen] = useState(false);
  const [rechazoOpen, setRechazoOpen] = useState(false);
  const [traduccionOpen, setTraduccionOpen] = useState(false);

  // Form states
  const [motivo, setMotivo] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [archivoFinalUrl, setArchivoFinalUrl] = useState("");

  // Query: fetch quality reviewer's assignments
  const { data: asignaciones = [], isLoading } = useQuery({
    queryKey: ["redacciones", "quality", currentUserId],
    queryFn: () => getMisAsignacionesQuality(currentUserId),
    enabled: Number.isFinite(currentUserId),
  });

  const approveMutation = useMutation({
    mutationFn: ({ expedienteId, payload }) =>
      enviarTraduccionRedaccion(expedienteId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["redacciones"] });
      Swal.fire({
        title: "Aprobada y Enviada",
        text: "La declaración ha sido aprobada y enviada directamente al departamento de traducción.",
        icon: "success",
        confirmButtonColor: "#0e183f",
      });
      closeModal();
    },
    onError: (error) => {
      Swal.fire({
        title: "Error",
        text: error.message || "Ocurrió un error al procesar la aprobación y envío.",
        icon: "error",
        confirmButtonColor: "#0e183f",
      });
    }
  });

  const rejectMutation = useMutation({
    mutationFn: ({ expedienteId, payload }) =>
      rechazarQualityRedaccion(expedienteId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["redacciones", "quality", currentUserId] });
      Swal.fire({
        title: "Rechazado",
        text: "La declaración ha sido rechazada y devuelta al redactor.",
        icon: "success",
        confirmButtonColor: "#0e183f",
      });
      closeModal();
    },
    onError: (error) => {
      Swal.fire({
        title: "Error",
        text: error.message || "Ocurrió un error al rechazar la declaración.",
        icon: "error",
        confirmButtonColor: "#0e183f",
      });
    }
  });

  const sendTraduccionMutation = useMutation({
    mutationFn: ({ expedienteId, payload }) =>
      enviarTraduccionRedaccion(expedienteId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["redacciones", "quality", currentUserId] });
      Swal.fire({
        title: "Enviado",
        text: "La declaración ha sido enviada al departamento de traducción.",
        icon: "success",
        confirmButtonColor: "#0e183f",
      });
      closeModal();
    },
    onError: (error) => {
      Swal.fire({
        title: "Error",
        text: error.message || "Ocurrió un error al enviar el documento a traducción.",
        icon: "error",
        confirmButtonColor: "#0e183f",
      });
    }
  });

  const handleOpenAudit = (ticket) => {
    setSelectedTicket(ticket);
    setMotivo("");
    setObservaciones("");
    setRechazoOpen(false);
    setTraduccionOpen(false);
    setAuditOpen(true);
  };

  const closeModal = () => {
    setAuditOpen(false);
    setSelectedTicket(null);
    setMotivo("");
    setObservaciones("");
    setRechazoOpen(false);
    setTraduccionOpen(false);
    setArchivoFinalUrl("");
  };

  const handleApprove = () => {
    if (!selectedTicket) return;
    Swal.fire({
      title: "¿Aprobar y enviar a traducción?",
      text: "Se aprobará la declaración y se enviará directamente al departamento de traducción.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sí, aprobar y enviar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#10b981",
      cancelButtonColor: "#6b7280",
    }).then((result) => {
      if (result.isConfirmed) {
        approveMutation.mutate({
          expedienteId: selectedTicket.expediente_id,
          payload: {
            redaccion_id: selectedTicket.id || selectedTicket.redaccion_id,
            usuario_id: currentUserId,
            archivo_declaracion_url: selectedTicket.archivo_declaracion_url,
            observaciones: "Aprobado y enviado automáticamente por Quality Control"
          }
        });
      }
    });
  };

  const handleRejectSubmit = (e) => {
    e.preventDefault();
    if (!selectedTicket) return;
    if (!motivo.trim()) {
      Swal.fire({
        title: "Motivo requerido",
        text: "Debe escribir el motivo del rechazo.",
        icon: "warning",
        confirmButtonColor: "#0e183f",
      });
      return;
    }
    rejectMutation.mutate({
      expedienteId: selectedTicket.expediente_id,
      payload: {
        redaccion_id: selectedTicket.id || selectedTicket.redaccion_id,
        usuario_id: currentUserId,
        motivo: motivo.trim(),
        observaciones: observaciones.trim()
      }
    });
  };

  const handleSendTraduccionSubmit = (e) => {
    e.preventDefault();
    if (!selectedTicket) return;
    const finalUrl = archivoFinalUrl.trim() || selectedTicket.archivo_declaracion_url;
    if (!finalUrl) {
      Swal.fire({
        title: "Campo requerido",
        text: "Debe ingresar el enlace final de la declaración redactada.",
        icon: "warning",
        confirmButtonColor: "#0e183f",
      });
      return;
    }
    sendTraduccionMutation.mutate({
      expedienteId: selectedTicket.expediente_id,
      payload: {
        redaccion_id: selectedTicket.id || selectedTicket.redaccion_id,
        usuario_id: currentUserId,
        archivo_declaracion_url: finalUrl,
        observaciones: observaciones.trim()
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
        `${item.redactor_nombre ?? ""}`.toLowerCase().includes(query)
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
      header: "Estado",
      accessor: "estado_redaccion",
      align: "center",
      render: (val) => renderEstadoBadge(val)
    },
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
        title="Mis Qualities - Redacción"
        subtitle="Control de Calidad y Envío a Traducción de las declaraciones redactadas"
        Icon={FileText}
        action={
          <div className="flex flex-col gap-3 sm:flex-row items-center w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Search size={16} />
              </span>
              <input
                type="text"
                placeholder="Buscar por expediente, cliente, redactor..."
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
        loadingLabel="Cargando tus revisiones..."
        actions={(row) => (
          <div className="flex items-center justify-center">
            <button
              type="button"
              onClick={() => handleOpenAudit(row)}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-[#fe7405] px-3.5 py-1 text-xs font-bold text-white shadow-sm transition hover:bg-[#e06300] hover:scale-[1.02] active:scale-95"
            >
              <Eye size={14} />
              AUDITAR DECLARACIÓN
            </button>
          </div>
        )}
      />

      {/* MODAL: AUDITORÍA */}
      {auditOpen && selectedTicket && (
        <ModalGeneral
          open
          onClose={closeModal}
          size="lg"
          header={
            <div>
              <h3 className="text-md font-bold uppercase tracking-wide">Auditoría de Declaración</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Expediente: {selectedTicket.codigo_expediente}</p>
            </div>
          }
        >
          <div className="space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4 text-sm border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Cliente</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedTicket.cliente_nombre || "-"}</span>
                </div>
                <div>
                  <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Redactor</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedTicket.redactor_nombre || "-"}</span>
                </div>
              </div>

              {/* Descargas */}
              <div className="space-y-2">
                <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Archivos</span>
                <div className="flex flex-col gap-2">
                  {selectedTicket.archivo_declaracion_url && (
                    <a
                      href={selectedTicket.archivo_declaracion_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between rounded-lg border border-orange-200 dark:border-orange-950 bg-orange-50/50 dark:bg-orange-950/20 p-3 text-sm text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/30 transition"
                    >
                      <span className="font-bold truncate pr-4 text-left">Borrador de Declaración Recibido</span>
                      <Download size={16} className="shrink-0 text-orange-500" />
                    </a>
                  )}
                </div>
              </div>

              {/* Historial observaciones */}
              {selectedTicket.notas_quality && (
                <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 p-3 text-xs">
                  <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Observaciones Históricas</span>
                  <pre className="whitespace-pre-wrap font-sans text-slate-600 dark:text-slate-400">{selectedTicket.notas_quality}</pre>
                </div>
              )}

              {/* Formulario de Rechazo */}
              {rechazoOpen && (
                <form onSubmit={handleRejectSubmit} className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800 animate-in slide-in-from-top-2">
                  <label className="block space-y-1">
                    <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Motivo del Rechazo *</span>
                    <textarea
                      required
                      placeholder="Escriba aquí los cambios y correcciones solicitados..."
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
              )}

              {/* Formulario de Envío a Traducción */}
              {traduccionOpen && (
                <form onSubmit={handleSendTraduccionSubmit} className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800 animate-in slide-in-from-top-2">
                  <label className="block space-y-1">
                    <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Enlace/URL del Documento Final *</span>
                    <input
                      required
                      type="url"
                      placeholder="Enlace al documento aprobado..."
                      value={archivoFinalUrl || selectedTicket.archivo_declaracion_url || ""}
                      onChange={(e) => setArchivoFinalUrl(e.target.value)}
                      className="w-full h-10 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    />
                  </label>
                  <label className="block space-y-1">
                    <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Instrucciones para Traducción</span>
                    <textarea
                      placeholder="Notas adicionales para el traductor (opcional)..."
                      value={observaciones}
                      onChange={(e) => setObservaciones(e.target.value)}
                      rows={3}
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 text-sm outline-none transition focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    />
                  </label>
                  <div className="flex justify-end gap-2 pt-2">
                    <button type="button" onClick={() => setTraduccionOpen(false)} className="h-10 rounded-lg px-4 text-sm font-semibold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800">Volver</button>
                    <button
                      type="submit"
                      disabled={sendTraduccionMutation.isPending}
                      className="h-10 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700 transition"
                    >
                      {sendTraduccionMutation.isPending ? "Enviando..." : "Confirmar Envío"}
                    </button>
                  </div>
                </form>
              )}
          </div>

          {!rechazoOpen && !traduccionOpen && (
            <footer className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800 pt-4">
                <button type="button" onClick={closeModal} className="h-10 rounded-lg px-4 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">Cerrar</button>
                
                {["EN_REVISION_QUALITY", "EN_QUALITY", "ENVIADO_QUALITY", "ENVIADO_A_QUALITY", "ASIGNADO_QUALITY", "CORREGIDO_REDACTOR_QUALITY"].includes(selectedTicket.estado_redaccion) && (
                  <>
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
                      disabled={approveMutation.isPending || !selectedTicket.archivo_declaracion_url}
                      className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white shadow hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ClipboardCheck size={16} />
                      {approveMutation.isPending ? "Aprobando..." : "Aprobar"}
                    </button>
                  </>
                )}

                {["APROBADO_QUALITY", "REDACCION_APROBADA"].includes(selectedTicket.estado_redaccion) && (
                  <button
                    type="button"
                    onClick={() => {
                      setArchivoFinalUrl(selectedTicket.archivo_declaracion_url || "");
                      setTraduccionOpen(true);
                    }}
                    className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-teal-600 px-4 text-sm font-semibold text-white shadow hover:bg-teal-700 transition"
                  >
                    <Languages size={16} />
                    Enviar a Traducción
                  </button>
                )}
            </footer>
          )}
        </ModalGeneral>
      )}
    </section>
  );
}
