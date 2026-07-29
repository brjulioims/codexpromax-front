const USUARIOS_API_URL = "/api/usuarios";
const USERNAME_OVERRIDES_STORAGE_KEY = "usernameOverridesByUserId";

function getStoredUsernameOverrides() {
  try {
    const parsed = JSON.parse(localStorage.getItem(USERNAME_OVERRIDES_STORAGE_KEY) ?? "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function setStoredUsernameOverride(id, username) {
  if (!Number.isFinite(Number(id)) || !`${username ?? ""}`.trim()) return;
  const current = getStoredUsernameOverrides();
  current[String(id)] = `${username}`.trim();
  localStorage.setItem(USERNAME_OVERRIDES_STORAGE_KEY, JSON.stringify(current));
}

function buildHeaders(includeJson = false) {
  const token = localStorage.getItem("token");
  return {
    accept: "*/*",
    "ngrok-skip-browser-warning": "true",
    Authorization: token ? `Bearer ${token}` : "",
    ...(includeJson ? { "Content-Type": "application/json" } : {}),
  };
}

function normalizeUsuario(usuario) {
  const id = Number(
    usuario?.id ??
      usuario?.usuario_id ??
      usuario?.user_id ??
      usuario?.idUsuario ??
      usuario?.usuarioId ??
      null
  );
  const email = `${usuario?.email ?? usuario?.correo ?? ""}`.trim();
  const storedUsername = Number.isFinite(id)
    ? getStoredUsernameOverrides()[String(id)] ?? ""
    : "";
  const username = `${
    usuario?.username ??
    usuario?.usuario ??
    usuario?.user_name ??
    usuario?.nombre_usuario ??
    storedUsername ??
    email.split("@")[0] ??
    ""
  }`.trim();
  const nombre = `${usuario?.nombre ?? usuario?.name ?? username ?? email}`.trim();
  const rolId =
    usuario?.rol_id ??
    usuario?.role_id ??
    usuario?.id_rol ??
    usuario?.rolId ??
    usuario?.roleId ??
    null;
  const rolNombre = `${
    usuario?.rol_nombre ??
    usuario?.role ??
    usuario?.rol?.nombre ??
    usuario?.rol ??
    ""
  }`.trim();
  const estatus =
    usuario?.activo != null
      ? Number(usuario.activo)
      : Number(usuario?.estatus ?? usuario?.estado ?? 0);

  if (!Number.isFinite(id) || !nombre) return null;

  return {
    id,
    nombre,
    email,
    username,
    foto: `${usuario?.foto ?? usuario?.avatar ?? ""}`.trim(),
    estatus,
    createdAt: usuario?.created_at ?? usuario?.createdAt ?? "",
    rolId: rolId == null ? null : Number(rolId),
    rolNombre,
    status: estatus === 1 ? "Activo" : "Inactivo",
    role: rolNombre,
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
  if (Array.isArray(data?.usuarios)) return data.usuarios;
  if (Array.isArray(data?.users)) return data.users;
  return [];
}

export async function getUsuarios() {
  try {
    const response = await fetch(USUARIOS_API_URL, {
      method: "GET",
      headers: buildHeaders(),
      credentials: "include",
    });

    const data = await parseResponse(response, "obtener usuarios");
    return resolveCollection(data).map(normalizeUsuario).filter(Boolean);
  } catch (error) {
    console.error("Error consultando usuarios", error);
    return [];
  }
}

export async function updateUsuario(id, payload) {
  try {
    const response = await fetch(`${USUARIOS_API_URL}/${id}`, {
      method: "PATCH",
      headers: buildHeaders(true),
      body: JSON.stringify(payload),
      credentials: "include",
    });

    const data = await parseResponse(response, "editar usuario");
    setStoredUsernameOverride(id, payload?.username);
    return normalizeUsuario(data?.data ?? data);
  } catch (error) {
    console.error("Error editando usuario", error);
    throw error;
  }
}

export async function updateUsuarioEstado(id, payload) {
  try {
    const response = await fetch(`${USUARIOS_API_URL}/${id}/estado`, {
      method: "PATCH",
      headers: buildHeaders(true),
      body: JSON.stringify(payload),
      credentials: "include",
    });

    const data = await parseResponse(response, "cambiar estado del usuario");
    return normalizeUsuario(data?.data ?? data);
  } catch (error) {
    console.error("Error cambiando estado del usuario", error);
    throw error;
  }
}

export async function updateUsuarioPassword(id, payload) {
  try {
    const response = await fetch(`${USUARIOS_API_URL}/${id}/password`, {
      method: "PUT",
      headers: buildHeaders(true),
      body: JSON.stringify(payload),
      credentials: "include",
    });

    return parseResponse(response, "actualizar contrasena del usuario");
  } catch (error) {
    console.error("Error actualizando contrasena del usuario", error);
    throw error;
  }
}

export async function deleteUsuario(id) {
  try {
    const response = await fetch(`${USUARIOS_API_URL}/${id}`, {
      method: "DELETE",
      headers: buildHeaders(),
      credentials: "include",
    });

    await parseResponse(response, "eliminar usuario");
    return true;
  } catch (error) {
    console.error("Error eliminando usuario", error);
    throw error;
  }
}
