import { BadgeCheck, SquarePen, UserX } from "lucide-react";
import Table from "../../../ui/Table";

export default function UsuarioTable({
  data,
  loading,
  onEdit,
  onToggleStatus,
}) {
  const columns = [
    { header: "NOMBRE", accessor: "name" },
    { header: "USUARIO", accessor: "username" },
    { header: "CORREO", accessor: "email" },
    {
      header: "ESTADO",
      accessor: "status",
      render: (value) => (
        <span
          className={`inline-flex rounded-md px-3 py-1 text-xs font-semibold ${
            value === "Inactivo"
              ? "bg-rose-100 text-rose-800"
              : "bg-emerald-100 text-emerald-800"
          }`}
        >
          {value}
        </span>
      ),
    },
    { header: "ROL", accessor: "role" },
  ];

  return (
    <Table
      columns={columns}
      data={data}
      loading={loading}
      loadingLabel="Cargando usuarios..."
      actions={(row) => (
        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            aria-label="Editar"
            onClick={() => onEdit(row)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-700 transition hover:bg-slate-50"
          >
            <SquarePen size={18} />
          </button>

          <span className="h-5 w-px bg-slate-200" />

          <button
            type="button"
            aria-label={row.status === "Inactivo" ? "Reactivar" : "Inactivar"}
            title={row.status === "Inactivo" ? "Reactivar" : "Inactivar"}
            onClick={() => onToggleStatus(row)}
            className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 transition ${
              row.status === "Inactivo"
                ? "text-emerald-700 hover:bg-emerald-50"
                : "text-rose-700 hover:bg-rose-50"
            }`}
          >
            {row.status === "Inactivo" ? (
              <BadgeCheck size={18} />
            ) : (
              <UserX size={18} />
            )}
          </button>
        </div>
      )}
    />
  );
}
