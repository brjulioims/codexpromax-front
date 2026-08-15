import { useEffect, useState } from "react";
import {
  Home,
  Bolt,
  ChevronDown,
  Menu,
  X,
  UserRoundSearch,
  Globe,
  PenTool,
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
  {
    code: "quality_asignador",
    icon: UserRoundSearch,
    label: "Quality / Asignador",
    childrenItems: [
      {
        code: "quality_asignador",
        label: "Expediente sin asignar",
        activeMatch: ["/quality_asignador/sin_asignar"],
        route: "/quality_asignador/sin_asignar",
      },
       {
        code: "quality_asignador",
        label: "Expediente Asignado",
        activeMatch: ["/quality_asignador"],
        route: "/quality_asignador",
      },
    ],
  },
  {
    code: "traduccion",
    icon: Globe,
    label: "Traducción",
    childrenItems: [
      {
        code: "quality_traduccion",
        label: "Asignaciones - Traducción",
        activeMatch: ["/asignaciones-traduccion"],
        route: "/asignaciones-traduccion",
      },
      {
        code: "mis_traducciones",
        label: "Mis Traducciones",
        activeMatch: ["/mis_traducciones"],
        route: "/mis_traducciones",
      },
      {
        code: "mis_auditorias_traduccion",
        label: "Mis Auditorías",
        activeMatch: ["/mis_auditorias_traduccion"],
        route: "/mis_auditorias_traduccion",
      },
    ],
  },
  {
    code: "redaccion",
    icon: PenTool,
    label: "Redacción",
    childrenItems: [
      {
        code: "quality_redaccion",
        label: "Asignaciones - Redacción",
        activeMatch: ["/asignaciones-redaccion"],
        route: "/asignaciones-redaccion",
      },
      {
        code: "mis_redacciones",
        label: "Mis Redacciones",
        activeMatch: ["/mis_redacciones"],
        route: "/mis_redacciones",
      },
      {
        code: "mis_auditorias_redaccion",
        label: "Mis Auditorías - Redacción",
        activeMatch: ["/mis_auditorias_redaccion"],
        route: "/mis_auditorias_redaccion",
      },
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
    <div className="relative mb-1">
      <button
        type="button"
        title={collapsed ? label : undefined}
        onClick={() => (hasChildren ? onToggleExpand?.() : onClick?.())}
        className={`group relative flex h-12 w-full items-center justify-between rounded-r-xl pl-4 pr-3 text-[14px] font-medium transition-all duration-200 ${
          isActive
            ? "bg-white/[0.07] text-[#fe7405] font-semibold"
            : "text-white/70 hover:bg-white/5 hover:text-white"
        } ${collapsed ? "justify-center pl-0 pr-0" : ""}`}
      >
        {isActive && !collapsed && (
          <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-[#fe7405]" />
        )}
        {isActive && collapsed && (
          <span className="absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full bg-[#fe7405]" />
        )}
        <span className={`flex items-center ${collapsed ? "" : "gap-3"} z-10`}>
          <span
            className={`inline-flex items-center justify-center rounded-lg transition-transform duration-200 group-hover:scale-105 ${
              isActive ? "text-[#fe7405]" : "text-white/50 group-hover:text-white"
            } ${collapsed ? "h-10 w-10" : "h-5 w-5"}`}
          >
            {Icon && <Icon size={19} strokeWidth={isActive ? 2.4 : 1.8} />}
          </span>

          {!collapsed && <span className="truncate tracking-[0.02em]">{label}</span>}
        </span>

        {hasChildren && !collapsed && (
          <ChevronDown
            size={15}
            className={`transition-transform duration-200 z-10 ${
              isActive
                ? "text-[#fe7405]/70 group-hover:text-[#fe7405]"
                : "text-white/30 group-hover:text-white/70"
            } ${isExpanded ? "rotate-180" : ""}`}
          />
        )}
      </button>

      {/* Render de Submenús */}
      {hasChildren && isExpanded && (
        <div
          className={
            collapsed
              ? "absolute left-[calc(100%-4px)] top-0 z-50 ml-3 w-56 space-y-0.5 rounded-2xl border border-white/10 bg-[#0a1233] p-2 shadow-2xl"
              : "mt-1.5 ml-6 space-y-1 pl-4 transition-all duration-200"
          }
        >
          {childrenItems.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={item.onClick}
              className={`relative block w-full rounded-lg px-3 py-2 text-left text-[13px] tracking-wide transition-all duration-150 ${
                item.active
                  ? "text-[#fe7405] font-semibold bg-[#fe7405]/10"
                  : "text-white/55 hover:bg-white/5 hover:text-white"
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
    if (enabledCodes.size === 0) return true;
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
      <div className="flex h-full flex-col overflow-hidden rounded-2xl bg-[#0a1233] shadow-[8px_0_30px_rgba(0,0,0,0.18)]">
      {/* HEADER: Área de Logo */}
      <div className="shrink-0 px-4 border-b border-white/5">
        <div className={`flex h-16 items-center ${collapsed ? "justify-center" : "justify-between"}`}>
          {!collapsed && (
            <button
              type="button"
              onClick={() => handleNavigate("/dashboard")}
              className="flex items-center gap-2 rounded-xl transition-transform duration-200 active:scale-95"
            >
              <div className="p-2">
                <span className="text-[1.05rem] font-black text-white tracking-[0.08em]">
                  IMSCONNECT
                </span>
              </div>
            </button>
          )}

          <button
            type="button"
            aria-label={open ? "Cerrar sidebar" : "Abrir sidebar"}
            onClick={onToggle}
            className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/80 transition-all duration-200 hover:bg-white/10 hover:text-white ${
              collapsed ? "mx-auto" : ""
            }`}
          >
            {open ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>
      </div>

      {/* LINKS DE NAVEGACIÓN */}
      <nav className="flex-1 space-y-1 overflow-y-auto pt-4 pb-4 pr-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {SIDEBAR_ITEMS.filter(canShow).map((item, index) => (
          <SidebarItem
            key={item.code ?? `sidebar-${index}`}
            icon={item.icon}
            label={item.label}
            collapsed={collapsed}
            active={item.activeMatch?.includes(activePath)}
            isExpanded={openSection === item.code}
            onToggleExpand={() => handleToggleSection(item.code)}
            onClick={item.route ? () => handleNavigate(item.route) : undefined}
            childrenItems={(item.childrenItems ?? []).map((child) => ({
                label: child.label,
                active: child.activeMatch.includes(activePath),
                onClick: () => handleNavigate(child.route),
              }))}
          />
        ))}
      </nav>

      {!collapsed && (
        <div className="p-4 border-t border-white/5 text-center">
          <p className="text-[10px] font-bold text-white/25 tracking-[0.18em] uppercase">{`CODEXPRO v${APP_VERSION}`}</p>
        </div>
      )}
      </div>
    </aside>
  );
}
