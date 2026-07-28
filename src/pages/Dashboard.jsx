import React from "react";
import { useEffect, useMemo } from "react";
import {
  Users,
  Gavel,
} from "lucide-react";
import { useMeQuery } from "../hooks/queries/useMeQuery";
import TextType from "../components/ui/TextType";
const REFERRAL_COLORS = ["#d15f03", "#0e183f", "#254094", "#cbd5e1", "#0ea5e9", "#22c55e"];

function StatCard({ title, value, icon: Icon,}) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-[0_2px_8px_rgba(14,24,63,0.02)] transition-all duration-300 hover:-translate-y-1 hover:border-[#d15f03]/30 hover:shadow-[0_12px_20px_-4px_rgba(209,95,3,0.08)]">
      
      {/* Resplandor ambiental de fondo en Hover */}
      <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-slate-50 dark:bg-slate-950 transition-all duration-500 group-hover:bg-[#d15f03]/5 group-hover:blur-md" />
      
      <div className="flex items-center justify-between">
        <div className="space-y-1">

          <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
            {title}
          </p>
          

          <h3 className="text-2xl font-black tracking-tight text-[#0e183f] dark:text-white">
            {value}
          </h3>

        </div>

        <div className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-[#0e183f]/70 dark:text-slate-300 transition-all duration-300 group-hover:border-[#d15f03]/20 group-hover:bg-[#d15f03] group-hover:text-white group-hover:shadow-[0_4px_12px_rgba(209,95,3,0.25)]">
          {Icon ? React.createElement(Icon, { size: 18, className: "transition-transform duration-300 group-hover:scale-110" }) : null}
        </div>
      </div>
    </div>
  );
}

// CONTENEDOR DE GRÁFICOS REFINADO 
function CardShell({ title, subtitle, right, children, className = "" }) {
  return (
    <div className={`rounded-xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-[0_2px_8px_rgba(14,24,63,0.02)] ${className}`}>
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold tracking-tight text-[#0e183f] dark:text-white">{title}</h3>
          {subtitle ? (
            <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-400">{subtitle}</p>
          ) : null}
        </div>
        {right}
      </div>
      {children}
    </div>
  );
}

function getStoredUserProfile() {
  const storedUser = localStorage.getItem("user");
  if (!storedUser) return { nombre: "Usuario", role: "" };
  try {
    const user = JSON.parse(storedUser);
    const rawRole = user?.role ?? user?.rol ?? user?.roles;
    return {
      nombre: user?.nombre || user?.name || user?.username || `${user?.first_name ?? ""} ${user?.last_name ?? ""}`.trim() || user?.email || "Usuario",
      role: (typeof rawRole === "string" ? rawRole : "") || rawRole?.nombre || rawRole?.name || user?.rolNombre || user?.rol_nombre || "",
    };
  } catch {
    return { nombre: "Usuario", role: "" };
  }
}

export default function Dashboard() {
  const { data: me } = useMeQuery();
  const userProfile = useMemo(() => {
    const storedProfile = getStoredUserProfile();
    if (!me) return storedProfile;
    const rawRole = me.rolNombre || me.role || me.rol || me.roles;
    const roleName =
      (typeof rawRole === "string" ? rawRole : "") ||
      rawRole?.nombre ||
      rawRole?.name ||
      storedProfile.role;
    return {
      nombre: me.nombre || me.name || me.username || storedProfile.nombre,
      role: roleName,
    };
  }, [me]);

  useEffect(() => {
    if (me) {
      let storedUser = null;
      try {
        const raw = localStorage.getItem("user");
        storedUser = raw ? JSON.parse(raw) : null;
      } catch {
        storedUser = null;
      }

      const storedPhoto =
        storedUser?.photo ||
        storedUser?.foto ||
        storedUser?.avatar ||
        storedUser?.imagen ||
        storedUser?.image ||
        storedUser?.photoURL ||
        "";
      const mePhoto =
        me?.photo ||
        me?.foto ||
        me?.avatar ||
        me?.imagen ||
        me?.image ||
        me?.photoURL ||
        "";
      const finalPhoto = mePhoto || storedPhoto || "";

      const userToStore = {
        ...storedUser,
        ...me,
        photo: finalPhoto,
      };

      // Limpieza de campos redundantes para ahorrar espacio (especialmente fotos base64)
      delete userToStore.foto;
      delete userToStore.avatar;
      delete userToStore.image;
      delete userToStore.imagen;
      delete userToStore.photoURL;

      try {
        localStorage.setItem("user", JSON.stringify(userToStore));
      } catch (error) {
        if (error.name === "QuotaExceededError") {
          console.warn("[Dashboard] LocalStorage quota exceeded, trimming user object...");
          delete userToStore.raw;
          try {
            localStorage.setItem("user", JSON.stringify(userToStore));
          } catch (secondError) {
            console.error("[Dashboard] Critical: LocalStorage full even after trimming", secondError);
          }
        }
      }
    }
  }, [me]);

  return (
    <div className="flex flex-col space-y-5 w-full min-h-[calc(100vh-130px)]">
      
      {/*BANNER DE BIENVENIDA CON LOGO ASIGNO OCUPANDO TODO EL ESPACIO RESTANTE*/}
      <div className="relative flex-1 overflow-hidden rounded-xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-[0_2px_8px_rgba(14,24,63,0.02)] flex flex-col items-center justify-center text-center transition-all duration-300 hover:border-slate-300/80 dark:hover:border-slate-700">
        {/* Fondo decorativo sutil */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-50/30 via-white to-white dark:from-slate-950/20 dark:via-slate-900 dark:to-slate-900 pointer-events-none" />
        
        <div className="relative z-10 flex flex-col items-center space-y-5">
          {/* Contenedor del Gavelio con mejor proporción */}
          <div className="flex h-48 w-48 items-center justify-center p-4 rounded-full bg-[#0e183f]/10 dark:bg-white/5 transition-transform duration-300 hover:scale-105">
            <Gavel size={80} className="text-[#0e183f] dark:text-white animate-pulse" />
          </div>
          
          <div className="space-y-2">
              <TextType 
                text={["¡Te damos la bienvenida al panel de control!"]}
                className="text-2xl font-black text-[#0e183f] dark:text-white sm:text-4xl"
                typingSpeed={170}
                pauseDuration={1500}
                showCursor
                cursorCharacter="_"
                texts={["Welcome! Good to see you!","Manage your schedules and events!"]}
                deletingSpeed={50}
                variableSpeedEnabled={false}
                variableSpeedMin={60}
                variableSpeedMax={120}
                cursorBlinkDuration={0.5}
              />
            <p className="text-sm text-slate-400 dark:text-slate-400 max-w-lg leading-relaxed text-center mx-auto">
              Gestiona tus controles de seguimiento, actividades y eventos de manera centralizada y eficiente desde un solo lugar.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
