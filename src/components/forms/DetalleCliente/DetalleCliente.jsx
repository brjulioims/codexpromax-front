import { useMemo, useState } from "react";
import { BriefcaseBusiness, FileText, MoveLeft } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

import { useRolesQuery } from "../../../hooks/queries/useRolesQuery";
import HeaderBox from "../../ui/HeaderBox";

export default function DetalleCliente() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const [selectedMenuId, setSelectedMenuId] = useState("basico");
  const cliente = state?.cliente ?? {};
  const { data: roles = [] } = useRolesQuery();

  const nombre = cliente.nombre || "Detalle del cliente";
  const codigo = cliente.codigoCliente || "Sin código";
  const proceso = cliente.proceso || "Sin proceso";

  const activo =
    cliente.activo === 1 || cliente.activo === "1"
      ? "Sí"
      : cliente.activo === 0 || cliente.activo === "0"
        ? "No"
        : "Sin dato";

  const secciones = useMemo(() => {
    return [
      { id: "basico", label: "Basico" },
      ...roles
        .filter((role) => role?.id && role?.nombre)
        .map((role) => ({ id: `rol-${role.id}`, label: role.nombre })),
    ];
  }, [roles]);

  const seccionActiva =
    secciones.find((section) => section.id === selectedMenuId) ?? secciones[0] ?? null;

  const filas = [
    [
      { label: "Nombre", value: cliente.nombre },
      { label: "Código", value: cliente.codigoCliente },
      { label: "Contia ID", value: cliente.contiaId },
    ],
    [
      { label: "País de origen", value: cliente.paisOrigen },
      { label: "Estado cliente", value: cliente.estadoCliente },
      { label: "Fecha de ingreso", value: cliente.fechaIngreso },
    ],
    [
      { label: "Proceso", value: cliente.proceso },
      { label: "Oficina", value: cliente.oficina },
      { label: "Fecha primer pago", value: cliente.fechaPrimerPago },
    ],
    [
      { label: "Estado residencia", value: cliente.estadoResidencia },
      { label: "Fecha de creación", value: cliente.fechaCreacion },
      { label: "Activo", value: activo },
    ],
  ];

  const mostrarValor = (value) => {
    if (value === null || value === undefined || value === "" || value === "Sin dato") {
      return "No registrado";
    }

    return value;
  };

  const estaVacio = (value) =>
    value === null || value === undefined || value === "" || value === "Sin dato";

  return (
    <section className="w-full space-y-5">
      <HeaderBox
        Icon={BriefcaseBusiness}
        title={
          <>
            <span className="block">{nombre}</span>
            <span className="mt-3 flex flex-wrap items-center gap-3 text-sm font-semibold tracking-[0.10em] text-slate-500">
              <span className="inline-flex items-center rounded-lg bg-[#0e183f] px-5 py-2 text-white">
                CÓDIGO: {codigo}
              </span>
              <span>{proceso}</span>
            </span>
          </>
        }
        action={
          <button
            type="button"
            onClick={() => navigate("/clientes")}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800/60"
          >
            <MoveLeft size={16} />
            Gestion de Clientes
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[330px_1fr] 2xl:gap-5">
        <aside className="rounded-lg border border-slate-200 dark:border-slate-800 bg-[#f8f9fb] dark:bg-slate-950 p-4 shadow-sm transition-colors duration-300">
          <div className="mb-4 2xl:mb-5">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-900 text-[#0e0f16] dark:text-slate-100 transition-colors duration-300">
              <FileText size={18} />
              </div>
              <div>
                <p className="text-base font-semibold uppercase text-[#101a3c] dark:text-slate-100 2xl:text-[18px]">
                  Secciones
                </p>
                <p className="mt-1 text-xs uppercase text-slate-400">Perfil del cliente</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {secciones.length ? (
              secciones.map((section) => {
                const isActive = selectedMenuId === section.id;

                return (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => setSelectedMenuId(section.id)}
                    className={`group relative flex w-full items-center gap-4 overflow-hidden rounded-xl px-4 py-3.5 text-left transition-all duration-300 ease-out 2xl:py-4 ${
                      isActive
                        ? "bg-[#0d1b5e] dark:bg-blue-900/60 text-white shadow-lg shadow-[#0d1b5e]/10 dark:shadow-blue-900/20 ring-1 ring-[#0d1b5e]/10 dark:ring-blue-900/30"
                        : "bg-white/60 dark:bg-slate-900/40 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-900 hover:text-slate-800 dark:hover:text-slate-200 hover:shadow-sm border border-slate-200/60 dark:border-slate-800/60 hover:border-slate-200 dark:hover:border-slate-700"
                    }`}
                  >
                    <span
                      className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all duration-300 ${
                        isActive
                          ? "bg-white/15 text-orange-300"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:bg-[#0d1b5e]/10 dark:group-hover:bg-blue-900/30 group-hover:text-[#0d1b5e] dark:group-hover:text-blue-300"
                      }`}
                    >
                      <span
                        className={`h-2.5 w-2.5 rounded-full transition-all duration-300 ${
                          isActive
                            ? "bg-orange-400 shadow-[0_0_0_4px_rgba(251,146,60,0.15)]"
                            : "bg-slate-300 dark:bg-slate-600 group-hover:bg-[#0d1b5e] dark:group-hover:bg-blue-400"
                        }`}
                      />
                    </span>
                    <span className="relative z-10 flex min-w-0 flex-1">
                      <span className="truncate text-sm font-semibold tracking-wide uppercase">
                        {section.label}
                      </span>
                    </span>
                  </button>
                );
              })
            ) : (
              <p className="text-sm text-slate-500">No hay permisos activos para mostrar.</p>
            )}
          </div>
        </aside>

        <div className="w-full overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm transition-colors duration-300">
          <div className="flex items-center gap-4 border-b border-slate-200 dark:border-slate-700 px-8 py-5">
            <h3 className="text-[25px] font-semibold uppercase tracking-[0.04em] text-[#101a3c] dark:text-white">
              {seccionActiva?.id === "basico"
                ? "Datos Basicos"
                : seccionActiva?.label ?? "Datos Basicos"}
            </h3>
          </div>

          <div className="divide-y divide-slate-100 px-8">
            {filas.map((fila, index) => (
              <div key={index} className="grid grid-cols-3 gap-x-10 py-6">
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
        </div>
      </div>
    </section>
  );
}
