const REDACCION_API_URL = "/api/redaccion";

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
  if (Array.isArray(data?.tickets)) return data.tickets;

  return [];
}

function validateId(value, label = "El ID") {
  const id = Number(value);

  if (!Number.isFinite(id)) {
    throw new Error(`${label} es obligatorio.`);
  }

  return id;
}

function normalizeTicket(item) {
  if (!item || typeof item !== "object") {
    return null;
  }

  return {
    ...item,
  };
}

function buildTomarTicketPayload(payload) {
  const redactor_id = Number(payload?.redactor_id);

  if (!Number.isFinite(redactor_id)) {
    throw new Error("redactor_id es obligatorio.");
  }

  return {
    redactor_id,
  };
}

function buildLlamadaPayload(payload) {
  const usuario_id = Number(payload?.usuario_id);
  const duracion_minutos = Number(payload?.duracion_minutos);

  if (!Number.isFinite(usuario_id)) {
    throw new Error("usuario_id es obligatorio.");
  }

  if (!Number.isFinite(duracion_minutos)) {
    throw new Error("duracion_minutos es obligatorio.");
  }

  return {
    resultado: `${payload?.resultado ?? ""}`.trim(),
    duracion_minutos,
    notas: `${payload?.notas ?? ""}`.trim(),
    usuario_id,
  };
}

function buildEnviarQualityPayload(payload) {
  const usuario_id = Number(payload?.usuario_id);

  if (!Number.isFinite(usuario_id)) {
    throw new Error("usuario_id es obligatorio.");
  }

  return {
    borrador_texto: `${payload?.borrador_texto ?? ""}`.trim(),
    archivo_borrador_url: `${payload?.archivo_borrador_url ?? ""}`.trim(),
    usuario_id,
  };
}

function buildAuditoriaQualityPayload(payload) {
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

function buildUsuarioPayload(payload) {
  const usuario_id = Number(payload?.usuario_id);

  if (!Number.isFinite(usuario_id)) {
    throw new Error("usuario_id es obligatorio.");
  }

  return {
    usuario_id,
  };
}

/**
 * HU-01
 * Obtiene la cola o bandeja de tickets de redaccion.
 *
 * Filtros opcionales:
 * - estado
 * - redactor_id
 */
export async function getRedaccionTickets({
  estado,
  redactor_id,
} = {}) {
  try {
    const params = new URLSearchParams();

    if (`${estado ?? ""}`.trim()) {
      params.set("estado", `${estado}`.trim());
    }

    if (redactor_id != null && `${redactor_id}`.trim() !== "") {
      const redactorId = validateId(
        redactor_id,
        "redactor_id"
      );

      params.set("redactor_id", String(redactorId));
    }

    const query = params.toString();

    const response = await fetch(
      `${REDACCION_API_URL}/tickets${query ? `?${query}` : ""}`,
      {
        method: "GET",
        headers: buildHeaders(),
        credentials: "include",
      }
    );

    const data = await parseResponse(
      response,
      "obtener tickets de redaccion"
    );

    return resolveCollection(data)
      .map(normalizeTicket)
      .filter(Boolean);
  } catch (error) {
    console.error(
      "Error consultando tickets de redaccion",
      error
    );

    return [];
  }
}

/**
 * HU-01
 * Asigna o toma custodia de un ticket de redaccion.
 */
export async function tomarTicketRedaccion(id, payload) {
  const ticketId = validateId(
    id,
    "El ID del ticket"
  );

  try {
    const response = await fetch(
      `${REDACCION_API_URL}/tickets/${ticketId}/tomar`,
      {
        method: "POST",
        headers: buildHeaders(true),
        body: JSON.stringify(
          buildTomarTicketPayload(payload)
        ),
        credentials: "include",
      }
    );

    return await parseResponse(
      response,
      "tomar ticket de redaccion"
    );
  } catch (error) {
    console.error(
      "Error tomando ticket de redaccion",
      error
    );

    throw error;
  }
}

/**
 * HU-02
 * Registra una llamada de entrevista o inasistencia.
 */
export async function registrarLlamadaRedaccion(id, payload) {
  const ticketId = validateId(
    id,
    "El ID del ticket"
  );

  try {
    const response = await fetch(
      `${REDACCION_API_URL}/tickets/${ticketId}/llamadas`,
      {
        method: "POST",
        headers: buildHeaders(true),
        body: JSON.stringify(
          buildLlamadaPayload(payload)
        ),
        credentials: "include",
      }
    );

    return await parseResponse(
      response,
      "registrar llamada de redaccion"
    );
  } catch (error) {
    console.error(
      "Error registrando llamada de redaccion",
      error
    );

    throw error;
  }
}

/**
 * HU-03
 * Carga el borrador y envia el ticket a Quality.
 */
export async function enviarRedaccionQuality(id, payload) {
  const ticketId = validateId(
    id,
    "El ID del ticket"
  );

  try {
    const response = await fetch(
      `${REDACCION_API_URL}/tickets/${ticketId}/enviar-quality`,
      {
        method: "POST",
        headers: buildHeaders(true),
        body: JSON.stringify(
          buildEnviarQualityPayload(payload)
        ),
        credentials: "include",
      }
    );

    return await parseResponse(
      response,
      "enviar borrador a Quality"
    );
  } catch (error) {
    console.error(
      "Error enviando borrador a Quality",
      error
    );

    throw error;
  }
}

/**
 * HU-04
 * Registra auditoria tecnica de Quality sobre redaccion.
 */
export async function auditarQualityRedaccion(id, payload) {
  const ticketId = validateId(
    id,
    "El ID del ticket"
  );

  try {
    const response = await fetch(
      `${REDACCION_API_URL}/tickets/${ticketId}/auditar-quality`,
      {
        method: "POST",
        headers: buildHeaders(true),
        body: JSON.stringify(
          buildAuditoriaQualityPayload(payload)
        ),
        credentials: "include",
      }
    );

    return await parseResponse(
      response,
      "auditar redaccion en Quality"
    );
  } catch (error) {
    console.error(
      "Error auditando redaccion en Quality",
      error
    );

    throw error;
  }
}

/**
 * HU-05
 * Registra la aprobacion del cliente y genera
 * el pase automatico a Traducciones.
 */
export async function aprobarRedaccionCliente(id, payload) {
  const ticketId = validateId(
    id,
    "El ID del ticket"
  );

  try {
    const response = await fetch(
      `${REDACCION_API_URL}/tickets/${ticketId}/aprobar-cliente`,
      {
        method: "POST",
        headers: buildHeaders(true),
        body: JSON.stringify(
          buildUsuarioPayload(payload)
        ),
        credentials: "include",
      }
    );

    return await parseResponse(
      response,
      "aprobar declaracion por el cliente"
    );
  } catch (error) {
    console.error(
      "Error aprobando declaracion por el cliente",
      error
    );

    throw error;
  }
}

export { REDACCION_API_URL };