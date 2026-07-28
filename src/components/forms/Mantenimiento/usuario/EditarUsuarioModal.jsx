import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import Swal from "sweetalert2";
import ModalFiltro from "../../../ui/ModalFiltro";

export default function EditarUsuarioModal({
  editOpen,
  setEditOpen,
  draftUser,
  setDraftUser,
  draftPassword,
  setDraftPassword,
  roleOptions,
  handleSaveUser,
}) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <ModalFiltro
      open={editOpen}
      onClose={() => {
        setEditOpen(false);
        setShowPassword(false);
      }}
      title="EDITAR USUARIO"
      subtitle="ACTUALIZA LA INFORMACIÓN DEL USUARIO"
      footer={
        <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => {
              setEditOpen(false);
              setShowPassword(false);
            }}
            className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            CANCELAR
          </button>

          <button
            type="button"
            onClick={async () => {
              if (!draftUser) return;

              const name = draftUser.name.trim();
              const username = draftUser.username.trim();
              const email = draftUser.email.trim();
              const role = draftUser.role.trim();

              if (!name || !username || !email || !role) {
                await Swal.fire({
                  icon: "warning",
                  title: "Campos incompletos",
                  text: "Debes completar nombre, usuario, correo y rol.",
                  confirmButtonColor: "#0e183f",
                });
                return;
              }

              const confirm = await Swal.fire({
                title: "¿DESEAS GUARDAR LOS CAMBIOS?",
                text: `SE ACTUALIZARÁ "${name}"`,
                icon: "question",
                showCancelButton: true,
                confirmButtonText: "GUARDAR",
                cancelButtonText: "CANCELAR",
                confirmButtonColor: "#0e183f",
                cancelButtonColor: "#64748b",
              });

              if (!confirm.isConfirmed) return;

              try {
                await handleSaveUser();
                setShowPassword(false);
              } catch (error) {
                console.error(error);
              }
            }}
            className="inline-flex items-center justify-center rounded-lg bg-[#0e183f] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#16245e]"
          >
            GUARDAR
          </button>
        </div>
      }
    >
      {draftUser ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="text-sm font-medium text-slate-700">NOMBRE</span>
            <input
              value={draftUser.name}
              onChange={(e) =>
                setDraftUser((current) => ({
                  ...current,
                  name: e.target.value.toUpperCase(),
                }))
              }
              className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 uppercase outline-none transition focus:border-slate-300"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">USUARIO</span>
            <input
              value={draftUser.username}
              onChange={(e) =>
                setDraftUser((current) => ({
                  ...current,
                  username: e.target.value,
                }))
              }
              className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-slate-300"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">CORREO</span>
            <input
              value={draftUser.email}
              onChange={(e) =>
                setDraftUser((current) => ({
                  ...current,
                  email: e.target.value,
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
                placeholder="CAMBIO OPCIONAL"
                value={draftPassword}
                onChange={(e) => setDraftPassword(e.target.value)}
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
            <span className="text-sm font-medium text-slate-700">ROL</span>
            <select
              value={draftUser.role}
              onChange={(e) =>
                setDraftUser((current) => ({
                  ...current,
                  role: e.target.value,
                }))
              }
              className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 uppercase outline-none transition focus:border-slate-300"
            >
              {roleOptions.map((value, index) => (
                <option key={`${value}-${index}`} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
        </div>
      ) : null}
    </ModalFiltro>
  );
}
