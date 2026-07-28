import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
  Loader2,
  ShieldCheck,
  LockKeyhole,
  LayoutDashboard,
} from "lucide-react";

import { getMe } from "../services/meService";
import { queryClient } from "../utils/queryClient";
import { queryKeys } from "../utils/queryKeys";
import {
  clearPendingAzureLogin,
  completeAzureLogin,
  hasPendingAzureLogin,
  loginAzure,
} from "../services/loginAzureService";

const ACCENT = "#d15f03";
const RADIUS = 54;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const MONTION = motion;
const ENABLED_PERMISSIONS_STORAGE_KEY = "enabledPermissionCodes";
const ENABLED_PERMISSION_IDS_STORAGE_KEY = "enabledPermissionIds";
const PERMISSION_IDS_BY_CODE_STORAGE_KEY = "permissionIdsByCode";

function resolveSessionToken(data) {
  return `${(
    data?.token ??
    data?.access_token ??
    data?.jwt ??
    data?.data?.token ??
    data?.data?.access_token ??
    data?.user?.token ??
    data?.usuario?.token ??
    ""
  )}`.trim();
}

const STEPS = [
  {
    id: 1,
    number: "01",
    text: "INICIANDO SESIÓN",
    description: "Preparando acceso seguro",
    icon: LockKeyhole,
  },
  {
    id: 2,
    number: "02",
    text: "VALIDANDO CREDENCIALES",
    description: "Comprobando tu información",
    icon: Loader2,
  },
  {
    id: 3,
    number: "03",
    text: "CARGANDO DASHBOARD",
    description: "Configurando tu espacio de trabajo",
    icon: LayoutDashboard,
  },
];

function normalizeResolvedUser(user, roleName = "") {
  return {
    id: user?.id ?? null,
    nombre: user?.nombre || user?.name || user?.username || "",
    username: user?.username || "",
    email: user?.email || "",
    photo:
      user?.photo ||
      user?.foto ||
      user?.avatar ||
      user?.imagen ||
      user?.image ||
      user?.photoURL ||
      "",
    first_name: user?.first_name || "",
    last_name: user?.last_name || "",
    rolId: user?.rolId ?? user?.rol_id ?? null,
    rolNombre: roleName || user?.rolNombre || user?.rol_nombre || user?.role || "",
    role: roleName || user?.rolNombre || user?.rol_nombre || user?.role || "",
  };
}

function normalizePermissionCode(value) {
  return `${value ?? ""}`.trim().toLowerCase();
}

function storeEnabledPermissionCodes(role) {
  const permissions = role?.permisos ?? role?.raw?.permisos ?? [];
  const enabledCodes = (role?.permisos ?? role?.raw?.permisos ?? [])
    .filter((permission) => permission.valor)
    .map((permission) =>
      normalizePermissionCode(permission.clave ?? permission.codigo ?? permission.nombre)
    );
  const permissionIdsByCode = Object.fromEntries(
    permissions
      .map((permission) => [
        normalizePermissionCode(
          permission?.clave ?? permission?.codigo ?? permission?.nombre
        ),
        Number(permission?.id),
      ])
      .filter(([code, id]) => code && Number.isFinite(id))
  );

  localStorage.setItem(
    ENABLED_PERMISSIONS_STORAGE_KEY,
    JSON.stringify(enabledCodes)
  );
  localStorage.setItem(
    ENABLED_PERMISSION_IDS_STORAGE_KEY,
    JSON.stringify(
      (role?.permisos ?? role?.raw?.permisos ?? [])
        .filter((permission) => permission.valor)
        .map((permission) => Number(permission?.id))
        .filter((id) => Number.isFinite(id))
    )
  );
  localStorage.setItem(
    PERMISSION_IDS_BY_CODE_STORAGE_KEY,
    JSON.stringify(permissionIdsByCode)
  );
}

function normalizeSessionUser(data) {
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
    username: rawUser?.username ?? data?.username ?? "",
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
  };
}

function clearAuthSession() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("sessionIdentifier");
  localStorage.removeItem("rememberSession");
  localStorage.removeItem(ENABLED_PERMISSIONS_STORAGE_KEY);
  localStorage.removeItem(ENABLED_PERMISSION_IDS_STORAGE_KEY);
  localStorage.removeItem(PERMISSION_IDS_BY_CODE_STORAGE_KEY);
}

