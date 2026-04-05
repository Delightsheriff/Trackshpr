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
  ordersInfinite: (sellerId: string, status: string, search: string) =>
    ["ordersInfinite", sellerId, status, search] as const,
  order:      (orderId: string)        => ["order", orderId] as const,
  orderItems: (orderId: string)        => ["orderItems", orderId] as const,
  orderTimeline: (orderId: string)     => ["orderTimeline", orderId] as const,
  fleetOrders: (sellerId: string)      => ["fleetOrders", sellerId] as const,
  riders:     (sellerId: string)       => ["riders", sellerId] as const,
  rider:      (riderId: string)        => ["rider", riderId] as const,
  customers:          (sellerId: string)    => ["customers", sellerId]          as const,
  customer:           (customerId: string)  => ["customer", customerId]          as const,
  customerAddresses:  (customerId: string)  => ["customerAddresses", customerId] as const,
  products:    (sellerId: string) => ["products", sellerId] as const,
  product:     (productId: string) => ["product", productId] as const,
  lowStockProducts: (sellerId: string) => ["lowStockProducts", sellerId] as const,
  analytics:    (sellerId: string, period: string) => ["analytics", sellerId, period] as const,
  analyticsOverview: (sellerId: string) => ["analyticsOverview", sellerId] as const,
  analyticsDailyChart: (sellerId: string) => ["analyticsDailyChart", sellerId] as const,
  analyticsTopRiders: (sellerId: string) => ["analyticsTopRiders", sellerId] as const,
  analyticsInventory: (sellerId: string) => ["analyticsInventory", sellerId] as const,
  activeOrders: (sellerId: string) => ["activeOrders", sellerId] as const,
  todayStats:   (sellerId: string) => ["todayStats", sellerId] as const,
} as const;
