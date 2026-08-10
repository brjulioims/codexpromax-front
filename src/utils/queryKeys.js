export const queryKeys = {
  me: {
    all: ["me"],
  },
  permisos: {
    all: ["permisos"],
  },
  roles: {
    all: ["roles"],
  },
  usuarios: {
    all: ["usuarios"],
  },
  clientes: {
    all: ["clientes"],
  },
  expedienteChecklist: {
    byExpediente: (expedienteId) => ["expedienteChecklist", expedienteId],
  },
};
