export const ME_API_URL = "/api/me";

function clearStoredSession() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("sessionIdentifier");
  localStorage.removeItem("rememberSession");
  localStorage.removeItem("enabledPermissionCodes");
  localStorage.removeItem("enabledPermissionIds");
  localStorage.removeItem("permissionIdsByCode");
}

function buildHeaders() {
  const token = localStorage.getItem("token");
  return {
    accept: "*/*",
    "ngrok-skip-browser-warning": "true",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function parseResponse(response) {
  if (!response.ok) {
    if (response.status === 401) {
      clearStoredSession();
    }

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

    throw new Error(detail || `HTTP_${response.status}`);
  }

  return response.json();
}

function normalizeMe(data) {
  const rawUser = data?.user ?? data?.usuario ?? data ?? {};
  const rawRole =
    rawUser?.role ?? rawUser?.rol ?? rawUser?.roles ?? data?.role ?? data?.rol;
  const roleName =
    (typeof rawRole === "string" ? rawRole : "") ||
    rawRole?.nombre ||
    rawRole?.name ||
    rawUser?.rolNombre ||
    rawUser?.rol_nombre ||
    data?.rolNombre ||
    data?.rol_nombre ||
    "";

  return {
    id: rawUser?.id ?? rawUser?.usuario_id ?? rawUser?.user_id ?? data?.id ?? null,
    nombre:
      rawUser?.nombre ||
      rawUser?.name ||
      rawUser?.username ||
      data?.nombre ||
      data?.name ||
      "",
    username:
      rawUser?.username ??
      rawUser?.usuario ??
      data?.username ??
      data?.usuario ??
      "",
    email: rawUser?.email ?? data?.email ?? "",
    photo: rawUser?.photo ?? data?.photo ?? "",
    first_name: rawUser?.first_name ?? data?.first_name ?? "",
    last_name: rawUser?.last_name ?? data?.last_name ?? "",
    rolId:
      rawUser?.rolId ??
      rawUser?.rol_id ??
      rawRole?.id ??
      data?.rolId ??
      data?.rol_id ??
      null,
    rolNombre: roleName,
    role: roleName,
    permisos: Array.isArray(rawUser?.permisos)
      ? rawUser.permisos
      : Array.isArray(data?.permisos)
        ? data.permisos
        : [],
    raw: data,
  };
}

export async function getMe() {
  const token = localStorage.getItem("token");

  if (!token) {
    throw new Error("TOKEN_REQUIRED");
  }

  const response = await fetch(ME_API_URL, {
    method: "GET",
    headers: buildHeaders(),
    credentials: "include",
  });

  const data = await parseResponse(response);
  return normalizeMe(data);
}
