/**
 * useCustomers — TanStack Query hooks for customers (fetch, add).
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchCustomers, insertCustomer } from "@/src/lib/supabaseQueries";
import { queryKeys } from "@/src/lib/queryKeys";

export function useCustomers(userId: string | null) {
  return useQuery({
    queryKey: queryKeys.customers(userId ?? ""),
    queryFn: () => fetchCustomers(userId!),
    enabled: !!userId,
  });
}

export function useAddCustomer(userId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; phone?: string; address?: string; city?: string }) =>
      insertCustomer({ user_id: userId!, ...data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customers(userId ?? "") });
    },
  });
}
