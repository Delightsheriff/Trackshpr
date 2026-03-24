/**
 * useRiders — TanStack Query hooks for riders (fetch, add, delete).
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteRider,
  fetchRider,
  fetchRiders,
  insertRider,
} from "@/src/lib/supabaseQueries";
import { queryKeys } from "@/src/lib/queryKeys";

export function useRiders(sellerId: string | null) {
  return useQuery({
    queryKey: queryKeys.riders(sellerId ?? ""),
    queryFn: () => fetchRiders(sellerId!),
    enabled: !!sellerId,
    staleTime: 1000 * 60 * 2,
  });
}

export function useRider(riderId: string | null) {
  return useQuery({
    queryKey: queryKeys.rider(riderId ?? ""),
    queryFn: () => fetchRider(riderId!),
    enabled: !!riderId,
    staleTime: 1000 * 60 * 2,
  });
}

export function useAddRider(sellerId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { name: string; phone: string; notes?: string }) =>
      insertRider({ seller_id: sellerId!, ...data }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.riders(sellerId ?? ""),
      });
    },
  });
}

export function useDeleteRider(sellerId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (riderId: string) => deleteRider(riderId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.riders(sellerId ?? ""),
      });
    },
  });
}
