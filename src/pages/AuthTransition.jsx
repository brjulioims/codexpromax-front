import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import toast from "react-hot-toast";
import {
  Check,
  LayoutDashboard,
  Loader2,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
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
const MONTION = motion;
const ENABLED_PERMISSIONS_STORAGE_KEY = "enabledPermissionCodes";
const ENABLED_PERMISSION_IDS_STORAGE_KEY = "enabledPermissionIds";
const PERMISSION_IDS_BY_CODE_STORAGE_KEY = "permissionIdsByCode";

const STEPS = [
  {
    id: 1,
    number: "01",
    shortText: "Acceso",
    text: "INICIANDO SESIÓN",
    description: "Preparando una conexión segura",
    icon: LockKeyhole,
  },
  {
    id: 2,
    number: "02",
    shortText: "Validación",
    text: "VALIDANDO CREDENCIALES",
    description: "Comprobando tu información",
    icon: ShieldCheck,
  },
  {
    id: 3,
    number: "03",
    shortText: "Dashboard",
    text: "CARGANDO DASHBOARD",
    description: "Configurando tu espacio de trabajo",
    icon: LayoutDashboard,
  },
];

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
    rolNombre:
      roleName ||
      user?.rolNombre ||
      user?.rol_nombre ||
      user?.role ||
      "",
    role:
      roleName ||
      user?.rolNombre ||
      user?.rol_nombre ||
      user?.role ||
      "",
  };
}

function normalizePermissionCode(value) {
  return `${value ?? ""}`.trim().toLowerCase();
}

