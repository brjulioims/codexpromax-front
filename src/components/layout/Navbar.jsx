import { useEffect, useMemo, useRef, useState } from "react";
import { LogOut, User, ChevronDown, LayoutDashboard, Sun, Moon } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import Swal from "sweetalert2";
import { useMeQuery } from "../../hooks/queries/useMeQuery";
import { queryKeys } from "../../utils/queryKeys";
import { useTheme } from "../../hooks/useTheme";

function resolveDisplayName(user) {
  return (
    user?.nombre || user?.name || user?.username ||
    `${user?.first_name ?? ""} ${user?.last_name ?? ""}`.trim() ||
    user?.email || "Usuario"
  );
}

function resolveDisplayRole(user) {
  const rawRole = user?.role ?? user?.rol ?? user?.roles;
  return (
    (typeof rawRole === "string" ? rawRole : "") ||
    rawRole?.nombre || rawRole?.name || user?.rolNombre || user?.rol_nombre || ""
  );
}

function resolveDisplayPhoto(user) {
  return user?.foto || user?.avatar || user?.imagen || user?.image || user?.photo || user?.photoURL || "";
}

function resolvePhotoUrl(user) {
  let rawPhoto = resolveDisplayPhoto(user);
  if (!rawPhoto || typeof rawPhoto !== "string") return "";
  rawPhoto = rawPhoto.trim();
  if (
    rawPhoto.startsWith("data:image") || rawPhoto.startsWith("http://") ||
    rawPhoto.startsWith("https://") || rawPhoto.startsWith("blob:")
  ) {
    return rawPhoto;
  }
  const jpgIndex = rawPhoto.indexOf("/9j/");
  if (jpgIndex >= 0) rawPhoto = rawPhoto.slice(jpgIndex);
  return `data:image/jpeg;base64,${rawPhoto}`;
}

function getStoredCurrentUser() {
  const storedUser = localStorage.getItem("user");
  if (!storedUser) return { nombre: "Usuario", role: "", foto: "" };
  try {
    const parsedUser = JSON.parse(storedUser);
    return {
      nombre: resolveDisplayName(parsedUser),
      role: resolveDisplayRole(parsedUser),
      foto: resolvePhotoUrl(parsedUser),
    };
  } catch {
    return { nombre: "Usuario", role: "", foto: "" };
  }
}

function getStoredCurrentUserRaw() {
  const storedUser = localStorage.getItem("user");
  if (!storedUser) return null;
  try {
    return JSON.parse(storedUser);
  } catch {
    return null;
  }
}

