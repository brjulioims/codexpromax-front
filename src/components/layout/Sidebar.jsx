import { useEffect, useState } from "react";
import {
  Home,
  Bolt,
  ChevronDown,
  Menu,
  X,
} from "lucide-react";
import packageJson from "../../../package.json";

const ENABLED_PERMISSIONS_STORAGE_KEY = "enabledPermissionCodes";
const APP_VERSION = packageJson.version;

const SIDEBAR_ITEMS = [
  {
    code: "dashboard",
    icon: Home,
    label: "Inicio",
    activeMatch: ["/dashboard"],
    route: "/dashboard",
  },
  {
    code: "mantenimiento",
    icon: Bolt,
    label: "Mantenimiento",
    childrenItems: [
      {
        code: "usuarios",
        label: "Usuarios",
        activeMatch: ["/usuarios"],
        route: "/usuarios",
      },
      {
        code: "configuracion",
        label: "Configuración",
        activeMatch: ["/configuracion"],
        route: "/configuracion",
      }
    ],
  },
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

function SidebarItem({
  icon: Icon,
  label,
  active = false,
  childrenItems = [],
  onClick,
  collapsed = false,
  isExpanded = false,
  onToggleExpand,
}) {
  const hasChildren = childrenItems.length > 0;
  const hasActiveChild = hasChildren ? childrenItems.some((item) => item.active) : false;

  const isActive = active || hasActiveChild;

  return (
    <div className="relative mb-1 px-2">
      <button
        type="button"
        title={collapsed ? label : undefined}
        onClick={() => (hasChildren ? onToggleExpand?.() : onClick?.())}
        className={`group flex h-11 w-full items-center justify-between rounded-xl px-3 text-[14px] font-medium transition-all duration-200 relative ${
          isActive
            ? "bg-[#fe7405] text-white font-semibold shadow-[0_8px_16px_rgba(254,116,5,0.25)]"
            : "text-white/70 hover:bg-white/10 hover:text-white"
        } ${collapsed ? "justify-center px-0" : ""}`}
      >
        <span className={`flex items-center ${collapsed ? "" : "gap-3"} z-10`}>
          <span
            className={`inline-flex items-center justify-center rounded-lg transition-transform duration-200 group-hover:scale-102 ${
              isActive ? "text-white" : "text-white/50 group-hover:text-white"
            } ${collapsed ? "h-9 w-9" : "h-5 w-5"}`}
          >
            {Icon && <Icon size={18} strokeWidth={isActive ? 2.5 : 1.8} />}
          </span>

          {!collapsed && <span className="truncate tracking-wide">{label}</span>}
        </span>

        {hasChildren && !collapsed && (
          <ChevronDown
            size={14}
            className={`text-white/40 transition-transform duration-200 z-10 group-hover:text-white ${
              isExpanded ? "rotate-180 text-white" : ""
            }`}
          />
        )}
      </button>

      {/* Render de Submenús */}
      {hasChildren && isExpanded && (
        <div
          className={
            collapsed
              ? "absolute left-[calc(100%-4px)] top-0 z-50 ml-3 w-54 space-y-0.5 rounded-xl border border-white/10 bg-[#0e183f] p-2 shadow-2xl"
              : "mt-1 ml-5 space-y-0.5 border-l-2 border-white/10 pl-3 transition-all duration-200"
          }
        >
          {childrenItems.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={item.onClick}
              className={`relative block w-full rounded-lg px-3 py-2 text-left text-[13px] tracking-wide transition-all duration-150 ${
                item.active
                  ? "text-[#fe7405] font-black bg-white/5"
                  : "text-white/60 hover:bg-white/5 hover:text-white"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Sidebar({
  open = false,
  activePath = "/",
  onNavigate,
  onClose,
  onToggle,
}) {
  const [, setPermissionsVersion] = useState(0);
  const storedEnabledCodes = getStoredEnabledPermissionCodes();

  const [openSection, setOpenSection] = useState(() => {
  const activeItem = SIDEBAR_ITEMS.find((item) =>
    item.childrenItems?.some((child) =>
      child.activeMatch.includes(activePath)
      )
    );

    return activeItem?.code ?? null;
  });
  
  const enabledCodes = storedEnabledCodes;

  useEffect(() => {
    const handlePermissionsUpdated = () => {
      setPermissionsVersion((current) => current + 1);
    };

    window.addEventListener("permissions-updated", handlePermissionsUpdated);
    window.addEventListener("storage", handlePermissionsUpdated);

    return () => {
      window.removeEventListener("permissions-updated", handlePermissionsUpdated);
      window.removeEventListener("storage", handlePermissionsUpdated);
    };
  }, []);

  const handleNavigate = (to) => {
    onNavigate?.(to);
    onClose?.();
  };

  const handleToggleSection = (code) => {
    setOpenSection((prev) => (prev === code ? null : code));
    if (!open) {
      onToggle?.();
    }
  };

  const collapsed = !open;
  const hasAnyEnabledChild = (item) =>
    (item.childrenItems ?? []).some(
      (child) => child.code && enabledCodes.has(normalizePermissionCode(child.code))
    );

  const isChildVisible = (item, child) => {
    if (!child.code) {
      return enabledCodes.has(normalizePermissionCode(item.code));
    }

    if (enabledCodes.has(normalizePermissionCode(item.code))) return true;

    const childCode = normalizePermissionCode(child.code);
    if (enabledCodes.has(childCode)) return true;
    
    return !hasAnyEnabledChild(item);
  };

  const canShow = (item) => {
    if (!(enabledCodes instanceof Set)) return false;
    const hasChildren = (item.childrenItems ?? []).length > 0;
    const selfAllowed = enabledCodes.has(normalizePermissionCode(item.code));
    const childAllowed = (item.childrenItems ?? []).some((child) =>
      isChildVisible(item, child)
    );
    return hasChildren ? selfAllowed || childAllowed : selfAllowed;
  };

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 flex flex-col p-3 text-white transition-[transform,width] duration-300 ease-in-out ${
        open
          ? "w-72 translate-x-0"
          : "w-24 -translate-x-full md:translate-x-0"
      }`}
    >
      <div className="flex h-full flex-col overflow-hidden rounded-xl  border-white bg-[#0e183f] shadow-[10px_0_25px_rgba(0,0,0,0.2)]">
      {/* HEADER: Área de Logo */}
      <div className="shrink-0 px-4 border-b border-white/5 bg-black/10">
        <div className={`flex h-20 items-center ${collapsed ? "justify-center" : "justify-between"}`}>
          {!collapsed && (
            <button
              type="button"
              onClick={() => handleNavigate("/dashboard")}
              className="flex items-center gap-2 rounded-xl transition-transform duration-200 active:scale-95"
            >
              <div className="p-2">
                <span className="text-xl font-black text-white tracking-wider">
                  CODEXPRO
                </span>
              </div>
            </button>
          )}

          <button
            type="button"
            aria-label={open ? "Cerrar sidebar" : "Abrir sidebar"}
            onClick={onToggle}
            className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white transition-all duration-200 hover:bg-white/10 hover:text-white shadow-sm ${
              collapsed ? "mx-auto" : ""
            }`}
          >
            {open ? <X size={15} /> : <Menu size={15} />}
          </button>
        </div>
      </div>

      {/* LINKS DE NAVEGACIÓN */}
      <nav className="flex-1 space-y-1 overflow-y-auto pt-5 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {SIDEBAR_ITEMS.filter((item) => canShow(item)).map((item, index) => (
          <SidebarItem
            key={item.code ?? `sidebar-${index}`}
            icon={item.icon}
            label={item.label}
            collapsed={collapsed}
            active={item.activeMatch?.includes(activePath)}
            isExpanded={openSection === item.code}
            onToggleExpand={() => handleToggleSection(item.code)}
            onClick={item.route ? () => handleNavigate(item.route) : undefined}
            childrenItems={(item.childrenItems ?? [])
              .filter((child) => isChildVisible(item, child))
              .map((child) => ({
                label: child.label,
                active: child.activeMatch.includes(activePath),
                onClick: () => handleNavigate(child.route),
              }))}
          />
        ))}
      </nav>

      {!collapsed && (
        <div className="p-4 border-t border-white/5 bg-black/10 text-center">
          <p className="text-[10px] font-bold text-white/30 tracking-wider">{`CODEXPRO v${APP_VERSION}`}</p>
        </div>
      )}
      </div>
    </aside>
  );
}
