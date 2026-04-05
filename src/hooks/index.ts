/**
 * Hooks barrel export.
 */
export { useAuthState } from "./useAuthState";
export type { AuthStatus } from "./useAuthState";

export { useSession } from "./useSession";
export {
  useAnalyticsOverview,
  useAnalyticsDailyChart,
  useAnalyticsTopRiders,
} from "./useAnalytics";

export { useProfile, useSaveProfile, useUploadLogo, useProfileComplete, useDeleteAccount } from "./useProfile";
export {
  useOrders,
  useFleetMapOrders,
  useOrder,
  useOrderItems,
  useCreateOrder,
  useInfiniteOrders,
  useOrderTimeline,
} from "./useOrders";
export { useRiders, useRider, useAddRider, useUpdateRider, useDeleteRider } from "./useRiders";
export {
  useCustomers, useCustomer,
  useAddCustomer, useUpdateCustomer, useDeleteCustomer,
  useCustomerAddresses, useAddCustomerAddress, useUpdateCustomerAddress, useDeleteCustomerAddress,
} from "./useCustomers";
export {
  useProducts,
  useProduct,
  useLowStockProducts,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  useRestockProduct,
  useAdjustStock,
} from "./useProducts";
