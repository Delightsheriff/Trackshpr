/**
 * Optimistic UI store for riders, customers, and orders.
 * Use TanStack Query hooks for server data — these actions
 * handle optimistic updates locally.
 */
import { create } from "zustand";

export interface Rider {
  id: string;
  seller_id: string;
  name: string;
  phone: string;
  notes: string | null;
  total_deliveries: number;
  created_at: string;
}

export interface Customer {
  id: string;
  user_id: string;
  name: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  created_at: string;
  updated_at: string;
}

interface DataState {
  riders: Rider[];
  customers: Customer[];
  addRider: (data: Pick<Rider, "name" | "phone">) => void;
  deleteRider: (id: string) => void;
  addCustomer: (data: Pick<Customer, "name" | "phone" | "address" | "city">) => void;
  deleteCustomer: (id: string) => void;
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
          user_id: "",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ],
    })),

  deleteCustomer: (id) =>
    set((s) => ({ customers: s.customers.filter((c) => c.id !== id) })),
}));
