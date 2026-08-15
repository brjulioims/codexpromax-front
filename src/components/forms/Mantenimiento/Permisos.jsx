import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookMarked,
  Building2,
  FilePenLine,
  HandCoins,
  Handshake,
  MapPinned,
  Plus,
  Save,
  Settings2,
  Trash2,
  UserCog,
  UserPlus,
  UserRoundKey,
  UserCircle2,
} from "lucide-react";
import toast from "react-hot-toast";
import Swal from "sweetalert2";
import { usePermisosQuery } from "../../../hooks/queries/usePermisosQuery";
import { useRolesQuery } from "../../../hooks/queries/useRolesQuery";
import {
  useCreatePermisoMutation,
  useSaveRolPermisoMutation,
  useUpdatePermisoMutation,
} from "../../../hooks/mutations/usePermisosMutations";
import {
  useCreateRolMutation,
  useDeleteRolMutation,
  useUpdateRolMutation,
} from "../../../hooks/mutations/useRolesMutations";
import Agregar from "../../botones/Agregar";
import Editar from "../../botones/Editar";
import HeaderBox from "../../ui/HeaderBox";
import Loading from "../../ui/Loading";
import ModalFiltro from "../../ui/ModalFiltro";

const tabs = [
  { id: "permisos", label: "Permisos", icon: UserRoundKey },
];

const PERMISSION_SECTION_STORAGE_KEY = "permissionSections";
const ENABLED_PERMISSIONS_STORAGE_KEY = "enabledPermissionCodes";
const ENABLED_PERMISSION_IDS_STORAGE_KEY = "enabledPermissionIds";
const PERMISSION_IDS_BY_CODE_STORAGE_KEY = "permissionIdsByCode";
const MENU_PERMISSION_CODES = new Set([
  "dashboard",
  "mantenimiento",
  "gestion_vendedores",
  "asignacion",
  "referidos",
  "empresas",
  "tablas",
  "historicos",
]);
const MENU_CHILD_PERMISSION_CODES = {
  gestion_vendedores: ["disponibilidad_vendedores", "vendedores"],
  asignacion: [
    "asignacion_clientes",
    "asignacion_manual_vendedores_eeuu",
    "asignacion_clientes_ingles",
    "asignacion_clientes_portugues",
    "asignacion_otras_marcas",
  ],
  referidos: ["asignacion_referidos", "historial_asignacion_referidos"],
  empresas: ["asignaciones_empresas", "total_empresas"],
  tablas: ["recuento_asignaciones"],
  historicos: [
    "historial_asignaciones",
    "informe_asignaciones_otras_marcas",
    "historial_disponibilidad",
  ],
};
const SPECIAL_PERMISSION_CODES = new Set([
  "editar_disponibilidad_vendedores",
  "cambio_grupo_referidos",
  "editar_historial_asignacion_referidos",
  "saltar_restriccion_horario_disponibilidad",
  "ver_todos_los_equipos",
]);

const initialPermissionForm = {
  nombre: "",
  clave: "",
  descripcion: "",
  section: "others",
  parent_id: "",
};

function normalizeCode(value) {
  return `${value ?? ""}`
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_+/g, "_");
}

function normalizeSection(value) {
  const normalized = normalizeCode(value);
  if (normalized === "menu") return "menu";
  if (normalized === "submenu") return "submenu";
  if (normalized === "permisos_especiales" || normalized === "permisos_especiales_del_sistema")
    return "permisos_especiales";
  return "others";
}

