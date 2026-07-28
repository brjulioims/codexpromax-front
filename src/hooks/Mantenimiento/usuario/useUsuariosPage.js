import { useState, useMemo } from "react";
import { useUsuariosQuery } from "../../queries/useUsuariosQuery";
import { useRolesQuery } from "../../queries/useRolesQuery";
import {
  useCreateUsuarioMutation,
  useUpdateUsuarioMutation,
  useUpdateUsuarioPasswordMutation,
} from "../../mutations/useUsuariosMutations";
import {
  DEFAULT_FILTERS,
  EMPTY_NEW_USER,
} from "../../../utils/Mantenimiento/usuario/usuarios.constants";
import {
  mapUsuarios,
  filterUsuarios,
  buildUserOptions,
  filterUserOptions,
} from "../../../utils/Mantenimiento/usuario/usuarios.helpers";
import Swal from "sweetalert2";

export function useUsuariosPage() {
  const { data: rawUsers = [], isLoading: loadingUsers } = useUsuariosQuery();
  const { data: rawRoles = [] } = useRolesQuery();

  const [filterOpen, setFilterOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [draftFilters, setDraftFilters] = useState(DEFAULT_FILTERS);

  const [draftNewUser, setDraftNewUser] = useState(EMPTY_NEW_USER);
  const [createMode, setCreateMode] = useState("local");

  const [draftUser, setDraftUser] = useState(null);
  const [draftPassword, setDraftPassword] = useState("");

  const mappedUsers = useMemo(() => mapUsuarios(rawUsers), [rawUsers]);

  const filteredUsers = useMemo(() => {
    return filterUsuarios(mappedUsers, filters);
  }, [mappedUsers, filters]);

  const roleOptions = useMemo(() => {
    return rawRoles.map((role) => role.nombre).filter(Boolean);
  }, [rawRoles]);

  const matchingUsers = useMemo(() => {
    const options = buildUserOptions(mappedUsers);
    return filterUserOptions(options, draftFilters.query);
  }, [mappedUsers, draftFilters.query]);

  const openFilter = () => {
    setDraftFilters(filters);
    setFilterOpen(true);
  };

  const openCreate = (mode = "local") => {
    setCreateMode(mode);
    setDraftNewUser({
      ...EMPTY_NEW_USER,
      authProvider: mode,
    });
    setCreateOpen(true);
  };

  const openEdit = (user) => {
    setDraftUser({
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
      status: user.status,
    });
    setDraftPassword("");
    setEditOpen(true);
  };

  const createMutation = useCreateUsuarioMutation({
    onSuccess: () => {
      setCreateOpen(false);
      setDraftNewUser(EMPTY_NEW_USER);
    },
  });

  const updateMutation = useUpdateUsuarioMutation({
    onSuccess: () => {
      setEditOpen(false);
      setDraftUser(null);
    },
  });

  const updatePasswordMutation = useUpdateUsuarioPasswordMutation({
    onSuccess: () => {
      setDraftPassword("");
    },
  });

  const handleCreateUser = async () => {
    const selectedRoleObj = rawRoles.find(
      (r) => r.nombre === draftNewUser.role
    );

    const payload = {
      nombre: draftNewUser.name,
      email: draftNewUser.email,
      username: draftNewUser.username,
      password: draftNewUser.password,
      rol_id: selectedRoleObj ? selectedRoleObj.id : null,
      estatus: 1,
      auth_provider: draftNewUser.authProvider,
    };

    return createMutation.mutateAsync(payload);
  };

  const handleSaveUser = async () => {
    if (!draftUser) return;

    const selectedRoleObj = rawRoles.find((r) => r.nombre === draftUser.role);

    const payload = {
      nombre: draftUser.name,
      email: draftUser.email,
      username: draftUser.username,
      rol_id: selectedRoleObj ? selectedRoleObj.id : null,
      estatus: draftUser.status === "Activo" ? 1 : 0,
    };

    await updateMutation.mutateAsync({
      id: draftUser.id,
      payload,
    });

    if (draftPassword.trim()) {
      await updatePasswordMutation.mutateAsync({
        id: draftUser.id,
        password: draftPassword.trim(),
      });
    }

    await Swal.fire({
      title: "CAMBIOS GUARDADOS",
      text: `SE ACTUALIZARON LOS DATOS DE "${draftUser.name}" CORRECTAMENTE`,
      icon: "success",
      confirmButtonText: "ACEPTAR",
      confirmButtonColor: "#0e183f",
    });
  };

  const toggleStatus = async (user) => {
    const isCurrentlyActive = user.status === "Activo";
    const nextStatusLabel = isCurrentlyActive ? "INACTIVAR" : "ACTIVAR";
    const nextStatusText = isCurrentlyActive ? "INACTIVARÁ" : "ACTIVARÁ";

    const confirm = await Swal.fire({
      title: `¿DESEAS ${nextStatusLabel} AL USUARIO?`,
      text: `SE ${nextStatusText} A "${user.name}"`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: nextStatusLabel,
      cancelButtonText: "CANCELAR",
      confirmButtonColor: isCurrentlyActive ? "#be123c" : "#047857",
      cancelButtonColor: "#64748b",
    });

    if (!confirm.isConfirmed) return;

    try {
      const selectedRoleObj = rawRoles.find((r) => r.nombre === user.role);

      const payload = {
        nombre: user.name,
        email: user.email,
        username: user.username,
        rol_id: selectedRoleObj ? selectedRoleObj.id : null,
        estatus: isCurrentlyActive ? 0 : 1,
      };

      await updateMutation.mutateAsync({
        id: user.id,
        payload,
      });

      await Swal.fire({
        title: `USUARIO ${isCurrentlyActive ? "INACTIVADO" : "ACTIVADO"}`,
        text: `SE ${isCurrentlyActive ? "INACTIVÓ" : "ACTIVÓ"} A "${user.name}" CORRECTAMENTE`,
        icon: "success",
        confirmButtonText: "ACEPTAR",
        confirmButtonColor: "#0e183f",
      });
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo cambiar el estado del usuario.",
        confirmButtonColor: "#0e183f",
      });
    }
  };

  return {
    filteredUsers,
    openFilter,
    openCreate,
    filterOpen,
    setFilterOpen,
    draftFilters,
    setDraftFilters,
    setFilters,
    roleOptions,
    matchingUsers,
    editOpen,
    setEditOpen,
    draftUser,
    setDraftUser,
    draftPassword,
    setDraftPassword,
    handleSaveUser,
    createOpen,
    setCreateOpen,
    draftNewUser,
    setDraftNewUser,
    createMode,
    handleCreateUser,
    loadingUsers,
    openEdit,
    toggleStatus,
  };
}
