import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  FileText,
  Search,
  PhoneCall,
  NotebookPen,
  UploadCloud,
  ExternalLink,
  BookOpen,
  Calendar
} from "lucide-react";
import toast from "react-hot-toast";
import Swal from "sweetalert2";

import HeaderBox from "../../ui/HeaderBox";
import ModalGeneral from "../../ui/ModalGeneral";
import Table from "../../ui/Table";
import { invalidateWorkflowQueries, workflowInvalidations } from "../../../utils/queryKeys";
import {
  getMisAsignacionesRedactor,
  registrarContactoRedactor,
  tomaDeclaracionRedactor,
  enviarQualityRedactor,
  reenviarQualityRedactor
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

export default function MisRedacciones() {
  const queryClient = useQueryClient();

  // Get logged in user info
  const rawUser = JSON.parse(localStorage.getItem("user") ?? "{}");
  const currentUserId = Number(
    rawUser?.id ?? rawUser?.usuario_id ?? rawUser?.user_id ?? null
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTicket, setSelectedTicket] = useState(null);

  // Modals state
  const [contactoOpen, setContactoOpen] = useState(false);
  const [tomaOpen, setTomaOpen] = useState(false);
  const [enviarQualityOpen, setEnviarQualityOpen] = useState(false);

  // Form states
  const [contesto, setContesto] = useState(true);
  const [fechaLlamadaProgramada, setFechaLlamadaProgramada] = useState("");
  const [archivoDeclaracionUrl, setArchivoDeclaracionUrl] = useState("");
  const [observaciones, setObservaciones] = useState("");

  // Fetch redactor assignments
  const { data: asignaciones = [], isLoading } = useQuery({
    queryKey: ["redacciones", "redactor", currentUserId],
    queryFn: () => getMisAsignacionesRedactor(currentUserId),
    enabled: Number.isFinite(currentUserId),
  });

  // Mutations
  const registrarContactoMutation = useMutation({
    mutationFn: ({ expedienteId, payload }) =>
      registrarContactoRedactor(expedienteId, payload),
    onSuccess: async () => {
      await invalidateWorkflowQueries(queryClient, workflowInvalidations.redaccion.registrarContacto);
      toast.success("El contacto con el cliente ha sido registrado exitosamente.");
      closeModal();
    },
    onError: (error) => {
      Swal.fire({
        title: "Error",
        text: error.message || "Ocurrió un error al registrar el contacto.",
        icon: "error",
        confirmButtonColor: "#fe7405",
      });
    }
  });

  const iniciarTomaMutation = useMutation({
    mutationFn: ({ expedienteId, payload }) =>
      tomaDeclaracionRedactor(expedienteId, payload),
    onSuccess: async () => {
      await invalidateWorkflowQueries(queryClient, workflowInvalidations.redaccion.iniciarToma);
      toast.success("Se ha iniciado la etapa de toma de declaración.");
      closeModal();
    },
    onError: (error) => {
      Swal.fire({
        title: "Error",
        text: error.message || "Ocurrió un error al iniciar la toma de declaración.",
        icon: "error",
        confirmButtonColor: "#fe7405",
      });
    }
  });

  const enviarQualityMutation = useMutation({
    mutationFn: ({ expedienteId, isReenvio, payload }) => {
      if (isReenvio) {
        return reenviarQualityRedactor(expedienteId, payload);
      }
      return enviarQualityRedactor(expedienteId, payload);
    },
    onSuccess: async () => {
      await invalidateWorkflowQueries(queryClient, workflowInvalidations.redaccion.enviarQuality);
      toast.success("La declaración redactada ha sido enviada a revisión de Quality Control.");
      closeModal();
    },
    onError: (error) => {
      Swal.fire({
        title: "Error",
        text: error.message || "Ocurrió un error al enviar el documento.",
        icon: "error",
        confirmButtonColor: "#fe7405",
      });
    }
  });

  const handleOpenContacto = (ticket) => {
    setSelectedTicket(ticket);
    setContesto(true);
    setFechaLlamadaProgramada("");
    setObservaciones("");
    setContactoOpen(true);
  };

  const handleOpenToma = (ticket) => {
    setSelectedTicket(ticket);
    setObservaciones("");
    setTomaOpen(true);
  };

  const handleOpenEnviarQuality = (ticket) => {
    setSelectedTicket(ticket);
    setArchivoDeclaracionUrl("");
    setObservaciones("");
    setEnviarQualityOpen(true);
  };

  const closeModal = () => {
    setContactoOpen(false);
    setTomaOpen(false);
    setEnviarQualityOpen(false);
    setSelectedTicket(null);
    setContesto(true);
    setFechaLlamadaProgramada("");
    setArchivoDeclaracionUrl("");
    setObservaciones("");
  };

  const handleContactoSubmit = (e) => {
    e.preventDefault();
    if (!selectedTicket) return;
    registrarContactoMutation.mutate({
      expedienteId: selectedTicket.expediente_id,
      payload: {
        redaccion_id: selectedTicket.id || selectedTicket.redaccion_id,
        contesto,
        usuario_id: currentUserId,
        fecha_llamada_programada: fechaLlamadaProgramada || null,
        observaciones: observaciones.trim()
      }
    });
  };

  const handleTomaSubmit = (e) => {
    e.preventDefault();
    if (!selectedTicket) return;
    iniciarTomaMutation.mutate({
      expedienteId: selectedTicket.expediente_id,
      payload: {
        redaccion_id: selectedTicket.id || selectedTicket.redaccion_id,
        usuario_id: currentUserId,
        observaciones: observaciones.trim()
      }
    });
  };

  const handleEnviarQualitySubmit = (e) => {
    e.preventDefault();
    if (!selectedTicket) return;
    if (!archivoDeclaracionUrl.trim()) {
      Swal.fire({
        title: "Campo requerido",
        text: "Debe ingresar el enlace de la declaración redactada.",
        icon: "warning",
        confirmButtonColor: "#fe7405",
      });
      return;
    }

    const isReenvio = ["RECHAZADO_QUALITY", "RECHAZADA_QUALITY", "DEVUELTO_QUALITY", "DEVUELTO_POR_QUALITY"].includes(selectedTicket.estado_redaccion);

    enviarQualityMutation.mutate({
      expedienteId: selectedTicket.expediente_id,
      isReenvio,
      payload: {
        redaccion_id: selectedTicket.id || selectedTicket.redaccion_id,
        usuario_id: currentUserId,
        archivo_declaracion_url: archivoDeclaracionUrl.trim(),
        observaciones: observaciones.trim()
      }
    });
  };

  // Filter list
  const filteredData = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return asignaciones;
    return asignaciones.filter((item) => {
      return (
        `${item.codigo_expediente ?? ""}`.toLowerCase().includes(query) ||
        `${item.cliente_nombre ?? ""}`.toLowerCase().includes(query)
      );
    });
  }, [asignaciones, searchQuery]);

  // Columns for redactor
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
      header: "Fecha Asignación",
      accessor: "fecha_asignacion_redactor",
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
        title="Mis Redacciones Asignadas"
        subtitle="Registra el contacto, realiza la toma de declaración o envía el borrador finalizado a Quality"
        Icon={BookOpen}
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
              Tareas activas: {filteredData.length}
            </div>
          </div>
        }
      />

      <Table
        columns={columns}
        data={filteredData}
        loading={isLoading}
        loadingLabel="Cargando tus asignaciones..."
        actions={(row) => {
          const isFinished = ["APROBADO_QUALITY", "APROBADA_QUALITY", "APROBADA", "REDACCION_APROBADA", "ENVIADO_TRADUCCION", "ENVIADO_A_TRADUCCION"].includes(row.estado_redaccion);
          if (isFinished) return <span className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-100/50 px-2 py-0.5 text-[9.5px] font-black uppercase tracking-wide text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300">Completado</span>;

          return (
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => handleOpenContacto(row)}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-blue-200 dark:border-blue-950 bg-blue-50 dark:bg-blue-950/20 px-3 py-1 text-xs font-bold text-blue-600 dark:text-blue-400 transition hover:bg-blue-100 dark:hover:bg-blue-950/40 active:scale-95"
              >
                <PhoneCall size={14} />
                REGISTRAR CONTACTO
              </button>

              {["ASIGNADO_REDACTOR", "REDACCION_ASIGNADA", "REDACCION_ASIGNADO", "ASIGNADO", "CONTACTO_REGISTRADO", "CONTACTO_CLIENTE", "CONTACTO"].includes(row.estado_redaccion) && (
                <button
                  type="button"
                  onClick={() => handleOpenToma(row)}
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-orange-500 px-3 py-1 text-xs font-bold text-white shadow-sm transition hover:bg-orange-600 hover:scale-[1.02] active:scale-95"
                >
                  <NotebookPen size={14} />
                  INICIAR TOMA
                </button>
              )}

              {["EN_TOMA_DECLARACION", "TOMA_DECLARACION", "TOMA_DECLARACION_EN_CURSO", "RECHAZADO_QUALITY", "RECHAZADA_QUALITY", "DEVUELTO_QUALITY", "DEVUELTO_POR_QUALITY"].includes(row.estado_redaccion) && (
                <button
                  type="button"
                  onClick={() => handleOpenEnviarQuality(row)}
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-[#fe7405] px-3 py-1 text-xs font-bold text-white shadow-sm transition hover:bg-[#e06300] hover:scale-[1.02] active:scale-95"
                >
                  <UploadCloud size={14} />
                  ENVIAR A QUALITY
                </button>
              )}
            </div>
          );
        }}
      />

      {/* MODAL: REGISTRAR CONTACTO */}
      {contactoOpen && selectedTicket && (
        <ModalGeneral
          open
          onClose={closeModal}
          size="md"
          header={
            <div>
              <h3 className="text-md font-bold uppercase tracking-wide">Registrar Contacto</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Expediente: {selectedTicket.codigo_expediente}</p>
            </div>
          }
        >
          <form onSubmit={handleContactoSubmit} className="space-y-4">
              <div className="space-y-1">
                <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Cliente</span>
                <span className="block text-sm font-semibold text-slate-800 dark:text-slate-200">{selectedTicket.cliente_nombre}</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="contesto"
                  checked={contesto}
                  onChange={(e) => setContesto(e.target.checked)}
                  className="h-4.5 w-4.5 cursor-pointer rounded border-slate-300 text-[#fe7405] focus:ring-[#fe7405]/30"
                />
                <label htmlFor="contesto" className="text-sm font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">¿El cliente contestó la llamada?</label>
              </div>

              <label className="block space-y-1">
                <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <Calendar size={12} />
                  Programar llamada (Opcional)
                </span>
                <input
                  type="datetime-local"
                  value={fechaLlamadaProgramada}
                  onChange={(e) => setFechaLlamadaProgramada(e.target.value)}
                  className="w-full h-10 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-sm outline-none transition focus:border-[#fe7405] focus:ring-1 focus:ring-[#fe7405]"
                />
              </label>

              <label className="block space-y-1">
                <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Detalles / Notas de la llamada</span>
                <textarea
                  placeholder="Detalles sobre lo conversado..."
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
                  disabled={registrarContactoMutation.isPending}
                  className="h-10 rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white shadow hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {registrarContactoMutation.isPending ? "Guardando..." : "Registrar"}
                </button>
              </div>
          </form>
        </ModalGeneral>
      )}

      {/* MODAL: INICIAR TOMA DE DECLARACIÓN */}
      {tomaOpen && selectedTicket && (
        <ModalGeneral
          open
          onClose={closeModal}
          size="md"
          header={
            <div>
              <h3 className="text-md font-bold uppercase tracking-wide">Iniciar Toma de Declaración</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Expediente: {selectedTicket.codigo_expediente}</p>
            </div>
          }
        >
          <form onSubmit={handleTomaSubmit} className="space-y-4">
              <div className="space-y-1">
                <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Cliente</span>
                <span className="block text-sm font-semibold text-slate-800 dark:text-slate-200">{selectedTicket.cliente_nombre}</span>
              </div>
              <div className="rounded-lg border border-orange-200 bg-orange-50/50 p-4 text-xs text-orange-800">
                Al iniciar la toma, el estado del ticket cambiará a "Toma de Declaración" para indicar que estás en entrevista con el cliente.
              </div>
              <label className="block space-y-1">
                <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Observaciones Iniciales</span>
                <textarea
                  placeholder="Detalles sobre el inicio del proceso..."
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 text-sm outline-none transition focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                />
              </label>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={closeModal} className="h-10 rounded-lg px-4 text-sm font-semibold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800">Cancelar</button>
                <button
                  type="submit"
                  disabled={iniciarTomaMutation.isPending}
                  className="h-10 rounded-lg bg-orange-500 px-5 text-sm font-semibold text-white shadow hover:bg-orange-600 transition disabled:opacity-50"
                >
                  {iniciarTomaMutation.isPending ? "Iniciando..." : "Iniciar"}
                </button>
              </div>
          </form>
        </ModalGeneral>
      )}

      {/* MODAL: ENVIAR A QUALITY */}
      {enviarQualityOpen && selectedTicket && (
        <ModalGeneral
          open
          onClose={closeModal}
          size="lg"
          header={
            <div>
              <h3 className="text-md font-bold uppercase tracking-wide">Enviar declaración a Quality</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Expediente: {selectedTicket.codigo_expediente}</p>
            </div>
          }
        >
          <form onSubmit={handleEnviarQualitySubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Cliente</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedTicket.cliente_nombre || "-"}</span>
                </div>
              </div>

              {selectedTicket.notas_quality && (
                <div className="rounded-lg border border-red-200 bg-red-50/50 p-4 text-xs text-red-800 dark:border-red-950/20 dark:bg-red-950/20 dark:text-red-400">
                  <p className="font-bold uppercase">Observaciones previas de Quality:</p>
                  <p className="mt-1 whitespace-pre-wrap">{selectedTicket.notas_quality}</p>
                </div>
              )}

              <label className="block space-y-1">
                <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Enlace/URL del Documento Redactado *</span>
                <input
                  required
                  type="url"
                  placeholder="https://drive.google.com/file/... o similar"
                  value={archivoDeclaracionUrl}
                  onChange={(e) => setArchivoDeclaracionUrl(e.target.value)}
                  className="w-full h-10 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-sm outline-none transition focus:border-[#fe7405] focus:ring-1 focus:ring-[#fe7405]"
                />
              </label>

              <label className="block space-y-1">
                <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Observaciones del Redactor</span>
                <textarea
                  placeholder="Notas adicionales sobre la redacción final..."
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
                  disabled={enviarQualityMutation.isPending}
                  className="h-10 rounded-lg bg-[#fe7405] px-5 text-sm font-semibold text-white shadow hover:bg-[#e06300] transition disabled:opacity-50"
                >
                  {enviarQualityMutation.isPending ? "Enviando..." : "Enviar a Quality"}
                </button>
              </div>
          </form>
        </ModalGeneral>
      )}
    </section>
  );
}
