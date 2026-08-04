import { motion as Motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Eye,
  EyeOff,
  ShieldCheck,
  Gavel,
  UserRound,
  LockKeyhole,
  UsersRound,
  ChartNoAxesCombined,
  Activity,
  Headphones,
  BadgeCheck,
} from "lucide-react";
import LoginParticles from "../components/ui/Particles.jsx";
import microsoftLogo from "../image/Microsoft_logo.png";
import {
  clearPendingAzureLogin,
  completeAzureLogin,
  hasPendingAzureLogin,
  loginAzure,
  startAzureLogin,
} from "../services/loginAzureService";

const AUTH_API_URL = "/api/login";

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

function buildHeaders(includeJson = false) {
  return {
    accept: "*/*",
    "ngrok-skip-browser-warning": "true",
    ...(includeJson ? { "Content-Type": "application/json" } : {}),
  };
}

async function loginUsuario({ identifier, password }) {
  const response = await fetch(AUTH_API_URL, {
    method: "POST",
    headers: buildHeaders(true),
    body: JSON.stringify({
      identifier: identifier.trim(),
      password,
    }),
    credentials: "include",
  });

  if (!response.ok) {
    let detail = "Credenciales invalidas";

    try {
      const data = await response.json();
      detail =
        data?.message ??
        data?.error ??
        data?.detail ??
        "Credenciales invalidas";
    } catch {
      detail = "Credenciales invalidas";
    }

    throw new Error(detail);
  }

  return response.json();
}

async function getAuthenticatedUser(token) {
  const response = await fetch("/api/me", {
    method: "GET",
    headers: {
      accept: "*/*",
      "ngrok-skip-browser-warning": "true",
      Authorization: `Bearer ${token}`,
    },
    credentials: "include",
  });

  if (!response.ok) {
    let detail = "No se pudo validar la sesion";

    try {
      const data = await response.json();
      detail =
        data?.message ??
        data?.error ??
        data?.detail ??
        `No se pudo validar la sesion (${response.status})`;
    } catch {
      detail = `No se pudo validar la sesion (${response.status})`;
    }

    throw new Error(detail);
  }

  return response.json();
}

const platformStats = [
  { label: "Equipos conectados", value: "24/7", icon: UsersRound },
  { label: "Control operativo", value: "100%", icon: ChartNoAxesCombined },
  { label: "Actividad en vivo", value: "Real time", icon: Activity },
];

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
    permisos: Array.isArray(rawUser?.permisos)
      ? rawUser.permisos
      : Array.isArray(data?.permisos)
        ? data.permisos
        : [],
    raw: data,
  };
}

