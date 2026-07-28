import { useQuery } from "@tanstack/react-query";

import { getPermisos } from "../../services/permisosServices";
import { queryKeys } from "../../utils/queryKeys";

export function usePermisosQuery() {
  return useQuery({
    queryKey: queryKeys.permisos.all,
    queryFn: getPermisos,
  });
}
