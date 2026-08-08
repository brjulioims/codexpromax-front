const TRADUCCION_API_URL = "/api/traduccion";

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
  const traductor_id = Number(payload?.traductor_id);

  if (!Number.isFinite(traductor_id)) {
    throw new Error("traductor_id es obligatorio.");
  }

  return {
    traductor_id,
  };
}

function buildStandbyIlegiblePayload(payload) {
  const traductor_id = Number(payload?.traductor_id);
  const motivo = `${payload?.motivo ?? ""}`.trim();

  if (!Number.isFinite(traductor_id)) {
    throw new Error("traductor_id es obligatorio.");
  }

  if (!motivo) {
    throw new Error("motivo es obligatorio.");
  }

  return {
    motivo,
    traductor_id,
  };
}

function buildEnviarQualityPayload(payload) {
  const traductor_id = Number(payload?.traductor_id);
  const archivo_traducido_url = `${
    payload?.archivo_traducido_url ?? ""
  }`.trim();

  if (!Number.isFinite(traductor_id)) {
    throw new Error("traductor_id es obligatorio.");
  }

  if (!archivo_traducido_url) {
    throw new Error("archivo_traducido_url es obligatorio.");
  }

  return {
    archivo_traducido_url,
    traductor_id,
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

/**
 * HU-01
 * Obtiene la cola de tickets del departamento de traduccion.
 *
 * Filtros opcionales:
 * - estado
 * - traductor_id
 */
export async function getTraduccionTickets({
  estado,
  traductor_id,
} = {}) {
  try {
    const params = new URLSearchParams();

    if (`${estado ?? ""}`.trim()) {
      params.set("estado", `${estado}`.trim());
    }

    if (traductor_id != null && `${traductor_id}`.trim() !== "") {
      const traductorId = validateId(
        traductor_id,
        "traductor_id"
      );

      params.set("traductor_id", String(traductorId));
    }

    const query = params.toString();

    const response = await fetch(
      `${TRADUCCION_API_URL}/tickets${query ? `?${query}` : ""}`,
      {
        method: "GET",
        headers: buildHeaders(),
        credentials: "include",
      }
    );

    const data = await parseResponse(
      response,
      "obtener tickets de traduccion"
    );

    return resolveCollection(data)
      .map(normalizeTicket)
      .filter(Boolean);
  } catch (error) {
    console.error(
      "Error consultando tickets de traduccion",
      error
    );

    return [];
  }
}

/**
 * HU-01
 * Asigna o toma custodia de un ticket de traduccion.
 */
export async function tomarTicketTraduccion(id, payload) {
  const ticketId = validateId(
    id,
    "El ID del ticket"
  );

  try {
    const response = await fetch(
      `${TRADUCCION_API_URL}/tickets/${ticketId}/tomar`,
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
      "tomar ticket de traduccion"
    );
  } catch (error) {
    console.error(
      "Error tomando ticket de traduccion",
      error
    );

    throw error;
  }
}

/**
 * HU-02
 * Marca el ticket como StandBy por documento ilegible.
 */
export async function reportarTraduccionIlegible(id, payload) {
  const ticketId = validateId(
    id,
    "El ID del ticket"
  );

  try {
    const response = await fetch(
      `${TRADUCCION_API_URL}/tickets/${ticketId}/standby-ilegible`,
      {
        method: "POST",
        headers: buildHeaders(true),
        body: JSON.stringify(
          buildStandbyIlegiblePayload(payload)
        ),
        credentials: "include",
      }
    );

    return await parseResponse(
      response,
      "reportar documento ilegible"
    );
  } catch (error) {
    console.error(
      "Error reportando documento ilegible",
      error
    );

    throw error;
  }
}

/**
 * HU-03
 * Carga la traduccion terminada y la envia a Quality.
 */
export async function enviarTraduccionQuality(id, payload) {
  const ticketId = validateId(
    id,
    "El ID del ticket"
  );

  try {
    const response = await fetch(
      `${TRADUCCION_API_URL}/tickets/${ticketId}/enviar-quality`,
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
      "enviar traduccion a Quality"
    );
  } catch (error) {
    console.error(
      "Error enviando traduccion a Quality",
      error
    );

    throw error;
  }
}

/**
 * HU-04
 * Registra el dictamen de Quality sobre una traduccion.
 */
export async function auditarQualityTraduccion(id, payload) {
  const ticketId = validateId(
    id,
    "El ID del ticket"
  );

  try {
    const response = await fetch(
      `${TRADUCCION_API_URL}/tickets/${ticketId}/auditar-quality`,
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
      "auditar traduccion en Quality"
    );
  } catch (error) {
    console.error(
      "Error auditando traduccion en Quality",
      error
    );

    throw error;
  }
}

export { TRADUCCION_API_URL };