function storeEnabledPermissionCodes(role) {
  const permissions = role?.permisos ?? role?.raw?.permisos ?? [];

  const enabledCodes = permissions
    .filter((permission) => permission.valor)
    .map((permission) =>
      normalizePermissionCode(
        permission.clave ??
          permission.codigo ??
          permission.nombre
      )
    );

  const permissionIdsByCode = Object.fromEntries(
    permissions
      .map((permission) => [
        normalizePermissionCode(
          permission?.clave ??
            permission?.codigo ??
            permission?.nombre
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
      permissions
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
    rawUser?.role ??
    rawUser?.rol ??
    rawUser?.roles ??
    data?.role ??
    data?.rol;

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
    id:
      rawUser?.id ??
      rawUser?.usuario_id ??
      rawUser?.user_id ??
      data?.id ??
      null,
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
  const rawMessage = `${error?.message ?? error ?? ""}`
    .trim()
    .toUpperCase();

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
    let resolveTimer = null;

    const animationDone = new Promise((resolve) => {
      timer = setInterval(() => {
        setStep((previousStep) => {
          if (previousStep === STEPS.length - 1) {
            clearInterval(timer);

            resolveTimer = setTimeout(() => {
              resolve();
            }, 900);

            return previousStep;
          }

          return previousStep + 1;
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

            if (!sessionToken) {
              throw new Error("Backend no devolvió token");
            }

            localStorage.setItem("token", sessionToken);

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
      const storedToken = localStorage.getItem("token");

      if (!storedUser && !storedToken) {
        return;
      }

      let parsedUser = null;

      try {
        parsedUser = storedUser ? JSON.parse(storedUser) : null;
      } catch {
        parsedUser = null;
      }

      const me = await queryClient
        .fetchQuery({
          queryKey: queryKeys.me.all,
          queryFn: getMe,
          staleTime: 1000 * 60 * 30,
        })
        .catch(() => null);

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

      if (!user) {
        return;
      }

      localStorage.setItem(
        "user",
        JSON.stringify(
          normalizeResolvedUser(user, user?.rolNombre)
        )
      );

      storeEnabledPermissionCodes(user);
    };

    Promise.allSettled([animationDone, preloadUser()]).then(() => {
      if (active) {
        onComplete?.();
      }
    });

    return () => {
      active = false;

      if (timer) {
        clearInterval(timer);
      }

      if (resolveTimer) {
        clearTimeout(resolveTimer);
      }
    };
  }, [onComplete]);

  const currentStep = STEPS[step];
  const CurrentIcon = currentStep.icon;
  const progress = Math.round(((step + 1) / STEPS.length) * 100);
  const isLoadingStep = currentStep.id === 2;

  return (
    <div
      className="fixed inset-0 z-50 flex min-h-screen items-center justify-center overflow-hidden px-5 py-8"
      style={{
        background:
          "radial-gradient(circle at top, #111b3e 0%, #070b19 42%, #03050c 100%)",
        fontFamily: "'Outfit', system-ui, sans-serif",
      }}
    >
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600&display=swap');

          .auth-grid {
            background-image:
              linear-gradient(rgba(255, 255, 255, 0.025) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255, 255, 255, 0.025) 1px, transparent 1px);
            background-size: 42px 42px;
            mask-image: linear-gradient(to bottom, black, transparent 90%);
          }

          .auth-noise {
            background-image:
              radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.22) 1px, transparent 0);
            background-size: 5px 5px;
          }

          .auth-progress-shine {
            position: relative;
            overflow: hidden;
          }

          .auth-progress-shine::after {
            content: "";
            position: absolute;
            top: 0;
            left: -45%;
            width: 35%;
            height: 100%;
            background: linear-gradient(
              90deg,
              transparent,
              rgba(255, 255, 255, 0.65),
              transparent
            );
            animation: auth-shine 1.7s linear infinite;
          }

          @keyframes auth-shine {
            from {
              left: -45%;
            }

            to {
              left: 115%;
            }
          }
        `}
      </style>

      <div className="auth-grid pointer-events-none absolute inset-0" />

      <div className="auth-noise pointer-events-none absolute inset-0 opacity-[0.025]" />

      <motion.div
        className="pointer-events-none absolute -left-36 -top-40 h-[30rem] w-[30rem] rounded-full blur-[130px]"
        style={{
          backgroundColor: "rgba(53, 90, 255, 0.24)",
        }}
        animate={{
          x: [-20, 50, -20],
          y: [-15, 40, -15],
          scale: [1, 1.12, 1],
          opacity: [0.35, 0.55, 0.35],
        }}
        transition={{
          duration: 9,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <motion.div
        className="pointer-events-none absolute -bottom-40 -right-32 h-[32rem] w-[32rem] rounded-full blur-[140px]"
        style={{
          backgroundColor: "rgba(209, 95, 3, 0.3)",
        }}
        animate={{
          x: [20, -45, 20],
          y: [25, -35, 25],
          scale: [1.08, 0.96, 1.08],
          opacity: [0.35, 0.58, 0.35],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <motion.div
        className="pointer-events-none absolute left-[15%] top-[22%] h-2 w-2 rounded-full bg-white/35"
        animate={{
          y: [0, -18, 0],
          opacity: [0.2, 0.8, 0.2],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <motion.div
        className="pointer-events-none absolute bottom-[20%] right-[18%] h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: ACCENT }}
        animate={{
          y: [0, 22, 0],
          opacity: [0.25, 0.85, 0.25],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <div className="relative z-10 flex w-full max-w-[560px] flex-col items-center">
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-7 flex items-center gap-3"
        >
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl border"
            style={{
              borderColor: "rgba(209, 95, 3, 0.35)",
              backgroundColor: "rgba(209, 95, 3, 0.12)",
              boxShadow: "0 0 30px rgba(209, 95, 3, 0.16)",
            }}
          >
            <Sparkles
              className="h-4 w-4"
              style={{ color: ACCENT }}
              strokeWidth={1.8}
            />
          </div>

          <div className="text-left">
            <p className="text-[10px] font-medium uppercase tracking-[0.34em] text-white/35">
              CODEX PRO MAX
            </p>

            <p className="mt-0.5 text-sm font-light text-white/75">
              Entorno empresarial seguro
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 25, scale: 0.97 }}
          animate={{
            opacity: 1,
            y: [0, -6, 0],
            scale: 1,
          }}
          transition={{
            opacity: { duration: 0.65 },
            scale: { duration: 0.65 },
            y: {
              duration: 4.5,
              repeat: Infinity,
              ease: "easeInOut",
            },
          }}
          className="relative w-full overflow-hidden rounded-[30px] border border-white/[0.09] bg-white/[0.055] p-6 shadow-[0_35px_100px_rgba(0,0,0,0.55)] backdrop-blur-2xl sm:p-8"
        >
          <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/45 to-transparent" />

          <div
            className="pointer-events-none absolute -right-24 -top-24 h-52 w-52 rounded-full blur-[80px]"
            style={{
              backgroundColor: "rgba(209, 95, 3, 0.16)",
            }}
          />

          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="relative flex h-2.5 w-2.5">
                  <span
                    className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-70"
                    style={{ backgroundColor: ACCENT }}
                  />

                  <span
                    className="relative inline-flex h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: ACCENT }}
                  />
                </span>

                <span className="text-[10px] font-medium uppercase tracking-[0.3em] text-white/40">
                  Autenticación activa
                </span>
              </div>

              <div className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-black/20 px-3 py-1.5">
                <LockKeyhole
                  className="h-3.5 w-3.5"
                  style={{ color: ACCENT }}
                />

                <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-white/45">
                  Protegido
                </span>
              </div>
            </div>

            <div className="mt-10 flex flex-col items-center text-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep.id}
                  initial={{
                    opacity: 0,
                    scale: 0.78,
                    rotate: -8,
                  }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                    rotate: 0,
                  }}
                  exit={{
                    opacity: 0,
                    scale: 0.78,
                    rotate: 8,
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 230,
                    damping: 18,
                  }}
                  className="relative flex h-24 w-24 items-center justify-center rounded-[27px] border border-white/[0.1] bg-white/[0.055]"
                  style={{
                    boxShadow:
                      "inset 0 1px 0 rgba(255,255,255,0.08), 0 20px 50px rgba(0,0,0,0.4)",
                  }}
                >
                  <motion.div
                    className="absolute inset-3 rounded-[21px]"
                    style={{
                      backgroundColor: "rgba(209, 95, 3, 0.11)",
                      boxShadow:
                        "0 0 35px rgba(209, 95, 3, 0.16)",
                    }}
                    animate={{
                      scale: [1, 1.08, 1],
                      opacity: [0.65, 1, 0.65],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />

                  <CurrentIcon
                    className={`relative z-10 h-9 w-9 ${
                      isLoadingStep ? "animate-spin" : ""
                    }`}
                    style={{ color: ACCENT }}
                    strokeWidth={1.55}
                  />
                </motion.div>
              </AnimatePresence>

              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep.text}
                  initial={{
                    opacity: 0,
                    y: 16,
                    filter: "blur(8px)",
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    filter: "blur(0px)",
                  }}
                  exit={{
                    opacity: 0,
                    y: -16,
                    filter: "blur(8px)",
                  }}
                  transition={{
                    duration: 0.45,
                    ease: "easeOut",
                  }}
                  className="mt-8"
                >
                  <p
                    className="text-[10px] font-semibold uppercase tracking-[0.42em]"
                    style={{ color: ACCENT }}
                  >
                    Paso {currentStep.number}
                  </p>

                  <h1 className="mt-3 text-xl font-medium tracking-[0.14em] text-white sm:text-2xl">
                    {currentStep.text}
                  </h1>

                  <p className="mt-3 text-sm font-light tracking-[0.08em] text-white/40">
                    {currentStep.description}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="mt-10">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-[10px] font-medium uppercase tracking-[0.22em] text-white/30">
                  Progreso del acceso
                </span>

                <motion.span
                  key={progress}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs font-medium text-white/70"
                >
                  {progress}%
                </motion.span>
              </div>

              <div className="h-2 overflow-hidden rounded-full border border-white/[0.06] bg-black/25 p-[2px]">
                <div className="h-full overflow-hidden rounded-full">
                  <motion.div
                    className="auth-progress-shine h-full rounded-full"
                    style={{
                      background:
                        "linear-gradient(90deg, #a94700 0%, #d15f03 55%, #ff9a4b 100%)",
                      boxShadow: "0 0 22px rgba(209, 95, 3, 0.42)",
                    }}
                    initial={{ width: "0%" }}
                    animate={{ width: `${progress}%` }}
                    transition={{
                      duration: 0.7,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-3 gap-2 sm:gap-3">
              {STEPS.map((item, index) => {
                const isActive = index === step;
                const isCompleted = index < step;

                return (
                  <motion.div
                    key={item.id}
                    animate={{
                      y: isActive ? -3 : 0,
                      opacity: isActive || isCompleted ? 1 : 0.42,
                    }}
                    transition={{ duration: 0.3 }}
                    className="relative overflow-hidden rounded-2xl border px-2 py-3 text-center sm:px-3"
                    style={{
                      borderColor: isActive
                        ? "rgba(209, 95, 3, 0.36)"
                        : "rgba(255, 255, 255, 0.07)",
                      backgroundColor: isActive
                        ? "rgba(209, 95, 3, 0.09)"
                        : "rgba(255, 255, 255, 0.025)",
                    }}
                  >
                    {isActive && (
                      <motion.div
                        className="absolute inset-x-4 top-0 h-px"
                        style={{ backgroundColor: ACCENT }}
                        layoutId="active-step-line"
                      />
                    )}

                    <div
                      className="mx-auto flex h-7 w-7 items-center justify-center rounded-lg border"
                      style={{
                        borderColor:
                          isActive || isCompleted
                            ? "rgba(209, 95, 3, 0.32)"
                            : "rgba(255, 255, 255, 0.08)",
                        backgroundColor:
                          isActive || isCompleted
                            ? "rgba(209, 95, 3, 0.11)"
                            : "rgba(255, 255, 255, 0.03)",
                      }}
                    >
                      {isCompleted ? (
                        <Check
                          className="h-3.5 w-3.5"
                          style={{ color: ACCENT }}
                          strokeWidth={2}
                        />
                      ) : isActive ? (
                        <Loader2
                          className="h-3.5 w-3.5 animate-spin"
                          style={{ color: ACCENT }}
                        />
                      ) : (
                        <span className="text-[9px] font-semibold text-white/35">
                          {item.number}
                        </span>
                      )}
                    </div>

                    <p
                      className="mt-2 truncate text-[9px] font-medium uppercase tracking-[0.13em]"
                      style={{
                        color: isActive
                          ? "rgba(255,255,255,0.85)"
                          : "rgba(255,255,255,0.38)",
                      }}
                    >
                      {item.shortText}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="mt-6 flex items-center gap-2 text-[10px] font-light uppercase tracking-[0.24em] text-white/25"
        >
          <ShieldCheck className="h-3.5 w-3.5" />
          Conexión cifrada y protegida
        </motion.div>
      </div>
    </div>
  );
}