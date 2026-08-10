import { useMutation, useQueryClient } from "@tanstack/react-query";

import { updateChecklistItem } from "../../services/paralegalServices";
import { queryKeys } from "../../utils/queryKeys";

export function useUpdateChecklistItemMutation(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ itemId, payload }) => updateChecklistItem(itemId, payload),
    onSuccess: (data, variables, context) => {
      const expedienteId =
        variables?.expedienteId ??
        variables?.payload?.expediente_id ??
        null;

      if (expedienteId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.expedienteChecklist.byExpediente(expedienteId),
          type: "all",
        });
      } else {
        queryClient.invalidateQueries({
          queryKey: ["expedienteChecklist"],
          type: "all",
          exact: false,
        });
      }
      if (typeof options.onSuccess === "function") {
        options.onSuccess(data, variables, context);
      }
    },
    onError: (error, variables, context) => {
      if (typeof options.onError === "function") {
        options.onError(error, variables, context);
      }
    },
  });
}
