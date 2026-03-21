/**
 * Raw Supabase fetch functions — no hooks, just async data access.
 * All functions throw on error so TanStack Query can retry.
 * Import types from here or from the generated database.ts when available.
 */
import { supabase } from "./supabase";
import {
  startOfDay,
  subDays,
  subMonths,
  parseISO,
} from "date-fns";

// ── Shared types ───────────────────────────────────────────────────────────────

export type OrderStatus = "pending" | "in_transit" | "delivered" | "failed";

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
  city: string | null;
}

export interface Order {
  id: string;
  seller_id: string;
  rider_id: string | null;
  customer_id: string | null;
  item: string;
  customer_name: string | null;
  customer_phone: string | null;
  customer_address: string | null;
  customer_area: string | null;
  status: OrderStatus;
  delivery_fee: string | null;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  business_name: string | null;
  phone: string | null;
  city: string | null;
  brand_name: string | null;
  logo_url: string | null;
  secondary_phone: string | null;
  pickup_address: string | null;
  instagram_handle: string | null;
  tiktok_handle: string | null;
  onboarding_complete: boolean;
  created_at: string | null;
  updated_at: string | null;
}

// ── Profile ───────────────────────────────────────────────────────────────────

export async function fetchProfile(userId: string): Promise<Profile> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error || !data) throw new Error("Profile not found");
  return data as unknown as Profile;
}

// ── Orders ─────────────────────────────────────────────────────────────────────

export async function fetchOrders(sellerId: string): Promise<Order[]> {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("seller_id", sellerId)
    .order("created_at", { ascending: false });

  if (error) throw new Error("Failed to fetch orders");
  return (data ?? []) as Order[];
}

export async function fetchOrder(orderId: string): Promise<Order> {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .single();

  if (error || !data) throw new Error("Order not found");
  return data as unknown as Order;
}

// ── Riders ─────────────────────────────────────────────────────────────────────

export async function fetchRiders(sellerId: string): Promise<Rider[]> {
  const { data, error } = await supabase
    .from("riders")
    .select("*")
    .eq("seller_id", sellerId)
    .order("name");

  if (error) throw new Error("Failed to fetch riders");
  return (data ?? []) as Rider[];
}

export async function fetchRider(riderId: string): Promise<Rider> {
  const { data, error } = await supabase
    .from("riders")
    .select("*")
    .eq("id", riderId)
    .single();

  if (error || !data) throw new Error("Rider not found");
  return data as unknown as Rider;
}

// ── Customers ─────────────────────────────────────────────────────────────────

export async function fetchCustomers(sellerId: string): Promise<Customer[]> {
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .eq("seller_id", sellerId)
    .order("name");

  if (error) throw new Error("Failed to fetch customers");
  return (data ?? []) as Customer[];
}

// ── Analytics ─────────────────────────────────────────────────────────────────

export async function fetchAnalytics(
  sellerId: string,
  period: string,
): Promise<{
  total: number;
  delivered: number;
  failed: number;
  in_transit: number;
  pending: number;
}> {
  const now = new Date();
  let fromDate: Date;

  switch (period) {
    case "today":
      fromDate = startOfDay(now);
      break;
    case "week":
      fromDate = subDays(now, 7);
      break;
    case "month":
      fromDate = subMonths(now, 1);
      break;
    default:
      fromDate = new Date(0);
  }

  const { data, error } = await supabase
    .from("orders")
    .select("status")
    .eq("seller_id", sellerId)
    .gte("created_at", fromDate.toISOString());

  if (error) throw new Error("Failed to fetch analytics");

  const orders = data ?? [];
  return {
    total: orders.length,
    delivered: orders.filter((o) => o.status === "delivered").length,
    failed: orders.filter((o) => o.status === "failed").length,
    in_transit: orders.filter((o) => o.status === "in_transit").length,
    pending: orders.filter((o) => o.status === "pending").length,
  };
}
