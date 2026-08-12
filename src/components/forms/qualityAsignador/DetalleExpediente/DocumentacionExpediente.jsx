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
  Plus,
  Trash2,
  User,
  X,
} from "lucide-react";
import toast from "react-hot-toast";

import {
  useCreateChecklistItemMutation,
  useCreateCustomChecklistItemMutation,
  useDeleteChecklistItemMutation,
  useUpdateChecklistItemMutation,
} from "../../../../hooks/mutations/useChecklistMutations";
import { useExpedienteChecklistQuery } from "../../../../hooks/queries/useExpedienteChecklistQuery";
import { usePlantillasChecklistQuery } from "../../../../hooks/queries/usePlantillasChecklistQuery";
import { useMeQuery } from "../../../../hooks/queries/useMeQuery";

const ESTADOS = {
  RECIBIDO: "RECIBIDO",
  PENDIENTE: "PENDIENTE",
  EN_REDACCION: "EN_REDACCION",
  REQUIERE_CORRECCION: "REQUIERE_CORRECCION",
  NO_APLICA: "NO_APLICA",
};

const ESTADOS_REDACCION = new Set([
  "EN_REDACCION",
  "EN_QUALITY_REDACCION",
  "APROBADO_REDACCION",
]);

const ESTADOS_TRADUCCION = new Set([
  "EN_TRADUCCION",
  "EN_QUALITY_TRADUCCION",
  "TRADUCIDO",
]);

const ESTADOS_OCULTOS = new Set([
  ...ESTADOS_REDACCION,
  ...ESTADOS_TRADUCCION,
]);

const ESTADOS_SELECTABLES = [
  ESTADOS.PENDIENTE,
  ESTADOS.RECIBIDO,
  ESTADOS.REQUIERE_CORRECCION,
  ESTADOS.NO_APLICA,
];

const CATEGORIA_META = {
  biograficos: {
    titulo: "Documentos biograficos",
    descripcion: "Identidad, nacimiento y declaraciones personales",
    icon: FileText,
    color: {
      badge: "bg-blue-50 text-[#0d1b5e] border-[#0d1b5e]/20",
      ring: "ring-[#0d1b5e]/10",
      head: "text-[#0d1b5e]",
      accent: "#0d1b5e",
      darkBadge:
        "dark:bg-blue-950/50 dark:text-blue-200 dark:border-blue-900/50",
    },
  },
  evidencias: {
    titulo: "Evidencias",
    descripcion: "Pruebas documentales y fotograficas",
    icon: FileCheck,
    color: {
      badge: "bg-emerald-50 text-emerald-800 border-emerald-200",
      ring: "ring-emerald-500/10",
      head: "text-emerald-700",
      accent: "#047857",
      darkBadge:
        "dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-900/50",
    },
  },
  formularios: {
    titulo: "Formularios",
    descripcion: "Formatos oficiales y solicitudes",
    icon: FilePenLine,
    color: {
      badge: "bg-orange-50 text-orange-800 border-orange-200",
      ring: "ring-orange-500/10",
      head: "text-orange-700",
      accent: "#c2410c",
      darkBadge:
        "dark:bg-orange-950/40 dark:text-orange-200 dark:border-orange-900/50",
    },
  },
};