export default function Navbar() {
  const { isDark, toggleTheme } = useTheme();
  const queryClient = useQueryClient();
  const { data: me } = useMeQuery();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const menuRef = useRef(null);

  const mergedUser = useMemo(() => {
    const storedUser = getStoredCurrentUserRaw();
    if (!me) return storedUser;

    const storedPhoto = resolveDisplayPhoto(storedUser);
    const mePhoto = resolveDisplayPhoto(me);
    const finalPhoto = mePhoto || storedPhoto || "";

    // Creamos un objeto limpio para evitar duplicación masiva de datos (como base64 de fotos)
    const result = {
      ...storedUser,
      ...me,
      photo: finalPhoto,
    };

    // Eliminamos claves duplicadas que podrían contener la misma foto pesada
    delete result.foto;
    delete result.avatar;
    delete result.image;
    delete result.imagen;
    delete result.photoURL;

    return result;
  }, [me]);

  const currentUser = useMemo(() => {
    if (!mergedUser) return getStoredCurrentUser();
    return {
      nombre: resolveDisplayName(mergedUser),
      role: mergedUser.rolNombre || resolveDisplayRole(mergedUser),
      foto: resolvePhotoUrl(mergedUser),
    };
  }, [mergedUser]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (mergedUser) {
        try {
          localStorage.setItem("user", JSON.stringify(mergedUser));
        } catch (error) {
          if (error.name === "QuotaExceededError") {
            console.warn("LocalStorage quota exceeded, trimming user object...");
            // Fallback: intentar guardar sin el campo 'raw' si existe
            const trimmed = { ...mergedUser };
            delete trimmed.raw;
            try {
              localStorage.setItem("user", JSON.stringify(trimmed));
            } catch (secondError) {
              console.error("Critical: LocalStorage full even after trimming", secondError);
            }
          }
        }
      }
    }, 500); // Debounce para evitar escrituras excesivas

    return () => clearTimeout(timeout);
  }, [mergedUser]);

  const handleLogout = async () => {
    const result = await Swal.fire({
      title: "Cerrar sesión",
      text: "¿Quieres cerrar sesión?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sí, cerrar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#d15f03",
      cancelButtonColor: "#0e183f",
      background: "#ffffff",
      color: "#0f172a",
    });

    if (!result.isConfirmed) return;

    try {
      await fetch("/api/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Error al cerrar sesion en el servidor", error);
    }

    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("sessionIdentifier");
    localStorage.removeItem("rememberSession");
    queryClient.removeQueries({ queryKey: queryKeys.me.all });

    setDropdownOpen(false);
    window.location.replace("/login");
  };

  return (
    <header className="sticky top-0 z-[60] w-full bg-slate-100 dark:bg-slate-950 px-3 py-3 sm:px-5 transition-colors duration-300">
      {/* Línea decorativa superior hiper-llamativa pero delgada */}
      <div className="mx-auto flex h-16 max-w-full items-center justify-between rounded-xl border-1 border-white bg-[#0e183f] px-4 shadow-[0_10px_30px_rgba(0,0,0,0.22)] sm:px-6 lg:px-8">
        
        {/* Logo Impactante */}
        <div className="flex items-center">
          <p
              className="group relative flex flex-col leading-none transition-all duration-300"
          >
            <span className="text-[1.1rem] font-black uppercase tracking-tight text-white transition-colors duration-300 group-hover:text-[#d15f03]">
              Immigration Solution Connect
            </span>
          </p>
        </div>

        {/* Zona de Interacción Central/Derecha */}
        <div className="flex items-center gap-4">
          
          {/* Botón de Notificaciones (Añade dinamismo visual y balancea el diseño) */}
          <button 
            type="button" 
            className="relative rounded-xl p-2 text-white/60 transition-all hover:bg-white/5 hover:text-white"
          >
          </button>

          {/* Botón de Modo Oscuro con micro-animaciones */}
          <button
            type="button"
            onClick={toggleTheme}
            className="relative rounded-xl p-2 text-white/60 transition-all hover:bg-white/5 hover:text-white active:scale-95"
            aria-label="Cambiar tema"
          >
            {isDark ? (
              <Sun size={18} className="transition-transform duration-300 hover:rotate-45" />
            ) : (
              <Moon size={18} className="transition-transform duration-300 hover:rotate-12" />
            )}
          </button>

          {/* Separador vertical sutil */}
          <div className="h-6 w-[1px] bg-white/10" />

          {/* Contenedor del Dropdown */}
          <div ref={menuRef} className="relative">
            
            {/* Trigger del Perfil con Glow Activo */}
            <button
              type="button"
              onClick={() => setDropdownOpen((prev) => !prev)}
              className={`group flex items-center gap-3 rounded-xl border p-1.5 pr-3 transition-all duration-200 focus:outline-none w-fit ${
                dropdownOpen 
                  ? "border-[#d15f03]/40 bg-white/10 shadow-[0_0_15px_rgba(209,95,3,0.12)]" 
                  : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/5"
              }`}
            >
              {/* Avatar con borde contrastado */}
              <div className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-[#0e183f] text-white">
                {currentUser.foto ? (
                  <img
                    src={currentUser.foto}
                    alt={currentUser.nombre}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <User size={16} className="text-white/60" />
                )}
              </div>

              {/* Textos del Usuario */}
              <div className="hidden flex-col text-left md:flex">
                <span className="max-w-fit truncate text-xs font-bold tracking-tight text-white group-hover:text-white/90">
                  {currentUser.nombre}
                </span>
                {currentUser.role && (
                  <span className="max-w-fit truncate text-[10px] font-semibold uppercase tracking-wider text-[#d15f03]">
                    {currentUser.role}
                  </span>
                )}
              </div>

              <ChevronDown 
                size={14} 
                className={`text-white/40 transition-transform duration-200 group-hover:text-white/80 ${
                  dropdownOpen ? "rotate-180 text-[#d15f03]" : ""
                }`}
              />
            </button>

            {/* Menú Desplegable Flotante Dark-Mode */}
            {dropdownOpen && (
              <div className="absolute right-0 top-12 z-50 mt-2 w-56 origin-top-right rounded-xl border border-white/10 bg-[#0e183f] p-1.5 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                
                {/* Info móvil */}
                <div className="px-3 py-2 border-b border-white/5 md:hidden">
                  <p className="text-sm font-bold text-white truncate">{currentUser.nombre}</p>
                  <p className="text-xs font-semibold text-[#d15f03] truncate uppercase tracking-wider">{currentUser.role}</p>
                </div>

                {/* Logout destructivo pero integrado */}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-red-400 transition-colors hover:bg-red-500/10 hover:text-red-300"
                >
                  <LogOut size={16} className="text-red-400/80" />
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </div>

      </div>
    </header>
  );
}
