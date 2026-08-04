import { BriefcaseBusiness } from "lucide-react";
import { useLocation } from "react-router-dom";

import HeaderBox from "../../ui/HeaderBox";

export default function DetalleCliente() {
  const { state } = useLocation();
  const cliente = state?.cliente ?? {};

  const nombre = cliente.nombre || "Detalle del cliente";
  const codigo = cliente.codigoCliente || "Sin código";
  const proceso = cliente.proceso || "Sin proceso";

  const activo =
    cliente.activo === 1 || cliente.activo === "1"
      ? "Sí"
      : cliente.activo === 0 || cliente.activo === "0"
        ? "No"
        : "Sin dato";

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
    if (
      value === null ||
      value === undefined ||
      value === "" ||
      value === "Sin dato"
    ) {
      return "No registrado";
    }

    return value;
  };

  const estaVacio = (value) =>
    value === null ||
    value === undefined ||
    value === "" ||
    value === "Sin dato";

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
      />

      <div className="w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-4 border-b border-slate-200 px-8 py-5">
          <h3 className="text-[25px] font-semibold uppercase tracking-[0.04em] text-[#101a3c]">
            Datos Básicos
          </h3>
        </div>

        {/* Información */}
        <div className="px-8 divide-y divide-slate-100">
          {filas.map((fila, index) => (
            <div
              key={index}
              className="grid grid-cols-3 gap-x-10 py-6"
            >
              {fila.map((dato) => (
                <div key={dato.label}>
                  <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[#8da2ce]">
                    {dato.label}
                  </p>

                  <p
                    className={`mt-1 break-words text-[16px] leading-6 ${
                      estaVacio(dato.value)
                        ? "text-slate-300"
                        : "text-[#0e183f]"
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
    </section>
  );
}