function normalizarParaMatch(texto) {
  return `${texto ?? ""}`
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function mapCategoriaCatalogo(categoria) {
  const value = `${categoria ?? ""}`.trim().toUpperCase();

  if (value === "BIOGRAFICO") return "biograficos";
  if (value === "EVIDENCIA") return "evidencias";
  if (value === "FORMULARIO") return "formularios";

  return null;
}

function mapCategoriaApi(categoriaId) {
  if (categoriaId === "biograficos") return "BIOGRAFICO";
  if (categoriaId === "evidencias") return "EVIDENCIA";
  if (categoriaId === "formularios") return "FORMULARIO";

  return "BIOGRAFICO";
}

function formatEstadoLabel(estado) {
  return `${estado ?? ""}`.replace(/_/g, " ");
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
        title: "text-emerald-900 dark:text-emerald-100",
        meta: "text-emerald-700/80 dark:text-emerald-200/70",
      };
    case ESTADOS.PENDIENTE:
      return {
        container:
          "border border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-800",
        iconBox: "bg-slate-400 text-white dark:bg-slate-600",
        icon: Clock,
        badge: "bg-slate-500 text-white",
        dot: "bg-white",
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
  } = useExpedienteChecklistQuery(expedienteId);

  const { data: plantillas = [], isLoading: plantillasCargando } =
    usePlantillasChecklistQuery();

  const { mutate: actualizarEstado, isPending: actualizando } =
    useUpdateChecklistItemMutation({
      onSuccess: () => {
        toast.success("Documento actualizado correctamente");
      },
      onError: (err) => {
        console.error("Error actualizando documento:", err);
        toast.error(err?.message || "No se pudo actualizar el documento");
      },
    });

  const { mutate: eliminarItem, isPending: eliminandoItem } =
    useDeleteChecklistItemMutation({
      onSuccess: () => {
        toast.success("Documento eliminado correctamente");
      },
      onError: (err) => {
        console.error("Error eliminando documento:", err);
        toast.error(err?.message || "No se pudo eliminar el documento");
      },
    });

  const { mutate: crearItem, isPending: creandoItem } =
    useCreateChecklistItemMutation({
      onSuccess: (data, vars) => {
        toast.success("Documento agregado correctamente");
        const cat = vars?.categoriaId;
        if (cat) setAgregandoPorCategoria((p) => ({ ...p, [cat]: false }));
        if (cat) setSelectorPorCategoria((p) => ({ ...p, [cat]: "" }));
      },
      onError: (err) => {
        console.error("Error creando documento desde catalogo:", err);
        toast.error(err?.message || "No se pudo agregar el documento");
      },
    });

  const {
    mutate: crearItemPersonalizado,
    isPending: creandoItemPersonalizado,
  } = useCreateCustomChecklistItemMutation({
    onSuccess: (data, vars) => {
      toast.success("Documento agregado correctamente");
      const cat = vars?.categoriaId;
      if (cat) setAgregandoPorCategoria((p) => ({ ...p, [cat]: false }));
      if (cat) setSelectorPorCategoria((p) => ({ ...p, [cat]: "" }));
      if (cat) setCustomNombrePorCategoria((p) => ({ ...p, [cat]: "" }));
    },
    onError: (err) => {
      console.error("Error creando documento personalizado:", err);
      toast.error(err?.message || "No se pudo agregar el documento");
    },
  });

  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [observacionesEdit, setObservacionesEdit] = useState({});
  const [editObsId, setEditObsId] = useState(null);
  const [dropdownPos, setDropdownPos] = useState({});
  const dropdownContenedorRef = useRef(null);
  const [agregandoPorCategoria, setAgregandoPorCategoria] = useState({});
  const [selectorPorCategoria, setSelectorPorCategoria] = useState({});
  const [customNombrePorCategoria, setCustomNombrePorCategoria] = useState({});

  const categorias = useMemo(
    () =>
      Object.keys(CATEGORIA_META).map((id) => ({
        id,
        ...CATEGORIA_META[id],
      })),
    []
  );

  const checklistVisible = useMemo(
    () => checklist.filter((i) => !ESTADOS_OCULTOS.has(i.estado)),
    [checklist]
  );

  const itemsPorCategoria = useMemo(() => {
    const out = Object.fromEntries(categorias.map((c) => [c.id, []]));

    checklistVisible.forEach((item) => {
      const categoriaId = item?.categoria_ui ?? "biograficos";

      if (out[categoriaId]) {
        out[categoriaId].push(item);
      }
    });

    return out;
  }, [categorias, checklistVisible]);

  const plantillasPorCategoria = useMemo(() => {
    const out = Object.fromEntries(categorias.map((c) => [c.id, []]));

    (Array.isArray(plantillas) ? plantillas : []).forEach((item) => {
      const categoriaId = mapCategoriaCatalogo(item?.categoria);

      if (categoriaId && out[categoriaId]) {
        out[categoriaId].push(item);
      }
    });

    return out;
  }, [categorias, plantillas]);

  const plantillasTitulosYaUsados = useMemo(
    () =>
      new Set(
        checklistVisible.map((i) =>
          normalizarParaMatch(i?.titulo_requisito)
        )
      ),
    [checklistVisible]
  );

  const resumen = useMemo(() => {
    const total = checklistVisible.length;
    const estaCompletado = (estado) =>
      estado === ESTADOS.RECIBIDO || estado === ESTADOS.NO_APLICA;
    const completados = checklistVisible.filter((i) =>
      estaCompletado(i.estado)
    ).length;
    const pendientes = checklistVisible.filter(
      (i) => i.estado === ESTADOS.PENDIENTE
    ).length;
    const otros = total - completados - pendientes;
    const pct = total > 0 ? (completados / total) * 100 : 0;

    const porCat = Object.fromEntries(
      categorias.map((categoria) => {
        const items = itemsPorCategoria[categoria.id] ?? [];
        const totalCat = items.length;
        const ok = items.filter((i) => estaCompletado(i.estado)).length;

        return [
          categoria.id,
          {
            total: totalCat,
            completados: ok,
            pct: totalCat ? (ok / totalCat) * 100 : 0,
          },
        ];
      })
    );

    return { total, completados, pendientes, otros, pct, porCat };
  }, [categorias, checklistVisible, itemsPorCategoria]);

  function getPlantillaTitulo(item) {
    return (
      item?.nombre_documento ??
      item?.titulo_requisito ??
      item?.titulo ??
      item?.nombre ??
      item?.label ??
      ""
    )
      .toString()
      .trim();
  }

  function getPlantillaId(item) {
    return item?.id ?? item?.plantilla_checklist_id ?? item?.plantilla_id ?? null;
  }

  function confirmarAgregar(categoria) {
    if (!usuarioId) {
      toast.error("No hay usuario autenticado para agregar el documento");
      return;
    }

    const seleccionado = selectorPorCategoria[categoria.id] || "";

    if (!seleccionado) {
      toast.error("Selecciona un documento antes de guardar");
      return;
    }

    if (seleccionado === "__otro__") {
      const nombreDocumento = `${
        customNombrePorCategoria[categoria.id] ?? ""
      }`.trim();

      if (!nombreDocumento) {
        toast.error("Escribe el nombre del documento");
        return;
      }

      crearItemPersonalizado({
        expedienteId,
        categoriaId: categoria.id,
        payload: {
          categoria: mapCategoriaApi(categoria.id),
          nombre_documento: nombreDocumento,
          anexado_en_venta: false,
          requiere_traduccion: false,
          usuario_id: usuarioId,
        },
      });

      return;
    }

    const plantillasDeCategoria = plantillasPorCategoria[categoria.id] ?? [];
    const selectedId = seleccionado.replace("__id__:", "");
    const match = plantillasDeCategoria.find(
      (item) => String(getPlantillaId(item)) === selectedId
    );

    if (!match) {
      toast.error("No se pudo identificar el documento del catalogo");
      return;
    }

    crearItem({
      expedienteId,
      categoriaId: categoria.id,
      payload: {
        plantilla_checklist_id: getPlantillaId(match),
        requiere_traduccion: false,
        observaciones: "Requisito seleccionado del catalogo",
        usuario_id: usuarioId,
      },
    });
  }

  function eliminarDocumento(item) {
    const docId = item?.doc_id ?? item?.id ?? null;

    if (!docId) {
      toast.error("No se pudo identificar el documento a eliminar");
      return;
    }

    eliminarItem({
      expedienteId,
      docId,
    });
  }

  function cambiarEstado(item, nuevoEstado) {
    if (!usuarioId) {
      toast.error("No hay usuario autenticado para actualizar el documento");
      return;
    }

    if (nuevoEstado === item.estado) {
      setOpenDropdownId(null);
      return;
    }

    const obsActual = observacionesEdit[item.id] ?? item.observaciones ?? "";

    actualizarEstado({
      itemId: item.id,
      expedienteId,
      payload: {
        estado: nuevoEstado,
        observaciones: obsActual,
        usuario_id: usuarioId,
      },
    });

    setOpenDropdownId(null);
  }

  function guardarObservaciones(item) {
    if (!usuarioId) {
      toast.error("No hay usuario autenticado para actualizar el documento");
      return;
    }

    actualizarEstado(
      {
        itemId: item.id,
        expedienteId,
        payload: {
          estado: item.estado,
          observaciones: observacionesEdit[item.id] ?? item.observaciones ?? "",
          usuario_id: usuarioId,
        },
      },
      {
        onSuccess: () => {
          setObservacionesEdit((prev) => {
            const next = { ...prev };
            delete next[item.id];
            return next;
          });
          setEditObsId(null);
        },
      }
    );
  }

  useEffect(() => {
    if (!openDropdownId) return;

    const menuHeight = ESTADOS_SELECTABLES.length * 36 + 44;

    const handleClickOutside = (event) => {
      if (dropdownContenedorRef.current?.contains(event.target)) return;
      setOpenDropdownId(null);
    };

    const handleKey = (event) => {
      if (event.key === "Escape") {
        setOpenDropdownId(null);
      }
    };

    const handlePosChange = () => {
      const selector = `[data-estado-selector-id="${openDropdownId}"]`;
      const button = document.querySelector(selector);

      if (!button) return;

      const rect = button.getBoundingClientRect();
      const espacioAbajo = window.innerHeight - rect.bottom;
      const espacioArriba = rect.top;
      const ultimoItem =
        checklistVisible.length > 0
          ? checklistVisible[checklistVisible.length - 1].id === openDropdownId
          : false;
      const abrirArriba =
        ultimoItem ||
        (espacioAbajo < menuHeight + 16 && espacioArriba > espacioAbajo);

      setDropdownPos((prev) => ({
        ...prev,
        [openDropdownId]: {
          top: abrirArriba
            ? Math.max(8, rect.top - menuHeight - 8)
            : rect.bottom + 8,
          left: Math.max(12, Math.min(rect.left, window.innerWidth - 260)),
          width: Math.max(rect.width, 240),
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
  }, [checklistVisible, openDropdownId]);

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
        </div>
      </div>
    );
  }

  return (
    <div className="px-8 py-8">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {categorias.map((categoria) => {
          const IconCat = categoria.icon;
          const items = itemsPorCategoria[categoria.id] ?? [];
          const statCat = resumen.porCat[categoria.id] ?? {
            total: 0,
            completados: 0,
            pct: 0,
          };
          const agregando = !!agregandoPorCategoria[categoria.id];
          const selectValue = selectorPorCategoria[categoria.id] || "";
          const plantillasDeCat = plantillasPorCategoria[categoria.id] ?? [];
          const opcionesSelect = plantillasDeCat.filter((item) => {
            const titulo = normalizarParaMatch(getPlantillaTitulo(item));

            if (!titulo) return false;

            return !plantillasTitulosYaUsados.has(titulo);
          });

          return (
            <section
              key={categoria.id}
              className={`flex flex-col rounded-2xl border border-slate-200 bg-white ring-1 ring-slate-100 transition dark:border-slate-800 dark:bg-slate-900/40 dark:ring-slate-800 ${categoria.color.ring}`}
            >
              <header className="flex items-start justify-between gap-3 border-b border-slate-200 p-4 dark:border-slate-800 xl:p-5">
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${categoria.color.badge} ${categoria.color.darkBadge}`}
                  >
                    <IconCat size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3
                        className={`min-w-0 truncate text-[14px] font-bold sm:text-[15px] ${categoria.color.head}`}
                      >
                        {categoria.titulo}
                      </h3>
                      <span
                        className={`inline-flex shrink-0 items-center rounded-md border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${categoria.color.badge} ${categoria.color.darkBadge}`}
                      >
                        {statCat.completados}/{statCat.total}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-slate-500 dark:text-slate-400">
                      {categoria.descripcion}
                    </p>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200/70 dark:bg-slate-800">
                      <div
                        className="h-full rounded-full transition-all duration-700 ease-out"
                        style={{
                          width: `${statCat.pct}%`,
                          backgroundColor: categoria.color.accent,
                        }}
                      />
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setAgregandoPorCategoria((prev) => ({
                      ...prev,
                      [categoria.id]: !prev[categoria.id],
                    }));

                    if (!agregando) {
                      setSelectorPorCategoria((prev) => ({
                        ...prev,
                        [categoria.id]: "",
                      }));
                      setCustomNombrePorCategoria((prev) => ({
                        ...prev,
                        [categoria.id]: "",
                      }));
                    }
                  }}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wide transition sm:px-3 sm:py-2 sm:text-[11px] ${
                    agregando
                      ? "border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                      : "border-transparent text-white hover:brightness-110"
                  }`}
                  style={agregando ? undefined : { backgroundColor: categoria.color.accent }}
                >
                  {agregando ? (
                    <>
                      <X size={11} />
                      Cancelar
                    </>
                  ) : (
                    <>
                      <Plus size={11} />
                      Agregar
                    </>
                  )}
                </button>
              </header>

              {agregando ? (
                <div className="border-b border-slate-200 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-900/50">
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <p
                      className={`text-[10px] font-bold uppercase tracking-wider ${categoria.color.head}`}
                    >
                      Agregar requisito - {categoria.titulo}
                    </p>
                    {plantillasCargando ? (
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                        <Loader2 size={10} className="animate-spin" />
                        Cargando plantillas...
                      </div>
                    ) : null}
                  </div>

                  <label className="block">
                    <span className="mb-1 block text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                      Selecciona el titulo del requisito
                    </span>
                    <select
                      value={selectValue}
                      onChange={(event) =>
                        setSelectorPorCategoria((prev) => ({
                          ...prev,
                          [categoria.id]: event.target.value,
                        }))
                      }
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[12px] text-slate-800 outline-none ring-[#0d1b5e]/20 transition focus:border-[#0d1b5e] focus:ring-2 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    >
                      <option value="">- Sin seleccionar -</option>
                      {opcionesSelect.length ? (
                        <optgroup label="Plantillas disponibles">
                          {opcionesSelect.map((item) => {
                            const id = getPlantillaId(item);
                            const titulo = getPlantillaTitulo(item);

                            return (
                              <option
                                key={`${categoria.id}-pl-${id ?? titulo}`}
                                value={id ? `__id__:${id}` : titulo}
                              >
                                {titulo}
                              </option>
                            );
                          })}
                          <option value="__otro__">Otro</option>
                        </optgroup>
                      ) : (
                        <>
                          <option disabled value="">
                            No hay plantillas disponibles para esta categoria
                          </option>
                          <option value="__otro__">Otro</option>
                        </>
                      )}
                    </select>
                  </label>

                  {selectValue === "__otro__" ? (
                    <label className="mt-3 block">
                      <span className="mb-1 block text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                        Nombre del documento
                      </span>
                      <input
                        type="text"
                        value={customNombrePorCategoria[categoria.id] || ""}
                        onChange={(event) =>
                          setCustomNombrePorCategoria((prev) => ({
                            ...prev,
                            [categoria.id]: event.target.value,
                          }))
                        }
                        placeholder="Escribe el documento"
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[12px] text-slate-800 outline-none ring-[#0d1b5e]/20 transition focus:border-[#0d1b5e] focus:ring-2 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                      />
                    </label>
                  ) : null}

                  <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setAgregandoPorCategoria((prev) => ({
                          ...prev,
                          [categoria.id]: false,
                        }));
                        setSelectorPorCategoria((prev) => ({
                          ...prev,
                          [categoria.id]: "",
                        }));
                        setCustomNombrePorCategoria((prev) => ({
                          ...prev,
                          [categoria.id]: "",
                        }));
                      }}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-600 transition hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={() => confirmarAgregar(categoria)}
                      disabled={
                        (creandoItem || creandoItemPersonalizado) ||
                        !selectValue
                      }
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[#0d1b5e] px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {creandoItem || creandoItemPersonalizado ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <Plus size={12} />
                      )}
                      {creandoItem || creandoItemPersonalizado
                        ? "Guardando..."
                        : "Guardar"}
                    </button>
                  </div>
                </div>
              ) : null}

              <div className="flex flex-1 flex-col gap-3 p-4">
                {isLoading && !items.length ? (
                  <div className="flex flex-col gap-3">
                    {[0, 1].map((i) => (
                      <div
                        key={i}
                        className="animate-pulse rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 shrink-0 rounded-lg bg-slate-100 dark:bg-slate-800" />
                          <div className="flex-1 space-y-1.5">
                            <div className="h-3.5 w-4/5 rounded bg-slate-100 dark:bg-slate-800" />
                            <div className="h-3 w-1/2 rounded bg-slate-100 dark:bg-slate-800" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : items.length ? (
                  items.map((item) => {
                    const style = getEstadoStyle(item.estado);
                    const IconComp = style.icon;
                    const isDropdownOpen = openDropdownId === item.id;
                    const isEditingObs = editObsId === item.id;
                    const obsValue =
                      observacionesEdit[item.id] ?? item.observaciones ?? "";

                    return (
                      <div
                        key={item.id}
                        className={`${
                          isDropdownOpen || isEditingObs ? "z-40" : "z-0"
                        } relative rounded-xl p-4 transition-all duration-300 hover:shadow-md ${style.container}`}
                      >
                        <div className="flex flex-col gap-3">
                          <div className="flex items-start gap-3">
                            <div
                              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${style.iconBox}`}
                            >
                              <IconComp size={18} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4
                                className={`text-[14px] font-semibold leading-5 ${style.title}`}
                              >
                                {item.titulo_requisito}
                              </h4>

                              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                                <div className="relative">
                                  <button
                                    type="button"
                                    data-estado-selector-id={item.id}
                                    disabled={actualizando}
                                    onClick={() =>
                                      setOpenDropdownId(
                                        isDropdownOpen ? null : item.id
                                      )
                                    }
                                    className={`inline-flex items-center gap-1.5 transition ${getSelectEstadoStyle(
                                      item.estado
                                    )} ${
                                      actualizando
                                        ? "opacity-60"
                                        : "hover:brightness-110"
                                    }`}
                                  >
                                    {actualizando ? (
                                      <Loader2
                                        size={12}
                                        className="animate-spin"
                                      />
                                    ) : (
                                      <span
                                        className={`h-1.5 w-1.5 rounded-full ${style.dot}`}
                                      />
                                    )}
                                    {formatEstadoLabel(item.estado)}
                                    <ChevronDown
                                      size={12}
                                      className={`transition-transform ${
                                        isDropdownOpen ? "rotate-180" : ""
                                      }`}
                                    />
                                  </button>
                                </div>

                                {isEditingObs ? (
                                  <div className="flex w-full items-center gap-2 sm:w-[260px] sm:flex-1">
                                    <input
                                      type="text"
                                      value={obsValue}
                                      onChange={(event) =>
                                        setObservacionesEdit((prev) => ({
                                          ...prev,
                                          [item.id]: event.target.value,
                                        }))
                                      }
                                      placeholder="Agregar observaciones..."
                                      className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-[11px] text-slate-800 outline-none ring-[#0d1b5e]/20 transition focus:border-[#0d1b5e] focus:ring-2 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                                      autoFocus
                                    />
                                    <button
                                      type="button"
                                      onClick={() => guardarObservaciones(item)}
                                      className="inline-flex items-center gap-1 rounded-lg bg-[#0d1b5e] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-white transition hover:brightness-110"
                                    >
                                      Guardar
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditObsId(null);
                                        setObservacionesEdit((prev) => {
                                          const next = { ...prev };
                                          delete next[item.id];
                                          return next;
                                        });
                                      }}
                                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-600 transition hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                                    >
                                      Cancelar
                                    </button>
                                  </div>
                                ) : (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setObservacionesEdit((prev) => ({
                                          ...prev,
                                          [item.id]:
                                            item.observaciones ?? "",
                                        }));
                                        setEditObsId(item.id);
                                      }}
                                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600 transition hover:border-[#0d1b5e] hover:text-[#0d1b5e] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                                    >
                                      <FilePenLine size={11} />
                                      {item.observaciones
                                        ? "Editar nota"
                                        : "Agregar nota"}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => eliminarDocumento(item)}
                                      disabled={eliminandoItem}
                                      className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-red-600 transition hover:border-red-400 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-900/50 dark:bg-slate-900 dark:text-red-300"
                                    >
                                      <Trash2 size={11} />
                                      Eliminar
                                    </button>
                                  </>
                                )}
                              </div>

                              {!isEditingObs &&
                                (item.observaciones ? (
                                  <p
                                    className={`mt-2 text-[11px] leading-5 ${style.meta}`}
                                  >
                                    {item.observaciones}
                                  </p>
                                ) : item.estado === ESTADOS.PENDIENTE ? (
                                  <p
                                    className={`mt-2 text-[11px] italic ${style.meta}`}
                                  >
                                    Sin observaciones registradas
                                  </p>
                                ) : null)}

                              <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-slate-500 dark:text-slate-400">
                                {item.usuario_actualizador ? (
                                  <div className="flex items-center gap-1.5">
                                    <User size={11} />
                                    <span className="font-medium">
                                      {item.usuario_actualizador}
                                    </span>
                                  </div>
                                ) : null}
                                {item.updated_at ? (
                                  <div className="flex items-center gap-1.5">
                                    <Clock size={11} />
                                    <span>
                                      Actualizado:{" "}
                                      <span className="font-semibold">
                                        {item.updated_at}
                                      </span>
                                    </span>
                                  </div>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="mt-1 flex flex-1 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white p-6 text-center dark:border-slate-800 dark:bg-slate-900/30">
                    <div>
                      <div
                        className={`mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl border ${categoria.color.badge} ${categoria.color.darkBadge}`}
                      >
                        <Plus size={16} />
                      </div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Sin requisitos
                      </p>
                      <p className="mt-1 text-[10px] text-slate-400 dark:text-slate-500">
                        Presiona "Agregar" para incluir documentacion en esta
                        categoria
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </section>
          );
        })}
      </div>

      {openDropdownId
        ? (() => {
            const itemActivo = checklistVisible.find(
              (item) => item.id === openDropdownId
            );
            const pos = dropdownPos[openDropdownId];

            if (!itemActivo || !pos) return null;

            const estadoActual = itemActivo.estado;

            return createPortal(
              <div
                ref={dropdownContenedorRef}
                className="fixed z-[9999] overflow-visible rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
                style={{
                  top: pos.top,
                  left: Math.max(12, pos.left),
                  width: Math.min(pos.width, 320),
                }}
              >
                <div className="border-b border-slate-100 px-3 py-2 dark:border-slate-800">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Cambiar estado
                  </p>
                </div>
                <ul className="p-1">
                  {ESTADOS_SELECTABLES.map((estadoOpt) => {
                    const optStyle = getEstadoStyle(estadoOpt);
                    const isCurrent = estadoOpt === estadoActual;

                    return (
                      <li key={estadoOpt}>
                        <button
                          type="button"
                          onClick={() =>
                            cambiarEstado(itemActivo, estadoOpt)
                          }
                          className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-semibold transition ${
                            isCurrent
                              ? "bg-slate-100 dark:bg-slate-800"
                              : "hover:bg-slate-50 dark:hover:bg-slate-800/70"
                          }`}
                        >
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${optStyle.badge}`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${optStyle.dot}`}
                            />
                            {formatEstadoLabel(estadoOpt)}
                          </span>
                          {isCurrent ? (
                            <CheckCircle2
                              size={12}
                              className="ml-auto text-emerald-500"
                            />
                          ) : null}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>,
              document.body
            );
          })()
        : null}
    </div>
  );
}
