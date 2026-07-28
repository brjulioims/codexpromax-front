import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  createPermiso,
  deletePermiso,
  saveRolPermiso,
  updatePermiso,
} from "../../services/permisosServices";
import { queryKeys } from "../../utils/queryKeys";

function resolveCollection(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.permisos)) return data.permisos;
  return [];
}

export function useCreatePermisoMutation(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPermiso,
    onSuccess: (created, ...args) => {
      queryClient.setQueryData(queryKeys.permisos.all, (previous) => {
        const current = resolveCollection(previous);
        if (!created?.id) return current;
        if (current.some((item) => Number(item?.id) === Number(created.id))) return current;
        return [...current, created];
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.permisos.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.roles.all });
      options.onSuccess?.(created, ...args);
    },
    onError: (...args) => options.onError?.(...args),
  });
}

export function useUpdatePermisoMutation(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }) => updatePermiso(id, payload),
    onSuccess: (updated, ...args) => {
      queryClient.setQueryData(queryKeys.permisos.all, (previous) => {
        const current = resolveCollection(previous);
        if (!updated?.id) return current;
        return current.map((item) =>
          Number(item?.id) === Number(updated.id) ? { ...item, ...updated } : item
        );
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.permisos.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.roles.all });
      options.onSuccess?.(updated, ...args);
    },
    onError: (...args) => options.onError?.(...args),
  });
}

export function useDeletePermisoMutation(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deletePermiso,
    onSuccess: (_, deletedId, ...args) => {
      queryClient.setQueryData(queryKeys.permisos.all, (previous) => {
        const current = resolveCollection(previous);
        return current.filter((item) => Number(item?.id) !== Number(deletedId));
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.permisos.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.roles.all });
      options.onSuccess?.(_, deletedId, ...args);
    },
    onError: (...args) => options.onError?.(...args),
  });
}

export function useSaveRolPermisoMutation(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: saveRolPermiso,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.roles.all });
      options.onSuccess?.(...args);
    },
    onError: (...args) => options.onError?.(...args),
  });
}
