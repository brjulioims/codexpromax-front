const INITIAL_USERS = [
  {
    id: 1,
    nombre: "ADMINISTRADOR OFFLINE",
    email: "admin@offline.com",
    username: "admin",
    estatus: 1,
    created_at: "2026-07-28 10:00:00",
    rol_id: 1,
    rol_nombre: "ADMINISTRADOR"
  },
  {
    id: 2,
    nombre: "SUPERVISOR OFFLINE",
    email: "supervisor@offline.com",
    username: "supervisor",
    estatus: 1,
    created_at: "2026-07-28 10:00:00",
    rol_id: 2,
    rol_nombre: "SUPERVISOR"
  },
  {
    id: 3,
    nombre: "USUARIO INACTIVO OFFLINE",
    email: "user@offline.com",
    username: "user_inactivo",
    estatus: 0,
    created_at: "2026-07-28 10:00:00",
    rol_id: 3,
    rol_nombre: "USUARIO"
  }
];

function getStoredUsers() {
  const users = localStorage.getItem("mock_users");
  if (!users) {
    localStorage.setItem("mock_users", JSON.stringify(INITIAL_USERS));
    return INITIAL_USERS;
  }
  try {
    return JSON.parse(users);
  } catch {
    localStorage.setItem("mock_users", JSON.stringify(INITIAL_USERS));
    return INITIAL_USERS;
  }
}

function saveStoredUsers(users) {
  localStorage.setItem("mock_users", JSON.stringify(users));
}

function normalizeUsuario(usuario) {
  const id = usuario?.id;
  const email = usuario?.email?.trim?.() ?? "";
  const username = usuario?.username?.trim?.() ?? "";
  const nombre = usuario?.nombre?.trim?.() ?? username ?? email ?? "";
  const rolId = usuario?.rol_id ?? null;
  const rolNombre = usuario?.rol_nombre?.trim?.() ?? "";
  const estatus = Number(usuario?.estatus ?? 0);

  if (id == null || !nombre) return null;

  return {
    id,
    nombre,
    email,
    username,
    foto: "",
    estatus,
    createdAt: usuario?.created_at ?? "",
    rolId,
    rolNombre,
    status: estatus === 1 ? "Activo" : "Inactivo",
    role: rolNombre,
  };
}

export async function getUsuarios() {
  console.log("[MOCK] Fetching users list offline");
  const users = getStoredUsers();
  return users.map(normalizeUsuario).filter(Boolean);
}

export async function updateUsuario(id, payload) {
  console.log("[MOCK] Updating user offline:", id, payload);
  const users = getStoredUsers();
  const index = users.findIndex((u) => u.id === Number(id));

  if (index === -1) {
    throw new Error("Usuario no encontrado");
  }

  const roleNameMap = {
    1: "ADMINISTRADOR",
    2: "SUPERVISOR",
    3: "USUARIO"
  };

  const updatedUser = {
    ...users[index],
    nombre: payload.nombre ?? users[index].nombre,
    email: payload.email ?? users[index].email,
    username: payload.username ?? users[index].username,
    rol_id: payload.rol_id ? Number(payload.rol_id) : users[index].rol_id,
    rol_nombre: payload.rol_id ? (roleNameMap[payload.rol_id] ?? "USUARIO") : users[index].rol_nombre,
    estatus: payload.estatus !== undefined ? Number(payload.estatus) : users[index].estatus,
  };

  users[index] = updatedUser;
  saveStoredUsers(users);

  return normalizeUsuario(updatedUser);
}

export async function updateUsuarioPassword(id, payload) {
  console.log("[MOCK] Updating user password offline:", id);
  return { success: true };
}

export async function deleteUsuario(id) {
  console.log("[MOCK] Deleting user offline:", id);
  const users = getStoredUsers();
  const filtered = users.filter((u) => u.id !== Number(id));
  saveStoredUsers(filtered);
  return true;
}

export const USUARIOS_API_URL = "/api/usuarios";
