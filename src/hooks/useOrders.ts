/**
 * useOrders — TanStack Query hooks for orders (fetch, fetch one, create).
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchOrders, fetchOrder, insertOrder, type Order } from "@/src/lib/supabaseQueries";
import { queryKeys } from "@/src/lib/queryKeys";

export function useOrders(userId: string | null) {
  return useQuery({
    queryKey: queryKeys.orders(userId ?? ""),
    queryFn: () => fetchOrders(userId!),
    enabled: !!userId,
  });
}

export function useOrder(orderId: string | null) {
  return useQuery({
    queryKey: queryKeys.order(orderId ?? ""),
    queryFn: () => fetchOrder(orderId!),
    enabled: !!orderId,
  });
}

export function useCreateOrder(userId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Omit<Parameters<typeof insertOrder>[0], "user_id">): Promise<Order> =>
      insertOrder({ user_id: userId!, ...payload }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders(userId ?? "") });
    },
  });
}
