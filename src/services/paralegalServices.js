const PARALEGAL_API_URL = "/api/paralegal";

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

function buildChecklistPayload(payload) {
  const usuario_id = Number(payload?.usuario_id);
  if (!Number.isFinite(usuario_id)) {
    throw new Error("usuario_id es obligatorio.");
  }

  return {
    estado_diligenciamiento:
      `${payload?.estado_diligenciamiento ?? payload?.estado ?? ""}`.trim() ||
      undefined,
    observaciones: `${payload?.observaciones ?? ""}`.trim() || undefined,
    requiere_traduccion:
      payload?.requiere_traduccion == null
        ? undefined
        : Boolean(payload.requiere_traduccion),
    usuario_id,
  };
}

function buildChecklistCreatePayload(payload) {
  const usuario_id = Number(payload?.usuario_id);

  if (!Number.isFinite(usuario_id)) {
    throw new Error("usuario_id es obligatorio.");
  }

  return {
    catalogo_documento_id:
      payload?.plantilla_checklist_id == null ||
      `${payload.plantilla_checklist_id}`.trim() === ""
        ? null
        : Number(payload.plantilla_checklist_id),
    requiere_traduccion: Boolean(payload?.requiere_traduccion),
    observaciones: `${payload?.observaciones ?? ""}`.trim(),
    usuario_id,
  };
}

function buildRedaccionPayload(payload) {
  const usuario_id = Number(payload?.usuario_id);

  if (!Number.isFinite(usuario_id)) {
    throw new Error("usuario_id es obligatorio.");
  }

  return {
    origen_solicitud: `${payload?.origen_solicitud ?? payload?.origen ?? "SOLICITUD_GENERAL"}`.trim(),
    es_urgente: payload?.es_urgente == null ? false : Boolean(payload.es_urgente),
    observaciones: `${payload?.observaciones ?? ""}`.trim(),
    usuario_id,
  };
}

function buildTraduccionPayload(payload) {
  const usuario_id = Number(payload?.usuario_id);
  if (!Number.isFinite(usuario_id)) {
    throw new Error("usuario_id es obligatorio.");
  }
  const checklist_item_id = payload?.checklist_item_id
    ? Number(payload.checklist_item_id)
    : null;

  return {
    tipo_solicitud: `${payload?.tipo_solicitud ?? ""}`.trim() || undefined,
    prioridad: `${payload?.prioridad ?? ""}`.trim() || undefined,
    archivo_original_url:
      `${payload?.archivo_original_url ?? ""}`.trim() || undefined,
    observaciones:
      `${payload?.observaciones ?? ""}`.trim() || undefined,
    ...(checklist_item_id ? { checklist_item_id } : {}),
    usuario_id,
  };
}

