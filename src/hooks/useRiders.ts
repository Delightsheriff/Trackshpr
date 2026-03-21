/**
 * useRiders — TanStack Query hook for fetching riders.
 */
import { useQuery } from "@tanstack/react-query";
import { fetchRiders } from "@/src/lib/supabaseQueries";
import { queryKeys } from "@/src/lib/queryKeys";

export function useRiders(sellerId: string | null) {
  return useQuery({
    queryKey: queryKeys.riders(sellerId ?? ""),
    queryFn: () => fetchRiders(sellerId!),
    enabled: !!sellerId,
  });
}
