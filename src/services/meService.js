export async function getMe() {
  const token = localStorage.getItem("token");

  if (!token) {
    throw new Error("TOKEN_REQUIRED");
  }

  return {
    id: 1,
    nombre: "ADMINISTRADOR OFFLINE",
    email: "admin@offline.com",
    username: "admin",
    photo: "",
    estatus: 1,
    rolId: 1,
    rolNombre: "ADMINISTRADOR",
    permisos: [
      { id: 1, nombre: "dashboard", clave: "dashboard", valor: true },
      { id: 2, nombre: "mantenimiento", clave: "mantenimiento", valor: true },
      { id: 3, nombre: "usuarios", clave: "usuarios", valor: true }
    ],
    raw: {}
  };
}

export const ME_API_URL = "/api/me";
