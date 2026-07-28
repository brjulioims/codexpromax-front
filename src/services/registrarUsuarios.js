function getStoredUsers() {
  const users = localStorage.getItem("mock_users");
  if (!users) return [];
  try {
    return JSON.parse(users);
  } catch {
    return [];
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
    estatus,
    createdAt: usuario?.created_at ?? "",
    rolId,
    rolNombre,
    status: estatus === 1 ? "Activo" : "Inactivo",
    role: rolNombre,
  };
}

export async function createUsuario(payload) {
  console.log("[MOCK] Creating user offline:", payload);
  const users = getStoredUsers();
  
  const roleNameMap = {
    1: "ADMINISTRADOR",
    2: "SUPERVISOR",
    3: "USUARIO"
  };

  const newId = users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1;
  const newUser = {
    id: newId,
    nombre: payload.nombre,
    email: payload.email,
    username: payload.username,
    estatus: payload.estatus !== undefined ? Number(payload.estatus) : 1,
    created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
    rol_id: payload.rol_id ? Number(payload.rol_id) : 3,
    rol_nombre: payload.rol_id ? (roleNameMap[payload.rol_id] ?? "USUARIO") : "USUARIO",
  };

  users.push(newUser);
  saveStoredUsers(users);

  return normalizeUsuario(newUser);
}

export const REGISTRAR_USUARIOS_API_URL = "/api/register";
