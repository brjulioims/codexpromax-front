const CLIENTES_API_URL = "/api/clientes";

function buildHeaders(includeJson = false) {
  const token = localStorage.getItem("token");
  return {
    accept: "*/*",
    "ngrok-skip-browser-warning": "true",
    Authorization: token ? `Bearer ${token}` : "",
    ...(includeJson ? { "Content-Type": "application/json" } : {}),
  };
}

function normalizeCliente(cliente) {
  const id = Number(
    cliente?.id ??
      cliente?.cliente_id ??
      cliente?.customer_id ??
      cliente?.idCliente ??
      cliente?.clienteId ??
      null
  );

  if (!Number.isFinite(id)) return null;

  return {
    id,
    contiaId:
      cliente?.contia_id == null && cliente?.contiaId == null
        ? null
        : Number(cliente?.contia_id ?? cliente?.contiaId),
    codigoCliente: `${cliente?.codigo_cliente ?? cliente?.codigoCliente ?? ""}`.trim(),
    nombre: `${cliente?.nombre ?? ""}`.trim(),
    paisOrigen: cliente?.pais_origen ?? cliente?.paisOrigen ?? null,
    fechaIngreso: cliente?.fecha_ingreso ?? cliente?.fechaIngreso ?? null,
    estadoResidencia: cliente?.estado_residencia ?? cliente?.estadoResidencia ?? null,
    oficina: `${cliente?.oficina ?? ""}`.trim(),
    proceso: `${cliente?.proceso ?? ""}`.trim(),
    estadoCliente: `${cliente?.estado_cliente ?? cliente?.estadoCliente ?? ""}`.trim(),
    fechaPrimerPago:
      cliente?.fecha_primer_pago ?? cliente?.fechaPrimerPago ?? null,
    fechaCreacion: cliente?.fecha_creacion ?? cliente?.fechaCreacion ?? null,
    activo:
      cliente?.activo == null
        ? null
        : Number(cliente.activo),
  };
}

async function parseResponse(response, actionLabel) {
  if (!response.ok) {
    let detail = "";

    try {
      const contentType = response.headers.get("content-type") ?? "";
      if (contentType.includes("application/json")) {
        const errorData = await response.json();
        detail =
          errorData?.message ??
          errorData?.error ??
          errorData?.detail ??
          JSON.stringify(errorData);
      } else {
        detail = await response.text();
      }
    } catch {
      detail = "";
    }

    throw new Error(
      `Error al ${actionLabel}: ${response.status}${detail ? ` - ${detail}` : ""}`
    );
  }

  return response.json();
}

function resolveCollection(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.clientes)) return data.clientes;
  return [];
}

export async function getClientes() {
  try {
    const response = await fetch(CLIENTES_API_URL, {
      method: "GET",
      headers: buildHeaders(),
      credentials: "include",
    });

    const data = await parseResponse(response, "obtener clientes");
    return resolveCollection(data).map(normalizeCliente).filter(Boolean);
  } catch (error) {
    console.error("Error consultando clientes", error);
    return [];
  }
}

export async function getClienteById(id) {
  try {
    const response = await fetch(`${CLIENTES_API_URL}/${id}`, {
      method: "GET",
      headers: buildHeaders(),
      credentials: "include",
    });

    const data = await parseResponse(response, "obtener cliente");
    return normalizeCliente(data?.data ?? data);
  } catch (error) {
    console.error("Error consultando cliente", error);
    return null;
  }
}

export { CLIENTES_API_URL };
