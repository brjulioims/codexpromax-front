import { useMemo, useState } from "react";
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
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

import { useExpedienteChecklistQuery } from "../../../../hooks/queries/useExpedienteChecklistQuery";
import HeaderBox from "../../../ui/HeaderBox";
import DocumentacionExpediente from "./DocumentacionExpediente";

export default function DetalleExpediente() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const expediente = state?.expediente ?? {};
  const [activeTab, setActiveTab] = useState("basica");

  const expedienteId = expediente?.id ?? expediente?.expedienteId ?? null;
  const {
    data: checklist = [],
    isLoading: checklistCargando,
  } = useExpedienteChecklistQuery(expedienteId, {
    staleTime: 1000 * 60 * 2,
  });

  const nombre = expediente.nombre || "Detalle del expediente";

  const calculoAvanceChecklist = useMemo(() => {
    if (!Array.isArray(checklist) || checklist.length === 0) {
      return checklistCargando ? undefined : null;
    }

    const total = checklist.length;
    if (total === 0) return null;
    const estaCompletado = (est) =>
      est === "RECIBIDO" || est === "NO_APLICA";
    const completados = checklist.filter((i) =>
      estaCompletado(i.estado)
    ).length;
    return {
      pct: (completados / total) * 100,
      recibidos: completados,
      completados,
      total,
    };
  }, [checklist, checklistCargando]);

  const fallbackAvance = (() => {
    const avanceDoc = expediente.avanceDocumental;
    const avanceNumerico =
      typeof avanceDoc === "number"
        ? avanceDoc
        : typeof avanceDoc === "string" &&
            avanceDoc !== "" &&
            avanceDoc !== "No registrado"
          ? parseFloat(avanceDoc)
          : null;
    const valido = avanceNumerico !== null && !isNaN(avanceNumerico);
    return valido
      ? {
          pct: Math.min(100, Math.max(0, avanceNumerico)),
        }
      : null;
  })();

  const avanceResultado =
    calculoAvanceChecklist === undefined
      ? null
      : calculoAvanceChecklist ?? fallbackAvance;
  const avanceValido = avanceResultado !== null;
  const avancePorcentaje = avanceValido ? Math.round(avanceResultado.pct) : 0;

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
        {/* SELECTOR DE PESTAÑAS TIPO iOS / SEGMENTED CONTROL */}
        <div className="inline-flex rounded-xl bg-slate-100 p-1 dark:bg-slate-900 self-start">
          <button
            type="button"
            onClick={() => setActiveTab("basica")}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-all ${
              activeTab === "basica"
                ? "bg-white text-slate-800 shadow-sm dark:bg-slate-800 dark:text-white"
                : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            <BriefcaseBusiness size={14} />
            Información General
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("documentacion")}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-all ${
              activeTab === "documentacion"
                ? "bg-white text-slate-800 shadow-sm dark:bg-slate-800 dark:text-white"
                : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            <FileText size={14} />
            Requisitos del Expediente
          </button>
        </div>

        {/* METRICA DE AVANCE */}
        {avanceValido && (
          <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-2.5 dark:border-slate-800/40 dark:bg-slate-900/30 self-start sm:self-auto">
            <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/20">
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                {avancePorcentaje}%
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Avance Documental
              </p>
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {avanceResultado.completados !== undefined
                  ? `${avanceResultado.completados} de ${avanceResultado.total} requisitos`
                  : "Porcentaje calculado"}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* CONTENIDO PRINCIPAL */}
      {activeTab === "basica" ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
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
          <DocumentacionExpediente expediente={expediente} />
        </div>
      )}
    </section>
  );
}
