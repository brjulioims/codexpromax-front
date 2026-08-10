import { useQuery } from "@tanstack/react-query";

import { getExpedienteChecklist } from "../../services/paralegalServices";
import { queryKeys } from "../../utils/queryKeys";

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
