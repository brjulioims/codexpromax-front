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
  expedientes: {
    qualityBandeja: ["expedientes", "quality-bandeja"],
    asignados: ["expedientes", "asignados"],
  },
  redaccionEstado: {
    byExpediente: (expedienteId) => ["redaccion-estado", expedienteId],
  },
  redacciones: {
    pendientesRedactor: ["redacciones", "pendientes-redactor"],
    pendientesQuality: ["redacciones", "pendientes-quality"],
    historialAsignador: ["redacciones", "historial-asignador"],
    redactor: ["redacciones", "redactor"],
    quality: ["redacciones", "quality"],
  },
  traducciones: {
    pendientesTraductor: ["traducciones", "pendientes-traductor"],
    pendientesQuality: ["traducciones", "pendientes-quality"],
    historialAsignador: ["traducciones", "historial-asignador"],
    traductor: ["traducciones", "traductor"],
    quality: ["traducciones", "quality"],
  },
};

export const workflowInvalidations = {
  quality: {
    solicitarRedaccion: (expedienteId) => [
      queryKeys.redaccionEstado.byExpediente(expedienteId),
      queryKeys.redacciones.pendientesRedactor,
    ],
    asignarExpediente: [
      queryKeys.expedientes.qualityBandeja,
      queryKeys.expedientes.asignados,
    ],
    reasignarExpediente: [queryKeys.expedientes.asignados],
  },
  redaccion: {
    asignarRedactor: [
      queryKeys.redacciones.pendientesRedactor,
      queryKeys.redacciones.historialAsignador,
      queryKeys.redacciones.redactor,
    ],
    asignarQuality: [
      queryKeys.redacciones.pendientesQuality,
      queryKeys.redacciones.historialAsignador,
      queryKeys.redacciones.quality,
    ],
    reasignarRedactor: [
      queryKeys.redacciones.historialAsignador,
      queryKeys.redacciones.redactor,
    ],
    reasignarQuality: [
      queryKeys.redacciones.historialAsignador,
      queryKeys.redacciones.quality,
    ],
    registrarContacto: [queryKeys.redacciones.redactor],
    iniciarToma: [queryKeys.redacciones.redactor],
    enviarQuality: [
      queryKeys.redacciones.redactor,
      queryKeys.redacciones.pendientesQuality,
      queryKeys.redacciones.quality,
    ],
    rechazarQuality: [
      queryKeys.redacciones.quality,
      queryKeys.redacciones.redactor,
    ],
    enviarTraduccion: [
      queryKeys.redacciones.quality,
      queryKeys.traducciones.pendientesTraductor,
    ],
  },
  traduccion: {
    asignarTraductor: [
      queryKeys.traducciones.pendientesTraductor,
      queryKeys.traducciones.historialAsignador,
      queryKeys.traducciones.traductor,
    ],
    asignarQuality: [
      queryKeys.traducciones.pendientesQuality,
      queryKeys.traducciones.historialAsignador,
      queryKeys.traducciones.quality,
    ],
    reasignarTraductor: [
      queryKeys.traducciones.historialAsignador,
      queryKeys.traducciones.traductor,
    ],
    reasignarQuality: [
      queryKeys.traducciones.historialAsignador,
      queryKeys.traducciones.quality,
    ],
    marcarIlegible: [queryKeys.traducciones.traductor],
    enviarQuality: [
      queryKeys.traducciones.traductor,
      queryKeys.traducciones.quality,
    ],
    aprobarQuality: [queryKeys.traducciones.quality],
    rechazarQuality: [
      queryKeys.traducciones.quality,
      queryKeys.traducciones.traductor,
    ],
  },
};

export function invalidateWorkflowQueries(queryClient, keys) {
  return Promise.all(
    keys.map(async (queryKey) => {
      await queryClient.invalidateQueries({
        queryKey,
        refetchType: "all",
      });

      await queryClient.refetchQueries({
        queryKey,
        type: "all",
      });
    })
  );
}
