/**
 * Raw Supabase fetch functions — no hooks, just async data access.
 * All functions throw on error so TanStack Query can retry.
 * Types mirror the actual Supabase schema exactly.
 */
import { supabase } from "./supabase";
import {
  startOfDay,
  subDays,
  subMonths,
} from "date-fns";

// ── Types ───────────────────────────────────────────────────────────────────

export type OrderStatus = "pending" | "picked_up" | "in_transit" | "delivered" | "failed";

export interface Profile {
  id: string;
  business_name: string | null;
  phone: string | null;
  city: string | null;
  description: string | null;
  logo_url: string | null;
  brand_name: string | null;
  brand_color: string | null;
  display_option: string | null;
  secondary_phone: string | null;
  pickup_address: string | null;
  instagram_handle: string | null;
  tiktok_handle: string | null;
  onboarding_complete: boolean;
  created_at: string;
  updated_at: string;
}

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

export interface Order {
  id: string;
  seller_id: string;
  rider_id: string | null;
  rider_token: string;
  customer_token: string;
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  item_description: string;
  notes: string | null;
  status: OrderStatus;
  seller_photo_url: string | null;
  proof_photo_url: string | null;
  nudge_sent: boolean;
  created_at: string;
  updated_at: string;
  delivered_at: string | null;
}

// ── Profile ─────────────────────────────────────────────────────────────────

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw new Error("Failed to fetch profile");
  return data as Profile | null;
}

// ── Orders ─────────────────────────────────────────────────────────────────

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

// ── Riders ─────────────────────────────────────────────────────────────────

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

export async function updateRider(
  riderId: string,
  payload: { name: string; phone: string; notes?: string | null },
): Promise<Rider> {
  const { data, error } = await supabase
    .from("riders")
    .update(payload)
    .eq("id", riderId)
    .select()
    .single();

  if (error || !data) throw new Error("Failed to update rider");
  return data as unknown as Rider;
}

export async function insertRider(payload: {
  seller_id: string;
  name: string;
  phone: string;
  notes?: string | null;
}): Promise<Rider> {
  const { data, error } = await supabase
    .from("riders")
    .insert(payload)
    .select()
    .single();

  if (error || !data) throw new Error("Failed to add rider");
  return data as unknown as Rider;
}

export async function deleteRider(riderId: string): Promise<void> {
  const { error } = await supabase.from("riders").delete().eq("id", riderId);
  if (error) throw new Error("Failed to delete rider");
}

// ── Customers (address_book) ───────────────────────────────────────────────

export async function fetchCustomers(sellerId: string): Promise<Customer[]> {
  const { data, error } = await supabase
    .from("address_book")
    .select("*")
    .eq("seller_id", sellerId)
    .order("customer_name");

  if (error) throw new Error("Failed to fetch customers");
  return (data ?? []) as Customer[];
}

// ── Analytics ────────────────────────────────────────────────────────────────

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
