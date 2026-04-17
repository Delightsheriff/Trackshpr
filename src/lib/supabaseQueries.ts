/**
 * Raw Supabase fetch functions — no hooks, just async data access.
 * All functions throw on error so TanStack Query can retry.
 * Types mirror the actual Supabase schema exactly.
 */
import { decode } from "base64-arraybuffer";
import * as FileSystem from "expo-file-system/legacy";
import * as ImageManipulator from "expo-image-manipulator";
import { supabase } from "./supabase";
import type { ProductUnit } from "./inventory";
import type { Database } from "@/src/types/database";
import {
  startOfDay,
} from "date-fns";
import { env } from "./env";
import {
  notifyOrderCreated,
  type OrderNotifyContext,
} from "./notifier";

// ── Types ───────────────────────────────────────────────────────────────────

export type OrderStatus =
  | "pending"
  | "picked_up"
  | "in_transit"
  | "delivered"
  | "failed";

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
  is_pro: boolean;
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
  order_number: number | null;
  item: string;
  notes: string | null;
  status: string | null;
  customer_id: string | null;
  customer_name: string;
  customer_phone: string;
  customer_token: string;
  delivery_address: string;
  city: string | null;
  delivery_fee: number | null;
  rider_id: string | null;
  rider_name: string | null;
  rider_phone: string | null;
  rider_token: string;
  direct_phone: string | null;
  photo_url: string | null;
  seller_photo_url: string | null;
  proof_photo_url: string | null;
  delivered_at: string | null;
  nudge_sent: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

export const ORDER_PAGE_SIZE = 20;

export interface OrderEvent {
  id: string;
  order_id: string;
  status: string;
  note: string | null;
  created_at: string;
}

export interface PublicTrackingProfile {
  id: string;
  business_name: string | null;
  brand_name: string | null;
  brand_color: string | null;
  logo_url: string | null;
  phone: string | null;
  contact_numbers: ContactNumber[] | null;
}

export interface PublicLocationPing {
  id: string;
  latitude: number;
  longitude: number;
  created_at: string | null;
}

export interface PublicTrackingOrder {
  id: string;
  seller_id: string;
  order_number: number | null;
  item: string;
  status: OrderStatus;
  customer_name: string | null;
  customer_phone: string | null;
  delivery_address: string | null;
  city: string | null;
  delivery_fee: number | null;
  rider_name: string | null;
  rider_phone: string | null;
  photo_url: string | null;
  created_at: string | null;
  delivered_at: string | null;
  profile: PublicTrackingProfile;
  events: OrderEvent[];
  latest_ping: PublicLocationPing | null;
}

type ProductRow = Database["public"]["Tables"]["products"]["Row"];
type ProductUpdate = Database["public"]["Tables"]["products"]["Update"];
type StockMovementRow = Database["public"]["Tables"]["stock_movements"]["Row"];
type OrderItemRow = Database["public"]["Tables"]["order_items"]["Row"];

export type StockMovementType = "restock" | "sale" | "adjustment" | "damage";

export interface Product {
  id: string;
  seller_id: string;
  name: string;
  description: string | null;
  price: number;
  photo_url: string | null;
  sku: string | null;
  unit: ProductUnit;
  quantity: number;
  low_stock_threshold: number;
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
}

export interface StockMovement {
  id: string;
  product_id: string;
  seller_id: string;
  type: StockMovementType;
  quantity: number;
  note: string | null;
  created_at: string | null;
}

