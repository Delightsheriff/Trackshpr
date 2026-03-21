/**
 * useCustomers — TanStack Query hook for fetching customers.
 */
import { useQuery } from "@tanstack/react-query";
import { fetchCustomers } from "@/src/lib/supabaseQueries";
import { queryKeys } from "@/src/lib/queryKeys";

export function useCustomers(sellerId: string | null) {
  return useQuery({
    queryKey: queryKeys.customers(sellerId ?? ""),
    queryFn: () => fetchCustomers(sellerId!),
    enabled: !!sellerId,
  });
}
