import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  FileCheck2, 
  Search, 
  FolderOpen, 
  ChevronRight,
  ClipboardList,
  History
} from "lucide-react";
import toast from "react-hot-toast";
import Swal from "sweetalert2";

import HeaderBox from "../../ui/HeaderBox";
import Table from "../../ui/Table";
import ModalGeneral from "../../ui/ModalGeneral";
import { 
  getParalegalTablero, 
  getExpedienteChecklist,
  completarTraduccionDocumento 
} from "../../../services/paralegalServices";
import { getExpedienteHistorial } from "../../../services/expedientesServices";

export default function MisEnsambles() {
  const queryClient = useQueryClient();
  
  // Get logged in user info
  const rawUser = JSON.parse(localStorage.getItem("user") ?? "{}");
  const currentUserId = Number(
    rawUser?.id ?? rawUser?.usuario_id ?? rawUser?.user_id ?? null
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedExpediente, setSelectedExpediente] = useState(null);
  
  // Modal for assembly completion
  const [assemblyOpen, setAssemblyOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [observaciones, setObservaciones] = useState("");

  const [activeRightTab, setActiveRightTab] = useState("checklist");

  // React Query: fetch paralegal's assigned cases (tablero)
  const { data: expedientes = [], isLoading: loadingExpedientes } = useQuery({
    queryKey: ["paralegal-tablero", currentUserId],
    queryFn: () => getParalegalTablero({ usuario_id: currentUserId }),
    enabled: Number.isFinite(currentUserId),
  });

  // React Query: fetch checklist/documents for the selected case
  const { data: checklist = [], isLoading: loadingChecklist, refetch: refetchChecklist } = useQuery({
    queryKey: ["expediente-checklist", selectedExpediente?.expediente_id],
    queryFn: () => getExpedienteChecklist(selectedExpediente.expediente_id),
    enabled: !!selectedExpediente?.expediente_id,
  });

  // React Query: fetch immutable timeline/history for the selected case
  const { data: timeline = [], isLoading: loadingTimeline } = useQuery({
    queryKey: ["expediente-historial", selectedExpediente?.expediente_id],
    queryFn: () => getExpedienteHistorial(selectedExpediente.expediente_id),
    enabled: !!selectedExpediente?.expediente_id,
  });

  // Mutation to mark translation/assembly as completed
  const completarMutation = useMutation({
    mutationFn: ({ expedienteId, documentoId, payload }) =>
      completarTraduccionDocumento(expedienteId, documentoId, payload),
    onSuccess: () => {
      toast.success("Documento completado y ensamblado exitosamente.");
      setAssemblyOpen(false);
      setSelectedDoc(null);
      setObservaciones("");
      refetchChecklist();
      // Invalidate tablero to refresh progress percentage
      queryClient.invalidateQueries({ queryKey: ["paralegal-tablero", currentUserId] });
    },
    onError: (error) => {
      Swal.fire({
        title: "Error",
        text: error.message || "Ocurrió un error al completar el ensamble.",
        icon: "error",
        confirmButtonColor: "#0e183f",
      });
    }
  });

  const filteredExpedientes = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return expedientes;
    return expedientes.filter((item) => {
      return (
        `${item.codigo_expediente ?? ""}`.toLowerCase().includes(query) ||
        `${item.cliente_nombre ?? ""}`.toLowerCase().includes(query) ||
        `${item.tipo_proceso ?? ""}`.toLowerCase().includes(query) ||
        `${item.oficina ?? ""}`.toLowerCase().includes(query)
      );
    });
  }, [expedientes, searchQuery]);

  const columnsExpedientes = [
    {
      header: "N° Expediente",
      accessor: "codigo_expediente",
      render: (val) => (
        <span className="font-semibold text-[#0e183f] dark:text-sky-300">
          {val || "-"}
        </span>
      ),
    },
    {
      header: "Cliente",
      accessor: "cliente_nombre",
      render: (val) => <span className="font-medium">{val || "-"}</span>,
    },
    {
      header: "Proceso / Categoría",
      accessor: "tipo_proceso",
      render: (val, row) => (
        <span className="text-xs text-slate-600 dark:text-slate-400">
          {val || "-"} {row.categoria_proceso ? `(${row.categoria_proceso})` : ""}
        </span>
      ),
    },
    {
      header: "Oficina",
      accessor: "oficina",
    },
    {
      header: "Avance",
      accessor: "porcentaje_avance_doc",
      align: "center",
      render: (val) => (
        <div className="flex items-center justify-center gap-2">
          <div className="w-16 bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-emerald-500 h-full transition-all duration-300"
              style={{ width: `${val || 0}%` }}
            />
          </div>
          <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
            {val || 0}%
          </span>
        </div>
      ),
    },
    {
      header: "Prioridad",
      accessor: "semaforo_prioridad",
      align: "center",
      render: (val) => {
        const classes = 
          val === "URGENTE" 
            ? "bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300" 
            : val === "MEDIA"
            ? "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300"
            : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
        return (
          <span className={`inline-flex items-center rounded-lg px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${classes}`}>
            {val || "NORMAL"}
          </span>
        );
      }
    }
  ];

  const handleOpenAssembly = (doc) => {
    setSelectedDoc(doc);
    setObservaciones("Documento revisado y ensamblado correctamente.");
    setAssemblyOpen(true);
  };

  const handleConfirmAssembly = (e) => {
    e.preventDefault();
    if (!selectedExpediente || !selectedDoc) return;

    completarMutation.mutate({
      expedienteId: selectedExpediente.expediente_id,
      documentoId: selectedDoc.id,
      payload: {
        usuario_id: currentUserId,
        observaciones: observaciones.trim()
      }
    });
  };

  const renderDocumentStatus = (doc) => {
    const requiereTrad = doc.requiere_traduccion;
    const estadoTrad = doc.estado_traduccion;

    if (!requiereTrad) {
      return (
        <span className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-400">
          No requiere trad.
        </span>
      );
    }

    if (estadoTrad === "TRADUCIDO_Y_VERIFICADO") {
      return (
        <span className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-100/50 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300">
          Listo para ensamble
        </span>
      );
    }

    const map = {
      PENDIENTE_TRADUCCION: { text: "Pendiente Traducción", classes: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-800" },
      ASIGNADO_TRADUCTOR: { text: "En Traducción", classes: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/20 dark:text-indigo-400 border border-indigo-150" },
      ENVIADO_QUALITY: { text: "Revisión Quality", classes: "bg-cyan-50 text-cyan-700 dark:bg-cyan-950/20 dark:text-cyan-400 border border-cyan-150" },
      ASIGNADO_QUALITY: { text: "Revisión Quality", classes: "bg-cyan-50 text-cyan-700 dark:bg-cyan-950/20 dark:text-cyan-400 border border-cyan-150" },
      QUALITY_DEVUELTO_REDACTOR: { text: "Observado QC", classes: "bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400 border border-rose-150" },
    };

    const config = map[estadoTrad] || { text: estadoTrad || "Pendiente", classes: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border border-slate-200" };

    return (
      <span className={`inline-flex items-center rounded-lg px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${config.classes}`}>
        {config.text}
      </span>
    );
  };

  return (
    <section className="space-y-6">
      <HeaderBox 
        title="MIS ENSAMBLES"
        subtitle="Verifica las traducciones completadas y ensambla el expediente final."
        Icon={FileCheck2}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Side: Expedientes List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/60 dark:border-slate-800 shadow-sm">
            <h3 className="text-sm font-bold text-[#0e183f] dark:text-white uppercase tracking-wider">
              Casos Asignados ({filteredExpedientes.length})
            </h3>
            
            <div className="relative w-full sm:w-72">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por expediente, cliente, oficina..."
                className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950 text-slate-700 dark:text-slate-300 outline-none focus:border-[#0e183f] focus:bg-white transition"
              />
            </div>
          </div>

          <Table
            columns={columnsExpedientes}
            data={filteredExpedientes}
            loading={loadingExpedientes}
            loadingLabel="Cargando expedientes del paralegal..."
            actions={(row) => (
              <button
                type="button"
                onClick={() => setSelectedExpediente(row)}
                className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border transition ${
                  selectedExpediente?.expediente_id === row.expediente_id
                    ? "bg-[#0e183f] text-white border-[#0e183f]"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 dark:bg-slate-850 dark:border-slate-800 dark:text-slate-300"
                }`}
              >
                Ver checklist
                <ChevronRight size={14} />
              </button>
            )}
            paginate={filteredExpedientes.length > 8}
            itemsPerPage={8}
            variant="card"
          />
        </div>

        {/* Right Side: selected expediente checklist */}
        <div className="space-y-4">
          {selectedExpediente ? (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col h-full">
              {/* Header Box of Selected Case */}
              <div className="bg-[linear-gradient(135deg,#0e183f_0%,#17305f_55%,#21497d_100%)] p-5 text-white">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 uppercase tracking-widest">
                  <FolderOpen size={14} />
                  <span>Detalles de Expediente</span>
                </div>
                <h4 className="mt-2 text-base font-black truncate">
                  {selectedExpediente.codigo_expediente}
                </h4>
                <p className="mt-1 text-xs font-medium text-slate-200 truncate">
                  {selectedExpediente.cliente_nombre}
                </p>
              </div>

              {/* Tabs Switcher */}
              <div className="flex border-b border-slate-100 dark:border-slate-850 bg-slate-50 dark:bg-slate-950 px-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveRightTab("checklist")}
                  className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition ${
                    activeRightTab === "checklist"
                      ? "border-[#0e183f] text-[#0e183f] dark:border-sky-400 dark:text-sky-400"
                      : "border-transparent text-slate-400 hover:text-slate-600"
                  }`}
                >
                  Checklist
                </button>
                <button
                  type="button"
                  onClick={() => setActiveRightTab("historial")}
                  className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition ${
                    activeRightTab === "historial"
                      ? "border-[#0e183f] text-[#0e183f] dark:border-sky-400 dark:text-sky-400"
                      : "border-transparent text-slate-400 hover:text-slate-600"
                  }`}
                >
                  Historial
                </button>
              </div>

              {/* Tab Content */}
              <div className="p-5 flex-1 space-y-4 max-h-[500px] overflow-y-auto">
                {activeRightTab === "checklist" ? (
                  loadingChecklist ? (
                    <div className="flex flex-col items-center justify-center py-10 space-y-3">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#0e183f] border-t-transparent" />
                      <span className="text-xs text-slate-400">Cargando documentación...</span>
                    </div>
                  ) : checklist.length === 0 ? (
                    <div className="text-center py-10 space-y-2">
                      <ClipboardList size={36} className="mx-auto text-slate-300" />
                      <p className="text-xs text-slate-400 font-medium">No hay documentos en este checklist.</p>
                    </div>
                  ) : (
                    checklist.map((doc) => {
                      const isReadyToAssemble = doc.requiere_traduccion && doc.estado_traduccion === "TRADUCIDO_Y_VERIFICADO";

                      return (
                        <div 
                          key={doc.id}
                          className="p-4 rounded-xl border border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-950/20 space-y-3"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1 min-w-0">
                              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                                {doc.nombre_documento || doc.tipo_documento || "Documento sin nombre"}
                              </p>
                              {doc.observaciones && (
                                <p className="text-[10px] text-slate-400 italic line-clamp-1">
                                  {doc.observaciones}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-850">
                            {renderDocumentStatus(doc)}

                            {isReadyToAssemble && (
                              <button
                                type="button"
                                onClick={() => handleOpenAssembly(doc)}
                                className="inline-flex h-7 items-center justify-center rounded-lg bg-emerald-600 px-3 text-[10px] font-semibold text-white hover:bg-emerald-700 transition"
                              >
                                Ensamblar
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )
                ) : (
                  loadingTimeline ? (
                    <div className="flex flex-col items-center justify-center py-10 space-y-3">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#0e183f] border-t-transparent" />
                      <span className="text-xs text-slate-400">Cargando historial...</span>
                    </div>
                  ) : timeline.length === 0 ? (
                    <div className="text-center py-10 space-y-2">
                      <History size={36} className="mx-auto text-slate-300" />
                      <p className="text-xs text-slate-400 font-medium">No hay movimientos registrados.</p>
                    </div>
                  ) : (
                    <div className="relative border-l border-slate-200 dark:border-slate-800 ml-2 space-y-4 py-2">
                      {timeline.map((event, idx) => (
                        <div key={event.id || idx} className="relative pl-6">
                          <div className="absolute -left-[5px] top-1.5 h-2 w-2 rounded-full bg-[#0e183f] dark:bg-sky-400" />
                          <div className="text-xs">
                            <span className="font-bold text-slate-800 dark:text-slate-200">
                              {event.evento || event.accion || "Movimiento"}
                            </span>
                            <span className="ml-2 text-[10px] text-slate-400 dark:text-slate-500">
                              {event.fecha_movimiento || event.created_at}
                            </span>
                            <p className="mt-1 text-slate-650 dark:text-slate-400 leading-relaxed">
                              {event.observacion || event.detalles || "Sin comentarios."}
                            </p>
                            {event.usuario_nombre && (
                              <p className="mt-0.5 text-[10px] font-bold text-[#0e183f] dark:text-sky-300">
                                Por: {event.usuario_nombre}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                )}
              </div>
            </div>
          ) : (
            <div className="h-96 flex flex-col items-center justify-center border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/30 rounded-xl p-5 text-center">
              <FolderOpen size={40} className="text-slate-350 dark:text-slate-700 animate-pulse" />
              <h4 className="mt-3 text-sm font-bold text-slate-400 uppercase tracking-wider">
                Ningún caso seleccionado
              </h4>
              <p className="mt-1 text-xs text-slate-400 max-w-xs leading-relaxed">
                Selecciona un caso de la lista para ver el checklist y proceder con la revisión y ensamble.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Assembly Confirmation Modal */}
      <ModalGeneral
        open={assemblyOpen}
        onClose={() => {
          setAssemblyOpen(false);
          setSelectedDoc(null);
          setObservaciones("");
        }}
        title="CONFIRMAR REVISIÓN Y ENSAMBLE"
        size="md"
        footer={
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => {
                setAssemblyOpen(false);
                setSelectedDoc(null);
                setObservaciones("");
              }}
              className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              CANCELAR
            </button>
            <button
              type="button"
              onClick={handleConfirmAssembly}
              disabled={completarMutation.isPending}
              className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-750"
            >
              {completarMutation.isPending ? "COMPLETANDO..." : "COMPLETAR Y ENSAMBLAR"}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Documento a ensamblar</p>
            <p className="mt-1.5 font-bold text-slate-800">
              {selectedDoc?.nombre_documento}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              Expediente: {selectedExpediente?.codigo_expediente}
            </p>
          </div>

          <label className="block space-y-1">
            <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Observaciones del Ensamble
            </span>
            <textarea
              required
              rows={4}
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Escriba aquí los detalles del ensamble..."
              className="w-full rounded-xl border border-slate-250 bg-white p-3 text-xs text-slate-750 outline-none transition focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          </label>
        </div>
      </ModalGeneral>
    </section>
  );
}
