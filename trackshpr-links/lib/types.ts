export type OrderStatus =
  | "pending"
  | "picked_up"
  | "in_transit"
  | "delivered"
  | "failed";

export interface ContactNumber {
  number: string;
  label: string;
  is_whatsapp: boolean;
  is_primary: boolean;
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

export interface OrderEvent {
  id: string;
  order_id: string;
  status: OrderStatus;
  note: string | null;
  created_at: string | null;
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

export interface RiderActionPayload {
  action: "pickup" | "deliver" | "fail";
  token: string;
  note?: string;
  latitude?: number | null;
  longitude?: number | null;
}

export interface ReportOption {
  label: string;
  subtitle: string;
}
