import { useMemo, useState } from "react";
import { BriefcaseBusiness, FileCheck, FileText, MoveLeft } from "lucide-react";
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
    isFetching: _checklistActualizando,
  } = useExpedienteChecklistQuery(expedienteId, {
    staleTime: 1000 * 60 * 2,
  });

  const nombre = expediente.nombre || "Detalle del expediente";
  const _numeroExpediente = expediente.numeroExpediente || "No registrado";

  const filas = [
    [
      { label: "N° Expediente", value: expediente.numeroExpediente },
      { label: "Cliente", value: expediente.nombre },
      { label: "Oficina", value: expediente.oficina },
    ],
    [
      { label: "Categoria", value: expediente.categoria },
      { label: "Proceso", value: expediente.proceso },
      { label: "Paralegal", value: expediente.paralegal },
    ],
    [
      { label: "Fecha Asignacion", value: expediente.fechaIngreso },
      { label: "Estado Principal", value: expediente.estadoPrincipal },
      { label: "Sub Estado", value: expediente.subEstado },
    ],
    [
      { label: "Prioridad", value: expediente.prioridad },
      { label: "Fecha Actualizacion", value: expediente.fechaActualizacion },
    ],
  ];

  const mostrarValor = (value) => {
    if (value === null || value === undefined || value === "") {
      return "No registrado";
    }

    return value;
  };

  const estaVacio = (value) => value === null || value === undefined || value === "";

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
      desdeChecklist: true,
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
          desdeChecklist: false,
        }
      : null;
  })();

  const avanceResultado =
    calculoAvanceChecklist === undefined
      ? null
      : calculoAvanceChecklist ?? fallbackAvance;
  const avanceCargando = calculoAvanceChecklist === undefined;
  const avanceValido = avanceResultado !== null;
  const avancePorcentaje = avanceValido ? avanceResultado.pct : 0;

  const getProgresoColor = (pct) => {
    if (pct < 34) return {
      bar: "bg-orange-500 dark:bg-orange-400",
      badge: "bg-orange-50 text-orange-600 dark:bg-orange-500/20 dark:text-orange-300",
      ring: "ring-orange-500/20 dark:ring-orange-400/30",
    };
    if (pct < 67) return {
      bar: "bg-[#0d1b5e] dark:bg-blue-700",
      badge: "bg-[#0d1b5e]/10 text-[#0d1b5e] dark:bg-blue-800/40 dark:text-blue-200",
      ring: "ring-[#0d1b5e]/20 dark:ring-blue-700/40",
    };
    return {
      bar: "bg-emerald-600 dark:bg-emerald-500",
      badge: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
      ring: "ring-emerald-500/20 dark:ring-emerald-400/30",
    };
  };

  const colores = avanceValido ? getProgresoColor(avancePorcentaje) : null;

  return (
    <section className="w-full space-y-5">
      <HeaderBox
        Icon={BriefcaseBusiness}
        title={
          <>
            <span className="block">Detalle del expediente</span>
          </>
        }
        action={
          <button
            type="button"
            onClick={() => navigate("/quality_asignador")}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <MoveLeft size={16} />
            Regresar
          </button>
        }
      />

      <div className="w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200">
          <div className="flex items-center gap-4 px-8 pt-5">
            <h3 className="text-[25px] font-semibold uppercase tracking-[0.02em] text-[#101a3c]">
              <span className="block">{nombre}</span>
            </h3>
          </div>
          <div className="flex items-center gap-1 px-6 pt-4">
            <button
              type="button"
              onClick={() => setActiveTab("basica")}
              className={`relative flex items-center gap-2 rounded-t-xl px-5 py-3 text-sm font-semibold uppercase tracking-wide transition-all duration-200 ${
                activeTab === "basica"
                  ? "bg-white text-[#0d1b5e] border-x border-t border-slate-200 mb-[-1px]"
                  : "text-slate-500 hover:text-[#0d1b5e] hover:bg-slate-50"
              }`}
            >
              <BriefcaseBusiness size={16} />
              Información Basica
            </button>
            <span className="h-5 w-px bg-slate-200 mx-1" />
            <button
              type="button"
              onClick={() => setActiveTab("documentacion")}
              className={`relative flex items-center gap-2 rounded-t-xl px-5 py-3 text-sm font-semibold uppercase tracking-wide transition-all duration-200 ${
                activeTab === "documentacion"
                  ? "bg-white text-[#0d1b5e] border-x border-t border-slate-200 mb-[-1px]"
                  : "text-slate-500 hover:text-[#0d1b5e] hover:bg-slate-50"
              }`}
            >
              <FileText size={16} />
              Documentación
            </button>
          </div>
        </div>

        {activeTab === "basica" ? (
          <>
            <div className="divide-y divide-slate-100 px-8">
              {filas.map((fila, index) => (
                <div key={index} className="grid grid-cols-1 gap-6 py-6 md:grid-cols-3 md:gap-x-10">
                  {fila.map((dato) => (
                    <div key={dato.label}>
                      <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[#8da2ce]">
                        {dato.label}
                      </p>
                      <p
                        className={`mt-1 break-words text-[16px] leading-6 ${
                          estaVacio(dato.value) ? "text-slate-300" : "text-[#0e183f]"
                        }`}
                      >
                        {mostrarValor(dato.value)}
                      </p>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            <div className="px-8 pb-8 pt-2">
              <div className={`rounded-2xl border p-6 transition-all duration-300 ${
                avanceCargando
                  ? "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/60"
                  : avanceValido
                    ? `border-slate-200 bg-[#f8f9fb] ring-1 ${colores.ring} dark:border-slate-800 dark:bg-slate-900/60`
                    : "border-dashed border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
              }`}>
                {avanceCargando ? (
                  <div className="flex flex-col gap-5 animate-pulse lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-start gap-4">
                      <div className="h-14 w-14 shrink-0 rounded-xl bg-slate-200 dark:bg-slate-800" />
                      <div className="min-w-0 flex-1 space-y-2.5">
                        <div className="flex flex-wrap items-center gap-3">
                          <div className="h-3 w-36 rounded-md bg-slate-200 dark:bg-slate-800" />
                          <div className="h-6 w-16 rounded-lg bg-slate-200 dark:bg-slate-800" />
                          <div className="h-5 w-24 rounded-lg bg-slate-200/70 dark:bg-slate-800/70" />
                        </div>
                        <div className="h-5 w-72 rounded bg-slate-200 dark:bg-slate-800" />
                      </div>
                    </div>
                    <div className="w-full max-w-sm space-y-2 lg:ml-8 lg:flex-1">
                      <div className="flex items-end justify-between">
                        <div className="h-3 w-6 rounded bg-slate-200 dark:bg-slate-800" />
                        <div className="h-3 w-8 rounded bg-slate-200 dark:bg-slate-800" />
                        <div className="h-3 w-10 rounded bg-slate-200 dark:bg-slate-800" />
                      </div>
                      <div className="h-4 w-full overflow-hidden rounded-full bg-slate-200/70 dark:bg-slate-800" />
                      <div className="flex items-center justify-between pt-1">
                        <div className="h-3 w-44 rounded bg-slate-200 dark:bg-slate-800" />
                        <div className="h-3 w-24 rounded bg-slate-200/80 dark:bg-slate-800" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-start gap-4">
                    <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl ${
                      avanceValido ? colores.bar : "bg-slate-200 dark:bg-slate-800"
                    }`}>
                      <FileCheck size={26} className={avanceValido ? "text-white" : "text-slate-400 dark:text-slate-500"} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[#8da2ce] dark:text-blue-300/70">
                          Avance Documental
                        </p>
                        {avanceValido && (
                          <span className={`inline-flex items-center rounded-lg px-3 py-1 text-[12px] font-bold ${colores.badge}`}>
                            {avancePorcentaje.toFixed(2)}%
                          </span>
                        )}
                        {avanceResultado?.desdeChecklist && (
                          <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#0d1b5e]/20 bg-[#0d1b5e]/5 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#0d1b5e] dark:border-blue-700/40 dark:bg-blue-800/30 dark:text-blue-200">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#0d1b5e] dark:bg-blue-300" />
                            Sincronizado
                          </span>
                        )}
                      </div>
                      <p className="mt-2 text-[15px] font-medium text-[#0e183f] dark:text-slate-100">
                        {avanceValido
                          ? avanceResultado?.desdeChecklist && avanceResultado?.total !== undefined
                            ? `${avanceResultado.completados ?? avanceResultado.recibidos} de ${avanceResultado.total} documentos completados`
                            : `${avancePorcentaje.toFixed(2)}% completado`
                          : "No registrado"}
                      </p>
                    </div>
                  </div>

                  {avanceValido ? (
                    <div className="w-full max-w-sm lg:ml-8 lg:flex-1">
                      <div className="flex items-end justify-between text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        <span>0%</span>
                        <span>50%</span>
                        <span>100%</span>
                      </div>
                      <div className="relative mt-2 h-4 w-full overflow-hidden rounded-full bg-slate-200/80 dark:bg-slate-800">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ease-out ${colores.bar}`}
                          style={{ width: `${avancePorcentaje}%` }}
                        />
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                          <span className={`h-2 w-2 rounded-full ${colores.bar}`} />
                          <span className="font-medium">
                              Estado:{" "}
                              <span className={
                                avancePorcentaje < 34
                                  ? "text-orange-600 dark:text-orange-300"
                                  : avancePorcentaje < 67
                                    ? "text-[#0d1b5e] dark:text-blue-200"
                                    : avancePorcentaje < 100
                                      ? "text-emerald-700 dark:text-emerald-300"
                                      : "text-emerald-700 dark:text-emerald-300"
                              }>
                                {avancePorcentaje < 34
                                  ? "En progreso inicial"
                                  : avancePorcentaje < 67
                                    ? "En desarrollo"
                                    : avancePorcentaje < 100
                                      ? "Casi completo"
                                      : "Completado"}
                              </span>
                            </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full max-w-sm lg:ml-8 lg:flex-1">
                      <div className="h-4 w-full overflow-hidden rounded-full bg-slate-200/60 dark:bg-slate-800/60" />
                      <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">Sin datos de progreso</p>
                    </div>
                  )}
                </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <DocumentacionExpediente expediente={expediente} />
        )}
      </div>
    </section>
  );
}
