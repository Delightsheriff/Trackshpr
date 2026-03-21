/**
 * useOrders — TanStack Query hook for fetching orders.
 */
import { useQuery } from "@tanstack/react-query";
import { fetchOrders } from "@/src/lib/supabaseQueries";
import { queryKeys } from "@/src/lib/queryKeys";

export function useOrders(sellerId: string | null) {
  return useQuery({
    queryKey: queryKeys.orders(sellerId ?? ""),
    queryFn: () => fetchOrders(sellerId!),
    enabled: !!sellerId,
  });
}
