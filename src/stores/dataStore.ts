/**
 * Central data store — riders, customers, orders.
 * TODO: replace all dummy data and actions with Supabase queries.
 */
import { create } from "zustand";

export interface Rider {
  id: string;
  name: string;
  phone: string;
  delivered: number;
  failed: number;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  city?: string;
}

export interface Order {
  id: string;
  item: string;
  customer: string;
  area: string;
  status: "pending" | "in_transit" | "delivered" | "failed";
  time: string;
  riderId?: string;
  riderName?: string;
  deliveryFee?: string;
}

// TODO: replace with real Supabase query
const INITIAL_RIDERS: Rider[] = [
  { id: "1", name: "Kunle Adeyemi", phone: "0803 456 7890", delivered: 42, failed: 2 },
  { id: "2", name: "Emeka Musa",    phone: "0812 345 6789", delivered: 28, failed: 1 },
  { id: "3", name: "Taiwo James",   phone: "0701 234 5678", delivered: 15, failed: 3 },
];

// TODO: replace with real Supabase query
const INITIAL_CUSTOMERS: Customer[] = [
  { id: "1", name: "Amara Obi",    phone: "0801 234 5678", address: "14 Admiralty Way, Lekki",    city: "Lekki" },
  { id: "2", name: "Tunde Bello",  phone: "0809 876 5432", address: "22 Herbert Macaulay, Yaba",  city: "Yaba" },
  { id: "3", name: "Chisom Eze",   phone: "0812 111 2233", address: "5 Bode Thomas, Surulere",    city: "Surulere" },
  { id: "4", name: "Bisi Adeyemi", phone: "0705 432 1098", address: "10 Allen Ave, Ikeja",        city: "Ikeja" },
  { id: "5", name: "Ngozi Obi",    phone: "0705 111 9988", address: "8 Kofo Abayomi, VI",         city: "VI" },
];

// TODO: replace with real Supabase query
const INITIAL_ORDERS: Order[] = [
  { id: "1", item: "Adire Maxi Dress × 2", customer: "Amara Obi",    area: "Lekki Phase 1", status: "in_transit", time: "12m ago" },
  { id: "2", item: "Ankara Tote Bag",       customer: "Tunde Bello",  area: "Yaba",          status: "pending",    time: "34m ago" },
  { id: "3", item: "Beaded Necklace Set",   customer: "Chisom Eze",   area: "Surulere",      status: "delivered",  time: "1h ago" },
];

interface DataState {
  riders: Rider[];
  customers: Customer[];
  orders: Order[];
  // Riders
  addRider: (data: Pick<Rider, "name" | "phone">) => void;
  deleteRider: (id: string) => void;
  // Customers
  addCustomer: (data: Pick<Customer, "name" | "phone" | "address" | "city">) => void;
  deleteCustomer: (id: string) => void;
  // Orders
  addOrder: (order: Omit<Order, "id" | "time">) => void;
}

export const useDataStore = create<DataState>((set) => ({
  riders: INITIAL_RIDERS,
  customers: INITIAL_CUSTOMERS,
  orders: INITIAL_ORDERS,

  addRider: (data) =>
    set((s) => ({
      riders: [...s.riders, { ...data, id: Date.now().toString(), delivered: 0, failed: 0 }],
    })),

  deleteRider: (id) =>
    set((s) => ({ riders: s.riders.filter((r) => r.id !== id) })),

  addCustomer: (data) =>
    set((s) => ({
      customers: [...s.customers, { ...data, id: Date.now().toString() }],
    })),

  deleteCustomer: (id) =>
    set((s) => ({ customers: s.customers.filter((c) => c.id !== id) })),

  addOrder: (order) =>
    set((s) => ({
      orders: [{ ...order, id: Date.now().toString(), time: "just now" }, ...s.orders],
    })),
}));