function ensureActiveSessionUser(data) {
  const rawUser = data?.user ?? data?.usuario ?? data ?? {};
  const status = Number(rawUser?.estatus ?? rawUser?.estado ?? 1);

  if (!rawUser?.id && !rawUser?.email && !rawUser?.username) {
    throw new Error("Tu usuario no está registrado.");
  }

  if (status !== 1) {
    throw new Error("Tu usuario está inactivo.");
  }

  return rawUser;
}

function resolveAuthErrorMessage(error) {
  const rawMessage = `${error?.message ?? error ?? ""}`.trim().toUpperCase();

  if (
    rawMessage.includes("USER_DISABLED") ||
    rawMessage.includes("USER_NOT_FOUND") ||
    rawMessage.includes("NOT_REGISTERED") ||
    rawMessage.includes("NO REGISTRADO")
  ) {
    return "Tu usuario no está registrado.";
  }

  return error?.message || "No se pudo iniciar sesión con Microsoft.";
}

export default function AuthTransition({ onComplete }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    let active = true;
    let timer = null;

    const animationDone = new Promise((resolve) => {
      timer = setInterval(() => {
        setStep((prev) => {
          if (prev === STEPS.length - 1) {
            clearInterval(timer);
            setTimeout(resolve, 900);
            return prev;
          }

          return prev + 1;
        });
      }, 1300);
    });

    const preloadUser = async () => {
      if (hasPendingAzureLogin()) {
        try {
          const azureSession = await completeAzureLogin();

          if (azureSession?.idToken) {
            const data = await loginAzure({
              idToken: azureSession.idToken,
              accessToken: azureSession.accessToken,
            });
            const activeUser = ensureActiveSessionUser(data);

            const sessionToken = resolveSessionToken(data);

            if (sessionToken) {
              localStorage.setItem("token", sessionToken);
            } else {
              throw new Error("Backend no devolvio token");
            }

            localStorage.setItem(
              "user",
              JSON.stringify(
                normalizeSessionUser({
                  ...data,
                  user: data?.user ?? data?.usuario ?? activeUser,
                })
              )
            );
            localStorage.setItem(
              "sessionIdentifier",
              `${
                azureSession.account?.username ??
                activeUser?.email ??
                activeUser?.username ??
                data?.email ??
                ""
              }`.trim()
            );
            localStorage.setItem("rememberSession", "true");
          }
        } catch (error) {
          clearAuthSession();
          clearPendingAzureLogin();
          toast.error(resolveAuthErrorMessage(error));
        }
      }

      const storedUser = localStorage.getItem("user");
      if (!storedUser && !localStorage.getItem("token")) return;

      let parsedUser = null;

      try {
        parsedUser = storedUser ? JSON.parse(storedUser) : null;
      } catch {
        parsedUser = null;
      }

      const me = await queryClient.fetchQuery({
        queryKey: queryKeys.me.all,
        queryFn: getMe,
        staleTime: 1000 * 60 * 30,
      }).catch(() => null);
      const user = me
        ? {
            ...parsedUser,
            ...me,
            photo:
              me?.photo ||
              parsedUser?.photo ||
              parsedUser?.foto ||
              parsedUser?.avatar ||
              parsedUser?.imagen ||
              parsedUser?.image ||
              parsedUser?.photoURL ||
              "",
          }
        : parsedUser;
      if (!user) return;

      localStorage.setItem(
        "user",
        JSON.stringify(normalizeResolvedUser(user, user?.rolNombre))
      );
      storeEnabledPermissionCodes(user);
    };

    Promise.allSettled([animationDone, preloadUser()]).then(() => {
      if (active) onComplete?.();
    });

    return () => {
      active = false;
      if (timer) clearInterval(timer);
    };
  }, [onComplete]);

  const progress = (step + 1) / STEPS.length;
  const strokeDashoffset = CIRCUMFERENCE * (1 - progress);

  const CurrentIcon = STEPS[step].icon;
  const isLoadingStep = STEPS[step].id === 2;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden px-6"
      style={{
        backgroundColor: "#060b1f",
        fontFamily: "'Outfit', system-ui, sans-serif",
      }}
    >
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600&display=swap');

          .noise-layer {
            background-image:
              radial-gradient(circle at 1px 1px, rgba(255,255,255,0.16) 1px, transparent 0);
            background-size: 4px 4px;
            opacity: 0.035;
          }
        `}
      </style>

      <motion.div
        className="absolute -right-32 top-1/2 h-[32rem] w-[32rem] -translate-y-1/2 rounded-full blur-[120px]"
        style={{ backgroundColor: ACCENT }}
        animate={{
          x: [-20, 35, -20],
          y: [-30, 30, -30],
          opacity: [0.16, 0.28, 0.16],
          scale: [1, 1.08, 1],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <div className="noise-layer pointer-events-none absolute inset-0" />

      <AnimatePresence mode="wait">
        <motion.div
          key={STEPS[step].number}
          className="pointer-events-none absolute select-none text-[13rem] font-light leading-none tracking-[-0.08em] text-white/[0.035] md:text-[20rem]"
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 1.04, y: -20 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          {STEPS[step].number}
        </motion.div>
      </AnimatePresence>

      <div className="relative flex w-full max-w-xl flex-col items-center text-center">
        <div className="mb-14 flex items-center gap-3 text-[11px] font-light uppercase tracking-[0.45em] text-white/35">
          <ShieldCheck className="h-4 w-4" style={{ color: ACCENT }} />
          Acceso seguro
        </div>

        <div className="relative mb-10 flex h-36 w-36 items-center justify-center">
          <svg
            className="absolute inset-0 h-full w-full -rotate-90"
            viewBox="0 0 128 128"
          >
            <circle
              cx="64"
              cy="64"
              r={RADIUS}
              fill="none"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="1.5"
            />

            <motion.circle
              cx="64"
              cy="64"
              r={RADIUS}
              fill="none"
              stroke={ACCENT}
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              initial={{ strokeDashoffset: CIRCUMFERENCE }}
              animate={{ strokeDashoffset }}
              transition={{
                type: "spring",
                stiffness: 80,
                damping: 18,
              }}
            />
          </svg>

          <AnimatePresence mode="wait">
            <motion.div
              key={STEPS[step].id}
              initial={{ opacity: 0, scale: 0.72, rotate: -10 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.72, rotate: 10 }}
              transition={{
                type: "spring",
                stiffness: 240,
                damping: 18,
              }}
              className="flex h-20 w-20 items-center justify-center rounded-full border border-white/10 bg-[#060b1f]"
            >
              <CurrentIcon
                className={`h-8 w-8 text-white ${
                  isLoadingStep ? "animate-spin" : ""
                }`}
                strokeWidth={1.5}
              />
            </motion.div>
          </AnimatePresence>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={STEPS[step].text}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -18 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
          >
            <h1 className="text-2xl font-light uppercase tracking-[0.28em] text-white md:text-3xl">
              {STEPS[step].text}
            </h1>

            <p className="mt-4 text-sm font-light tracking-[0.18em] text-white/40">
              {STEPS[step].description}
            </p>
          </motion.div>
        </AnimatePresence>

        <div className="mt-16 flex items-center justify-center">
          {STEPS.map((item, index) => {
            const active = index === step;
            const completed = index < step;

            return (
              <div key={item.id} className="flex items-center">
                <motion.div
                  className="relative flex h-4 w-4 items-center justify-center rounded-full"
                  animate={{
                    scale: active ? [1, 1.2, 1] : 1,
                  }}
                  transition={{
                    duration: 1.2,
                    repeat: active ? Infinity : 0,
                    ease: "easeInOut",
                  }}
                >
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{
                      backgroundColor:
                        active || completed ? ACCENT : "rgba(255,255,255,0.18)",
                    }}
                  />

                  {active && (
                    <motion.div
                      className="absolute inset-0 rounded-full border"
                      style={{ borderColor: ACCENT }}
                      initial={{ scale: 0.8, opacity: 0.8 }}
                      animate={{ scale: 1.8, opacity: 0 }}
                      transition={{
                        duration: 1.2,
                        repeat: Infinity,
                        ease: "easeOut",
                      }}
                    />
                  )}
                </motion.div>

                {index < STEPS.length - 1 && (
                  <div className="mx-4 h-px w-14 overflow-hidden bg-white/10">
                    <motion.div
                      className="h-full"
                      style={{ backgroundColor: ACCENT }}
                      initial={{ width: "0%" }}
                      animate={{ width: index < step ? "100%" : "0%" }}
                      transition={{
                        duration: 0.5,
                        ease: "easeOut",
                      }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
