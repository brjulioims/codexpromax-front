import { useNavigate } from "react-router-dom";

import Table from "../../../ui/Table";

export default function GestionClientesTable({ data, loading }) {
  const navigate = useNavigate();

  const columns = [
    {
      header: "CODIGO",
      accessor: "codigoCliente",
      render: (value, row) => (
        <button
          type="button"
          onClick={() => navigate("/clientes/detalle_cliente", { state: { cliente: row } })}
          className="font-semibold text-[#0e183f] transition hover:text-[#d15f03] hover:underline"
        >
          {value}
        </button>
      ),
    },
    {
      header: "NOMBRE",
      accessor: "nombre",
      render: (value, row) => (
        <button
          type="button"
          onClick={() => navigate("/clientes/detalle_cliente", { state: { cliente: row } })}
          className="font-semibold text-[#0e183f] transition hover:text-[#d15f03] hover:underline"
        >
          {value}
        </button>
      ),
    },
    { header: "OFICINA", accessor: "oficina" },
    { header: "PROCESO", accessor: "proceso" },
    { header: "ESTADO", accessor: "estadoCliente" },
    { header: "FECHA INGRESO", accessor: "fechaIngreso" },
  ];

  return (
    <Table
      columns={columns}
      data={data}
      loading={loading}
      loadingLabel="Cargando clientes..."
    />
  );
}
