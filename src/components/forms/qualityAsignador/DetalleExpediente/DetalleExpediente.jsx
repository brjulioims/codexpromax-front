import { useState } from "react";
import {
  BriefcaseBusiness,
  FileText,
  ChevronLeft,
  User,
  MapPin,
  Calendar,
  Layers,
  AlertCircle,
  Clock,
  Activity,
  PenTool,
  Plus,
  Loader2,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import HeaderBox from "../../../ui/HeaderBox";
import DocumentacionExpediente from "./DocumentacionExpediente";
import ModalGeneral from "../../../ui/ModalGeneral";
import { getRedaccionEstado } from "../../../../services/redaccionServices";
import { solicitarRedaccion } from "../../../../services/paralegalServices";
import { invalidateWorkflowQueries, workflowInvalidations } from "../../../../utils/queryKeys";

export default function DetalleExpediente() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const expediente = state?.expediente ?? {};
  const [activeTab, setActiveTab] = useState("basica");
  const nombre = expediente.nombre || "Detalle del expediente";
  const expedienteId = expediente?.expediente_id ?? expediente?.id;
  const queryClient = useQueryClient();

  const rawUser = JSON.parse(localStorage.getItem("user") ?? "{}");
  const currentUserId = Number(
    rawUser?.id ?? rawUser?.usuario_id ?? rawUser?.user_id ?? null
  );

  const proceso = String(expediente.proceso ?? expediente.tipo_proceso ?? "").toUpperCase();
  const categoria = String(expediente.categoria ?? expediente.categoria_proceso ?? "").toUpperCase();
  const esAsilo = proceso.includes("ASILO") || categoria.includes("ASILO");

  const { data: redaccion, isLoading: cargandoRedaccion, refetch: refetchRedaccion } = useQuery({
    queryKey: ["redaccion-estado", expedienteId],
    queryFn: () => getRedaccionEstado(expedienteId),
    enabled: !!expedienteId && esAsilo,
  });

  const [modalSolicitarOpen, setModalSolicitarOpen] = useState(false);
  const [origenSolicitud, setOrigenSolicitud] = useState("SOLICITUD_GENERAL");
  const [esUrgente, setEsUrgente] = useState(false);
  const [observacionesRedaccion, setObservacionesRedaccion] = useState("");

  const solicitarRedaccionMutation = useMutation({
    mutationFn: () => solicitarRedaccion(expedienteId, {
      origen_solicitud: origenSolicitud,
      es_urgente: esUrgente,
      observaciones: observacionesRedaccion.trim(),
      usuario_id: currentUserId
    }),
    onSuccess: async () => {
      toast.success("Solicitud de redacción creada correctamente.");
      setModalSolicitarOpen(false);
      setObservacionesRedaccion("");
      setEsUrgente(false);
      await invalidateWorkflowQueries(
        queryClient,
        workflowInvalidations.quality.solicitarRedaccion(expedienteId)
      );
      refetchRedaccion();
    },
    onError: (err) => {
      console.error("Error al solicitar redacción:", err);
      toast.error(err?.message || "No se pudo crear la solicitud de redacción.");
    }
  });

  const handleSolicitarSubmit = (e) => {
    e.preventDefault();
    if (!currentUserId) {
      toast.error("No hay usuario autenticado.");
      return;
    }
    solicitarRedaccionMutation.mutate();
  };

  const renderEstadoBadge = (estado) => {
    const map = {
      SOLICITADA: { text: "Solicitada", classes: "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300" },
      REDACCION_SOLICITADA: { text: "Solicitada", classes: "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300" },
      SOLICITADA_PARALEGAL: { text: "Solicitada", classes: "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300" },
      PENDIENTE_ASIGNACION: { text: "Pendiente Asignación", classes: "bg-slate-100 text-slate-800 dark:bg-slate-800/40 dark:text-slate-400" },
      ASIGNADO_REDACTOR: { text: "Asignado a Redactor", classes: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300" },
      REDACCION_ASIGNADA: { text: "Asignado a Redactor", classes: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300" },
      REDACCION_ASIGNADO: { text: "Asignado a Redactor", classes: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300" },
      ASIGNADO: { text: "Asignado", classes: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300" },
      CONTACTO_REGISTRADO: { text: "Contacto Registrado", classes: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300" },
      CONTACTO_CLIENTE: { text: "Contacto Registrado", classes: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300" },
      CONTACTO: { text: "Contacto Registrado", classes: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300" },
      EN_CONTACTO_CLIENTE: { text: "Contacto Registrado", classes: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300" },
      EN_TOMA_DECLARACION: { text: "Toma de Declaración", classes: "bg-orange-100 text-orange-800 dark:bg-orange-950/40 dark:text-orange-300" },
      TOMA_DECLARACION: { text: "Toma de Declaración", classes: "bg-orange-100 text-orange-800 dark:bg-orange-950/40 dark:text-orange-300" },
      TOMA_DECLARACION_EN_CURSO: { text: "Toma de Declaración", classes: "bg-orange-100 text-orange-800 dark:bg-orange-950/40 dark:text-orange-300" },
      EN_REVISION_QUALITY: { text: "En revisión Quality", classes: "bg-cyan-100 text-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-300" },
      ENVIADO_QUALITY: { text: "En revisión Quality", classes: "bg-cyan-100 text-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-300" },
      ENVIADO_A_QUALITY: { text: "En revisión Quality", classes: "bg-cyan-100 text-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-300" },
      EN_QUALITY: { text: "En revisión Quality", classes: "bg-cyan-100 text-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-300" },
      EN_QUALITY_PENDIENTE_ASIGNACION: { text: "Listo para Quality", classes: "bg-cyan-100 text-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-300" },
      CORREGIDO_REDACTOR_QUALITY: { text: "Corregido p/ Quality", classes: "bg-cyan-100 text-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-300" },
      ASIGNADO_QUALITY: { text: "En revisión Quality", classes: "bg-cyan-100 text-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-300" },
      RECHAZADO_QUALITY: { text: "Devuelto por Quality", classes: "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200" },
      RECHAZADA_QUALITY: { text: "Devuelto por Quality", classes: "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200" },
      DEVUELTO_QUALITY: { text: "Devuelto por Quality", classes: "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200" },
      DEVUELTO_POR_QUALITY: { text: "Devuelto por Quality", classes: "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200" },
      QUALITY_DEVUELTO_REDACTOR: { text: "Devuelto por Quality", classes: "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200" },
      APROBADO_QUALITY: { text: "Aprobada por Quality", classes: "bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300" },
      APROBADA_QUALITY: { text: "Aprobada por Quality", classes: "bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300" },
      APROBADA: { text: "Aprobada", classes: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300" },
      REDACCION_APROBADA: { text: "Aprobada", classes: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300" },
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

  // Determinar color de prioridad
  const getPrioridadBadge = (prioridad) => {
    const prio = String(prioridad ?? "").toUpperCase();
    if (prio === "ALTA" || prio === "URGENTE") {
      return "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/50";
    }
    if (prio === "MEDIA") {
      return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/50";
    }
    return "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800";
  };

  return (
    <section className="w-full space-y-5">
      {/* HEADERBOX REUTILIZADO */}
      <HeaderBox
        Icon={BriefcaseBusiness}
        title={
          <div className="flex items-center gap-3">
            <span>{nombre}</span>
            {expediente.prioridad && (
              <span className={`rounded-lg border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${getPrioridadBadge(expediente.prioridad)}`}>
                {expediente.prioridad}
              </span>
            )}
          </div>
        }
        subtitle={expediente.numeroExpediente || "Expediente sin número"}
        action={
          <button
            type="button"
            onClick={() => navigate("/quality_asignador")}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800/80"
          >
            <ChevronLeft size={16} />
            Regresar
          </button>
        }
      />

      {/* FILA UNIFICADA: TABS (IZQUIERDA) Y AVANCE (DERECHA) */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* SELECTOR DE PESTAÑAS CON FONDO AZUL + PESTAÑA ACTIVA NARANJA */}
        <div className="inline-flex items-center gap-1 self-start rounded-xl border border-[#0a1233]/10 bg-gradient-to-r from-[#ffffff] to-[#ffffff]/85 px-2 py-2 shadow-[0_8px_24px_rgba(10,18,51,0.18)] dark:border-slate-800 dark:bg-slate-900 dark:from-slate-900 dark:to-slate-900/85 dark:shadow-[0_8px_24px_rgba(2,6,23,0.45)]">
          <button
            type="button"
            onClick={() => setActiveTab("basica")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-[12px] font-black uppercase tracking-[0.08em] transition-all duration-200 ${
              activeTab === "basica"
                ? "text-[#fe7405] pl-3 border-l-[3px] border-l-[#fe7405] rounded-lg"
                : "text-[#0a1233] hover:text-[#0a1233] hover:bg-slate-100 dark:text-slate-200 dark:hover:text-white dark:hover:bg-slate-800 pl-4"
            }`}
          >
            <BriefcaseBusiness size={16} strokeWidth={2.2} />
            Información General
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("documentacion")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-[12px] font-black uppercase tracking-[0.08em] transition-all duration-200 ${
              activeTab === "documentacion"
                ? "text-[#fe7405] pl-3 border-l-[3px] border-l-[#fe7405] rounded-lg"
                : "text-[#0a1233] hover:text-[#0a1233] hover:bg-slate-100 dark:text-slate-200 dark:hover:text-white dark:hover:bg-slate-800 pl-4"
            }`}
          >
            <FileText size={16} strokeWidth={2.2} />
            Requisitos del Expediente
          </button>
        </div>
      </div>

      {/* CONTENIDO PRINCIPAL */}
      {activeTab === "basica" ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* PANEL: DETALLES DEL PROCESO */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
            <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-white">
                Detalles del Caso
              </h3>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              <div className="flex items-center justify-between px-5 py-3.5">
                <span className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  <BriefcaseBusiness size={14} />
                  N° Expediente
                </span>
                <span className="text-xs font-bold text-slate-800 dark:text-white">
                  {expediente.numeroExpediente || "-"}
                </span>
              </div>
              <div className="flex items-center justify-between px-5 py-3.5">
                <span className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  <User size={14} />
                  Cliente
                </span>
                <span className="text-xs font-bold text-slate-800 dark:text-white">
                  {nombre}
                </span>
              </div>
              <div className="flex items-center justify-between px-5 py-3.5">
                <span className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  <Layers size={14} />
                  Categoría de Proceso
                </span>
                <span className="text-xs font-bold text-slate-800 dark:text-white">
                  {expediente.categoria || "-"}
                </span>
              </div>
              <div className="flex items-center justify-between px-5 py-3.5">
                <span className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  <Activity size={14} />
                  Tipo de Proceso
                </span>
                <span className="text-xs font-bold text-slate-800 dark:text-white">
                  {expediente.proceso || "-"}
                </span>
              </div>
              <div className="flex items-center justify-between px-5 py-3.5">
                <span className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  <MapPin size={14} />
                  Oficina
                </span>
                <span className="text-xs font-bold text-slate-800 dark:text-white">
                  {expediente.oficina || "-"}
                </span>
              </div>
            </div>
          </div>

          {/* PANEL: GESTIÓN Y SEGUIMIENTO */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
            <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-white">
                Gestión y Control
              </h3>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              <div className="flex items-center justify-between px-5 py-3.5">
                <span className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  <User size={14} />
                  Paralegal Asignado
                </span>
                <span className="text-xs font-bold text-slate-800 dark:text-white">
                  {expediente.paralegal || "-"}
                </span>
              </div>
              <div className="flex items-center justify-between px-5 py-3.5">
                <span className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  <Calendar size={14} />
                  Fecha de Registro
                </span>
                <span className="text-xs font-bold text-slate-800 dark:text-white">
                  {expediente.fechaIngreso || "-"}
                </span>
              </div>
              <div className="flex items-center justify-between px-5 py-3.5">
                <span className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  <AlertCircle size={14} />
                  Estado Principal
                </span>
                <span className="text-xs font-bold text-slate-800 dark:text-white">
                  {expediente.estadoPrincipal || "-"}
                </span>
              </div>
              <div className="flex items-center justify-between px-5 py-3.5">
                <span className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  <Activity size={14} />
                  Sub Estado
                </span>
                <span className="text-xs font-bold text-slate-800 dark:text-white">
                  {expediente.subEstado || "-"}
                </span>
              </div>
              <div className="flex items-center justify-between px-5 py-3.5">
                <span className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  <Clock size={14} />
                  Última Actualización
                </span>
                <span className="text-xs font-bold text-slate-800 dark:text-white">
                  {expediente.fechaActualizacion || "-"}
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white p-2 shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
          <DocumentacionExpediente
            expediente={expediente}
            redaccion={redaccion}
            onSolicitarRedaccion={() => setModalSolicitarOpen(true)}
          />
        </div>
      )}

      {/* MODAL: SOLICITAR REDACCIÓN */}
      {modalSolicitarOpen && (
        <ModalGeneral
          open
          onClose={() => setModalSolicitarOpen(false)}
          size="md"
          header={
            <div>
              <h3 className="text-md font-bold uppercase tracking-wide">Solicitar Redacción de Declaración</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Expediente: {expediente.numeroExpediente || expediente.codigo_expediente}</p>
            </div>
          }
        >
          <form onSubmit={handleSolicitarSubmit} className="space-y-4">
            <label className="block space-y-1">
              <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Origen de la Solicitud *</span>
              <select
                required
                value={origenSolicitud}
                onChange={(e) => setOrigenSolicitud(e.target.value)}
                className="w-full h-10 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-sm outline-none transition focus:border-[#fe7405] focus:ring-1 focus:ring-[#fe7405]"
              >
                <option value="SOLICITUD_GENERAL">Solicitud General</option>
                <option value="AREA_CORTES">Área de Cortes</option>
              </select>
            </label>

            <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 bg-white/50 p-4 transition hover:border-[#fe7405]/40 hover:bg-[#fe7405]/5 dark:border-slate-800 dark:bg-slate-900/50">
              <input
                type="checkbox"
                checked={esUrgente}
                onChange={(e) => setEsUrgente(e.target.checked)}
                className="h-5 w-5 shrink-0 cursor-pointer rounded border-slate-300 text-[#fe7405] focus:ring-[#fe7405]/30 dark:border-slate-700"
              />
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-bold uppercase tracking-wide text-slate-700 dark:text-slate-200">
                  ¿Es Urgente?
                </p>
                <p className="mt-1 text-[11px] leading-5 text-slate-500 dark:text-slate-400">
                  Marcar si este caso requiere atención prioritaria.
                </p>
              </div>
            </label>

            <label className="block space-y-1">
              <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Observaciones / Instrucciones</span>
              <textarea
                placeholder="Indica detalles adicionales o prioridades para el redactor..."
                value={observacionesRedaccion}
                onChange={(e) => setObservacionesRedaccion(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 text-sm outline-none transition focus:border-[#fe7405] focus:ring-1 focus:ring-[#fe7405]"
              />
            </label>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setModalSolicitarOpen(false)}
                className="h-10 rounded-lg px-4 text-sm font-semibold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={solicitarRedaccionMutation.isPending}
                className="h-10 rounded-lg bg-[#fe7405] px-5 text-sm font-semibold text-white shadow hover:bg-[#e06300] transition disabled:opacity-50"
              >
                {solicitarRedaccionMutation.isPending ? "Solicitando..." : "Solicitar"}
              </button>
            </div>
          </form>
        </ModalGeneral>
      )}
    </section>
  );
}
