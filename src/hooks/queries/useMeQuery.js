import { useQuery } from "@tanstack/react-query";

import { getMe } from "../../services/meService";
import { queryKeys } from "../../utils/queryKeys";

export function useMeQuery(options = {}) {
  return useQuery({
    queryKey: queryKeys.me.all,
    queryFn: getMe,
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60,
    enabled: Boolean(localStorage.getItem("token")),
    ...options,
  });
}
