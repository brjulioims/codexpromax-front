import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createRol, deleteRol, updateRol } from "../../services/rolesServices";
import { queryKeys } from "../../utils/queryKeys";

export function useCreateRolMutation(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createRol,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.roles.all });
      options.onSuccess?.(...args);
    },
    onError: (...args) => options.onError?.(...args),
  });
}

export function useUpdateRolMutation(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }) => updateRol(id, payload),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.roles.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.usuarios.all });
      options.onSuccess?.(...args);
    },
    onError: (...args) => options.onError?.(...args),
  });
}

export function useDeleteRolMutation(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteRol,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.roles.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.usuarios.all });
      options.onSuccess?.(...args);
    },
    onError: (...args) => options.onError?.(...args),
  });
}
