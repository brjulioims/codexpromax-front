import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  createExpedienteDocumento,
  deleteExpedienteDocumento,
} from "../../services/expedientesServices";
import {
  createChecklistItem,
  updateChecklistItem,
} from "../../services/paralegalServices";
import { queryKeys } from "../../utils/queryKeys";

export function useCreateChecklistItemMutation(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ expedienteId, payload }) =>
      createChecklistItem(expedienteId, payload),
    onSuccess: (data, variables, context) => {
      const expedienteId = variables?.expedienteId ?? null;

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

export function useUpdateChecklistItemMutation(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ expedienteId, itemId, payload }) =>
      updateChecklistItem(expedienteId, itemId, payload),
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

export function useDeleteChecklistItemMutation(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ expedienteId, docId }) =>
      deleteExpedienteDocumento(expedienteId, docId),
    onSuccess: (data, variables, context) => {
      const expedienteId = variables?.expedienteId ?? null;

      if (expedienteId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.expedienteChecklist.byExpediente(expedienteId),
          type: "all",
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

export function useCreateCustomChecklistItemMutation(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ expedienteId, payload }) =>
      createExpedienteDocumento(expedienteId, payload),
    onSuccess: (data, variables, context) => {
      const expedienteId = variables?.expedienteId ?? null;

      if (expedienteId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.expedienteChecklist.byExpediente(expedienteId),
          type: "all",
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
