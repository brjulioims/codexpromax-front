export const ENABLED_PERMISSIONS_STORAGE_KEY = "enabledPermissionCodes";

export const IMS_MARCA_ID = 4;
export const IMS_USA_MARCA_ID = 5;

export const LIDER_VENTAS_ROLE_ID = 5;

export const REFERIDOS_COUNT_CODES = ["rr", "cp", "ca", "p", "shr"];

export const REFERIDOS_TOOLTIP_ITEMS = [
  "RR: REFERIDO REASIGNADO",
  "CP: CLIENTE DE PUBLICIDAD",
  "CA: CLIENTE ACTIVO REASIGNADO",
  "P:  CLIENTES PROPIO (NO SE SUMAN)",
  "SHR: REASIGNACION DE LECTURA HUELLAS",
];

export const PERIOD_OPTIONS = [
  { value: "month", label: "Este mes" },
  { value: "today", label: "Hoy" },
  { value: "week", label: "Esta semana" },
  { value: "quarter", label: "Este trimestre" },
  { value: "year", label: "Este año" },
  { value: "custom", label: "Personalizado" },
];

export const CALENDAR_PERIOD_OPTIONS = [
  { value: "today", label: "Hoy" },
  { value: "week", label: "Esta semana" },
  { value: "month", label: "Este mes" },
  { value: "quarter", label: "Este trimestre" },
  { value: "year", label: "Este año" },
  { value: "custom", label: "Personalizado" },
];

export const INITIAL_ASSIGN_DRAFT = {
  nombreReferido: "",
  crmLink: "",
  tipoTransferencia: "",
  agenteComercial: "",
  vendedor: "",
  equipo: "",
  teamId: "",
  rowIndex: -1,
};

export const INITIAL_CHANGE_DRAFT = {
  sourceTeamId: "",
  sellerName: "",
  nextCloserName: "",
  targetTeamId: "",
  targetRowIndex: "",
};