export interface ProductDetail extends Product {
  recent_movements: StockMovement[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  created_at: string | null;
}

export interface FleetLocationPing {
  id: string;
  order_id: string;
  latitude: number;
  longitude: number;
  created_at: string | null;
}

export interface FleetMapOrder {
  id: string;
  order_number: number | null;
  item: string;
  customer_name: string;
  rider_name: string | null;
  status: Extract<OrderStatus, "pending" | "picked_up" | "in_transit">;
  latest_ping: FleetLocationPing | null;
}

export interface SelectedOrderItemInput {
  product_id: string;
  quantity: number;
  unit_price: number;
  name?: string | null;
}

export interface InsertOrderPayload {
  seller_id: string;
  item: string;
  notes?: string | null;
  customer_id?: string | null;
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  city?: string | null;
  delivery_fee?: number | null;
  rider_id?: string | null;
  rider_name?: string | null;
  rider_phone?: string | null;
  direct_phone?: string | null;
  photo_uri?: string | null;
  order_items?: SelectedOrderItemInput[];
}

function mapProduct(row: ProductRow): Product {
  return {
    ...row,
    price: Number(row.price),
    unit: row.unit as ProductUnit,
  };
}

function mapStockMovement(row: StockMovementRow): StockMovement {
  return {
    ...row,
    type: row.type as StockMovementType,
  };
}

function mapOrderItem(row: OrderItemRow): OrderItem {
  return {
    ...row,
    unit_price: Number(row.unit_price),
  };
}

function mapFleetLocationPing(row: Database["public"]["Tables"]["location_pings"]["Row"]): FleetLocationPing {
  return {
    ...row,
  };
}

export function getPrimaryContactNumber(profile: Pick<Profile, "phone" | "contact_numbers"> | PublicTrackingProfile | null): string | null {
  if (profile?.contact_numbers?.length) {
    const primary =
      profile.contact_numbers.find((entry) => entry.is_primary && entry.number) ??
      profile.contact_numbers.find((entry) => entry.number);
    if (primary?.number) {
      return primary.number;
    }
  }

  return profile?.phone ?? null;
}

function isUuid(value: string | null | undefined): value is string {
  return !!value &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export function buildPublicOrderLink(type: "rider" | "track", token: string) {
  return type === "rider"
    ? `${env.webUrl}/rider/${token}`
    : `${env.webUrl}/track/${token}`;
}

async function uploadOrderPhoto({
  userId,
  orderId,
  uri,
}: {
  userId: string;
  orderId: string;
  uri: string;
}): Promise<{ filePath: string; publicUrl: string }> {
  let compressedUri = uri;

  try {
    const compressed = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 1200 } }],
      {
        compress: 0.82,
        format: ImageManipulator.SaveFormat.JPEG,
      },
    );

    compressedUri = compressed.uri;
  } catch {
    // Compression is best-effort. We still attempt upload with the original file.
  }

  const base64 = await FileSystem.readAsStringAsync(compressedUri, {
    encoding: "base64",
  });

  const filePath = `${userId}/${orderId}.jpg`;
  const { error } = await supabase.storage
    .from("order-photos")
    .upload(filePath, decode(base64), {
      contentType: "image/jpeg",
      upsert: true,
    });

  if (error) {
    throw new Error("Couldn't upload the item photo. Try again.");
  }

  const { data } = supabase.storage.from("order-photos").getPublicUrl(filePath);
  return { filePath, publicUrl: data.publicUrl };
}

export async function fetchOrdersPage(params: {
  sellerId: string;
  status: string | null;
  search: string;
  cursor: number;
}): Promise<Order[]> {
  let q = supabase
    .from("orders")
    .select("*")
    .eq("seller_id", params.sellerId)
    .order("created_at", { ascending: false })
    .range(params.cursor, params.cursor + ORDER_PAGE_SIZE - 1);

  if (params.status) {
    q = q.eq("status", params.status);
  }
  if (params.search.trim()) {
    const s = params.search.trim();
    q = q.or(`item.ilike.%${s}%,customer_name.ilike.%${s}%,rider_name.ilike.%${s}%`);
  }

  const { data, error } = await q;
  if (error) throw new Error("Failed to fetch orders");
  return (data ?? []) as Order[];
}

export async function fetchOrderTimeline(orderId: string): Promise<OrderEvent[]> {
  const { data, error } = await supabase
    .from("order_status_events")
    .select("id, order_id, status, note, created_at")
    .eq("order_id", orderId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as OrderEvent[];
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

// â”€â”€ Inventory â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function fetchProducts(sellerId: string): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("seller_id", sellerId)
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) throw new Error("Failed to fetch inventory");
  return (data ?? []).map((row) => mapProduct(row as ProductRow));
}

