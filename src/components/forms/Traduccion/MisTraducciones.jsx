import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  FileText,
  Search,
  ClipboardX,
  UploadCloud,
  ExternalLink,
  BookOpen
} from "lucide-react";
import Swal from "sweetalert2";

import HeaderBox from "../../ui/HeaderBox";
import Table from "../../ui/Table";
import {
  getMisAsignacionesTraductor,
  marcarIlegibleTraductor,
  enviarTraduccionQualityTraductor
} from "../../../services/traduccionServices";

const renderEstadoBadge = (estado) => {
  const map = {
    SOLICITADA: { text: "Solicitada", classes: "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300" },
    PENDIENTE_TRADUCCION: { text: "Pendiente Traducción", classes: "bg-slate-100 text-slate-800 dark:bg-slate-800/40 dark:text-slate-400" },
    ASIGNADO_TRADUCTOR: { text: "Asignado a Traductor", classes: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300" },
    QUALITY_DEVUELTO_TRADUCTOR: { text: "Devuelto por Quality", classes: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-900" },
    EN_QUALITY_PENDIENTE_ASIGNACION: { text: "Listo para Quality", classes: "bg-cyan-100 text-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-300" },
    ASIGNADO_QUALITY: { text: "En Auditoría Quality", classes: "bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300" },
    TRADUCIDO_Y_VERIFICADO: { text: "Aprobado", classes: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300" },
    ILEGIBLE_DEVUELTO: { text: "Devuelto (Ilegible)", classes: "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300" },
    NO_REQUIERE: { text: "No Requiere", classes: "bg-slate-100 text-slate-500 dark:bg-slate-900 dark:text-slate-400" },
    ILEGIBLE_CORREGIDO: { text: "Ilegible Corregido", classes: "bg-teal-100 text-teal-800 dark:bg-teal-950/40 dark:text-teal-300" },
    CORREGIDO_TRADUCTOR_QUALITY: { text: "Corregido por Traductor", classes: "bg-orange-100 text-orange-800 dark:bg-orange-950/40 dark:text-orange-300" },
  };

  const config = map[estado] || { text: estado || "Desconocido", classes: "bg-slate-100 text-slate-800 dark:bg-slate-800/40 dark:text-slate-400" };

  return (
    <span className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold tracking-wide transition-colors ${config.classes}`}>
      {config.text}
    </span>
  );
};

export default function MisTraducciones() {
  const queryClient = useQueryClient();

  // Get logged in user info
  const rawUser = JSON.parse(localStorage.getItem("user") ?? "{}");
  const currentUserId = Number(
    rawUser?.id ?? rawUser?.usuario_id ?? rawUser?.user_id ?? null
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDoc, setSelectedDoc] = useState(null);

  // Modals state
  const [ilegibleOpen, setIlegibleOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);

  // Form states
  const [motivo, setMotivo] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [archivoTraduccionUrl, setArchivoTraduccionUrl] = useState("");

  // Query: Fetch translator assignments
  const { data: asignaciones = [], isLoading } = useQuery({
    queryKey: ["traducciones", "traductor", currentUserId],
    queryFn: () => getMisAsignacionesTraductor(currentUserId),
    enabled: Number.isFinite(currentUserId),
  });

  // Mutation: Mark document as illegible
  const ilegibleMutation = useMutation({
    mutationFn: ({ expedienteId, documentoId, payload }) =>
      marcarIlegibleTraductor(expedienteId, documentoId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["traducciones", "traductor", currentUserId] });
      Swal.fire({
        title: "Reportado",
        text: "El documento ha sido marcado como ilegible y devuelto al Paralegal.",
        icon: "success",
        confirmButtonColor: "#fe7405",
      });
      closeModal();
    },
    onError: (error) => {
      Swal.fire({
        title: "Error",
        text: error.message || "Ocurrió un error al reportar el documento.",
        icon: "error",
        confirmButtonColor: "#fe7405",
      });
    }
  });

  // Mutation: Send translation to Quality
  const sendQualityMutation = useMutation({
    mutationFn: ({ expedienteId, documentoId, payload }) =>
      enviarTraduccionQualityTraductor(expedienteId, documentoId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["traducciones", "traductor", currentUserId] });
      Swal.fire({
        title: "Enviado",
        text: "La traducción ha sido enviada a revisión de Quality Control.",
        icon: "success",
        confirmButtonColor: "#fe7405",
      });
      closeModal();
    },
    onError: (error) => {
      Swal.fire({
        title: "Error",
        text: error.message || "Ocurrió un error al enviar el archivo.",
        icon: "error",
        confirmButtonColor: "#fe7405",
      });
    }
  });

  const handleOpenIlegible = (doc) => {
    setSelectedDoc(doc);
    setMotivo("");
    setObservaciones("");
    setIlegibleOpen(true);
  };

  const handleOpenUpload = (doc) => {
    setSelectedDoc(doc);
    setArchivoTraduccionUrl("");
    setObservaciones("");
    setUploadOpen(true);
  };

  const closeModal = () => {
    setIlegibleOpen(false);
    setUploadOpen(false);
    setSelectedDoc(null);
    setMotivo("");
    setObservaciones("");
    setArchivoTraduccionUrl("");
  };

  const handleIlegibleSubmit = (e) => {
    e.preventDefault();
    if (!selectedDoc) return;
    if (!motivo.trim()) {
      Swal.fire({
        title: "Campo requerido",
        text: "Debe ingresar el motivo.",
        icon: "warning",
        confirmButtonColor: "#fe7405",
      });
      return;
    }

    ilegibleMutation.mutate({
      expedienteId: selectedDoc.expediente_id,
      documentoId: selectedDoc.id,
      payload: {
        usuario_id: currentUserId,
        motivo: motivo.trim()
      }
    });
  };

  const handleUploadSubmit = (e) => {
    e.preventDefault();
    if (!selectedDoc) return;
    if (!archivoTraduccionUrl.trim()) {
      Swal.fire({
        title: "Campo requerido",
        text: "Debe ingresar la URL del archivo traducido.",
        icon: "warning",
        confirmButtonColor: "#fe7405",
      });
      return;
    }

    sendQualityMutation.mutate({
      expedienteId: selectedDoc.expediente_id,
      documentoId: selectedDoc.id,
      payload: {
        usuario_id: currentUserId,
        archivo_traduccion_url: archivoTraduccionUrl.trim(),
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
        `${item.cliente_nombre ?? ""}`.toLowerCase().includes(query) ||
        `${item.nombre_documento ?? ""}`.toLowerCase().includes(query)
      );
    });
  }, [asignaciones, searchQuery]);

  // Columns for translator assignments
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
      header: "Documento",
      accessor: "nombre_documento",
      render: (val) => <span className="text-slate-600 dark:text-slate-400">{val || "-"}</span>
    },
    {
      header: "Estado",
      accessor: "estado_traduccion",
      render: (val) => renderEstadoBadge(val)
    },
    {
      header: "Fecha Asignación",
      accessor: "fecha_asignacion_traductor",
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
        title="Mis Traducciones Asignadas"
        subtitle="Visualiza tus asignaciones, reporta inconvenientes o carga los archivos traducidos finalizados"
        Icon={BookOpen}
        action={
          <div className="flex flex-col gap-3 sm:flex-row items-center w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Search size={16} />
              </span>
              <input
                type="text"
                placeholder="Buscar por expediente, cliente, documento..."
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
        actions={(row) => (
          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => handleOpenIlegible(row)}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-red-200 dark:border-red-950 bg-red-50 dark:bg-red-950/20 px-3 py-1 text-xs font-bold text-red-600 dark:text-red-400 transition hover:bg-red-100 dark:hover:bg-red-950/40 active:scale-95"
            >
              <ClipboardX size={14} />
              REPORTAR DAÑADO / ILEGIBLE
            </button>

            <button
              type="button"
              onClick={() => handleOpenUpload(row)}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-[#fe7405] px-3.5 py-1 text-xs font-bold text-white shadow-sm transition hover:bg-[#e06300] hover:scale-[1.02] active:scale-95"
            >
              <UploadCloud size={14} />
              ENVIAR A QUALITY
            </button>
          </div>
        )}
      />

      {/* MODAL: REPORTAR DAÑADO / ILEGIBLE */}
      {ilegibleOpen && selectedDoc && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative z-10 w-full max-w-md rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl animate-in fade-in zoom-in duration-200">
            <header className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-4 bg-red-900 text-white rounded-t-xl">
              <div>
                <h3 className="text-md font-bold uppercase tracking-wide">Reportar Documento Ilegible</h3>
                <p className="text-xs text-white/70">Expediente: {selectedDoc.codigo_expediente}</p>
              </div>
              <button type="button" onClick={closeModal} className="text-white hover:text-white/80 font-bold text-lg leading-none">&times;</button>
            </header>
            <form onSubmit={handleIlegibleSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <span className="block text-xs font-semibold text-slate-400 uppercase">Documento</span>
                <span className="block text-sm font-semibold text-slate-800 dark:text-slate-200">{selectedDoc.nombre_documento}</span>
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-400 uppercase">Motivo del Inconveniente *</label>
                <textarea
                  required
                  placeholder="Ej: La página 3 se encuentra borrosa, no se distingue el texto..."
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 text-sm outline-none transition focus:border-red-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={closeModal} className="h-10 rounded-lg px-4 text-sm font-semibold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800">Cancelar</button>
                <button
                  type="submit"
                  disabled={ilegibleMutation.isPending}
                  className="h-10 rounded-lg bg-red-600 px-5 text-sm font-semibold text-white shadow hover:bg-red-700 transition disabled:opacity-50"
                >
                  {ilegibleMutation.isPending ? "Reportando..." : "Reportar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ENVIAR TRADUCCIÓN A QUALITY */}
      {uploadOpen && selectedDoc && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative z-10 w-full max-w-lg rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl animate-in fade-in zoom-in duration-200">
            <header className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-4 bg-[#0e183f] text-white rounded-t-xl">
              <div>
                <h3 className="text-md font-bold uppercase tracking-wide">Enviar traducción finalizada</h3>
                <p className="text-xs text-white/70">Expediente: {selectedDoc.codigo_expediente}</p>
              </div>
              <button type="button" onClick={closeModal} className="text-white hover:text-white/80 font-bold text-lg leading-none">&times;</button>
            </header>
            <form onSubmit={handleUploadSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <span className="block text-xs font-semibold text-slate-400 uppercase">Cliente</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedDoc.cliente_nombre || "-"}</span>
                </div>
                <div>
                  <span className="block text-xs font-semibold text-slate-400 uppercase">Documento</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedDoc.nombre_documento || "-"}</span>
                </div>
              </div>

              {selectedDoc.archivo_url && (
                <div className="space-y-1">
                  <span className="block text-xs font-semibold text-slate-400 uppercase">Archivo original a traducir</span>
                  <a
                    href={selectedDoc.archivo_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3 text-sm text-[#0e183f] dark:text-sky-400 hover:bg-slate-100 dark:hover:bg-slate-900 transition"
                  >
                    <span className="font-medium truncate pr-4 text-left">Documento Original</span>
                    <ExternalLink size={16} className="shrink-0 text-slate-400" />
                  </a>
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-400 uppercase">Enlace/URL de la traducción *</label>
                <input
                  required
                  type="url"
                  placeholder="https://drive.google.com/file/... o similar"
                  value={archivoTraduccionUrl}
                  onChange={(e) => setArchivoTraduccionUrl(e.target.value)}
                  className="w-full h-10 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-sm outline-none transition focus:border-[#fe7405]"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-400 uppercase">Observaciones del Traductor</label>
                <textarea
                  placeholder="Notas adicionales sobre la traducción..."
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 text-sm outline-none transition focus:border-[#fe7405]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={closeModal} className="h-10 rounded-lg px-4 text-sm font-semibold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800">Cancelar</button>
                <button
                  type="submit"
                  disabled={sendQualityMutation.isPending}
                  className="h-10 rounded-lg bg-[#fe7405] px-5 text-sm font-semibold text-white shadow hover:bg-[#e06300] transition disabled:opacity-50"
                >
                  {sendQualityMutation.isPending ? "Enviando..." : "Enviar a Quality"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}