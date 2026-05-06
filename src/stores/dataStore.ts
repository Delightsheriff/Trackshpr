/**
 * Optimistic UI store for riders, customers, and orders.
 * Use TanStack Query hooks for server data — these actions
 * handle optimistic updates locally.
 */
import { create } from "zustand";
import type { Customer, Rider } from "@/src/lib/supabaseQueries";

interface DataState {
  riders: Rider[];
  customers: Customer[];
  addRider: (data: Pick<Rider, "name" | "phone">) => void;
  deleteRider: (id: string) => void;
  addCustomer: (data: Pick<Customer, "name" | "phone">) => void;
  deleteCustomer: (id: string) => void;
  reset: () => void;
}

export const useDataStore = create<DataState>((set) => ({
  riders: [],
  customers: [],

  addRider: (data) =>
    set((s) => ({
      riders: [
        ...s.riders,
        {
          ...data,
          id: crypto.randomUUID(),
          seller_id: "",
          notes: null,
          total_deliveries: 0,
          created_at: new Date().toISOString(),
        },
      ],
    })),

  deleteRider: (id) =>
    set((s) => ({ riders: s.riders.filter((r) => r.id !== id) })),

  addCustomer: (data) =>
    set((s) => ({
      customers: [
        ...s.customers,
        {
          ...data,
          id: crypto.randomUUID(),
          seller_id: "",
          phone: data.phone ?? null,
          notes: null,
          order_count: 0,
          failed_count: 0,
          address: null,
          city: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ],
    })),

  deleteCustomer: (id) =>
    set((s) => ({ customers: s.customers.filter((c) => c.id !== id) })),

  reset: () => set({ riders: [], customers: [] }),
}));
