const QUALITY_API_URL = "/api/quality";

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
  if (Array.isArray(data?.tickets)) return data.tickets;
  if (Array.isArray(data?.bandeja)) return data.bandeja;

  return [];
}

function validateId(value, label = "El ID") {
  const id = Number(value);

  if (!Number.isFinite(id)) {
    throw new Error(`${label} es obligatorio.`);
  }

  return id;
}

function normalizeExpedienteIngesta(item) {
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
      item?.cliente_id == null
        ? null
        : Number(item.cliente_id),

    contia_id:
      item?.contia_id == null
        ? null
        : Number(item.contia_id),

    codigo_cliente: `${item?.codigo_cliente ?? ""}`.trim(),
    cliente_nombre: `${item?.cliente_nombre ?? ""}`.trim(),
    pais_origen: `${item?.pais_origen ?? ""}`.trim(),
    oficina: `${item?.oficina ?? ""}`.trim(),
    fecha_primer_pago: item?.fecha_primer_pago ?? null,
    estado_cliente: `${item?.estado_cliente ?? ""}`.trim(),
  };
}

function normalizeTicket(item) {
  if (!item || typeof item !== "object") {
    return null;
  }

  return {
    ...item,
  };
}

function buildAuditoriaPayload(payload) {
  const quality_usuario_id = Number(payload?.quality_usuario_id);

  if (!Number.isFinite(quality_usuario_id)) {
    throw new Error("quality_usuario_id es obligatorio.");
  }

  if (typeof payload?.aprobado !== "boolean") {
    throw new Error("aprobado debe ser true o false.");
  }

  return {
    aprobado: payload.aprobado,
    observaciones: `${payload?.observaciones ?? ""}`.trim(),
    quality_usuario_id,
  };
}

/**
 * Rol 01
 * Bandeja de Ingesta y Asignacion de Casos.
 */
export async function getQualityIngestaBandeja() {
  try {
    const response = await fetch(
      `${QUALITY_API_URL}/ingesta/bandeja`,
      {
        method: "GET",
        headers: buildHeaders(),
        credentials: "include",
      }
    );

    const data = await parseResponse(
      response,
      "obtener bandeja de ingesta de Quality"
    );

    return resolveCollection(data)
      .map(normalizeExpedienteIngesta)
      .filter(Boolean);
  } catch (error) {
    console.error(
      "Error consultando bandeja de ingesta de Quality",
      error
    );

    return [];
  }
}

/**
 * Rol 05
 * Bandeja de auditoria de borradores de redaccion.
 */
export async function getQualityRedaccionBandeja() {
  try {
    const response = await fetch(
      `${QUALITY_API_URL}/redaccion/bandeja`,
      {
        method: "GET",
        headers: buildHeaders(),
        credentials: "include",
      }
    );

    const data = await parseResponse(
      response,
      "obtener bandeja de redaccion de Quality"
    );

    return resolveCollection(data)
      .map(normalizeTicket)
      .filter(Boolean);
  } catch (error) {
    console.error(
      "Error consultando bandeja de redaccion de Quality",
      error
    );

    return [];
  }
}

/**
 * Rol 05
 * Audita un borrador de declaracion en espanol.
 */
export async function auditarTicketRedaccion(id, payload) {
  const ticketId = validateId(
    id,
    "El ID del ticket de redaccion"
  );

  try {
    const response = await fetch(
      `${QUALITY_API_URL}/redaccion/tickets/${ticketId}/auditar`,
      {
        method: "POST",
        headers: buildHeaders(true),
        body: JSON.stringify(
          buildAuditoriaPayload(payload)
        ),
        credentials: "include",
      }
    );

    return await parseResponse(
      response,
      "auditar ticket de redaccion"
    );
  } catch (error) {
    console.error(
      "Error auditando ticket de redaccion",
      error
    );

    throw error;
  }
}

/**
 * Rol 07
 * Bandeja de auditoria de traducciones.
 */
export async function getQualityTraduccionBandeja() {
  try {
    const response = await fetch(
      `${QUALITY_API_URL}/traduccion/bandeja`,
      {
        method: "GET",
        headers: buildHeaders(),
        credentials: "include",
      }
    );

    const data = await parseResponse(
      response,
      "obtener bandeja de traduccion de Quality"
    );

    return resolveCollection(data)
      .map(normalizeTicket)
      .filter(Boolean);
  } catch (error) {
    console.error(
      "Error consultando bandeja de traduccion de Quality",
      error
    );

    return [];
  }
}

/**
 * Rol 07
 * Audita una traduccion al ingles.
 */
export async function auditarTicketTraduccion(id, payload) {
  const ticketId = validateId(
    id,
    "El ID del ticket de traduccion"
  );

  try {
    const response = await fetch(
      `${QUALITY_API_URL}/traduccion/tickets/${ticketId}/auditar`,
      {
        method: "POST",
        headers: buildHeaders(true),
        body: JSON.stringify(
          buildAuditoriaPayload(payload)
        ),
        credentials: "include",
      }
    );

    return await parseResponse(
      response,
      "auditar ticket de traduccion"
    );
  } catch (error) {
    console.error(
      "Error auditando ticket de traduccion",
      error
    );

    throw error;
  }
}

export { QUALITY_API_URL };