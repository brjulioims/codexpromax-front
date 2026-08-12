const EXPEDIENTES_API_URL = "/api/expedientes";

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
  if (Array.isArray(data?.historial)) return data.historial;
  if (Array.isArray(data?.timeline)) return data.timeline;

  return [];
}

function validateId(value, label = "El ID") {
  const id = Number(value);

  if (!Number.isFinite(id)) {
    throw new Error(`${label} es obligatorio.`);
  }

  return id;
}

function normalizeQualityExpediente(item) {
  const expediente_id = Number(item?.expediente_id ?? item?.id);

  if (!Number.isFinite(expediente_id)) {
    return null;
  }

  return {
    expediente_id,
    codigo_expediente: `${item?.codigo_expediente ?? ""}`.trim(),
    tipo_proceso: `${item?.tipo_proceso ?? ""}`.trim(),
    categoria_proceso: `${item?.categoria_proceso ?? ""}`.trim(),
    estado_principal: `${item?.estado_principal ?? ""}`.trim(),
    sub_estado: `${item?.sub_estado ?? ""}`.trim(),
    semaforo_prioridad: `${item?.semaforo_prioridad ?? ""}`.trim(),

    fecha_ingreso_expediente:
      item?.fecha_ingreso_expediente ?? null,

    cliente_id:
      item?.cliente_id == null ? null : Number(item.cliente_id),

    contia_id:
      item?.contia_id == null ? null : Number(item.contia_id),

    codigo_cliente: `${item?.codigo_cliente ?? ""}`.trim(),
    cliente_nombre: `${item?.cliente_nombre ?? ""}`.trim(),
    pais_origen: `${item?.pais_origen ?? ""}`.trim(),
    oficina: `${item?.oficina ?? ""}`.trim(),

    fecha_primer_pago:
      item?.fecha_primer_pago ?? null,

    estado_cliente: `${item?.estado_cliente ?? ""}`.trim(),
  };
}

function normalizeExpediente(item) {
  if (!item || typeof item !== "object") {
    return null;
  }

  const expediente_id = Number(
    item?.expediente_id ?? item?.id
  );

  if (!Number.isFinite(expediente_id)) {
    return null;
  }

  return {
    ...item,
    expediente_id,
  };
}

function normalizeTimelineItem(item) {
  if (!item || typeof item !== "object") {
    return null;
  }

  return {
    ...item,
  };
}


function buildAsignacionPayload(payload) {
  const equipo_id = Number(payload?.equipo_id);
  const paralegal_usuario_id = Number(
    payload?.paralegal_usuario_id
  );
  const asignador_usuario_id = Number(
    payload?.asignador_usuario_id
  );

  if (!Number.isFinite(equipo_id)) {
    throw new Error("equipo_id es obligatorio.");
  }

  if (!Number.isFinite(paralegal_usuario_id)) {
    throw new Error(
      "paralegal_usuario_id es obligatorio."
    );
  }

  if (!Number.isFinite(asignador_usuario_id)) {
    throw new Error(
      "asignador_usuario_id es obligatorio."
    );
  }

  return {
    equipo_id,
    paralegal_usuario_id,
    asignador_usuario_id,
    observacion: `${payload?.observacion ?? ""}`.trim(),
  };
}

function buildReasignacionPayload(payload) {
  const nuevo_paralegal_usuario_id = Number(
    payload?.nuevo_paralegal_usuario_id
  );

  const reasignador_usuario_id = Number(
    payload?.reasignador_usuario_id
  );

  if (!Number.isFinite(nuevo_paralegal_usuario_id)) {
    throw new Error(
      "nuevo_paralegal_usuario_id es obligatorio."
    );
  }

  if (!Number.isFinite(reasignador_usuario_id)) {
    throw new Error(
      "reasignador_usuario_id es obligatorio."
    );
  }

  return {
    nuevo_paralegal_usuario_id,
    reasignador_usuario_id,
    motivo: `${payload?.motivo ?? ""}`.trim(),
  };
}

/**
 * Obtiene la bandeja de expedientes pendientes de Quality.
 */
export async function getQualityBandeja() {
  try {
    const response = await fetch(
      `${EXPEDIENTES_API_URL}/quality-bandeja`,
      {
        method: "GET",
        headers: buildHeaders(),
        credentials: "include",
      }
    );

    const data = await parseResponse(
      response,
      "obtener bandeja de Quality"
    );

    return resolveCollection(data)
      .map(normalizeQualityExpediente)
      .filter(Boolean);
  } catch (error) {
    console.error(
      "Error consultando bandeja de Quality",
      error
    );

    return [];
  }
}

/**
 * Obtiene los expedientes ya asignados.
 *
 * Filtros opcionales:
 * - paralegal_id
 * - oficina
 * - tipo_proceso
 */
export async function getExpedientesAsignados({
  paralegal_id,
  oficina,
  tipo_proceso,
} = {}) {
  try {
    const params = new URLSearchParams();

    if (
      paralegal_id != null &&
      `${paralegal_id}`.trim() !== ""
    ) {
      const paralegalId = validateId(
        paralegal_id,
        "paralegal_id"
      );

      params.set(
        "paralegal_id",
        String(paralegalId)
      );
    }

    if (`${oficina ?? ""}`.trim()) {
      params.set(
        "oficina",
        `${oficina}`.trim()
      );
    }

    if (`${tipo_proceso ?? ""}`.trim()) {
      params.set(
        "tipo_proceso",
        `${tipo_proceso}`.trim()
      );
    }

    const query = params.toString();

    const response = await fetch(
      `${EXPEDIENTES_API_URL}/asignados${
        query ? `?${query}` : ""
      }`,
      {
        method: "GET",
        headers: buildHeaders(),
        credentials: "include",
      }
    );

    const data = await parseResponse(
      response,
      "obtener expedientes asignados"
    );

    return resolveCollection(data)
      .map(normalizeExpediente)
      .filter(Boolean);
  } catch (error) {
    console.error(
      "Error consultando expedientes asignados",
      error
    );

    return [];
  }
}

