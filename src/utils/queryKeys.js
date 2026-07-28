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
  vendedores: {
    all: ["vendedores"],
  },
  ciudades: {
    all: ["ciudades"],
  },
  marcas: {
    all: ["marcas"],
  },
  empresas: {
    all: ["empresas"],
  },
  equipos: {
    all: ["equipos"],
  },
  grupos: {
    all: ["grupos"],
    byEquipo: (equipoId) => ["grupos", "equipo", equipoId],
    byEquipos: (equipoIds = []) => ["grupos", "equipos", equipoIds],
  },
  tiposAsignacion: {
    all: ["tiposAsignacion"],
  },
  tiposAsignacionReferido: {
    all: ["tiposAsignacionReferido"],
  },
  tiposAsignacionUsa: {
    all: ["tiposAsignacionUsa"],
  },
  asignacionGrupos: {
    siguiente: (idioma = "general") => ["asignacionGrupos", "siguiente", idioma],
    ultimos: (idioma = "general", limit = 7) => [
      "asignacionGrupos",
      "ultimos",
      idioma,
      limit,
    ],
  },
  asignacionesUsa: {
    reporte: ["asignacionesUsa", "reporte"],
  },
  historialReferidosDetalle: {
    all: ["historialReferidosDetalle"],
  },
  historialReferidos: {
    all: ["historialReferidos"],
  },
  recuentoAsignaciones: {
    all: ["recuentoAsignaciones"],
    list: ({ fechaInicio = "", fechaFin = "" } = {}) => [
      "recuentoAsignaciones",
      fechaInicio,
      fechaFin,
    ],
  },
  historialDisponibilidad: {
    all: ["historialDisponibilidad"],
    list: (idioma = "general") => ["historialDisponibilidad", idioma],
  },
  historialAsignaciones: {
    all: ["historialAsignaciones"],
    list: (idioma = "general") => ["historialAsignaciones", idioma],
  },
  historialAsignacionesUsa: {
    all: ["historialAsignacionesUsa"],
    list: ({ fechaInicio = "", fechaFin = "" } = {}) => [
      "historialAsignacionesUsa",
      fechaInicio,
      fechaFin,
    ],
  },
};
