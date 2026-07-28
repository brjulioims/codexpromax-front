import { Users, Filter, UserPlus } from "lucide-react";
import HeaderBox from "../../ui/HeaderBox";
import Agregar from "../../botones/Agregar";
import microsoftLogo from "../../../image/Microsoft_logo.png";

import { useUsuariosPage } from "../../../hooks/Mantenimiento/usuario/useUsuariosPage";

import UsuarioTable from "./usuario/UsuarioTable";
import UsuarioFiltroModal from "./usuario/UsuarioFiltroModal";
import CrearUsuarioModal from "./usuario/CrearUsuarioModal";
import EditarUsuarioModal from "./usuario/EditarUsuarioModal";

function MicrosoftIcon({ size = 18 }) {
  return (
    <img
      src={microsoftLogo}
      alt="Microsoft"
      className="object-contain"
      style={{ width: size, height: size }}
      draggable={false}
    />
  );
}

export default function Usuario() {
  const page = useUsuariosPage();

  return (
    <section className="space-y-5">
      <HeaderBox
        title="Usuarios"
        subtitle="Crea, edita y administra los usuarios del sistema"
        Icon={Users}
        action={
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-[#0e183f]">
              Registrados: {page.filteredUsers.length}
            </div>

            <button
              type="button"
              onClick={page.openFilter}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 sm:w-auto"
            >
              <Filter size={16} />
              FILTROS
            </button>

            <Agregar Icon={UserPlus} onClick={() => page.openCreate("local")}>
              Crear Usuario
            </Agregar>
          </div>
        }
      />

      <UsuarioFiltroModal
        filterOpen={page.filterOpen}
        setFilterOpen={page.setFilterOpen}
        draftFilters={page.draftFilters}
        setDraftFilters={page.setDraftFilters}
        setFilters={page.setFilters}
        roleOptions={page.roleOptions}
        matchingUsers={page.matchingUsers}
      />

      <EditarUsuarioModal
        editOpen={page.editOpen}
        setEditOpen={page.setEditOpen}
        draftUser={page.draftUser}
        setDraftUser={page.setDraftUser}
        draftPassword={page.draftPassword}
        setDraftPassword={page.setDraftPassword}
        roleOptions={page.roleOptions}
        handleSaveUser={page.handleSaveUser}
      />

      <CrearUsuarioModal
        createOpen={page.createOpen}
        setCreateOpen={page.setCreateOpen}
        draftNewUser={page.draftNewUser}
        setDraftNewUser={page.setDraftNewUser}
        createMode={page.createMode}
        roleOptions={page.roleOptions}
        handleCreateUser={page.handleCreateUser}
      />

      <UsuarioTable
        data={page.filteredUsers}
        loading={page.loadingUsers}
        onEdit={page.openEdit}
        onToggleStatus={page.toggleStatus}
      />
    </section>
  );
}
