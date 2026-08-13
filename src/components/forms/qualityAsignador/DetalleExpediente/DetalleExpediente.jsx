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
  const _avanceCargando = calculoAvanceChecklist === undefined;
  const avanceValido = avanceResultado !== null;
  const _avancePorcentaje = avanceValido ? avanceResultado.pct : 0;


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
            <h3 className="text-[25px] font-semibold uppercase tracking-[0.02em] text-[#101a3c] dark:text-white">
              <span className="block">{nombre}</span>
            </h3>
          </div>
          <div className="flex items-center gap-1 px-6 pt-4">
            <button
              type="button"
              onClick={() => setActiveTab("basica")}
              className={`relative flex items-center gap-2 rounded-t-xl px-5 py-3 text-sm font-semibold uppercase tracking-wide transition-all duration-200 ${
                activeTab === "basica"
                  ? "bg-white text-[#0d1b5e] border-x border-t border-slate-200 mb-[-1px] dark:bg-slate-900 dark:text-blue-200 dark:border-x-slate-700 dark:border-t-slate-700"
                  : "text-slate-500 hover:text-[#0d1b5e] hover:bg-slate-50 dark:text-slate-400 dark:hover:text-blue-300 dark:hover:bg-slate-800"
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
                  ? "bg-white text-[#0d1b5e] border-x border-t border-slate-200 mb-[-1px] dark:bg-slate-900 dark:text-blue-200 dark:border-x-slate-700 dark:border-t-slate-700"
                  : "text-slate-500 hover:text-[#0d1b5e] hover:bg-slate-50 dark:text-slate-400 dark:hover:text-blue-300 dark:hover:bg-slate-800"
              }`}
            >
              <FileText size={16} />
              Documentación
            </button>
          </div>
        </div>

        {activeTab === "basica" ? (
          <>
            <div className="px-6 py-6 md:px-8 md:py-8 space-y-4">
              {filas.map((fila, index) => (
                <div key={index} className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-x-5">
                  {fila.map((dato) => {
                    const vacio = estaVacio(dato.value);
                    return (
                      <div
                        key={dato.label}
                        className="group rounded-xl border border-slate-200 bg-slate-50/60 p-4 transition-all duration-200 hover:border-[#fe7405]/40 hover:bg-white dark:border-slate-800 dark:bg-slate-900/50 dark:hover:border-[#fe7405]/50 dark:hover:bg-slate-900"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                            {dato.label}
                          </p>
                          <p
                            className={`mt-1.5 break-words text-[15px] leading-6 font-semibold ${
                              vacio ? "text-slate-300 dark:text-slate-600" : "text-[#0a1233] dark:text-white"
                            }`}
                          >
                            {mostrarValor(dato.value)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </>
        ) : (
          <DocumentacionExpediente expediente={expediente} />
        )}
      </div>
    </section>
  );
}
