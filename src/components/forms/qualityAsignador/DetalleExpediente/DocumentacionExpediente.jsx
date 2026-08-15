import { useEffect, useMemo, useRef, useState } from "react";
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
import { solicitarTraduccionChecklistItem } from "../../../../services/paralegalServices";
import { reactivarTraduccionParalegal } from "../../../../services/traduccionServices";
import { usePlantillasChecklistQuery } from "../../../../hooks/queries/usePlantillasChecklistQuery";
import { useMeQuery } from "../../../../hooks/queries/useMeQuery";
import { queryKeys } from "../../../../utils/queryKeys";
import Swal from "sweetalert2";

const CATEGORIA_META = {
  biograficos: {
    titulo: "Documentos biograficos",
    descripcion: "Identidad, nacimiento y declaraciones personales",
    icon: FileText,
    color: {
      badge: "bg-slate-100/60 text-slate-500 border-slate-200/50 dark:bg-slate-800/30 dark:text-slate-400",
      ring: "ring-slate-100 dark:ring-slate-900",
      head: "text-slate-800 dark:text-white",
      accent: "#0d1b5e",
      darkBadge:
        "dark:bg-slate-800/30 dark:text-slate-400 dark:border-slate-800",
    },
  },
  evidencias: {
    titulo: "Evidencias",
    descripcion: "Pruebas documentales y fotograficas",
    icon: FileCheck,
    color: {
      badge: "bg-slate-100/60 text-slate-500 border-slate-200/50 dark:bg-slate-800/30 dark:text-slate-400",
      ring: "ring-slate-100 dark:ring-slate-900",
      head: "text-slate-800 dark:text-white",
      accent: "#0d1b5e",
      darkBadge:
        "dark:bg-slate-800/30 dark:text-slate-400 dark:border-slate-800",
    },
  },
  formularios: {
    titulo: "Formularios",
    descripcion: "Formatos oficiales y solicitudes",
    icon: FilePenLine,
    color: {
      badge: "bg-slate-100/60 text-slate-500 border-slate-200/50 dark:bg-slate-800/30 dark:text-slate-400",
      ring: "ring-slate-100 dark:ring-slate-900",
      head: "text-slate-800 dark:text-white",
      accent: "#0d1b5e",
      darkBadge:
        "dark:bg-slate-800/30 dark:text-slate-400 dark:border-slate-800",
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
    case "RECIBIDO":
      return {
        container:
          "pl-1 bg-transparent",
        iconBox: "bg-emerald-500 text-white dark:bg-emerald-600",
        icon: CheckCircle2,
        badge: "bg-emerald-500 text-white",
        dot: "bg-white",
        title: "text-slate-800 dark:text-slate-200 font-semibold",
        meta: "text-slate-500 dark:text-slate-400",
      };
    case "PENDIENTE":
      return {
        container:
          "pl-1 bg-transparent",
        iconBox: "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500",
        icon: Clock,
        badge: "bg-slate-500 text-white",
        dot: "bg-white",
        title: "text-slate-700 dark:text-slate-300 font-medium",
        meta: "text-slate-400 dark:text-slate-500",
      };
    case "NO_APLICA":
      return {
        container:
          "pl-1 bg-transparent",
        iconBox: "bg-orange-500 text-white dark:bg-orange-600",
        icon: AlertTriangle,
        badge: "bg-orange-500 text-white",
        dot: "bg-white",
        title: "text-slate-800 dark:text-slate-200 font-semibold",
        meta: "text-slate-500 dark:text-slate-400",
      };
    case "REQUIERE_CORRECCION":
    default:
      return {
        container:
          "pl-1 bg-transparent",
        iconBox: "bg-rose-500 text-white dark:bg-rose-600",
        icon: AlertTriangle,
        badge: "bg-rose-500 text-white",
        dot: "bg-white",
        title: "text-slate-800 dark:text-slate-200 font-semibold",
        meta: "text-slate-500 dark:text-slate-400",
      };
  }
}

function getItemStyle(item, categoriaId) {
  const requiereTraduccion = Boolean(item.requiere_traduccion) && categoriaId !== "formularios";
  
  if (requiereTraduccion) {
    const estadoTrad = item.estado_traduccion;
    const yaEnviado =
      estadoTrad &&
      estadoTrad !== "PENDIENTE_TRADUCCION" &&
      estadoTrad !== "NO_REQUIERE";
    const aprobado = estadoTrad === "TRADUCIDO_Y_VERIFICADO";
    
    if (aprobado) {
      // Green (Approved)
      return {
        container:
          "pl-1 bg-transparent",
        iconBox: "bg-emerald-500 text-white dark:bg-emerald-600",
        icon: CheckCircle2,
        badge: "bg-emerald-500 text-white",
        dot: "bg-white",
        title: "text-slate-800 dark:text-slate-200 font-semibold",
        meta: "text-slate-500 dark:text-slate-400",
      };
    }
    
    const devuelto =
      estadoTrad === "ILEGIBLE_DEVUELTO" ||
      estadoTrad === "QUALITY_DEVUELTO_TRADUCTOR";

    if (devuelto) {
      // Red/Rose (Devuelto)
      return {
        container:
          "pl-1 bg-transparent",
        iconBox: "bg-rose-500 text-white dark:bg-rose-600",
        icon: AlertTriangle,
        badge: "bg-rose-500 text-white",
        dot: "bg-white",
        title: "text-slate-800 dark:text-slate-200 font-semibold",
        meta: "text-slate-500 dark:text-slate-400",
      };
    }

    if (yaEnviado) {
      // Amber/Yellow (Pending translation)
      return {
        container:
          "pl-1 bg-transparent",
        iconBox: "bg-amber-500 text-white dark:bg-amber-600",
        icon: Clock,
        badge: "bg-amber-500 text-white",
        dot: "bg-white",
        title: "text-slate-800 dark:text-slate-200 font-semibold",
        meta: "text-slate-500 dark:text-slate-400",
      };
    }
    
    // Requiere traducción pero aún no se envía
    // No color (Grey/White)
    return {
      container:
        "pl-1 bg-transparent",
      iconBox: "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500",
      icon: Clock,
      badge: "bg-slate-500 text-white",
      dot: "bg-white",
      title: "text-slate-700 dark:text-slate-300 font-medium",
      meta: "text-slate-400 dark:text-slate-500",
    };
  }

  // Si no requiere traducción, se rige por su estado normal
  return getEstadoStyle(item.estado);
}

function getSelectEstadoStyle(estado) {
  const base =
    "text-[11px] font-bold uppercase tracking-wider border rounded-lg px-2.5 py-1.5";

  switch (estado) {
    case "RECIBIDO":
      return `${base} border-emerald-500 bg-emerald-500 text-white`;
    case "PENDIENTE":
      return `${base} border-slate-500 bg-slate-500 text-white`;
    case "NO_APLICA":
      return `${base} border-orange-500 bg-orange-500 text-white`;
    case "REQUIERE_CORRECCION":
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

  const { mutate: solicitarTraduccionMutate, isPending: enviandoATraduccion } =
    useMutation({
      mutationFn: ({ itemId, prioridad, observaciones }) =>
        solicitarTraduccionChecklistItem(expedienteId, itemId, {
          prioridad: prioridad || "MEDIA",
          observaciones: `${observaciones ?? ""}`.trim() || undefined,
          usuario_id: usuarioId,
        }),
      onMutate: async ({ itemId }) => {
        const queryKey = queryKeys.expedienteChecklist.byExpediente(expedienteId);
        await queryClient.cancelQueries({ queryKey });

        const previousData = queryClient.getQueryData(queryKey);

        queryClient.setQueryData(queryKey, (old) => {
          if (!Array.isArray(old)) return old;
          return old.map((item) =>
            item.id === itemId
              ? {
                  ...item,
                  estado_traduccion: "SOLICITADA",
                  requiere_traduccion: true,
                }
              : item
          );
        });

        return { previousData, queryKey };
      },
      onSuccess: () => {
        toast.success(
          "Solicitud de traducción creada correctamente — el ítem será marcado como EN_TRADUCCION."
        );
        queryClient.invalidateQueries({
          queryKey: queryKeys.expedienteChecklist.byExpediente(expedienteId),
          exact: false,
        });
      },
      onError: (err, variables, context) => {
        if (context?.previousData) {
          queryClient.setQueryData(context.queryKey, context.previousData);
        }
        console.error("Error solicitando traducción del item:", err);
        toast.error(
          err?.message || "No se pudo enviar el documento a traducción."
        );
      },
    });

  const { mutate: reactivarTraduccionMutate, isPending: reactivandoTraduccion } =
    useMutation({
      mutationFn: ({ itemId, observaciones }) =>
        reactivarTraduccionParalegal(expedienteId, itemId, {
          observaciones: `${observaciones ?? ""}`.trim() || undefined,
          usuario_id: usuarioId,
        }),
      onMutate: async ({ itemId }) => {
        const queryKey = queryKeys.expedienteChecklist.byExpediente(expedienteId);
        await queryClient.cancelQueries({ queryKey });

        const previousData = queryClient.getQueryData(queryKey);

        queryClient.setQueryData(queryKey, (old) => {
          if (!Array.isArray(old)) return old;
          return old.map((item) =>
            item.id === itemId
              ? {
                  ...item,
                  estado_traduccion: "SOLICITADA",
                }
              : item
          );
        });

        return { previousData, queryKey };
      },
      onSuccess: () => {
        toast.success("Documento reactivado para traducción correctamente.");
        queryClient.invalidateQueries({
          queryKey: queryKeys.expedienteChecklist.byExpediente(expedienteId),
          exact: false,
        });
      },
      onError: (err, variables, context) => {
        if (context?.previousData) {
          queryClient.setQueryData(context.queryKey, context.previousData);
        }
        console.error("Error reactivando traducción del item:", err);
        toast.error(
          err?.message || "No se pudo reactivar la traducción del documento."
        );
      },
    });

  function abrirModalReactivar(item) {
    setModalReactivarItemId(item.id);
    setModalReactivarObs("");
  }

  function cerrarModalReactivar() {
    setModalReactivarItemId(null);
    setModalReactivarObs("");
  }

  function guardarModalReactivar(item) {
    if (!usuarioId) {
      toast.error("No hay usuario autenticado para reactivar el documento");
      return;
    }

    const obs = `${modalReactivarObs ?? ""}`.trim();

    cerrarModalReactivar();

    abrirConfirmacion({
      title: "Reactivar traducción",
      message: `¿Estás seguro de corregir y volver a enviar a traducción el documento "${item?.titulo_requisito ?? "este documento"}"?`,
      confirmText: "Sí, reactivar",
      cancelText: "Cancelar",
      variant: "primary",
      icon: Save,
      onConfirm: () =>
        reactivarTraduccionMutate({
          itemId: item.id,
          observaciones: obs,
        }),
    });
  }

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
  const [, setDropdownPos] = useState({});
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
  const [modalReactivarItemId, setModalReactivarItemId] = useState(null);
  const [modalReactivarObs, setModalReactivarObs] = useState("");

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

  const checklistVisible = useMemo(() => checklist, [checklist]);

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
      estado === "RECIBIDO" || estado === "NO_APLICA";
    const completados = checklistVisible.filter((i) =>
      estaCompletado(i.estado)
    ).length;
    const pendientes = checklistVisible.filter(
      (i) => i.estado === "PENDIENTE"
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

    const menuHeight = 188;

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
    <div className="px-2 py-2">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
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
              className={`flex flex-col rounded-lg border border-slate-200 bg-white ring-1 ring-slate-100 transition dark:border-slate-800 dark:bg-slate-900/40 dark:ring-slate-800 ${categoria.color.ring}`}
            >
              <header className="flex items-start justify-between gap-3 border-b border-slate-200/80 bg-slate-100/70 p-4 dark:border-slate-800/60 dark:bg-slate-950/70 xl:p-5 rounded-t-2xl">
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${categoria.color.badge} ${categoria.color.darkBadge}`}
                  >
                    <IconCat size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start gap-2">
                      <h3
                        className={`min-w-0 flex-1 text-[14px] font-bold leading-tight break-words sm:text-[15px] ${categoria.color.head}`}
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
                  </div>
                </div>
              </header>

              <div className="flex flex-1 flex-col divide-y divide-slate-100 dark:divide-slate-800/60 px-4 py-2">
                {isLoading && !items.length ? (
                  <div className="flex flex-col divide-y divide-slate-100 dark:divide-slate-800/60">
                    {[0, 1].map((i) => (
                      <div
                        key={i}
                        className="animate-pulse py-4 pl-3.5 border-l-[4px] border-l-slate-100 dark:border-l-slate-800"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-6 w-6 shrink-0 rounded-lg bg-slate-100 dark:bg-slate-800" />
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
                      const style = getItemStyle(item, categoria.id);
                      const IconComp = style.icon;
                      const isDropdownOpen = openDropdownId === item.id;
                      const requiereTraduccion = Boolean(item.requiere_traduccion) && categoria.id !== "formularios";

                      return (
                        <div
                          key={item.id}
                          className={`${
                            isDropdownOpen ? "z-40" : "z-0"
                          } relative py-4 transition-all duration-200 hover:bg-slate-50/40 dark:hover:bg-slate-900/10 ${style.container}`}
                        >
                          <div className="flex flex-col gap-3 2xl:flex-row 2xl:items-start 2xl:justify-between">
                            {/* Left Side: Content & Badges */}
                            <div className="flex items-start gap-3 min-w-0 flex-1">
                              <div
                                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full mt-0.5 ${style.iconBox}`}
                              >
                                <IconComp size={13} />
                              </div>
                              <div className="min-w-0 flex-1 space-y-2">
                                <h4 className={`text-[13.5px] font-semibold leading-5 ${style.title}`}>
                                  {item.titulo_requisito}
                                </h4>

                                {/* Badges Row */}
                                <div className="flex flex-wrap items-center gap-2">
                                  {item.estado !== "RECIBIDO" && (
                                    <span
                                      className={`inline-flex items-center gap-1.5 select-none ${getSelectEstadoStyle(
                                        item.estado
                                      )}`}
                                    >
                                      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
                                      {formatEstadoLabel(item.estado)}
                                    </span>
                                  )}

                                  {requiereTraduccion && (() => {
                                    const yaEnviado =
                                      item.estado_traduccion &&
                                      item.estado_traduccion !== "PENDIENTE_TRADUCCION" &&
                                      item.estado_traduccion !== "NO_REQUIERE";

                                    const formatEstadoTraduccionLabel = (estado) => {
                                      const map = {
                                        PENDIENTE_TRADUCCION: "Pendiente Enviar",
                                        SOLICITADA: "Solicitada",
                                        ASIGNADO_TRADUCTOR: "En Traducción",
                                        QUALITY_DEVUELTO_TRADUCTOR: "Devuelto por Quality",
                                        EN_QUALITY_PENDIENTE_ASIGNACION: "Listo para Quality",
                                        ASIGNADO_QUALITY: "En Calidad (Quality)",
                                        TRADUCIDO_Y_VERIFICADO: "Aprobada",
                                        ILEGIBLE_DEVUELTO: "Devuelto (Ilegible)",
                                        NO_REQUIERE: "No Requiere",
                                        ILEGIBLE_CORREGIDO: "Ilegible Corregido",
                                        CORREGIDO_TRADUCTOR_QUALITY: "Corregido por Traductor",
                                      };
                                      return map[estado] || estado || "Solicitada";
                                    };

                                    if (yaEnviado) {
                                      const aprobado = item.estado_traduccion === "TRADUCIDO_Y_VERIFICADO";
                                      const devuelto =
                                         item.estado_traduccion === "ILEGIBLE_DEVUELTO" ||
                                         item.estado_traduccion === "QUALITY_DEVUELTO_TRADUCTOR";
                                      const badgeClasses = aprobado
                                        ? "border-emerald-200 bg-emerald-100/50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300"
                                        : devuelto
                                          ? "border-rose-200 bg-rose-100/50 text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300"
                                          : "border-amber-200 bg-amber-100/50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300";

                                      return (
                                        <span
                                          className={`hidden 2xl:inline-flex items-center gap-1 border px-2 py-0.5 rounded-lg text-[9.5px] font-bold uppercase tracking-wide ${badgeClasses}`}
                                        >
                                          <Languages size={10} />
                                          {`Traducción: ${formatEstadoTraduccionLabel(item.estado_traduccion)}`}
                                        </span>
                                      );
                                    }

                                    // Si requiere traducción pero aún no está en RECIBIDO, mostramos "Pendiente Recepción"
                                    if (item.estado !== "RECIBIDO") {
                                      return (
                                        <span
                                          title="El documento debe marcarse como RECIBIDO para poder enviarse a traducción"
                                          className="hidden 2xl:inline-flex items-center gap-1 border border-slate-200 bg-slate-100 px-2 py-0.5 rounded-lg text-[9.5px] font-bold uppercase tracking-wide text-slate-400 cursor-not-allowed select-none dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-600"
                                        >
                                          <Languages size={10} />
                                          Pendiente Recepción
                                        </span>
                                      );
                                    }

                                    return null;
                                  })()}

                                  {!requiereTraduccion && (
                                    <span className="inline-flex items-center gap-1 border border-slate-200/60 bg-slate-50/70 px-2 py-0.5 rounded-lg text-[9.5px] font-bold uppercase tracking-wide text-slate-400 dark:border-slate-800 dark:bg-slate-900/30 dark:text-slate-500">
                                      No requiere traducción
                                    </span>
                                  )}
                                </div>

                                {/* Observations */}
                                {item.observaciones && item.observaciones !== "Aprobado por Quality" ? (
                                  <p className={`hidden 2xl:block text-[11px] leading-5 ${style.meta}`}>
                                    {item.observaciones}
                                  </p>
                                ) : item.estado === "PENDIENTE" ? (
                                  <p className={`hidden 2xl:block text-[11px] italic ${style.meta}`}>
                                    Sin observaciones registradas
                                  </p>
                                ) : null}

                                {/* Metadata updates */}
                                <div className={`hidden 2xl:flex flex-wrap items-center gap-x-4 gap-y-1 text-[9.5px] ${style.meta}`}>
                                  {item.usuario_actualizador ? (
                                    <div className="flex items-center gap-1">
                                      <User size={10} />
                                      <span className="font-medium">{item.usuario_actualizador}</span>
                                    </div>
                                  ) : null}
                                  {item.updated_at ? (
                                    <div className="flex items-center gap-1">
                                      <Clock size={10} />
                                      <span>Actualizado: <span className="font-medium">{item.updated_at}</span></span>
                                    </div>
                                  ) : null}
                                </div>
                              </div>
                            </div>

                            {/* Right Side: Actions (Edit, Delete, Enviar Traducción) */}
                            <div className="flex flex-wrap items-center gap-1.5 self-start 2xl:mt-0.5 2xl:shrink-0">
                              {/* Botón de Enviar a Traducción si ya está Recibido y requiere traducción pero no está enviado */}
                              {requiereTraduccion && item.estado === "RECIBIDO" && (
                                (() => {
                                  const yaEnviado =
                                    item.estado_traduccion &&
                                    item.estado_traduccion !== "PENDIENTE_TRADUCCION" &&
                                    item.estado_traduccion !== "NO_REQUIERE";

                                  if (!yaEnviado) {
                                    return (
                                      <button
                                        type="button"
                                        disabled={enviandoATraduccion}
                                        onClick={() => {
                                          abrirConfirmacion({
                                            title: "Enviar a Traducción",
                                            message: `¿Estás seguro de enviar "${item?.titulo_requisito ?? item?.nombre_documento ?? "este documento"}" a traducción?`,
                                            confirmText: "Sí, enviar",
                                            cancelText: "Cancelar",
                                            variant: "primary",
                                            icon: Languages,
                                            onConfirm: () => solicitarTraduccionMutate({ itemId: item.id }),
                                          });
                                        }}
                                        className="inline-flex items-center gap-1 rounded-lg border border-[#0e183f]/40 bg-[#0e183f]/95 px-2.5 py-1.5 text-[9.5px] font-bold uppercase tracking-wide text-white transition hover:bg-[#15235c] disabled:opacity-50 disabled:cursor-not-allowed dark:border-blue-900/40 dark:bg-[#0e183f]"
                                      >
                                        {enviandoATraduccion ? (
                                          <Loader2 size={10} className="animate-spin" />
                                        ) : (
                                          <Languages size={10} />
                                        )}
                                        Enviar a Traducción
                                      </button>
                                    );
                                  }
                                  return null;
                                })()
                              )}
                              {/* Botón de Reactivar Traducción si fue devuelto como Ilegible */}
                              {requiereTraduccion && item.estado_traduccion === "ILEGIBLE_DEVUELTO" && (
                                <button
                                  type="button"
                                  disabled={reactivandoTraduccion}
                                  onClick={() => abrirModalReactivar(item)}
                                  className="inline-flex items-center gap-1 rounded-lg border border-amber-500/40 bg-amber-500 px-2.5 py-1.5 text-[9.5px] font-bold uppercase tracking-wide text-white transition hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed dark:border-amber-600/40 dark:bg-amber-600"
                                >
                                  {reactivandoTraduccion ? (
                                    <Loader2 size={10} className="animate-spin" />
                                  ) : (
                                    <Languages size={10} />
                                  )}
                                  Enviar Corrección
                                </button>
                              )}

                              {requiereTraduccion && item.estado_traduccion && item.estado_traduccion !== "PENDIENTE_TRADUCCION" && item.estado_traduccion !== "NO_REQUIERE" ? (
                                <span
                                  className={`inline-flex items-center gap-1 border px-2 py-0.5 rounded-lg text-[9.5px] font-bold uppercase tracking-wide 2xl:hidden ${
                                    item.estado_traduccion === "TRADUCIDO_Y_VERIFICADO"
                                      ? "border-emerald-200 bg-emerald-100/50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300"
                                      : item.estado_traduccion === "ILEGIBLE_DEVUELTO" ||
                                        item.estado_traduccion === "QUALITY_DEVUELTO_TRADUCTOR"
                                        ? "border-rose-200 bg-rose-100/50 text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300"
                                        : "border-amber-200 bg-amber-100/50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300"
                                  }`}
                                >
                                  <Languages size={10} />
                                  {`Traducción: ${
                                    {
                                      PENDIENTE_TRADUCCION: "Pendiente Enviar",
                                      SOLICITADA: "Solicitada",
                                      ASIGNADO_TRADUCTOR: "En Traducción",
                                      QUALITY_DEVUELTO_TRADUCTOR: "Devuelto por Quality",
                                      EN_QUALITY_PENDIENTE_ASIGNACION: "Listo para Quality",
                                      ASIGNADO_QUALITY: "En Calidad (Quality)",
                                      TRADUCIDO_Y_VERIFICADO: "Aprobada",
                                      ILEGIBLE_DEVUELTO: "Devuelto (Ilegible)",
                                      NO_REQUIERE: "No Requiere",
                                      ILEGIBLE_CORREGIDO: "Ilegible Corregido",
                                      CORREGIDO_TRADUCTOR_QUALITY: "Corregido por Traductor",
                                    }[item.estado_traduccion] || item.estado_traduccion || "Solicitada"
                                  }`}
                                </span>
                              ) : null}

                              <button
                                type="button"
                                onClick={() => abrirModalEditar(item)}
                                className={`inline-flex h-7 w-7 items-center justify-center rounded-lg border bg-white transition dark:bg-slate-900 ${
                                  item.estado_traduccion === "TRADUCIDO_Y_VERIFICADO"
                                    ? "border-emerald-200 text-emerald-600 hover:border-emerald-500 hover:bg-emerald-50 dark:border-emerald-900/50 dark:text-emerald-300 dark:hover:bg-emerald-950/20"
                                    : item.estado_traduccion === "ILEGIBLE_DEVUELTO" ||
                                      item.estado_traduccion === "QUALITY_DEVUELTO_TRADUCTOR"
                                      ? "border-rose-200 text-rose-600 hover:border-rose-500 hover:bg-rose-50 dark:border-rose-900/50 dark:text-rose-300 dark:hover:bg-rose-950/20"
                                      : requiereTraduccion &&
                                        item.estado_traduccion &&
                                        item.estado_traduccion !== "PENDIENTE_TRADUCCION" &&
                                        item.estado_traduccion !== "NO_REQUIERE"
                                        ? "border-amber-200 text-amber-600 hover:border-amber-500 hover:bg-amber-50 dark:border-amber-900/50 dark:text-amber-300 dark:hover:bg-amber-950/20"
                                        : "border-slate-200 text-slate-600 hover:border-[#0d1b5e] hover:text-[#0d1b5e] hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                                }`}
                              >
                                <Settings2 size={12} />
                              </button>

                              <button
                                type="button"
                                onClick={() => eliminarDocumento(item)}
                                disabled={eliminandoItem}
                                className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-red-200 bg-white text-red-600 transition hover:border-red-400 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-900/50 dark:bg-slate-900 dark:text-red-300 dark:hover:bg-red-950/20"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>

                            {requiereTraduccion && item.estado !== "RECIBIDO" && (!item.estado_traduccion || item.estado_traduccion === "PENDIENTE_TRADUCCION" || item.estado_traduccion === "NO_REQUIERE") ? (
                              <span
                                className={`inline-flex items-center gap-1 self-start border px-2 py-0.5 rounded-lg text-[9.5px] font-bold uppercase tracking-wide 2xl:hidden ${
                                  item.estado_traduccion === "TRADUCIDO_Y_VERIFICADO"
                                    ? "border-emerald-200 bg-emerald-100/50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300"
                                    : item.estado_traduccion === "ILEGIBLE_DEVUELTO" ||
                                      item.estado_traduccion === "QUALITY_DEVUELTO_TRADUCTOR"
                                      ? "border-rose-200 bg-rose-100/50 text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300"
                                      : "border-amber-200 bg-amber-100/50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300"
                                }`}
                              >
                                <Languages size={10} />
                                {`Traducción: ${
                                  {
                                    PENDIENTE_TRADUCCION: "Pendiente Enviar",
                                    SOLICITADA: "Solicitada",
                                    ASIGNADO_TRADUCTOR: "En Traducción",
                                    QUALITY_DEVUELTO_TRADUCTOR: "Devuelto por Quality",
                                    EN_QUALITY_PENDIENTE_ASIGNACION: "Listo para Quality",
                                    ASIGNADO_QUALITY: "En Calidad (Quality)",
                                    TRADUCIDO_Y_VERIFICADO: "Aprobada",
                                    ILEGIBLE_DEVUELTO: "Devuelto (Ilegible)",
                                    NO_REQUIERE: "No Requiere",
                                    ILEGIBLE_CORREGIDO: "Ilegible Corregido",
                                    CORREGIDO_TRADUCTOR_QUALITY: "Corregido por Traductor",
                                  }[item.estado_traduccion] || item.estado_traduccion || "Solicitada"
                                }`}
                              </span>
                            ) : requiereTraduccion && item.estado !== "RECIBIDO" ? (
                              <span
                                title="El documento debe marcarse como RECIBIDO para poder enviarse a traducción"
                                className="inline-flex items-center gap-1 self-start border border-slate-200 bg-slate-100 px-2 py-0.5 rounded-lg text-[9.5px] font-bold uppercase tracking-wide text-slate-400 cursor-not-allowed select-none 2xl:hidden dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-600"
                              >
                                <Languages size={10} />
                                Pendiente Recepción
                              </span>
                            ) : null}

                            {item.observaciones && item.observaciones !== "Aprobado por Quality" ? (
                              <p className={`text-[11px] leading-5 2xl:hidden ${style.meta}`}>
                                {item.observaciones}
                              </p>
                            ) : item.estado === "PENDIENTE" ? (
                              <p className={`text-[11px] italic 2xl:hidden ${style.meta}`}>
                                Sin observaciones registradas
                              </p>
                            ) : null}

                            <div className={`flex flex-wrap items-center gap-x-4 gap-y-1 text-[9.5px] 2xl:hidden ${style.meta}`}>
                              {item.usuario_actualizador ? (
                                <div className="flex items-center gap-1">
                                  <User size={10} />
                                  <span className="font-medium">{item.usuario_actualizador}</span>
                                </div>
                              ) : null}
                              {item.updated_at ? (
                                <div className="flex items-center gap-1">
                                  <Clock size={10} />
                                  <span>Actualizado: <span className="font-medium">{item.updated_at}</span></span>
                                </div>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <button
                      type="button"
                      onClick={() => abrirModalAgregar(categoria.id)}
                      className="mt-3.5 inline-flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 hover:bg-slate-100/60 px-4 py-2.5 text-[10.5px] font-bold uppercase tracking-wider text-slate-500 hover:text-slate-700 transition dark:border-slate-800 dark:bg-slate-900/30 dark:hover:bg-slate-900/60 dark:text-slate-400 dark:hover:text-slate-200"
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
                        className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500"
                      >
                        <Plus size={14} />
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

                  {modalCategoriaId !== "formularios" && (
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
                  )}

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
                  {itemEditando?.categoria_ui !== "formularios" && (
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
                  )}

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

      {modalReactivarItemId
        ? (() => {
            const itemReactivando = checklistVisible.find(
              (it) => String(it.id) === String(modalReactivarItemId)
            );
            if (!itemReactivando) return null;

            return (
              <ModalGeneral
                open
                onClose={cerrarModalReactivar}
                header={
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-50 text-amber-500 dark:border-amber-900/50 dark:bg-amber-950/40">
                      <Languages size={22} className="text-amber-600 dark:text-amber-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                        Reactivar Traducción
                      </p>
                      <h2 className="mt-0.5 truncate text-[17px] font-bold text-slate-800 dark:text-slate-100 sm:text-[18px]">
                        {itemReactivando.titulo_requisito}
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
                      onClick={cerrarModalReactivar}
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-[12px] font-bold uppercase tracking-wide text-slate-600 transition hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                    >
                      <X size={14} />
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={() => guardarModalReactivar(itemReactivando)}
                      disabled={reactivandoTraduccion}
                      className="inline-flex items-center gap-2 rounded-lg bg-[#0d1b5e] px-5 py-2.5 text-[12px] font-bold uppercase tracking-wide text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {reactivandoTraduccion ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Save size={14} />
                      )}
                      {reactivandoTraduccion ? "Guardando..." : "Reactivar"}
                    </button>
                  </>
                }
              >
                <div className="space-y-5">
                  <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-4 text-xs text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300">
                    <p className="font-semibold">Documento devuelto por traducción ilegible.</p>
                    <p className="mt-1">Al reactivar, se notificará al traductor para que proceda con el documento corregido.</p>
                  </div>

                  <label className="block">
                    <span className="mb-1.5 block text-[12px] font-semibold text-slate-600 dark:text-slate-300">
                      Observaciones de la corrección
                    </span>
                    <textarea
                      rows={3}
                      value={modalReactivarObs}
                      onChange={(e) => setModalReactivarObs(e.target.value)}
                      placeholder="Indica qué se corrigió o agrega detalles para el traductor (opcional)"
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
