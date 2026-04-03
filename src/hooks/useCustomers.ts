/**
 * useCustomers — TanStack Query hooks for customers and their addresses.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteCustomer,
  deleteCustomerAddress,
  fetchCustomer,
  fetchCustomerAddresses,
  fetchCustomers,
  insertCustomer,
  insertCustomerAddress,
  setDefaultAddress,
  updateCustomer,
  updateCustomerAddress,
} from "@/src/lib/supabaseQueries";
import { queryKeys } from "@/src/lib/queryKeys";

// ── Customer list ─────────────────────────────────────────────────────────────

export function useCustomers(sellerId: string | null) {
  return useQuery({
    queryKey: queryKeys.customers(sellerId ?? ""),
    queryFn: () => fetchCustomers(sellerId!),
    enabled: !!sellerId,
    staleTime: 1000 * 60 * 2,
  });
}

export function useCustomer(customerId: string | null) {
  return useQuery({
    queryKey: queryKeys.customer(customerId ?? ""),
    queryFn: () => fetchCustomer(customerId!),
    enabled: !!customerId,
    staleTime: 1000 * 60 * 2,
  });
}

// ── Customer mutations ────────────────────────────────────────────────────────

export function useAddCustomer(sellerId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      name: string;
      phone: string;
      notes?: string | null;
      address: string;
      city?: string | null;
      address_label?: string | null;
    }) => insertCustomer({ seller_id: sellerId!, ...data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customers(sellerId ?? "") });
    },
  });
}

export function useUpdateCustomer(sellerId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      customerId,
      data,
    }: {
      customerId: string;
      data: { name: string; phone: string; notes?: string | null };
    }) => updateCustomer(customerId, data),
    onSuccess: (_updated, { customerId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customers(sellerId ?? "") });
      queryClient.invalidateQueries({ queryKey: queryKeys.customer(customerId) });
    },
  });
}

export function useDeleteCustomer(sellerId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (customerId: string) => deleteCustomer(customerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customers(sellerId ?? "") });
    },
  });
}

// ── Customer address hooks ────────────────────────────────────────────────────

export function useCustomerAddresses(customerId: string | null) {
  return useQuery({
    queryKey: queryKeys.customerAddresses(customerId ?? ""),
    queryFn: () => fetchCustomerAddresses(customerId!),
    enabled: !!customerId,
    staleTime: 1000 * 60 * 2,
  });
}

export function useAddCustomerAddress(sellerId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      customer_id: string;
      address: string;
      city?: string | null;
      label?: string | null;
      is_default: boolean;
    }) => insertCustomerAddress({ seller_id: sellerId!, ...data }),
    onSuccess: (_addr, vars) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customerAddresses(vars.customer_id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.customers(sellerId ?? "") });
      queryClient.invalidateQueries({ queryKey: queryKeys.customer(vars.customer_id) });
    },
  });
}

export function useUpdateCustomerAddress(sellerId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      addressId,
      customerId,
      data,
    }: {
      addressId: string;
      customerId: string;
      data: { address?: string; city?: string | null; label?: string | null; is_default?: boolean };
    }) => updateCustomerAddress(addressId, data),
    onSuccess: (_addr, { customerId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customerAddresses(customerId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.customers(sellerId ?? "") });
      queryClient.invalidateQueries({ queryKey: queryKeys.customer(customerId) });
    },
  });
}

export function useDeleteCustomerAddress(sellerId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      addressId,
      customerId,
      nextDefaultId,
    }: {
      addressId: string;
      customerId: string;
      nextDefaultId?: string; // promote before delete if this is the default
    }) =>
      nextDefaultId
        ? setDefaultAddress(nextDefaultId).then(() => deleteCustomerAddress(addressId))
        : deleteCustomerAddress(addressId),
    onSuccess: (_v, { customerId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customerAddresses(customerId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.customers(sellerId ?? "") });
      queryClient.invalidateQueries({ queryKey: queryKeys.customer(customerId) });
    },
  });
}