export async function fetchProductById(productId: string): Promise<ProductDetail> {
  const { data: product, error: productError } = await supabase
    .from("products")
    .select("*")
    .eq("id", productId)
    .maybeSingle();

  if (productError || !product) {
    throw new Error("Product not found");
  }

  const { data: movements, error: movementError } = await supabase
    .from("stock_movements")
    .select("*")
    .eq("product_id", productId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (movementError) {
    throw new Error("Failed to fetch stock history");
  }

  return {
    ...mapProduct(product as ProductRow),
    recent_movements: (movements ?? []).map((row) =>
      mapStockMovement(row as StockMovementRow),
    ),
  };
}

export async function fetchLowStockProducts(sellerId: string): Promise<Product[]> {
  const { data, error } = await supabase
    .from("low_stock_products")
    .select("*")
    .eq("seller_id", sellerId)
    .order("quantity", { ascending: true })
    .order("name", { ascending: true });

  if (error) throw new Error("Failed to fetch low-stock products");
  return (data ?? []).map((row) => mapProduct(row as ProductRow));
}

export interface InsertProductPayload {
  seller_id: string;
  name: string;
  price: number;
  unit: ProductUnit;
  quantity?: number;
  low_stock_threshold?: number;
  description?: string | null;
  sku?: string | null;
  photo_url?: string | null;
}

export async function insertProduct(payload: InsertProductPayload): Promise<Product> {
  const { data, error } = await supabase.rpc("create_product_with_initial_stock", {
    p_seller_id: payload.seller_id,
    p_name: payload.name,
    p_price: payload.price,
    p_unit: payload.unit,
    p_quantity: payload.quantity ?? 0,
    p_low_stock_threshold: payload.low_stock_threshold ?? 5,
    p_description: payload.description ?? undefined,
    p_sku: payload.sku ?? undefined,
    p_photo_url: payload.photo_url ?? undefined,
  });

  if (error || !data) throw new Error(error?.message ?? "Failed to create product");
  return mapProduct(data as ProductRow);
}

export async function updateProduct(
  productId: string,
  payload: Pick<
    ProductUpdate,
    "name" | "description" | "price" | "photo_url" | "sku" | "unit" | "low_stock_threshold"
  >,
): Promise<Product> {
  const { data, error } = await supabase
    .from("products")
    .update(payload as ProductUpdate)
    .eq("id", productId)
    .select("*")
    .single();

  if (error || !data) throw new Error(error?.message ?? "Failed to update product");
  return mapProduct(data as ProductRow);
}

export async function deleteProduct(productId: string): Promise<void> {
  const { error } = await supabase
    .from("products")
    .update({ is_active: false })
    .eq("id", productId);

  if (error) throw new Error("Failed to archive product");
}

export async function restockProduct(
  productId: string,
  quantity: number,
  note?: string | null,
): Promise<Product> {
  const { data, error } = await supabase.rpc("restock_product_stock", {
    p_product_id: productId,
    p_quantity: quantity,
    p_note: note ?? undefined,
  });

  if (error || !data) throw new Error(error?.message ?? "Failed to restock product");
  return mapProduct(data as ProductRow);
}

export async function adjustStock(
  productId: string,
  quantity: number,
  type: Extract<StockMovementType, "adjustment" | "damage" | "sale">,
  note?: string | null,
): Promise<Product> {
  const { data, error } = await supabase.rpc("adjust_product_stock", {
    p_product_id: productId,
    p_quantity: quantity,
    p_type: type,
    p_note: note ?? undefined,
  });

  if (error || !data) throw new Error(error?.message ?? "Failed to adjust stock");
  return mapProduct(data as ProductRow);
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

export async function fetchFleetMapOrders(sellerId: string): Promise<FleetMapOrder[]> {
  const query = supabase
    .from("orders")
    .select(
      `
        id,
        order_number,
        item,
        customer_name,
        rider_name,
        status,
        location_pings(id, order_id, latitude, longitude, created_at)
      `,
    )
    .eq("seller_id", sellerId)
    .in("status", ["pending", "picked_up", "in_transit"])
    .order("created_at", { ascending: false })
    .order("created_at", {
      ascending: false,
      referencedTable: "location_pings",
    });

  const { data, error } = await query.limit(1, {
    referencedTable: "location_pings",
  });

  if (error) {
    throw new Error("Failed to fetch active deliveries for the fleet map");
  }

  return (data ?? []).map((row) => {
    const latestPing = Array.isArray(row.location_pings)
      ? row.location_pings[0]
      : null;

    return {
      id: row.id,
      order_number: row.order_number,
      item: row.item,
      customer_name: row.customer_name ?? "Customer",
      rider_name: row.rider_name,
      status: row.status as FleetMapOrder["status"],
      latest_ping: latestPing
        ? mapFleetLocationPing(
            latestPing as Database["public"]["Tables"]["location_pings"]["Row"],
          )
        : null,
    };
  });
}

export async function fetchOrderItems(orderId: string): Promise<OrderItem[]> {
  const { data, error } = await supabase
    .from("order_items")
    .select("*")
    .eq("order_id", orderId)
    .order("created_at", { ascending: true });

  if (error) throw new Error("Failed to fetch order items");
  return (data ?? []).map((row) => mapOrderItem(row as OrderItemRow));
}

export async function decrementDeliveredOrderStock(orderId: string): Promise<void> {
  const { error } = await supabase.rpc("apply_delivered_order_stock", {
    p_order_id: orderId,
  });

  if (error) {
    throw new Error(error.message ?? "Couldn't update stock for this order.");
  }
}

export async function insertOrder(payload: InsertOrderPayload): Promise<Order> {
  const {
    photo_uri,
    order_items,
    seller_id,
    customer_name,
    customer_phone,
    rider_phone,
    item,
    ...orderPayload
  } = payload;

  const normalizedItem = item.trim();
  if (!normalizedItem) {
    throw new Error("Add an item before creating this order.");
  }

  const insertPayload: Database["public"]["Tables"]["orders"]["Insert"] = {
    seller_id,
    item: normalizedItem,
    customer_name,
    customer_phone,
    rider_phone: rider_phone ?? null,
    ...orderPayload,
  };

  const { data, error } = await supabase
    .from("orders")
    .insert(insertPayload)
    .select()
    .single();

  if (error || !data) throw new Error(error?.message ?? "Failed to create order");

  const createdOrder = data as Order;

  if (!isUuid(createdOrder.rider_token) || !isUuid(createdOrder.customer_token)) {
    throw new Error("Order links were not generated correctly. Please try again.");
  }

  let uploadedPhotoPath: string | null = null;

  try {
    if (photo_uri) {
      const { publicUrl, filePath } = await uploadOrderPhoto({
        userId: seller_id,
        orderId: createdOrder.id,
        uri: photo_uri,
      });

      uploadedPhotoPath = filePath;

      const { data: updatedOrder, error: photoError } = await supabase
        .from("orders")
        .update({ photo_url: publicUrl })
        .eq("id", createdOrder.id)
        .select()
        .single();

      if (photoError || !updatedOrder) {
        throw new Error("Order photo upload finished, but we couldn't save it to the order.");
      }

      Object.assign(createdOrder, updatedOrder as Order);
    }

    if (order_items?.length) {
      const { error: orderItemsError } = await supabase.from("order_items").insert(
        order_items.map((orderItem) => ({
          order_id: createdOrder.id,
          product_id: orderItem.product_id,
          quantity: orderItem.quantity,
          unit_price: orderItem.unit_price,
        })),
      );

      if (orderItemsError) {
        throw new Error("Order created, but we couldn't save the selected products.");
      }
    }
  } catch (error) {
    if (uploadedPhotoPath) {
      await supabase.storage.from("order-photos").remove([uploadedPhotoPath]);
    }

    await supabase.from("orders").delete().eq("id", createdOrder.id);
    throw error;
  }

  const profile = await fetchProfile(seller_id);
  const sellerPrimaryPhone = getPrimaryContactNumber(profile);
  const sellerBrandName =
    profile?.brand_name?.trim() ||
    profile?.business_name?.trim() ||
    "Trackshpr seller";

  const notifyCtx: OrderNotifyContext = {
    sellerBrandName,
    sellerPhone: sellerPrimaryPhone,
    orderItem: createdOrder.item,
    orderNumber: createdOrder.order_number,
    customerName: createdOrder.customer_name ?? customer_name,
    customerPhone: createdOrder.customer_phone ?? customer_phone,
    riderName: createdOrder.rider_name,
    riderPhone: createdOrder.rider_phone ?? rider_phone ?? null,
    deliveryAddress: createdOrder.delivery_address,
    trackLink: buildPublicOrderLink("track", createdOrder.customer_token),
    riderLink: buildPublicOrderLink("rider", createdOrder.rider_token),
  };

  // Fire-and-forget: never block order creation on notification delivery.
  notifyOrderCreated(notifyCtx).catch((error) => {
    console.warn("[insertOrder] notifyOrderCreated failed", error);
  });

  return createdOrder;
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

export interface AnalyticsOverview {
  last_30_total: number;
  last_30_delivered: number;
  last_30_failed: number;
  success_rate: number;
  avg_delivery_minutes: number;
  month_total: number;
}

export interface AnalyticsDailyChartPoint {
  day: string;
  total: number;
  delivered: number;
}

export interface AnalyticsTopRider {
  rider_id: string;
  rider_name: string;
  delivered_count: number;
  success_rate: number;
}

type AnalyticsOverviewRow = {
  last_30_total: number | string | null;
  last_30_delivered: number | string | null;
  last_30_failed: number | string | null;
  success_rate: number | string | null;
  avg_delivery_minutes: number | string | null;
  month_total: number | string | null;
};

type AnalyticsDailyChartRow = {
  day: string;
  total: number | string | null;
  delivered: number | string | null;
};

type AnalyticsTopRiderRow = {
  rider_id: string;
  rider_name: string | null;
  delivered_count: number | string | null;
  success_rate: number | string | null;
};

const unsafeRpcClient = supabase as unknown as {
  rpc: (
    fn: string,
    args?: Record<string, unknown>,
  ) => Promise<{ data: unknown; error: { message?: string } | null }>;
};

function mapPublicTrackingOrder(data: unknown): PublicTrackingOrder {
  const record = (data ?? {}) as Record<string, unknown>;
  const rawProfile = (record.profile ?? {}) as Record<string, unknown>;
  const rawEvents = Array.isArray(record.events) ? record.events : [];
  const rawPing =
    record.latest_ping && typeof record.latest_ping === "object"
      ? (record.latest_ping as Record<string, unknown>)
      : null;

  return {
    id: String(record.id ?? ""),
    seller_id: String(record.seller_id ?? ""),
    order_number:
      record.order_number == null ? null : Number(record.order_number),
    item: String(record.item ?? ""),
    status: (record.status ?? "pending") as OrderStatus,
    customer_name:
      typeof record.customer_name === "string" ? record.customer_name : null,
    customer_phone:
      typeof record.customer_phone === "string" ? record.customer_phone : null,
    delivery_address:
      typeof record.delivery_address === "string"
        ? record.delivery_address
        : null,
    city: typeof record.city === "string" ? record.city : null,
    delivery_fee:
      record.delivery_fee == null ? null : Number(record.delivery_fee),
    rider_name: typeof record.rider_name === "string" ? record.rider_name : null,
    rider_phone:
      typeof record.rider_phone === "string" ? record.rider_phone : null,
    photo_url: typeof record.photo_url === "string" ? record.photo_url : null,
    created_at: typeof record.created_at === "string" ? record.created_at : null,
    delivered_at:
      typeof record.delivered_at === "string" ? record.delivered_at : null,
    profile: {
      id: String(rawProfile.id ?? ""),
      business_name:
        typeof rawProfile.business_name === "string"
          ? rawProfile.business_name
          : null,
      brand_name:
        typeof rawProfile.brand_name === "string" ? rawProfile.brand_name : null,
      brand_color:
        typeof rawProfile.brand_color === "string"
          ? rawProfile.brand_color
          : null,
      logo_url:
        typeof rawProfile.logo_url === "string" ? rawProfile.logo_url : null,
      phone: typeof rawProfile.phone === "string" ? rawProfile.phone : null,
      contact_numbers: Array.isArray(rawProfile.contact_numbers)
        ? (rawProfile.contact_numbers as ContactNumber[])
        : null,
    },
    events: rawEvents.map((event) => {
      const row = event as Record<string, unknown>;
      return {
        id: String(row.id ?? ""),
        order_id: String(record.id ?? ""),
        status: String(row.status ?? ""),
        note: typeof row.note === "string" ? row.note : null,
        created_at: String(row.created_at ?? ""),
      };
    }),
    latest_ping: rawPing
      ? {
          id: String(rawPing.id ?? ""),
          latitude: Number(rawPing.latitude ?? 0),
          longitude: Number(rawPing.longitude ?? 0),
          created_at:
            typeof rawPing.created_at === "string" ? rawPing.created_at : null,
        }
      : null,
  };
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

export async function fetchPublicRiderOrder(
  riderToken: string,
): Promise<PublicTrackingOrder | null> {
  const { data, error } = await unsafeRpcClient.rpc("get_rider_link_order", {
    p_rider_token: riderToken,
  });

  if (error) {
    throw new Error(error.message ?? "Couldn't load this rider link.");
  }

  if (!data) {
    return null;
  }

  return mapPublicTrackingOrder(data);
}

export async function fetchPublicCustomerOrder(
  customerToken: string,
): Promise<PublicTrackingOrder | null> {
  const { data, error } = await unsafeRpcClient.rpc(
    "get_customer_tracking_order",
    {
      p_customer_token: customerToken,
    },
  );

  if (error) {
    throw new Error(error.message ?? "Couldn't load this tracking page.");
  }

  if (!data) {
    return null;
  }

  return mapPublicTrackingOrder(data);
}

export async function markRiderOrderPickedUp(params: {
  riderToken: string;
  latitude?: number | null;
  longitude?: number | null;
}): Promise<PublicTrackingOrder> {
  const { data, error } = await unsafeRpcClient.rpc("rider_pickup_order", {
    p_rider_token: params.riderToken,
    p_latitude: params.latitude ?? null,
    p_longitude: params.longitude ?? null,
  });

  if (error || !data) {
    throw new Error(error?.message ?? "Couldn't update this delivery.");
  }

  return mapPublicTrackingOrder(data);
}

export async function markRiderOrderDelivered(params: {
  riderToken: string;
  latitude?: number | null;
  longitude?: number | null;
}): Promise<PublicTrackingOrder> {
  const { data, error } = await unsafeRpcClient.rpc("rider_complete_order", {
    p_rider_token: params.riderToken,
    p_latitude: params.latitude ?? null,
    p_longitude: params.longitude ?? null,
  });

  if (error || !data) {
    throw new Error(error?.message ?? "Couldn't complete this delivery.");
  }

  return mapPublicTrackingOrder(data);
}

export async function markRiderOrderFailed(params: {
  riderToken: string;
  note: string;
  latitude?: number | null;
  longitude?: number | null;
}): Promise<PublicTrackingOrder> {
  const { data, error } = await unsafeRpcClient.rpc("rider_fail_order", {
    p_rider_token: params.riderToken,
    p_note: params.note,
    p_latitude: params.latitude ?? null,
    p_longitude: params.longitude ?? null,
  });

  if (error || !data) {
    throw new Error(error?.message ?? "Couldn't report this delivery issue.");
  }

  return mapPublicTrackingOrder(data);
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

export async function fetchAnalyticsOverview(userId: string): Promise<AnalyticsOverview> {
  const { data, error } = await unsafeRpcClient.rpc("get_analytics_overview", {
    p_seller_id: userId,
  });

  if (error) {
    throw new Error(error.message ?? "Failed to fetch analytics overview");
  }

  const rows = Array.isArray(data) ? (data as AnalyticsOverviewRow[]) : [];
  const row = rows[0] ?? null;

  return {
    last_30_total: Number(row?.last_30_total ?? 0),
    last_30_delivered: Number(row?.last_30_delivered ?? 0),
    last_30_failed: Number(row?.last_30_failed ?? 0),
    success_rate: Number(row?.success_rate ?? 0),
    avg_delivery_minutes: Number(row?.avg_delivery_minutes ?? 0),
    month_total: Number(row?.month_total ?? 0),
  };
}

export async function fetchAnalyticsDailyChart(
  userId: string,
): Promise<AnalyticsDailyChartPoint[]> {
  const { data, error } = await unsafeRpcClient.rpc("get_analytics_daily_chart", {
    p_seller_id: userId,
  });

  if (error) {
    throw new Error(error.message ?? "Failed to fetch daily analytics chart");
  }

  const rows = Array.isArray(data) ? (data as AnalyticsDailyChartRow[]) : [];

  return rows.map((row) => ({
    day: String(row.day),
    total: Number(row.total ?? 0),
    delivered: Number(row.delivered ?? 0),
  }));
}

export async function fetchAnalyticsTopRiders(
  userId: string,
): Promise<AnalyticsTopRider[]> {
  const { data, error } = await unsafeRpcClient.rpc("get_analytics_top_riders", {
    p_seller_id: userId,
  });

  if (error) {
    throw new Error(error.message ?? "Failed to fetch top riders");
  }

  const rows = Array.isArray(data) ? (data as AnalyticsTopRiderRow[]) : [];

  return rows.map((row) => ({
    rider_id: String(row.rider_id),
    rider_name: row.rider_name ?? "Rider",
    delivered_count: Number(row.delivered_count ?? 0),
    success_rate: Number(row.success_rate ?? 0),
  }));
}
