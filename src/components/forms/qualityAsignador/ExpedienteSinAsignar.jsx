import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BriefcaseBusiness, Filter } from "lucide-react";
import toast from "react-hot-toast";
import { useLocation } from "react-router-dom";
import Swal from "sweetalert2";

import HeaderBox from "../../ui/HeaderBox";
import ModalFiltro from "../../ui/ModalFiltro";
import Table from "../../ui/Table";
import { invalidateWorkflowQueries, workflowInvalidations } from "../../../utils/queryKeys";
import {
  asignarExpediente,
  getQualityBandeja,
} from "../../../services/expedientesServices";
import { useUsuariosQuery } from "../../../hooks/queries/useUsuariosQuery";

export default function ExpedienteSinAsignar() {
  const { state } = useLocation();
  const queryClient = useQueryClient();
  const cliente = state?.cliente ?? {};
  const nombre = cliente.nombre || cliente.nombreCliente || "Expedientes sin asignar";
  const [filterOpen, setFilterOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [selectedExpediente, setSelectedExpediente] = useState(null);
  const [selectedParalegalId, setSelectedParalegalId] = useState("");
  const [observacion, setObservacion] = useState("");
  const defaultFilters = {
    query: "",
    oficina: "Todos",
    categoria: "Todos",
    proceso: "Todos",
  };
  const [filters, setFilters] = useState(defaultFilters);
  const [draftFilters, setDraftFilters] = useState(defaultFilters);
  const { data: qualityBandeja = [], isLoading } = useQuery({
    queryKey: ["expedientes", "quality-bandeja"],
    queryFn: getQualityBandeja,
  });
  const { data: usuarios = [] } = useUsuariosQuery();
  const { mutateAsync: asignarMutate, isPending: savingAssign } = useMutation({
    mutationFn: ({ expedienteId, payload }) => asignarExpediente(expedienteId, payload),
    onSuccess: async () => {
      await invalidateWorkflowQueries(queryClient, workflowInvalidations.quality.asignarExpediente);
    },
  });

  const expedientes = useMemo(() => {
    return qualityBandeja.map((item) => ({
      id: item.expediente_id,
      numeroExpediente: item.codigo_expediente || "No registrado",
      nombre: item.cliente_nombre || "No registrado",
      oficina: item.oficina || "No registrado",
      categoria: item.categoria_proceso || "No registrado",
      proceso: item.tipo_proceso || "No registrado",
      fechaIngreso: item.fecha_ingreso_expediente || "No registrado",
    }));
  }, [qualityBandeja]);

  const filteredExpedientes = useMemo(() => {
    const term = filters.query.trim().toLowerCase();

    return expedientes.filter((item) => {
      const matchesQuery =
        !term ||
        [
          item.numeroExpediente,
          item.nombre,
          item.oficina,
          item.categoria,
          item.proceso,
          item.fechaIngreso,
        ].some((value) => `${value ?? ""}`.toLowerCase().includes(term));

      return (
        matchesQuery &&
        (filters.oficina === "Todos" || item.oficina === filters.oficina) &&
        (filters.categoria === "Todos" || item.categoria === filters.categoria) &&
        (filters.proceso === "Todos" || item.proceso === filters.proceso)
      );
    });
  }, [expedientes, filters]);

  const oficinaOptions = useMemo(
    () => [...new Set(expedientes.map((item) => item.oficina).filter(Boolean))],
    [expedientes]
  );
  const categoriaOptions = useMemo(
    () => [...new Set(expedientes.map((item) => item.categoria).filter(Boolean))],
    [expedientes]
  );
  const procesoOptions = useMemo(
    () => [...new Set(expedientes.map((item) => item.proceso).filter(Boolean))],
    [expedientes]
  );
  const paralegalOptions = useMemo(() => {
    return usuarios
      .filter((usuario) => {
        const rol = `${usuario?.rolNombre ?? usuario?.role ?? ""}`.toLowerCase();
        return rol.includes("paralegal");
      })
      .map((usuario) => ({
        id: usuario.id,
        nombre: usuario.nombre,
      }));
  }, [usuarios]);

  const columns = [
    { header: "N° Expediente", accessor: "numeroExpediente" },
    { header: "Nombre", accessor: "nombre" },
    { header: "Oficina", accessor: "oficina" },
    { header: "Categoria", accessor: "categoria" },
    { header: "Proceso", accessor: "proceso" },
    { header: "Fecha Ingreso", accessor: "fechaIngreso" },
  ];

  async function handleApplyFilters() {
    toast.success("La tabla fue actualizada con los filtros seleccionados.");
    setFilters(draftFilters);
    setFilterOpen(false);
  }

  async function handleSaveAsignacion() {
    const expedienteId = Number(selectedExpediente?.id);
    const paralegalUsuarioId = Number(selectedParalegalId);
    const equipoId = (() => {
      const categoria = `${selectedExpediente?.categoria ?? ""}`.toUpperCase();
      const proceso = `${selectedExpediente?.proceso ?? ""}`.toUpperCase();

      if (categoria.includes("ASILO") || proceso.includes("ASILO")) return 1;
      if (categoria.includes("USCIS") || proceso.includes("USCIS")) return 2;

      return null;
    })();

    if (!Number.isFinite(expedienteId)) {
      await Swal.fire({
        icon: "warning",
        title: "Expediente invalido",
        text: "No se pudo identificar el expediente.",
        confirmButtonColor: "#0e183f",
      });
      return;
    }

    if (!Number.isFinite(paralegalUsuarioId)) {
      await Swal.fire({
        icon: "warning",
        title: "Selecciona un paralegal",
        text: "Debes elegir un paralegal para continuar.",
        confirmButtonColor: "#0e183f",
      });
      return;
    }

    if (!Number.isFinite(Number(equipoId))) {
      await Swal.fire({
        icon: "warning",
        title: "Equipo no identificado",
        text: "No se pudo resolver el equipo automaticamente para este expediente.",
        confirmButtonColor: "#0e183f",
      });
      return;
    }

    const rawUser = JSON.parse(localStorage.getItem("user") ?? "{}");
    const asignadorUsuarioId = Number(
      rawUser?.id ?? rawUser?.usuario_id ?? rawUser?.user_id ?? null
    );

    if (!Number.isFinite(asignadorUsuarioId)) {
      await Swal.fire({
        icon: "error",
        title: "Usuario invalido",
        text: "No se pudo identificar el usuario actual.",
        confirmButtonColor: "#0e183f",
      });
      return;
    }

    const result = await Swal.fire({
      icon: "question",
      title: "Guardar asignacion",
      text: "Se asignara el expediente al paralegal seleccionado.",
      showCancelButton: true,
      confirmButtonText: "Si, guardar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#0e183f",
      cancelButtonColor: "#94a3b8",
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      await asignarMutate({
        expedienteId,
        payload: {
          equipo_id: equipoId,
          paralegal_usuario_id: paralegalUsuarioId,
          asignador_usuario_id: asignadorUsuarioId,
          observacion,
        },
      });

      toast.success("El expediente fue asignado correctamente.");

      setAssignOpen(false);
      setSelectedExpediente(null);
      setSelectedParalegalId("");
      setObservacion("");
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "No se pudo asignar",
        text: error?.message || "No se pudo guardar la asignacion.",
        confirmButtonColor: "#0e183f",
      });
    }
  }

  return (
    <section className="w-full space-y-5">
      <HeaderBox
        Icon={BriefcaseBusiness}
        title={
          <span className="inline-flex items-center gap-3">
            <span>{nombre}</span>
            <span className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-slate-50 px-3 py-1 text-sm font-semibold normal-case tracking-normal text-[#0e183f]">
              Total registros: {filteredExpedientes.length}
            </span>
          </span>
        }
        action={
          <div className="flex flex-wrap items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setFilterOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <Filter size={16} />
              Filtros
            </button>
          </div>
        }
      />

      <Table
          columns={columns}
          data={filteredExpedientes}
          loading={isLoading}
          loadingLabel="Cargando expedientes..."
          actions={(row) => (
            <button
              type="button"
              onClick={() => {
                setSelectedExpediente(row);
                setSelectedParalegalId("");
                setObservacion("");
                setAssignOpen(true);
              }}
              className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-[#0e183f] transition hover:bg-slate-50"
            >
              Asignar
            </button>
          )}
          paginate={false}
          variant="card"
          tableClassName="w-full text-sm text-[#101a3c]"
        />

      <ModalFiltro
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        title="FILTROS DE EXPEDIENTES"
        footer={
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => {
                setDraftFilters(defaultFilters);
                setFilters(defaultFilters);
                setFilterOpen(false);
              }}
              className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              LIMPIAR
            </button>
            <button
              type="button"
              onClick={handleApplyFilters}
              className="inline-flex items-center justify-center rounded-lg bg-[#0e183f] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#16245e]"
            >
              APLICAR
            </button>
          </div>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="text-sm font-medium text-slate-700">BUSCAR:</span>
            <input
              value={draftFilters.query}
              onChange={(e) =>
                setDraftFilters((current) => ({ ...current, query: e.target.value }))
              }
              placeholder="NOMBRE, EXPEDIENTE, OFICINA O PROCESO"
              className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-slate-300"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">OFICINA:</span>
            <select
              value={draftFilters.oficina}
              onChange={(e) =>
                setDraftFilters((current) => ({ ...current, oficina: e.target.value }))
              }
              className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-slate-300"
            >
              <option value="Todos">TODOS</option>
              {oficinaOptions.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">CATEGORIA:</span>
            <select
              value={draftFilters.categoria}
              onChange={(e) =>
                setDraftFilters((current) => ({ ...current, categoria: e.target.value }))
              }
              className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-slate-300"
            >
              <option value="Todos">TODOS</option>
              {categoriaOptions.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>

          <label className="block sm:col-span-2">
            <span className="text-sm font-medium text-slate-700">PROCESO:</span>
            <select
              value={draftFilters.proceso}
              onChange={(e) =>
                setDraftFilters((current) => ({ ...current, proceso: e.target.value }))
              }
              className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-slate-300"
            >
              <option value="Todos">TODOS</option>
              {procesoOptions.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
        </div>
      </ModalFiltro>

      <ModalFiltro
        open={assignOpen}
        onClose={() => {
          setAssignOpen(false);
          setSelectedExpediente(null);
          setSelectedParalegalId("");
          setObservacion("");
        }}
        title="ASIGNAR EXPEDIENTE"
        footer={
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => {
                setAssignOpen(false);
                setSelectedExpediente(null);
                setSelectedParalegalId("");
                setObservacion("");
              }}
              className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              CANCELAR
            </button>
            <button
              type="button"
              onClick={handleSaveAsignacion}
              disabled={savingAssign}
              className="inline-flex items-center justify-center rounded-lg bg-[#0e183f] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#16245e]"
            >
              {savingAssign ? "GUARDANDO..." : "GUARDAR"}
            </button>
          </div>
        }
      >
        <div className="grid gap-5">
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="bg-[linear-gradient(135deg,#0e183f_0%,#17305f_55%,#21497d_100%)] px-5 py-4 text-white">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-200">
                Resumen del expediente
              </p>
              <p className="mt-2 text-lg font-bold">
                {selectedExpediente?.numeroExpediente ?? "-"}
              </p>
            </div>
            <div className="grid gap-3 bg-slate-50 px-5 py-4 text-sm text-slate-700 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Cliente
                </p>
                <p className="mt-1 font-semibold text-slate-800">
                  {selectedExpediente?.nombre ?? "-"}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Oficina
                </p>
                <p className="mt-1 font-semibold text-slate-800">
                  {selectedExpediente?.oficina ?? "-"}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm sm:col-span-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Proceso
                </p>
                <p className="mt-1 font-semibold text-slate-800">
                  {selectedExpediente?.proceso ?? "-"}
                </p>
              </div>
            </div>
          </div>

          <label className="block rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
              Paralegal
            </span>
            <select
              value={selectedParalegalId}
              onChange={(e) => setSelectedParalegalId(e.target.value)}
              className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none transition focus:border-[#0e183f]"
            >
              <option value="">SELECCIONA UN PARALEGAL</option>
              {paralegalOptions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nombre}
                </option>
              ))}
            </select>
          </label>

          <label className="block rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
              Observacion
            </span>
            <textarea
              value={observacion}
              onChange={(e) => setObservacion(e.target.value)}
              rows={4}
              placeholder="Motivo o comentario de la asignacion"
              className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#0e183f]"
            />
          </label>
        </div>
      </ModalFiltro>
    </section>
  );
}
