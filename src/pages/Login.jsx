import { motion as Motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  ShieldCheck,
  Sparkles,
  Gavel,
} from "lucide-react";
import LoginParticles from "../components/ui/Particles.jsx";
import googleLogo from "../image/google_logo.png";
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
      identifier,
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

const highlights = [
  "Asignaciones centralizadas",
  "Seguimiento en tiempo real",
  "Control operativo por equipo",
  "Flujo claro y seguro",
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
    setLoginError("");
    setLoadingLogin(true);

    try {
      const data = {
        username: form.identifier.trim(),
        nombre: form.identifier.trim(),
      };
      const sessionToken = resolveSessionToken(data) || "local-session-token";
      localStorage.setItem("token", sessionToken);
      localStorage.setItem(
        "enabledPermissionCodes",
        JSON.stringify(["dashboard", "mantenimiento", "usuarios", "configuracion"])
      );

      localStorage.setItem("user", JSON.stringify(normalizeSessionUser(data)));
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
      clearPendingAzureLogin();
      setLoginError(error.message || "No se pudo iniciar sesion con Microsoft");
      setLoadingMicrosoft(false);
    } finally {
      if (!hasPendingAzureLogin()) {
        setLoadingMicrosoft(false);
      }
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-white text-[#0e183f]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(14,24,63,0.1),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(209,95,3,0.14),_transparent_32%)]" />
      <div className="absolute inset-y-0 left-0 hidden w-[55%] bg-[#0e183f] lg:block min-[1440px]:w-[66%]" />
      <div className="absolute left-0 top-0 hidden h-72 w-[60%] bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.1),_transparent_45%)] lg:block min-[1440px]:w-[66%]" />
      <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-[#d15f03]/10 blur-3xl" />
      <div className="absolute right-[-120px] top-20 h-64 w-64 rounded-full border border-[#d15f03]/10" />
      <LoginParticles />

      <div className="relative z-10 grid min-h-screen lg:grid-cols-[1.08fr_0.92fr] min-[1440px]:grid-cols-[1.22fr_0.78fr]">
        <div className="hidden lg:flex flex-col justify-between px-8 py-5 text-white xl:px-12 xl:py-5">
          <Motion.div
            initial={{ opacity: 0, y: -18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            className="flex items-center gap-4"
          >
            <Motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-white/60">
                <Gavel className="h-7 w-7 text-[#0e183f]" />
              </div>
            </Motion.div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-white/60">
                Sistema de CODEXPRO
              </p>
              <h1 className="mt-1 text-[28px] font-extrabold tracking-tight">CODEXPRO</h1>
            </div>
          </Motion.div>

          <div className="max-w-[38rem]">
            <Motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.08 }}
              className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs text-white/90 backdrop-blur-sm"
            >
              <Sparkles className="h-4 w-4 text-[#d15f03]" />
              Plataforma operativa para equipos comerciales
            </Motion.div>

            <Motion.h2
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.15 }}
              className="max-w-[36rem] text-[36px] font-extrabold leading-[0.98] tracking-tight xl:text-[46px]"
            >
              Controla tus asignaciones con una interfaz
              <span className="block text-[#ff9a4a]">clara, rapida y elegante.</span>
            </Motion.h2>

            <Motion.p
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.22 }}
              className="mt-4 max-w-[32rem] text-[14px] leading-6 text-white/72 xl:text-[15px]"
            >
              Organiza referidos, vendedores y seguimientos desde un solo lugar
              con una experiencia visual alineada al estilo del proyecto.
            </Motion.p>

            <Motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.28 }}
              className="mt-5 grid max-w-[33rem] gap-3 sm:grid-cols-2"
            >
              {highlights.map((item) => (
                <Motion.div
                  key={item}
                  whileHover={{ y: -4, scale: 1.01 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="rounded-lg border border-white/10 bg-white/8 px-3.5 py-3.5 backdrop-blur-sm transition duration-200 hover:border-[#ff9a4a]/40 hover:bg-white/12 hover:shadow-[0_16px_30px_rgba(0,0,0,0.16)]"
                >
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#d15f03]/20 text-[#ffb06f]">
                      <CheckCircle2 className="h-4 w-4" />
                    </span>
                    <p className="text-[13px] font-medium text-white/92">{item}</p>
                  </div>
                </Motion.div>
              ))}
            </Motion.div>
          </div>

          <Motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.35 }}
            className="flex items-center gap-3 text-sm text-white/60"
          >
            <ShieldCheck className="h-4 w-4 text-[#ff9a4a]" />
            Seguridad y acceso centralizado con Microsoft.
          </Motion.div>
        </div>

        <div className="flex items-center justify-center px-5 py-6 sm:px-8 lg:px-8 xl:px-12">
          <Motion.div
            initial={{ opacity: 0, y: 28, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="w-full max-w-[31rem]"
          >
            <div className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_24px_64px_rgba(14,24,63,0.14)] sm:p-7 lg:p-8">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-[#fff4ec] text-[#d15f03] ring-1 ring-[#d15f03]/10 lg:hidden">
                    <Gavel className="h-6 w-6 text-[#d15f03]" />
                  </div>

                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#d15f03]">
                    Bienvenido(a)
                  </p>
                  <h3 className="mt-2 text-[30px] font-extrabold tracking-tight text-[#0e183f]">
                    Inicio de sesión
                  </h3>
                  <p className="mt-2.5 max-w-md text-sm leading-6 text-slate-500">
                    Ingresa con tu cuenta empresarial para administrar
                    tus CODEXPRO, actividades y eventos de manera centralizada.
                  </p>
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#fff4ec] text-[#d15f03] ring-1 ring-[#d15f03]/10">
                  <Gavel className="h-6 w-6 text-[#d15f03]" />
                </div>

              </div>

              <form className="space-y-4" onSubmit={handleSubmit}>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#0e183f]">
                    Usuario
                  </label>

                  <input
                    name="identifier"
                    placeholder="Usuario"
                    value={form.identifier}
                    onChange={handleChange}
                    className="h-12 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 text-sm text-[#0e183f] outline-none transition placeholder:text-slate-400 focus:border-[#0e183f] focus:bg-white focus:ring-4 focus:ring-[#0e183f]/10"
                  />
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <label className="block text-sm font-semibold text-[#0e183f]">
                      Contraseña
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        window.location.href =
                          "https://intranet.crecertodosge.com/soporte-tecnico";
                      }}
                      className="text-sm font-medium text-[#d15f03] transition hover:text-[#0e183f]"
                    >
                      Recuperar acceso
                    </button>
                  </div>

                  <div className="relative">
                    <input
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={form.password}
                      onChange={handleChange}
                      placeholder="*************"
                      className="h-12 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 pr-11 text-sm text-[#0e183f] outline-none transition placeholder:text-slate-400 focus:border-[#0e183f] focus:bg-white focus:ring-4 focus:ring-[#0e183f]/10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      className="absolute inset-y-0 right-0 inline-flex w-11 items-center justify-center text-slate-500 transition hover:text-[#0e183f]"
                      aria-label={showPassword ? "Ocultar contrasena" : "Mostrar contrasena"}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {loginError ? (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600">
                    {loginError}
                  </div>
                ) : null}

                <div className="flex flex-col gap-3 pt-1 text-sm sm:flex-row sm:items-center sm:justify-between">
                  <label className="flex items-center gap-2 text-slate-600">
                    <input
                      type="checkbox"
                      checked={rememberSession}
                      onChange={(event) => setRememberSession(event.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-[#d15f03] focus:ring-[#d15f03]/20"
                    />
                    Mantener sesion activa
                  </label>
                </div>

                <Motion.button
                  whileHover={{ scale: loadingLogin ? 1 : 1.015 }}
                  whileTap={{ scale: loadingLogin ? 1 : 0.985 }}
                  type="submit"
                  disabled={loadingLogin}
                  className="group flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#d15f03] px-4 text-sm font-bold text-white shadow-[0_16px_32px_rgba(209,95,3,0.20)] transition hover:bg-[#b85403] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loadingLogin ? "Ingresando..." : "Ingresar"}
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </Motion.button>
              </form>

              <div className="my-5 flex items-center gap-3">
                <div className="h-px flex-1 bg-slate-200" />
                <span className="text-xs font-semibold uppercase tracking-[0.26em] text-slate-400">
                  acceso rapido
                </span>
                <div className="h-px flex-1 bg-slate-200" />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Motion.button
                  whileHover={{ y: -2 }}
                  type="button"
                  onClick={handleMicrosoftLogin}
                  disabled={loadingMicrosoft}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-[#0e183f] shadow-sm transition duration-200 hover:border-[#0e183f]/25 hover:bg-[#f3f6ff] hover:text-[#0e183f] hover:shadow-[0_12px_24px_rgba(14,24,63,0.10)] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <span className="mr-2 inline-flex h-5 w-5 items-center justify-center">
                    <img
                      src={microsoftLogo}
                      alt="Microsoft"
                      className="h-4 w-4 object-contain"
                      draggable={false}
                    />
                  </span>
                  {loadingMicrosoft ? "Conectando..." : "Acceso con Microsoft"}
                </Motion.button>

                <Motion.button
                  type="button"
                  disabled
                  className="rounded-lg border border-slate-200 bg-slate-100 px-4 py-2.5 text-sm font-semibold text-[#0e183f]/60 shadow-inner opacity-80 cursor-not-allowed translate-y-0.5"
                >
                  <span className="mr-2 inline-flex h-5 w-5 items-center justify-center">
                    <Gavel className="h-4 w-4" />
                  </span>
                  Acceso con Google
                </Motion.button>
              </div>

              <div className="mt-5 rounded-lg border border-[#d15f03]/10 bg-[#fff8f3] p-3.5">
                <p className="text-center text-sm leading-6 text-slate-600">
                  <span className="font-bold text-[#7e7e81]"> 2026 CODEXPRO - Todos los derechos reservados </span>
                  <br />
                  <span className="font text-[#0e183f]">
                    ¿Necesitas ayuda? Escribenos a
                  </span>{" "}
                  <a
                    href="mailto:desarrolloti@crecertodos.onmicrosoft.com"
                    className="text-[#0e183f] transition hover:text-[#d15f03] hover:no-underline"
                  >
                    <strong>desarrolloti@crecertodos.onmicrosoft.com</strong>
                  </a>
                </p>
              </div>
            </div>
          </Motion.div>
        </div>
      </div>
    </div>
  );
}
