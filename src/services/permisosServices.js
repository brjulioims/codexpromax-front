const PERMISOS_API_URL = "/api/permisos";

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
  if (Array.isArray(data?.permisos)) return data.permisos;

  return [];
}

function normalizePermiso(item) {
  const id = Number(item?.id);
  const nombre = `${item?.nombre ?? ""}`.trim();
  const modulo = `${item?.modulo ?? ""}`.trim();
  const descripcion = `${item?.descripcion ?? ""}`.trim();

  if (!Number.isFinite(id) || !nombre) {
    return null;
  }

  return {
    id,
    nombre,
    modulo,
    descripcion,
  };
}

function buildPermisoPayload(payload) {
  return {
    nombre: `${payload?.nombre ?? ""}`.trim(),
    modulo: `${payload?.modulo ?? ""}`.trim(),
    descripcion: `${payload?.descripcion ?? ""}`.trim(),
  };
}

function validatePermisoPayload(payload) {
  const normalizedPayload = buildPermisoPayload(payload);

  if (!normalizedPayload.nombre) {
    throw new Error("El nombre del permiso es obligatorio.");
  }

  if (!normalizedPayload.modulo) {
    throw new Error("El modulo del permiso es obligatorio.");
  }

  return normalizedPayload;
}

/**
 * Lista todos los permisos.
 *
 * El backend puede devolverlos agrupados por modulo,
 * pero el endpoint actualmente muestra una coleccion plana.
 */
export async function getPermisos() {
  try {
    const response = await fetch(PERMISOS_API_URL, {
      method: "GET",
      headers: buildHeaders(),
      credentials: "include",
    });

    const data = await parseResponse(
      response,
      "obtener permisos"
    );

    return resolveCollection(data)
      .map(normalizePermiso)
      .filter(Boolean);
  } catch (error) {
    console.error("Error consultando permisos", error);
    return [];
  }
}

/**
 * Crea un permiso.
 */
export async function createPermiso(payload) {
  try {
    const normalizedPayload = validatePermisoPayload(payload);

    const response = await fetch(PERMISOS_API_URL, {
      method: "POST",
      headers: buildHeaders(true),
      body: JSON.stringify(normalizedPayload),
      credentials: "include",
    });

    const data = await parseResponse(
      response,
      "crear permiso"
    );

    return normalizePermiso(data?.data ?? data) ?? data;
  } catch (error) {
    console.error("Error creando permiso", error);
    throw error;
  }
}

/**
 * Actualiza un permiso existente.
 */
export async function updatePermiso(id, payload) {
  const permisoId = Number(id);

  if (!Number.isFinite(permisoId)) {
    throw new Error("El ID del permiso es obligatorio.");
  }

  try {
    const normalizedPayload = validatePermisoPayload(payload);

    const response = await fetch(
      `${PERMISOS_API_URL}/${permisoId}`,
      {
        method: "PUT",
        headers: buildHeaders(true),
        body: JSON.stringify(normalizedPayload),
        credentials: "include",
      }
    );

    const data = await parseResponse(
      response,
      "actualizar permiso"
    );

    return normalizePermiso(data?.data ?? data) ?? data;
  } catch (error) {
    console.error("Error actualizando permiso", error);
    throw error;
  }
}

/**
 * Elimina un permiso.
 */
export async function deletePermiso(id) {
  const permisoId = Number(id);

  if (!Number.isFinite(permisoId)) {
    throw new Error("El ID del permiso es obligatorio.");
  }

  try {
    const response = await fetch(
      `${PERMISOS_API_URL}/${permisoId}`,
      {
        method: "DELETE",
        headers: buildHeaders(),
        credentials: "include",
      }
    );

    return await parseResponse(
      response,
      "eliminar permiso"
    );
  } catch (error) {
    console.error("Error eliminando permiso", error);
    throw error;
  }
}

export async function saveRolPermiso(payload) {
  const rolId = Number(payload?.rol_id);
  const permisoId = Number(payload?.permiso_id);

  if (!Number.isFinite(rolId)) {
    throw new Error("El ID del rol es obligatorio.");
  }

  if (!Number.isFinite(permisoId)) {
    throw new Error("El ID del permiso es obligatorio.");
  }

  try {
    const response = await fetch(`${PERMISOS_API_URL}/rol`, {
      method: "POST",
      headers: buildHeaders(true),
      body: JSON.stringify({
        rol_id: rolId,
        permiso_id: permisoId,
        valor: Boolean(payload?.valor),
      }),
      credentials: "include",
    });

    return await parseResponse(response, "guardar permiso del rol");
  } catch (error) {
    console.error("Error guardando permiso del rol", error);
    throw error;
  }
}

export { PERMISOS_API_URL };
