const REGISTRAR_USUARIOS_API_URL = "/api/register";

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
  const username = `${
    usuario?.username ??
    usuario?.usuario ??
    usuario?.user_name ??
    usuario?.nombre_usuario ??
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
    estatus,
    createdAt: usuario?.created_at ?? usuario?.createdAt ?? "",
    rolId: rolId == null ? null : Number(rolId),
    rolNombre,
    status: estatus === 1 ? "Activo" : "Inactivo",
    role: rolNombre,
  };
}

async function parseResponse(response) {
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
      `Error al registrar usuario: ${response.status}${detail ? ` - ${detail}` : ""}`
    );
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export async function createUsuario(payload) {
  try {
    const response = await fetch(REGISTRAR_USUARIOS_API_URL, {
      method: "POST",
      headers: buildHeaders(true),
      body: JSON.stringify(payload),
      credentials: "include",
    });

    const data = await parseResponse(response);
    return normalizeUsuario(data?.data ?? data);
  } catch (error) {
    console.error("Error registrando usuario", error);
    throw error;
  }
}

export { REGISTRAR_USUARIOS_API_URL };
