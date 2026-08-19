import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";
import Swal from "sweetalert2";
import ModalFiltro from "../../../ui/ModalFiltro";
import { EMPTY_NEW_USER } from "../../../../utils/Mantenimiento/usuario/usuarios.constants";

export default function CrearUsuarioModal({
  createOpen,
  setCreateOpen,
  draftNewUser,
  setDraftNewUser,
  roleOptions,
  handleCreateUser,
}) {
  const [showPassword, setShowPassword] = useState(false);
  const title = "REGISTRO DE NUEVO USUARIO";
  const subtitle = "NUEVO USUARIO";

  return (
    <ModalFiltro
      open={createOpen}
      onClose={() => {
        setCreateOpen(false);
        setDraftNewUser(EMPTY_NEW_USER);
        setShowPassword(false);
      }}
      title={title}
      subtitle={subtitle}
      footer={
        <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => {
              setCreateOpen(false);
              setDraftNewUser(EMPTY_NEW_USER);
              setShowPassword(false);
            }}
            className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            CANCELAR
          </button>

          <button
            type="button"
            onClick={async () => {
              const name = draftNewUser.name.trim();
              const displayName = name || draftNewUser.email.trim();
              const hasMissingFields = 
                  !draftNewUser.name.trim() ||
                  !draftNewUser.email.trim() ||
                  !draftNewUser.username.trim() ||
                  !draftNewUser.password ||
                  !draftNewUser.role.trim();

              if (hasMissingFields) {
                await Swal.fire({
                  icon: "warning",
                  title: "Campos incompletos",
                  text: "Debes completar todos los campos.",
                  confirmButtonColor: "#0e183f",
                });
                return;
              }

              const confirm = await Swal.fire({
                title: "¿DESEAS GUARDAR?",
                text: `SE CREARÁ "${displayName}"`,
                icon: "question",
                showCancelButton: true,
                confirmButtonText: "GUARDAR",
                cancelButtonText: "CANCELAR",
                confirmButtonColor: "#0e183f",
                cancelButtonColor: "#64748b",
              });

              if (!confirm.isConfirmed) return;

              try {
                await handleCreateUser();

                toast.success(`SE CREÓ "${displayName}" CORRECTAMENTE`);
              } catch {
                await Swal.fire({
                  icon: "error",
                  title: "Error",
                  text: "No se pudo registrar el usuario.",
                  confirmButtonColor: "#0e183f",
                });
              }
            }}
            className="inline-flex items-center justify-center rounded-lg bg-[#0e183f] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#16245e]"
          >
            GUARDAR
          </button>
        </div>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="text-sm font-medium text-slate-700">NOMBRE</span>
          <input
            value={draftNewUser.name}
            onChange={(e) =>
              setDraftNewUser((current) => ({
                ...current,
                name: e.target.value.toUpperCase(),
              }))
            }
            className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 uppercase outline-none transition focus:border-slate-300"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">EMAIL</span>
          <input
            type="email"
            value={draftNewUser.email}
            onChange={(e) =>
              setDraftNewUser((current) => ({
                ...current,
                email: e.target.value,
              }))
            }
            className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-slate-300"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">USUARIO</span>
          <input
            value={draftNewUser.username}
            onChange={(e) =>
              setDraftNewUser((current) => ({
                ...current,
                username: e.target.value,
              }))
            }
            className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-slate-300"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">CONTRASEÑA</span>
          <div className="relative mt-2">
            <input
              type={showPassword ? "text" : "password"}
              value={draftNewUser.password}
              onChange={(e) =>
                setDraftNewUser((current) => ({
                  ...current,
                  password: e.target.value,
                }))
              }
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 pr-11 text-sm text-slate-700 outline-none transition focus:border-slate-300"
            />
            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              className="absolute inset-y-0 right-0 inline-flex w-11 items-center justify-center text-slate-500 transition hover:text-slate-700"
              aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </label>

        <label className="block sm:col-span-2">
          <span className="text-sm font-medium text-slate-700">TIPO USUARIO</span>
          <select
            value={draftNewUser.role}
            onChange={(e) =>
              setDraftNewUser((current) => ({
                ...current,
                role: e.target.value,
              }))
            }
            className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 uppercase outline-none transition focus:border-slate-300"
          >
            <option value="" disabled>
              SELECCIONAR TIPO USUARIO
            </option>
            {roleOptions.map((value, index) => (
              <option key={`${value}-${index}`} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
      </div>
    </ModalFiltro>
  );
}
