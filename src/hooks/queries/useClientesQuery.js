import { useQuery } from "@tanstack/react-query";

import { getClientes } from "../../services/clientes";
import { queryKeys } from "../../utils/queryKeys";

export function useClientesQuery() {
  return useQuery({
    queryKey: queryKeys.clientes.all,
    queryFn: getClientes,
  });
}
