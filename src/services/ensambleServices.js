function buildHeaders(includeJson = false) {
  const token = localStorage.getItem("token");

  return {
    accept: "application/json",
    "ngrok-skip-browser-warning": "true",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(includeJson ? { "Content-Type": "application/json" } : {}),
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
      `Error al ${actionLabel}: ${response.status}${
        detail ? ` - ${detail}` : ""
      }`
    );
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

function resolveCollection(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.expedientes)) return data.expedientes;
  if (Array.isArray(data?.checklist)) return data.checklist;
  if (Array.isArray(data?.items)) return data.items;

  return [];
}

function validateId(value, label) {
  const id = Number(value);

  if (!Number.isFinite(id)) {
    throw new Error(`${label} es obligatorio.`);
  }

  return id;
}

function normalizeExpediente(data) {
  if (!data) return null;
  return {
    id: data.id || data.expediente_id,
    numeroExpediente: data.codigo_expediente,
    nombre: data.cliente_nombre,
    oficina: data.oficina,
    proceso: data.tipo_proceso,
    categoria: data.categoria_proceso,
    custodioUsuarioId: data.custodia_usuario_id,
    custodioNombre: data.custodio_nombre || data.usuario_custodio_nombre || "Sin asignar",
    fechaAsignacion: data.fecha_asignacion,
  };
}

/**
 * 1. Asignaciones - Ensamble
 * Obtiene los expedientes ya asignados.
 */
export async function getExpedientesAsignados() {
  try {
    const response = await fetch("/api/expedientes/asignados", {
      method: "GET",
      headers: buildHeaders(),
      credentials: "include",
    });

    const data = await parseResponse(response, "obtener expedientes asignados");
    return resolveCollection(data).map(normalizeExpediente).filter(Boolean);
  } catch (error) {
    console.error("Error consultando expedientes asignados:", error);
    return [];
  }
}

/**
 * Reasigna el Paralegal custodio de un expediente.
 */
export async function reasignarParalegal(id, payload) {
  const expedienteId = validateId(id, "El ID del expediente");
  const nuevo_paralegal_usuario_id = Number(payload?.nuevo_paralegal_usuario_id);
  const reasignador_usuario_id = Number(payload?.reasignador_usuario_id);

  if (!Number.isFinite(nuevo_paralegal_usuario_id)) {
    throw new Error("nuevo_paralegal_usuario_id es obligatorio.");
  }
  if (!Number.isFinite(reasignador_usuario_id)) {
    throw new Error("reasignador_usuario_id es obligatorio.");
  }

  try {
    const response = await fetch(`/api/expedientes/${expedienteId}/reasignar-paralegal`, {
      method: "POST",
      headers: buildHeaders(true),
      body: JSON.stringify({
        nuevo_paralegal_usuario_id,
        reasignador_usuario_id,
        motivo: `${payload?.motivo ?? ""}`.trim(),
      }),
      credentials: "include",
    });

    const data = await parseResponse(response, "reasignar paralegal del expediente");
    return normalizeExpediente(data?.data ?? data) ?? data;
  } catch (error) {
    console.error("Error reasignando paralegal del expediente:", error);
    throw error;
  }
}

/**
 * 2. Mis Ensambles
 * Obtiene el tablero personal del paralegal.
 */
export async function getParalegalTablero(payload) {
  const usuarioId = validateId(payload?.usuario_id, "usuario_id");

  try {
    const params = new URLSearchParams({
      usuario_id: String(usuarioId),
    });

    const response = await fetch(`/api/paralegal/tablero?${params.toString()}`, {
      method: "GET",
      headers: buildHeaders(),
      credentials: "include",
    });

    const data = await parseResponse(response, "obtener tablero del paralegal");
    return resolveCollection(data);
  } catch (error) {
    console.error("Error consultando tablero del paralegal:", error);
    return [];
  }
}

/**
 * Obtiene el checklist dinámico de un expediente.
 */
export async function getExpedienteChecklist(id) {
  const expedienteId = validateId(id, "El ID del expediente");

  try {
    const response = await fetch(`/api/paralegal/expedientes/${expedienteId}/checklist`, {
      method: "GET",
      headers: buildHeaders(),
      credentials: "include",
    });

    const data = await parseResponse(response, "obtener checklist del expediente");
    return resolveCollection(data);
  } catch (error) {
    console.error("Error consultando checklist del expediente:", error);
    return [];
  }
}

/**
 * Completa la traducción de un documento (acción de ensamblar).
 */
export async function completarTraduccionDocumento(expedienteId, documentoId, payload) {
  const expId = validateId(expedienteId, "El ID del expediente");
  const docId = validateId(documentoId, "El ID del documento");
  const usuario_id = Number(payload?.usuario_id);

  if (!Number.isFinite(usuario_id)) {
    throw new Error("usuario_id es obligatorio.");
  }

  try {
    const response = await fetch(
      `/api/expedientes/${expId}/documentos/${docId}/completar-traduccion`,
      {
        method: "PATCH",
        headers: buildHeaders(true),
        body: JSON.stringify({
          usuario_id,
          observaciones: `${payload?.observaciones ?? ""}`.trim() || undefined,
        }),
        credentials: "include",
      }
    );

    return await parseResponse(response, "completar traducción del documento");
  } catch (error) {
    console.error("Error completando traducción del documento:", error);
    throw error;
  }
}

/**
 * Obtiene el historial inmutable (Timeline) del expediente.
 */
export async function getExpedienteHistorial(id) {
  const expedienteId = validateId(id, "El ID del expediente");

  try {
    const response = await fetch(`/api/expedientes/${expedienteId}/historial`, {
      method: "GET",
      headers: buildHeaders(),
      credentials: "include",
    });

    const data = await parseResponse(response, "obtener historial del expediente");
    return resolveCollection(data);
  } catch (error) {
    console.error("Error consultando historial del expediente:", error);
    return [];
  }
}
