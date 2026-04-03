/**
 * Hooks barrel export.
 */
export { useAuthState } from "./useAuthState";
export type { AuthStatus } from "./useAuthState";

export { useSession } from "./useSession";

export { useProfile, useSaveProfile, useUploadLogo, useProfileComplete, useDeleteAccount } from "./useProfile";
export { useOrders, useOrder, useCreateOrder } from "./useOrders";
export { useRiders, useRider, useAddRider, useUpdateRider, useDeleteRider } from "./useRiders";
export {
  useCustomers, useCustomer,
  useAddCustomer, useUpdateCustomer, useDeleteCustomer,
  useCustomerAddresses, useAddCustomerAddress, useUpdateCustomerAddress, useDeleteCustomerAddress,
} from "./useCustomers";
