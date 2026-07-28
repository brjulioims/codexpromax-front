import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createUsuario } from "../../services/registrarUsuarios";
import { updateUsuario, updateUsuarioPassword } from "../../services/usuariosServices";
import { queryKeys } from "../../utils/queryKeys";

export function useCreateUsuarioMutation(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createUsuario,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.usuarios.all });
      options.onSuccess?.(...args);
    },
    onError: (...args) => options.onError?.(...args),
  });
}

export function useUpdateUsuarioMutation(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }) => updateUsuario(id, payload),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.usuarios.all });
      options.onSuccess?.(...args);
    },
    onError: (...args) => options.onError?.(...args),
  });
}

export function useUpdateUsuarioPasswordMutation(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, password }) => updateUsuarioPassword(id, { password }),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.usuarios.all });
      options.onSuccess?.(...args);
    },
    onError: (...args) => options.onError?.(...args),
  });
}
