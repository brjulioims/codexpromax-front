const CATALOGO_DOCUMENTOS_API_URL = "/api/catalogo-documentos";

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

  return [];
}

function validateId(value, label = "El ID") {
  const id = Number(value);

  if (!Number.isFinite(id)) {
    throw new Error(`${label} es obligatorio.`);
  }

  return id;
}

export async function getCatalogoDocumentos(filters = {}) {
  try {
    const params = new URLSearchParams();

    if (`${filters?.categoria ?? ""}`.trim()) {
      params.set("categoria", `${filters.categoria}`.trim());
    }

    if (`${filters?.tipo_proceso ?? ""}`.trim()) {
      params.set(
        "tipo_proceso",
        `${filters.tipo_proceso}`.trim()
      );
    }

    const query = params.toString();

    const response = await fetch(
      `${CATALOGO_DOCUMENTOS_API_URL}${query ? `?${query}` : ""}`,
      {
        method: "GET",
        headers: buildHeaders(),
        credentials: "include",
      }
    );

    const data = await parseResponse(
      response,
      "obtener catálogo de documentos"
    );

    return resolveCollection(data);
  } catch (error) {
    console.error(
      "Error consultando catálogo de documentos",
      error
    );

    return [];
  }
}

export async function createCatalogoDocumento(payload) {
  try {
    const response = await fetch(
      CATALOGO_DOCUMENTOS_API_URL,
      {
        method: "POST",
        headers: buildHeaders(true),
        body: JSON.stringify(payload),
        credentials: "include",
      }
    );

    return await parseResponse(
      response,
      "crear documento del catálogo"
    );
  } catch (error) {
    console.error(
      "Error creando documento del catálogo",
      error
    );

    throw error;
  }
}

export async function getCatalogoDocumentoById(id) {
  let catalogoDocumentoId;

  try {
    catalogoDocumentoId = validateId(
      id,
      "El ID del documento del catálogo"
    );
  } catch {
    return null;
  }

  try {
    const response = await fetch(
      `${CATALOGO_DOCUMENTOS_API_URL}/${catalogoDocumentoId}`,
      {
        method: "GET",
        headers: buildHeaders(),
        credentials: "include",
      }
    );

    const data = await parseResponse(
      response,
      "obtener documento del catálogo"
    );

    return data?.data ?? data;
  } catch (error) {
    console.error(
      "Error consultando documento del catálogo",
      error
    );

    return null;
  }
}

export async function updateCatalogoDocumento(id, payload) {
  const catalogoDocumentoId = validateId(
    id,
    "El ID del documento del catálogo"
  );

  try {
    const response = await fetch(
      `${CATALOGO_DOCUMENTOS_API_URL}/${catalogoDocumentoId}`,
      {
        method: "PUT",
        headers: buildHeaders(true),
        body: JSON.stringify(payload),
        credentials: "include",
      }
    );

    return await parseResponse(
      response,
      "actualizar documento del catálogo"
    );
  } catch (error) {
    console.error(
      "Error actualizando documento del catálogo",
      error
    );

    throw error;
  }
}

export async function deleteCatalogoDocumento(id) {
  const catalogoDocumentoId = validateId(
    id,
    "El ID del documento del catálogo"
  );

  try {
    const response = await fetch(
      `${CATALOGO_DOCUMENTOS_API_URL}/${catalogoDocumentoId}`,
      {
        method: "DELETE",
        headers: buildHeaders(),
        credentials: "include",
      }
    );

    return await parseResponse(
      response,
      "eliminar documento del catálogo"
    );
  } catch (error) {
    console.error(
      "Error eliminando documento del catálogo",
      error
    );

    throw error;
  }
}

export { CATALOGO_DOCUMENTOS_API_URL };
