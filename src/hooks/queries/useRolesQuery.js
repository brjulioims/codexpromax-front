import { useQuery } from "@tanstack/react-query";

import { getRoles } from "../../services/rolesServices";
import { queryKeys } from "../../utils/queryKeys";

export function useRolesQuery() {
  return useQuery({
    queryKey: queryKeys.roles.all,
    queryFn: getRoles,
  });
}