export default function AssignmentLogin({ onLoginSuccess }) {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    identifier: "",
    password: "",
  });
  const [rememberSession, setRememberSession] = useState(false);
  const [loadingLogin, setLoadingLogin] = useState(false);
  const [loadingMicrosoft, setLoadingMicrosoft] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    let mounted = true;

    const resolveAzureLogin = async () => {
      if (!hasPendingAzureLogin()) return;

      try {
        setLoginError("");
        setLoadingMicrosoft(true);

        const azureSession = await completeAzureLogin();
        if (!azureSession?.idToken) return;

        const data = await loginAzure({
          idToken: azureSession.idToken,
          accessToken: azureSession.accessToken,
        });

        const sessionToken = resolveSessionToken(data);

        if (sessionToken) {
          localStorage.setItem("token", sessionToken);
        } else {
          throw new Error("Backend no devolvio token");
        }

        localStorage.setItem("user", JSON.stringify(normalizeSessionUser(data)));
        localStorage.setItem(
          "sessionIdentifier",
          `${azureSession.account?.username ?? data?.user?.email ?? data?.email ?? ""}`.trim()
        );
        localStorage.setItem("rememberSession", "true");

        if (!mounted) return;

        if (onLoginSuccess) {
          onLoginSuccess();
        } else {
          navigate("/dashboard", { replace: true });
        }
      } catch (error) {
        clearPendingAzureLogin();
        if (!mounted) return;
        setLoginError(error.message || "No se pudo iniciar sesion con Microsoft");
      } finally {
        if (mounted) {
          setLoadingMicrosoft(false);
        }
      }
    };

    resolveAzureLogin();

    return () => {
      mounted = false;
    };
  }, [navigate, onLoginSuccess]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setLoginError("");
      setLoadingLogin(true);

      const data = await loginUsuario(form);
      const sessionToken = resolveSessionToken(data);

      if (!sessionToken) {
        throw new Error("Backend no devolvio token");
      }

      localStorage.setItem("token", sessionToken);

      const authenticatedUser = await getAuthenticatedUser(sessionToken);
      localStorage.setItem("user", JSON.stringify(normalizeSessionUser(authenticatedUser)));
      localStorage.setItem("sessionIdentifier", form.identifier.trim());
      localStorage.setItem("rememberSession", rememberSession ? "true" : "false");

      if (onLoginSuccess) {
        onLoginSuccess();
      } else {
        navigate("/dashboard", { replace: true });
      }
    } catch (error) {
      setLoginError(error.message || "No se pudo iniciar sesion");
    } finally {
      setLoadingLogin(false);
    }
  };

  const handleMicrosoftLogin = async () => {
    try {
      setLoginError("");
      setLoadingMicrosoft(true);
      await startAzureLogin();
    } catch (error) {
      setLoginError(error.message || "No se pudo iniciar sesion con Microsoft");
      setLoadingMicrosoft(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f3f5f9] text-[#101828]">
      <div className="absolute -left-40 -top-40 h-[34rem] w-[34rem] rounded-full bg-[#0e183f]/10 blur-3xl" />
      <div className="absolute -bottom-48 -right-32 h-[32rem] w-[32rem] rounded-full bg-[#d15f03]/15 blur-3xl" />
      <LoginParticles className="absolute inset-0 opacity-90 [filter:contrast(1.18)_saturate(1.12)]" />

      <main className="relative z-10 flex min-h-screen items-center justify-center p-4 sm:p-6 lg:p-8 xl:px-6 xl:py-4 2xl:p-8">
        <Motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: "easeOut" }}
          className="grid w-full max-w-[1020px] overflow-hidden rounded-2xl border border-white/70 bg-white shadow-[0_35px_100px_rgba(15,23,42,0.16)] lg:grid-cols-[1.02fr_0.98fr] 2xl:max-w-[1180px] 2xl:grid-cols-[1.06fr_0.94fr]"
        >
          <aside className="relative hidden overflow-hidden bg-[#0e183f] p-5 text-white lg:flex lg:flex-col lg:justify-between xl:p-6 2xl:min-h-[720px] 2xl:p-12">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(209,95,3,0.34),transparent_28%),radial-gradient(circle_at_85%_85%,rgba(255,255,255,0.10),transparent_30%)]" />
            <div className="absolute right-[-90px] top-[-70px] h-72 w-72 rounded-xl border border-white/10" />
            <div className="absolute right-[-35px] top-[-15px] h-48 w-48 rounded-xl border border-white/10" />

            <div className="relative">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[#0e183f] shadow-lg">
                  <Gavel className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-white/50">
                    Plataforma empresarial
                  </p>
                  <h1 className="mt-1 text-2xl font-black tracking-tight">CODEXPRO</h1>
                </div>
              </div>
            </div>

            <div className="relative max-w-xl">
              <Motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15, duration: 0.55 }}
                className="mb-4 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-xs font-semibold text-white/80 backdrop-blur 2xl:mb-6"
              >
                <BadgeCheck className="h-4 w-4 text-[#ff9a4a]" />
                Gestión comercial inteligente
              </Motion.div>

              <Motion.h2
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="max-w-[460px] text-[33px] font-black leading-[1.02] tracking-[-0.035em] xl:text-[36px] 2xl:max-w-[560px] 2xl:text-[52px]"
              >
                Todo tu equipo.
                <span className="mt-1 block text-[#ff9846]">Una sola operación.</span>
              </Motion.h2>

              <Motion.p
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.27, duration: 0.6 }}
                className="mt-3 max-w-[430px] text-[13px] leading-5 text-white/65 2xl:mt-5 2xl:max-w-[500px] 2xl:text-[15px] 2xl:leading-7"
              >
                Accede a asignaciones, actividad comercial y seguimiento operativo
                desde un entorno centralizado, seguro y diseñado para trabajar mejor.
              </Motion.p>

              <div className="mt-4 grid grid-cols-3 gap-2.5 2xl:mt-9 2xl:gap-3">
                {platformStats.map((stat, index) => {
                  const Icon = stat.icon;

                  return (
                    <Motion.div
                      key={stat.label}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.34 + index * 0.08, duration: 0.5 }}
                      whileHover={{ y: -4 }}
                      className="rounded-2xl border border-white/10 bg-white/[0.07] p-2.5 backdrop-blur-sm 2xl:p-4"
                    >
                        <Icon className="h-4 w-4 text-[#ff9846] 2xl:h-5 2xl:w-5" />
                        <p className="mt-3 text-base font-black 2xl:mt-4 2xl:text-lg">{stat.value}</p>
                        <p className="mt-1 text-[10px] leading-4 text-white/50 2xl:text-[11px]">{stat.label}</p>
                    </Motion.div>
                  );
                })}
              </div>
            </div>

            <div className="relative flex items-center justify-between border-t border-white/10 pt-4 text-[11px] text-white/45 2xl:pt-5 2xl:text-xs">
              <span className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[#ff9846]" />
                Acceso protegido
              </span>
              <span>Grupo Empresarial Crecer Todos</span>
            </div>
          </aside>

          <section className="flex bg-white px-5 py-5 sm:px-8 lg:px-9 xl:px-10 2xl:min-h-[720px] 2xl:px-16 2xl:py-9">
            <div className="mx-auto w-full max-w-[400px] 2xl:max-w-[430px]">
              <Motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18, duration: 0.55 }}
              >
                <div className="mb-5 flex items-center justify-between lg:hidden">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0e183f] text-white">
                      <Gavel className="h-5 w-5" />
                    </div>
                    <span className="text-xl font-black text-[#0e183f]">CODEXPRO</span>
                  </div>
                </div>

                <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#d15f03]">
                  Bienvenido (A)
                </p>
                <h2 className="mt-2 text-[28px] font-black tracking-[-0.035em] text-[#0e183f] sm:text-[32px] 2xl:text-[40px]">
                  Inicio de sesión
                </h2>
                <p className="mt-2 text-[13px] leading-5 text-slate-500 2xl:text-sm">
                  Ingresa tus credenciales para continuar a tu espacio de trabajo.
                </p>
              </Motion.div>

              <form className="mt-4 space-y-3 2xl:mt-9 2xl:space-y-5" onSubmit={handleSubmit}>
                <div>
                  <label className="mb-2 block text-sm font-bold text-[#24304f]">
                    Usuario o correo
                  </label>
                  <div className="group relative">
                    <UserRound className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400 transition group-focus-within:text-[#d15f03]" />
                    <input
                      name="identifier"
                      autoComplete="username"
                      placeholder="Ingresa tu usuario"
                      value={form.identifier}
                      onChange={handleChange}
                      required
                      className="h-12 w-full rounded-xl border border-slate-200 bg-[#f8fafc] py-3 pl-12 pr-4 text-sm text-[#0e183f] outline-none transition placeholder:text-slate-400 focus:border-[#d15f03]/60 focus:bg-white focus:ring-4 focus:ring-[#d15f03]/10 2xl:h-13 2xl:py-3.5"
                    />
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <label className="text-sm font-bold text-[#24304f]">Contraseña</label>
                    <button
                      type="button"
                      onClick={() => {
                        window.location.href =
                          "https://intranet.crecertodosge.com/soporte-tecnico";
                      }}
                      className="text-xs font-bold text-[#d15f03] transition hover:text-[#0e183f]"
                    >
                      ¿Olvidaste tu acceso?
                    </button>
                  </div>

                  <div className="group relative">
                    <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400 transition group-focus-within:text-[#d15f03]" />
                    <input
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      value={form.password}
                      onChange={handleChange}
                      placeholder="Ingresa tu contraseña"
                      required
                      className="h-12 w-full rounded-xl border border-slate-200 bg-[#f8fafc] py-3 pl-12 pr-12 text-sm text-[#0e183f] outline-none transition placeholder:text-slate-400 focus:border-[#d15f03]/60 focus:bg-white focus:ring-4 focus:ring-[#d15f03]/10 2xl:h-13 2xl:py-3.5"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-slate-400 transition hover:text-[#0e183f]"
                      aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <label className="flex cursor-pointer items-center gap-3 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    checked={rememberSession}
                    onChange={(event) => setRememberSession(event.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 accent-[#d15f03]"
                  />
                  Mantener mi sesión activa
                </label>

                {loginError ? (
                  <Motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600"
                  >
                    {loginError}
                  </Motion.div>
                ) : null}

                <Motion.button
                  whileHover={{ y: loadingLogin ? 0 : -2 }}
                  whileTap={{ scale: loadingLogin ? 1 : 0.985 }}
                  type="submit"
                  disabled={loadingLogin || loadingMicrosoft}
                  className="group flex w-full items-center justify-center gap-2 rounded-xl bg-[#0e183f] px-5 py-3 text-sm font-bold text-white shadow-[0_16px_32px_rgba(14,24,63,0.22)] transition hover:bg-[#182758] disabled:cursor-not-allowed disabled:opacity-60 2xl:py-3.5"
                >
                  {loadingLogin ? "Validando acceso..." : "Ingresar a CODEXPRO"}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Motion.button>
              </form>

              <div className="my-4 flex items-center gap-4 2xl:my-7">
                <div className="h-px flex-1 bg-slate-200" />
                <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">
                  o continúa con
                </span>
                <div className="h-px flex-1 bg-slate-200" />
              </div>

              <Motion.button
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.99 }}
                type="button"
                onClick={handleMicrosoftLogin}
                disabled={loadingMicrosoft || loadingLogin}
                className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-[#24304f] shadow-sm transition hover:border-[#0e183f]/25 hover:bg-slate-50 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 2xl:py-3.5"
              >
                <img
                  src={microsoftLogo}
                  alt="Microsoft"
                  className="h-[18px] w-[18px] object-contain"
                  draggable={false}
                />
                {loadingMicrosoft ? "Conectando con Microsoft..." : "Continuar con Microsoft"}
              </Motion.button>

              <div className="mt-5 flex items-center justify-center gap-2 text-center text-xs text-slate-400 2xl:mt-8">
                <Headphones className="h-4 w-4 text-[#d15f03]" />
                <span>¿Necesitas ayuda?</span>
                <a
                  href="mailto:desarrolloti@crecertodos.onmicrosoft.com"
                  className="font-bold text-[#0e183f] transition hover:text-[#d15f03]"
                >
                  Contactar soporte
                </a>
              </div>

              <p className="mt-3 text-center text-[11px] text-slate-400 2xl:mt-5">
                © 2026 CODEXPRO · Todos los derechos reservados
              </p>
            </div>
          </section>
        </Motion.section>
      </main>
    </div>
  );
}
