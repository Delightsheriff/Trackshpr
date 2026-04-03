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

export type OrderStatus = "pending" | "in_transit" | "delivered" | "failed";

/**
 * A single seller contact number stored in profiles.contact_numbers (jsonb).
 * `number` is always E.164 (e.g. "+2348012345678").
 * Exactly one entry must have is_primary: true — enforced by DB check constraint.
 */
export interface ContactNumber {
  number: string;
  label: string;
  is_whatsapp: boolean;
  is_primary: boolean;
}

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
  contact_numbers: ContactNumber[] | null;
  order_count: number;
  push_token: string | null;
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
  name: string;
  phone: string;
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
  // Denormalised default address (from customers_with_stats view)
  address: string | null;
  city: string | null;
  // Server-side aggregated counts (from customers_with_stats view)
  order_count: number;
  failed_count: number;
}

export interface CustomerAddress {
  id: string;
  customer_id: string;
  seller_id: string;
  address: string;
  city: string | null;
  label: string | null;
  is_default: boolean;
  created_at: string | null;
}

export interface Order {
  id: string;
  seller_id: string;
  item_description: string;
  notes: string | null;
  status: string | null;
  customer_name: string;
  customer_phone: string;
  customer_token: string;
  delivery_address: string;
  rider_id: string | null;
  rider_token: string;
  seller_photo_url: string | null;
  proof_photo_url: string | null;
  delivered_at: string | null;
  nudge_sent: boolean | null;
  created_at: string | null;
  updated_at: string | null;
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

export async function fetchOrders(userId: string): Promise<Order[]> {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("seller_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw new Error("Failed to fetch orders");
  return (data ?? []) as Order[];
}

export async function insertOrder(payload: {
  seller_id: string;
  item_description: string;
  notes?: string | null;
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  rider_id?: string | null;
}): Promise<Order> {
  const { data, error } = await supabase
    .from("orders")
    .insert(payload)
    .select()
    .single();

  if (error || !data) throw new Error(error?.message ?? "Failed to create order");

  // TODO(Termii): send delivery notification to seller's primary contact number.
  // When wiring this up, fetch the seller's profile and read:
  //   profile.contact_numbers.find(n => n.is_primary)?.number
  // Use that E.164 number as the Termii recipient. Do not hardcode phone from
  // the order — the seller may have changed their primary number since the order
  // was created. Only use is_primary: true from profiles.contact_numbers.

  return data as Order;
}

export async function fetchActiveOrders(userId: string): Promise<Order[]> {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("seller_id", userId)
    .in("status", ["pending", "in_transit"])
    .order("created_at", { ascending: false });

  if (error) throw new Error("Failed to fetch active orders");
  return (data ?? []) as Order[];
}

export interface TodayStats {
  total: number;
  delivered: number;
  inTransit: number;
  failed: number;
}

export async function fetchTodayStats(userId: string): Promise<TodayStats> {
  const { data, error } = await supabase
    .from("orders")
    .select("status")
    .eq("seller_id", userId)
    .gte("created_at", startOfDay(new Date()).toISOString());

  if (error) throw new Error("Failed to fetch today's stats");
  const rows = data ?? [];
  return {
    total: rows.length,
    delivered: rows.filter((o) => o.status === "delivered").length,
    inTransit: rows.filter((o) => o.status === "in_transit").length,
    failed: rows.filter((o) => o.status === "failed").length,
  };
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

// ── Customers ─────────────────────────────────────────────────────────────────

/** List all customers with server-side order_count / failed_count via the
 *  customers_with_stats view (security_invoker = true → RLS applies). */
export async function fetchCustomers(sellerId: string): Promise<Customer[]> {
  const { data, error } = await supabase
    .from("customers_with_stats")
    .select("*")
    .eq("seller_id", sellerId)
    .order("name");

  if (error) throw new Error("Failed to fetch customers");
  return (data ?? []) as Customer[];
}

export async function fetchCustomer(customerId: string): Promise<Customer> {
  const { data, error } = await supabase
    .from("customers_with_stats")
    .select("*")
    .eq("id", customerId)
    .single();

  if (error || !data) throw new Error("Customer not found");
  return data as Customer;
}

/** Insert customer + first address in a single logical operation. */
export async function insertCustomer(payload: {
  seller_id: string;
  name: string;
  phone: string;
  notes?: string | null;
  address: string;
  city?: string | null;
  address_label?: string | null;
}): Promise<Customer> {
  const { seller_id, name, phone, notes, address, city, address_label } = payload;

  // 1. Insert the customer record
  const { data: customer, error: cErr } = await supabase
    .from("customers")
    .insert({ seller_id, name, phone, notes: notes ?? null })
    .select()
    .single();

  if (cErr || !customer) throw new Error(cErr?.message ?? "Failed to save customer");

  // 2. Insert the first (default) address
  const { error: aErr } = await supabase
    .from("customer_addresses")
    .insert({
      customer_id: customer.id,
      seller_id,
      address,
      city: city ?? null,
      label: address_label ?? null,
      is_default: true,
    });

  if (aErr) throw new Error(aErr.message ?? "Failed to save customer address");

  // 3. Return full record with stats via view
  return fetchCustomer(customer.id);
}

export async function updateCustomer(
  customerId: string,
  payload: { name: string; phone: string; notes?: string | null },
): Promise<Customer> {
  const { error } = await supabase
    .from("customers")
    .update(payload)
    .eq("id", customerId);

  if (error) throw new Error("Failed to update customer");
  return fetchCustomer(customerId);
}

export async function deleteCustomer(customerId: string): Promise<void> {
  const { error } = await supabase
    .from("customers")
    .delete()
    .eq("id", customerId);

  if (error) throw new Error("Failed to delete customer");
}

// ── Customer addresses ────────────────────────────────────────────────────────

export async function fetchCustomerAddresses(
  customerId: string,
): Promise<CustomerAddress[]> {
  const { data, error } = await supabase
    .from("customer_addresses")
    .select("*")
    .eq("customer_id", customerId)
    .order("is_default", { ascending: false });

  if (error) throw new Error("Failed to fetch addresses");
  return (data ?? []) as CustomerAddress[];
}

export async function insertCustomerAddress(payload: {
  customer_id: string;
  seller_id: string;
  address: string;
  city?: string | null;
  label?: string | null;
  is_default: boolean;
}): Promise<CustomerAddress> {
  const { data, error } = await supabase
    .from("customer_addresses")
    .insert(payload)
    .select()
    .single();

  if (error || !data) throw new Error(error?.message ?? "Failed to save address");
  return data as CustomerAddress;
}

export async function updateCustomerAddress(
  addressId: string,
  payload: { address?: string; city?: string | null; label?: string | null; is_default?: boolean },
): Promise<CustomerAddress> {
  const { data, error } = await supabase
    .from("customer_addresses")
    .update(payload)
    .eq("id", addressId)
    .select()
    .single();

  if (error || !data) throw new Error("Failed to update address");
  return data as CustomerAddress;
}

export async function deleteCustomerAddress(addressId: string): Promise<void> {
  const { error } = await supabase
    .from("customer_addresses")
    .delete()
    .eq("id", addressId);

  if (error) throw new Error("Failed to delete address");
}

/** Promote a different address to default before deleting the current default. */
export async function setDefaultAddress(addressId: string): Promise<void> {
  const { error } = await supabase
    .from("customer_addresses")
    .update({ is_default: true })
    .eq("id", addressId);

  if (error) throw new Error("Failed to set default address");
}

// ── Analytics ────────────────────────────────────────────────────────────────

export async function fetchAnalytics(
  userId: string,
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
    .eq("seller_id", userId)
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
