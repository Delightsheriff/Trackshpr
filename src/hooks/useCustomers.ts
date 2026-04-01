/**
 * useCustomers — TanStack Query hooks for customers (fetch, add).
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchCustomers, insertCustomer } from "@/src/lib/supabaseQueries";
import { queryKeys } from "@/src/lib/queryKeys";

export function useCustomers(sellerId: string | null) {
  return useQuery({
    queryKey: queryKeys.customers(sellerId ?? ""),
    queryFn: () => fetchCustomers(sellerId!),
    enabled: !!sellerId,
  });
}

export function useAddCustomer(sellerId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { customer_name: string; customer_phone: string; address: string; city?: string }) =>
      insertCustomer({ seller_id: sellerId!, ...data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customers(sellerId ?? "") });
    },
  });
}
