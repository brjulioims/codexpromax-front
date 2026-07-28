import { useEffect, useMemo, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useMeQuery } from "../../hooks/queries/useMeQuery";
import { queryKeys } from "../../utils/queryKeys";
const ENABLED_PERMISSIONS_STORAGE_KEY = "enabledPermissionCodes";
const ENABLED_PERMISSION_IDS_STORAGE_KEY = "enabledPermissionIds";
const PERMISSION_IDS_BY_CODE_STORAGE_KEY = "permissionIdsByCode";

const ROUTE_PERMISSION_RULES = [
  { permission: "dashboard", paths: ["/dashboard"] },
  { permission: "mantenimiento", paths: ["/usuarios"] },
];

function normalizePermissionCode(value) {
  return `${value ?? ""}`.trim().toLowerCase();
}

function getStoredEnabledPermissionCodes() {
  try {
    const parsed = JSON.parse(
      localStorage.getItem(ENABLED_PERMISSIONS_STORAGE_KEY) ?? "[]"
    );

    return new Set(
      Array.isArray(parsed) ? parsed.map((item) => normalizePermissionCode(item)) : []
    );
  } catch {
    return new Set();
  }
}

function getStoredUser() {
  const storedUser = localStorage.getItem("user");

  if (!storedUser) return null;

  try {
    return JSON.parse(storedUser);
  } catch {
    return null;
  }
}

function resolveRequiredPermission(pathname) {
  const normalizedPath = `${pathname ?? "/"}`.trim().toLowerCase();
  const rule = ROUTE_PERMISSION_RULES.find((item) =>
    item.paths.some((path) => normalizedPath === path || normalizedPath.startsWith(`${path}/`))
  );

  return rule?.permission ?? null;
}

function canAccessPath(enabledCodes, pathname) {
  const requiredPermission = resolveRequiredPermission(pathname);

  if (!requiredPermission) return true;
  if (!(enabledCodes instanceof Set)) return false;

  return enabledCodes.has(requiredPermission);
}

function getEnabledPermissionCodesForCurrentRole(currentUser) {
  return new Set(
    (currentUser?.permisos ?? currentUser?.raw?.permisos ?? [])
      .filter((permission) => permission.valor)
      .map((permission) =>
        normalizePermissionCode(permission.clave ?? permission.codigo ?? permission.nombre)
      )
  );
}

function getEnabledPermissionIdsForCurrentRole(currentUser) {
  return Array.from(
    new Set(
      (currentUser?.permisos ?? currentUser?.raw?.permisos ?? [])
        .filter((permission) => permission.valor)
        .map((permission) => Number(permission?.id))
        .filter((id) => Number.isFinite(id))
    )
  );
}

function getPermissionIdsByCodeForCurrentRole(currentUser) {
  return Object.fromEntries(
    (currentUser?.permisos ?? currentUser?.raw?.permisos ?? [])
      .map((permission) => [
        normalizePermissionCode(
          permission?.clave ?? permission?.codigo ?? permission?.nombre
        ),
        Number(permission?.id),
      ])
      .filter(([code, id]) => code && Number.isFinite(id))
  );
}

export default function ProtectedRoute() {
  const token = localStorage.getItem("token");
  const hasSession = Boolean(localStorage.getItem("user"));
  const location = useLocation();
  const queryClient = useQueryClient();
  const { data: me, isLoading: loadingMe } = useMeQuery({
    enabled: Boolean(token),
  });
  const [, setPermissionsVersion] = useState(0);
  const storedEnabledCodes = getStoredEnabledPermissionCodes();
  const currentUser = me ?? getStoredUser();
  const roleEnabledCodes = useMemo(
    () => getEnabledPermissionCodesForCurrentRole(currentUser),
    [currentUser]
  );
  const enabledCodes = me
    ? roleEnabledCodes
    : roleEnabledCodes.size
      ? roleEnabledCodes
      : storedEnabledCodes;
  const loadingPermissions = loadingMe && enabledCodes.size === 0;

  useEffect(() => {
    if (me) {
      localStorage.setItem(
        ENABLED_PERMISSIONS_STORAGE_KEY,
        JSON.stringify([...roleEnabledCodes])
      );
      localStorage.setItem(
        ENABLED_PERMISSION_IDS_STORAGE_KEY,
        JSON.stringify(getEnabledPermissionIdsForCurrentRole(currentUser))
      );
      localStorage.setItem(
        PERMISSION_IDS_BY_CODE_STORAGE_KEY,
        JSON.stringify(getPermissionIdsByCodeForCurrentRole(currentUser))
      );
    }
  }, [currentUser, me, roleEnabledCodes]);

  useEffect(() => {
    if (!token && !hasSession) {
      return undefined;
    }

    const handlePermissionsUpdated = () => {
      setPermissionsVersion((current) => current + 1);
      queryClient.invalidateQueries({ queryKey: queryKeys.me.all });
    };

    window.addEventListener("permissions-updated", handlePermissionsUpdated);
    window.addEventListener("storage", handlePermissionsUpdated);

    return () => {
      window.removeEventListener("permissions-updated", handlePermissionsUpdated);
      window.removeEventListener("storage", handlePermissionsUpdated);
    };
  }, [hasSession, queryClient, token]);

  if (!token && !hasSession) {
    return <Navigate to="/login" replace />;
  }

  if (loadingPermissions) {
    return null;
  }

  if (!canAccessPath(enabledCodes, location.pathname)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
