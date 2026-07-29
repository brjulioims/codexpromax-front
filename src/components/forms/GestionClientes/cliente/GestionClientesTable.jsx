import Table from "../../../ui/Table";

export default function GestionClientesTable({ data, loading }) {
  const columns = [
    { header: "CODIGO", accessor: "codigoCliente" },
    { header: "NOMBRE", accessor: "nombre" },
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
