const ROLES_API_URL = "/api/roles";

function buildHeaders(includeJson = false) {
  const token = localStorage.getItem("token");
  return {
    accept: "*/*",
    "ngrok-skip-browser-warning": "true",
    Authorization: token ? `Bearer ${token}` : "",
    ...(includeJson ? { "Content-Type": "application/json" } : {}),
  };
}

function normalizeRol(rol) {
  const id = Number(
    rol?.id ?? rol?.rol_id ?? rol?.role_id ?? rol?.idRol ?? rol?.rolId ?? null
  );
  const nombre = rol?.nombre?.trim?.() ?? "";

  if (!Number.isFinite(id) || !nombre) return null;

  return {
    id,
    nombre,
    permisos: Array.isArray(rol?.permisos)
      ? rol.permisos
          .map((permiso) => {
            const permisoId = Number(
              permiso?.id ??
                permiso?.permiso_id ??
                permiso?.permission_id ??
                permiso?.idPermiso ??
                permiso?.permisoId ??
                null
            );
            const permisoNombre = `${permiso?.nombre ?? ""}`.trim();

            if (!Number.isFinite(permisoId) || !permisoNombre) return null;

            return {
              id: permisoId,
              nombre: permisoNombre,
              clave: `${permiso?.clave ?? permiso?.codigo ?? permisoNombre}`.trim(),
              codigo: `${permiso?.codigo ?? permiso?.clave ?? permisoNombre}`.trim(),
              descripcion: `${permiso?.descripcion ?? ""}`.trim(),
              section: `${permiso?.section ?? ""}`.trim(),
              parent_id:
                permiso?.parent_id == null && permiso?.parentId == null
                  ? null
                  : Number(permiso?.parent_id ?? permiso?.parentId),
              orden:
                permiso?.orden == null && permiso?.order == null
                  ? null
                  : Number(permiso?.orden ?? permiso?.order),
              valor: Boolean(permiso?.valor),
            };
          })
          .filter(Boolean)
      : [],
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
  if (Array.isArray(data?.roles)) return data.roles;
  return [];
}

export async function getRoles() {
  try {
    const response = await fetch(ROLES_API_URL, {
      method: "GET",
      headers: buildHeaders(),
      credentials: "include",
    });

    const data = await parseResponse(response, "obtener roles");
    return resolveCollection(data).map(normalizeRol).filter(Boolean);
  } catch (error) {
    if (/:\s502\b/.test(`${error?.message ?? ""}`)) {
      return [];
    }
    console.error("Error consultando roles", error);
    return [];
  }
}

export async function createRol(payload) {
  try {
    const response = await fetch(ROLES_API_URL, {
      method: "POST",
      headers: buildHeaders(true),
      body: JSON.stringify({
        nombre: payload.nombre,
      }),
      credentials: "include",
    });

    const data = await parseResponse(response, "crear rol");
    return normalizeRol(data);
  } catch (error) {
    console.error("Error creando rol", error);
    throw error;
  }
}

export async function updateRol(id, payload) {
  try {
    const response = await fetch(`${ROLES_API_URL}/${id}`, {
      method: "PUT",
      headers: buildHeaders(true),
      body: JSON.stringify({
        nombre: payload.nombre,
      }),
      credentials: "include",
    });

    const data = await parseResponse(response, "editar rol");
    return normalizeRol(data);
  } catch (error) {
    console.error("Error editando rol", error);
    throw error;
  }
}

export async function deleteRol(id) {
  try {
    const roleId = Number(id);
    if (!Number.isFinite(roleId)) {
      throw new Error("ID de rol inválido.");
    }

    const response = await fetch(`${ROLES_API_URL}/${roleId}`, {
      method: "DELETE",
      headers: buildHeaders(),
      credentials: "include",
    });

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
        `Error al eliminar rol: ${response.status}${detail ? ` - ${detail}` : ""}`
      );
    }

    return true;
  } catch (error) {
    console.error("Error eliminando rol", error);
    throw error;
  }
}

export { ROLES_API_URL };