/**
 * Asigna la custodia de un expediente
 * a un equipo y paralegal.
 */
export async function asignarExpediente(id, payload) {
  const expedienteId = validateId(
    id,
    "El ID del expediente"
  );

  try {
    const response = await fetch(
      `${EXPEDIENTES_API_URL}/${expedienteId}/asignar`,
      {
        method: "POST",
        headers: buildHeaders(true),
        body: JSON.stringify(
          buildAsignacionPayload(payload)
        ),
        credentials: "include",
      }
    );

    const data = await parseResponse(
      response,
      "asignar expediente"
    );

    return normalizeExpediente(data?.data ?? data) ?? data;
  } catch (error) {
    console.error(
      "Error asignando expediente",
      error
    );

    throw error;
  }
}

/**
 * Reasigna el Paralegal custodio de un expediente.
 */
export async function reasignarParalegal(id, payload) {
  const expedienteId = validateId(
    id,
    "El ID del expediente"
  );

  try {
    const response = await fetch(
      `${EXPEDIENTES_API_URL}/${expedienteId}/reasignar-paralegal`,
      {
        method: "POST",
        headers: buildHeaders(true),
        body: JSON.stringify(
          buildReasignacionPayload(payload)
        ),
        credentials: "include",
      }
    );

    const data = await parseResponse(
      response,
      "reasignar paralegal del expediente"
    );

    return normalizeExpediente(data?.data ?? data) ?? data;
  } catch (error) {
    console.error(
      "Error reasignando paralegal del expediente",
      error
    );

    throw error;
  }
}

/**
 * Obtiene el detalle de un expediente.
 */
export async function getExpedienteById(id) {
  let expedienteId;

  try {
    expedienteId = validateId(
      id,
      "El ID del expediente"
    );
  } catch {
    return null;
  }

  try {
    const response = await fetch(
      `${EXPEDIENTES_API_URL}/${expedienteId}`,
      {
        method: "GET",
        headers: buildHeaders(),
        credentials: "include",
      }
    );

    const data = await parseResponse(
      response,
      "obtener expediente"
    );

    return normalizeExpediente(data?.data ?? data);
  } catch (error) {
    console.error(
      "Error consultando expediente",
      error
    );

    return null;
  }
}

/**
 * Obtiene la linea de tiempo de un expediente.
 */
export async function getExpedienteHistorial(id) {
  let expedienteId;

  try {
    expedienteId = validateId(
      id,
      "El ID del expediente"
    );
  } catch {
    return [];
  }

  try {
    const response = await fetch(
      `${EXPEDIENTES_API_URL}/${expedienteId}/historial`,
      {
        method: "GET",
        headers: buildHeaders(),
        credentials: "include",
      }
    );

    const data = await parseResponse(
      response,
      "obtener historial del expediente"
    );

    return resolveCollection(data)
      .map(normalizeTimelineItem)
      .filter(Boolean);
  } catch (error) {
    console.error(
      "Error consultando historial del expediente",
      error
    );

    return [];
  }
}

/**
 * Obtiene el listado dinámico de documentos de un expediente.
 */
export async function getExpedienteDocumentos(id) {
  let expedienteId;

  try {
    expedienteId = validateId(
      id,
      "El ID del expediente"
    );
  } catch {
    return null;
  }

  try {
    const response = await fetch(
      `${EXPEDIENTES_API_URL}/${expedienteId}/documentos`,
      {
        method: "GET",
        headers: buildHeaders(),
        credentials: "include",
      }
    );

    const data = await parseResponse(
      response,
      "obtener documentos del expediente"
    );

    return data?.data ?? data;
  } catch (error) {
    console.error(
      "Error consultando documentos del expediente",
      error
    );

    return null;
  }
}

export async function createExpedienteDocumento(id, payload) {
  const expedienteId = validateId(
    id,
    "El ID del expediente"
  );

  try {
    const response = await fetch(
      `${EXPEDIENTES_API_URL}/${expedienteId}/documentos`,
      {
        method: "POST",
        headers: buildHeaders(true),
        body: JSON.stringify(payload),
        credentials: "include",
      }
    );

    return await parseResponse(
      response,
      "agregar documento personalizado al expediente"
    );
  } catch (error) {
    console.error(
      "Error agregando documento personalizado al expediente",
      error
    );

    throw error;
  }
}

export async function deleteExpedienteDocumento(id, docId) {
  const expedienteId = validateId(
    id,
    "El ID del expediente"
  );
  const documentoId = validateId(
    docId,
    "El ID del documento"
  );

  try {
    const response = await fetch(
      `${EXPEDIENTES_API_URL}/${expedienteId}/documentos/${documentoId}`,
      {
        method: "DELETE",
        headers: buildHeaders(),
        credentials: "include",
      }
    );

    return await parseResponse(
      response,
      "eliminar documento del expediente"
    );
  } catch (error) {
    console.error(
      "Error eliminando documento del expediente",
      error
    );

    throw error;
  }
}

export { EXPEDIENTES_API_URL };
