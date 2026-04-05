/**
 * useOrders — TanStack Query hooks for orders (fetch, fetch one, create).
 */
import { useEffect } from "react";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchFleetMapOrders,
  fetchOrders,
  fetchOrder,
  fetchOrderItems,
  fetchOrdersPage,
  fetchOrderTimeline,
  insertOrder,
  fetchActiveOrders,
  fetchTodayStats,
  ORDER_PAGE_SIZE,
  type Order,
  type OrderEvent,
  type OrderItem,
  type FleetMapOrder,
  type TodayStats,
} from "@/src/lib/supabaseQueries";
import { queryKeys } from "@/src/lib/queryKeys";
import { supabase } from "@/src/lib/supabase";

export function useOrders(userId: string | null) {
  return useQuery({
    queryKey: queryKeys.orders(userId ?? ""),
    queryFn: () => fetchOrders(userId!),
    enabled: !!userId,
  });
}

export function useFleetMapOrders(userId: string | null) {
  return useQuery<FleetMapOrder[]>({
    queryKey: queryKeys.fleetOrders(userId ?? ""),
    queryFn: () => fetchFleetMapOrders(userId!),
    enabled: !!userId,
  });
}

export function useInfiniteOrders(
  userId: string | null,
  status: string | null,
  search: string,
) {
  return useInfiniteQuery({
    queryKey: queryKeys.ordersInfinite(userId ?? "", status ?? "all", search),
    queryFn: ({ pageParam }) =>
      fetchOrdersPage({
        sellerId: userId!,
        status,
        search,
        cursor: pageParam,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, _allPages, lastPageParam) => {
      if (lastPage.length < ORDER_PAGE_SIZE) return undefined;
      return lastPageParam + ORDER_PAGE_SIZE;
    },
    enabled: !!userId,
  });
}

export function useOrderTimeline(orderId: string | null) {
  return useQuery<OrderEvent[]>({
    queryKey: queryKeys.orderTimeline(orderId ?? ""),
    queryFn: () => fetchOrderTimeline(orderId!),
    enabled: !!orderId,
  });
}

export function useOrder(orderId: string | null) {
  return useQuery({
    queryKey: queryKeys.order(orderId ?? ""),
    queryFn: () => fetchOrder(orderId!),
    enabled: !!orderId,
  });
}

export function useOrderItems(orderId: string | null) {
  return useQuery<OrderItem[]>({
    queryKey: queryKeys.orderItems(orderId ?? ""),
    queryFn: () => fetchOrderItems(orderId!),
    enabled: !!orderId,
  });
}

export function useActiveOrders(userId: string | null) {
  return useQuery({
    queryKey: queryKeys.activeOrders(userId ?? ""),
    queryFn: () => fetchActiveOrders(userId!),
    enabled: !!userId,
  });
}

export function useTodayStats(userId: string | null) {
  return useQuery<TodayStats>({
    queryKey: queryKeys.todayStats(userId ?? ""),
    queryFn: () => fetchTodayStats(userId!),
    enabled: !!userId,
  });
}

/**
 * Subscribes to Supabase Realtime for the seller's orders table.
 * Invalidates orders, activeOrders, and todayStats caches on any change.
 */
export function useOrdersRealtime(userId: string | null) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`orders_realtime_${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `seller_id=eq.${userId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: queryKeys.orders(userId) });
          queryClient.invalidateQueries({ queryKey: ["ordersInfinite", userId] });
          queryClient.invalidateQueries({ queryKey: queryKeys.activeOrders(userId) });
          queryClient.invalidateQueries({ queryKey: queryKeys.todayStats(userId) });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);
}

export function useCreateOrder(userId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Omit<Parameters<typeof insertOrder>[0], "seller_id">): Promise<Order> =>
      insertOrder({ seller_id: userId!, ...payload }),
    onSuccess: (_order, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders(userId ?? "") });
      queryClient.invalidateQueries({ queryKey: ["ordersInfinite", userId ?? ""] });
      queryClient.invalidateQueries({ queryKey: queryKeys.activeOrders(userId ?? "") });
      queryClient.invalidateQueries({ queryKey: queryKeys.todayStats(userId ?? "") });
      queryClient.invalidateQueries({ queryKey: queryKeys.customers(userId ?? "") });

      if (variables.order_items?.length) {
        queryClient.invalidateQueries({ queryKey: queryKeys.products(userId ?? "") });
        queryClient.invalidateQueries({ queryKey: queryKeys.lowStockProducts(userId ?? "") });
      }
    },
  });
}
