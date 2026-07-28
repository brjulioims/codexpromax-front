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
      `Error al ${actionLabel}: ${response.status}${detail ? ` - ${detail}` : ""}`
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
  const id = item?.id;
  const nombre = `${item?.nombre ?? ""}`.trim();
  const clave = `${item?.clave ?? item?.codigo ?? ""}`.trim();
  const descripcion = `${item?.descripcion ?? ""}`.trim();
  const section = `${item?.section ?? ""}`.trim();
  const parent_id = item?.parent_id ?? item?.parentId ?? null;
  const orden = item?.orden ?? item?.order ?? null;

  if (id == null || !nombre) return null;

  return {
    id: Number(id),
    nombre,
    clave,
    codigo: clave,
    descripcion,
    section,
    parent_id: parent_id == null ? null : Number(parent_id),
    orden: orden == null ? null : Number(orden),
  };
}

function buildPermisoPayload(payload) {
  const clave = `${payload?.clave ?? payload?.codigo ?? ""}`.trim();

  return {
    nombre: `${payload?.nombre ?? ""}`.trim(),
    clave,
    codigo: clave,
    descripcion: `${payload?.descripcion ?? ""}`.trim(),
    section: `${payload?.section ?? ""}`.trim(),
    ...(payload?.parent_id != null ? { parent_id: Number(payload.parent_id) } : {}),
    ...(payload?.orden != null ? { orden: Number(payload.orden) } : {}),
  };
}

function buildRolPermisoPayload(payload) {
  const rol_id = Number(payload?.rol_id);
  const permiso_id = Number(payload?.permiso_id);

  if (!Number.isFinite(rol_id) || !Number.isFinite(permiso_id)) {
    throw new Error("rol_id y permiso_id son obligatorios.");
  }

  return {
    rol_id,
    permiso_id,
    valor: Boolean(payload?.valor),
  };
}

function shouldTryNextRolPermisoRoute(error) {
  const message = `${error?.message ?? ""}`;
  return /:\s(400|404|405)\b/.test(message);
}

export async function getPermisos() {
  try {
    const response = await fetch(PERMISOS_API_URL, {
      method: "GET",
      headers: buildHeaders(),
      credentials: "include",
    });

    const data = await parseResponse(response, "obtener permisos");

    return resolveCollection(data).map(normalizePermiso).filter(Boolean);
  } catch (error) {
    if (/:\s502\b/.test(`${error?.message ?? ""}`)) {
      return [];
    }
    console.error("Error consultando permisos", error);
    return [];
  }
}

export async function getPermisoById(id) {
  try {
    const response = await fetch(`${PERMISOS_API_URL}/${id}`, {
      method: "GET",
      headers: buildHeaders(),
      credentials: "include",
    });

    const data = await parseResponse(response, "obtener permiso");

    return normalizePermiso(data?.data ?? data);
  } catch (error) {
    console.error("Error consultando permiso", error);
    return null;
  }
}

export async function createPermiso(payload) {
  try {
    const response = await fetch(PERMISOS_API_URL, {
      method: "POST",
      headers: buildHeaders(true),
      body: JSON.stringify(buildPermisoPayload(payload)),
      credentials: "include",
    });

    const data = await parseResponse(response, "crear permiso");

    return normalizePermiso(data?.data ?? data);
  } catch (error) {
    console.error("Error creando permiso", error);
    throw error;
  }
}

export async function updatePermiso(id, payload) {
  try {
    const response = await fetch(`${PERMISOS_API_URL}/${id}`, {
      method: "PUT",
      headers: buildHeaders(true),
      body: JSON.stringify(buildPermisoPayload(payload)),
      credentials: "include",
    });

    const data = await parseResponse(response, "editar permiso");

    return normalizePermiso(data?.data ?? data);
  } catch (error) {
    console.error("Error editando permiso", error);
    throw error;
  }
}

export async function saveRolPermiso(payload) {
  const normalizedPayload = buildRolPermisoPayload(payload);
  const requestVariants = [
    {
      url: `/api/roles/${normalizedPayload.rol_id}/permisos`,
      method: "POST",
      body: JSON.stringify({
        permiso_id: normalizedPayload.permiso_id,
        valor: normalizedPayload.valor,
      }),
    },
    {
      url: `${PERMISOS_API_URL}/roles`,
      method: "POST",
      body: JSON.stringify(normalizedPayload),
    },
    {
      url: `${PERMISOS_API_URL}/asignar`,
      method: "POST",
      body: JSON.stringify(normalizedPayload),
    },
    {
      url: `${PERMISOS_API_URL}/rol`,
      method: "POST",
      body: JSON.stringify(normalizedPayload),
    },
  ];
  let lastError = null;

  for (const request of requestVariants) {
    try {
      const response = await fetch(request.url, {
        method: request.method,
        headers: buildHeaders(true),
        body: request.body,
        credentials: "include",
      });

      return await parseResponse(response, "guardar permiso del rol");
    } catch (error) {
      lastError = error;

      if (!shouldTryNextRolPermisoRoute(error)) {
        throw error;
      }
    }
  }

  throw (
    lastError ??
    new Error(
      "No se encontro un endpoint valido para guardar el permiso del rol."
    )
  );
}

export async function deletePermiso(id) {
  try {
    const response = await fetch(`${PERMISOS_API_URL}/${id}`, {
      method: "DELETE",
      headers: buildHeaders(),
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(`Error al eliminar permiso: ${response.status}`);
    }

    return true;
  } catch (error) {
    console.error("Error eliminando permiso", error);
    throw error;
  }
}

export { PERMISOS_API_URL };
