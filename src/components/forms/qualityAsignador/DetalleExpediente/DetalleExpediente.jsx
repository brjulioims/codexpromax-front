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
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

import HeaderBox from "../../../ui/HeaderBox";
import DocumentacionExpediente from "./DocumentacionExpediente";

export default function DetalleExpediente() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const expediente = state?.expediente ?? {};
  const [activeTab, setActiveTab] = useState("basica");
  const nombre = expediente.nombre || "Detalle del expediente";

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
        <div className="inline-flex items-center gap-1 rounded-xl border border-[#0a1233]/10 bg-gradient-to-r from-[#ffffff] to-[#ffffff]/85 px-2 py-2 shadow-[0_8px_24px_rgba(10,18,51,0.18)] self-start">
          <button
            type="button"
            onClick={() => setActiveTab("basica")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-[12px] font-black uppercase tracking-[0.08em] transition-all duration-200 ${
              activeTab === "basica"
                ? "text-[#fe7405] pl-3 border-l-[3px] border-l-[#fe7405] rounded-lg"
                : "text-[#0a1233] hover:text-[#0a1233] hover:bg-slate-100 pl-4"
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
                : "text-[#0a1233] hover:text-[#0a1233] hover:bg-slate-100 pl-4"
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
          <DocumentacionExpediente expediente={expediente} />
        </div>
      )}
    </section>
  );
}
