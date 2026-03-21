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
  seller_id: string;
  label: string | null;
  customer_name: string;
  customer_phone: string;
  address: string;
  city: string | null;
  created_at: string;
}

export type OrderStatus = "pending" | "picked_up" | "in_transit" | "delivered" | "failed";

export interface Order {
  id: string;
  seller_id: string;
  rider_id: string | null;
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  item_description: string;
  status: OrderStatus;
  created_at: string;
}

interface DataState {
  riders: Rider[];
  customers: Customer[];
  orders: Order[];
  addRider: (data: Pick<Rider, "name" | "phone">) => void;
  deleteRider: (id: string) => void;
  addCustomer: (data: Pick<Customer, "customer_name" | "customer_phone" | "address" | "city">) => void;
  deleteCustomer: (id: string) => void;
  addOrder: (order: Omit<Order, "id" | "created_at">) => void;
}

export const useDataStore = create<DataState>((set) => ({
  riders: [],
  customers: [],
  orders: [],

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
          label: null,
          created_at: new Date().toISOString(),
        },
      ],
    })),

  deleteCustomer: (id) =>
    set((s) => ({ customers: s.customers.filter((c) => c.id !== id) })),

  addOrder: (order) =>
    set((s) => ({
      orders: [
        { ...order, id: crypto.randomUUID(), created_at: new Date().toISOString() },
        ...s.orders,
      ],
    })),
}));
