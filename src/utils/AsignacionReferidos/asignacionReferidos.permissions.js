import { ENABLED_PERMISSIONS_STORAGE_KEY } from "./asignacionReferidos.constants";

export function normalizePermissionCode(value) {
  return `${value ?? ""}`.trim().toLowerCase();
}

export function getStoredEnabledPermissionCodes() {
  try {
    const parsed = JSON.parse(
      localStorage.getItem(ENABLED_PERMISSIONS_STORAGE_KEY) ?? "[]"
    );

    return new Set(
      Array.isArray(parsed)
        ? parsed.map((item) => normalizePermissionCode(item))
        : []
    );
  } catch {
    return new Set();
  }
}

export function resolveCreatedBy() {
  try {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) return null;

    const user = JSON.parse(storedUser);
    const resolvedId = Number(user?.id ?? user?.usuario_id ?? user?.user_id ?? null);

    return Number.isFinite(resolvedId) ? resolvedId : null;
  } catch {
    return null;
  }
}

export function resolveCurrentUserName() {
  try {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) return "";

    const user = JSON.parse(storedUser);

    return (
      user?.nombre ||
      user?.name ||
      user?.username ||
      `${user?.first_name ?? ""} ${user?.last_name ?? ""}`.trim() ||
      user?.email ||
      ""
    );
  } catch {
    return "";
  }
}

export function resolveCurrentUser() {
  try {
    const storedUser = localStorage.getItem("user");
    const user = storedUser ? JSON.parse(storedUser) : null;
    const parsedId = Number(user?.id ?? user?.usuario_id ?? user?.user_id ?? null);

    return {
      id: Number.isFinite(parsedId) ? parsedId : null,
      roleId: Number(user?.rolId ?? user?.rol_id ?? user?.role_id ?? null),
    };
  } catch {
    return {
      id: null,
      roleId: null,
    };
  }
}