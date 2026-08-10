import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Clock,
  FileCheck,
  FilePenLine,
  FileText,
  Loader2,
  User,
} from "lucide-react";
import toast from "react-hot-toast";

import { useUpdateChecklistItemMutation } from "../../../../hooks/mutations/useChecklistMutations";
import { useExpedienteChecklistQuery } from "../../../../hooks/queries/useExpedienteChecklistQuery";
import { useMeQuery } from "../../../../hooks/queries/useMeQuery";

const ESTADOS = {
  RECIBIDO: "RECIBIDO",
  PENDIENTE: "PENDIENTE",
  EN_REDACCION: "EN_REDACCION",
  REQUIERE_CORRECCION: "REQUIERE_CORRECCION",
  NO_APLICA: "NO_APLICA",
};


const ESTADOS_SELECTABLES = [
  ESTADOS.PENDIENTE,
  ESTADOS.RECIBIDO,
  ESTADOS.REQUIERE_CORRECCION,
  ESTADOS.NO_APLICA,
];

function formatEstadoLabel(estado) {
  return estado.replace(/_/g, " ");
}

function getEstadoStyle(estado) {
  switch (estado) {
    case ESTADOS.RECIBIDO:
      return {
        container:
          "border border-emerald-200 border-l-[5px] border-l-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-900/50 dark:border-l-emerald-400",
        iconBox: "bg-emerald-500 text-white",
        icon: CheckCircle2,
        badge: "bg-emerald-500 text-white",
        dot: "bg-white",
        hasSideBar: true,
        title: "text-emerald-900 dark:text-emerald-100",
        meta: "text-emerald-700/80 dark:text-emerald-200/70",
      };
    case ESTADOS.PENDIENTE:
      return {
        container:
          "border border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-800",
        iconBox: "bg-slate-400 text-white dark:bg-slate-600",
        icon: Clock,
        badge:
          "bg-slate-500 text-white",
        dot: "bg-white",
        hasSideBar: false,
        title: "text-slate-800 dark:text-slate-100",
        meta: "text-slate-500 dark:text-slate-400",
      };
    case ESTADOS.NO_APLICA:
      return {
        container:
          "border border-orange-200 border-l-[5px] border-l-orange-500 bg-orange-50 dark:bg-orange-950/30 dark:border-orange-900/40 dark:border-l-orange-400",
        iconBox: "bg-orange-500 text-white dark:bg-orange-500",
        icon: AlertTriangle,
        badge: "bg-orange-500 text-white dark:bg-orange-500",
        dot: "bg-white",
        hasSideBar: true,
        title: "text-orange-900 dark:text-orange-100",
        meta: "text-orange-700/80 dark:text-orange-200/70",
      };
    case ESTADOS.REQUIERE_CORRECCION:
    default:
      return {
        container:
          "border border-[#0d1b5e]/20 border-l-[5px] border-l-[#0d1b5e] bg-[#0d1b5e]/5 dark:bg-blue-950/20 dark:border-blue-900/40 dark:border-l-blue-700",
        iconBox: "bg-[#0d1b5e] text-white dark:bg-blue-800",
        icon: AlertTriangle,
        badge: "bg-[#0d1b5e] text-white dark:bg-blue-800",
        dot: "bg-white",
        hasSideBar: true,
        title: "text-[#0d1b5e] dark:text-blue-100",
        meta: "text-[#0d1b5e]/80 dark:text-blue-200/80",
      };
  }
}

function getSelectEstadoStyle(estado) {
  const base =
    "text-[11px] font-bold uppercase tracking-wider border rounded-lg px-2.5 py-1.5";
  switch (estado) {
    case ESTADOS.RECIBIDO:
      return `${base} border-emerald-500 bg-emerald-500 text-white`;
    case ESTADOS.PENDIENTE:
      return `${base} border-slate-500 bg-slate-500 text-white`;
    case ESTADOS.NO_APLICA:
      return `${base} border-orange-500 bg-orange-500 text-white`;
    case ESTADOS.REQUIERE_CORRECCION:
    default:
      return `${base} border-[#0d1b5e] bg-[#0d1b5e] text-white`;
  }
}

