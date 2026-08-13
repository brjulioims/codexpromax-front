import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileCheck,
  FilePenLine,
  FileText,
  Languages,
  Loader2,
  Plus,
  Settings2,
  Trash2,
  User,
  X,
  AlertCircle,
  Save,
} from "lucide-react";
import toast from "react-hot-toast";

import ModalGeneral from "../../../ui/ModalGeneral";
import {
  useCreateChecklistItemMutation,
  useCreateCustomChecklistItemMutation,
  useDeleteChecklistItemMutation,
  useUpdateChecklistItemMutation,
} from "../../../../hooks/mutations/useChecklistMutations";
import { useExpedienteChecklistQuery } from "../../../../hooks/queries/useExpedienteChecklistQuery";
import { usePlantillasChecklistQuery } from "../../../../hooks/queries/usePlantillasChecklistQuery";
import { useMeQuery } from "../../../../hooks/queries/useMeQuery";
import { queryKeys } from "../../../../utils/queryKeys";

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
      head: "text-[#0d1b5e] dark:text-blue-200",
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
      head: "text-emerald-700 dark:text-emerald-200",
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
      head: "text-orange-700 dark:text-orange-200",
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

  const queryClient = useQueryClient();
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

  const { mutate: solicitarTraduccionChecklistItem, isPending: enviandoATraduccion } =
    useMutation({
      mutationFn: ({ itemId, prioridad, observaciones }) =>
        solicitarTraduccionChecklistItem(expedienteId, itemId, {
          prioridad: prioridad || "MEDIA",
          observaciones: `${observaciones ?? ""}`.trim() || undefined,
          usuario_id: usuarioId,
        }),
      onSuccess: () => {
        toast.success(
          "Solicitud de traducción creada correctamente — el ítem será marcado como EN_TRADUCCION."
        );
        queryClient.invalidateQueries({
          queryKey: queryKeys.expedienteChecklist.byExpediente(expedienteId),
          exact: false,
        });
      },
      onError: (err) => {
        console.error("Error solicitando traducción del item:", err);
        toast.error(
          err?.message || "No se pudo enviar el documento a traducción."
        );
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
      onSuccess: () => {
        toast.success("Documento agregado correctamente");
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
    onSuccess: () => {
      toast.success("Documento agregado correctamente");
    },
    onError: (err) => {
      console.error("Error creando documento personalizado:", err);
      toast.error(err?.message || "No se pudo agregar el documento");
    },
  });

  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [dropdownPos, setDropdownPos] = useState({});
  const dropdownContenedorRef = useRef(null);
  const modalRef = useRef(null);
  const modalEditarRef = useRef(null);
  const [modalCategoriaId, setModalCategoriaId] = useState(null);
  const [modalSelectValue, setModalSelectValue] = useState("");
  const [modalCustomNombre, setModalCustomNombre] = useState("");
  const [modalRequiereTraduccion, setModalRequiereTraduccion] = useState(false);
  const [modalObservaciones, setModalObservaciones] = useState("");
  const [modalEditarItemId, setModalEditarItemId] = useState(null);
  const [modalEditarReqTrad, setModalEditarReqTrad] = useState(false);
  const [modalEditarObs, setModalEditarObs] = useState("");

  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: "",
    message: "",
    confirmText: "Confirmar",
    cancelText: "Cancelar",
    variant: "default",
    icon: AlertCircle,
    onConfirm: null,
  });

  function abrirConfirmacion(config) {
    setConfirmDialog({
      open: true,
      title: config.title ?? "Confirmar acción",
      message: config.message ?? "¿Estás seguro de continuar?",
      confirmText: config.confirmText ?? "Confirmar",
      cancelText: config.cancelText ?? "Cancelar",
      variant: config.variant ?? "default",
      icon: config.icon ?? AlertCircle,
      onConfirm: () => {
        setConfirmDialog((prev) => ({ ...prev, open: false }));
        config.onConfirm?.();
      },
    });
  }

  function cerrarConfirmacion() {
    setConfirmDialog((prev) => ({ ...prev, open: false, onConfirm: null }));
  }

  function abrirModalAgregar(categoriaId) {
    setModalCategoriaId(categoriaId);
    setModalSelectValue("");
    setModalCustomNombre("");
    setModalRequiereTraduccion(false);
    setModalObservaciones("");
  }

  function cerrarModalAgregar() {
    setModalCategoriaId(null);
    setModalSelectValue("");
    setModalCustomNombre("");
    setModalRequiereTraduccion(false);
    setModalObservaciones("");
  }

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

  const opcionesModalPorCategoria = (() => {
    const out = {};
    categorias.forEach((categoria) => {
      const plantillasDeCat = plantillasPorCategoria[categoria.id] ?? [];
      out[categoria.id] = plantillasDeCat.filter((item) => {
        const titulo = normalizarParaMatch(getPlantillaTitulo(item));
        if (!titulo) return false;
        return !plantillasTitulosYaUsados.has(titulo);
      });
    });
    return out;
  })();

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

    const seleccionado = modalSelectValue || "";
    if (!seleccionado) {
      toast.error("Selecciona un documento antes de guardar");
      return;
    }

    if (seleccionado === "__otro__") {
      const nombreDocumento = `${modalCustomNombre ?? ""}`.trim();
      if (!nombreDocumento) {
        toast.error("Escribe el nombre del documento");
        return;
      }
    } else {
      const plantillasDeCategoria = plantillasPorCategoria[categoria.id] ?? [];
      const selectedId = seleccionado.replace("__id__:", "");
      const match = plantillasDeCategoria.find(
        (item) => String(getPlantillaId(item)) === selectedId
      );
      if (!match) {
        toast.error("No se pudo identificar el documento del catalogo");
        return;
      }
    }

    const nombreDoc =
      seleccionado === "__otro__"
        ? `${modalCustomNombre ?? ""}`.trim()
        : (() => {
            const plantillasDeCategoria = plantillasPorCategoria[categoria.id] ?? [];
            const selectedId = seleccionado.replace("__id__:", "");
            const match = plantillasDeCategoria.find(
              (item) => String(getPlantillaId(item)) === selectedId
            );
            return match ? getPlantillaTitulo(match) : "";
          })();

    const valoresSnapshot = {
      seleccionado,
      reqTrad: !!modalRequiereTraduccion,
      obs: `${modalObservaciones ?? ""}`.trim(),
      customNombre: `${modalCustomNombre ?? ""}`.trim(),
    };

    cerrarModalAgregar();

    abrirConfirmacion({
      title: "Guardar nuevo requisito",
      message: `¿Estás seguro de agregar el documento "${nombreDoc}" a la categoría "${categoria.titulo}"?`,
      confirmText: "Sí, guardar",
      cancelText: "Cancelar",
      variant: "primary",
      icon: Save,
      onConfirm: () => ejecutarAgregar(categoria, valoresSnapshot),
    });
  }

  function ejecutarAgregar(categoria, snap) {
    const { seleccionado, reqTrad, obs, customNombre } = snap ?? {};

    if (seleccionado === "__otro__") {
      crearItemPersonalizado({
        expedienteId,
        categoriaId: categoria.id,
        payload: {
          categoria: mapCategoriaApi(categoria.id),
          nombre_documento: customNombre,
          anexado_en_venta: false,
          requiere_traduccion: reqTrad,
          observaciones: obs || undefined,
          usuario_id: usuarioId,
        },
      });
      return;
    }

    const plantillasDeCategoria = plantillasPorCategoria[categoria.id] ?? [];
    const selectedId = (seleccionado ?? "").replace("__id__:", "");
    const match = plantillasDeCategoria.find(
      (item) => String(getPlantillaId(item)) === selectedId
    );

    crearItem({
      expedienteId,
      categoriaId: categoria.id,
      payload: {
        plantilla_checklist_id: getPlantillaId(match),
        requiere_traduccion: reqTrad,
        observaciones: obs || undefined,
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

    abrirConfirmacion({
      title: "Eliminar documento",
      message: `¿Estás seguro de eliminar el documento "${item?.titulo_requisito ?? item?.nombre_documento ?? "este documento"}"? Esta acción no se puede deshacer.`,
      confirmText: "Sí, eliminar",
      cancelText: "Cancelar",
      variant: "danger",
      icon: Trash2,
      onConfirm: () =>
        eliminarItem({
          expedienteId,
          docId,
        }),
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

    const obsActual = item.observaciones ?? "";

    abrirConfirmacion({
      title: "Cambiar estado del documento",
      message: `¿Estás seguro de cambiar el estado de "${item?.titulo_requisito ?? item?.nombre_documento ?? "este documento"}" de "${formatEstadoLabel(item.estado)}" a "${formatEstadoLabel(nuevoEstado)}"?`,
      confirmText: "Sí, cambiar estado",
      cancelText: "Cancelar",
      variant: "primary",
      icon: CheckCircle2,
      onConfirm: () =>
        ejecutarCambioEstado(item, nuevoEstado, obsActual),
    });
  }

  function ejecutarCambioEstado(item, nuevoEstado, obsActual) {
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

  function abrirModalEditar(item) {
    setModalEditarItemId(item.id);
    setModalEditarReqTrad(Boolean(item.requiere_traduccion));
    setModalEditarObs(`${item.observaciones ?? ""}`);
  }

  function cerrarModalEditar() {
    setModalEditarItemId(null);
    setModalEditarReqTrad(false);
    setModalEditarObs("");
  }

  function guardarModalEditar(item) {
    if (!usuarioId) {
      toast.error("No hay usuario autenticado para actualizar el documento");
      return;
    }

    const obs = `${modalEditarObs ?? ""}`.trim();
    const reqTrad = !!modalEditarReqTrad;

    cerrarModalEditar();

    abrirConfirmacion({
      title: "Guardar cambios",
      message: `¿Estás seguro de guardar los cambios realizados en el documento "${item?.titulo_requisito ?? item?.nombre_documento ?? "este documento"}"?`,
      confirmText: "Sí, guardar cambios",
      cancelText: "Cancelar",
      variant: "primary",
      icon: Save,
      onConfirm: () =>
        ejecutarGuardarEdicion(item, obs, reqTrad),
    });
  }

  function ejecutarGuardarEdicion(item, obs, reqTrad) {
    actualizarEstado({
      itemId: item.id,
      expedienteId,
      payload: {
        estado: item.estado,
        observaciones: obs,
        requiere_traduccion: reqTrad,
        usuario_id: usuarioId,
      },
    });
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
        if (modalCategoriaId) {
          cerrarModalAgregar();
        } else {
          setOpenDropdownId(null);
        }
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
  }, [checklistVisible, openDropdownId, modalCategoriaId]);

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
              </header>

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
                  <>
                    {items.map((item) => {
                      const style = getEstadoStyle(item.estado);
                      const IconComp = style.icon;
                      const isDropdownOpen = openDropdownId === item.id;
                      const requiereTraduccion = Boolean(item.requiere_traduccion);

                      return (
                        <div
                          key={item.id}
                          className={`${
                            isDropdownOpen ? "z-40" : "z-0"
                          } relative rounded-xl p-4 transition-all duration-300 hover:shadow-md ${style.container}`}
                        >
                          <div className="flex flex-col gap-3">
                            <div className="flex items-start gap-3">
                              <div
                                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-xl ${style.iconBox}`}
                              >
                                <IconComp size={18} />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h4
                                    className={`min-w-0 truncate text-[14px] font-semibold leading-5 ${style.title}`}
                                  >
                                    {item.titulo_requisito}
                                  </h4>
                                </div>

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
                                    </button>
                                  </div>

                                  {requiereTraduccion ? (
                                    (() => {
                                      const yaEnviado =
                                        item.estado === ESTADOS.EN_TRADUCCION ||
                                        item.estado === ESTADOS.TRADUCIDO ||
                                        item.estado === ESTADOS.EN_QUALITY_TRADUCCION;

                                      const labelBoton = enviandoATraduccion
                                        ? "Enviando..."
                                        : yaEnviado
                                          ? formatEstadoLabel(item.estado)
                                          : "Enviado a Traducción";

                                      return (
                                        <span
                                          className="inline-flex items-center gap-1.5 rounded-lg border border-[#0e183f]/40 bg-[#0e183f]/95 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wide text-white cursor-default select-none dark:border-[#0e183f]/60 dark:bg-[#0e183f]"
                                        >
                                          {enviandoATraduccion ? (
                                            <Loader2
                                              size={11}
                                              className="animate-spin"
                                            />
                                          ) : (
                                            <Languages size={11} />
                                          )}
                                          {labelBoton}
                                        </span>
                                      );
                                    })()
                                  ) : null}

                                  <button
                                    type="button"
                                    onClick={() => abrirModalEditar(item)}
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600 transition hover:border-[#0d1b5e] hover:text-[#0d1b5e] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                                  >
                                    <Settings2 size={11} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => eliminarDocumento(item)}
                                    disabled={eliminandoItem}
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-red-600 transition hover:border-red-400 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-900/50 dark:bg-slate-900 dark:text-red-300"
                                  >
                                    <Trash2 size={11} />
                                  </button>
                                </div>

                                {item.observaciones ? (
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
                                ) : null}

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
                    })}
                    <button
                      type="button"
                      onClick={() => abrirModalAgregar(categoria.id)}
                      className={`mt-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-dashed px-3 py-2 text-[11px] font-bold uppercase tracking-wide transition ${categoria.color.badge} ${categoria.color.darkBadge} hover:brightness-105`}
                    >
                      <Plus size={12} />
                      Agregar requisito
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => abrirModalAgregar(categoria.id)}
                    className="mt-1 flex flex-1 cursor-pointer items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white p-6 text-center transition hover:border-slate-400 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900/30 dark:hover:bg-slate-900/60"
                  >
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
                        Presiona aqui para agregar el primer requisito en esta
                        categoria
                      </p>
                    </div>
                  </button>
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

      {modalCategoriaId
        ? (() => {
            const categoriaModal = categorias.find(
              (c) => c.id === modalCategoriaId
            );
            if (!categoriaModal) return null;
            const IconCat = categoriaModal.icon;
            const opcionesSelect =
              opcionesModalPorCategoria[modalCategoriaId] ?? [];
            const disabledGuardar =
              creandoItem ||
              creandoItemPersonalizado ||
              !modalSelectValue ||
              (modalSelectValue === "__otro__" &&
                !`${modalCustomNombre}`.trim());

            return (
              <ModalGeneral
                ref={modalRef}
                open
                onClose={cerrarModalAgregar}
                header={
                  <div className="flex min-w-0 items-start gap-3">
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border ${categoriaModal.color.badge} ${categoriaModal.color.darkBadge}`}
                    >
                      <IconCat size={22} />
                    </div>
                    <div className="min-w-0">
                      <p
                        className={`text-[11px] font-bold uppercase tracking-wider ${categoriaModal.color.head}`}
                      >
                        Agregar requisito
                      </p>
                      <h2 className="mt-0.5 truncate text-[17px] font-bold text-slate-800 dark:text-slate-100 sm:text-[18px]">
                        {categoriaModal.titulo}
                      </h2>
                    </div>
                  </div>
                }
                size="lg"
                zIndex={10000}
                footer={
                  <>
                    <button
                      type="button"
                      onClick={cerrarModalAgregar}
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-[12px] font-bold uppercase tracking-wide text-slate-600 transition hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                    >
                      <X size={14} />
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={() => confirmarAgregar(categoriaModal)}
                      disabled={disabledGuardar}
                      className="inline-flex items-center gap-2 rounded-lg bg-[#0d1b5e] px-5 py-2.5 text-[12px] font-bold uppercase tracking-wide text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {creandoItem || creandoItemPersonalizado ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Plus size={14} />
                      )}
                      {creandoItem || creandoItemPersonalizado
                        ? "Guardando..."
                        : "Guardar"}
                    </button>
                  </>
                }
              >
                <div className="space-y-5">
                  {plantillasCargando ? (
                    <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/60 p-4 text-[12px] text-slate-500 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400">
                      <Loader2 size={14} className="animate-spin" />
                      Cargando plantillas disponibles...
                    </div>
                  ) : null}

                  <label className="block">
                    <span className="mb-1.5 block text-[12px] font-semibold text-slate-600 dark:text-slate-300">
                      Selecciona el título del requisito
                    </span>
                    <select
                      value={modalSelectValue}
                      onChange={(e) => {
                        setModalSelectValue(e.target.value);
                        if (e.target.value !== "__otro__")
                          setModalCustomNombre("");
                      }}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-3 text-[13px] text-slate-800 outline-none ring-[#0d1b5e]/20 transition focus:border-[#0d1b5e] focus:ring-2 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    >
                      <option value="">- Sin seleccionar -</option>
                      {opcionesSelect.length ? (
                        <optgroup label="Plantillas disponibles">
                          {opcionesSelect.map((item) => {
                            const id = getPlantillaId(item);
                            const titulo = getPlantillaTitulo(item);
                            return (
                              <option
                                key={`modal-pl-${id ?? titulo}`}
                                value={id ? `__id__:${id}` : titulo}
                              >
                                {titulo}
                              </option>
                            );
                          })}
                          <option value="__otro__">Otro (personalizado)</option>
                        </optgroup>
                      ) : (
                        <>
                          <option disabled value="">
                            No hay plantillas disponibles para esta categoría
                          </option>
                          <option value="__otro__">Otro (personalizado)</option>
                        </>
                      )}
                    </select>
                  </label>

                  {modalSelectValue === "__otro__" ? (
                    <label className="block">
                      <span className="mb-1.5 block text-[12px] font-semibold text-slate-600 dark:text-slate-300">
                        Nombre del documento
                      </span>
                      <input
                        type="text"
                        value={modalCustomNombre}
                        onChange={(e) =>
                          setModalCustomNombre(e.target.value)
                        }
                        placeholder="Escribe el nombre del documento"
                        className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-3 text-[13px] text-slate-800 outline-none ring-[#0d1b5e]/20 transition focus:border-[#0d1b5e] focus:ring-2 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                        autoFocus
                      />
                    </label>
                  ) : null}

                  <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 bg-white/50 p-4 transition hover:border-[#0d1b5e]/40 hover:bg-[#0d1b5e]/5 dark:border-slate-800 dark:bg-slate-900/50 dark:hover:border-[#0d1b5e]/60 dark:hover:bg-[#0d1b5e]/10">
                    <input
                      type="checkbox"
                      checked={modalRequiereTraduccion}
                      onChange={(e) =>
                        setModalRequiereTraduccion(e.target.checked)
                      }
                      className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer rounded border-slate-300 text-[#0d1b5e] focus:ring-[#0d1b5e]/30 dark:border-slate-700"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-[12px] font-bold uppercase tracking-wide text-slate-700 dark:text-slate-200">
                        ¿Documento requiere traducción?
                      </p>
                      <p className="mt-1 text-[11px] leading-5 text-slate-500 dark:text-slate-400">
                        Si lo marcas, después de guardar podrás enviar este
                        documento a traducción desde la tarjeta.
                      </p>
                    </div>
                  </label>

                  <label className="block">
                    <span className="mb-1.5 block text-[12px] font-semibold text-slate-600 dark:text-slate-300">
                      Observaciones
                    </span>
                    <textarea
                      rows={3}
                      value={modalObservaciones}
                      onChange={(e) => setModalObservaciones(e.target.value)}
                      placeholder="Información adicional del requisito (opcional)"
                      className="w-full resize-none rounded-lg border border-slate-300 bg-white px-3.5 py-3 text-[13px] text-slate-800 outline-none ring-[#0d1b5e]/20 transition focus:border-[#0d1b5e] focus:ring-2 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    />
                  </label>
                </div>
              </ModalGeneral>
            );
          })()
        : null}

      {modalEditarItemId
        ? (() => {
            const itemEditando = checklistVisible.find(
              (it) => String(it.id) === String(modalEditarItemId)
            );
            if (!itemEditando) return null;

            return (
              <ModalGeneral
                ref={modalEditarRef}
                open
                onClose={cerrarModalEditar}
                header={
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[#0d1b5e]/20 bg-[#0d1b5e]/5 dark:border-blue-900/50 dark:bg-blue-950/40">
                      <Settings2 size={22} className="text-[#0d1b5e] dark:text-blue-300" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-[#0d1b5e]">
                        Editar documento
                      </p>
                      <h2 className="mt-0.5 truncate text-[17px] font-bold text-slate-800 dark:text-slate-100 sm:text-[18px]">
                        {itemEditando.titulo_requisito}
                      </h2>
                    </div>
                  </div>
                }
                size="lg"
                zIndex={10000}
                footer={
                  <>
                    <button
                      type="button"
                      onClick={cerrarModalEditar}
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-[12px] font-bold uppercase tracking-wide text-slate-600 transition hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                    >
                      <X size={14} />
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={() => guardarModalEditar(itemEditando)}
                      disabled={actualizando}
                      className="inline-flex items-center gap-2 rounded-lg bg-[#0d1b5e] px-5 py-2.5 text-[12px] font-bold uppercase tracking-wide text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {actualizando ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Save size={14} />
                      )}
                      {actualizando ? "Guardando..." : "Guardar cambios"}
                    </button>
                  </>
                }
              >
                <div className="space-y-5">
                  <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 bg-white/50 p-4 transition hover:border-[#0d1b5e]/40 hover:bg-[#0d1b5e]/5 dark:border-slate-800 dark:bg-slate-900/50 dark:hover:border-[#0d1b5e]/60 dark:hover:bg-[#0d1b5e]/10">
                    <input
                      type="checkbox"
                      checked={modalEditarReqTrad}
                      onChange={(e) =>
                        setModalEditarReqTrad(e.target.checked)
                      }
                      className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer rounded border-slate-300 text-[#0d1b5e] focus:ring-[#0d1b5e]/30 dark:border-slate-700"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-[12px] font-bold uppercase tracking-wide text-slate-700 dark:text-slate-200">
                        ¿Documento requiere traducción?
                      </p>
                      <p className="mt-1 text-[11px] leading-5 text-slate-500 dark:text-slate-400">
                        Actívalo para poder enviar este documento a traducción
                        después.
                      </p>
                    </div>
                  </label>

                  <label className="block">
                    <span className="mb-1.5 block text-[12px] font-semibold text-slate-600 dark:text-slate-300">
                      Observaciones
                    </span>
                    <textarea
                      rows={3}
                      value={modalEditarObs}
                      onChange={(e) => setModalEditarObs(e.target.value)}
                      placeholder="Información adicional del requisito (opcional)"
                      className="w-full resize-none rounded-lg border border-slate-300 bg-white px-3.5 py-3 text-[13px] text-slate-800 outline-none ring-[#0d1b5e]/20 transition focus:border-[#0d1b5e] focus:ring-2 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    />
                  </label>
                </div>
              </ModalGeneral>
            );
          })()
        : null}

      {confirmDialog.open
        ? (() => {
            const IconConfirm = confirmDialog.icon ?? AlertCircle;
            const variantConfig = (() => {
              switch (confirmDialog.variant) {
                case "danger":
                  return {
                    iconBox:
                      "border-red-200 bg-red-50 text-red-600 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-400",
                    title: "text-red-700 dark:text-red-300",
                    btnConfirm:
                      "bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600",
                  };
                case "success":
                  return {
                    iconBox:
                      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-400",
                    title: "text-emerald-700 dark:text-emerald-300",
                    btnConfirm:
                      "bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600",
                  };
                case "primary":
                default:
                  return {
                    iconBox:
                      "border-[#0d1b5e]/20 bg-[#0d1b5e]/5 text-[#0d1b5e] dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-300",
                    title: "text-[#0d1b5e] dark:text-blue-200",
                    btnConfirm:
                      "bg-[#0d1b5e] hover:brightness-110 dark:bg-blue-800 dark:hover:bg-blue-700",
                  };
              }
            })();

            return (
              <ModalGeneral
                open
                onClose={cerrarConfirmacion}
                size="md"
                zIndex={99999}
                showClose={false}
                closeOnBackdrop={false}
                closeOnEscape={false}
                footer={
                  <>
                    <button
                      type="button"
                      onClick={cerrarConfirmacion}
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-[12px] font-bold uppercase tracking-wide text-slate-600 transition hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                    >
                      <X size={14} />
                      {confirmDialog.cancelText}
                    </button>
                    <button
                      type="button"
                      onClick={() => confirmDialog.onConfirm?.()}
                      className={`inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-[12px] font-bold uppercase tracking-wide text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${variantConfig.btnConfirm}`}
                    >
                      <CheckCircle2 size={14} />
                      {confirmDialog.confirmText}
                    </button>
                  </>
                }
              >
                <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
                  <div
                    className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border ${variantConfig.iconBox}`}
                  >
                    <IconConfirm size={26} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-[15px] font-bold leading-6 ${variantConfig.title}`}
                    >
                      {confirmDialog.title}
                    </p>
                    <p className="mt-2 text-[13px] leading-6 text-slate-600 dark:text-slate-400">
                      {confirmDialog.message}
                    </p>
                  </div>
                </div>
              </ModalGeneral>
            );
          })()
        : null}
    </div>
  );
}