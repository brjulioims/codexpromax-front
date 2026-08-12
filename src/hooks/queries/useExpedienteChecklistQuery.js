import { useQuery } from "@tanstack/react-query";

import { getExpedienteDocumentos } from "../../services/expedientesServices";
import { queryKeys } from "../../utils/queryKeys";

const CATEGORIA_MAP = {
  BIOGRAFICO: "biograficos",
  EVIDENCIA: "evidencias",
  FORMULARIO: "formularios",
};

function normalizeDocumento(item, categoria, index) {
  if (item == null) {
    return null;
  }

  if (typeof item !== "object") {
    return {
      id: `${categoria}-${index}`,
      categoria_ui: CATEGORIA_MAP[categoria] ?? "biograficos",
      titulo_requisito: String(item).trim(),
      estado: "RECIBIDO",
      observaciones: "",
      usuario_actualizador: null,
      updated_at: null,
    };
  }

  return {
    ...item,
    id: item?.id ?? `${categoria}-${index}`,
    doc_id:
      item?.doc_id ??
      item?.documento_id ??
      item?.id ??
      null,
    categoria_ui: CATEGORIA_MAP[categoria] ?? "biograficos",
    titulo_requisito:
      item?.titulo_requisito ??
      item?.nombre_documento ??
      item?.nombre ??
      item?.titulo ??
      item?.documento ??
      "",
    estado: item?.estado ?? "RECIBIDO",
    observaciones: item?.observaciones ?? item?.descripcion ?? "",
    usuario_actualizador:
      item?.usuario_actualizador ?? item?.usuario ?? null,
    updated_at:
      item?.updated_at ?? item?.fecha_actualizacion ?? null,
  };
}

async function getExpedienteChecklist(expedienteId) {
  const data = await getExpedienteDocumentos(expedienteId);
  const documentos = data?.documentos ?? {};

  return Object.entries(documentos).flatMap(([categoria, items]) =>
    (Array.isArray(items) ? items : [])
      .map((item, index) =>
        normalizeDocumento(item, categoria, index)
      )
      .filter(Boolean)
  );
}

export function useExpedienteChecklistQuery(expedienteId, options = {}) {
  const enabled = Boolean(
    expedienteId !== undefined &&
      expedienteId !== null &&
      expedienteId !== "" &&
      !isNaN(Number(expedienteId))
  );

  return useQuery({
    queryKey: queryKeys.expedienteChecklist.byExpediente(expedienteId),
    queryFn: () => getExpedienteChecklist(expedienteId),
    enabled,
    ...options,
  });
}