export default function DocumentacionExpediente({ expediente = {} }) {
  const expedienteId = expediente?.id ?? expediente?.expedienteId ?? null;

  const { data: me } = useMeQuery();
  const usuarioId =
    me?.id ?? me?.usuario_id ?? me?.user_id ?? me?.usuario?.id ?? null;

  const {
    data: checklist = [],
    isLoading,
    isFetching,
    refetch,
  } = useExpedienteChecklistQuery(expedienteId);

  const { mutate: actualizarEstado, isPending: actualizando } =
    useUpdateChecklistItemMutation({
      onSuccess: () => {
        toast.success("Checklist actualizado correctamente");
      },
      onError: (err) => {
        console.error("Error actualizando checklist:", err);
        toast.error(err?.message || "No se pudo actualizar el checklist");
      },
    });

  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [observacionesEdit, setObservacionesEdit] = useState({});
  const [editObsId, setEditObsId] = useState(null);
  const [dropdownPos, setDropdownPos] = useState({});
  const dropdownContenedorRef = useRef(null);

  const checklistVisible = useMemo(
    () => checklist.filter((i) => ESTADOS_SELECTABLES.includes(i.estado)),
    [checklist]
  );

  const resumen = useMemo(() => {
    const total = checklistVisible.length;
    const estaCompletado = (est) =>
      est === ESTADOS.RECIBIDO || est === ESTADOS.NO_APLICA;
    const completados = checklistVisible.filter((i) =>
      estaCompletado(i.estado)
    ).length;
    const pendientes = checklistVisible.filter(
      (i) => i.estado === ESTADOS.PENDIENTE
    ).length;
    const otros = total - completados - pendientes;
    const pct = total > 0 ? (completados / total) * 100 : 0;

    return { total, completados, pendientes, otros, pct };
  }, [checklistVisible]);

  useEffect(() => {
    if (!openDropdownId) return;
    const MENU_ALTURA_ESTIMADA = ESTADOS_SELECTABLES.length * 36 + 44;
    const handleClickOutside = (e) => {
      if (dropdownContenedorRef.current?.contains(e.target)) return;
      setOpenDropdownId(null);
    };
    const handleKey = (e) => {
      if (e.key === "Escape") setOpenDropdownId(null);
    };
    const handlePosChange = () => {
      if (!openDropdownId) return;
      const selector = `[data-estado-selector-id="${openDropdownId}"]`;
      const btn = document.querySelector(selector);
      if (!btn) return;
      const rect = btn.getBoundingClientRect();
      const espacioAbajo = window.innerHeight - rect.bottom;
      const espacioArriba = rect.top;
      const esUltimoVisible =
        checklistVisible.length > 0 &&
        checklistVisible[checklistVisible.length - 1].id === openDropdownId;
      const abrirArriba =
        esUltimoVisible ||
        (espacioAbajo < MENU_ALTURA_ESTIMADA + 16 &&
          espacioArriba > espacioAbajo);
      setDropdownPos((prev) => ({
        ...prev,
        [openDropdownId]: {
          top: abrirArriba
            ? Math.max(8, rect.top - MENU_ALTURA_ESTIMADA - 8)
            : rect.bottom + 8,
          left: Math.max(12, Math.min(rect.left, window.innerWidth - 260)),
          width: Math.max(rect.width, 240),
          openUp: abrirArriba,
        },
      }));
    };
    handlePosChange();
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKey);
    window.addEventListener("resize", handlePosChange);
    window.addEventListener("scroll", handlePosChange, true);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKey);
      window.removeEventListener("resize", handlePosChange);
      window.removeEventListener("scroll", handlePosChange, true);
    };
  }, [openDropdownId]);

  function cambiarEstado(item, nuevoEstado) {
    if (!usuarioId) {
      toast.error("No hay usuario autenticado para actualizar el checklist");
      return;
    }
    if (nuevoEstado === item.estado) {
      setOpenDropdownId(null);
      return;
    }
    const obsActual = observacionesEdit[item.id] ?? item.observaciones ?? "";
    actualizarEstado(
      {
        itemId: item.id,
        expedienteId,
        payload: {
          estado: nuevoEstado,
          observaciones: obsActual,
          usuario_id: usuarioId,
        },
      },
      {
        onSuccess: () => {
          setObservacionesEdit((prev) => {
            const n = { ...prev };
            delete n[item.id];
            return n;
          });
        },
      }
    );
  }

  function guardarObservaciones(item) {
    if (!usuarioId) {
      toast.error("No hay usuario autenticado para actualizar el checklist");
      return;
    }
    const nuevasObs = observacionesEdit[item.id] ?? item.observaciones ?? "";
    actualizarEstado(
      {
        itemId: item.id,
        expedienteId,
        payload: {
          estado: item.estado,
          observaciones: nuevasObs,
          usuario_id: usuarioId,
        },
      },
      {
        onSuccess: () => {
          setObservacionesEdit((prev) => {
            const n = { ...prev };
            delete n[item.id];
            return n;
          });
        },
      }
    );
  }

  if (!expedienteId) {
    return (
      <div className="px-8 py-10">
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
            <FileText size={26} />
          </div>
          <p className="mt-4 text-sm font-semibold uppercase tracking-wide text-slate-600">
            Expediente sin identificar
          </p>
          <p className="mt-1 text-xs text-slate-400">
            No se pudo obtener el identificador del expediente para cargar la
            documentación
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-8 py-8">
      <div className="mb-6 rounded-xl border border-slate-200 bg-[#f8f9fb] p-6 ring-1 ring-slate-200/60 dark:border-slate-800 dark:bg-slate-900/40 dark:ring-slate-800/50">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#0d1b5e] text-white">
              <FileCheck size={26} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[#8da2ce]">
                  Checklist Documental
                </p>
                <span className="inline-flex items-center rounded-lg bg-[#0d1b5e]/10 px-3 py-1 text-[12px] font-bold text-[#0d1b5e]">
                  {resumen.pct.toFixed(2)}%
                </span>
              </div>
              <p className="mt-2 text-[15px] font-medium text-[#0e183f] dark:text-slate-100">
                {resumen.completados} de {resumen.total} documentos completados
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-4 text-xs">
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="font-semibold uppercase tracking-wide">
                    Completados: {resumen.completados}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                  <span className="h-2 w-2 rounded-full bg-slate-500" />
                  <span className="font-semibold uppercase tracking-wide">
                    Pendientes: {resumen.pendientes}
                  </span>
                </div>
                {resumen.otros > 0 && (
                  <div className="flex items-center gap-2 text-[#0d1b5e] dark:text-blue-300">
                    <span className="h-2 w-2 rounded-full bg-[#0d1b5e]" />
                    <span className="font-semibold uppercase tracking-wide">
                      En proceso: {resumen.otros}
                    </span>
                  </div>
                )}
                {(isLoading || isFetching) && (
                  <div className="flex items-center gap-2 text-[#0d1b5e]">
                    <Loader2 size={14} className="animate-spin" />
                    <span className="font-medium">Actualizando…</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="w-full max-w-sm lg:ml-8 lg:flex-1">
            <div className="flex items-end justify-between text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
            <div className="relative mt-2 h-4 w-full overflow-hidden rounded-full bg-slate-200/80 dark:bg-slate-800">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-700 ease-out"
                style={{ width: `${resumen.pct}%` }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => refetch()}
                disabled={isLoading || isFetching}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-600 transition hover:border-[#0d1b5e] hover:text-[#0d1b5e] disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              >
                <Loader2
                  size={12}
                  className={isLoading || isFetching ? "animate-spin" : ""}
                />
                Refrescar
              </button>
              <span className="text-xs font-bold text-slate-400">
                N° Exp: {expediente.numeroExpediente || "—"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {isLoading && !checklistVisible.length ? (
        <div className="space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="animate-pulse rounded-2xl border border-slate-200 bg-white p-5"
            >
              <div className="flex items-center gap-4">
                <div className="h-11 w-11 shrink-0 rounded-xl bg-slate-100" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 rounded bg-slate-100" />
                  <div className="h-3 w-1/2 rounded bg-slate-100" />
                </div>
                <div className="h-6 w-20 rounded-full bg-slate-100" />
              </div>
            </div>
          ))}
        </div>
      ) : checklistVisible.length ? (
        <div className="space-y-3">
          {checklistVisible.map((item) => {
            const style = getEstadoStyle(item.estado);
            const IconComp = style.icon;
            const isDropdownOpen = openDropdownId === item.id;
            const isEditingObs = editObsId === item.id;
            const obsValue = observacionesEdit[item.id] ?? item.observaciones ?? "";

            return (
              <div
                key={item.id}
                className={`${isDropdownOpen || isEditingObs ? "z-40" : "z-0"} relative rounded-xl p-5 transition-all duration-300 hover:shadow-md ${style.container}`}
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex min-w-0 flex-1 items-start gap-4">
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${style.iconBox}`}
                    >
                      <IconComp size={20} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4
                          className={`truncate text-[15px] font-semibold ${style.title}`}
                        >
                          {item.titulo_requisito}
                        </h4>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-3">
                        <div className="relative">
                          <button
                            type="button"
                            data-estado-selector-id={item.id}
                            disabled={actualizando}
                            onClick={() =>
                              setOpenDropdownId(isDropdownOpen ? null : item.id)
                            }
                            className={`inline-flex items-center gap-1.5 transition ${getSelectEstadoStyle(item.estado)} ${actualizando ? "opacity-60" : "hover:brightness-110"}`}
                          >
                            {actualizando ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : (
                              <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
                            )}
                            {formatEstadoLabel(item.estado)}
                            <ChevronDown size={12} className={`transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
                          </button>
                        </div>

                        {isEditingObs ? (
                          <div className="flex flex-1 items-center gap-2 min-w-[240px]">
                            <input
                              type="text"
                              value={obsValue}
                              onChange={(e) =>
                                setObservacionesEdit((prev) => ({
                                  ...prev,
                                  [item.id]: e.target.value,
                                }))
                              }
                              placeholder="Agregar observaciones…"
                              className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800 outline-none ring-[#0d1b5e]/20 transition focus:border-[#0d1b5e] focus:ring-2 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={() => guardarObservaciones(item)}
                              className="inline-flex items-center gap-1 rounded-lg bg-[#0d1b5e] px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-white transition hover:brightness-110"
                            >
                              Guardar
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditObsId(null);
                                setObservacionesEdit((prev) => {
                                  const n = { ...prev };
                                  delete n[item.id];
                                  return n;
                                });
                              }}
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-600 transition hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                            >
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setObservacionesEdit((prev) => ({
                                ...prev,
                                [item.id]: item.observaciones ?? "",
                              }));
                              setEditObsId(item.id);
                            }}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-600 transition hover:border-[#0d1b5e] hover:text-[#0d1b5e] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                          >
                            <FilePenLine size={12} />
                            {item.observaciones ? "Editar nota" : "Agregar nota"}
                          </button>
                        )}
                      </div>

                      {!isEditingObs && (item.observaciones ? (
                        <p className={`mt-2 text-xs leading-5 ${style.meta}`}>
                          {item.observaciones}
                        </p>
                      ) : (
                        item.estado === ESTADOS.PENDIENTE && (
                          <p className={`mt-2 text-xs italic ${style.meta}`}>
                            Sin observaciones registradas
                          </p>
                        )
                      ))}

                      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                        {item.usuario_actualizador && (
                          <div className="flex items-center gap-1.5">
                            <User size={12} />
                            <span className="font-medium">
                              {item.usuario_actualizador}
                            </span>
                          </div>
                        )}
                        {item.updated_at && (
                          <div className="flex items-center gap-1.5">
                            <Clock size={12} />
                            <span>
                              Última actualización:{" "}
                              <span className="font-semibold">
                                {item.updated_at}
                              </span>
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-700 dark:bg-slate-900">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
            <FileText size={26} />
          </div>
          <p className="mt-4 text-sm font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
            No hay checklist configurado
          </p>
          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
            Este expediente aún no tiene una plantilla de documentación
            asociada
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-4 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 transition hover:border-[#0d1b5e] hover:text-[#0d1b5e] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          >
            <Loader2
              size={12}
              className={isLoading || isFetching ? "animate-spin" : ""}
            />
            Reintentar carga
          </button>
        </div>
      )}

      {openDropdownId &&
        (() => {
          const itemActivo = checklistVisible.find((i) => i.id === openDropdownId);
          const pos = dropdownPos[openDropdownId];
          if (!itemActivo || !pos) return null;
          const optActual = itemActivo.estado;
          return createPortal(
            <div
              ref={dropdownContenedorRef}
              className="fixed z-[9999] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
              style={{
                top: pos.top,
                left: Math.max(12, pos.left),
                width: Math.min(pos.width, 320),
              }}
            >
              <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Cambiar estado
                </p>
              </div>
              <ul className="p-1">
                {ESTADOS_SELECTABLES.map((estadoOpt) => {
                  const optStyle = getEstadoStyle(estadoOpt);
                  const isCurrent = estadoOpt === optActual;
                  return (
                    <li key={estadoOpt}>
                      <button
                        type="button"
                        onClick={() => cambiarEstado(itemActivo, estadoOpt)}
                        className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-semibold transition ${
                          isCurrent
                            ? "bg-slate-100 dark:bg-slate-800"
                            : "hover:bg-slate-50 dark:hover:bg-slate-800/70"
                        }`}
                      >
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${optStyle.badge}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${optStyle.dot}`} />
                          {formatEstadoLabel(estadoOpt)}
                        </span>
                        {isCurrent && (
                          <CheckCircle2 size={12} className="ml-auto text-emerald-500" />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>,
            document.body
          );
        })()}
    </div>
  );
}
