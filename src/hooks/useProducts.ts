import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/src/lib/queryKeys";
import {
  adjustStock,
  deleteProduct,
  fetchLowStockProducts,
  fetchProductById,
  fetchProducts,
  insertProduct,
  restockProduct,
  updateProduct,
  type InsertProductPayload,
  type Product,
  type ProductDetail,
  type StockMovementType,
} from "@/src/lib/supabaseQueries";

export function useProducts(sellerId: string | null) {
  return useQuery<Product[]>({
    queryKey: queryKeys.products(sellerId ?? ""),
    queryFn: () => fetchProducts(sellerId!),
    enabled: !!sellerId,
    staleTime: 1000 * 60 * 2,
  });
}

export function useProduct(productId: string | null) {
  return useQuery<ProductDetail>({
    queryKey: queryKeys.product(productId ?? ""),
    queryFn: () => fetchProductById(productId!),
    enabled: !!productId,
    staleTime: 1000 * 30,
  });
}

export function useLowStockProducts(sellerId: string | null) {
  return useQuery<Product[]>({
    queryKey: queryKeys.lowStockProducts(sellerId ?? ""),
    queryFn: () => fetchLowStockProducts(sellerId!),
    enabled: !!sellerId,
    staleTime: 1000 * 60,
  });
}

function invalidateInventoryQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  sellerId: string | null,
  productId?: string,
) {
  queryClient.invalidateQueries({ queryKey: queryKeys.products(sellerId ?? "") });
  queryClient.invalidateQueries({ queryKey: queryKeys.lowStockProducts(sellerId ?? "") });
  if (productId) {
    queryClient.invalidateQueries({ queryKey: queryKeys.product(productId) });
  }
}

export function useCreateProduct(sellerId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: Omit<InsertProductPayload, "seller_id">) =>
      insertProduct({ seller_id: sellerId!, ...payload }),
    onSuccess: (product) => {
      invalidateInventoryQueries(queryClient, sellerId, product.id);
    },
  });
}

export function useUpdateProduct(sellerId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      productId,
      data,
    }: {
      productId: string;
      data: Parameters<typeof updateProduct>[1];
    }) => updateProduct(productId, data),
    onSuccess: (_product, { productId }) => {
      invalidateInventoryQueries(queryClient, sellerId, productId);
    },
  });
}

export function useDeleteProduct(sellerId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (productId: string) => deleteProduct(productId),
    onSuccess: () => {
      invalidateInventoryQueries(queryClient, sellerId);
    },
  });
}

export function useRestockProduct(sellerId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      productId,
      quantity,
      note,
    }: {
      productId: string;
      quantity: number;
      note?: string | null;
    }) => restockProduct(productId, quantity, note),
    onSuccess: (product, { productId }) => {
      invalidateInventoryQueries(queryClient, sellerId, productId ?? product.id);
    },
  });
}

export function useAdjustStock(sellerId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      productId,
      quantity,
      type,
      note,
    }: {
      productId: string;
      quantity: number;
      type: Extract<StockMovementType, "adjustment" | "damage" | "sale">;
      note?: string | null;
    }) => adjustStock(productId, quantity, type, note),
    onSuccess: (product, { productId }) => {
      invalidateInventoryQueries(queryClient, sellerId, productId ?? product.id);
    },
  });
}
