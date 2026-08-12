import { useQuery } from "@tanstack/react-query";

import { getCatalogoDocumentos } from "../../services/catalogoDocumentosServices";

export function usePlantillasChecklistQuery(options = {}) {
  return useQuery({
    queryKey: ["plantillasChecklist"],
    queryFn: () => getCatalogoDocumentos(),
    ...options,
  });
}
