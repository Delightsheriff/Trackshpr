/**
 * Central query key factory — one source of truth for all TanStack Query keys.
 * Using an object prevents typos and makes key invalidation predictable.
 *
 * Usage:
 *   queryClient.invalidateQueries({ queryKey: queryKeys.profile(userId) })
 *   queryClient.invalidateQueries({ queryKey: ['orders'] })   // all orders
 */
export const queryKeys = {
  profile:    (userId: string)         => ["profile", userId] as const,
  orders:     (sellerId: string)       => ["orders", sellerId] as const,
  order:      (orderId: string)        => ["order", orderId] as const,
  riders:     (sellerId: string)       => ["riders", sellerId] as const,
  rider:      (riderId: string)        => ["rider", riderId] as const,
  customers:          (sellerId: string)    => ["customers", sellerId]          as const,
  customer:           (customerId: string)  => ["customer", customerId]          as const,
  customerAddresses:  (customerId: string)  => ["customerAddresses", customerId] as const,
  analytics:    (sellerId: string, period: string) => ["analytics", sellerId, period] as const,
  activeOrders: (sellerId: string) => ["activeOrders", sellerId] as const,
  todayStats:   (sellerId: string) => ["todayStats", sellerId] as const,
} as const;
