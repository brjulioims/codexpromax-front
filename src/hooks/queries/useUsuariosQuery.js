import { useQuery } from "@tanstack/react-query";

import { getUsuarios } from "../../services/usuariosServices";
import { queryKeys } from "../../utils/queryKeys";

export function useUsuariosQuery() {
  return useQuery({
    queryKey: queryKeys.usuarios.all,
    queryFn: getUsuarios,
  });
}