function formatPermissionLabel(permission) {
  const base = `${permission?.nombre ?? permission?.clave ?? permission?.codigo ?? ""}`.trim();

  return base
    .split(/[_-\s]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function normalizePermission(permission) {
  const id = Number(permission?.id);
  const nombre = `${permission?.nombre ?? ""}`.trim();
  const clave = normalizeCode(permission?.clave ?? permission?.codigo ?? permission?.nombre);
  const parentId = Number(permission?.parent_id ?? permission?.parentId ?? null);
  const orden = Number(permission?.orden ?? permission?.order ?? 0);

  if (!Number.isFinite(id) || !nombre || !clave) return null;

  const resolvedSection = normalizeSection(permission?.section);

  const finalSection =
    resolvedSection === "others" && SPECIAL_PERMISSION_CODES.has(clave)
      ? "permisos_especiales"
      : resolvedSection === "others" && MENU_PERMISSION_CODES.has(clave)
        ? "menu"
        : resolvedSection;

  return {
    id,
    nombre,
    clave,
    codigo: clave,
    descripcion: `${permission?.descripcion ?? ""}`.trim(),
    section: finalSection,
    parent_id: Number.isFinite(parentId) ? parentId : null,
    orden: Number.isFinite(orden) ? orden : 0,
  };
}

function buildPermissionUniverse(catalogPermissions, rolePermissions = []) {
  const permissionsMap = new Map();

  catalogPermissions.forEach((permission) => {
    permissionsMap.set(permission.id, permission);
  });

  rolePermissions
    .map(normalizePermission)
    .filter(Boolean)
    .forEach((permission) => {
      if (!permissionsMap.has(permission.id)) {
        permissionsMap.set(permission.id, permission);
      }
    });

  return [...permissionsMap.values()].sort((a, b) => a.nombre.localeCompare(b.nombre));
}

function getStoredPermissionSections() {
  try {
    return JSON.parse(localStorage.getItem(PERMISSION_SECTION_STORAGE_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function getCurrentUserRoleId() {
  try {
    const storedUser = localStorage.getItem("user");
    const user = storedUser ? JSON.parse(storedUser) : null;
    const roleId = Number(user?.rolId ?? user?.rol_id ?? null);
    return Number.isFinite(roleId) ? roleId : null;
  } catch {
    return null;
  }
}

function syncEnabledCodesForCurrentRole(roleData) {
  const currentRoleId = getCurrentUserRoleId();
  if (!currentRoleId || Number(roleData?.id) !== currentRoleId) return;

  const nextCodes = (roleData?.permissions ?? [])
    .filter((permission) => Boolean(permission?.valor))
    .map((permission) =>
      normalizeCode(permission?.clave ?? permission?.codigo ?? permission?.nombre)
    )
    .filter(Boolean);
  const nextIds = (roleData?.permissions ?? [])
    .filter((permission) => Boolean(permission?.valor))
    .map((permission) => Number(permission?.id))
    .filter((id) => Number.isFinite(id));
  const permissionIdsByCode = Object.fromEntries(
    (roleData?.permissions ?? [])
      .map((permission) => [
        normalizeCode(permission?.clave ?? permission?.codigo ?? permission?.nombre),
        Number(permission?.id),
      ])
      .filter(([code, id]) => code && Number.isFinite(id))
  );

  localStorage.setItem(
    ENABLED_PERMISSIONS_STORAGE_KEY,
    JSON.stringify(Array.from(new Set(nextCodes)))
  );
  localStorage.setItem(
    ENABLED_PERMISSION_IDS_STORAGE_KEY,
    JSON.stringify(Array.from(new Set(nextIds)))
  );
  localStorage.setItem(
    PERMISSION_IDS_BY_CODE_STORAGE_KEY,
    JSON.stringify(permissionIdsByCode)
  );
}

function mergeRoleWithPermissions(role, permissionsCatalog) {
  const mergedPermissions = buildPermissionUniverse(permissionsCatalog, role?.permisos ?? []);
  const assignedMap = new Map(
    (role?.permisos ?? [])
      .map((permission) => [Number(permission.id), permission])
      .filter(([id]) => Number.isFinite(id))
  );

  return {
    id: role.id,
    role: role.nombre,
    permissions: mergedPermissions.map((permission) => ({
      ...permission,
      valor: Boolean(assignedMap.get(permission.id)?.valor),
    })),
  };
}

function groupPermissions(roleData) {
  const permissions = roleData?.permissions ?? [];
  const menuItems = permissions
    .filter((permission) => permission.section === "menu")
    .sort(
      (a, b) =>
        (a.orden ?? 0) - (b.orden ?? 0) ||
        a.nombre.localeCompare(b.nombre)
    );

  const otherItems = permissions
    .filter((permission) =>
      ["submenu", "others"].includes(permission.section)
    )
    .sort((a, b) => a.nombre.localeCompare(b.nombre));
  const specialItems = permissions
    .filter((permission) => permission.section === "permisos_especiales")
    .sort((a, b) => a.nombre.localeCompare(b.nombre));

  return [
    {
      key: "menu",
      title: "MENU LATERAL",
      subtitle: "Accesos visibles en sidebar",
      items: menuItems,
    },
    {
      key: "others",
      title: "submenús",
      subtitle:
        "Permisos que son los submenús del menú lateral o permisos adicionales sin sección",
      items: otherItems,
    },
     {
      key: "permisos_especiales",
      title: "Permisos especiales",
      subtitle: "Permisos adicionales del sistema",
      items: specialItems,
    },
  ];
}

function Switch({ checked, disabled = false, onChange }) {
  return (
    <button
      type="button"
      onClick={onChange}
      disabled={disabled}
      className={`relative h-5 w-9 rounded-full transition 2xl:h-6 2xl:w-11 ${
        checked ? "bg-emerald-500" : "bg-slate-200 dark:bg-slate-800"
      } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
    >
      <span
        className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition 2xl:h-5 2xl:w-5 ${
          checked ? "left-[18px] 2xl:left-5" : "left-0.5"
        }`}
      />
    </button>
  );
}

function PermissionRow({ permission, disabled = false, onChange, onEdit, onDelete }) {
  const label = permission?.label ?? formatPermissionLabel(permission);

  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 transition hover:border-orange-200 dark:hover:border-orange-500/30 hover:bg-orange-50/40 dark:hover:bg-orange-950/20">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[13px] font-medium text-slate-700 dark:text-slate-300">
            {label}
          </p>
          {permission.descripcion ? (
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{permission.descripcion}</p>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Switch checked={Boolean(permission.valor)} disabled={disabled} onChange={onChange} />
          {onEdit ? (
            <Editar
              onClick={onEdit}
              className="text-slate-400 dark:text-slate-500 hover:bg-sky-50 dark:hover:bg-slate-800 hover:text-[#0d1b5e] dark:hover:text-sky-400"
              title={`Editar ${permission.nombre}`}
            />
          ) : null}
          {onDelete ? (
            <button
              type="button"
              onClick={onDelete}
              title={`Eliminar ${permission.nombre}`}
              aria-label={`Eliminar ${permission.nombre}`}
              className="inline-flex items-center justify-center text-slate-400 dark:text-slate-500 transition hover:text-red-600 dark:hover:text-red-400"
            >
              <Trash2 size={16} />
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function PermissionCard({
  title,
  subtitle,
  items,
  savingMap,
  onToggle,
  onEdit,
  onDelete,
  isItemDisabled,
  countByCategory = false,
}) {
  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-[#f8f9fb] dark:bg-slate-900/40 p-4 shadow-sm lg:p-5 transition-colors duration-300">
      <div className="mb-4 flex items-start justify-between gap-3 lg:mb-5">
        <div>
          <h3 className="text-lg font-light uppercase text-slate-800 dark:text-slate-100 xl:text-xl 2xl:text-[24px]">
            {title}
          </h3>
          <p className="mt-1 text-[9px] font-semibold uppercase text-slate-400 2xl:text-[10px]">
            {subtitle}
          </p>
        </div>

        <div className="rounded-lg bg-[#eef2ff] dark:bg-blue-950/40 px-2.5 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400 2xl:px-3 2xl:py-1.5 2xl:text-sm transition-colors">
          {countByCategory
            ? items.length
            : items.filter((item) => Boolean(item?.valor)).length}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 2xl:grid-cols-2">
        {items.map((item) => (
          <PermissionRow
            key={item.id}
            permission={item}
            disabled={Boolean(savingMap[item.id]) || Boolean(isItemDisabled?.(item))}
            onChange={() => onToggle(item)}
            onEdit={onEdit ? () => onEdit(item) : undefined}
            onDelete={onDelete ? () => onDelete(item) : undefined}
          />
        ))}
      </div>
    </div>
  );
}

export default function Permisos() {
  const navigate = useNavigate();
  const { data: rolesData, isLoading: loadingRolesData } = useRolesQuery();
  const { data: permissionsData, isLoading: loadingPermissions } = usePermisosQuery();
  const createRolMutation = useCreateRolMutation();
  const updateRolMutation = useUpdateRolMutation();
  const deleteRolMutation = useDeleteRolMutation();
  const createPermisoMutation = useCreatePermisoMutation();
  const updatePermisoMutation = useUpdatePermisoMutation();
  const saveRolPermisoMutation = useSaveRolPermisoMutation();
  const [selectedRoleId, setSelectedRoleId] = useState(null);
  const [createRoleOpen, setCreateRoleOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [editRoleOpen, setEditRoleOpen] = useState(false);
  const [editRoleName, setEditRoleName] = useState("");
  const [permissionModalOpen, setPermissionModalOpen] = useState(false);
  const [permissionForm, setPermissionForm] = useState(initialPermissionForm);
  const [editingPermissionId, setEditingPermissionId] = useState(null);
  const [savingPermissions, setSavingPermissions] = useState({});
  const loadingRoles = loadingRolesData || loadingPermissions;

  const { roles, permissionsCatalog } = useMemo(() => {
    const storedSections = getStoredPermissionSections();

    const normalizedPermissionsFromCatalog = (permissionsData ?? [])
      .map((permission) =>
        normalizePermission({
          ...permission,
          section:
            `${permission?.section ?? ""}`.trim() ||
            storedSections[permission?.id] ||
            storedSections[String(permission?.id)] ||
            "others",
        })
      )
      .filter(Boolean)
      .sort((a, b) => a.nombre.localeCompare(b.nombre));

    const normalizedPermissionsFromRoles = (rolesData ?? [])
      .flatMap((role) => role?.permisos ?? [])
      .map((permission) =>
        normalizePermission({
          ...permission,
          section:
            `${permission?.section ?? ""}`.trim() ||
            storedSections[permission?.id] ||
            storedSections[String(permission?.id)] ||
            "others",
        })
      )
      .filter(Boolean);

    const normalizedPermissions = buildPermissionUniverse(
      normalizedPermissionsFromCatalog,
      normalizedPermissionsFromRoles
    ).sort((a, b) => a.nombre.localeCompare(b.nombre));

    const nextRoles = (rolesData ?? []).map((item) =>
      mergeRoleWithPermissions(item, normalizedPermissions)
    );

    return {
      roles: nextRoles,
      permissionsCatalog: normalizedPermissions,
    };
  }, [rolesData, permissionsData]);

  const resolvedSelectedRoleId = roles.some((item) => item.id === selectedRoleId)
    ? selectedRoleId
    : (roles[0]?.id ?? null);

  const selectedData = useMemo(
    () => roles.find((item) => item.id === resolvedSelectedRoleId) ?? null,
    [roles, resolvedSelectedRoleId]
  );

  const permissionGroups = useMemo(
    () => groupPermissions(selectedData),
    [selectedData]
  );
  const isSubmenuPermissionDisabled = (permission) => {
    if (!selectedData) return false;

    const permissionCode = normalizeCode(
      permission?.clave ?? permission?.codigo ?? permission?.nombre
    );
    const parentById = selectedData.permissions.find(
      (item) => Number(item?.id) === Number(permission?.parent_id)
    );

    let parentPermission = parentById ?? null;

    if (!parentPermission) {
      const parentCode = Object.entries(MENU_CHILD_PERMISSION_CODES).find(([, children]) =>
        children.includes(permissionCode)
      )?.[0];

      parentPermission =
        selectedData.permissions.find(
          (item) =>
            normalizeCode(item?.clave ?? item?.codigo ?? item?.nombre) === parentCode
        ) ?? null;
    }

    if (!parentPermission) return false;

    return !parentPermission?.valor;
  };

  const roleAlreadyExists = roles.some(
    (item) => item.role.toLowerCase() === newRoleName.trim().toLowerCase()
  );

  const editRoleAlreadyExists = roles.some(
    (item) =>
      item.role.toLowerCase() === editRoleName.trim().toLowerCase() &&
      item.id !== selectedData?.id
  );

  const normalizedPermissionForm = {
    nombre: permissionForm.nombre.trim(),
    clave: normalizeCode(permissionForm.clave),
    descripcion: permissionForm.descripcion.trim(),
    section:
      permissionForm.section === "menu"
        ? "menu"
        : permissionForm.section === "submenu"
          ? "submenu"
        : permissionForm.section === "permisos_especiales"
          ? "permisos_especiales"
          : "others",
    parent_id:
      permissionForm.section === "submenu" && Number.isFinite(Number(permissionForm.parent_id))
        ? Number(permissionForm.parent_id)
        : null,
  };

  const permissionAlreadyExists = permissionsCatalog.some(
    (item) =>
      item.clave === normalizedPermissionForm.clave && item.id !== editingPermissionId
  );
  const menuParentOptions = useMemo(
    () =>
      permissionsCatalog
        .filter((item) => item.section === "menu")
        .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0) || a.nombre.localeCompare(b.nombre)),
    [permissionsCatalog]
  );

  const resetPermissionModal = () => {
    setEditingPermissionId(null);
    setPermissionForm(initialPermissionForm);
    setPermissionModalOpen(false);
  };

  const storePermissionSections = (nextCatalog) => {
    const sortedCatalog = [...nextCatalog].sort((a, b) => a.nombre.localeCompare(b.nombre));
    localStorage.setItem(
      PERMISSION_SECTION_STORAGE_KEY,
      JSON.stringify(
        Object.fromEntries(sortedCatalog.map((permission) => [permission.id, permission.section]))
      )
    );
  };

  const handleTogglePermission = async (permission) => {
    if (!selectedData) return;

    const nextValue = !permission.valor;
    const byParentId = selectedData.permissions.filter((item) =>
      Number(item?.parent_id) === Number(permission?.id)
    );
    const fallbackChildCodes =
      MENU_CHILD_PERMISSION_CODES[normalizeCode(permission?.clave ?? permission?.codigo ?? permission?.nombre)] ?? [];
    const dependentPermissions =
      byParentId.length > 0
        ? byParentId
        : selectedData.permissions.filter((item) =>
            fallbackChildCodes.includes(
              normalizeCode(item?.clave ?? item?.codigo ?? item?.nombre)
            )
          );
    const updates = [
      { id: permission.id, valor: nextValue },
      ...dependentPermissions
        .filter((item) => item.id !== permission.id)
        .map((item) => ({ id: item.id, valor: nextValue })),
    ];
    const actionLabel = nextValue ? "activar" : "desactivar";
    const result = await Swal.fire({
      icon: "question",
      title: `${nextValue ? "Activar" : "Desactivar"} permiso`,
      text: `Quieres ${actionLabel} el permiso "${permission.nombre}" para el rol "${selectedData.role}"?`,
      showCancelButton: true,
      confirmButtonText: "Si­, guardar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#f97316",
      cancelButtonColor: "#94a3b8",
    });

    if (!result.isConfirmed) return;

    if (!Number.isFinite(Number(permission.id))) {
      await Swal.fire({
        icon: "warning",
        title: "Permiso inválido",
        text: "Este permiso no tiene un id válido para guardarse.",
        confirmButtonColor: "#f97316",
      });
      return;
    }

    setSavingPermissions((prev) => {
      const next = { ...prev };
      updates.forEach((update) => {
        next[update.id] = true;
      });
      return next;
    });

    try {
      await Promise.all(
        updates.map((update) =>
          saveRolPermisoMutation.mutateAsync({
            rol_id: selectedData.id,
            permiso_id: update.id,
            valor: update.valor,
          })
        )
      );

      syncEnabledCodesForCurrentRole({
        ...selectedData,
        permissions: selectedData.permissions.map((item) =>
          updates.some((update) => update.id === item.id)
            ? {
                ...item,
                valor:
                  updates.find((update) => update.id === item.id)?.valor ??
                  item.valor,
              }
            : item
        ),
      });

      window.dispatchEvent(new CustomEvent("permissions-updated"));
      toast.success("Permiso actualizado.");
    } catch (error) {
      toast.error(error?.message || "No se pudo guardar el permiso.");
    } finally {
      setSavingPermissions((prev) => {
        const next = { ...prev };
        updates.forEach((update) => {
          delete next[update.id];
        });
        return next;
      });
    }
  };

  const handleTabChange = (tabId) => {
    if (tabId === "permisos") return;
    if (tabId === "vendedores") {
      navigate("/vendedores");
      return;
    }
    if (tabId === "grupos") {
      navigate("/grupos");
      return;
    }
    navigate(`/configuracion?tab=${tabId}`);
  };

  const handleCreateRole = async () => {
    const trimmedRole = newRoleName.trim();
    if (!trimmedRole) {
      await Swal.fire({
        icon: "warning",
        title: "Campo requerido",
        text: "Debes ingresar el nombre del rol.",
        confirmButtonColor: "#f97316",
      });
      return;
    }

    if (roleAlreadyExists) {
      await Swal.fire({
        icon: "warning",
        title: "Rol duplicado",
        text: "Ese rol ya existe en el sistema.",
        confirmButtonColor: "#f97316",
      });
      return;
    }

    const result = await Swal.fire({
      icon: "question",
      title: "Guardar rol",
      text: "Quieres guardar este nuevo rol?",
      showCancelButton: true,
      confirmButtonText: "Guardar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#f97316",
      cancelButtonColor: "#94a3b8",
    });

    if (!result.isConfirmed) return;

    try {
      const createdRole = await createRolMutation.mutateAsync({ nombre: trimmedRole });
      const nextRole = {
        id: createdRole?.id ?? Date.now(),
        role: createdRole?.nombre ?? trimmedRole,
        permissions: permissionsCatalog.map((permission) => ({
          ...permission,
          valor: false,
        })),
      };

      setSelectedRoleId(nextRole.id);
      setNewRoleName("");
      setCreateRoleOpen(false);
      window.dispatchEvent(new CustomEvent("permissions-updated"));
      toast.success("Rol agregado.");
    } catch {
      await Swal.fire({
        icon: "error",
        title: "Error al guardar",
        text: "No se pudo crear el rol.",
        confirmButtonColor: "#f97316",
      });
    }
  };

  const handleEditRole = async () => {
    const trimmedRole = editRoleName.trim();
    if (!selectedData) return;

    if (!trimmedRole) {
      await Swal.fire({
        icon: "warning",
        title: "Campo requerido",
        text: "Debes ingresar el nombre del rol.",
        confirmButtonColor: "#f97316",
      });
      return;
    }

    if (editRoleAlreadyExists) {
      await Swal.fire({
        icon: "warning",
        title: "Rol duplicado",
        text: "Ese rol ya existe en el sistema.",
        confirmButtonColor: "#f97316",
      });
      return;
    }

    const result = await Swal.fire({
      icon: "question",
      title: "Editar rol",
      text: "Quieres guardar los cambios de este rol?",
      showCancelButton: true,
      confirmButtonText: "Guardar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#f97316",
      cancelButtonColor: "#94a3b8",
    });

    if (!result.isConfirmed) return;

    try {
      await updateRolMutation.mutateAsync({
        id: selectedData.id,
        payload: { nombre: trimmedRole },
      });

      setEditRoleName("");
      setEditRoleOpen(false);
      window.dispatchEvent(new CustomEvent("permissions-updated"));
      toast.success("Rol actualizado.");
    } catch {
      await Swal.fire({
        icon: "error",
        title: "Error al guardar",
        text: "No se pudo editar el rol.",
        confirmButtonColor: "#f97316",
      });
    }
  };

  const handleDeleteRole = async (role) => {
    const result = await Swal.fire({
      icon: "warning",
      title: "Eliminar rol",
      text: `Quieres eliminar el rol "${role.role}"?`,
      showCancelButton: true,
      confirmButtonText: "Eliminar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#94a3b8",
    });

    if (!result.isConfirmed) return;

    try {
      await deleteRolMutation.mutateAsync(role.id);
      const nextSelectedRoleId = roles.find((item) => item.id !== role.id)?.id ?? null;

      setSelectedRoleId((current) =>
        current === role.id || resolvedSelectedRoleId === role.id
          ? nextSelectedRoleId
          : current
      );

      window.dispatchEvent(new CustomEvent("permissions-updated"));
      toast.success("Rol eliminado.");
    } catch {
      await Swal.fire({
        icon: "error",
        title: "Error al eliminar",
        text: "No se pudo eliminar el rol.",
        confirmButtonColor: "#dc2626",
      });
    }
  };

  const handleSavePermission = async () => {
    if (!normalizedPermissionForm.nombre || !normalizedPermissionForm.clave) {
      await Swal.fire({
        icon: "warning",
        title: "Campos requeridos",
        text: "Debes ingresar nombre y clave del permiso.",
        confirmButtonColor: "#f97316",
      });
      return;
    }

    if (permissionAlreadyExists) {
      await Swal.fire({
        icon: "warning",
        title: "Permiso duplicado",
        text: "Ya existe un permiso con esa clave.",
        confirmButtonColor: "#f97316",
      });
      return;
    }

    const result = await Swal.fire({
      icon: "question",
      title: editingPermissionId ? "Editar permiso" : "Guardar permiso",
      text: editingPermissionId
        ? "Quieres guardar los cambios de este permiso?"
        : "Quieres guardar este nuevo permiso?",
      showCancelButton: true,
      confirmButtonText: "Guardar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#f97316",
      cancelButtonColor: "#94a3b8",
    });

    if (!result.isConfirmed) return;

    try {
      const savedPermission = editingPermissionId
        ? await updatePermisoMutation.mutateAsync({
            id: editingPermissionId,
            payload: normalizedPermissionForm,
          })
        : await createPermisoMutation.mutateAsync(normalizedPermissionForm);

      const normalized = normalizePermission({
        ...savedPermission,
        ...normalizedPermissionForm,
        id: savedPermission?.id ?? editingPermissionId ?? Date.now(),
      });

      if (!normalized) {
        throw new Error("Permiso invalido");
      }

      const nextCatalog = editingPermissionId
        ? permissionsCatalog.map((item) => (item.id === editingPermissionId ? normalized : item))
        : [...permissionsCatalog, normalized];

      storePermissionSections(nextCatalog);
      window.dispatchEvent(new CustomEvent("permissions-updated"));
      toast.success(editingPermissionId ? "Permiso actualizado." : "Permiso creado.");
      resetPermissionModal();
    } catch {
      await Swal.fire({
        icon: "error",
        title: "Error al guardar",
        text: "No se pudo guardar el permiso.",
        confirmButtonColor: "#f97316",
      });
    }
  };

  const handleEditPermission = (permission) => {
    setEditingPermissionId(permission.id);
    setPermissionForm({
      nombre: permission.nombre,
      clave: permission.clave,
      descripcion: permission.descripcion ?? "",
      section:
        permission.section === "menu"
          ? "menu"
          : permission.section === "submenu"
            ? "submenu"
          : permission.section === "permisos_especiales"
            ? "permisos_especiales"
            : "others",
      parent_id: permission.parent_id ? String(permission.parent_id) : "",
    });
    setPermissionModalOpen(true);
  };

  return (
    <section className="space-y-4 xl:space-y-5">
      <HeaderBox
        title="CONFIGURACION DE PERMISOS"
        subtitle="Gestiona la configuracion del sistema."
        Icon={Settings2}
        action={
          <div className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-[#0e183f]">
            Roles: {roles.length} | Permisos: {permissionsCatalog.length}
          </div>
        }
      />

      <div className="overflow-x-auto">
        <div className="inline-flex min-w-full items-center gap-1 rounded-lg border border-[#0a1233]/10 bg-gradient-to-r from-[#ffffff] to-[#ffffff]/85 p-2 transition-colors duration-300 dark:border-slate-800 dark:bg-slate-900 dark:from-slate-900 dark:to-slate-900/85 dark:shadow-[0_8px_24px_rgba(2,6,23,0.45)]">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = tab.id === "permisos";

            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={[
                  "flex items-center gap-2 rounded-xl px-4 py-2.5 text-[12px] font-black uppercase tracking-[0.08em] whitespace-nowrap transition-all duration-200",
                  isActive
                    ? "text-[#fe7405] pl-3 border-l-[3px] border-l-[#fe7405] rounded-lg"
                    : "pl-4 text-[#0a1233] hover:bg-slate-100 hover:text-[#0a1233] dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white",
                ].join(" ")}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[330px_1fr] 2xl:gap-5">
        <aside className="rounded-lg border border-slate-200 dark:border-slate-800 bg-[#f8f9fb] dark:bg-slate-950 p-4 shadow-sm transition-colors duration-300">
          <div className="mb-4 2xl:mb-5">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-900 text-[#0e0f16] dark:text-slate-100 transition-colors duration-300">
                <UserCog size={18} />
              </div>
              <div>
                <p className="text-base font-semibold uppercase text-[#101a3c] dark:text-slate-100 2xl:text-[18px]">
                  Roles del sistema
                </p>
                <p className="mt-1 text-xs uppercase text-slate-400">Selecciona un rol</p>
              </div>
            </div>
          </div>

          <div className="space-y-2.5">
            {loadingRoles ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-3">
                <Loading label="Cargando roles..." />
              </div>
            ) : roles.length ? (
              roles.map((item) => {
                const active = resolvedSelectedRoleId === item.id;

                return (
                  <div
                    key={item.id}
                    className={`group relative flex items-center overflow-hidden rounded-xl px-4 py-3.5 transition-all duration-300 ease-out 2xl:py-4 ${
                      active
                        ? "bg-[#0d1b5e] dark:bg-blue-900/60 text-white shadow-lg shadow-[#0d1b5e]/10 dark:shadow-blue-900/20 ring-1 ring-[#0d1b5e]/10 dark:ring-blue-900/30"
                        : "bg-white/60 dark:bg-slate-900/40 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-900 hover:text-slate-800 dark:hover:text-slate-200 hover:shadow-sm border border-slate-200/60 dark:border-slate-800/60 hover:border-slate-200 dark:hover:border-slate-700"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedRoleId(item.id)}
                      className="relative z-10 flex min-w-0 flex-1 items-center gap-4 text-left"
                    >
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all duration-300 ${
                          active
                            ? "bg-white/15 text-orange-300"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:bg-[#0d1b5e]/10 dark:group-hover:bg-blue-900/30 group-hover:text-[#0d1b5e] dark:group-hover:text-blue-300"
                        }`}
                      >
                        <span
                          className={`h-2.5 w-2.5 rounded-full transition-all duration-300 ${
                            active
                              ? "bg-orange-400 shadow-[0_0_0_4px_rgba(251,146,60,0.15)]"
                              : "bg-slate-300 dark:bg-slate-600 group-hover:bg-[#0d1b5e] dark:group-hover:bg-blue-400"
                          }`}
                        />
                      </span>
                      <span className="truncate text-sm font-semibold tracking-wide uppercase">
                        {item.role}
                      </span>
                    </button>

                    <div className="relative z-10 ml-3 flex shrink-0 items-center gap-2">
                      <Editar
                        onClick={() => {
                          setSelectedRoleId(item.id);
                          setEditRoleName(item.role);
                          setEditRoleOpen(true);
                        }}
                        className={
                          active
                            ? "border-white/10 !text-white hover:bg-white/10 hover:!text-white"
                            : "text-slate-400 dark:text-slate-500 hover:bg-sky-50 dark:hover:bg-slate-800 hover:text-[#0d1b5e] dark:hover:text-sky-400"
                        }
                        title={`Editar ${item.role}`}
                      />
                      <button
                        type="button"
                        onClick={() => handleDeleteRole(item)}
                        title={`Eliminar ${item.role}`}
                        aria-label={`Eliminar ${item.role}`}
                        className={
                          active
                            ? "inline-flex items-center justify-center text-slate-300 transition hover:text-red-300"
                            : "inline-flex items-center justify-center text-slate-400 transition hover:text-red-600"
                        }
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-6 text-center text-sm text-slate-500">
                No hay roles para mostrar.
              </div>
            )}
          </div>
        </aside>

        <div className="space-y-4">
          <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-[#f8f9fb] dark:bg-slate-900/40 p-4 shadow-sm 2xl:p-5 transition-colors duration-300">
            <div className="mb-5 flex flex-col gap-4 border-b border-slate-200 dark:border-slate-800 pb-4 lg:flex-row lg:items-center lg:justify-between 2xl:mb-6 2xl:pb-5">
              <div>
                <div className="mb-3 inline-flex rounded-lg border border-orange-200 dark:border-orange-950/40 bg-orange-50 dark:bg-orange-950/20 px-3 py-1 text-[10px] font-bold uppercase text-orange-500 dark:text-orange-400">
                  Editando permisos
                </div>
                <h2 className="text-2xl font-light text-slate-900 dark:text-slate-100 xl:text-3xl 2xl:text-4xl">
                  {selectedData?.role ?? "Sin roles"}
                </h2>
              </div>

              <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                <Agregar
                  onClick={() => setCreateRoleOpen(true)}
                  label="Agregar nuevo rol"
                  Icon={UserPlus}
                  className="px-4 py-2"
                />
                <button
                  type="button"
                  onClick={() => setPermissionModalOpen(true)}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 sm:w-auto"
                >
                  <Plus size={18} />
                  Agregar permiso
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 2xl:gap-5">
              {loadingRoles ? (
                <div className="rounded-lg border border-slate-200 bg-white p-4">
                  <Loading label="Cargando permisos..." />
                </div>
              ) : selectedData ? (
                permissionGroups.map((group) => (
                  <PermissionCard
                    key={group.key}
                    title={group.title}
                    subtitle={group.subtitle}
                    items={group.items}
                    countByCategory={group.key === "permisos_especiales"}
                    savingMap={savingPermissions}
                    onToggle={handleTogglePermission}
                    isItemDisabled={isSubmenuPermissionDisabled}
                    onEdit={
                      ["others", "permisos_especiales"].includes(group.key)
                        ? handleEditPermission
                        : undefined
                    }
                  />
                ))
              ) : (
                <div className="rounded-lg border border-dashed border-slate-200 bg-white px-4 py-6 text-center text-sm text-slate-500">
                  No hay roles para mostrar.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <ModalFiltro
        open={createRoleOpen}
        onClose={() => {
          setCreateRoleOpen(false);
          setNewRoleName("");
        }}
        title="Agregar nuevo rol"
        subtitle="Crea un rol y agregalo al listado del sistema"
        footer={
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => {
                setCreateRoleOpen(false);
                setNewRoleName("");
              }}
              className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Cancelar
            </button>
            <Agregar
              onClick={handleCreateRole}
              label="Guardar rol"
              Icon={UserPlus}
              className="px-4 py-2 sm:w-auto"
            />
          </div>
        }
      >
        <div className="space-y-4 normal-case">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">
              Nombre del rol
            </span>
            <input
              type="text"
              value={newRoleName}
              onChange={(event) => setNewRoleName(event.target.value)}
              placeholder="Ej: Coordinador regional"
              className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-slate-300"
            />
          </label>
        </div>
      </ModalFiltro>

      <ModalFiltro
        open={editRoleOpen}
        onClose={() => {
          setEditRoleOpen(false);
          setEditRoleName("");
        }}
        title="Editar rol"
        subtitle="Actualiza el nombre del rol seleccionado"
        footer={
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => {
                setEditRoleOpen(false);
                setEditRoleName("");
              }}
              className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Cancelar
            </button>
            <Agregar
              onClick={handleEditRole}
              label="Guardar cambios"
              Icon={Save}
              className="px-4 py-2 sm:w-auto"
            />
          </div>
        }
      >
        <div className="space-y-4 normal-case">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">
              Nombre del rol
            </span>
            <input
              type="text"
              value={editRoleName}
              onChange={(event) => setEditRoleName(event.target.value)}
              placeholder="Ej: Coordinador regional"
              className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-slate-300"
            />
          </label>
        </div>
      </ModalFiltro>

      <ModalFiltro
        open={permissionModalOpen}
        onClose={resetPermissionModal}
        title={editingPermissionId ? "Editar permiso" : "Agregar permiso"}
        subtitle="Gestiona permisos desde permisos"
        footer={
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={resetPermissionModal}
              className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSavePermission}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-600"
            >
              <FilePenLine size={18} />
              {editingPermissionId ? "Guardar cambios" : "Agregar permiso"}
            </button>
          </div>
        }
      >
        <div className="space-y-4 normal-case">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Nombre</span>
            <input
              type="text"
              value={permissionForm.nombre}
              onChange={(event) =>
                setPermissionForm((prev) => {
                  const nextNombre = event.target.value;
                  return {
                    ...prev,
                    nombre: nextNombre,
                    clave: normalizeCode(nextNombre),
                  };
                })
              }
              placeholder="Ej: Exportar reportes"
              className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-slate-300"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">Clave o codigo</span>
            <input
              type="text"
              value={permissionForm.clave}
              readOnly
              placeholder="Ej: exportar_reportes"
              className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-700 outline-none"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">Ubicacion</span>
            <select
              value={permissionForm.section}
              onChange={(event) =>
                setPermissionForm((prev) => ({
                  ...prev,
                  section: event.target.value,
                  parent_id: event.target.value === "submenu" ? prev.parent_id : "",
                }))
              }
              className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-slate-300"
            >
              <option value="permisos_especiales">PERMISOS ESPECIALES</option>
              <option value="menu">MENU LATERAL</option>
              <option value="submenu">SUBMENU</option>
            </select>
          </label>

          {permissionForm.section === "submenu" ? (
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Menu padre</span>
              <select
                value={permissionForm.parent_id}
                onChange={(event) =>
                  setPermissionForm((prev) => ({ ...prev, parent_id: event.target.value }))
                }
                className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-slate-300"
              >
                <option value="">Selecciona menu</option>
                {menuParentOptions.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.nombre}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
        </div>
      </ModalFiltro>
    </section>
  );
}