function buildNotaPayload(payload) {
  const usuario_id = Number(payload?.usuario_id);

  if (!Number.isFinite(usuario_id)) {
    throw new Error("usuario_id es obligatorio.");
  }

  return {
    contenido: `${payload?.contenido ?? ""}`.trim(),
    usuario_id,
    menciones: Array.isArray(payload?.menciones)
      ? payload.menciones
          .map((item) => `${item ?? ""}`.trim())
          .filter(Boolean)
      : [],
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

function buildSuspensionPayload(payload) {
  const usuario_id = Number(payload?.usuario_id);

  if (!Number.isFinite(usuario_id)) {
    throw new Error("usuario_id es obligatorio.");
  }

  return {
    motivo: `${payload?.motivo ?? ""}`.trim(),
    usuario_id,
  };
}

/**
 * HU-01
 * Obtiene el tablero personal del paralegal.
 */
export async function getParalegalTablero({
  usuario_id,
  sub_estado,
  prioridad,
} = {}) {
  const usuarioId = validateId(usuario_id, "usuario_id");

  try {
    const params = new URLSearchParams({
      usuario_id: String(usuarioId),
    });

    if (`${sub_estado ?? ""}`.trim()) {
      params.set("sub_estado", `${sub_estado}`.trim());
    }

    if (`${prioridad ?? ""}`.trim()) {
      params.set("prioridad", `${prioridad}`.trim());
    }

    const response = await fetch(
      `${PARALEGAL_API_URL}/tablero?${params.toString()}`,
      {
        method: "GET",
        headers: buildHeaders(),
        credentials: "include",
      }
    );

    const data = await parseResponse(
      response,
      "obtener tablero del paralegal"
    );

    return resolveCollection(data);
  } catch (error) {
    console.error("Error consultando tablero del paralegal", error);
    return [];
  }
}

/**
 * HU-02
 * Obtiene el checklist dinámico de un expediente.
 */
export async function getExpedienteChecklist(id) {
  const expedienteId = validateId(id, "El ID del expediente");

  try {
    const response = await fetch(
      `${PARALEGAL_API_URL}/expedientes/${expedienteId}/checklist`,
      {
        method: "GET",
        headers: buildHeaders(),
        credentials: "include",
      }
    );

    const data = await parseResponse(
      response,
      "obtener checklist del expediente"
    );

    return resolveCollection(data);
  } catch (error) {
    console.error("Error consultando checklist del expediente", error);
    return [];
  }
}
/**
 * HU-02
 * Actualiza el estado de un item del checklist.
 */
export async function updateChecklistItem(expedienteId, itemId, payload) {
  const validatedExpedienteId = validateId(
    expedienteId,
    "El ID del expediente"
  );
  const checklistItemId = validateId(itemId, "El ID del item del checklist");

  try {
    const response = await fetch(
      `/api/expedientes/${validatedExpedienteId}/documentos/${checklistItemId}`,
      {
        method: "PATCH",
        headers: buildHeaders(true),
        body: JSON.stringify(buildChecklistPayload(payload)),
        credentials: "include",
      }
    );

    return await parseResponse(
      response,
      "actualizar item del checklist"
    );
  } catch (error) {
    console.error("Error actualizando item del checklist", error);
    throw error;
  }
}

/**
 * HU-02
 * Crea un item del checklist para un expediente.
 */
export async function createChecklistItem(expedienteId, payload) {
  const validatedExpedienteId = validateId(
    expedienteId,
    "El ID del expediente"
  );

  try {
    const response = await fetch(
      `/api/expedientes/${validatedExpedienteId}/documentos/desde-catalogo`,
      {
        method: "POST",
        headers: buildHeaders(true),
        body: JSON.stringify(buildChecklistCreatePayload(payload)),
        credentials: "include",
      }
    );

    return await parseResponse(
      response,
      "agregar documento del catalogo al expediente"
    );
  } catch (error) {
    console.error(
      "Error agregando documento del catalogo al expediente",
      error
    );
    throw error;
  }
}

/**
 * Solicita ticket para Redaccion de Declaraciones.
 */
export async function solicitarRedaccion(id, payload) {
  const expedienteId = validateId(id, "El ID del expediente");

  try {
    const response = await fetch(
      `/api/expedientes/${expedienteId}/redaccion/solicitar`,
      {
        method: "POST",
        headers: buildHeaders(true),
        body: JSON.stringify(buildRedaccionPayload(payload)),
        credentials: "include",
      }
    );

    return await parseResponse(
      response,
      "solicitar ticket de redaccion"
    );
  } catch (error) {
    console.error("Error solicitando ticket de redaccion", error);
    throw error;
  }
}

/**
 * HU-03
 * Solicita ticket para Traduccion.
 */
export async function solicitarTraduccion(id, payload) {
  const expedienteId = validateId(id, "El ID del expediente");

  try {
    const response = await fetch(
      `${PARALEGAL_API_URL}/expedientes/${expedienteId}/traduccion`,
      {
        method: "POST",
        headers: buildHeaders(true),
        body: JSON.stringify(buildTraduccionPayload(payload)),
        credentials: "include",
      }
    );

    return await parseResponse(
      response,
      "solicitar ticket de traduccion"
    );
  } catch (error) {
    console.error("Error solicitando ticket de traduccion", error);
    throw error;
  }
}

/**
 * HU-03-bis
 * Solicita ticket de Traduccion para un item especifico del checklist.
 */
export async function solicitarTraduccionChecklistItem(
  expedienteId,
  itemId,
  payload
) {
  const expId = validateId(expedienteId, "El ID del expediente");
  const chkId = validateId(itemId, "El ID del item del checklist");
  const usuario_id = Number(payload?.usuario_id);

  if (!Number.isFinite(usuario_id)) {
    throw new Error("usuario_id es obligatorio.");
  }

  try {
    const response = await fetch(
      `/api/expedientes/${expId}/documentos/${chkId}/solicitar-traduccion`,
      {
        method: "POST",
        headers: buildHeaders(true),
        body: JSON.stringify({
          usuario_id,
          observaciones: `${payload?.observaciones ?? ""}`.trim() || undefined,
        }),
        credentials: "include",
      }
    );

    return await parseResponse(
      response,
      "solicitar traduccion de item del checklist"
    );
  } catch (error) {
    console.error(
      "Error solicitando traduccion para item del checklist",
      error
    );
    throw error;
  }
}

/**
 * HU-04
 * Registra una nota interna o gestion en el expediente.
 */
export async function crearNotaExpediente(id, payload) {
  const expedienteId = validateId(id, "El ID del expediente");

  try {
    const response = await fetch(
      `${PARALEGAL_API_URL}/expedientes/${expedienteId}/notas`,
      {
        method: "POST",
        headers: buildHeaders(true),
        body: JSON.stringify(buildNotaPayload(payload)),
        credentials: "include",
      }
    );

    return await parseResponse(
      response,
      "registrar nota del expediente"
    );
  } catch (error) {
    console.error("Error registrando nota del expediente", error);
    throw error;
  }
}

/**
 * HU-05
 * Solicita pase del expediente a Revision y Ensamble.
 */
export async function solicitarEnsamble(id, payload) {
  const expedienteId = validateId(id, "El ID del expediente");

  try {
    const response = await fetch(
      `${PARALEGAL_API_URL}/expedientes/${expedienteId}/solicitar-ensamble`,
      {
        method: "POST",
        headers: buildHeaders(true),
        body: JSON.stringify(buildUsuarioPayload(payload)),
        credentials: "include",
      }
    );

    return await parseResponse(
      response,
      "solicitar pase a ensamble"
    );
  } catch (error) {
    console.error("Error solicitando pase a ensamble", error);
    throw error;
  }
}

/**
 * HU-06
 * Suspende el seguimiento de un expediente.
 */
export async function suspenderExpediente(id, payload) {
  const expedienteId = validateId(id, "El ID del expediente");

  try {
    const response = await fetch(
      `${PARALEGAL_API_URL}/expedientes/${expedienteId}/suspender`,
      {
        method: "POST",
        headers: buildHeaders(true),
        body: JSON.stringify(buildSuspensionPayload(payload)),
        credentials: "include",
      }
    );

    return await parseResponse(
      response,
      "suspender expediente"
    );
  } catch (error) {
    console.error("Error suspendiendo expediente", error);
    throw error;
  }
}

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

    return await parseResponse(
      response,
      "completar traducción del documento"
    );
  } catch (error) {
    console.error("Error completando traducción del documento", error);
    throw error;
  }
}

export { PARALEGAL_API_URL };
