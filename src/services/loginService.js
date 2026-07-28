export async function loginUsuario({ identifier, password }) {
  console.log("[MOCK] Logging in user offline:", identifier);
  
  const mockUser = {
    id: 1,
    nombre: "ADMINISTRADOR OFFLINE",
    email: "admin@offline.com",
    username: identifier || "admin",
    rol_id: 1,
    rol_nombre: "ADMINISTRADOR",
    estatus: 1
  };

  return {
    success: true,
    token: "mock-token-1234567890",
    usuario: mockUser
  };
}

export const AUTH_API_URL = "/api/login";